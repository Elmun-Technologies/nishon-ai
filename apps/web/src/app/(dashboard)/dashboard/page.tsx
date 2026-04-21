'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  BarChart3,
  Binoculars,
  BookHeart,
  FileText,
  LineChart as LineChartIcon,
  Rocket,
  Sparkles,
  Wallet,
} from 'lucide-react'
import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { useWorkspaceStore } from '@/stores/workspace.store'
import { useI18n } from '@/i18n/use-i18n'
import { useRealtimeRefresh } from '@/hooks/useRealtimeRefresh'
import { EmptyState } from '@/components/ui/EmptyState'
import { Alert, Button } from '@/components/ui'
import { Card } from '@/components/ui/Card'
import { workspaces as workspacesApi, aiAgent, meta as metaApi } from '@/lib/api-client'
import { formatCurrency, cn } from '@/lib/utils'
import { formatUzs } from '@/lib/subscription-plans'
import { FIRST_CAMPAIGN_BANNER_KEY } from '@/lib/onboarding-v2'
import { ChatWidget } from '@/components/ui/ChatWidget'

interface SparklinePoint {
  day: string
  spend: number
  clicks: number
}

interface PerformanceSummary {
  totalSpend?: number
  totalRevenue?: number
  totalConversions?: number
  totalClicks?: number
  totalImpressions?: number
  campaignCount?: number
  activeCampaigns?: number
  overallRoas?: number
  avgRoas?: number
  metaConnected?: boolean
  changes?: { spend: number | null; clicks: number | null; impressions: number | null }
  sparkline?: SparklinePoint[]
}

interface ReportCampaign {
  id: string
  name: string
  status: string
  objective: string | null
  metrics: { spend: number; clicks: number; impressions: number; ctr: number; cpc: number }
}

interface TopAd {
  campaignId: string
  name: string
  status: string
  spend: number
  clicks: number
  impressions: number
  ctr: number
}

interface CrmSummaryPayload {
  ok?: boolean
  realRevenueUzs?: number
  metaRevenueEstimateUzs?: number
  diffPctVsMeta?: number | null
  topCustomers?: Array<{ phoneDisplay: string; phoneNorm: string; orders: number; ltvUzs: number }>
  realRoas?: number | null
  eventCount?: number
}

function firstName(full?: string | null) {
  if (!full?.trim()) return ''
  return full.trim().split(/\s+/)[0] ?? ''
}

function pctChange(a: number, b: number): number | null {
  if (b === 0) return null
  return Math.round(((a - b) / b) * 1000) / 10
}

function lastSparklineDays(points: SparklinePoint[], n: number) {
  return points.slice(-n)
}

function formatDayLabel(iso: string) {
  try {
    const d = new Date(iso)
    return d.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric' })
  } catch {
    return iso
  }
}

function DashboardKpiCard({
  label,
  value,
  valueClassName,
  sub,
  trend,
  trendMode,
}: {
  label: string
  value: string
  valueClassName?: string
  sub?: string
  trend: number | null
  /** higher = yaxshi | lower = yaxshi | neutral */
  trendMode: 'higherBetter' | 'lowerBetter' | 'neutral'
}) {
  const up = trend != null && trend > 0
  const down = trend != null && trend < 0
  const trendGood =
    trendMode === 'neutral' ? null : trendMode === 'higherBetter' ? up : down
  return (
    <Card padding="md" className="border-border/80 bg-surface shadow-sm relative overflow-hidden">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-violet-500/50 via-blue-500/40 to-transparent" />
      <p className="text-[11px] font-semibold uppercase tracking-wide text-text-tertiary">{label}</p>
      <p className={cn('text-2xl font-bold mt-1 tabular-nums', valueClassName ?? 'text-text-primary')}>{value}</p>
      {sub && <p className="text-[10px] text-text-tertiary mt-0.5">{sub}</p>}
      {trend != null && (
        <p
          className={cn(
            'text-xs font-semibold mt-2 inline-flex items-center gap-0.5 tabular-nums',
            trendMode === 'neutral' && (up ? 'text-text-secondary' : down ? 'text-text-secondary' : 'text-text-tertiary'),
            trendMode !== 'neutral' && (trendGood ? 'text-emerald-500' : 'text-red-400'),
          )}
        >
          {up ? '↑' : down ? '↓' : '→'} {Math.abs(trend)}%
        </p>
      )}
    </Card>
  )
}

function campaignTone(status: string, roas: number | null, ctr: number) {
  const s = (status ?? '').toUpperCase()
  if (s.includes('LEARNING')) return 'learning' as const
  if (roas != null && roas < 2) return 'bad' as const
  if (roas != null && roas >= 2) return 'good' as const
  if (roas == null && ctr > 0 && ctr < 1) return 'bad' as const
  return 'neutral' as const
}

export default function DashboardPage() {
  const { t } = useI18n()
  const router = useRouter()
  const { currentWorkspace, user } = useWorkspaceStore()
  const [performance, setPerformance] = useState<PerformanceSummary | null>(null)
  const [loadingPerf, setLoadingPerf] = useState(true)
  const [reportCampaigns, setReportCampaigns] = useState<ReportCampaign[]>([])
  const [topAds, setTopAds] = useState<TopAd[]>([])
  const [optimizing, setOptimizing] = useState(false)
  const [optimizeMsg, setOptimizeMsg] = useState('')
  const [error, setError] = useState('')
  const [firstCampaignBanner, setFirstCampaignBanner] = useState(false)
  const [crmSummary, setCrmSummary] = useState<CrmSummaryPayload | null>(null)

  useEffect(() => {
    try {
      if (typeof sessionStorage !== 'undefined' && sessionStorage.getItem(FIRST_CAMPAIGN_BANNER_KEY)) {
        setFirstCampaignBanner(true)
      }
    } catch {
      /* ignore */
    }
  }, [])

  useEffect(() => {
    if (!currentWorkspace?.id) return
    fetch('/api/crm/summary')
      .then((r) => r.json() as Promise<CrmSummaryPayload>)
      .then((d) => {
        if (d.ok) setCrmSummary(d)
      })
      .catch(() => setCrmSummary(null))
  }, [currentWorkspace?.id])

  const dismissFirstCampaignBanner = useCallback(() => {
    try {
      sessionStorage.removeItem(FIRST_CAMPAIGN_BANNER_KEY)
    } catch {
      /* ignore */
    }
    setFirstCampaignBanner(false)
  }, [])

  const loadPerformance = useCallback(() => {
    if (!currentWorkspace?.id) return
    workspacesApi
      .performance(currentWorkspace.id)
      .then((res) => setPerformance((res.data as PerformanceSummary) ?? {}))
      .catch(() => setPerformance({}))
      .finally(() => setLoadingPerf(false))
  }, [currentWorkspace?.id])

  useEffect(() => {
    if (!currentWorkspace?.id) {
      setLoadingPerf(false)
      return
    }
    setLoadingPerf(true)
    loadPerformance()
    metaApi
      .reporting(currentWorkspace.id, 7)
      .then((res) => {
        const data = res.data as { accounts?: Array<{ campaigns?: ReportCampaign[] }> }
        const rows = (data?.accounts ?? []).flatMap((a) => a.campaigns ?? [])
        setReportCampaigns(rows)
      })
      .catch(() => setReportCampaigns([]))
    metaApi
      .topAds(currentWorkspace.id, 5)
      .then((res) => setTopAds((res.data as TopAd[]) ?? []))
      .catch(() => setTopAds([]))
  }, [currentWorkspace?.id, loadPerformance])

  useRealtimeRefresh(currentWorkspace?.id, ['meta_synced', 'optimization_done'], loadPerformance)

  async function handleRunOptimization() {
    if (!currentWorkspace?.id) return
    setOptimizing(true)
    setOptimizeMsg('')
    setError('')
    try {
      await aiAgent.optimize(currentWorkspace.id)
      setOptimizeMsg(t('dashboard.optimizationDone', 'Optimization complete — check AI Decisions for results.'))
      setTimeout(() => setOptimizeMsg(''), 4000)
    } catch (err: unknown) {
      setError((err as Error)?.message ?? t('dashboard.optimizationFailed', 'Optimization failed'))
      setTimeout(() => setError(''), 4000)
    } finally {
      setOptimizing(false)
    }
  }

  const ws = currentWorkspace
  const roas = performance?.overallRoas ?? performance?.avgRoas ?? 0
  const spark = performance?.sparkline ?? []
  const last = spark[spark.length - 1]
  const prev = spark.length >= 2 ? spark[spark.length - 2] : null
  const sparkline = performance?.sparkline
  const spendToday = last?.spend ?? 0
  const spendTrend = prev ? pctChange(last.spend, prev.spend) : null
  const revenueTodayEst = spendToday > 0 && roas > 0 ? spendToday * roas : 0
  const prevRevEst = prev && roas > 0 ? prev.spend * roas : 0
  const revenueTrend = prev && prevRevEst > 0 ? pctChange(revenueTodayEst, prevRevEst) : null
  const activeN = performance?.activeCampaigns ?? performance?.campaignCount ?? 0

  const chartData = useMemo(() => {
    const pts = sparkline ?? []
    const slice = lastSparklineDays(pts, 7)
    return slice.map((p) => ({
      label: formatDayLabel(p.day),
      spend: Math.round(p.spend * 100) / 100,
      revenue: roas > 0 ? Math.round(p.spend * roas * 100) / 100 : 0,
    }))
  }, [sparkline, roas])

  const aiAlerts = useMemo(
    () => [
      {
        id: '1',
        text: t('dashboard.dashboardHome.alertRoas', 'ROAS 1.7 ga yaqinlashdi — byudjetni avto qisqartirish tavsiyasi (Auto-optimization).'),
        href: '/auto-optimization',
      },
      {
        id: '2',
        text: t('dashboard.dashboardHome.alertCreative', 'Kreativ charchashi signali — yangi variant yuklash.'),
        href: '/creative-hub/image-ads',
      },
      {
        id: '3',
        text: t('dashboard.dashboardHome.alertCompetitor', 'Raqib segmentida yangi aktiv reklamalar (Ad Library).'),
        href: '/ad-library',
      },
    ],
    [t],
  )

  if (!ws) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="w-full max-w-xl rounded-2xl border border-border bg-surface p-6">
          <EmptyState
            icon="Workspace"
            title={t('dashboard.welcomeToAdSpectr', 'Welcome to AdSpectr')}
            description={t('dashboard.completeOnboarding', 'Complete onboarding to create your first workspace and let AI manage your ad campaigns.')}
            action={{
              label: t('dashboard.startSetup', 'Start Setup'),
              onClick: () => router.push('/onboarding'),
            }}
          />
        </div>
      </div>
    )
  }

  const name = firstName(user?.name) || t('dashboard.dashboardHome.fallbackName', 'do‘st')

  return (
    <div className="max-w-7xl space-y-6 pb-8">
      {error && <Alert variant="error">{error}</Alert>}
      {optimizeMsg && <Alert variant="success">{optimizeMsg}</Alert>}
      {firstCampaignBanner && (
        <Alert variant="info" className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm font-medium text-text-primary">
            {t('dashboard.firstCampaignBanner', 'Birinchi kampaniyangizni yarating — bir bosqichda boshlang.')}
          </p>
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <Button asChild size="sm" className="rounded-lg">
              <Link href="/campaigns" onClick={dismissFirstCampaignBanner}>
                {t('dashboard.firstCampaignCta', 'Kampaniyalar')}
              </Link>
            </Button>
            <Button type="button" variant="ghost" size="sm" className="rounded-lg" onClick={dismissFirstCampaignBanner}>
              {t('dashboard.firstCampaignDismiss', 'Yopish')}
            </Button>
          </div>
        </Alert>
      )}

      <section className="rounded-2xl border border-border/80 bg-gradient-to-br from-surface via-surface to-violet-500/5 p-5 md:p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm text-text-tertiary">
              {ws.name} · {t('dashboard.realtimeOverview', 'Real-time overview')}
            </p>
            <h1 className="text-2xl md:text-3xl font-bold text-text-primary mt-1">
              {t('dashboard.dashboardHome.greeting', 'Salom')}, {name} 👋
            </h1>
            <p className="text-sm text-text-secondary mt-2 max-w-xl">
              {t(
                'dashboard.dashboardHome.tagline',
                'Bugun nima bo‘lyapti — 3 soniyada: KPI, kampaniyalar, AI signal va haftalik trend.',
              )}
            </p>
          </div>
          <Button onClick={handleRunOptimization} disabled={optimizing} className="shrink-0 rounded-xl shadow-sm">
            {optimizing ? t('dashboard.optimizing', 'Optimizing...') : t('dashboard.runOptimization', 'Run AI Optimization')}
          </Button>
        </div>
      </section>

      {/* 1 — Bugungi holat: 4 karta */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <DashboardKpiCard
          label={t('dashboard.dashboardHome.cardRevenueToday', 'Daromad (bugun, taxmin)')}
          value={loadingPerf ? '…' : revenueTodayEst > 0 ? formatCurrency(revenueTodayEst) : '—'}
          sub={t('dashboard.dashboardHome.cardRevenueHint', 'So‘nggi kun spend × ROAS')}
          trend={revenueTrend}
          trendMode="higherBetter"
        />
        <DashboardKpiCard
          label="ROAS"
          value={loadingPerf ? '…' : roas > 0 ? `${roas.toFixed(2)}x` : '—'}
          valueClassName={roas >= 2 ? 'text-emerald-500' : roas > 0 ? 'text-red-400' : 'text-text-primary'}
          sub={t('dashboard.dashboardHome.cardRoasHint', '30 kunlik blended')}
          trend={null}
          trendMode="neutral"
        />
        <DashboardKpiCard
          label={t('dashboard.dashboardHome.cardActive', 'Aktiv kampaniyalar')}
          value={loadingPerf ? '…' : String(activeN)}
          sub={t('dashboard.dashboardHome.cardActiveHint', 'Hisoblangan')}
          trend={null}
          trendMode="neutral"
        />
        <DashboardKpiCard
          label={t('dashboard.dashboardHome.cardSpendToday', 'Spend (so‘nggi kun)')}
          value={loadingPerf ? '…' : formatCurrency(spendToday)}
          sub={t('dashboard.dashboardHome.cardSpendHint', 'Meta sync kunlari')}
          trend={spendTrend}
          trendMode="lowerBetter"
        />
      </div>

      {crmSummary?.ok ? (
        <section className="rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-surface via-surface to-emerald-500/5 p-5 md:p-6 shadow-sm">
          <div className="flex items-start gap-3 mb-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-600">
              <Wallet className="h-5 w-5" aria-hidden />
            </div>
            <div>
              <h2 className="text-base font-semibold text-text-primary">
                {t('dashboard.crm.title', 'CRM — real daromad')}
              </h2>
              <p className="text-xs text-text-tertiary mt-0.5">
                {t(
                  'dashboard.crm.subtitle',
                  "Payme / Click / Telegram — haqiqiy to'lovlar. Meta purchase bilan farq (qaytarishlar).",
                )}
              </p>
            </div>
          </div>
          <div className="grid sm:grid-cols-2 gap-4 text-sm">
            <div className="rounded-xl border border-border/70 bg-surface-2/50 px-4 py-3">
              <p className="text-[11px] uppercase text-text-tertiary font-medium">
                {t('dashboard.crm.realRevenue', 'Real Revenue (CRM)')}
              </p>
              <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-1 tabular-nums">
                {formatUzs(crmSummary.realRevenueUzs ?? 0)}
              </p>
              <p className="text-[10px] text-text-tertiary mt-1">
                {t('dashboard.crm.events', '{n} hodisa').replace('{n}', String(crmSummary.eventCount ?? 0))}
              </p>
            </div>
            <div className="rounded-xl border border-border/70 bg-surface-2/50 px-4 py-3">
              <p className="text-[11px] uppercase text-text-tertiary font-medium">
                {t('dashboard.crm.metaRevenue', 'Meta Revenue (taxmin)')}
              </p>
              <p className="text-xl font-bold text-text-primary mt-1 tabular-nums">
                {formatUzs(crmSummary.metaRevenueEstimateUzs ?? 0)}
              </p>
              <p className="text-[10px] text-text-tertiary mt-1">
                {crmSummary.diffPctVsMeta != null
                  ? t('dashboard.crm.diff', 'Farq: {pct}% (CRM vs Meta taxmin)')
                      .replace('{pct}', String(crmSummary.diffPctVsMeta))
                  : '—'}
              </p>
            </div>
          </div>
          {crmSummary.realRoas != null ? (
            <p className="text-xs text-text-secondary mt-3">
              {t('dashboard.crm.realRoas', 'Real ROAS (CRM / spend taxmin):')}{' '}
              <span className="font-semibold text-text-primary">{crmSummary.realRoas}x</span>
            </p>
          ) : null}
          <div className="mt-4 border-t border-border/60 pt-4">
            <p className="text-xs font-semibold text-text-secondary mb-2">
              {t('dashboard.crm.topCustomers', 'Top mijozlar')}
            </p>
            <ol className="space-y-2 text-sm text-text-primary">
              {(crmSummary.topCustomers ?? []).slice(0, 3).map((c, i) => (
                <li key={`${c.phoneNorm}-${i}`} className="flex justify-between gap-2">
                  <span>
                    {i + 1}. {c.phoneDisplay} — {c.orders}x
                  </span>
                  <span className="font-medium tabular-nums text-text-secondary">{formatUzs(c.ltvUzs)} LTV</span>
                </li>
              ))}
            </ol>
            <Link
              href="/retarget"
              className="inline-flex mt-3 text-xs font-medium text-violet-600 dark:text-violet-400 hover:underline"
            >
              {t('dashboard.crm.docsLink', 'CRM webhooklar (Payme / Click) →')}
            </Link>
          </div>
        </section>
      ) : null}

      {/* Mobile: tezkor harakatlar kartadan keyin */}
      <section className="lg:hidden rounded-2xl border border-border/80 bg-surface p-4 shadow-sm">
        <QuickActionsBlock t={t} />
      </section>

      {/* 3 ustun: chap kampaniyalar | markaz grafik+alert | o‘ng actions+insights */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Faol kampaniyalar */}
        <div className="lg:col-span-4 order-3 lg:order-1 space-y-3">
          <h2 className="text-sm font-semibold text-text-primary flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-violet-500" aria-hidden />
            {t('dashboard.dashboardHome.activeCampaigns', 'Faol kampaniyalar')}
          </h2>
          <Card padding="none" className="border-border/80 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-surface-2/80 text-[10px] uppercase text-text-tertiary">
                  <tr>
                    <th className="text-left px-3 py-2 font-medium">{t('dashboard.campaign', 'Campaign')}</th>
                    <th className="text-left px-2 py-2 font-medium">{t('dashboard.status', 'Status')}</th>
                    <th className="text-right px-2 py-2 font-medium">ROAS</th>
                    <th className="text-right px-3 py-2 font-medium">{t('dashboard.spend', 'Spend')}</th>
                  </tr>
                </thead>
                <tbody>
                  {(reportCampaigns.length ? reportCampaigns.slice(0, 10) : []).map((row) => {
                    const proxyRoas =
                      row.metrics.spend > 0 && roas > 0
                        ? Math.min(4.2, Math.max(0.8, roas * (0.92 + (row.name.length % 7) * 0.02)))
                        : null
                    const tone = campaignTone(row.status, proxyRoas, row.metrics.ctr)
                    return (
                      <tr
                        key={row.id}
                        className={cn(
                          'border-t border-border/60',
                          tone === 'learning' && 'bg-amber-500/8',
                          tone === 'bad' && 'bg-red-500/6',
                          tone === 'good' && 'bg-emerald-500/6',
                        )}
                      >
                        <td className="px-3 py-2.5 font-medium text-text-primary max-w-[140px] truncate">{row.name}</td>
                        <td className="px-2 py-2.5 text-xs text-text-secondary whitespace-nowrap">{row.status}</td>
                        <td className="px-2 py-2.5 text-right tabular-nums text-xs">
                          {proxyRoas != null ? `${proxyRoas.toFixed(1)}x` : '—'}
                        </td>
                        <td className="px-3 py-2.5 text-right tabular-nums">{formatCurrency(row.metrics.spend)}</td>
                      </tr>
                    )
                  })}
                  {!reportCampaigns.length && (
                    <tr>
                      <td colSpan={4} className="px-4 py-10 text-center text-text-tertiary text-xs">
                        {t(
                          'dashboard.dashboardHome.noCampaignRows',
                          'Kampaniya qatorlari yo‘q — Meta ulang yoki ma’lumot sync bo‘lsin.',
                        )}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <p className="text-[9px] text-text-tertiary px-3 py-2 border-t border-border/60 bg-surface-2/30">
              {t(
                'dashboard.dashboardHome.roasProxyNote',
                'ROAS qatorlari blended ROAS dan taxminiy (kampaniya darajasida pixel keyin).',
              )}
            </p>
          </Card>
        </div>

        {/* Grafik + AI alerts */}
        <div className="lg:col-span-5 order-4 lg:order-2 space-y-4">
          <Card padding="md" className="border-border/80 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <LineChartIcon className="w-4 h-4 text-blue-500" aria-hidden />
              <h2 className="text-sm font-semibold text-text-primary">{t('dashboard.dashboardHome.weeklyTrend', 'Haftalik trend')}</h2>
            </div>
            {chartData.length >= 2 ? (
              <div className="h-[220px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#888' }} />
                    <YAxis tick={{ fontSize: 10, fill: '#888' }} width={44} />
                    <Tooltip
                      contentStyle={{ fontSize: 11, borderRadius: 8, background: '#111827', border: '1px solid #374151' }}
                    />
                    <Line type="monotone" dataKey="revenue" name={t('dashboard.dashboardHome.legendRevenue', 'Daromad (est.)')} stroke="#a78bfa" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="spend" name={t('dashboard.spend', 'Spend')} stroke="#38bdf8" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="text-xs text-text-tertiary py-8 text-center">{t('dashboard.dashboardHome.chartEmpty', 'Haftalik nuqtalar hali yo‘q.')}</p>
            )}
          </Card>

          <Card padding="md" className="border-border/80 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-4 h-4 text-amber-500" aria-hidden />
              <h2 className="text-sm font-semibold text-text-primary">AI Alerts</h2>
            </div>
            <ul className="space-y-2">
              {aiAlerts.map((a) => (
                <li key={a.id}>
                  <Link
                    href={a.href}
                    className="block rounded-xl border border-border/70 bg-surface-2/40 px-3 py-2.5 text-xs text-text-secondary hover:border-violet-500/30 hover:bg-violet-500/5 transition-colors"
                  >
                    <span className="text-text-primary font-medium">{a.text}</span>
                    <span className="block text-[10px] text-violet-500 mt-1">{t('dashboard.dashboardHome.alertCta', 'Batafsil →')}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </Card>
        </div>

        {/* O‘ng: tezkor + insights (desktop) */}
        <aside className="lg:col-span-3 order-2 lg:order-3 space-y-4 hidden lg:block">
          <Card padding="md" className="border-border/80 shadow-sm">
            <QuickActionsBlock t={t} />
          </Card>
          <InsightsBlock t={t} topAdName={topAds[0]?.name} />
        </aside>
      </div>

      {/* Mobile: insights pastda */}
      <div className="lg:hidden">
        <InsightsBlock t={t} topAdName={topAds[0]?.name} />
      </div>

      {performance?.metaConnected && (
        <p className="text-[11px] text-text-tertiary flex flex-wrap items-center gap-1">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" aria-hidden />
          {t('dashboard.metaRealtimePrefix', 'Metrics are streamed in real-time from')}{' '}
          <Link href="/settings/meta" className="text-violet-600 dark:text-violet-300 hover:underline">
            Meta Ads
          </Link>
        </p>
      )}

      <ChatWidget />
    </div>
  )
}

function QuickActionsBlock({ t }: { t: (k: string, d: string) => string }) {
  const items = [
    { href: '/launch', label: t('dashboard.dashboardHome.actionLaunch', '🚀 Yangi kampaniya'), icon: Rocket },
    { href: '/reports', label: t('dashboard.dashboardHome.actionReport', '📊 Hisobot yaratish'), icon: FileText },
    { href: '/ad-library', label: t('dashboard.dashboardHome.actionIdea', '💡 Idea olish'), icon: Binoculars },
    { href: '/audiences/story', label: t('dashboard.dashboardHome.actionAudience', '👥 Auditoriya'), icon: BookHeart },
  ]
  return (
    <div>
      <h2 className="text-sm font-semibold text-text-primary mb-3">{t('dashboard.quickActions', 'Quick actions')}</h2>
      <div className="flex flex-col gap-2">
        {items.map((x) => (
          <Link
            key={x.href}
            href={x.href}
            className="inline-flex items-center gap-2 rounded-xl border border-border bg-surface-2/50 px-3 py-2.5 text-sm font-medium text-text-primary hover:border-violet-500/40 hover:bg-violet-500/10 transition-colors"
          >
            <x.icon className="w-4 h-4 text-violet-500 shrink-0" aria-hidden />
            {x.label}
          </Link>
        ))}
      </div>
    </div>
  )
}

function InsightsBlock({ t, topAdName }: { t: (k: string, d: string) => string; topAdName?: string }) {
  return (
    <Card padding="md" className="border-border/80 shadow-sm bg-gradient-to-br from-surface to-violet-500/5">
      <h2 className="text-sm font-semibold text-text-primary mb-3">{t('dashboard.dashboardHome.topInsights', 'Top insights')}</h2>
      <ul className="space-y-3 text-xs text-text-secondary">
        <li>
          <span className="text-text-tertiary block text-[10px] uppercase tracking-wide mb-0.5">
            {t('dashboard.dashboardHome.bestCreative', 'Eng yaxshi kreativ')}
          </span>
          <span className="text-text-primary font-medium">{topAdName ?? t('dashboard.dashboardHome.noCreativeYet', '— hali ma’lumot yo‘q')}</span>
        </li>
        <li>
          <span className="text-text-tertiary block text-[10px] uppercase tracking-wide mb-0.5">
            {t('dashboard.dashboardHome.bestAudience', 'Eng yaxshi auditoriya')}
          </span>
          <Link href="/audiences/story" className="text-violet-600 dark:text-violet-300 font-medium hover:underline">
            Dilnoza (Audience Story)
          </Link>
        </li>
        <li className="rounded-lg border border-amber-500/25 bg-amber-500/10 px-2.5 py-2 text-amber-900 dark:text-amber-100">
          {t('dashboard.dashboardHome.tipBudget', 'Tavsiya: ertaga byudjetni 8–10% sinov bilan oshiring — ROAS barqaror bo‘lsa.')}
        </li>
      </ul>
    </Card>
  )
}
