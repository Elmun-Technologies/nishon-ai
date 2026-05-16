'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { campaigns as campaignsApi, meta as metaApi } from '@/lib/api-client'

export type AdsManagerRow = {
  id: string
  /** Internal Adspectr campaign id when available; else Meta campaign id. */
  externalId: string | null
  name: string
  status: string
  /** USD spent on the active date range. */
  amountSpent: number
  /** Daily budget in USD (if known). */
  budget: number
  roas: number
  /** Cost per purchase (USD), null if no purchases yet. */
  costPerPurchase: number | null
  /** Daily spend for the active range, oldest → newest. */
  spendSeries: number[]
  /** Funnel stage derived from the campaign name. */
  funnelStage: 'prospecting' | 'reengagement' | 'retargeting' | 'retention' | 'other'
  /** Active optimization label (e.g. "AI Bidding", "Manual"). */
  optimization: string
  /** Meta ad sets count (campaigns scope) — for the ad-sets sub-view. */
  adSetCount: number
}

export type AdsManagerData = {
  /** True while either source request is in flight on first load. */
  loading: boolean
  rows: AdsManagerRow[]
  /** Total spend across all rows. */
  totalSpend: number
  /** Spend grouped by funnel stage (USD). */
  spendByFunnel: Record<AdsManagerRow['funnelStage'], number>
  /** True when no Meta account is linked to this workspace. */
  needsMetaConnect: boolean
  /** Filled when the request actually failed (auth issue, network…). */
  error: string | null
  refetch: () => void
}

function classifyFunnelStage(name: string): AdsManagerRow['funnelStage'] {
  const n = name.toLowerCase()
  if (/retain|retention|loyalty|repeat/.test(n)) return 'retention'
  if (/retarget|rtg|bof|warm/.test(n)) return 'retargeting'
  if (/re-?eng|reengage|abandon|cart|view/.test(n)) return 'reengagement'
  if (/prospect|cold|acquire|acquisition|tof|broad|interest/.test(n)) return 'prospecting'
  return 'other'
}

function pickDays(range: string): number {
  switch (range) {
    case 'today':
    case 'yesterday':
      return 1
    case 'last3':
      return 3
    case 'last14':
      return 14
    case 'last30':
      return 30
    case 'last7':
    default:
      return 7
  }
}

/**
 * Joins three data sources into a single row shape the Ads Manager table can
 * render directly:
 *
 * 1. `/campaigns/workspace/:id` — Adspectr DB campaigns (status, dailyBudget,
 *    externalId, adSets count, name).
 * 2. `/meta/dashboard` — Meta ad accounts and their campaigns + per-campaign
 *    aggregate metrics (spend, purchases, ROAS, ad set count).
 * 3. `/meta/reporting?days=N` — per-day spend, used for the sparkline column.
 *
 * Everything degrades cleanly: if Meta isn't connected we still show the
 * Adspectr-side campaigns; if Adspectr has nothing but Meta is connected we
 * show whatever Meta reports.
 */
export function useAdsManagerData(
  workspaceId: string | undefined,
  dateRange: string,
): AdsManagerData {
  const [loading, setLoading] = useState(true)
  const [adspectrCampaigns, setAdspectrCampaigns] = useState<any[]>([])
  const [metaPayload, setMetaPayload] = useState<any | null>(null)
  const [reporting, setReporting] = useState<any | null>(null)
  const [needsMetaConnect, setNeedsMetaConnect] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const days = pickDays(dateRange)

  const load = useCallback(async () => {
    if (!workspaceId) {
      setAdspectrCampaigns([])
      setMetaPayload(null)
      setReporting(null)
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)
    setNeedsMetaConnect(false)

    const adspectrPromise = campaignsApi
      .list(workspaceId)
      .then((r) => (Array.isArray(r.data) ? r.data : []))
      .catch(() => [] as any[])

    const metaPromise = metaApi
      .dashboard(workspaceId)
      .then((r) => r.data)
      .catch((err: any) => {
        // Most common cause is "no Meta account connected" — surface that
        // distinctly so the UI can show the right CTA.
        const code = err?.code ?? err?.response?.data?.code
        const msg = err?.response?.data?.message ?? err?.message ?? ''
        if (
          code === 'META_NOT_CONNECTED' ||
          /no.*meta|not connected/i.test(String(msg))
        ) {
          setNeedsMetaConnect(true)
        }
        return null
      })

    const reportingPromise = metaApi
      .reporting(workspaceId, days)
      .then((r) => r.data)
      .catch(() => null)

    try {
      const [adspectrRes, metaRes, reportRes] = await Promise.all([
        adspectrPromise,
        metaPromise,
        reportingPromise,
      ])
      setAdspectrCampaigns(adspectrRes)
      setMetaPayload(metaRes)
      setReporting(reportRes)
    } catch (e: any) {
      setError(e?.message ?? 'load_failed')
    } finally {
      setLoading(false)
    }
  }, [workspaceId, days])

  useEffect(() => {
    void load()
  }, [load])

  const rows = useMemo<AdsManagerRow[]>(() => {
    const map = new Map<string, AdsManagerRow>()

    // Pass 1 — seed every Adspectr campaign so users always see something
    // we have local control over (status, daily budget, ad set count).
    for (const c of adspectrCampaigns) {
      const externalId = c.externalId ?? null
      const key = externalId ?? c.id
      map.set(key, {
        id: c.id,
        externalId,
        name: c.name ?? 'Untitled campaign',
        status: c.status ?? 'DRAFT',
        amountSpent: 0,
        budget: Number(c.dailyBudget ?? c.totalBudget ?? 0),
        roas: 0,
        costPerPurchase: null,
        spendSeries: [],
        funnelStage: classifyFunnelStage(c.name ?? ''),
        optimization: c.aiConfig ? 'AI Bidding' : 'Manual',
        adSetCount: Array.isArray(c.adSets) ? c.adSets.length : 0,
      })
    }

    // Pass 2 — overlay Meta metrics for any campaign that exists on Meta.
    const accounts = Array.isArray(metaPayload?.accounts) ? metaPayload.accounts : []
    for (const account of accounts) {
      const accCampaigns = Array.isArray(account.campaigns) ? account.campaigns : []
      for (const mc of accCampaigns) {
        const metaId = String(mc.id ?? '')
        const existing = map.get(metaId)
        const metrics = mc.metrics ?? {}
        const spend = Number(metrics.spend ?? 0)
        const purchases = Number(metrics.purchases ?? metrics.conversions ?? 0)
        const revenue = Number(metrics.revenue ?? metrics.purchase_value ?? 0)
        const roas = spend > 0 ? Number((revenue / spend).toFixed(2)) : 0
        const cpp = purchases > 0 ? Number((spend / purchases).toFixed(2)) : null

        if (existing) {
          existing.amountSpent = spend
          existing.roas = roas
          existing.costPerPurchase = cpp
          existing.status = mc.status ?? existing.status
        } else {
          map.set(metaId, {
            id: metaId,
            externalId: metaId,
            name: String(mc.name ?? metaId),
            status: String(mc.status ?? 'UNKNOWN'),
            amountSpent: spend,
            budget: Number(mc.daily_budget ?? mc.dailyBudget ?? 0) / 100,
            roas,
            costPerPurchase: cpp,
            spendSeries: [],
            funnelStage: classifyFunnelStage(String(mc.name ?? '')),
            optimization: mc.bid_strategy ? String(mc.bid_strategy) : 'AI Bidding',
            adSetCount: Number(mc.ad_set_count ?? mc.adsets?.length ?? 0),
          })
        }
      }
    }

    // Pass 3 — attach the daily-spend series for sparkline.
    const byCampaign = reporting?.byCampaign ?? reporting?.campaigns ?? null
    if (Array.isArray(byCampaign)) {
      for (const entry of byCampaign) {
        const key = String(entry.campaignId ?? entry.id ?? '')
        if (!key) continue
        const row = map.get(key)
        if (!row) continue
        const series = Array.isArray(entry.daily)
          ? entry.daily.map((d: any) => Number(d.spend ?? 0))
          : Array.isArray(entry.spendSeries)
            ? entry.spendSeries.map((n: any) => Number(n))
            : []
        row.spendSeries = series
      }
    }

    return Array.from(map.values())
  }, [adspectrCampaigns, metaPayload, reporting])

  const totalSpend = useMemo(
    () => rows.reduce((sum, r) => sum + r.amountSpent, 0),
    [rows],
  )

  const spendByFunnel = useMemo(() => {
    const acc: Record<AdsManagerRow['funnelStage'], number> = {
      prospecting: 0,
      reengagement: 0,
      retargeting: 0,
      retention: 0,
      other: 0,
    }
    for (const r of rows) acc[r.funnelStage] += r.amountSpent
    return acc
  }, [rows])

  return {
    loading,
    rows,
    totalSpend,
    spendByFunnel,
    needsMetaConnect,
    error,
    refetch: load,
  }
}
