'use client'
import { useEffect, useState, useCallback } from 'react'
import { useWorkspaceStore } from '@/stores/workspace.store'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { PageSpinner } from '@/components/ui/Spinner'
import { EmptyState } from '@/components/ui/EmptyState'
import apiClient from '@/lib/api-client'
import { formatCurrency } from '@/lib/utils'

interface Budget {
  id: string
  totalBudget: number
  platformSplit: Record<string, number>
  period: string
  autoRebalance: boolean
}

interface PlatformStat {
  platform: string
  allocated: number
  percentage: number
}

// Platform display config — color for the progress bars
const PLATFORM_CONFIG: Record<string, { color: string; emoji: string; label: string }> = {
  meta:     { color: '#1877F2', emoji: '📘', label: 'Meta (Facebook & Instagram)' },
  google:   { color: '#4285F4', emoji: '🔍', label: 'Google Ads' },
  tiktok:   { color: '#69C9D0', emoji: '🎵', label: 'TikTok Ads' },
  youtube:  { color: '#FF0000', emoji: '▶️', label: 'YouTube Ads' },
  telegram: { color: '#2CA5E0', emoji: '✈️', label: 'Telegram Ads' },
}

export default function BudgetPage() {
  const { currentWorkspace } = useWorkspaceStore()
  const [budget, setBudget] = useState<Budget | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchBudget = useCallback(async () => {
    if (!currentWorkspace?.id) {
      setLoading(false)
      return
    }
    try {
      const res = await apiClient.get(
        `/workspaces/${currentWorkspace.id}`
      )
      // Budget comes nested inside workspace response
      const ws = res.data
      if (ws.budgets && ws.budgets.length > 0) {
        setBudget(ws.budgets[0])
      }
    } catch (err) {
      console.error('Failed to fetch budget:', err)
    } finally {
      setLoading(false)
    }
  }, [currentWorkspace?.id])

  useEffect(() => {
    fetchBudget()
  }, [fetchBudget])

  if (loading) return <PageSpinner />

  if (!currentWorkspace) {
    return (
      <EmptyState
        icon="💰"
        title="No workspace found"
        description="Complete onboarding to set up your budget allocation."
      />
    )
  }

  const strategy = currentWorkspace.aiStrategy
  const allocation = budget?.platformSplit ?? strategy?.budgetAllocation ?? {}
  const totalBudget = budget?.totalBudget ?? currentWorkspace.monthlyBudget ?? 0

  // Build platform stats with dollar amounts
  const platformStats: PlatformStat[] = Object.entries(allocation).map(
    ([platform, pct]) => ({
      platform,
      percentage: Number(pct),
      allocated: (Number(pct) / 100) * totalBudget,
    })
  )

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
        {budget?.autoRebalance && (
          <Badge variant="success" dot>Auto-rebalance on</Badge>
        )}
      </div>

      {/* ── Total budget summary ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          {
            label: 'Monthly Budget',
            value: formatCurrency(totalBudget),
            sub: budget?.period ?? 'monthly',
            icon: '💰',
          },
          {
            label: 'Daily Budget',
            value: formatCurrency(totalBudget / 30),
            sub: 'Per day average',
            icon: '📅',
          },
          {
            label: 'Platforms',
            value: platformStats.length,
            sub: 'Active channels',
            icon: '📢',
          },
          {
            label: 'Auto-rebalance',
            value: budget?.autoRebalance ? 'Enabled' : 'Disabled',
            sub: 'AI can shift budget',
            icon: '⚖️',
          },
        ].map(({ label, value, sub, icon }) => (
          <Card key={label}>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-lg">{icon}</span>
              <p className="text-[#6B7280] text-xs font-medium uppercase tracking-wide">
                {label}
              </p>
            </div>
            <p className="text-xl font-bold text-white">{value}</p>
            <p className="text-[#4B5563] text-xs mt-1 capitalize">{sub}</p>
          </Card>
        ))}
      </div>

      {/* ── Main content: allocation + forecast ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Platform allocation breakdown */}
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
                const config = PLATFORM_CONFIG[platform] ?? {
                  color: '#7C3AED',
                  emoji: '📢',
                  label: platform,
                }

                return (
                  <div key={platform}>
                    {/* Platform name row */}
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2.5">
                        <span className="text-base">{config.emoji}</span>
                        <div>
                          <p className="text-white text-sm font-medium">
                            {config.label}
                          </p>
                          <p className="text-[#4B5563] text-xs">
                            {formatCurrency(allocated)}/month
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-white font-bold text-sm">
                          {percentage}%
                        </p>
                        <p className="text-[#4B5563] text-xs">
                          {formatCurrency(allocated / 30)}/day
                        </p>
                      </div>
                    </div>

                    {/* Progress bar with platform color */}
                    <div className="h-2 bg-[#2A2A3A] rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{
                          width: `${percentage}%`,
                          backgroundColor: config.color,
                        }}
                      />
                    </div>
                  </div>
                )
              })}

              {/* Visual donut-style summary */}
              <div className="mt-4 pt-4 border-t border-[#2A2A3A]">
                <div className="flex items-center gap-2 flex-wrap">
                  {platformStats.map(({ platform, percentage }) => {
                    const config = PLATFORM_CONFIG[platform] ?? {
                      color: '#7C3AED',
                      emoji: '📢',
                    }
                    return (
                      <div
                        key={platform}
                        className="flex items-center gap-1.5 bg-[#1C1C27] border border-[#2A2A3A] rounded-lg px-2.5 py-1.5"
                      >
                        <div
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: config.color }}
                        />
                        <span className="text-[#9CA3AF] text-xs capitalize">
                          {platform}
                        </span>
                        <span className="text-white text-xs font-medium">
                          {percentage}%
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          )}
        </Card>

        {/* AI Forecast */}
        <Card>
          <div className="flex items-center gap-2 mb-5">
            <span className="text-lg">🎯</span>
            <h2 className="font-semibold text-white">Monthly Forecast</h2>
          </div>

          {forecast ? (
            <div className="space-y-4">
              {[
                {
                  label: 'Estimated Leads',
                  value: forecast.estimatedLeads ?? '—',
                  icon: '🎯',
                  color: 'text-white',
                },
                {
                  label: 'Estimated Sales',
                  value: forecast.estimatedSales ?? '—',
                  icon: '🛒',
                  color: 'text-white',
                },
                {
                  label: 'Estimated ROAS',
                  value: forecast.estimatedRoas
                    ? `${Number(forecast.estimatedRoas).toFixed(1)}x`
                    : '—',
                  icon: '📈',
                  color: 'text-emerald-400',
                },
                {
                  label: 'Estimated CPA',
                  value: forecast.estimatedCpa
                    ? formatCurrency(forecast.estimatedCpa)
                    : '—',
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
                {
                  label: 'Confidence',
                  value: forecast.confidence ?? '—',
                  icon: '🎲',
                  color: 'text-[#A78BFA]',
                },
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

      {/* ── Creative guidelines from strategy ── */}
      {strategy?.creativeGuidelines && (
        <Card>
          <div className="flex items-center gap-2 mb-4">
            <span className="text-lg">🎨</span>
            <h2 className="font-semibold text-white">Creative Guidelines</h2>
            <Badge variant="gray" size="sm">From AI Strategy</Badge>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-[#1C1C27] border border-[#2A2A3A] rounded-xl p-4">
              <p className="text-[#6B7280] text-xs font-medium uppercase tracking-wide mb-2">
                Tone
              </p>
              <p className="text-white text-sm">
                {strategy.creativeGuidelines.tone ?? '—'}
              </p>
            </div>
            <div className="bg-[#1C1C27] border border-[#2A2A3A] rounded-xl p-4">
              <p className="text-[#6B7280] text-xs font-medium uppercase tracking-wide mb-2">
                Key Messages
              </p>
              <ul className="space-y-1">
                {(strategy.creativeGuidelines.keyMessages ?? []).map(
                  (msg: string, i: number) => (
                    <li key={i} className="text-white text-sm flex items-start gap-2">
                      <span className="text-[#7C3AED] mt-0.5">•</span>
                      {msg}
                    </li>
                  )
                )}
              </ul>
            </div>
            <div className="bg-[#1C1C27] border border-[#2A2A3A] rounded-xl p-4">
              <p className="text-[#6B7280] text-xs font-medium uppercase tracking-wide mb-2">
                Call to Actions
              </p>
              <div className="flex flex-wrap gap-2">
                {(strategy.creativeGuidelines.callToActions ?? []).map(
                  (cta: string, i: number) => (
                    <Badge key={i} variant="purple" size="sm">{cta}</Badge>
                  )
                )}
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}