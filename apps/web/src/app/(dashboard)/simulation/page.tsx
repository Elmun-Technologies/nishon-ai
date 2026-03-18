'use client'
import { useState, useMemo } from 'react'
import { useWorkspaceStore } from '@/stores/workspace.store'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
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

  // Base values from the AI strategy
  const baseBudget = currentWorkspace?.monthlyBudget ?? 500
  const strategy   = currentWorkspace?.aiStrategy
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

  if (!currentWorkspace) {
    return (
      <EmptyState
        icon="🔮"
        title="No workspace found"
        description="Complete onboarding to use the budget simulator."
        action={{ label: 'Start Onboarding', onClick: () => router.push('/onboarding') }}
      />
    )
  }

  if (!forecast) {
    return (
      <EmptyState
        icon="🧠"
        title="No strategy yet"
        description="Generate an AI strategy first to use the budget simulator — it needs KPI baseline data."
        action={{ label: 'Generate Strategy', onClick: () => router.push('/onboarding') }}
      />
    )
  }

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
        <h1 className="text-2xl font-bold text-white mb-1">
          Simulation & Forecast
        </h1>
        <p className="text-[#6B7280] text-sm">
          Adjust your budget and scenario to forecast results before committing
        </p>
      </div>

      {/* ── Controls ── */}
      <Card>
        <div className="space-y-6">

          {/* Budget slider */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-white font-medium text-sm">
                Monthly budget
              </label>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold text-[#A78BFA]">
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
              className="w-full h-2 bg-[#2A2A3A] rounded-full appearance-none cursor-pointer
                [&::-webkit-slider-thumb]:appearance-none
                [&::-webkit-slider-thumb]:w-5
                [&::-webkit-slider-thumb]:h-5
                [&::-webkit-slider-thumb]:rounded-full
                [&::-webkit-slider-thumb]:bg-[#7C3AED]
                [&::-webkit-slider-thumb]:cursor-pointer
                [&::-webkit-slider-thumb]:border-2
                [&::-webkit-slider-thumb]:border-white/20"
            />

            {/* Scale reference points */}
            <div className="flex justify-between text-xs text-[#4B5563] mt-2">
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
                      ? 'border-[#7C3AED] bg-[#7C3AED]/10 text-[#A78BFA] font-medium'
                      : 'border-[#2A2A3A] text-[#6B7280] hover:border-[#7C3AED]/50 hover:text-white'
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
            <label className="text-white font-medium text-sm block mb-3">
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
                    color: 'border-[#2A2A3A] hover:border-[#7C3AED]/30',
                    active: 'border-[#7C3AED] bg-[#7C3AED]/10',
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
                  <p className="font-medium text-white text-sm mb-1">{s.label}</p>
                  <p className="text-[#6B7280] text-xs leading-relaxed">{s.desc}</p>
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
            <h2 className="text-white font-semibold mb-3 flex items-center gap-2">
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
                  color: 'text-white',
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
                  color: 'text-white',
                  icon: '💰',
                },
              ].map(({ label, value, sub, color, icon }) => (
                <Card key={label}>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-lg">{icon}</span>
                    <p className="text-[#6B7280] text-xs font-medium uppercase tracking-wide">
                      {label}
                    </p>
                  </div>
                  <p className={`text-2xl font-bold ${color}`}>{value}</p>
                  <p className="text-[#4B5563] text-xs mt-1">{sub}</p>
                </Card>
              ))}
            </div>
          </div>

          {/* Platform-level breakdown */}
          <Card>
            <div className="flex items-center gap-2 mb-5">
              <span className="text-lg">📊</span>
              <h2 className="font-semibold text-white">Platform Breakdown</h2>
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
                          <span className="text-white text-sm capitalize font-medium">
                            {platform}
                          </span>
                          <span className="text-[#6B7280] text-xs">
                            {percentage}%
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-white text-sm font-medium">
                            {formatCurrency(spend)}
                          </span>
                          <span className="text-[#4B5563] text-xs ml-2">
                            ~{estLeads} leads
                          </span>
                        </div>
                      </div>
                      <div className="h-1.5 bg-[#2A2A3A] rounded-full overflow-hidden">
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
                <p className="text-white text-sm font-medium mb-1">
                  What this simulation tells you
                </p>
                <p className="text-[#6B7280] text-xs leading-relaxed">
                  These projections are based on your AI-generated strategy
                  and industry benchmarks for{' '}
                  {currentWorkspace.targetLocation ?? 'your market'}.
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