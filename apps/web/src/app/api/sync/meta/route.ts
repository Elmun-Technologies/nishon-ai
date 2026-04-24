import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { decryptToken } from '@/lib/token-crypto'

export const runtime = 'nodejs'

const GRAPH_API = 'https://graph.facebook.com/v19.0'
const SYNC_DAYS = 90

/** POST /api/sync/meta  body: { workspaceId: string } */
export async function POST(req: NextRequest) {
  let workspaceId: string
  try {
    const body = await req.json()
    workspaceId = body.workspaceId
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }
  if (!workspaceId) {
    return NextResponse.json({ error: 'workspaceId is required' }, { status: 400 })
  }

  try {
    const accounts = await prisma.adAccount.findMany({ where: { workspaceId, provider: 'meta' } })
    if (!accounts.length) {
      return NextResponse.json({ ok: true, message: 'No Meta ad accounts connected', synced: 0 })
    }

    let totalInsights = 0
    const errors: string[] = []

    for (const account of accounts) {
      try {
        const token = decryptToken(account.accessToken)
        const result = await syncAccount(account.id, account.externalId, workspaceId, token)
        totalInsights += result.insightRows
      } catch (err: unknown) {
        errors.push(`${account.externalId}: ${err instanceof Error ? err.message : String(err)}`)
      }
    }

    return NextResponse.json({ ok: true, insightRowsSynced: totalInsights, errors })
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    )
  }
}

// ─── Sync a single ad account ────────────────────────────────────────────────

async function syncAccount(
  adAccountId: string,
  externalAccountId: string,
  workspaceId: string,
  token: string,
): Promise<{ insightRows: number }> {
  // 1. Fetch campaigns
  const campsRes = await graphGet(
    `/${externalAccountId}/campaigns`,
    { fields: 'id,name,status,objective', limit: '500' },
    token,
  )
  const campaigns: Array<{ id: string; name: string; status: string; objective?: string }> =
    campsRes.data ?? []

  // 2. Upsert campaigns
  for (const c of campaigns) {
    await prisma.campaign.upsert({
      where: { id: c.id },
      update: { name: c.name, status: c.status, objective: c.objective ?? null },
      create: {
        id:          c.id,
        adAccountId,
        workspaceId,
        name:        c.name,
        status:      c.status,
        objective:   c.objective ?? null,
      },
    })
  }

  // 3. Fetch & upsert insights per campaign (last SYNC_DAYS days, daily)
  const since = new Date()
  since.setDate(since.getDate() - SYNC_DAYS)
  const sinceStr = since.toISOString().slice(0, 10)
  const untilStr = new Date().toISOString().slice(0, 10)

  let totalRows = 0
  for (const c of campaigns) {
    try {
      const rows = await fetchInsightsForCampaign(c.id, token, sinceStr, untilStr)
      for (const row of rows) {
        const date = new Date(row.date_start + 'T00:00:00Z')
        const spend       = parseFloat(row.spend ?? '0') || 0
        const clicks      = parseInt(row.clicks ?? '0', 10) || 0
        const impressions = parseInt(row.impressions ?? '0', 10) || 0
        const purchases   = countAction(row.actions, 'purchase')
        const revenue     = parseFloat(
          findActionValue(row.action_values, 'purchase') ?? '0',
        ) || 0

        await prisma.insightDaily.upsert({
          where:  { workspaceId_campaignId_date: { workspaceId, campaignId: c.id, date } },
          update: { spend, clicks, impressions, purchases, revenue },
          create: {
            workspaceId,
            adAccountId,
            campaignId: c.id,
            date,
            spend,
            clicks,
            impressions,
            purchases,
            revenue,
          },
        })
        totalRows++
      }
    } catch {
      // non-fatal — skip campaigns with no insights permission
    }
  }

  return { insightRows: totalRows }
}

// ─── Meta Graph API helpers ───────────────────────────────────────────────────

async function graphGet(
  path: string,
  params: Record<string, string>,
  token: string,
): Promise<any> {
  const url = new URL(`${GRAPH_API}${path}`)
  url.searchParams.set('access_token', token)
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v)
  const res = await fetch(url.toString())
  const json = await res.json()
  if (json.error) throw new Error(json.error.message)
  return json
}

async function fetchInsightsForCampaign(
  campaignId: string,
  token: string,
  since: string,
  until: string,
): Promise<any[]> {
  const params = {
    fields:         'spend,clicks,impressions,actions,action_values,date_start',
    time_increment: '1',
    level:          'campaign',
    time_range:     JSON.stringify({ since, until }),
    limit:          '500',
  }
  const res = await graphGet(`/${campaignId}/insights`, params, token)
  return res.data ?? []
}

function countAction(
  actions: Array<{ action_type: string; value: string }> | undefined,
  type: string,
): number {
  if (!actions) return 0
  const found = actions.find((a) => a.action_type === type)
  return found ? parseInt(found.value, 10) || 0 : 0
}

function findActionValue(
  actionValues: Array<{ action_type: string; value: string }> | undefined,
  type: string,
): string | undefined {
  if (!actionValues) return undefined
  return actionValues.find((a) => a.action_type === type)?.value
}
