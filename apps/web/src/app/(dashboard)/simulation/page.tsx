'use client'
import { useState, useMemo } from 'react'
import { useWorkspaceStore } from '@/stores/workspace.store'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { useRouter } from 'next/navigation'
import { formatCurrency } from '@/lib/utils'

// Platform color config for the bars
const PLATFORM_COLORS: Record<string, string> = {
  meta:     '#1877F2',
  google:   '#4285F4',
  tiktok:   '#69C9D0',
  youtube:  '#FF0000',
  telegram: '#2CA5E0',
}

export default function SimulationPage() {
  const router = useRouter()
  const { currentWorkspace } = useWorkspaceStore()

  const DEMO_WORKSPACE = {
    id: 'demo-workspace-1',
    name: 'Demo Shop',
    monthlyBudget: 5000,
    aiStrategy: {
      budgetAllocation: { meta: 60, google: 30, tiktok: 10 },
      monthlyForecast: {
        estimatedLeads: 320,
        estimatedRoas: 3.2,
        estimatedCpa: 15.6,
        estimatedCtr: 0.024,
      },
    },
  }

  const ws = currentWorkspace ?? DEMO_WORKSPACE
  const baseBudget = ws.monthlyBudget ?? 500
  const strategy   = ws.aiStrategy
  const forecast   = strategy?.monthlyForecast

  // The slider value — starts at the user's current budget
  const [budget, setBudget] = useState(baseBudget)

  // Which scenario to show: pessimistic / realistic / optimistic
  const [scenario, setScenario] = useState<'pessimistic' | 'realistic' | 'optimistic'>(
    'realistic'
  )

  // Scenario multipliers — how much we adjust the forecast
  // based on optimism level. These are industry-standard
  // ranges used in media planning.
  const SCENARIO_MULTIPLIERS = {
    pessimistic: { leads: 0.65, roas: 0.80, cpa: 1.30 },
    realistic:   { leads: 1.00, roas: 1.00, cpa: 1.00 },
    optimistic:  { leads: 1.35, roas: 1.25, cpa: 0.75 },
  }

  // All projection math lives in useMemo so it
  // recalculates instantly when slider or scenario changes
  const projection = useMemo(() => {
    if (!forecast) return null

    const scaleFactor = budget / baseBudget
    const mult = SCENARIO_MULTIPLIERS[scenario]

    // Core projections
    const leads   = Math.round((forecast.estimatedLeads ?? 50) * scaleFactor * mult.leads)
    const roas    = Number(((forecast.estimatedRoas ?? 2.5) * mult.roas).toFixed(2))
    const cpa     = Number(((forecast.estimatedCpa ?? 30) * mult.cpa).toFixed(2))
    const revenue = budget * roas
    const ctr     = Number(((forecast.estimatedCtr ?? 0.02) * 100).toFixed(2))

    // Platform-level breakdown using the AI's budget allocation
    const allocation = strategy?.budgetAllocation ?? {}
    const platformBreakdown = Object.entries(allocation).map(([platform, pct]) => ({
      platform,
      percentage: Number(pct),
      spend:      (Number(pct) / 100) * budget,
      // Simplified per-platform ROAS estimate
      // Meta is typically stronger for leads, Google for high-intent sales
      estLeads: Math.round(leads * (Number(pct) / 100)),
    }))

    return { leads, roas, cpa, revenue, ctr, platformBreakdown }
  }, [budget, baseBudget, scenario, forecast, strategy])

  const roasColor =
    (projection?.roas ?? 0) >= 4 ? 'text-emerald-400'
    : (projection?.roas ?? 0) >= 2 ? 'text-amber-400'
    : 'text-red-400'

  // Budget change vs current
  const budgetDelta = budget - baseBudget
  const budgetDeltaPct = ((budgetDelta / baseBudget) * 100).toFixed(0)

  return (
    <div className="space-y-6 max-w-5xl">

      {/* ── Page header ── */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50 mb-1">
          Simulation & Forecast
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm">
          Byudjetingizni o'zgartirsa qanday natijalar bo'lishini oldindan ko'ring
        </p>
      </div>

      {/* ── Reporting embed notice ── */}
      <div className="flex items-start gap-4 bg-emerald-50 border border-emerald-200 rounded-2xl px-5 py-4">
        <span className="text-2xl shrink-0">💡</span>
        <div className="flex-1 min-w-0">
          <p className="text-emerald-800 font-semibold text-sm mb-0.5">
            Simulyatsiya endi Hisobot ichida ham mavjud
          </p>
          <p className="text-emerald-600 text-xs leading-relaxed">
            Hisobot bo'limida "Byudjet Simulyatsiyasi" paneli orqali real kampaniya
            ko'rsatkichlariga asoslangan prognoz qilishingiz mumkin.
          </p>
        </div>
        <button
          onClick={() => router.push('/reporting')}
          className="shrink-0 text-xs font-medium text-emerald-700 bg-emerald-100 hover:bg-emerald-200 border border-emerald-300 px-3 py-1.5 rounded-lg transition-colors"
        >
          Hisobotga o'tish →
        </button>
      </div>

      {/* ── Controls ── */}
      <Card>
        <div className="space-y-6">

          {/* Budget slider */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-slate-900 dark:text-slate-50 font-medium text-sm">
                Monthly budget
              </label>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold text-slate-700 dark:text-slate-300">
                  {formatCurrency(budget)}
                </span>
                {budgetDelta !== 0 && (
                  <Badge
                    variant={budgetDelta > 0 ? 'success' : 'danger'}
                    size="sm"
                  >
                    {budgetDelta > 0 ? '+' : ''}{budgetDeltaPct}% vs current
                  </Badge>
                )}
              </div>
            </div>

            <input
              type="range"
              min={50}
              max={10000}
              step={50}
              value={budget}
              onChange={(e) => setBudget(Number(e.target.value))}
              className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full appearance-none cursor-pointer
                [&::-webkit-slider-thumb]:appearance-none
                [&::-webkit-slider-thumb]:w-5
                [&::-webkit-slider-thumb]:h-5
                [&::-webkit-slider-thumb]:rounded-full
                [&::-webkit-slider-thumb]:bg-slate-900
                [&::-webkit-slider-thumb]:cursor-pointer
                [&::-webkit-slider-thumb]:border-2
                [&::-webkit-slider-thumb]:border-white/20"
            />

            {/* Scale reference points */}
            <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 mt-2">
              <span>$50</span>
              <span>$500</span>
              <span>$1,000</span>
              <span>$5,000</span>
              <span>$10,000</span>
            </div>

            {/* Quick preset buttons */}
            <div className="flex flex-wrap gap-2 mt-3">
              {[100, 300, 500, 1000, 2000, 5000].map((preset) => (
                <button
                  key={preset}
                  onClick={() => setBudget(preset)}
                  className={`
                    text-xs px-3 py-1.5 rounded-lg border transition-all duration-200
                    ${budget === preset
                      ? 'border-slate-900 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium'
                      : 'border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:border-slate-900/50 hover:text-slate-900 dark:text-slate-50'
                    }
                  `}
                >
                  ${preset.toLocaleString()}
                </button>
              ))}
            </div>
          </div>

          {/* Scenario selector */}
          <div>
            <label className="text-slate-900 dark:text-slate-50 font-medium text-sm block mb-3">
              Scenario
            </label>
            <div className="grid grid-cols-3 gap-3">
              {(
                [
                  {
                    key: 'pessimistic',
                    label: '😔 Pessimistic',
                    desc: 'Conservative estimate — 35% below typical results',
                    color: 'border-red-500/30 bg-red-500/5',
                    active: 'border-red-500/60 bg-red-500/10',
                  },
                  {
                    key: 'realistic',
                    label: '😊 Realistic',
                    desc: 'Based on industry averages for your market',
                    color: 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:border-slate-600',
                    active: 'border-slate-900 bg-slate-100 dark:bg-slate-800',
                  },
                  {
                    key: 'optimistic',
                    label: '🚀 Optimistic',
                    desc: 'Best case — excellent execution and market conditions',
                    color: 'border-emerald-500/30 bg-emerald-500/5',
                    active: 'border-emerald-500/60 bg-emerald-500/10',
                  },
                ] as const
              ).map((s) => (
                <button
                  key={s.key}
                  onClick={() => setScenario(s.key)}
                  className={`
                    text-left p-4 rounded-xl border transition-all duration-200
                    ${scenario === s.key ? s.active : s.color}
                  `}
                >
                  <p className="font-medium text-slate-900 dark:text-slate-50 text-sm mb-1">{s.label}</p>
                  <p className="text-slate-500 dark:text-slate-400 text-xs leading-relaxed">{s.desc}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      </Card>

      {/* ── Projected results ── */}
      {projection && (
        <>
          <div>
            <h2 className="text-slate-900 dark:text-slate-50 font-semibold mb-3 flex items-center gap-2">
              Projected Results
              <Badge
                variant={
                  scenario === 'optimistic' ? 'success'
                  : scenario === 'pessimistic' ? 'danger'
                  : 'purple'
                }
              >
                {scenario}
              </Badge>
            </h2>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                {
                  label: 'Est. Revenue',
                  value: formatCurrency(projection.revenue),
                  sub: `${projection.roas}x ROAS`,
                  color: 'text-emerald-400',
                  icon: '💵',
                },
                {
                  label: 'Est. Leads',
                  value: projection.leads,
                  sub: 'per month',
                  color: 'text-slate-900 dark:text-slate-50',
                  icon: '🎯',
                },
                {
                  label: 'Est. ROAS',
                  value: `${projection.roas}x`,
                  sub: 'return on ad spend',
                  color: roasColor,
                  icon: '📈',
                },
                {
                  label: 'Est. CPA',
                  value: formatCurrency(projection.cpa),
                  sub: 'cost per acquisition',
                  color: 'text-slate-900 dark:text-slate-50',
                  icon: '💰',
                },
              ].map(({ label, value, sub, color, icon }) => (
                <Card key={label}>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-lg">{icon}</span>
                    <p className="text-slate-500 dark:text-slate-400 text-xs font-medium uppercase tracking-wide">
                      {label}
                    </p>
                  </div>
                  <p className={`text-2xl font-bold ${color}`}>{value}</p>
                  <p className="text-slate-500 dark:text-slate-400 text-xs mt-1">{sub}</p>
                </Card>
              ))}
            </div>
          </div>

          {/* Platform-level breakdown */}
          <Card>
            <div className="flex items-center gap-2 mb-5">
              <span className="text-lg">📊</span>
              <h2 className="font-semibold text-slate-900 dark:text-slate-50">Platform Breakdown</h2>
              <Badge variant="gray" size="sm">
                {formatCurrency(budget)} total
              </Badge>
            </div>

            <div className="space-y-4">
              {projection.platformBreakdown.map(
                ({ platform, percentage, spend, estLeads }) => {
                  const color = PLATFORM_COLORS[platform] ?? '#7C3AED'
                  return (
                    <div key={platform}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-2.5 h-2.5 rounded-full"
                            style={{ backgroundColor: color }}
                          />
                          <span className="text-slate-900 dark:text-slate-50 text-sm capitalize font-medium">
                            {platform}
                          </span>
                          <span className="text-slate-500 dark:text-slate-400 text-xs">
                            {percentage}%
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-slate-900 dark:text-slate-50 text-sm font-medium">
                            {formatCurrency(spend)}
                          </span>
                          <span className="text-slate-500 dark:text-slate-400 text-xs ml-2">
                            ~{estLeads} leads
                          </span>
                        </div>
                      </div>
                      <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${percentage}%`,
                            backgroundColor: color,
                          }}
                        />
                      </div>
                    </div>
                  )
                }
              )}
            </div>
          </Card>

          {/* Insight box */}
          <Card variant="outlined" padding="sm">
            <div className="flex items-start gap-3 px-2">
              <span className="text-lg mt-0.5">💡</span>
              <div>
                <p className="text-slate-900 dark:text-slate-50 text-sm font-medium mb-1">
                  What this simulation tells you
                </p>
                <p className="text-slate-500 dark:text-slate-400 text-xs leading-relaxed">
                  These projections are based on your AI-generated strategy
                  and industry benchmarks for your market.
                  Actual results depend on creative quality, landing page
                  performance, and market conditions. Use this as a planning
                  guide — not a guarantee.
                </p>
              </div>
            </div>
          </Card>
        </>
      )}
    </div>
  )
}