'use client'

import { useCallback, useEffect, useState } from 'react'
import { meta as metaApi, workspaces as workspacesApi } from '@/lib/api-client'

export type BudgetForecast = {
  spendToDate: number
  predictedTotal: number
  avgDailySpend: number
  daysElapsed: number
  daysTotal: number
  daily: Array<{ date: string; spend: number; isPredicted: boolean }>
}

export type BudgetData = {
  loading: boolean
  /** True when no Meta account is linked to this workspace. */
  needsMetaConnect: boolean
  /** Filled when the spend-forecast request actually fails (auth, network). */
  error: string | null
  forecast: BudgetForecast | null
  /** Aggregate workspace performance (active / total campaign counts, etc). */
  performance: {
    totalCampaigns?: number
    activeCampaigns?: number
    totalSpend?: number
    totalRevenue?: number
    averageRoas?: number
  } | null
  refetch: () => void
}

/**
 * Pulls everything the /budget page renders from real backend endpoints:
 *
 *  - `/meta/spend-forecast` for the daily-spend series, MTD total, and
 *    linear month-end projection.
 *  - `/workspaces/:id/performance` for campaign counts and aggregate ROAS.
 *
 * Surfaces `needsMetaConnect` distinctly from `error` so the UI can route
 * to the "Connect Meta" CTA instead of a generic failure.
 */
export function useBudgetData(workspaceId: string | undefined): BudgetData {
  const [loading, setLoading] = useState(true)
  const [forecast, setForecast] = useState<BudgetForecast | null>(null)
  const [performance, setPerformance] = useState<BudgetData['performance']>(null)
  const [needsMetaConnect, setNeedsMetaConnect] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!workspaceId) {
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)
    setNeedsMetaConnect(false)

    const forecastPromise = metaApi
      .spendForecast(workspaceId)
      .then((r) => r.data as BudgetForecast)
      .catch((err: any) => {
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

    const perfPromise = workspacesApi
      .performance(workspaceId)
      .then((r) => (r.data as any) ?? null)
      .catch(() => null)

    try {
      const [f, p] = await Promise.all([forecastPromise, perfPromise])
      setForecast(f)
      setPerformance(p)

      // Forecast with zero spend across the whole month usually means the
      // workspace has insights synced but no Meta account is producing
      // data. Treat that as needs-connect too so the UI shows a CTA.
      if (f && f.spendToDate === 0 && f.daysElapsed > 0) {
        setNeedsMetaConnect((prev) => prev || (p?.activeCampaigns ?? 0) === 0)
      }
    } catch (e: any) {
      setError(e?.message ?? 'budget_load_failed')
    } finally {
      setLoading(false)
    }
  }, [workspaceId])

  useEffect(() => {
    void load()
  }, [load])

  return { loading, needsMetaConnect, error, forecast, performance, refetch: load }
}
