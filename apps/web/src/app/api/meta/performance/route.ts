import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const runtime = 'nodejs'

/**
 * GET /api/meta/performance?workspaceId=<id>&days=<n>
 *
 * Returns aggregated KPI data + daily sparkline for the dashboard.
 * Shape must match the PerformanceSummary interface consumed by the dashboard.
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

    // ── Totals for selected period ────────────────────────────────────────────
    const [totals, campaignRows, accountCount] = await Promise.all([
      prisma.insightDaily.aggregate({
        where:   { workspaceId, date: { gte: since } },
        _sum:    { spend: true, clicks: true, impressions: true, purchases: true, revenue: true },
      }),
      // active campaign count
      prisma.campaign.findMany({
        where:  { workspaceId, status: { in: ['ACTIVE', 'active'] } },
        select: { id: true },
      }),
      // connected meta accounts
      prisma.adAccount.count({ where: { workspaceId, provider: 'meta' } }),
    ])

    const totalSpend       = totals._sum.spend       ?? 0
    const totalClicks      = totals._sum.clicks      ?? 0
    const totalImpressions = totals._sum.impressions ?? 0
    const totalPurchases   = totals._sum.purchases   ?? 0
    const totalRevenue     = totals._sum.revenue     ?? 0
    const activeCampaigns  = campaignRows.length
    const metaConnected    = accountCount > 0

    // ── ROAS (blended) ────────────────────────────────────────────────────────
    const overallRoas = totalSpend > 0 && totalRevenue > 0
      ? Math.round((totalRevenue / totalSpend) * 100) / 100
      : 0

    // ── Period-over-period change (prev equivalent period) ────────────────────
    const prevEnd   = new Date(since)
    const prevStart = new Date(since)
    prevStart.setDate(prevStart.getDate() - days)

    const prevTotals = await prisma.insightDaily.aggregate({
      where: { workspaceId, date: { gte: prevStart, lt: prevEnd } },
      _sum:  { spend: true, clicks: true, impressions: true },
    })

    const pctChange = (curr: number, prev: number): number | null => {
      if (!prev) return null
      return Math.round(((curr - prev) / prev) * 1000) / 10
    }

    const prevSpend = prevTotals._sum.spend ?? 0
    const prevClicks = prevTotals._sum.clicks ?? 0
    const prevImpr  = prevTotals._sum.impressions ?? 0

    // ── Daily sparkline ───────────────────────────────────────────────────────
    const rows = await prisma.insightDaily.groupBy({
      by:      ['date'],
      where:   { workspaceId, date: { gte: since } },
      _sum:    { spend: true, clicks: true },
      orderBy: { date: 'asc' },
    })

    const sparkline = rows.map((r) => ({
      day:    r.date.toISOString().slice(0, 10),
      spend:  r._sum.spend ?? 0,
      clicks: r._sum.clicks ?? 0,
    }))

    return NextResponse.json({
      totalSpend,
      totalRevenue,
      totalClicks,
      totalImpressions,
      totalConversions: totalPurchases,
      activeCampaigns,
      campaignCount:    activeCampaigns,
      overallRoas:      overallRoas || undefined,
      avgRoas:          overallRoas || undefined,
      metaConnected,
      changes: {
        spend:       pctChange(totalSpend, prevSpend),
        clicks:      pctChange(totalClicks, prevClicks),
        impressions: pctChange(totalImpressions, prevImpr),
      },
      sparkline,
    })
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    )
  }
}
