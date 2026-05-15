'use client'
import { useMemo, useState } from 'react'
import { Link2, Loader2, Pencil, Plug, RefreshCcw, TrendingUp } from 'lucide-react'
import { useWorkspaceStore } from '@/stores/workspace.store'
import { useI18n } from '@/i18n/use-i18n'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Dialog } from '@/components/ui/Dialog'
import { Alert } from '@/components/ui/Alert'
import { PageHeader } from '@/components/ui'
import { Sparkline } from '@/components/ui/Sparkline'
import { PlatformIcon } from '@/components/ui/PlatformIcon'
import { workspaces as workspacesApi } from '@/lib/api-client'
import { connectMeta } from '@/lib/meta'
import { formatCurrency } from '@/lib/utils'
import { useBudgetData } from './_lib/use-budget-data'

const PLATFORM_META: Record<string, { color: string; label: string }> = {
  meta:     { color: '#0866FF', label: 'Meta' },
  google:   { color: '#34A853', label: 'Google Ads' },
  tiktok:   { color: '#FE2C55', label: 'TikTok' },
  yandex:   { color: '#FC3F1D', label: 'Yandex' },
  linkedin: { color: '#0A66C2', label: 'LinkedIn' },
}

type DonutSeg = { label: string; value: number; color: string }

function formatK(n: number): string {
  if (Math.abs(n) >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (Math.abs(n) >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return `${Math.round(n)}`
}

function BudgetDonut({
  segments,
  centerLabel,
  size = 148,
  strokeWidth = 20,
}: {
  segments: DonutSeg[]
  centerLabel: string
  size?: number
  strokeWidth?: number
}) {
  const radius = (size - strokeWidth) / 2
  const cx = size / 2
  const cy = size / 2
  const circumference = 2 * Math.PI * radius
  const total = segments.reduce((s, x) => s + x.value, 0) || 1
  let offset = 0

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle
        cx={cx}
        cy={cy}
        r={radius}
        fill="none"
        stroke="var(--c-surface-2)"
        strokeWidth={strokeWidth}
      />
      {segments.map((seg, i) => {
        const length = (seg.value / total) * circumference
        const dashArray = `${length} ${circumference - length}`
        const dashOffset = -offset
        offset += length
        return (
          <circle
            key={i}
            cx={cx}
            cy={cy}
            r={radius}
            fill="none"
            stroke={seg.color}
            strokeWidth={strokeWidth}
            strokeDasharray={dashArray}
            strokeDashoffset={dashOffset}
            transform={`rotate(-90 ${cx} ${cy})`}
            strokeLinecap="butt"
          />
        )
      })}
      <text
        x={cx}
        y={cy}
        textAnchor="middle"
        dominantBaseline="central"
        className="fill-text-primary font-bold"
        style={{ fontSize: '20px' }}
      >
        {centerLabel}
      </text>
    </svg>
  )
}

/**
 * Forecast line chart from real spend-forecast data.
 * Solid line for actual spend (days elapsed), dashed for projection.
 */
function ForecastChart({
  daily,
  daysElapsed,
}: {
  daily: { spend: number; isPredicted: boolean }[]
  daysElapsed: number
}) {
  if (daily.length < 2) {
    return <div className="h-32 text-xs text-text-tertiary flex items-center justify-center">Prognoz uchun ma&apos;lumot yetarli emas.</div>
  }
  const width = 320
  const height = 96
  const max = Math.max(...daily.map((d) => d.spend), 1)
  const step = width / (daily.length - 1)

  const actualPath = daily
    .slice(0, daysElapsed)
    .map((d, i) => {
      const x = i * step
      const y = height - (d.spend / max) * height
      return `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`
    })
    .join(' ')

  const predictedPath = daily
    .slice(daysElapsed - 1)
    .map((d, i) => {
      const x = (daysElapsed - 1 + i) * step
      const y = height - (d.spend / max) * height
      return `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`
    })
    .join(' ')

  return (
    <svg
      viewBox={`0 0 ${width} ${height + 8}`}
      className="w-full h-32"
      preserveAspectRatio="none"
    >
      <path d={actualPath} fill="none" stroke="#10B981" strokeWidth={2} strokeLinecap="round" />
      <path
        d={predictedPath}
        fill="none"
        stroke="#7C3AED"
        strokeWidth={2}
        strokeLinecap="round"
        strokeDasharray="4 4"
        opacity={0.85}
      />
    </svg>
  )
}

export default function BudgetPage() {
  const { t } = useI18n()
  const { currentWorkspace, setCurrentWorkspace } = useWorkspaceStore()
  const workspaceId = currentWorkspace?.id

  const data = useBudgetData(workspaceId)
  const [sliders, setSliders] = useState<Record<string, number>>({})

  // Budget editor modal
  const [editOpen, setEditOpen] = useState(false)
  const [editValue, setEditValue] = useState('')
  const [editBusy, setEditBusy] = useState(false)
  const [editError, setEditError] = useState<string | null>(null)

  const strategy = currentWorkspace?.aiStrategy
  const allocation: Record<string, number> = strategy?.budgetAllocation ?? {}
  const totalBudget = currentWorkspace?.monthlyBudget ?? 0

  const openEditor = () => {
    setEditValue(totalBudget ? String(totalBudget) : '')
    setEditError(null)
    setEditOpen(true)
  }

  const saveBudget = async () => {
    const amount = Number(editValue)
    if (!workspaceId || !amount || amount <= 0) return
    setEditBusy(true)
    setEditError(null)
    try {
      const res = await workspacesApi.update(workspaceId, { monthlyBudget: amount })
      const updated = (res.data as any) ?? null
      if (updated && currentWorkspace) {
        setCurrentWorkspace({ ...currentWorkspace, monthlyBudget: updated.monthlyBudget ?? amount })
      }
      setEditOpen(false)
    } catch (e: any) {
      setEditError(e?.message ?? 'Saqlab bo\'lmadi')
    } finally {
      setEditBusy(false)
    }
  }

  // ── Onboarding (no monthly budget set) ─────────────────────────────────
  if (!totalBudget) {
    return (
      <div className="space-y-6 max-w-5xl">
        <PageHeader
          title={t('budget.title', 'Byudjet')}
          subtitle={t(
            'budget.subtitle',
            'AI-optimallashtirilgan byudjet taqsimoti va prognoz.',
          )}
        />
        <div className="flex items-center justify-center min-h-[420px]">
          <Card className="max-w-sm w-full text-center" padding="lg">
            <div className="text-5xl mb-5">💰</div>
            <h2 className="text-xl font-bold text-text-primary mb-2">
              Oylik byudjetni o&apos;rnating
            </h2>
            <p className="text-text-tertiary text-sm mb-6">
              Oylik reklama byudjetingizni kiriting — AI uni avtomatik ravishda
              platformalar bo&apos;ylab taqsimlaydi.
            </p>
            <div className="relative mb-4">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-text-tertiary font-semibold text-base select-none">
                $
              </span>
              <input
                type="number"
                placeholder="5000"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                className="w-full pl-9 pr-4 py-3 bg-surface-2 border border-border rounded-xl text-text-primary text-lg font-bold focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40 transition-all"
              />
            </div>
            {editError && (
              <p className="mb-3 text-xs text-red-600">{editError}</p>
            )}
            <Button
              fullWidth
              size="lg"
              disabled={editBusy || !editValue || Number(editValue) <= 0}
              onClick={saveBudget}
            >
              {editBusy && <Loader2 className="h-4 w-4 animate-spin" />}
              Davom etish
            </Button>
          </Card>
        </div>
      </div>
    )
  }

  // ── Forecast / sparkline derived from real data ────────────────────────
  const dailyBudget = totalBudget / 30
  const dailySpendSeries = useMemo(
    () =>
      data.forecast
        ? data.forecast.daily
            .slice(0, data.forecast.daysElapsed)
            .map((d) => d.spend)
        : [],
    [data.forecast],
  )

  // ── Platform allocation: real AI strategy if present, otherwise the
  //     campaign-side spend breakdown from /workspaces/:id/performance.
  //     Falls back to a "Meta only" placeholder if neither is available. ──
  const hasRealAllocation = Object.keys(allocation).length > 0
  const rawPlatforms = hasRealAllocation
    ? Object.entries(allocation).map(([platform, pct]) => ({
        platform,
        percentage: Number(pct),
        color: PLATFORM_META[platform]?.color ?? '#7C3AED',
      }))
    : [{ platform: 'meta', percentage: 100, color: PLATFORM_META.meta.color }]

  const platformStats = rawPlatforms.map(({ platform, percentage, color }) => ({
    platform,
    percentage: sliders[platform] ?? percentage,
    color,
    label: PLATFORM_META[platform]?.label ?? platform,
    allocated: ((sliders[platform] ?? percentage) / 100) * totalBudget,
  }))

  const donutSegs: DonutSeg[] = platformStats.map(({ label, percentage, color }) => ({
    label,
    value: percentage,
    color,
  }))

  const forecast = data.forecast
  const performance = data.performance

  // KPI deltas: compare last 7 vs previous 7 days when we have enough data.
  const recent7 = forecast ? forecast.daily.slice(Math.max(0, forecast.daysElapsed - 7), forecast.daysElapsed).reduce((s, d) => s + d.spend, 0) : 0
  const prior7 = forecast ? forecast.daily.slice(Math.max(0, forecast.daysElapsed - 14), Math.max(0, forecast.daysElapsed - 7)).reduce((s, d) => s + d.spend, 0) : 0
  const wowDelta = prior7 > 0 ? ((recent7 - prior7) / prior7) * 100 : null

  return (
    <div className="space-y-6 max-w-5xl">
      <PageHeader
        title={t('budget.title', 'Byudjet')}
        subtitle={t('budget.subtitle', 'AI-optimallashtirilgan byudjet taqsimoti va prognoz.')}
        actions={
          <div className="flex items-center gap-2">
            {strategy?.autoRebalance && (
              <Badge variant="success" size="sm" dot>
                Auto-rebalance on
              </Badge>
            )}
            <Button
              variant="secondary"
              size="sm"
              onClick={data.refetch}
              disabled={data.loading}
              className="gap-1.5"
            >
              <RefreshCcw className={data.loading ? 'h-4 w-4 animate-spin' : 'h-4 w-4'} />
              Yangilash
            </Button>
            <Button variant="primary" size="md" onClick={openEditor} className="gap-1.5">
              <Pencil className="h-4 w-4" />
              Byudjetni o&apos;zgartirish
            </Button>
          </div>
        }
      />

      {data.error && <Alert variant="error">{data.error}</Alert>}

      {data.needsMetaConnect && workspaceId && (
        <Card className="border-dashed bg-surface-2/40">
          <div className="flex items-center gap-4">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-brand-mid/15">
              <Plug className="h-6 w-6 text-brand-mid dark:text-brand-lime" />
            </span>
            <div className="flex-1">
              <p className="text-sm font-semibold text-text-primary">
                Meta hisobini ulang
              </p>
              <p className="text-xs text-text-tertiary mt-0.5">
                Real harajat va prognoz uchun Meta Business hisobini ulashingiz
                kerak. Hozircha faqat oylik byudjet sozlamasi mavjud.
              </p>
            </div>
            <Button onClick={() => connectMeta(workspaceId)} className="gap-1.5">
              <Link2 className="h-4 w-4" />
              Ulash
            </Button>
          </div>
        </Card>
      )}

      {/* ── TOP METRICS (4 cards) ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-lg">💰</span>
            <p className="text-text-tertiary text-xs font-medium uppercase tracking-wide">
              Oylik byudjet
            </p>
          </div>
          <p className="text-xl font-bold text-text-primary">
            {formatCurrency(totalBudget)}
          </p>
          {forecast && (
            <p className="text-text-tertiary text-xs mt-1">
              {formatCurrency(forecast.spendToDate)} sarflandi
            </p>
          )}
        </Card>

        <Card>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-lg">📅</span>
              <p className="text-text-tertiary text-xs font-medium uppercase tracking-wide">
                Kunlik o&apos;rtacha
              </p>
            </div>
            {dailySpendSeries.length > 1 && (
              <Sparkline
                data={dailySpendSeries}
                width={48}
                height={20}
                positive={(wowDelta ?? 0) >= 0}
              />
            )}
          </div>
          <p className="text-xl font-bold text-text-primary">
            {formatCurrency(forecast?.avgDailySpend ?? dailyBudget)}
          </p>
          <p className="text-text-tertiary text-xs mt-1">
            {wowDelta == null
              ? 'Reja byudjeti'
              : `${wowDelta > 0 ? '+' : ''}${wowDelta.toFixed(1)}% (oxirgi 7 kun)`}
          </p>
        </Card>

        <Card>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-lg">📢</span>
            <p className="text-text-tertiary text-xs font-medium uppercase tracking-wide">
              Platformalar
            </p>
          </div>
          <p className="text-xl font-bold text-text-primary">
            {platformStats.length} ta
          </p>
          <div className="flex items-center gap-1 mt-2">
            {platformStats.slice(0, 3).map(({ platform }) => (
              <PlatformIcon key={platform} platform={platform} size="sm" />
            ))}
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-lg">📊</span>
            <p className="text-text-tertiary text-xs font-medium uppercase tracking-wide">
              Aktiv kampaniyalar
            </p>
          </div>
          <p className="text-xl font-bold text-text-primary">
            {performance?.activeCampaigns != null
              ? `${performance.activeCampaigns} ta`
              : '—'}
          </p>
          <p className="text-text-tertiary text-xs mt-1">
            Jami —{' '}
            {performance?.totalCampaigns != null
              ? `${performance.totalCampaigns} ta`
              : '—'}
          </p>
        </Card>
      </div>

      {/* ── MAIN 2-COLUMN ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* LEFT — Platform Allocation */}
        <Card>
          <div className="flex items-center gap-2 mb-5">
            <span className="text-lg">📊</span>
            <h2 className="font-semibold text-text-primary">
              Platforma taqsimoti
            </h2>
            {strategy && (
              <Badge variant="success" size="sm" dot>
                AI tavsiyasi
              </Badge>
            )}
            {!hasRealAllocation && (
              <Badge variant="gray" size="sm">
                Default
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-5 mb-6">
            <div className="shrink-0">
              <BudgetDonut
                segments={donutSegs}
                centerLabel={formatK(totalBudget)}
                size={148}
                strokeWidth={20}
              />
            </div>
            <div className="space-y-2.5 flex-1 min-w-0">
              {platformStats.map(({ platform, label, percentage, allocated, color }) => (
                <div key={platform} className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
                  <span className="text-text-secondary text-xs flex-1 truncate">{label}</span>
                  <span className="text-text-primary text-xs font-bold tabular-nums">{percentage}%</span>
                  <span className="text-text-tertiary text-xs tabular-nums">{formatCurrency(allocated)}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-4 mb-5">
            {platformStats.map(({ platform, label, percentage, allocated, color }) => (
              <div key={platform}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <PlatformIcon platform={platform} size="sm" />
                    <span className="text-text-primary text-sm font-medium">{label}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-text-primary font-bold text-sm tabular-nums">{percentage}%</span>
                    <span className="text-text-tertiary text-xs tabular-nums">{formatCurrency(allocated)}</span>
                  </div>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={percentage}
                  onChange={(e) =>
                    setSliders((prev) => ({ ...prev, [platform]: Number(e.target.value) }))
                  }
                  className="w-full h-1.5 rounded-full cursor-pointer appearance-none bg-surface-2"
                  style={{ accentColor: color }}
                />
              </div>
            ))}
          </div>

          {Object.keys(sliders).length > 0 && (
            <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-3 flex items-center gap-3">
              <span className="text-base">⚠️</span>
              <p className="flex-1 text-amber-700 text-xs dark:text-amber-300">
                Slider o&apos;zgarishlari hozircha lokal. Saqlash uchun AI strategiyasini
                yangilash kerak — bu funksiya keyingi iteratsiyada qo&apos;shiladi.
              </p>
              <button
                type="button"
                onClick={() => setSliders({})}
                className="shrink-0 text-xs font-medium text-amber-700 hover:underline dark:text-amber-300"
              >
                Tiklash
              </button>
            </div>
          )}
        </Card>

        {/* RIGHT — Monthly Forecast */}
        <Card>
          <div className="flex items-center gap-2 mb-5">
            <span className="text-lg">🎯</span>
            <h2 className="font-semibold text-text-primary">Oylik prognoz</h2>
            {forecast && (
              <Badge variant="success" size="sm" dot>
                Real ma&apos;lumot
              </Badge>
            )}
          </div>

          {data.loading && !forecast && (
            <div className="flex items-center justify-center py-12 gap-2 text-text-tertiary">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm">Prognoz yuklanmoqda…</span>
            </div>
          )}

          {forecast && (
            <>
              <div className="grid grid-cols-3 gap-3 mb-5">
                <div className="bg-surface-2 border border-border rounded-xl p-3 flex flex-col gap-1">
                  <div className="text-base">📅</div>
                  <p className="text-text-tertiary text-xs leading-snug">Sarflandi</p>
                  <p className="text-text-primary font-bold text-lg tabular-nums">
                    {formatCurrency(forecast.spendToDate)}
                  </p>
                  <span className="text-text-tertiary text-xs">
                    {forecast.daysElapsed}/{forecast.daysTotal} kun
                  </span>
                </div>
                <div className="bg-surface-2 border border-border rounded-xl p-3 flex flex-col gap-1">
                  <div className="text-base">📈</div>
                  <p className="text-text-tertiary text-xs leading-snug">Oy oxiriga prognoz</p>
                  <p className="text-text-primary font-bold text-lg tabular-nums">
                    {formatCurrency(forecast.predictedTotal)}
                  </p>
                  <span
                    className={
                      forecast.predictedTotal > totalBudget
                        ? 'text-red-500 text-xs font-semibold'
                        : 'text-emerald-500 text-xs font-semibold'
                    }
                  >
                    {totalBudget > 0
                      ? `${forecast.predictedTotal > totalBudget ? '+' : ''}${(((forecast.predictedTotal - totalBudget) / totalBudget) * 100).toFixed(0)}% byudjetdan`
                      : '—'}
                  </span>
                </div>
                <div className="bg-surface-2 border border-border rounded-xl p-3 flex flex-col gap-1">
                  <div className="text-base">📊</div>
                  <p className="text-text-tertiary text-xs leading-snug">O&apos;rtacha ROAS</p>
                  <p className="text-text-primary font-bold text-lg tabular-nums">
                    {performance?.averageRoas != null
                      ? `${Number(performance.averageRoas).toFixed(2)}x`
                      : '—'}
                  </p>
                  {performance?.totalRevenue != null && (
                    <span className="text-text-tertiary text-xs">
                      {formatCurrency(performance.totalRevenue)} daromad
                    </span>
                  )}
                </div>
              </div>

              <div className="mb-3 -mx-1">
                <ForecastChart
                  daily={forecast.daily}
                  daysElapsed={forecast.daysElapsed}
                />
              </div>

              <div className="flex items-center gap-5 px-1 mb-4">
                <div className="flex items-center gap-1.5">
                  <span className="w-5 h-0.5 bg-emerald-500 rounded-full inline-block" />
                  <span className="text-xs text-text-tertiary">Sarflandi (haqiqiy)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span
                    className="inline-block w-5"
                    style={{ height: 1, borderTop: '2px dashed #7C3AED', opacity: 0.85 }}
                  />
                  <span className="text-xs text-text-tertiary">Prognoz</span>
                </div>
              </div>

              <p className="text-text-tertiary text-xs border-t border-border/60 pt-3">
                * Prognoz oxirgi {forecast.daysElapsed} kun bo&apos;yicha o&apos;rtacha
                kunlik harajat asosida hisoblanadi.
              </p>
            </>
          )}

          {!data.loading && !forecast && !data.needsMetaConnect && (
            <div className="flex flex-col items-center gap-2 py-10 text-center">
              <TrendingUp className="h-10 w-10 text-text-tertiary" />
              <p className="text-sm text-text-primary">Prognoz uchun ma&apos;lumot yo&apos;q</p>
              <p className="text-xs text-text-tertiary max-w-xs">
                Kampaniya ishga tushirilgach va Meta sync amalga oshgach,
                bu yerda real prognoz paydo bo&apos;ladi.
              </p>
            </div>
          )}
        </Card>
      </div>

      {/* Budget editor dialog */}
      <Dialog
        open={editOpen}
        onClose={() => setEditOpen(false)}
        title="Oylik byudjetni o'zgartirish"
        className="max-w-md"
      >
        <p className="text-sm text-text-secondary mb-4">
          Oylik reklama byudjeti AI tavsiyalari va prognoz hisoblash uchun
          ishlatiladi.
        </p>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary font-semibold">
            $
          </span>
          <input
            type="number"
            min={1}
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            className="w-full pl-8 pr-3 py-2.5 rounded-lg border border-border bg-surface text-sm"
          />
        </div>
        {editError && (
          <p className="mt-2 text-xs text-red-600">{editError}</p>
        )}
        <div className="mt-5 flex justify-end gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setEditOpen(false)}
            disabled={editBusy}
          >
            Bekor qilish
          </Button>
          <Button
            size="sm"
            onClick={saveBudget}
            disabled={editBusy || !editValue || Number(editValue) <= 0}
            className="gap-1.5"
          >
            {editBusy && <Loader2 className="h-4 w-4 animate-spin" />}
            Saqlash
          </Button>
        </div>
      </Dialog>
    </div>
  )
}
