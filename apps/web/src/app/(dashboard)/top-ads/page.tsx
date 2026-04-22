'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { ArrowDown, ArrowUp, ArrowUpDown, ExternalLink, RefreshCcw, Star } from 'lucide-react'
import { useWorkspaceStore } from '@/stores/workspace.store'
import { useI18n } from '@/i18n/use-i18n'
import { meta as metaApi } from '@/lib/api-client'
import { PageHeader } from '@/components/ui'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Alert } from '@/components/ui/Alert'
import { EmptyState } from '@/components/ui/EmptyState'
import { PageSpinner } from '@/components/ui/Spinner'
import { formatCurrency, formatNumber, cn } from '@/lib/utils'

export const dynamic = 'force-dynamic'

// ─── Types ─────────────────────────────────────────────────────────────────────

interface TopAd {
  campaignId: string
  name: string
  status: string
  spend: number
  clicks: number
  impressions: number
  ctr: number
}

type SortKey = 'spend' | 'clicks' | 'impressions' | 'ctr' | 'cpc'
type SortDir = 'asc' | 'desc'

// ─── Demo data ──────────────────────────────────────────────────────────────────

const DEMO_ADS: TopAd[] = [
  { campaignId: 'c1', name: 'Spring Sale — Carousel 🛍️', status: 'ACTIVE', spend: 3420, clicks: 18500, impressions: 412000, ctr: 4.49 },
  { campaignId: 'c2', name: 'Retargeting — Cart Abandoners', status: 'ACTIVE', spend: 2180, clicks: 9400, impressions: 185000, ctr: 5.08 },
  { campaignId: 'c3', name: 'Brand Video 30s — Awareness', status: 'ACTIVE', spend: 1950, clicks: 5200, impressions: 620000, ctr: 0.84 },
  { campaignId: 'c4', name: 'UGC Testimonial — Reels', status: 'ACTIVE', spend: 1740, clicks: 12800, impressions: 298000, ctr: 4.30 },
  { campaignId: 'c5', name: 'Lookalike 1% — Conversions', status: 'PAUSED', spend: 1520, clicks: 7600, impressions: 164000, ctr: 4.63 },
  { campaignId: 'c6', name: 'Dynamic Product Ads', status: 'ACTIVE', spend: 1380, clicks: 9100, impressions: 227000, ctr: 4.01 },
  { campaignId: 'c7', name: 'Lead Form — Free Consultation', status: 'ACTIVE', spend: 1050, clicks: 4300, impressions: 98000, ctr: 4.39 },
  { campaignId: 'c8', name: 'Prospecting — Interest Stack', status: 'ACTIVE', spend: 890, clicks: 3800, impressions: 142000, ctr: 2.68 },
  { campaignId: 'c9', name: 'Cold — Broad Match Test', status: 'PAUSED', spend: 740, clicks: 2200, impressions: 89000, ctr: 2.47 },
  { campaignId: 'c10', name: 'eRFM Gold — Upsell', status: 'ACTIVE', spend: 680, clicks: 5600, impressions: 112000, ctr: 5.0 },
]

const LIMIT_OPTIONS = [10, 25, 50]

const STATUS_STYLE: Record<string, string> = {
  ACTIVE: 'text-emerald-400 bg-emerald-400/10',
  PAUSED: 'text-amber-400 bg-amber-400/10',
  DELETED: 'text-red-400 bg-red-400/10',
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

function calcCpc(ad: TopAd) {
  return ad.clicks > 0 ? ad.spend / ad.clicks : 0
}

function SortIcon({ col, sortKey, sortDir }: { col: SortKey; sortKey: SortKey; sortDir: SortDir }) {
  if (col !== sortKey) return <ArrowUpDown size={13} className="opacity-30" />
  return sortDir === 'desc' ? <ArrowDown size={13} className="text-primary" /> : <ArrowUp size={13} className="text-primary" />
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function TopAdsPage() {
  const { t } = useI18n()
  const { currentWorkspace } = useWorkspaceStore()

  const [ads, setAds] = useState<TopAd[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [isDemo, setIsDemo] = useState(false)
  const [limit, setLimit] = useState(10)
  const [sortKey, setSortKey] = useState<SortKey>('spend')
  const [sortDir, setSortDir] = useState<SortDir>('desc')
  const [search, setSearch] = useState('')

  const fetchAds = useCallback(async () => {
    if (!currentWorkspace?.id) return
    setLoading(true)
    setError('')
    try {
      const res = await metaApi.topAds(currentWorkspace.id, limit)
      const data = (res.data as TopAd[]) ?? []
      if (data.length === 0) {
        setAds(DEMO_ADS.slice(0, limit))
        setIsDemo(true)
      } else {
        setAds(data)
        setIsDemo(false)
      }
    } catch {
      setAds(DEMO_ADS.slice(0, limit))
      setIsDemo(true)
    } finally {
      setLoading(false)
    }
  }, [currentWorkspace?.id, limit])

  useEffect(() => { fetchAds() }, [fetchAds])

  function handleSort(key: SortKey) {
    if (key === sortKey) {
      setSortDir((d) => (d === 'desc' ? 'asc' : 'desc'))
    } else {
      setSortKey(key)
      setSortDir('desc')
    }
  }

  const sorted = useMemo(() => {
    const rows = ads.filter((a) =>
      !search || a.name.toLowerCase().includes(search.toLowerCase()),
    )
    return [...rows].sort((a, b) => {
      const va = sortKey === 'cpc' ? calcCpc(a) : (a[sortKey] as number)
      const vb = sortKey === 'cpc' ? calcCpc(b) : (b[sortKey] as number)
      return sortDir === 'desc' ? vb - va : va - vb
    })
  }, [ads, search, sortKey, sortDir])

  const totalSpend = ads.reduce((s, a) => s + a.spend, 0)
  const totalClicks = ads.reduce((s, a) => s + a.clicks, 0)
  const totalImpressions = ads.reduce((s, a) => s + a.impressions, 0)
  const avgCtr = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0

  const COLS: Array<{ key: SortKey; label: string }> = [
    { key: 'spend', label: t('topAds.colSpend', 'Spend') },
    { key: 'clicks', label: t('topAds.colClicks', 'Clicks') },
    { key: 'impressions', label: t('topAds.colImpressions', 'Impressions') },
    { key: 'ctr', label: 'CTR' },
    { key: 'cpc', label: 'CPC' },
  ]

  if (loading) return <PageSpinner />

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('topAds.title', 'Top Ads')}
        subtitle={t('topAds.subtitle', 'Best performing ads ranked by spend and engagement')}
      />

      {isDemo && (
        <Alert variant="info">
          {t('topAds.demoNotice', 'Showing demo data. Connect your Meta account to see real top ads.')}
        </Alert>
      )}

      {error && <Alert variant="error">{error}</Alert>}

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: t('topAds.totalSpend', 'Total Spend'), value: formatCurrency(totalSpend) },
          { label: t('topAds.totalClicks', 'Total Clicks'), value: formatNumber(totalClicks) },
          { label: t('topAds.totalImpressions', 'Impressions'), value: formatNumber(totalImpressions) },
          { label: t('topAds.avgCtr', 'Avg CTR'), value: `${avgCtr.toFixed(2)}%` },
        ].map((s) => (
          <Card key={s.label} className="p-4">
            <p className="text-xs text-text-tertiary">{s.label}</p>
            <p className="mt-1 text-lg font-semibold text-text-primary tabular-nums">{s.value}</p>
          </Card>
        ))}
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <input
          type="text"
          placeholder={t('topAds.searchPlaceholder', 'Search ad name…')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-9 w-full max-w-xs rounded-lg border border-white/10 bg-surface-2 px-3 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-1 focus:ring-primary"
        />
        <div className="flex items-center gap-2">
          <span className="text-xs text-text-tertiary">{t('topAds.show', 'Show:')}</span>
          {LIMIT_OPTIONS.map((n) => (
            <button
              key={n}
              onClick={() => setLimit(n)}
              className={cn(
                'rounded-md px-2.5 py-1 text-xs font-medium transition',
                limit === n
                  ? 'bg-primary/15 text-primary'
                  : 'text-text-secondary hover:bg-white/[0.06] hover:text-text-primary',
              )}
            >
              {n}
            </button>
          ))}
          <Button variant="ghost" size="sm" onClick={fetchAds} className="ml-1">
            <RefreshCcw size={14} />
          </Button>
        </div>
      </div>

      {/* Table */}
      <Card className="overflow-hidden p-0">
        {sorted.length === 0 ? (
          <EmptyState
            icon={<Star size={32} className="text-text-tertiary" />}
            title={t('topAds.emptyTitle', 'No ads found')}
            description={t('topAds.emptyDesc', 'Try adjusting your search or connect a Meta ad account.')}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="border-b border-white/[0.06]">
                  <th className="px-4 py-3 text-left text-xs font-medium text-text-tertiary">#</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-text-tertiary">
                    {t('topAds.colName', 'Ad name')}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-text-tertiary">
                    {t('topAds.colStatus', 'Status')}
                  </th>
                  {COLS.map((col) => (
                    <th
                      key={col.key}
                      className="cursor-pointer px-4 py-3 text-right text-xs font-medium text-text-tertiary hover:text-text-primary"
                      onClick={() => handleSort(col.key)}
                    >
                      <span className="inline-flex items-center justify-end gap-1">
                        {col.label}
                        <SortIcon col={col.key} sortKey={sortKey} sortDir={sortDir} />
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sorted.map((ad, i) => {
                  const cpc = calcCpc(ad)
                  const isTop = i === 0
                  return (
                    <tr
                      key={ad.campaignId}
                      className={cn(
                        'border-b border-white/[0.04] transition hover:bg-white/[0.03]',
                        isTop && 'bg-primary/[0.04]',
                      )}
                    >
                      <td className="px-4 py-3 text-xs text-text-tertiary tabular-nums">
                        {isTop ? (
                          <Star size={14} className="text-amber-400" fill="currentColor" />
                        ) : (
                          i + 1
                        )}
                      </td>
                      <td className="max-w-[240px] px-4 py-3">
                        <p className="truncate font-medium text-text-primary">{ad.name}</p>
                        <p className="truncate text-[11px] text-text-tertiary">{ad.campaignId}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={cn(
                            'inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium',
                            STATUS_STYLE[ad.status] ?? 'text-text-tertiary bg-surface-2',
                          )}
                        >
                          {ad.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-text-primary tabular-nums">
                        {formatCurrency(ad.spend)}
                      </td>
                      <td className="px-4 py-3 text-right text-text-secondary tabular-nums">
                        {formatNumber(ad.clicks)}
                      </td>
                      <td className="px-4 py-3 text-right text-text-secondary tabular-nums">
                        {formatNumber(ad.impressions)}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums">
                        <span
                          className={cn(
                            'font-medium',
                            ad.ctr >= 3
                              ? 'text-emerald-400'
                              : ad.ctr >= 1.5
                                ? 'text-text-primary'
                                : 'text-text-secondary',
                          )}
                        >
                          {ad.ctr.toFixed(2)}%
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right text-text-secondary tabular-nums">
                        {cpc > 0 ? `$${cpc.toFixed(2)}` : '—'}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <p className="text-center text-xs text-text-tertiary">
        {t('topAds.footerNote', 'Data sourced from connected Meta Ad accounts via the Meta Marketing API.')}{' '}
        <a href="/reporting" className="inline-flex items-center gap-0.5 text-primary hover:underline">
          {t('topAds.fullReport', 'Full report')}
          <ExternalLink size={11} />
        </a>
      </p>
    </div>
  )
}
