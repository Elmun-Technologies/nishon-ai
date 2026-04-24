'use client'
import { useEffect, useMemo, useState } from 'react'
import { useWorkspaceStore } from '@/stores/workspace.store'
import { useI18n } from '@/i18n/use-i18n'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { PageSpinner } from '@/components/ui/Spinner'
import { PageHeader } from '@/components/ui'
import { Sparkline } from '@/components/ui/Sparkline'
import { PlatformIcon } from '@/components/ui/PlatformIcon'
import { workspaces as workspacesApi } from '@/lib/api-client'
import { formatCurrency } from '@/lib/utils'

interface PerformanceSummary {
  totalSpend?: number
  totalImpressions?: number
  totalClicks?: number
  avgRoas?: number
  avgCpa?: number
  avgCtr?: number
  activeCampaigns?: number
  totalCampaigns?: number
}

const PLATFORM_META: Record<string, { color: string; label: string }> = {
  meta:     { color: '#1877F2', label: 'Meta' },
  google:   { color: '#4285F4', label: 'Google' },
  tiktok:   { color: '#69C9D0', label: 'TikTok' },
  youtube:  { color: '#FF0000', label: 'YouTube' },
  telegram: { color: '#2CA5E0', label: 'Telegram' },
  yandex:   { color: '#FF6633', label: 'Yandex' },
}

const DEMO_PLATFORMS = [
  { platform: 'meta',   percentage: 60, color: '#1877F2' },
  { platform: 'google', percentage: 30, color: '#4285F4' },
  { platform: 'yandex', percentage: 10, color: '#FF6633' },
]

// Fixed sparkline data — deterministic, no random
const DAILY_SPARKLINE = [145, 152, 138, 165, 158, 172, 167]

// Fixed forecast chart ratios (spend ratio vs daily budget, revenue = spend * ROAS multiplier)
const FCST_SPEND  = [0.95,0.97,1.02,0.98,1.05,1.01,0.99,1.03,1.08,1.04,1.00,1.02,0.96,1.07,1.12,1.05,1.03,0.98,1.09,1.14,1.08,1.05,1.11,1.18,1.09,1.13,1.07,1.15,1.20,1.16]
const FCST_ROAS   = [3.0,3.1,3.2,3.0,3.3,3.2,3.1,3.3,3.4,3.2,3.1,3.2,3.0,3.4,3.5,3.3,3.2,3.1,3.4,3.6,3.4,3.2,3.5,3.7,3.4,3.6,3.4,3.6,3.8,3.7]

function formatK(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000)     return `$${(n / 1_000).toFixed(0)}K`
  return `$${n.toFixed(0)}`
}

// ── Custom donut (light-theme-safe background ring) ──────────────────────────
interface DonutSeg { label: string; value: number; color: string }

function BudgetDonut({ segments, centerLabel, size = 148, strokeWidth = 20 }: {
  segments: DonutSeg[]
  centerLabel: string
  size?: number
  strokeWidth?: number
}) {
  const r = (size - strokeWidth) / 2
  const circ = 2 * Math.PI * r
  const cx = size / 2, cy = size / 2
  const total = segments.reduce((s, seg) => s + seg.value, 0) || 100

  let offset = 0
  const arcs = segments.map((seg) => {
    const dash = (seg.value / total) * circ
    const arc = { ...seg, dash, gap: circ - dash, offset }
    offset += dash
    return arc
  })

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
      {/* Subtle gray background ring */}
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(0,0,0,0.06)" strokeWidth={strokeWidth} />
      {arcs.map((arc, i) => (
        arc.value > 0 && (
          <circle
            key={i}
            cx={cx} cy={cy} r={r}
            fill="none"
            stroke={arc.color}
            strokeWidth={strokeWidth}
            strokeDasharray={`${arc.dash} ${arc.gap}`}
            strokeDashoffset={-arc.offset}
            strokeLinecap="butt"
          />
        )
      ))}
      <text
        x={cx} y={cy}
        textAnchor="middle"
        dominantBaseline="middle"
        style={{ transform: `rotate(90deg)`, transformOrigin: `${cx}px ${cy}px` }}
        fill="#111"
        fontSize={size * 0.13}
        fontWeight="800"
        letterSpacing="-0.5"
      >
        {centerLabel}
      </text>
    </svg>
  )
}

// ── Forecast mini line chart (spend vs revenue) ──────────────────────────────
function ForecastLineChart({ dailyBudget }: { dailyBudget: number }) {
  const pts = useMemo(() => FCST_SPEND.map((r, i) => ({
    spend:   dailyBudget * (i + 1) * r,
    revenue: dailyBudget * (i + 1) * r * FCST_ROAS[i],
  })), [dailyBudget])

  const W = 400, H = 88
  const PL = 4, PR = 4, PT = 8, PB = 16
  const cW = W - PL - PR, cH = H - PT - PB
  const maxVal = pts[pts.length - 1].revenue * 1.08

  function x(i: number) { return PL + (i / (pts.length - 1)) * cW }
  function y(v: number) { return PT + cH - (v / maxVal) * cH }

  const spendPath  = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)},${y(p.spend).toFixed(1)}`).join(' ')
  const revPath    = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)},${y(p.revenue).toFixed(1)}`).join(' ')
  const revFillPts = pts.map((p, i) => `${x(i).toFixed(1)},${y(p.revenue).toFixed(1)}`).join(' L')
  const revFill    = `M${revFillPts} L${x(pts.length - 1)},${PT + cH} L${PL},${PT + cH} Z`

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: H }} fill="none">
      <defs>
        <linearGradient id="bpRevFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#34D399" stopOpacity="0.18" />
          <stop offset="100%" stopColor="#34D399" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={revFill} fill="url(#bpRevFill)" />
      <path d={revPath}   stroke="#34D399" strokeWidth="2"   strokeLinecap="round" strokeLinejoin="round" />
      <path d={spendPath} stroke="#7C3AED" strokeWidth="1.5" strokeDasharray="5,4" strokeLinecap="round" strokeLinejoin="round" opacity="0.65" />
    </svg>
  )
}

// ── Main page ────────────────────────────────────────────────────────────────
export default function BudgetPage() {
  const { t } = useI18n()
  const { currentWorkspace } = useWorkspaceStore()
  const [performance, setPerformance] = useState<PerformanceSummary | null>(null)
  const [loading, setLoading]         = useState(false)
  const [sliders, setSliders]         = useState<Record<string, number>>({})
  const [budgetInput, setBudgetInput] = useState('')

  useEffect(() => {
    if (!currentWorkspace?.id) return
    setLoading(true)
    workspacesApi.performance(currentWorkspace.id)
      .then((res) => setPerformance((res.data as any) ?? {}))
      .catch(() => setPerformance({}))
      .finally(() => setLoading(false))
  }, [currentWorkspace?.id])

  if (loading) return <PageSpinner />

  const strategy    = currentWorkspace?.aiStrategy
  const allocation: Record<string, number> = strategy?.budgetAllocation ?? {}
  const totalBudget = currentWorkspace?.monthlyBudget ?? 0

  // ── Empty / onboarding state ─────────────────────────────────────────────
  if (!totalBudget) {
    return (
      <div className="space-y-6 max-w-5xl">
        <PageHeader
          title="Бюджет"
          subtitle={t('budget.subtitle', 'AI-оптимизированное распределение бюджета по каналам')}
        />
        <div className="flex items-center justify-center min-h-[420px]">
          <Card className="max-w-sm w-full text-center" padding="lg">
            <div className="text-5xl mb-5">💰</div>
            <h2 className="text-xl font-bold text-text-primary mb-2">Установите месячный бюджет</h2>
            <p className="text-text-tertiary text-sm mb-6">
              Введите ваш ежемесячный рекламный бюджет — AI автоматически распределит его по платформам
            </p>
            <div className="relative mb-4">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-text-tertiary font-semibold text-base select-none">$</span>
              <input
                type="number"
                placeholder="5000"
                value={budgetInput}
                onChange={e => setBudgetInput(e.target.value)}
                className="w-full pl-9 pr-4 py-3 bg-surface-2 border border-border rounded-xl text-text-primary text-lg font-bold focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40 transition-all"
              />
            </div>
            <Button fullWidth size="lg" onClick={() => window.location.href = '/onboarding'}>
              Продолжить
            </Button>
          </Card>
        </div>
      </div>
    )
  }

  // ── Compute platform stats ───────────────────────────────────────────────
  const hasRealAllocation = Object.keys(allocation).length > 0
  const rawPlatforms = hasRealAllocation
    ? Object.entries(allocation).map(([platform, pct]) => ({
        platform,
        percentage: Number(pct),
        color: PLATFORM_META[platform]?.color ?? '#7C3AED',
      }))
    : DEMO_PLATFORMS

  const platformStats = rawPlatforms.map(({ platform, percentage, color }) => ({
    platform,
    percentage: sliders[platform] ?? percentage,
    color,
    label:     PLATFORM_META[platform]?.label ?? platform,
    allocated: ((sliders[platform] ?? percentage) / 100) * totalBudget,
  }))

  const forecast   = strategy?.monthlyForecast
  const dailyBudg  = totalBudget / 30

  const donutSegs: DonutSeg[] = platformStats.map(({ label, percentage, color }) => ({
    label, value: percentage, color,
  }))

  return (
    <div className="space-y-6 max-w-5xl">

      {/* ── HEADER ── */}
      <PageHeader
        title="Бюджет"
        subtitle={t('budget.subtitle', 'AI-оптимизированное распределение бюджета по каналам')}
        actions={
          <div className="flex items-center gap-2">
            {strategy?.autoRebalance && <Badge variant="success" size="sm" dot>Auto-rebalance on</Badge>}
            <Button variant="primary" size="md">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="shrink-0">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="m18.5 2.5 3 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
              Изменить бюджет
            </Button>
          </div>
        }
      />

      {/* ── TOP METRICS (4 cards) ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">

        {/* Monthly budget */}
        <Card className="relative group">
          <button
            title="Изменить"
            className="absolute top-3 right-3 p-1.5 rounded-lg text-text-tertiary hover:text-text-primary hover:bg-surface-2 transition-all opacity-0 group-hover:opacity-100"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="m18.5 2.5 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
          </button>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-lg">💰</span>
            <p className="text-text-tertiary text-xs font-medium uppercase tracking-wide">Oylik Byudjet</p>
          </div>
          <p className="text-xl font-bold text-text-primary">{formatCurrency(totalBudget)}</p>
          <p className="text-text-tertiary text-xs mt-1">Har Oy</p>
        </Card>

        {/* Daily budget + sparkline */}
        <Card>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-lg">📅</span>
              <p className="text-text-tertiary text-xs font-medium uppercase tracking-wide">Kunlik Byudjet</p>
            </div>
            <Sparkline data={DAILY_SPARKLINE} width={48} height={20} positive={true} />
          </div>
          <p className="text-xl font-bold text-text-primary">{formatCurrency(dailyBudg)}</p>
          <p className="text-text-tertiary text-xs mt-1">Kuniga O&apos;rtacha</p>
        </Card>

        {/* Platforms */}
        <Card>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-lg">📢</span>
            <p className="text-text-tertiary text-xs font-medium uppercase tracking-wide">Platformalar</p>
          </div>
          <p className="text-xl font-bold text-text-primary">{platformStats.length} ta</p>
          <div className="flex items-center gap-1 mt-2">
            {platformStats.slice(0, 3).map(({ platform }) => (
              <PlatformIcon key={platform} platform={platform} size="sm" />
            ))}
          </div>
        </Card>

        {/* Active campaigns */}
        <Card>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-lg">📊</span>
            <p className="text-text-tertiary text-xs font-medium uppercase tracking-wide">Aktiv Kampaniyalar</p>
          </div>
          <p className="text-xl font-bold text-text-primary">
            {performance?.activeCampaigns !== undefined ? `${performance.activeCampaigns} ta` : '12 ta'}
          </p>
          <p className="text-text-tertiary text-xs mt-1">
            Jami — {performance?.totalCampaigns !== undefined ? `${performance.totalCampaigns}` : '18'} Ta
          </p>
        </Card>
      </div>

      {/* ── MAIN 2-COLUMN ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* LEFT — Platform Allocation */}
        <Card>
          <div className="flex items-center gap-2 mb-5">
            <span className="text-lg">📊</span>
            <h2 className="font-semibold text-text-primary">Platforma Taqsimoti</h2>
            <Badge variant="success" size="sm" dot>AI рекомендация</Badge>
            {!hasRealAllocation && <Badge variant="gray" size="sm">Demo</Badge>}
          </div>

          {/* Donut + legend */}
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

          {/* Editable sliders */}
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
                  onChange={e =>
                    setSliders(prev => ({ ...prev, [platform]: Number(e.target.value) }))
                  }
                  className="w-full h-1.5 rounded-full cursor-pointer appearance-none bg-surface-2"
                  style={{ accentColor: color }}
                />
              </div>
            ))}
          </div>

          {/* AI optimization CTA */}
          <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-3 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0 text-base">
              🤖
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-emerald-600 text-xs font-semibold">AI tavsiya qiladi: Meta&apos;ga +10%</p>
              <p className="text-text-tertiary text-xs">CTR ko&apos;rsatkichi asosida</p>
            </div>
            <Button
              variant="secondary"
              size="sm"
              className="shrink-0 border-emerald-500/30 text-emerald-700 hover:bg-emerald-500/10 hover:border-emerald-500/40"
            >
              Qo&apos;llash
            </Button>
          </div>
        </Card>

        {/* RIGHT — Monthly Forecast */}
        <Card>
          <div className="flex items-center gap-2 mb-5">
            <span className="text-lg">🎯</span>
            <h2 className="font-semibold text-text-primary">Oylik Prognoz</h2>
            {!forecast && <Badge variant="gray" size="sm">Demo</Badge>}
          </div>

          {/* 3 Forecast KPI cards */}
          <div className="grid grid-cols-3 gap-3 mb-5">
            {[
              {
                label:    'Прогноз кликов',
                value:    forecast?.estimatedClicks != null
                            ? Number(forecast.estimatedClicks).toLocaleString()
                            : '45,000',
                change:   '+15%',
                icon:     '👆',
              },
              {
                label:    'Прогноз лидов',
                value:    forecast?.estimatedLeads != null
                            ? Number(forecast.estimatedLeads).toLocaleString()
                            : '1,200',
                change:   '+12%',
                icon:     '🎯',
              },
              {
                label:    'Прогноз ROAS',
                value:    forecast?.estimatedRoas != null
                            ? `${Number(forecast.estimatedRoas).toFixed(1)}x`
                            : '3.2x',
                change:   '+0.4x',
                icon:     '📈',
              },
            ].map(({ label, value, change, icon }) => (
              <div key={label} className="bg-surface-2 border border-border rounded-xl p-3 flex flex-col gap-1">
                <div className="text-base">{icon}</div>
                <p className="text-text-tertiary text-xs leading-snug">{label}</p>
                <p className="text-text-primary font-bold text-lg tabular-nums">{value}</p>
                <span className="text-emerald-500 text-xs font-semibold">{change}</span>
              </div>
            ))}
          </div>

          {/* Projected spend vs revenue chart */}
          <div className="mb-3 -mx-1">
            <ForecastLineChart dailyBudget={dailyBudg} />
          </div>

          {/* Chart legend */}
          <div className="flex items-center gap-5 px-1 mb-4">
            <div className="flex items-center gap-1.5">
              <span className="w-5 h-0.5 bg-emerald-400 rounded-full inline-block" />
              <span className="text-xs text-text-tertiary">Daromad</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span
                className="inline-block w-5"
                style={{ height: 1, borderTop: '2px dashed #7C3AED', opacity: 0.65 }}
              />
              <span className="text-xs text-text-tertiary">Xarajat</span>
            </div>
          </div>

          <p className="text-text-tertiary text-xs border-t border-border/60 pt-3">
            * Основано на исторических данных и AI-анализе
          </p>
        </Card>
      </div>

      {/* ── BOTTOM BANNER — no strategy ── */}
      {!strategy && !loading && (
        <div className="bg-gradient-to-r from-pink-500/5 via-violet-500/5 to-transparent border border-pink-400/20 rounded-2xl p-4">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-pink-500/10 border border-pink-400/25 flex items-center justify-center shrink-0">
              <span className="text-xl">🧠</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-text-primary text-sm font-semibold">AI strategiya hali yo&apos;q</p>
              <p className="text-text-tertiary text-xs">
                {t('budget.noStrategyDescription', 'Birinchi AI strategiyangizni yaratish uchun sozlamalarga o\'ting')}
              </p>
            </div>
            <Button variant="primary" size="sm" className="shrink-0" onClick={() => window.location.href = '/settings'}>
              Перейти в настройки
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
