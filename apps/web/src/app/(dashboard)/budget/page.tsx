'use client'
import { useEffect, useState } from 'react'
import { useWorkspaceStore } from '@/stores/workspace.store'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { PageSpinner } from '@/components/ui/Spinner'
import { EmptyState } from '@/components/ui/EmptyState'
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

const PLATFORM_CONFIG: Record<string, { color: string; emoji: string; label: string }> = {
  meta:     { color: '#1877F2', emoji: '📘', label: 'Meta (Facebook & Instagram)' },
  google:   { color: '#4285F4', emoji: '🔍', label: 'Google Ads' },
  tiktok:   { color: '#69C9D0', emoji: '🎵', label: 'TikTok Ads' },
  youtube:  { color: '#FF0000', emoji: '▶️', label: 'YouTube Ads' },
  telegram: { color: '#2CA5E0', emoji: '✈️', label: 'Telegram Ads' },
}

export default function BudgetPage() {
  const { currentWorkspace } = useWorkspaceStore()
  const [performance, setPerformance] = useState<PerformanceSummary | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!currentWorkspace?.id) return
    setLoading(true)
    workspacesApi.performance(currentWorkspace.id)
      .then((res) => setPerformance((res.data as any) ?? {}))
      .catch(() => setPerformance({}))
      .finally(() => setLoading(false))
  }, [currentWorkspace?.id])

  if (loading) return <PageSpinner />

  const strategy = currentWorkspace?.aiStrategy
  const allocation: Record<string, number> = strategy?.budgetAllocation ?? {}
  const totalBudget = currentWorkspace?.monthlyBudget ?? 0

  const platformStats = Object.entries(allocation).map(([platform, pct]) => ({
    platform,
    percentage: Number(pct),
    allocated: (Number(pct) / 100) * totalBudget,
  }))

  const forecast = strategy?.monthlyForecast

  return (
    <div className="space-y-6 max-w-5xl">

      {/* ── Page header ── */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Budget Allocation</h1>
          <p className="text-[#6B7280] text-sm">
            AI-optimized budget distribution across your ad platforms
          </p>
        </div>
        {strategy?.autoRebalance && (
          <Badge variant="success" dot>Auto-rebalance on</Badge>
        )}
      </div>

      {/* ── Total budget summary ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          {
            label: 'Monthly Budget',
            value: formatCurrency(totalBudget),
            sub: 'per month',
            icon: '💰',
          },
          {
            label: 'Daily Budget',
            value: formatCurrency(totalBudget / 30),
            sub: 'per day average',
            icon: '📅',
          },
          {
            label: 'Platforms',
            value: platformStats.length || '—',
            sub: 'active channels',
            icon: '📢',
          },
          {
            label: 'Active Campaigns',
            value: performance?.activeCampaigns ?? '—',
            sub: `of ${performance?.totalCampaigns ?? '—'} total`,
            icon: '📊',
          },
        ].map(({ label, value, sub, icon }) => (
          <Card key={label}>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-lg">{icon}</span>
              <p className="text-[#6B7280] text-xs font-medium uppercase tracking-wide">{label}</p>
            </div>
            <p className="text-xl font-bold text-white">{value}</p>
            <p className="text-[#4B5563] text-xs mt-1 capitalize">{sub}</p>
          </Card>
        ))}
      </div>

      {/* ── Real performance metrics (if available) ── */}
      {performance && (performance.totalSpend !== undefined || performance.avgRoas !== undefined) && (
        <Card>
          <div className="flex items-center gap-2 mb-5">
            <span className="text-lg">📈</span>
            <h2 className="font-semibold text-white">Live Performance</h2>
            <Badge variant="success" size="sm" dot>Real data</Badge>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Total Spend', value: performance.totalSpend !== undefined ? formatCurrency(performance.totalSpend) : '—', color: 'text-white' },
              { label: 'Avg ROAS', value: performance.avgRoas !== undefined ? `${Number(performance.avgRoas).toFixed(1)}x` : '—', color: 'text-emerald-400' },
              { label: 'Avg CPA', value: performance.avgCpa !== undefined ? formatCurrency(performance.avgCpa) : '—', color: 'text-white' },
              { label: 'Avg CTR', value: performance.avgCtr !== undefined ? `${(Number(performance.avgCtr) * 100).toFixed(2)}%` : '—', color: 'text-white' },
            ].map(({ label, value, color }) => (
              <div key={label} className="bg-[#1C1C27] border border-[#2A2A3A] rounded-xl p-4">
                <p className="text-[#6B7280] text-xs font-medium uppercase tracking-wide mb-2">{label}</p>
                <p className={`text-xl font-bold ${color}`}>{value}</p>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* ── Allocation + forecast ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        <Card>
          <div className="flex items-center gap-2 mb-5">
            <span className="text-lg">📊</span>
            <h2 className="font-semibold text-white">Platform Split</h2>
            <Badge variant="purple" size="sm">AI Recommended</Badge>
          </div>

          {platformStats.length === 0 ? (
            <EmptyState
              icon="📊"
              title="No allocation set"
              description="Complete onboarding to get AI budget recommendations."
            />
          ) : (
            <div className="space-y-5">
              {platformStats.map(({ platform, percentage, allocated }) => {
                const config = PLATFORM_CONFIG[platform] ?? { color: '#7C3AED', emoji: '📢', label: platform }
                return (
                  <div key={platform}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2.5">
                        <span className="text-base">{config.emoji}</span>
                        <div>
                          <p className="text-white text-sm font-medium">{config.label}</p>
                          <p className="text-[#4B5563] text-xs">{formatCurrency(allocated)}/month</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-white font-bold text-sm">{percentage}%</p>
                        <p className="text-[#4B5563] text-xs">{formatCurrency(allocated / 30)}/day</p>
                      </div>
                    </div>
                    <div className="h-2 bg-[#2A2A3A] rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{ width: `${percentage}%`, backgroundColor: config.color }}
                      />
                    </div>
                  </div>
                )
              })}

              <div className="mt-4 pt-4 border-t border-[#2A2A3A]">
                <div className="flex items-center gap-2 flex-wrap">
                  {platformStats.map(({ platform, percentage }) => {
                    const config = PLATFORM_CONFIG[platform] ?? { color: '#7C3AED', emoji: '📢' }
                    return (
                      <div
                        key={platform}
                        className="flex items-center gap-1.5 bg-[#1C1C27] border border-[#2A2A3A] rounded-lg px-2.5 py-1.5"
                      >
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: config.color }} />
                        <span className="text-[#9CA3AF] text-xs capitalize">{platform}</span>
                        <span className="text-white text-xs font-medium">{percentage}%</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          )}
        </Card>

        <Card>
          <div className="flex items-center gap-2 mb-5">
            <span className="text-lg">🎯</span>
            <h2 className="font-semibold text-white">Monthly Forecast</h2>
          </div>

          {forecast ? (
            <div className="space-y-4">
              {[
                { label: 'Estimated Leads', value: forecast.estimatedLeads ?? '—', icon: '🎯', color: 'text-white' },
                { label: 'Estimated Sales', value: forecast.estimatedSales ?? '—', icon: '🛒', color: 'text-white' },
                {
                  label: 'Estimated ROAS',
                  value: forecast.estimatedRoas ? `${Number(forecast.estimatedRoas).toFixed(1)}x` : '—',
                  icon: '📈',
                  color: 'text-emerald-400',
                },
                {
                  label: 'Estimated CPA',
                  value: forecast.estimatedCpa ? formatCurrency(forecast.estimatedCpa) : '—',
                  icon: '💵',
                  color: 'text-white',
                },
                {
                  label: 'Estimated CTR',
                  value: forecast.estimatedCtr
                    ? `${(Number(forecast.estimatedCtr) * 100).toFixed(2)}%`
                    : '—',
                  icon: '👆',
                  color: 'text-white',
                },
                { label: 'Confidence', value: forecast.confidence ?? '—', icon: '🎲', color: 'text-[#A78BFA]' },
              ].map(({ label, value, icon, color }) => (
                <div
                  key={label}
                  className="flex items-center justify-between py-2.5 border-b border-[#2A2A3A] last:border-0"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-base w-6">{icon}</span>
                    <span className="text-[#9CA3AF] text-sm">{label}</span>
                  </div>
                  <span className={`font-bold text-sm ${color}`}>{value}</span>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              icon="🧠"
              title="No forecast yet"
              description="Generate an AI strategy during onboarding to see your KPI forecast."
            />
          )}
        </Card>
      </div>

      {/* ── Creative guidelines ── */}
      {strategy?.creativeGuidelines && (
        <Card>
          <div className="flex items-center gap-2 mb-4">
            <span className="text-lg">🎨</span>
            <h2 className="font-semibold text-white">Creative Guidelines</h2>
            <Badge variant="gray" size="sm">From AI Strategy</Badge>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-[#1C1C27] border border-[#2A2A3A] rounded-xl p-4">
              <p className="text-[#6B7280] text-xs font-medium uppercase tracking-wide mb-2">Tone</p>
              <p className="text-white text-sm">{strategy.creativeGuidelines.tone ?? '—'}</p>
            </div>
            <div className="bg-[#1C1C27] border border-[#2A2A3A] rounded-xl p-4">
              <p className="text-[#6B7280] text-xs font-medium uppercase tracking-wide mb-2">Key Messages</p>
              <ul className="space-y-1">
                {(strategy.creativeGuidelines.keyMessages ?? []).map((msg: string, i: number) => (
                  <li key={i} className="text-white text-sm flex items-start gap-2">
                    <span className="text-[#7C3AED] mt-0.5">•</span>
                    {msg}
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-[#1C1C27] border border-[#2A2A3A] rounded-xl p-4">
              <p className="text-[#6B7280] text-xs font-medium uppercase tracking-wide mb-2">Call to Actions</p>
              <div className="flex flex-wrap gap-2">
                {(strategy.creativeGuidelines.callToActions ?? []).map((cta: string, i: number) => (
                  <Badge key={i} variant="purple" size="sm">{cta}</Badge>
                ))}
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* ── No strategy prompt ── */}
      {!strategy && !loading && (
        <Card variant="outlined" padding="sm">
          <div className="flex items-center gap-3 px-2">
            <span className="text-xl">🧠</span>
            <div className="flex-1">
              <p className="text-white text-sm font-medium">No AI strategy yet</p>
              <p className="text-[#6B7280] text-xs">Go to Settings to generate your first AI strategy and budget plan.</p>
            </div>
            <Button variant="secondary" size="sm" onClick={() => window.location.href = '/settings'}>
              Go to Settings
            </Button>
          </div>
        </Card>
      )}
    </div>
  )
}
