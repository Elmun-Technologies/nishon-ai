'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useWorkspaceStore } from '@/stores/workspace.store'
import { useRealtimeRefresh } from '@/hooks/useRealtimeRefresh'
import { MetricCard } from '@/components/ui/MetricCard'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { Alert } from '@/components/ui/Alert'
import { workspaces as workspacesApi, aiAgent } from '@/lib/api-client'
import { formatCurrency, formatNumber } from '@/lib/utils'

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
}

export default function DashboardPage() {
  const router = useRouter()
  const { currentWorkspace } = useWorkspaceStore()
  const [performance, setPerformance] = useState<PerformanceSummary | null>(null)
  const [loadingPerf, setLoadingPerf] = useState(true)
  const [optimizing, setOptimizing] = useState(false)
  const [optimizeMsg, setOptimizeMsg] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (!currentWorkspace?.id) {
      setLoadingPerf(false)
      return
    }
    setLoadingPerf(true)
    workspacesApi.performance(currentWorkspace.id)
      .then((res) => setPerformance((res.data as any) ?? {}))
      .catch(() => setPerformance({}))
      .finally(() => setLoadingPerf(false))
  }, [currentWorkspace?.id])

  // Refresh performance metrics in real-time when Meta syncs or optimization completes
  useRealtimeRefresh(currentWorkspace?.id, ['meta_synced', 'optimization_done'], () => {
    if (!currentWorkspace?.id) return
    workspacesApi.performance(currentWorkspace.id)
      .then((res) => setPerformance((res.data as any) ?? {}))
      .catch(() => {})
  })

  async function handleRunOptimization() {
    if (!currentWorkspace?.id) return
    setOptimizing(true)
    setOptimizeMsg('')
    setError('')
    try {
      await aiAgent.optimize(currentWorkspace.id)
      setOptimizeMsg('Optimization complete — check AI Decisions for results.')
      setTimeout(() => setOptimizeMsg(''), 4000)
    } catch (err: any) {
      setError(err?.message ?? 'Optimization failed')
      setTimeout(() => setError(''), 4000)
    } finally {
      setOptimizing(false)
    }
  }

  const ws = currentWorkspace

  const roas = performance?.overallRoas ?? performance?.avgRoas ?? 0
  const roasColor =
    roas >= 4 ? 'text-emerald-400'
    : roas >= 2 ? 'text-amber-400'
    : 'text-red-400'

  // If no workspace, prompt to start onboarding
  if (!ws) {
    return (
      <div className="flex items-center justify-center h-full">
        <Card className="max-w-md w-full text-center p-8">
          <span className="text-4xl block mb-4">🚀</span>
          <h2 className="text-white text-xl font-bold mb-2">Welcome to Nishon AI</h2>
          <p className="text-[#6B7280] text-sm mb-6">
            Complete onboarding to create your first workspace and let AI manage your ad campaigns.
          </p>
          <Button onClick={() => router.push('/onboarding')}>
            Start Setup →
          </Button>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-7xl">

      {error && <Alert variant="error">{error}</Alert>}
      {optimizeMsg && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 py-3 text-emerald-400 text-sm">
          ✓ {optimizeMsg}
        </div>
      )}

      {/* ── Meta Ads data source badge ── */}
      {(performance as any)?.metaConnected && (
        <div className="flex items-center gap-2 text-xs text-[#9CA3AF]">
          <span className="w-2 h-2 rounded-full bg-[#1877F2] shrink-0" />
          <span>Ko'rsatkichlar <span className="text-white font-medium">Meta Ads</span> dan real vaqt rejimida olinmoqda</span>
          <a href="/settings/meta" className="text-[#7C3AED] hover:underline ml-1">sozlamalar →</a>
        </div>
      )}

      {/* ── TOP ROW: KPI metrics ── */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        <MetricCard
          label="Total Spend"
          value={formatCurrency(performance?.totalSpend ?? 0)}
          subtext="This month"
          loading={loadingPerf}
          icon="💰"
        />
        <MetricCard
          label="Revenue"
          value={formatCurrency(performance?.totalRevenue ?? 0)}
          subtext="Generated"
          loading={loadingPerf}
          icon="💵"
          accent
        />
        <MetricCard
          label="ROAS"
          value={roas > 0 ? `${roas.toFixed(2)}x` : '—'}
          subtext="Return on ad spend"
          loading={loadingPerf}
          icon="📈"
        />
        <MetricCard
          label="Conversions"
          value={formatNumber(performance?.totalConversions ?? 0)}
          subtext="Total"
          loading={loadingPerf}
          icon="🎯"
        />
        <MetricCard
          label="Clicks"
          value={formatNumber(performance?.totalClicks ?? 0)}
          subtext="Total clicks"
          loading={loadingPerf}
          icon="👆"
        />
        <MetricCard
          label="Campaigns"
          value={performance?.activeCampaigns ?? performance?.campaignCount ?? '—'}
          subtext="Active"
          loading={loadingPerf}
          icon="📢"
        />
      </div>

      {/* ── MIDDLE ROW: Strategy + Autopilot ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        <Card className="lg:col-span-2">
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-lg">🤖</span>
                <h2 className="font-semibold text-white">AI Strategy</h2>
                {ws.aiStrategy && <Badge variant="purple" dot>Active</Badge>}
              </div>
              <p className="text-[#6B7280] text-sm">
                Generated by Nishon AI based on your business profile
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRunOptimization}
              loading={optimizing}
            >
              Run optimization
            </Button>
          </div>

          {ws.aiStrategy ? (
            <div className="space-y-4">
              <div className="bg-[#1C1C27] rounded-xl p-4 border border-[#2A2A3A]">
                <p className="text-[#D1D5DB] text-sm leading-relaxed">
                  {ws.aiStrategy.summary}
                </p>
              </div>

              {ws.aiStrategy.budgetAllocation && (
                <div className="space-y-2.5">
                  <p className="text-[#6B7280] text-xs font-medium uppercase tracking-wide">
                    Budget allocation
                  </p>
                  {Object.entries(ws.aiStrategy.budgetAllocation).map(([platform, pct]) => (
                    <div key={platform}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-[#9CA3AF] capitalize">{platform}</span>
                        <span className="text-white font-medium">{String(pct)}%</span>
                      </div>
                      <div className="h-1.5 bg-[#2A2A3A] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#7C3AED] rounded-full"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <EmptyState
              icon="🧠"
              title="No strategy yet"
              description="Complete onboarding to generate your AI strategy."
              action={{
                label: 'Generate Strategy',
                onClick: () => router.push('/onboarding'),
              }}
            />
          )}
        </Card>

        <Card>
          <div className="flex items-center gap-2 mb-4">
            <span className="text-lg">⚡</span>
            <h2 className="font-semibold text-white">Autopilot</h2>
          </div>

          <div className="space-y-2">
            {[
              { mode: 'manual',    icon: '🖐', label: 'Manual',    desc: 'You decide everything' },
              { mode: 'assisted',  icon: '🤝', label: 'Assisted',  desc: 'AI suggests, you approve' },
              { mode: 'full_auto', icon: '🚀', label: 'Full Auto', desc: 'AI runs autonomously' },
            ].map((option) => {
              const isActive = ws.autopilotMode === option.mode
              return (
                <div
                  key={option.mode}
                  onClick={() => router.push('/settings')}
                  className={`
                    p-3 rounded-xl border transition-all duration-200 cursor-pointer
                    ${isActive
                      ? 'border-[#7C3AED] bg-[#7C3AED]/10'
                      : 'border-[#2A2A3A] hover:border-[#7C3AED]/30'
                    }
                  `}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-lg">{option.icon}</span>
                    <div className="flex-1">
                      <p className={`text-sm font-medium ${isActive ? 'text-white' : 'text-[#9CA3AF]'}`}>
                        {option.label}
                      </p>
                      <p className="text-[#4B5563] text-xs">{option.desc}</p>
                    </div>
                    {isActive && <span className="w-2 h-2 rounded-full bg-[#7C3AED] shrink-0" />}
                  </div>
                </div>
              )
            })}
          </div>

          {ws.aiStrategy?.monthlyForecast && (
            <div className="mt-4 pt-4 border-t border-[#2A2A3A]">
              <p className="text-[#6B7280] text-xs font-medium uppercase tracking-wide mb-3">
                Monthly forecast
              </p>
              <div className="space-y-2">
                {[
                  { label: 'Est. Leads', value: ws.aiStrategy.monthlyForecast.estimatedLeads },
                  { label: 'Est. ROAS', value: ws.aiStrategy.monthlyForecast.estimatedRoas ? `${ws.aiStrategy.monthlyForecast.estimatedRoas?.toFixed(1)}x` : '—' },
                  { label: 'Est. CPA', value: ws.aiStrategy.monthlyForecast.estimatedCpa ? `$${ws.aiStrategy.monthlyForecast.estimatedCpa?.toFixed(0)}` : '—' },
                ].map(({ label, value }) => (
                  <div key={label} className="flex justify-between text-sm">
                    <span className="text-[#6B7280]">{label}</span>
                    <span className="text-[#A78BFA] font-medium">{value ?? '—'}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* ── BOTTOM ROW: Quick actions ── */}
      <Card padding="sm">
        <div className="flex items-center justify-between px-2">
          <p className="text-[#6B7280] text-sm font-medium">Quick actions</p>
          <div className="flex items-center gap-2">
            {[
              { label: 'Campaigns', href: '/campaigns', icon: '📢' },
              { label: 'AI Decisions', href: '/ai-decisions', icon: '🤖' },
              { label: 'Budget', href: '/budget', icon: '💰' },
              { label: 'Simulate', href: '/simulation', icon: '🔮' },
            ].map((action) => (
              <Button
                key={action.href}
                variant="ghost"
                size="sm"
                onClick={() => router.push(action.href)}
              >
                {action.icon} {action.label}
              </Button>
            ))}
          </div>
        </div>
      </Card>
    </div>
  )
}
