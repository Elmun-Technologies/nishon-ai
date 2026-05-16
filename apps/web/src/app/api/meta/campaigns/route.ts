import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const runtime = 'nodejs'

/**
 * GET /api/meta/campaigns?workspaceId=<id>&days=<n>
 *
 * Returns campaigns with aggregated metrics for the selected period.
 * Shape mirrors what metaApi.reporting() returns from the NestJS backend.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const workspaceId = searchParams.get('workspaceId')
  const days        = Math.min(parseInt(searchParams.get('days') ?? '7', 10) || 7, 90)

  if (!workspaceId) {
    return NextResponse.json({ error: 'workspaceId is required' }, { status: 400 })
  }

  try {
    const since = new Date()
    since.setDate(since.getDate() - days)
    since.setHours(0, 0, 0, 0)

    // Aggregate insights per campaign for the period
    const insightTotals = await prisma.insightDaily.groupBy({
      by:    ['campaignId'],
      where: { workspaceId, date: { gte: since } },
      _sum:  { spend: true, clicks: true, impressions: true },
    })

    const metricByCampaign: Record<string, { spend: number; clicks: number; impressions: number; ctr: number; cpc: number }> = {}
    for (const row of insightTotals) {
      const spend       = row._sum.spend       ?? 0
      const clicks      = row._sum.clicks      ?? 0
      const impressions = row._sum.impressions ?? 0
      metricByCampaign[row.campaignId] = {
        spend,
        clicks,
        impressions,
        ctr: impressions > 0 ? Math.round((clicks / impressions) * 10000) / 100 : 0,
        cpc: clicks > 0 ? Math.round((spend / clicks) * 100) / 100 : 0,
      }
    }

    // Load all campaigns (only those with insight data for the period, or all if requested)
    const campaignIds = Object.keys(metricByCampaign)
    const campaigns = campaignIds.length
      ? await prisma.campaign.findMany({
          where:   { workspaceId, id: { in: campaignIds } },
          include: { adAccount: { select: { id: true, name: true, currency: true, timezone: true } } },
          orderBy: { name: 'asc' },
        })
      : []

    // Group by ad account (matches backend reporting shape)
    const accountMap: Record<string, {
      id: string; name: string; currency: string; timezone?: string | null;
      campaigns: unknown[]
    }> = {}

    for (const c of campaigns) {
      const acc = c.adAccount
      if (!accountMap[acc.id]) {
        accountMap[acc.id] = { id: acc.id, name: acc.name, currency: acc.currency, timezone: acc.timezone, campaigns: [] }
      }
      accountMap[acc.id].campaigns.push({
        id:        c.id,
        name:      c.name,
        status:    c.status,
        objective: c.objective,
        metrics:   metricByCampaign[c.id] ?? { spend: 0, clicks: 0, impressions: 0, ctr: 0, cpc: 0 },
      })
    }

    return NextResponse.json({
      workspaceId,
      days,
      accounts: Object.values(accountMap),
    })
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    )
  }
}
