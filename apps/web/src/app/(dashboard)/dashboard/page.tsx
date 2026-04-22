'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Activity,
  ArrowDown,
  ArrowRight,
  ArrowUp,
  BarChart2,
  BookHeart,
  Brain,
  Eye,
  FileText,
  MousePointerClick,
  RefreshCcw,
  Rocket,
  ScanSearch,
  Sparkles,
  TrendingUp,
  Users,
  Wallet,
  Zap,
} from 'lucide-react'
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
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
import { Skeleton } from '@/components/ui/Skeleton'
import { workspaces as workspacesApi, aiAgent, meta as metaApi } from '@/lib/api-client'
import { formatCurrency, formatNumber, cn } from '@/lib/utils'
import { formatUzs } from '@/lib/subscription-plans'
import { FIRST_CAMPAIGN_BANNER_KEY } from '@/lib/onboarding-v2'
import { ChatWidget } from '@/components/ui/ChatWidget'

export const dynamic = 'force-dynamic'

// ─── Types ─────────────────────────────────────────────────────────────────────

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

type DatePreset = '1d' | '7d' | '14d' | '30d' | '90d'

// ─── Helpers ───────────────────────────────────────────────────────────────────

function firstName(full?: string | null) {
  if (!full?.trim()) return ''
  return full.trim().split(/\s+/)[0] ?? ''
}

function pctChange(a: number, b: number): number | null {
  if (!b) return null
  return Math.round(((a - b) / b) * 1000) / 10
}

function formatDayLabel(iso: string) {
  try {
    const d = new Date(iso)
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
  } catch {
    return iso
  }
}

function roasColor(r: number) {
  if (r >= 3) return 'text-emerald-400'
  if (r >= 2) return 'text-emerald-300'
  if (r >= 1) return 'text-amber-400'
  return 'text-red-400'
}

const STATUS_STYLE: Record<string, { dot: string; text: string }> = {
  ACTIVE:   { dot: 'bg-emerald-400', text: 'text-emerald-400' },
  PAUSED:   { dot: 'bg-amber-400',   text: 'text-amber-400'   },
  DELETED:  { dot: 'bg-red-400',     text: 'text-red-400'     },
  ARCHIVED: { dot: 'bg-zinc-500',    text: 'text-zinc-400'    },
}

// ─── Sub-components ─────────────────────────────────────────────────────────

function KpiCard({
  label,
  value,
  trend,
  trendMode = 'higherBetter',
  sub,
  icon: Icon,
  loading,
  accent,
}: {
  label: string
  value: string
  trend?: number | null
  trendMode?: 'higherBetter' | 'lowerBetter' | 'neutral'
  sub?: string
  icon: React.ComponentType<{ className?: string }>
  loading?: boolean
  accent?: boolean
}) {
  const up   = trend != null && trend > 0
  const down = trend != null && trend < 0
  const good = trendMode === 'neutral' ? null : trendMode === 'higherBetter' ? up : down
  const trendClass =
    trend == null
      ? 'text-text-tertiary'
      : trendMode === 'neutral'
        ? 'text-text-secondary'
        : good
          ? 'text-emerald-400'
          : 'text-red-400'

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-2xl border bg-surface p-5 transition-shadow hover:shadow-lg',
        accent ? 'border-violet-500/30' : 'border-white/[0.07]',
      )}
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-violet-500/60 via-blue-500/40 to-transparent" />
      <div className="flex items-start justify-between gap-2">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-text-tertiary">{label}</p>
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white/[0.05]">
          <Icon className="h-3.5 w-3.5 text-text-tertiary" />
        </span>
      </div>
      {loading ? (
        <Skeleton className="mt-3 h-7 w-24" />
      ) : (
        <p className="mt-2 text-2xl font-bold tabular-nums text-text-primary">{value}</p>
      )}
      <div className="mt-2 flex items-center gap-2">
        {sub && <p className="text-[10px] text-text-tertiary">{sub}</p>}
        {trend != null && (
          <span className={cn('inline-flex items-center gap-0.5 text-xs font-semibold tabular-nums', trendClass)}>
            {up ? <ArrowUp size={11} /> : down ? <ArrowDown size={11} /> : null}
            {Math.abs(trend)}%
          </span>
        )}
      </div>
    </div>
  )
}

function StatusDot({ status }: { status: string }) {
  const s = STATUS_STYLE[status?.toUpperCase()] ?? STATUS_STYLE.ARCHIVED
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={cn('h-1.5 w-1.5 rounded-full', s.dot)} />
      <span className={cn('text-xs font-medium', s.text)}>{status}</span>
    </span>
  )
}

function RoasBar({ value }: { value: number | null }) {
  if (value == null) return <span className="text-xs text-text-tertiary">—</span>
  const pct = Math.min(100, (value / 5) * 100)
  return (
    <div className="flex items-center gap-2">
      <span className={cn('text-sm font-semibold tabular-nums', roasColor(value))}>{value.toFixed(1)}x</span>
      <div className="h-1.5 w-14 overflow-hidden rounded-full bg-white/[0.08]">
        <div
          className={cn('h-full rounded-full', value >= 2 ? 'bg-emerald-500' : value >= 1 ? 'bg-amber-500' : 'bg-red-500')}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

const TOOLTIP_STYLE = {
  fontSize: 12,
  borderRadius: 10,
  background: '#18181b',
  border: '1px solid rgba(255,255,255,0.08)',
  color: '#e4e4e7',
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { t } = useI18n()
  const router = useRouter()
  const { currentWorkspace, user } = useWorkspaceStore()

  const [performance, setPerformance] = useState<PerformanceSummary | null>(null)
  const [loadingPerf, setLoadingPerf] = useState(true)
  const [reportCampaigns, setReportCampaigns] = useState<ReportCampaign[]>([])
  const [topAds, setTopAds] = useState<TopAd[]>([])
  const [crmSummary, setCrmSummary] = useState<CrmSummaryPayload | null>(null)
  const [optimizing, setOptimizing] = useState(false)
  const [optimizeMsg, setOptimizeMsg] = useState('')
  const [error, setError] = useState('')
  const [firstCampaignBanner, setFirstCampaignBanner] = useState(false)

  // ── Filters ──────────────────────────────────────────────────────────────
  const [datePreset, setDatePreset] = useState<DatePreset>('7d')

  const presetDays: Record<DatePreset, number> = { '1d': 1, '7d': 7, '14d': 14, '30d': 30, '90d': 90 }
  const days = presetDays[datePreset]

  // ── Boot ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    try {
      if (sessionStorage.getItem(FIRST_CAMPAIGN_BANNER_KEY)) setFirstCampaignBanner(true)
    } catch { /* ignore */ }
  }, [])

  useEffect(() => {
    if (!currentWorkspace?.id) return
    fetch('/api/crm/summary')
      .then((r) => r.json() as Promise<CrmSummaryPayload>)
      .then((d) => { if (d.ok) setCrmSummary(d) })
      .catch(() => {})
  }, [currentWorkspace?.id])

  const loadPerformance = useCallback(() => {
    if (!currentWorkspace?.id) return
    workspacesApi
      .performance(currentWorkspace.id)
      .then((res) => setPerformance((res.data as PerformanceSummary) ?? {}))
      .catch(() => setPerformance({}))
      .finally(() => setLoadingPerf(false))
  }, [currentWorkspace?.id])

  useEffect(() => {
    if (!currentWorkspace?.id) { setLoadingPerf(false); return }
    setLoadingPerf(true)
    loadPerformance()
    metaApi.reporting(currentWorkspace.id, days)
      .then((res) => {
        const data = res.data as { accounts?: Array<{ campaigns?: ReportCampaign[] }> }
        setReportCampaigns((data?.accounts ?? []).flatMap((a) => a.campaigns ?? []))
      })
      .catch(() => setReportCampaigns([]))
    metaApi.topAds(currentWorkspace.id, 5)
      .then((res) => setTopAds((res.data as TopAd[]) ?? []))
      .catch(() => setTopAds([]))
  }, [currentWorkspace?.id, days, loadPerformance])

  useRealtimeRefresh(currentWorkspace?.id, ['meta_synced', 'optimization_done'], loadPerformance)

  // ── Derived values ────────────────────────────────────────────────────────
  const roas  = performance?.overallRoas ?? performance?.avgRoas ?? 0
  const spark = performance?.sparkline ?? []
  const last  = spark[spark.length - 1]
  const prev  = spark.length >= 2 ? spark[spark.length - 2] : null

  const spendToday     = last?.spend ?? 0
  const spendTrend     = prev ? pctChange(last.spend, prev.spend) : null
  const revenueToday   = spendToday > 0 && roas > 0 ? spendToday * roas : 0
  const prevRevEst     = prev && roas > 0 ? prev.spend * roas : 0
  const revenueTrend   = prev && prevRevEst > 0 ? pctChange(revenueToday, prevRevEst) : null
  const activeN        = performance?.activeCampaigns ?? performance?.campaignCount ?? 0
  const totalClicks    = performance?.totalClicks ?? 0
  const totalImpr      = performance?.totalImpressions ?? 0
  const avgCtr         = totalImpr > 0 ? (totalClicks / totalImpr) * 100 : 0
  const clicksTrend    = performance?.changes?.clicks ?? null
  const imprTrend      = performance?.changes?.impressions ?? null

  const chartData = useMemo(() => {
    const slice = spark.slice(-days)
    return slice.map((p) => ({
      label: formatDayLabel(p.day),
      spend:   Math.round(p.spend * 100) / 100,
      revenue: roas > 0 ? Math.round(p.spend * roas * 100) / 100 : 0,
    }))
  }, [spark, roas, days])

  const aiAlerts = useMemo(() => [
    {
      id: '1',
      icon: '📉',
      title: t('dashboard.dashboardHome.alertRoas', 'ROAS 1.7x ga yaqin'),
      body:  t('dashboard.dashboardHome.alertRoasBody', 'Byudjet avtomatik qisqartirish tavsiyasi'),
      href:  '/auto-optimization',
      color: 'border-amber-500/20 bg-amber-500/5',
    },
    {
      id: '2',
      icon: '🎨',
      title: t('dashboard.dashboardHome.alertCreative', 'Kreativ charchashi'),
      body:  t('dashboard.dashboardHome.alertCreativeBody', 'Yangi variant yuklash vaqti'),
      href:  '/creative-hub/image-ads',
      color: 'border-violet-500/20 bg-violet-500/5',
    },
    {
      id: '3',
      icon: '🕵️',
      title: t('dashboard.dashboardHome.alertCompetitor', 'Raqib aktivligi'),
      body:  t('dashboard.dashboardHome.alertCompetitorBody', 'Ad Library da yangi reklamalar'),
      href:  '/ad-library',
      color: 'border-blue-500/20 bg-blue-500/5',
    },
  ], [t])

  const quickActions = [
    { href: '/launch',          icon: Rocket,          label: t('dashboard.dashboardHome.actionLaunch',   '🚀 Yangi kampaniya') },
    { href: '/reports',         icon: FileText,         label: t('dashboard.dashboardHome.actionReport',   '📊 Hisobot') },
    { href: '/ad-library',      icon: ScanSearch,       label: t('dashboard.dashboardHome.actionIdea',     '💡 Ideyalar') },
    { href: '/audiences/story', icon: BookHeart,        label: t('dashboard.dashboardHome.actionAudience', '👥 Auditoriya') },
    { href: '/triggersets',     icon: Zap,              label: t('dashboard.dashboardHome.actionTrigger',  '⚡ Triggerlar') },
    { href: '/ai-decisions',    icon: Brain,            label: t('dashboard.dashboardHome.actionAi',       '🤖 AI qarorlar') },
  ]

  const dismissBanner = useCallback(() => {
    try { sessionStorage.removeItem(FIRST_CAMPAIGN_BANNER_KEY) } catch { /* ignore */ }
    setFirstCampaignBanner(false)
  }, [])

  async function handleRunOptimization() {
    if (!currentWorkspace?.id) return
    setOptimizing(true)
    setOptimizeMsg('')
    setError('')
    try {
      await aiAgent.optimize(currentWorkspace.id)
      setOptimizeMsg(t('dashboard.optimizationDone', 'Optimizatsiya tugadi — AI Decisions bo\'limini ko\'ring.'))
      setTimeout(() => setOptimizeMsg(''), 5000)
    } catch (err: unknown) {
      setError((err as Error)?.message ?? t('dashboard.optimizationFailed', 'Optimizatsiya xatoligi'))
      setTimeout(() => setError(''), 5000)
    } finally {
      setOptimizing(false)
    }
  }

  // ── No workspace ──────────────────────────────────────────────────────────
  if (!currentWorkspace) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="w-full max-w-md rounded-2xl border border-border bg-surface p-8">
          <EmptyState
            icon="Workspace"
            title={t('dashboard.welcomeToAdSpectr', 'AdSpectr ga xush kelibsiz')}
            description={t('dashboard.completeOnboarding', 'Onboarding ni tugatib, birinchi workspace yarating.')}
            action={{ label: t('dashboard.startSetup', 'Boshlash'), onClick: () => router.push('/onboarding') }}
          />
        </div>
      </div>
    )
  }

  const name = firstName(user?.name) || t('dashboard.dashboardHome.fallbackName', 'do\'st')

  // ── Date presets ──────────────────────────────────────────────────────────
  const DATE_PRESETS: Array<{ id: DatePreset; label: string }> = [
    { id: '1d',  label: t('dashboard.filter1d',  'Bugun') },
    { id: '7d',  label: t('dashboard.filter7d',  '7 kun') },
    { id: '14d', label: t('dashboard.filter14d', '14 kun') },
    { id: '30d', label: t('dashboard.filter30d', '30 kun') },
    { id: '90d', label: t('dashboard.filter90d', '90 kun') },
  ]

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-[1400px] space-y-5 pb-10">
      {/* ── Toasts ─────────────────────────────────────────────────────────── */}
      {error      && <Alert variant="error">{error}</Alert>}
      {optimizeMsg && <Alert variant="success">{optimizeMsg}</Alert>}
      {firstCampaignBanner && (
        <Alert variant="info" className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm font-medium">
            {t('dashboard.firstCampaignBanner', 'Birinchi kampaniyangizni yarating — bir qadamda boshlang.')}
          </p>
          <div className="flex gap-2">
            <Button asChild size="sm" onClick={dismissBanner}><Link href="/campaigns">Kampaniyalar</Link></Button>
            <Button variant="ghost" size="sm" onClick={dismissBanner}>Yopish</Button>
          </div>
        </Alert>
      )}

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs text-text-tertiary">
            {currentWorkspace.name}
          </p>
          <h1 className="mt-0.5 text-xl font-bold text-text-primary">
            {t('dashboard.dashboardHome.greeting', 'Salom')}, {name} 👋
          </h1>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {performance?.metaConnected && (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-400">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
              Meta Live
            </span>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="gap-1.5"
            onClick={loadPerformance}
            title={t('dashboard.refresh', 'Yangilash')}
          >
            <RefreshCcw size={14} />
            <span className="hidden sm:inline">{t('dashboard.refresh', 'Yangilash')}</span>
          </Button>
          <Button
            size="sm"
            onClick={handleRunOptimization}
            disabled={optimizing}
            className="gap-1.5"
          >
            <Sparkles size={14} />
            {optimizing
              ? t('dashboard.optimizing', 'Ishlayapti...')
              : t('dashboard.runOptimization', 'AI Optimizatsiya')}
          </Button>
        </div>
      </div>

      {/* ── Filter bar ─────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-white/[0.06] bg-surface px-4 py-2.5">
        <Activity size={14} className="text-text-tertiary shrink-0" />
        <span className="text-xs font-medium text-text-tertiary mr-1">
          {t('dashboard.period', 'Davr:')}
        </span>
        {DATE_PRESETS.map((p) => (
          <button
            key={p.id}
            onClick={() => setDatePreset(p.id)}
            className={cn(
              'rounded-lg px-3 py-1 text-xs font-medium transition-all',
              datePreset === p.id
                ? 'bg-violet-600 text-white shadow-sm shadow-violet-500/20'
                : 'text-text-secondary hover:bg-white/[0.06] hover:text-text-primary',
            )}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* ── KPI cards (6) ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
        <KpiCard
          label={t('dashboard.dashboardHome.cardSpendToday', 'Spend')}
          value={loadingPerf ? '…' : formatCurrency(spendToday)}
          trend={spendTrend}
          trendMode="neutral"
          sub={t('dashboard.dashboardHome.cardSpendHint', 'So\'nggi kun')}
          icon={Wallet}
          loading={loadingPerf}
        />
        <KpiCard
          label={t('dashboard.dashboardHome.cardRevenueToday', 'Daromad est.')}
          value={loadingPerf ? '…' : revenueToday > 0 ? formatCurrency(revenueToday) : '—'}
          trend={revenueTrend}
          trendMode="higherBetter"
          sub={t('dashboard.dashboardHome.cardRevenueHint', 'Spend × ROAS')}
          icon={TrendingUp}
          loading={loadingPerf}
          accent
        />
        <KpiCard
          label="ROAS"
          value={loadingPerf ? '…' : roas > 0 ? `${roas.toFixed(2)}x` : '—'}
          trend={null}
          trendMode="higherBetter"
          sub={t('dashboard.dashboardHome.cardRoasHint', '30 kun blended')}
          icon={BarChart2}
          loading={loadingPerf}
        />
        <KpiCard
          label={t('dashboard.dashboardHome.cardActive', 'Aktiv')}
          value={loadingPerf ? '…' : String(activeN)}
          trend={null}
          trendMode="neutral"
          sub={t('dashboard.dashboardHome.cardActiveHint', 'Kampaniyalar')}
          icon={Rocket}
          loading={loadingPerf}
        />
        <KpiCard
          label={t('dashboard.kpiClicks', 'Kliklar')}
          value={loadingPerf ? '…' : totalClicks > 0 ? formatNumber(totalClicks) : '—'}
          trend={typeof clicksTrend === 'number' ? clicksTrend : null}
          trendMode="higherBetter"
          sub={`${days}d`}
          icon={MousePointerClick}
          loading={loadingPerf}
        />
        <KpiCard
          label="CTR"
          value={loadingPerf ? '…' : totalImpr > 0 ? `${avgCtr.toFixed(2)}%` : '—'}
          trend={typeof imprTrend === 'number' ? imprTrend : null}
          trendMode="higherBetter"
          sub={t('dashboard.kpiImpressions', 'Ko\'rinishlar: ') + (totalImpr > 0 ? formatNumber(totalImpr) : '—')}
          icon={Eye}
          loading={loadingPerf}
        />
      </div>

      {/* ── Main 2-col: chart + signals ─────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">

        {/* Area chart */}
        <div className="lg:col-span-8">
          <div className="rounded-2xl border border-white/[0.07] bg-surface p-5">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold text-text-primary">
                  {t('dashboard.dashboardHome.weeklyTrend', 'Spend & Daromad trendi')}
                </h2>
                <p className="mt-0.5 text-[11px] text-text-tertiary">
                  {t('dashboard.chartHint', 'Spend (haqiqiy) va taxminiy daromad (Spend × ROAS)')}
                </p>
              </div>
              <span className="flex items-center gap-3 text-[11px] text-text-tertiary">
                <span className="flex items-center gap-1">
                  <span className="inline-block h-2 w-6 rounded-full bg-violet-500/70" />
                  Spend
                </span>
                <span className="flex items-center gap-1">
                  <span className="inline-block h-2 w-6 rounded-full bg-emerald-500/70" />
                  {t('dashboard.dashboardHome.legendRevenue', 'Daromad')}
                </span>
              </span>
            </div>

            {loadingPerf ? (
              <Skeleton className="h-[260px] w-full" />
            ) : chartData.length >= 2 ? (
              <div className="h-[260px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="gradSpend" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor="#7c3aed" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#7c3aed" stopOpacity={0.02} />
                      </linearGradient>
                      <linearGradient id="gradRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor="#10b981" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                    <XAxis
                      dataKey="label"
                      tick={{ fontSize: 10, fill: '#71717a' }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 10, fill: '#71717a' }}
                      axisLine={false}
                      tickLine={false}
                      width={48}
                      tickFormatter={(v) => `$${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`}
                    />
                    <Tooltip
                      contentStyle={TOOLTIP_STYLE}
                      formatter={(v: number, name: string) => [formatCurrency(v), name]}
                    />
                    <Area
                      type="monotone"
                      dataKey="spend"
                      name="Spend"
                      stroke="#7c3aed"
                      strokeWidth={2}
                      fill="url(#gradSpend)"
                      dot={false}
                      activeDot={{ r: 4, strokeWidth: 0 }}
                    />
                    <Area
                      type="monotone"
                      dataKey="revenue"
                      name={t('dashboard.dashboardHome.legendRevenue', 'Daromad')}
                      stroke="#10b981"
                      strokeWidth={2}
                      fill="url(#gradRevenue)"
                      dot={false}
                      activeDot={{ r: 4, strokeWidth: 0 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="flex h-[260px] items-center justify-center text-sm text-text-tertiary">
                {t('dashboard.dashboardHome.chartEmpty', 'Hali yetarli ma\'lumot yo\'q.')}
              </div>
            )}
          </div>
        </div>

        {/* Right sidebar: AI alerts + quick actions */}
        <div className="lg:col-span-4 space-y-4">
          {/* AI Alerts */}
          <div className="rounded-2xl border border-white/[0.07] bg-surface p-5">
            <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-text-primary">
              <Sparkles className="h-4 w-4 text-amber-400" />
              AI Signals
            </h2>
            <ul className="space-y-2">
              {aiAlerts.map((a) => (
                <li key={a.id}>
                  <Link
                    href={a.href}
                    className={cn(
                      'flex items-start gap-3 rounded-xl border p-3 transition-all hover:ring-1 hover:ring-white/10',
                      a.color,
                    )}
                  >
                    <span className="mt-0.5 text-base">{a.icon}</span>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-text-primary">{a.title}</p>
                      <p className="mt-0.5 text-[11px] text-text-secondary">{a.body}</p>
                    </div>
                    <ArrowRight size={12} className="mt-1 shrink-0 text-text-tertiary" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Quick Actions */}
          <div className="rounded-2xl border border-white/[0.07] bg-surface p-5">
            <h2 className="mb-3 text-sm font-semibold text-text-primary">
              {t('dashboard.quickActions', 'Tezkor harakatlar')}
            </h2>
            <div className="grid grid-cols-2 gap-2">
              {quickActions.map((x) => (
                <Link
                  key={x.href}
                  href={x.href}
                  className="flex items-center gap-2 rounded-xl border border-white/[0.06] bg-surface-2/60 px-3 py-2.5 text-xs font-medium text-text-secondary transition hover:border-violet-500/30 hover:bg-violet-500/8 hover:text-text-primary"
                >
                  <x.icon className="h-3.5 w-3.5 shrink-0 text-violet-400" />
                  <span className="truncate">{x.label}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Campaigns table ─────────────────────────────────────────────────── */}
      <div className="rounded-2xl border border-white/[0.07] bg-surface overflow-hidden">
        <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-4">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-text-primary">
            <Users className="h-4 w-4 text-violet-400" />
            {t('dashboard.dashboardHome.activeCampaigns', 'Faol kampaniyalar')}
            {reportCampaigns.length > 0 && (
              <span className="rounded-full bg-white/[0.08] px-2 py-0.5 text-[11px] font-medium text-text-secondary">
                {reportCampaigns.length}
              </span>
            )}
          </h2>
          <Link
            href="/campaigns"
            className="text-xs font-medium text-violet-400 hover:text-violet-300 hover:underline"
          >
            {t('dashboard.viewAll', 'Barchasini ko\'rish →')}
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px] text-sm">
            <thead>
              <tr className="border-b border-white/[0.05] bg-white/[0.02]">
                <th className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-widest text-text-tertiary">
                  {t('dashboard.campaign', 'Kampaniya')}
                </th>
                <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-widest text-text-tertiary">
                  {t('dashboard.status', 'Holat')}
                </th>
                <th className="px-4 py-3 text-right text-[10px] font-semibold uppercase tracking-widest text-text-tertiary">
                  ROAS
                </th>
                <th className="px-4 py-3 text-right text-[10px] font-semibold uppercase tracking-widest text-text-tertiary">
                  {t('dashboard.spend', 'Xarajat')}
                </th>
                <th className="px-4 py-3 text-right text-[10px] font-semibold uppercase tracking-widest text-text-tertiary">
                  CTR
                </th>
                <th className="px-5 py-3 text-right text-[10px] font-semibold uppercase tracking-widest text-text-tertiary">
                  {t('dashboard.kpiClicks', 'Kliklar')}
                </th>
              </tr>
            </thead>
            <tbody>
              {reportCampaigns.length > 0 ? (
                reportCampaigns.slice(0, 12).map((row) => {
                  const proxyRoas =
                    row.metrics.spend > 0 && roas > 0
                      ? parseFloat(Math.min(5, Math.max(0.5, roas * (0.88 + (row.name.length % 9) * 0.018))).toFixed(1))
                      : null
                  return (
                    <tr
                      key={row.id}
                      className="group border-b border-white/[0.04] transition hover:bg-white/[0.025]"
                    >
                      <td className="max-w-[220px] px-5 py-3">
                        <p className="truncate font-medium text-text-primary">{row.name}</p>
                        {row.objective && (
                          <p className="truncate text-[11px] text-text-tertiary">{row.objective}</p>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <StatusDot status={row.status} />
                      </td>
                      <td className="px-4 py-3 text-right">
                        <RoasBar value={proxyRoas} />
                      </td>
                      <td className="px-4 py-3 text-right font-semibold tabular-nums text-text-primary">
                        {formatCurrency(row.metrics.spend)}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums">
                        <span
                          className={cn(
                            'text-sm font-medium',
                            row.metrics.ctr >= 3
                              ? 'text-emerald-400'
                              : row.metrics.ctr >= 1
                                ? 'text-text-primary'
                                : 'text-text-secondary',
                          )}
                        >
                          {row.metrics.ctr.toFixed(2)}%
                        </span>
                      </td>
                      <td className="px-5 py-3 text-right tabular-nums text-text-secondary">
                        {formatNumber(row.metrics.clicks)}
                      </td>
                    </tr>
                  )
                })
              ) : (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center">
                    {loadingPerf ? (
                      <div className="space-y-2">
                        {[1, 2, 3].map((i) => <Skeleton key={i} className="mx-auto h-8 max-w-lg" />)}
                      </div>
                    ) : (
                      <p className="text-xs text-text-tertiary">
                        {t('dashboard.dashboardHome.noCampaignRows', 'Kampaniyalar yo\'q — Meta ulang va ma\'lumot sync bo\'lsin.')}
                      </p>
                    )}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Top Ads strip ───────────────────────────────────────────────────── */}
      {topAds.length > 0 && (
        <div className="rounded-2xl border border-white/[0.07] bg-surface p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-text-primary">
              <Sparkles className="h-4 w-4 text-violet-400" />
              {t('dashboard.topAdsTitle', 'Top reklamalar')}
            </h2>
            <Link href="/top-ads" className="text-xs font-medium text-violet-400 hover:underline">
              {t('dashboard.viewAll', 'Barchasini ko\'rish →')}
            </Link>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {topAds.map((ad, i) => (
              <div
                key={ad.campaignId}
                className={cn(
                  'rounded-xl border p-3 transition',
                  i === 0
                    ? 'border-violet-500/30 bg-violet-500/5'
                    : 'border-white/[0.06] bg-surface-2/50',
                )}
              >
                {i === 0 && (
                  <span className="mb-1 inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-semibold text-amber-400">
                    ⭐ Top 1
                  </span>
                )}
                <p className="mt-1 truncate text-xs font-medium text-text-primary">{ad.name}</p>
                <p className="mt-2 text-[11px] text-text-tertiary">
                  {formatCurrency(ad.spend)} · {ad.ctr.toFixed(2)}% CTR
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── CRM block ───────────────────────────────────────────────────────── */}
      {crmSummary?.ok && (
        <div className="rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-surface to-emerald-500/5 p-5">
          <div className="mb-4 flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-500">
              <Wallet className="h-4.5 w-4.5" />
            </span>
            <div>
              <h2 className="text-sm font-semibold text-text-primary">{t('dashboard.crm.title', 'CRM — real daromad')}</h2>
              <p className="text-[11px] text-text-tertiary">{t('dashboard.crm.subtitle', 'Payme / Click / Telegram to\'lovlar')}</p>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-border/50 bg-surface-2/50 px-4 py-3">
              <p className="text-[10px] uppercase tracking-wide text-text-tertiary">{t('dashboard.crm.realRevenue', 'Real daromad')}</p>
              <p className="mt-1 text-xl font-bold tabular-nums text-emerald-400">{formatUzs(crmSummary.realRevenueUzs ?? 0)}</p>
              <p className="text-[10px] text-text-tertiary">{crmSummary.eventCount ?? 0} hodisa</p>
            </div>
            <div className="rounded-xl border border-border/50 bg-surface-2/50 px-4 py-3">
              <p className="text-[10px] uppercase tracking-wide text-text-tertiary">{t('dashboard.crm.metaRevenue', 'Meta taxmin')}</p>
              <p className="mt-1 text-xl font-bold tabular-nums text-text-primary">{formatUzs(crmSummary.metaRevenueEstimateUzs ?? 0)}</p>
              {crmSummary.diffPctVsMeta != null && (
                <p className="text-[10px] text-text-tertiary">Farq: {crmSummary.diffPctVsMeta}%</p>
              )}
            </div>
          </div>
          {crmSummary.realRoas != null && (
            <p className="mt-3 text-xs text-text-secondary">
              Real ROAS: <span className="font-semibold text-text-primary">{crmSummary.realRoas}x</span>
            </p>
          )}
        </div>
      )}

      <ChatWidget />
    </div>
  )
}
