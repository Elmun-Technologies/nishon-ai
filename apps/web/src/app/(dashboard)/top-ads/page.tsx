'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import {
  AlertCircle,
  Crown,
  Download,
  Film,
  Image as ImageIcon,
  LayoutGrid,
  Link2,
  List,
  Loader2,
  Plug,
  RefreshCcw,
  Search,
  Sparkles,
  TrendingUp,
} from 'lucide-react'
import { useWorkspaceStore } from '@/stores/workspace.store'
import { meta as metaApi } from '@/lib/api-client'
import { connectMeta } from '@/lib/meta'
import { Alert, Button, Card, PageHeader } from '@/components/ui'
import { Sparkline } from '@/components/ui/Sparkline'
import { cn } from '@/lib/utils'

export const dynamic = 'force-dynamic'

type TopAd = Awaited<ReturnType<typeof metaApi.topAds>>['data'][number]
type SortKey = 'ctr' | 'spend' | 'clicks' | 'impressions' | 'conversions' | 'roas'
type StatusFilter = 'ALL' | 'ACTIVE' | 'PAUSED'
type ViewMode = 'grid' | 'table'

const SORT_LABELS: Record<SortKey, string> = {
  ctr: 'CTR',
  spend: 'Sarf',
  clicks: 'Bosishlar',
  impressions: "Ko'rishlar",
  conversions: 'Konversiyalar',
  roas: 'ROAS',
}

const PRESETS = [7, 14, 30, 60, 90]

function fmtUsd(n: number): string {
  if (!isFinite(n) || n === 0) return '$0'
  return `$${n.toLocaleString('en-US', { maximumFractionDigits: 0 })}`
}

function fmtNumber(n: number): string {
  if (!isFinite(n)) return '—'
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return String(Math.round(n))
}

function fmtPct(n: number): string {
  if (!isFinite(n) || n === 0) return '—'
  return `${n.toFixed(2)}%`
}

function ctrTone(ctr: number): string {
  if (ctr >= 4) return 'text-emerald-600 dark:text-emerald-400'
  if (ctr >= 2) return 'text-emerald-700/80 dark:text-emerald-300/90'
  if (ctr < 1 && ctr > 0) return 'text-rose-500 dark:text-rose-400'
  return 'text-text-secondary'
}

function roasTone(roas: number): string {
  if (roas >= 3) return 'text-emerald-600 dark:text-emerald-400'
  if (roas >= 1) return 'text-text-primary'
  if (roas > 0) return 'text-rose-500 dark:text-rose-400'
  return 'text-text-tertiary'
}

function FormatBadge({ format }: { format: TopAd['format'] }) {
  if (format === 'video') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-fuchsia-500/15 px-2 py-0.5 text-[10px] font-medium text-fuchsia-700 dark:text-fuchsia-300">
        <Film className="h-3 w-3" />
        Video
      </span>
    )
  }
  if (format === 'carousel') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-sky-500/15 px-2 py-0.5 text-[10px] font-medium text-sky-700 dark:text-sky-300">
        <LayoutGrid className="h-3 w-3" />
        Carousel
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-slate-500/15 px-2 py-0.5 text-[10px] font-medium text-slate-700 dark:text-slate-300">
      <ImageIcon className="h-3 w-3" />
      Image
    </span>
  )
}

function StatusPill({ status }: { status: string }) {
  const styles: Record<string, string> = {
    ACTIVE: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300',
    PAUSED: 'bg-amber-500/15 text-amber-700 dark:text-amber-300',
    ARCHIVED: 'bg-slate-500/15 text-slate-700 dark:text-slate-300',
  }
  return (
    <span
      className={cn(
        'inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold',
        styles[status] ?? styles.ARCHIVED,
      )}
    >
      {status}
    </span>
  )
}

export default function TopAdsPage() {
  const { currentWorkspace } = useWorkspaceStore()
  const workspaceId = currentWorkspace?.id

  const [ads, setAds] = useState<TopAd[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [needsMetaConnect, setNeedsMetaConnect] = useState(false)
  const [days, setDays] = useState(30)
  const [limit, setLimit] = useState(10)
  const [sort, setSort] = useState<SortKey>('ctr')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL')
  const [search, setSearch] = useState('')
  const [view, setView] = useState<ViewMode>('grid')

  const load = useCallback(async () => {
    if (!workspaceId) {
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)
    setNeedsMetaConnect(false)
    try {
      const { data } = await metaApi.topAds(workspaceId, {
        limit,
        days,
        sort,
        status: statusFilter,
      })
      setAds(data)
      // Empty result with no error almost always means the workspace
      // has no Meta connection yet (sync hasn't populated insights).
      if (data.length === 0) setNeedsMetaConnect(true)
    } catch (e: any) {
      const code = e?.code ?? e?.response?.data?.code
      const msg = e?.response?.data?.message ?? e?.message ?? ''
      if (
        code === 'META_NOT_CONNECTED' ||
        /no.*meta|not connected/i.test(String(msg))
      ) {
        setNeedsMetaConnect(true)
      } else {
        setError(msg || 'top_ads_failed')
      }
      setAds([])
    } finally {
      setLoading(false)
    }
  }, [workspaceId, limit, days, sort, statusFilter])

  useEffect(() => {
    void load()
  }, [load])

  const filtered = useMemo(() => {
    if (!search.trim()) return ads
    const q = search.trim().toLowerCase()
    return ads.filter((a) => a.name.toLowerCase().includes(q))
  }, [ads, search])

  const spotlight = filtered[0]
  const rest = filtered.slice(1)

  const totals = useMemo(() => {
    if (filtered.length === 0) return null
    const spend = filtered.reduce((s, a) => s + a.spend, 0)
    const clicks = filtered.reduce((s, a) => s + a.clicks, 0)
    const impressions = filtered.reduce((s, a) => s + a.impressions, 0)
    const conversions = filtered.reduce((s, a) => s + a.conversions, 0)
    const revenue = filtered.reduce((s, a) => s + a.revenue, 0)
    return {
      spend,
      clicks,
      impressions,
      conversions,
      revenue,
      avgCtr: impressions > 0 ? (clicks / impressions) * 100 : 0,
      avgRoas: spend > 0 ? revenue / spend : 0,
    }
  }, [filtered])

  const exportCsv = useCallback(() => {
    if (filtered.length === 0) return
    const header = [
      'Kampaniya',
      'Holat',
      'Format',
      'Maqsad',
      'Sarf',
      'Bosishlar',
      "Ko'rishlar",
      'CTR',
      'CPC',
      'Konversiyalar',
      'Daromad',
      'ROAS',
    ]
    const rows: (string | number)[][] = [
      header,
      ...filtered.map((a) => [
        a.name,
        a.status,
        a.format,
        a.objective ?? '',
        a.spend,
        a.clicks,
        a.impressions,
        a.ctr,
        a.cpc,
        a.conversions,
        a.revenue,
        a.roas,
      ]),
    ]
    const csv = rows
      .map((r) =>
        r
          .map((cell) => {
            const v = String(cell ?? '').replace(/"/g, '""')
            return /[",\n]/.test(v) ? `"${v}"` : v
          })
          .join(','),
      )
      .join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `top-ads-${new Date().toISOString().slice(0, 10)}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }, [filtered])

  return (
    <div className="mx-auto w-full max-w-7xl space-y-5 pb-8">
      <PageHeader
        title="Top reklamalar"
        subtitle="Workspace ichidagi eng kuchli kampaniyalar — sarf, CTR, ROAS va konversiyalar bo'yicha."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            {filtered.length > 0 && (
              <Button
                variant="secondary"
                size="sm"
                onClick={exportCsv}
                className="gap-1.5"
              >
                <Download className="h-4 w-4" />
                <span className="hidden md:inline">CSV</span>
              </Button>
            )}
            <Button
              variant="secondary"
              size="sm"
              onClick={load}
              disabled={loading}
              className="gap-1.5"
            >
              <RefreshCcw className={loading ? 'h-4 w-4 animate-spin' : 'h-4 w-4'} />
              Yangilash
            </Button>
          </div>
        }
      />

      {error && <Alert variant="error">{error}</Alert>}

      {!workspaceId && (
        <Alert variant="warning">
          Workspace tanlanmagan. Iltimos, yuqoridan workspace tanlang.
        </Alert>
      )}

      {workspaceId && !loading && needsMetaConnect && ads.length === 0 && (
        <Card className="border-dashed">
          <div className="flex flex-col items-center gap-3 py-10 text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-mid/15">
              <Plug className="h-7 w-7 text-brand-mid dark:text-brand-lime" />
            </span>
            <h3 className="text-lg font-semibold text-text-primary">
              Meta hisobini ulang
            </h3>
            <p className="max-w-md text-sm text-text-secondary">
              Top reklamalarni ko&apos;rsatish uchun Meta Business hisobingizni
              ulashingiz kerak. Ulangach, sinx oxirida har bir kampaniyangiz
              avtomatik baholanadi va eng yaxshilari shu yerda paydo bo&apos;ladi.
            </p>
            <Button onClick={() => connectMeta(workspaceId)} className="mt-2 gap-1.5">
              <Link2 className="h-4 w-4" />
              Meta&apos;ni ulash
            </Button>
            <div className="mt-3 grid grid-cols-1 gap-2 text-left text-xs text-text-tertiary sm:grid-cols-2">
              <p>✓ CTR / ROAS / Konv. bo&apos;yicha tartiblash</p>
              <p>✓ Format breakdown (video / carousel / image)</p>
              <p>✓ Kunlik sarf trend (sparkline)</p>
              <p>✓ CSV export va Ad Launcher integratsiya</p>
            </div>
          </div>
        </Card>
      )}

      {workspaceId && (!needsMetaConnect || ads.length > 0) && (
        <>
          {/* Filters */}
          <Card padding="sm">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-1 rounded-lg border border-border bg-surface-2 p-0.5">
                {PRESETS.map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setDays(d)}
                    className={cn(
                      'rounded-md px-2.5 py-1 text-xs font-medium transition-colors',
                      days === d
                        ? 'bg-brand-mid text-brand-ink shadow-sm dark:bg-brand-lime'
                        : 'text-text-secondary hover:text-text-primary',
                    )}
                  >
                    {d}k
                  </button>
                ))}
              </div>

              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as SortKey)}
                className="rounded-lg border border-border bg-surface px-3 py-1.5 text-xs"
              >
                {(Object.keys(SORT_LABELS) as SortKey[]).map((k) => (
                  <option key={k} value={k}>
                    Tartib: {SORT_LABELS[k]}
                  </option>
                ))}
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
                className="rounded-lg border border-border bg-surface px-3 py-1.5 text-xs"
              >
                <option value="ALL">Holat: Hammasi</option>
                <option value="ACTIVE">Holat: Aktiv</option>
                <option value="PAUSED">Holat: Pauzada</option>
              </select>

              <select
                value={limit}
                onChange={(e) => setLimit(Number(e.target.value))}
                className="rounded-lg border border-border bg-surface px-3 py-1.5 text-xs"
              >
                {[10, 25, 50].map((n) => (
                  <option key={n} value={n}>
                    Soni: top {n}
                  </option>
                ))}
              </select>

              <div className="ml-auto flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-1.5">
                <Search className="h-3.5 w-3.5 text-text-tertiary" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Nom bo'yicha qidirish..."
                  className="w-44 bg-transparent text-xs outline-none placeholder:text-text-tertiary"
                />
                {search && (
                  <button
                    type="button"
                    onClick={() => setSearch('')}
                    className="text-xs text-text-tertiary hover:text-text-primary"
                  >
                    ×
                  </button>
                )}
              </div>

              <div className="flex rounded-lg border border-border bg-surface-2 p-0.5">
                <button
                  type="button"
                  onClick={() => setView('grid')}
                  className={cn(
                    'rounded-md px-2 py-1 transition-colors',
                    view === 'grid'
                      ? 'bg-surface text-text-primary shadow-sm'
                      : 'text-text-tertiary hover:text-text-primary',
                  )}
                  title="Grid"
                >
                  <LayoutGrid className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setView('table')}
                  className={cn(
                    'rounded-md px-2 py-1 transition-colors',
                    view === 'table'
                      ? 'bg-surface text-text-primary shadow-sm'
                      : 'text-text-tertiary hover:text-text-primary',
                  )}
                  title="Table"
                >
                  <List className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </Card>

          {totals && (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
              <StatBlock label="Sarf" value={fmtUsd(totals.spend)} />
              <StatBlock label="Konversiya" value={fmtNumber(totals.conversions)} />
              <StatBlock
                label="O'rt. CTR"
                value={fmtPct(totals.avgCtr)}
                tone={ctrTone(totals.avgCtr)}
              />
              <StatBlock
                label="O'rt. ROAS"
                value={totals.avgRoas > 0 ? `${totals.avgRoas.toFixed(2)}x` : '—'}
                tone={roasTone(totals.avgRoas)}
              />
              <StatBlock label="Bosishlar" value={fmtNumber(totals.clicks)} />
              <StatBlock label="Ko'rishlar" value={fmtNumber(totals.impressions)} />
            </div>
          )}

          {loading && (
            <Card>
              <div className="flex items-center justify-center gap-2 py-12 text-text-tertiary">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span className="text-sm">Top reklamalar yuklanmoqda…</span>
              </div>
            </Card>
          )}

          {!loading && filtered.length === 0 && !needsMetaConnect && (
            <Card className="border-dashed">
              <div className="flex flex-col items-center gap-2 py-10 text-center">
                <AlertCircle className="h-10 w-10 text-text-tertiary" />
                <p className="text-sm font-medium text-text-primary">
                  {ads.length === 0
                    ? "Bu davrda kampaniya yo'q"
                    : "Filterga mos kampaniya yo'q"}
                </p>
                <p className="text-xs text-text-tertiary">
                  {ads.length === 0
                    ? "Ad Launcher orqali birinchi kampaniyangizni yarating yoki Meta sync'ini kuting."
                    : "Davr yoki filterlarni o'zgartiring."}
                </p>
                {ads.length === 0 && (
                  <Link href="/ad-launcher" className="mt-2">
                    <Button size="sm" className="gap-1.5">
                      <Sparkles className="h-4 w-4" />
                      Ad Launcher
                    </Button>
                  </Link>
                )}
              </div>
            </Card>
          )}

          {spotlight && view === 'grid' && (
            <SpotlightCard ad={spotlight} sort={sort} />
          )}

          {view === 'grid' && rest.length > 0 && (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {rest.map((ad, i) => (
                <AdCard key={ad.campaignId} ad={ad} rank={i + 2} />
              ))}
            </div>
          )}

          {view === 'table' && filtered.length > 0 && (
            <Card padding="none">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[820px] text-sm">
                  <thead className="bg-surface-2 text-xs uppercase tracking-wide text-text-tertiary">
                    <tr>
                      <th className="px-4 py-2.5 text-left">#</th>
                      <th className="px-4 py-2.5 text-left">Kampaniya</th>
                      <th className="px-4 py-2.5 text-left">Holat</th>
                      <th className="px-4 py-2.5 text-right">Sarf</th>
                      <th className="px-4 py-2.5 text-right">CTR</th>
                      <th className="px-4 py-2.5 text-right">CPC</th>
                      <th className="px-4 py-2.5 text-right">Konv.</th>
                      <th className="px-4 py-2.5 text-right">ROAS</th>
                      <th className="px-4 py-2.5 text-left">Trend</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((ad, i) => (
                      <tr
                        key={ad.campaignId}
                        className="border-t border-border/60 hover:bg-surface-2/40"
                      >
                        <td className="px-4 py-2.5 text-xs tabular-nums text-text-tertiary">
                          {i + 1}
                        </td>
                        <td className="px-4 py-2.5">
                          <p
                            className="max-w-[280px] truncate font-medium text-text-primary"
                            title={ad.name}
                          >
                            {ad.name}
                          </p>
                          <div className="mt-0.5 flex items-center gap-1.5">
                            <FormatBadge format={ad.format} />
                            {ad.objective && (
                              <span className="text-[10px] text-text-tertiary">
                                {ad.objective.replace('OUTCOME_', '').toLowerCase()}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-2.5">
                          <StatusPill status={ad.status} />
                        </td>
                        <td className="px-4 py-2.5 text-right tabular-nums">
                          {fmtUsd(ad.spend)}
                        </td>
                        <td
                          className={cn(
                            'px-4 py-2.5 text-right tabular-nums font-medium',
                            ctrTone(ad.ctr),
                          )}
                        >
                          {fmtPct(ad.ctr)}
                        </td>
                        <td className="px-4 py-2.5 text-right tabular-nums text-text-secondary">
                          {ad.cpc > 0 ? `$${ad.cpc.toFixed(2)}` : '—'}
                        </td>
                        <td className="px-4 py-2.5 text-right tabular-nums">
                          {ad.conversions}
                        </td>
                        <td
                          className={cn(
                            'px-4 py-2.5 text-right tabular-nums font-medium',
                            roasTone(ad.roas),
                          )}
                        >
                          {ad.roas > 0 ? `${ad.roas.toFixed(2)}x` : '—'}
                        </td>
                        <td className="px-4 py-2.5">
                          {ad.trend.length > 1 ? (
                            <span className="text-brand-mid dark:text-brand-lime">
                              <Sparkline
                                data={ad.trend}
                                width={64}
                                height={20}
                                positive={ad.trend[ad.trend.length - 1] >= ad.trend[0]}
                              />
                            </span>
                          ) : (
                            <span className="text-[10px] text-text-tertiary">—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </>
      )}
    </div>
  )
}

function StatBlock({
  label,
  value,
  tone,
}: {
  label: string
  value: string
  tone?: string
}) {
  return (
    <div className="rounded-xl border border-border bg-surface p-3">
      <p className="text-[10px] uppercase tracking-wide text-text-tertiary">{label}</p>
      <p
        className={cn('mt-0.5 text-lg font-bold tabular-nums', tone ?? 'text-text-primary')}
      >
        {value}
      </p>
    </div>
  )
}

function SpotlightCard({ ad, sort }: { ad: TopAd; sort: SortKey }) {
  const trendUp =
    ad.trend.length >= 2 && ad.trend[ad.trend.length - 1] >= ad.trend[0]
  return (
    <Card className="border-brand-mid/30 bg-gradient-to-br from-brand-mid/8 via-surface to-surface">
      <div className="flex flex-wrap items-start gap-4">
        <div className="flex shrink-0 items-center gap-3">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-mid to-brand-lime text-brand-ink shadow-md">
            <Crown className="h-6 w-6" />
          </span>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wide text-brand-mid dark:text-brand-lime">
              #1 {SORT_LABELS[sort]} bo&apos;yicha
            </p>
            <p className="mt-0.5 line-clamp-1 text-lg font-bold text-text-primary">
              {ad.name}
            </p>
            <div className="mt-1 flex flex-wrap items-center gap-1.5">
              <StatusPill status={ad.status} />
              <FormatBadge format={ad.format} />
              {ad.objective && (
                <span className="rounded-full bg-surface-2 px-2 py-0.5 text-[10px] text-text-tertiary">
                  {ad.objective.replace('OUTCOME_', '').toLowerCase()}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="grid flex-1 grid-cols-2 gap-2 sm:grid-cols-4">
          <SpotlightStat label="Sarf" value={fmtUsd(ad.spend)} />
          <SpotlightStat label="CTR" value={fmtPct(ad.ctr)} tone={ctrTone(ad.ctr)} />
          <SpotlightStat label="Konv." value={String(ad.conversions)} />
          <SpotlightStat
            label="ROAS"
            value={ad.roas > 0 ? `${ad.roas.toFixed(2)}x` : '—'}
            tone={roasTone(ad.roas)}
          />
        </div>
      </div>

      {ad.trend.length > 1 && (
        <div className="mt-4 flex flex-wrap items-center gap-4 border-t border-border/40 pt-3">
          <div className="flex items-center gap-2 text-xs text-text-tertiary">
            <TrendingUp
              className={cn('h-3.5 w-3.5', trendUp ? 'text-emerald-500' : 'text-rose-500')}
            />
            Kunlik sarf trend
          </div>
          <span
            className={
              trendUp
                ? 'text-emerald-600 dark:text-emerald-400'
                : 'text-rose-500 dark:text-rose-400'
            }
          >
            <Sparkline data={ad.trend} width={200} height={28} positive={trendUp} />
          </span>
          <Link href="/ad-launcher" className="ml-auto">
            <Button size="sm" variant="secondary" className="gap-1.5">
              <Sparkles className="h-3.5 w-3.5" />
              Ad Launcher&apos;ga yuborish
            </Button>
          </Link>
        </div>
      )}
    </Card>
  )
}

function SpotlightStat({
  label,
  value,
  tone,
}: {
  label: string
  value: string
  tone?: string
}) {
  return (
    <div className="rounded-lg bg-surface-2/60 p-2.5">
      <p className="text-[10px] uppercase tracking-wide text-text-tertiary">{label}</p>
      <p className={cn('mt-0.5 text-base font-bold tabular-nums', tone ?? 'text-text-primary')}>
        {value}
      </p>
    </div>
  )
}

function AdCard({ ad, rank }: { ad: TopAd; rank: number }) {
  const trendUp =
    ad.trend.length >= 2 && ad.trend[ad.trend.length - 1] >= ad.trend[0]
  return (
    <div className="group flex flex-col rounded-xl border border-border bg-surface p-3.5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-brand-mid/40 hover:shadow-md">
      <div className="flex items-start justify-between gap-2">
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-surface-2 text-xs font-bold text-text-tertiary">
          #{rank}
        </span>
        <div className="flex items-center gap-1.5">
          <FormatBadge format={ad.format} />
          <StatusPill status={ad.status} />
        </div>
      </div>

      <p
        className="mt-2.5 line-clamp-2 text-sm font-semibold text-text-primary"
        title={ad.name}
      >
        {ad.name}
      </p>

      <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
        <div>
          <p className="text-[10px] uppercase tracking-wide text-text-tertiary">Sarf</p>
          <p className="font-bold tabular-nums text-text-primary">{fmtUsd(ad.spend)}</p>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-wide text-text-tertiary">CTR</p>
          <p className={cn('font-bold tabular-nums', ctrTone(ad.ctr))}>{fmtPct(ad.ctr)}</p>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-wide text-text-tertiary">Konv.</p>
          <p className="font-bold tabular-nums text-text-primary">{ad.conversions}</p>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-wide text-text-tertiary">ROAS</p>
          <p className={cn('font-bold tabular-nums', roasTone(ad.roas))}>
            {ad.roas > 0 ? `${ad.roas.toFixed(2)}x` : '—'}
          </p>
        </div>
      </div>

      {ad.trend.length > 1 && (
        <div className="mt-3 flex items-center justify-between gap-2 border-t border-border/40 pt-2.5">
          <span className={trendUp ? 'text-emerald-500' : 'text-rose-500'}>
            <Sparkline data={ad.trend} width={90} height={20} positive={trendUp} />
          </span>
          <span className="text-[10px] text-text-tertiary">{ad.trend.length} kun</span>
        </div>
      )}
    </div>
  )
}
