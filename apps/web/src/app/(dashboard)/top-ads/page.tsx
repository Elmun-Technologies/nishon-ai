'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Calendar,
  DollarSign,
  Download,
  ExternalLink,
  Eye,
  Film,
  Images,
  Info,
  MousePointerClick,
  RefreshCcw,
  Search,
  Sparkles,
  Star,
  TrendingUp,
  X,
} from 'lucide-react'
import { useWorkspaceStore } from '@/stores/workspace.store'
import { useI18n } from '@/i18n/use-i18n'
import { meta as metaApi } from '@/lib/api-client'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { PageSpinner } from '@/components/ui/Spinner'
import { Sparkline } from '@/components/ui/Sparkline'
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
  format?: 'carousel' | 'video' | 'image'
  copy?: string
  trend?: number[]
}

type SortKey = 'spend' | 'clicks' | 'impressions' | 'ctr' | 'cpc'
type SortDir = 'asc' | 'desc'

// ─── Demo data ──────────────────────────────────────────────────────────────────

const DEMO_ADS: TopAd[] = [
  { campaignId: 'c1', name: 'Spring Sale — Carousel 🛍️', status: 'ACTIVE', spend: 3420, clicks: 18500, impressions: 412000, ctr: 4.49, format: 'carousel', copy: 'Весенняя распродажа — скидки до 40% на избранные категории. Успей до конца недели!', trend: [12, 18, 22, 19, 28, 34, 42] },
  { campaignId: 'c2', name: 'Retargeting — Cart Abandoners', status: 'ACTIVE', spend: 2180, clicks: 9400, impressions: 185000, ctr: 5.08, format: 'image', copy: 'Ты оставил товары в корзине. Оформи заказ сегодня и получи бесплатную доставку.', trend: [20, 21, 25, 28, 32, 30, 35] },
  { campaignId: 'c3', name: 'Brand Video 30s — Awareness', status: 'ACTIVE', spend: 1950, clicks: 5200, impressions: 620000, ctr: 0.84, format: 'video', copy: 'Бренд, которому доверяют миллионы. Открой новую эру комфорта.', trend: [30, 28, 26, 22, 18, 16, 14] },
  { campaignId: 'c4', name: 'UGC Testimonial — Reels', status: 'ACTIVE', spend: 1740, clicks: 12800, impressions: 298000, ctr: 4.30, format: 'video', copy: 'Реальные отзывы от реальных клиентов. Смотри и убеждайся.', trend: [10, 14, 20, 24, 28, 30, 32] },
  { campaignId: 'c5', name: 'Lookalike 1% — Conversions', status: 'PAUSED', spend: 1520, clicks: 7600, impressions: 164000, ctr: 4.63, format: 'image', copy: 'Похожая аудитория — схожие интересы. Попади в яблочко.', trend: [18, 20, 22, 24, 20, 16, 14] },
  { campaignId: 'c6', name: 'Dynamic Product Ads', status: 'ACTIVE', spend: 1380, clicks: 9100, impressions: 227000, ctr: 4.01, format: 'carousel', copy: 'Динамические объявления — персональные рекомендации для каждого.', trend: [16, 18, 22, 20, 24, 26, 28] },
  { campaignId: 'c7', name: 'Lead Form — Free Consultation', status: 'ACTIVE', spend: 1050, clicks: 4300, impressions: 98000, ctr: 4.39, format: 'image', copy: 'Бесплатная консультация эксперта — оставь заявку за 30 секунд.', trend: [12, 14, 18, 20, 22, 22, 24] },
  { campaignId: 'c8', name: 'Prospecting — Interest Stack', status: 'ACTIVE', spend: 890, clicks: 3800, impressions: 142000, ctr: 2.68, format: 'image', copy: 'Для тех, кто ищет что-то особенное. Открой новые горизонты.', trend: [14, 15, 16, 16, 18, 18, 20] },
  { campaignId: 'c9', name: 'Cold — Broad Match Test', status: 'PAUSED', spend: 740, clicks: 2200, impressions: 89000, ctr: 2.47, format: 'image', copy: 'Тестовая кампания на широкую аудиторию.', trend: [20, 18, 16, 14, 12, 10, 10] },
  { campaignId: 'c10', name: 'eRFM Gold — Upsell', status: 'ACTIVE', spend: 680, clicks: 5600, impressions: 112000, ctr: 5.0, format: 'carousel', copy: 'Премиальное предложение для самых ценных клиентов.', trend: [8, 10, 14, 18, 22, 26, 30] },
]

const LIMIT_OPTIONS = [10, 25, 50]

// ─── Helpers ───────────────────────────────────────────────────────────────────

function calcCpc(ad: TopAd) {
  return ad.clicks > 0 ? ad.spend / ad.clicks : 0
}

function ctrColor(ctr: number) {
  if (ctr >= 4) return 'text-emerald-500 dark:text-emerald-400'
  if (ctr >= 2) return 'text-emerald-600/80 dark:text-emerald-300/90'
  if (ctr < 1) return 'text-red-500 dark:text-red-400'
  return 'text-text-secondary'
}

function cpcColor(cpc: number) {
  if (cpc === 0) return 'text-text-tertiary'
  if (cpc <= 0.25) return 'text-emerald-500 dark:text-emerald-400'
  if (cpc <= 0.5) return 'text-emerald-600/80 dark:text-emerald-300/90'
  if (cpc >= 1) return 'text-amber-500 dark:text-amber-400'
  return 'text-text-secondary'
}

function FormatIcon({ format }: { format?: TopAd['format'] }) {
  const base = 'h-3 w-3'
  if (format === 'carousel') return <Images className={cn(base, 'text-sky-500')} aria-label="Carousel" />
  if (format === 'video') return <Film className={cn(base, 'text-fuchsia-500')} aria-label="Video" />
  return <Images className={cn(base, 'text-slate-400')} aria-label="Image" />
}

function StatusPill({ status }: { status: string }) {
  const style =
    status === 'ACTIVE'
      ? 'bg-emerald-500/10 text-emerald-600 ring-1 ring-inset ring-emerald-500/20 dark:text-emerald-400'
      : status === 'PAUSED'
        ? 'bg-amber-500/10 text-amber-600 ring-1 ring-inset ring-amber-500/20 dark:text-amber-400'
        : 'bg-red-500/10 text-red-600 ring-1 ring-inset ring-red-500/20 dark:text-red-400'
  const label = status === 'ACTIVE' ? 'Активно' : status === 'PAUSED' ? 'Приостановлено' : status
  const dot =
    status === 'ACTIVE' ? 'bg-emerald-500' : status === 'PAUSED' ? 'bg-amber-500' : 'bg-red-500'
  return (
    <span className={cn('inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium', style)}>
      <span className={cn('h-1.5 w-1.5 rounded-full', dot)} />
      {label}
    </span>
  )
}

function Thumbnail({ format }: { format?: TopAd['format'] }) {
  const Icon = format === 'video' ? Film : Images
  const tint =
    format === 'video'
      ? 'from-fuchsia-500/20 to-purple-500/10 text-fuchsia-500'
      : format === 'carousel'
        ? 'from-sky-500/20 to-cyan-500/10 text-sky-500'
        : 'from-slate-500/15 to-slate-400/5 text-slate-500'
  return (
    <div className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br ring-1 ring-inset ring-border/60', tint)}>
      <Icon className="h-4 w-4" />
    </div>
  )
}

function SortIcon({ col, sortKey, sortDir }: { col: SortKey; sortKey: SortKey; sortDir: SortDir }) {
  if (col !== sortKey) return <ArrowUpDown size={12} className="opacity-30 group-hover:opacity-60" />
  return sortDir === 'desc' ? (
    <ArrowDown size={12} className="text-primary" />
  ) : (
    <ArrowUp size={12} className="text-primary" />
  )
}

// ─── Side panel ────────────────────────────────────────────────────────────────

function AdPreviewPanel({ ad, onClose }: { ad: TopAd | null; onClose: () => void }) {
  useEffect(() => {
    if (!ad) return
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onEsc)
    return () => document.removeEventListener('keydown', onEsc)
  }, [ad, onClose])

  if (!ad) return null
  const cpc = calcCpc(ad)
  return (
    <div className="fixed inset-0 z-50">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label={ad.name}
        className="absolute right-0 top-0 flex h-full w-full max-w-md flex-col overflow-y-auto border-l border-border bg-surface shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-border/70 p-5">
          <div className="min-w-0">
            <p className="text-[11px] uppercase tracking-wide text-text-tertiary">Предпросмотр креатива</p>
            <h3 className="mt-1 truncate text-lg font-semibold text-text-primary">{ad.name}</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Закрыть"
            className="rounded-lg p-1.5 text-text-tertiary hover:bg-surface-2 hover:text-text-primary"
          >
            <X size={18} />
          </button>
        </div>

        <div className="space-y-5 p-5">
          {/* Creative thumb */}
          <div className="relative flex aspect-[4/5] w-full items-center justify-center overflow-hidden rounded-xl border border-border/60 bg-gradient-to-br from-primary/10 via-fuchsia-500/10 to-sky-500/10">
            <div className="flex flex-col items-center gap-2 text-text-tertiary">
              {ad.format === 'video' ? (
                <Film className="h-10 w-10" />
              ) : (
                <Images className="h-10 w-10" />
              )}
              <p className="text-xs">Превью креатива</p>
            </div>
            <span className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-black/60 px-2 py-0.5 text-[11px] font-medium text-white backdrop-blur">
              <FormatIcon format={ad.format} />
              {ad.format === 'video' ? 'Видео' : ad.format === 'carousel' ? 'Карусель' : 'Изображение'}
            </span>
          </div>

          {/* Copy */}
          <div>
            <p className="mb-2 text-[11px] uppercase tracking-wide text-text-tertiary">Текст объявления</p>
            <p className="rounded-xl border border-border/60 bg-surface-2/50 p-3 text-sm leading-relaxed text-text-primary">
              {ad.copy ?? '—'}
            </p>
          </div>

          {/* Metrics */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Бюджет', value: formatCurrency(ad.spend) },
              { label: 'Клики', value: formatNumber(ad.clicks) },
              { label: 'Показы', value: formatNumber(ad.impressions) },
              { label: 'CTR', value: `${ad.ctr.toFixed(2)}%` },
              { label: 'CPC', value: cpc > 0 ? `$${cpc.toFixed(2)}` : '—' },
              { label: 'ID', value: ad.campaignId },
            ].map((m) => (
              <div key={m.label} className="rounded-lg border border-border/50 bg-surface-2/40 p-3">
                <p className="text-[11px] text-text-tertiary">{m.label}</p>
                <p className="mt-0.5 text-sm font-semibold text-text-primary tabular-nums">{m.value}</p>
              </div>
            ))}
          </div>

          {/* Performance chart */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <p className="text-[11px] uppercase tracking-wide text-text-tertiary">Динамика эффективности (7д)</p>
              <span className="text-[11px] text-text-tertiary">CTR тренд</span>
            </div>
            <div className="rounded-xl border border-border/60 bg-surface-2/40 p-4">
              {ad.trend && ad.trend.length > 1 ? (
                <Sparkline data={ad.trend} width={320} height={80} positive={ad.trend[ad.trend.length - 1] >= ad.trend[0]} />
              ) : (
                <p className="text-xs text-text-tertiary">Недостаточно данных</p>
              )}
            </div>
          </div>

          <Button variant="primary" fullWidth>
            <Sparkles className="h-4 w-4" />
            Создать похожий
          </Button>
        </div>
      </aside>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function TopAdsPage() {
  const { t: _t } = useI18n()
  const { currentWorkspace } = useWorkspaceStore()

  const [ads, setAds] = useState<TopAd[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [isDemo, setIsDemo] = useState(false)
  const [demoDismissed, setDemoDismissed] = useState(false)
  const [limit, setLimit] = useState(10)
  const [sortKey, setSortKey] = useState<SortKey>('spend')
  const [sortDir, setSortDir] = useState<SortDir>('desc')
  const [search, setSearch] = useState('')
  const [selectedAd, setSelectedAd] = useState<TopAd | null>(null)

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

  useEffect(() => {
    fetchAds()
  }, [fetchAds])

  function handleSort(key: SortKey) {
    if (key === sortKey) {
      setSortDir((d) => (d === 'desc' ? 'asc' : 'desc'))
    } else {
      setSortKey(key)
      setSortDir('desc')
    }
  }

  const sorted = useMemo(() => {
    const rows = ads.filter((a) => !search || a.name.toLowerCase().includes(search.toLowerCase()))
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
  const ctrBenchmark = 5
  const ctrPct = Math.min(100, (avgCtr / ctrBenchmark) * 100)

  const COLS: Array<{ key: SortKey; label: string }> = [
    { key: 'spend', label: 'Бюджет' },
    { key: 'clicks', label: 'Клики' },
    { key: 'impressions', label: 'Показы' },
    { key: 'ctr', label: 'CTR' },
    { key: 'cpc', label: 'CPC' },
  ]

  if (loading) return <PageSpinner />

  return (
    <div className="space-y-6">
      {/* ─── Header ──────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-3 rounded-2xl border border-border/70 bg-white/80 p-4 shadow-sm backdrop-blur-sm dark:bg-slate-900/60 md:flex-row md:items-center md:justify-between md:p-6">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold tracking-tight text-text-primary md:text-[1.7rem]">
            Топ объявлений
          </h1>
          <p className="mt-1.5 text-body text-text-secondary">
            Лучшие объявления, отсортированные по затратам и вовлечённости
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-xl border border-border/70 bg-white/70 px-3 py-2 text-sm font-medium text-text-secondary shadow-sm transition hover:border-border hover:text-text-primary dark:bg-slate-900/60"
          >
            <Calendar size={15} className="text-text-tertiary" />
            <span>Последние 7 дней</span>
            <ArrowDown size={12} className="text-text-tertiary" />
          </button>
          <Button variant="secondary" size="md">
            <Download size={15} />
            Экспорт
          </Button>
        </div>
      </div>

      {/* ─── Info banner ──────────────────────────────────────────────────── */}
      {isDemo && !demoDismissed && (
        <div className="flex items-start gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-300">
          <Info size={16} className="mt-0.5 shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="font-medium">Отображаются демо-данные</p>
            <p className="mt-0.5 text-emerald-700/80 dark:text-emerald-300/80">
              Подключите рекламный аккаунт Meta, чтобы увидеть реальные топ-объявления.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setDemoDismissed(true)}
            aria-label="Скрыть уведомление"
            className="shrink-0 rounded-md p-1 text-emerald-700/70 hover:bg-emerald-500/15 hover:text-emerald-700 dark:text-emerald-300/70 dark:hover:text-emerald-300"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-500">
          {error}
        </div>
      )}

      {/* ─── Summary cards ───────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total spend */}
        <Card className="flex h-full flex-col justify-between p-4 transition hover:-translate-y-0.5 hover:shadow-md">
          <div className="flex items-start justify-between">
            <p className="text-xs text-text-tertiary">Общий бюджет</p>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-500">
              <DollarSign size={14} />
            </div>
          </div>
          <div className="mt-2">
            <p className="text-xl font-semibold text-text-primary tabular-nums">
              {formatCurrency(totalSpend)}
            </p>
            <div className="mt-1 flex items-center gap-1 text-[11px]">
              <TrendingUp size={11} className="text-emerald-500" />
              <span className="font-medium text-emerald-500">+12%</span>
              <span className="text-text-tertiary">vs пред. период</span>
            </div>
          </div>
        </Card>

        {/* Total clicks */}
        <Card className="flex h-full flex-col justify-between p-4 transition hover:-translate-y-0.5 hover:shadow-md">
          <div className="flex items-start justify-between">
            <p className="text-xs text-text-tertiary">Всего кликов</p>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-sky-500/10 text-sky-500">
              <MousePointerClick size={14} />
            </div>
          </div>
          <div className="mt-2">
            <p className="text-xl font-semibold text-text-primary tabular-nums">
              {formatNumber(totalClicks)}
            </p>
            <p className="mt-1 text-[11px] text-text-tertiary">
              Средний CTR <span className="font-medium text-text-secondary">{avgCtr.toFixed(2)}%</span>
            </p>
          </div>
        </Card>

        {/* Impressions */}
        <Card className="flex h-full flex-col justify-between p-4 transition hover:-translate-y-0.5 hover:shadow-md">
          <div className="flex items-start justify-between">
            <p className="text-xs text-text-tertiary">Показы</p>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-fuchsia-500/10 text-fuchsia-500">
              <Eye size={14} />
            </div>
          </div>
          <div className="mt-2">
            <p className="text-xl font-semibold text-text-primary tabular-nums">
              {formatNumber(totalImpressions)}
            </p>
            <p className="mt-1 text-[11px] text-text-tertiary">
              По {ads.length} объявлениям
            </p>
          </div>
        </Card>

        {/* Avg CTR with progress */}
        <Card className="flex h-full flex-col justify-between p-4 transition hover:-translate-y-0.5 hover:shadow-md">
          <div className="flex items-start justify-between">
            <p className="text-xs text-text-tertiary">Средний CTR</p>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500/10 text-amber-500">
              <TrendingUp size={14} />
            </div>
          </div>
          <div className="mt-2">
            <p className="text-xl font-semibold text-text-primary tabular-nums">
              {avgCtr.toFixed(2)}%
            </p>
            <div className="mt-2">
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-2">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-amber-400 to-emerald-500 transition-all duration-500"
                  style={{ width: `${ctrPct}%` }}
                />
              </div>
              <p className="mt-1 text-[11px] text-text-tertiary">
                Бенчмарк: <span className="font-medium text-text-secondary">{ctrBenchmark}%</span>
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* ─── Table controls ──────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="relative w-full max-w-xs">
          <Search
            size={14}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary"
          />
          <input
            type="text"
            placeholder="Поиск по названию..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-9 w-full rounded-lg border border-border/70 bg-surface-2 pl-8 pr-3 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-text-tertiary">Показать:</span>
          <div className="inline-flex items-center gap-0.5 rounded-lg bg-surface-2 p-0.5">
            {LIMIT_OPTIONS.map((n) => (
              <button
                key={n}
                onClick={() => setLimit(n)}
                className={cn(
                  'rounded-md px-3 py-1 text-xs font-medium transition',
                  limit === n
                    ? 'bg-surface text-text-primary shadow-sm'
                    : 'text-text-secondary hover:text-text-primary',
                )}
              >
                {n}
              </button>
            ))}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={fetchAds}
            aria-label="Обновить"
            className="ml-1"
          >
            <RefreshCcw size={14} />
          </Button>
        </div>
      </div>

      {/* ─── Main table ──────────────────────────────────────────────────── */}
      <Card className="overflow-hidden p-0">
        {sorted.length === 0 ? (
          <EmptyState
            icon={<Star size={32} className="text-text-tertiary" />}
            title="Объявления не найдены"
            description="Попробуйте изменить поиск или подключите рекламный аккаунт Meta."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[880px] text-sm">
              <thead className="bg-surface-2/40">
                <tr className="border-b border-border/60">
                  <th className="w-10 px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-text-tertiary">
                    #
                  </th>
                  <th className="w-10 px-2 py-3" />
                  <th className="px-3 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-text-tertiary">
                    Название
                  </th>
                  <th className="px-3 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-text-tertiary">
                    Статус
                  </th>
                  {COLS.map((col) => (
                    <th
                      key={col.key}
                      className="group cursor-pointer select-none px-3 py-3 text-right text-[11px] font-semibold uppercase tracking-wide text-text-tertiary transition hover:text-text-primary"
                      onClick={() => handleSort(col.key)}
                    >
                      <span className="inline-flex items-center justify-end gap-1">
                        {col.label}
                        <SortIcon col={col.key} sortKey={sortKey} sortDir={sortDir} />
                      </span>
                    </th>
                  ))}
                  <th className="w-32 px-3 py-3" />
                </tr>
              </thead>
              <tbody>
                {sorted.map((ad, i) => {
                  const cpc = calcCpc(ad)
                  const isTop = i === 0
                  return (
                    <tr
                      key={ad.campaignId}
                      onClick={() => setSelectedAd(ad)}
                      className={cn(
                        'group cursor-pointer border-b border-border/40 transition',
                        isTop
                          ? 'bg-amber-400/[0.08] hover:bg-amber-400/[0.12]'
                          : i % 2 === 1
                            ? 'bg-surface-2/30 hover:bg-primary/[0.04]'
                            : 'hover:bg-primary/[0.04]',
                      )}
                    >
                      <td className="px-4 py-3 text-xs text-text-tertiary tabular-nums">
                        {isTop ? (
                          <Star size={14} className="text-amber-400" fill="currentColor" />
                        ) : (
                          i + 1
                        )}
                      </td>
                      <td className="px-2 py-3">
                        <Thumbnail format={ad.format} />
                      </td>
                      <td className="max-w-[280px] px-3 py-3">
                        <div className="flex items-center gap-1.5">
                          <p className="truncate font-semibold text-text-primary">{ad.name}</p>
                          <FormatIcon format={ad.format} />
                        </div>
                        <p className="truncate text-[11px] text-text-tertiary">
                          ID: {ad.campaignId}
                        </p>
                      </td>
                      <td className="px-3 py-3">
                        <StatusPill status={ad.status} />
                      </td>
                      <td className="px-3 py-3 text-right font-semibold text-text-primary tabular-nums">
                        {formatCurrency(ad.spend)}
                      </td>
                      <td className="px-3 py-3 text-right text-text-secondary tabular-nums">
                        {formatNumber(ad.clicks)}
                      </td>
                      <td className="px-3 py-3 text-right text-text-secondary tabular-nums">
                        {formatNumber(ad.impressions)}
                      </td>
                      <td className="px-3 py-3 text-right tabular-nums">
                        <span className={cn('font-semibold', ctrColor(ad.ctr))}>
                          {ad.ctr.toFixed(2)}%
                        </span>
                      </td>
                      <td className="px-3 py-3 text-right tabular-nums">
                        <span className={cn('font-medium', cpcColor(cpc))}>
                          {cpc > 0 ? `$${cpc.toFixed(2)}` : '—'}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-right">
                        <span className="invisible inline-flex items-center gap-1 rounded-lg border border-border/60 bg-surface px-2 py-1 text-[11px] font-medium text-text-secondary shadow-sm transition group-hover:visible">
                          <Eye size={11} />
                          Просмотреть
                        </span>
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
        Данные получены из подключённых рекламных аккаунтов Meta через Marketing API.{' '}
        <a href="/reporting" className="inline-flex items-center gap-0.5 text-primary hover:underline">
          Полный отчёт
          <ExternalLink size={11} />
        </a>
      </p>

      <AdPreviewPanel ad={selectedAd} onClose={() => setSelectedAd(null)} />
    </div>
  )
}
