'use client'
import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useWorkspaceStore } from '@/stores/workspace.store'
import { useRealtimeRefresh } from '@/hooks/useRealtimeRefresh'
import { MetricCard } from '@/components/ui/MetricCard'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { Alert } from '@/components/ui/Alert'
import { workspaces as workspacesApi, aiAgent, meta as metaApi } from '@/lib/api-client'
import { formatCurrency, formatNumber } from '@/lib/utils'
import { SpendForecastChart } from '@/components/ui/SpendForecastChart'
import { LearningMonitor } from '@/components/dashboard/LearningMonitor'
import { ChatWidget } from '@/components/ui/ChatWidget'

interface SparklinePoint { day: string; spend: number; clicks: number }

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

interface TopAd {
  campaignId: string
  name: string
  status: string
  spend: number
  clicks: number
  impressions: number
  ctr: number
}

export default function DashboardPage() {
  const router = useRouter()
  const { currentWorkspace } = useWorkspaceStore()
  const [performance, setPerformance] = useState<PerformanceSummary | null>(null)
  const [loadingPerf, setLoadingPerf] = useState(true)
  const [topAds, setTopAds] = useState<TopAd[]>([])
  const [forecast, setForecast] = useState<any>(null)
  const [optimizing, setOptimizing] = useState(false)
  const [optimizeMsg, setOptimizeMsg] = useState('')
  const [error, setError] = useState('')

  const loadPerformance = useCallback(() => {
    if (!currentWorkspace?.id) return
    workspacesApi.performance(currentWorkspace.id)
      .then((res) => setPerformance((res.data as any) ?? {}))
      .catch(() => setPerformance({}))
      .finally(() => setLoadingPerf(false))
  }, [currentWorkspace?.id])

  useEffect(() => {
    if (!currentWorkspace?.id) { setLoadingPerf(false); return }
    setLoadingPerf(true)
    loadPerformance()
    // Load top performing campaigns
    metaApi.topAds(currentWorkspace.id, 5)
      .then((res) => setTopAds((res.data as any) ?? []))
      .catch(() => {})
    // Load spend forecast
    metaApi.spendForecast(currentWorkspace.id)
      .then((res) => setForecast(res.data))
      .catch(() => {})
  }, [currentWorkspace?.id])

  useRealtimeRefresh(currentWorkspace?.id, ['meta_synced', 'optimization_done'], loadPerformance)

  async function handleRunOptimization() {
    if (!currentWorkspace?.id) return
    setOptimizing(true); setOptimizeMsg(''); setError('')
    try {
      await aiAgent.optimize(currentWorkspace.id)
      setOptimizeMsg('Optimization complete — check AI Decisions for results.')
      setTimeout(() => setOptimizeMsg(''), 4000)
    } catch (err: any) {
      setError(err?.message ?? 'Optimization failed')
      setTimeout(() => setError(''), 4000)
    } finally { setOptimizing(false) }
  }

  const ws = currentWorkspace
  const roas = performance?.overallRoas ?? performance?.avgRoas ?? 0
  const sparklineSpend = performance?.sparkline?.map((p) => p.spend) ?? []
  const sparklineClicks = performance?.sparkline?.map((p) => p.clicks) ?? []

  if (!ws) {
    return (
      <div className="flex items-center justify-center h-full">
        <Card className="max-w-md w-full text-center p-8">
          <span className="text-4xl block mb-4">🚀</span>
          <h2 className="text-white text-xl font-bold mb-2">Welcome to Nishon AI</h2>
          <p className="text-[#6B7280] text-sm mb-6">
            Complete onboarding to create your first workspace and let AI manage your ad campaigns.
          </p>
          <Button onClick={() => router.push('/onboarding')}>Start Setup →</Button>
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

      {/* ── Meta data source badge ── */}
      {performance?.metaConnected && (
        <div className="flex items-center gap-2 text-xs text-[#9CA3AF]">
          <span className="w-2 h-2 rounded-full bg-[#1877F2] shrink-0" />
          <span>Ko'rsatkichlar <span className="text-white font-medium">Meta Ads</span> dan real vaqt rejimida olinmoqda</span>
          <a href="/settings/meta" className="text-[#7C3AED] hover:underline ml-1">sozlamalar →</a>
        </div>
      )}

      {/* ── KPI metrics with sparklines ── */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
        <MetricCard
          label="Xarajat"
          value={formatCurrency(performance?.totalSpend ?? 0)}
          subtext="So'nggi 30 kun"
          loading={loadingPerf}
          icon="💰"
          sparkline={sparklineSpend}
          change={performance?.changes?.spend ?? null}
        />
        <MetricCard
          label="Daromad"
          value={formatCurrency(performance?.totalRevenue ?? 0)}
          subtext="Jami"
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
          label="Konversiyalar"
          value={formatNumber(performance?.totalConversions ?? 0)}
          subtext="Jami"
          loading={loadingPerf}
          icon="🎯"
        />
        <MetricCard
          label="Kliklar"
          value={formatNumber(performance?.totalClicks ?? 0)}
          subtext="Jami"
          loading={loadingPerf}
          icon="👆"
          sparkline={sparklineClicks}
          change={performance?.changes?.clicks ?? null}
        />
        <MetricCard
          label="Kampaniyalar"
          value={performance?.activeCampaigns ?? performance?.campaignCount ?? '—'}
          subtext="Aktiv"
          loading={loadingPerf}
          icon="📢"
        />
      </div>

      {/* ── Learning Monitor + Spend Forecast row ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {currentWorkspace && (
          <LearningMonitor workspaceId={currentWorkspace.id} />
        )}
        {/* Spend Forecast (Smartly-style) — takes 2/3 columns */}
        {forecast && forecast.daily?.length > 0 && (
        <div className="lg:col-span-2">
          <Card>
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-base font-semibold text-white">Oylik xarajat bashorati</h2>
                <p className="text-xs text-[#6B7280] mt-0.5">
                  {forecast.daysElapsed} kun o'tdi · {forecast.daysTotal} kunlik oy
                </p>
              </div>
              <div className="flex items-center gap-4 text-right">
                <div>
                  <p className="text-xs text-[#6B7280]">Hozircha sarflandi</p>
                  <p className="text-white font-bold text-lg">${forecast.spendToDate?.toFixed(0)}</p>
                </div>
                <div>
                  <p className="text-xs text-[#6B7280]">Oy oxiriga bashorat</p>
                  <p className="text-[#A78BFA] font-bold text-lg">${forecast.predictedTotal?.toFixed(0)}</p>
                </div>
              </div>
            </div>
            <SpendForecastChart
              daily={forecast.daily}
              spendToDate={forecast.spendToDate}
              predictedTotal={forecast.predictedTotal}
            />
          </Card>
        </div>
        )}
      </div>

      {/* ── Best performing ads (Smartly-style) ── */}
      {topAds.length > 0 && (
        <Card>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-semibold text-white flex items-center gap-2">
                🏆 Eng yaxshi kampaniyalar
              </h2>
              <p className="text-xs text-[#6B7280] mt-0.5">
                CTR bo'yicha top {topAds.length} ta · so'nggi 30 kun
              </p>
            </div>
            <Button variant="ghost" size="sm" onClick={() => router.push('/settings/meta')}>
              Barchasi →
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
            {topAds.map((ad, idx) => (
              <div
                key={ad.campaignId}
                className="bg-[#0D0D14] border border-[#2A2A3A] rounded-xl p-3 hover:border-[#7C3AED]/40 transition-colors"
              >
                {/* Rank badge */}
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold text-[#7C3AED] bg-[#7C3AED]/10 px-1.5 py-0.5 rounded">
                    #{idx + 1}
                  </span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                    ad.status === 'ACTIVE'
                      ? 'bg-emerald-500/10 text-emerald-400'
                      : 'bg-[#2A2A3A] text-[#6B7280]'
                  }`}>
                    {ad.status}
                  </span>
                </div>

                {/* Campaign name */}
                <p className="text-white text-xs font-medium leading-tight mb-3 line-clamp-2 min-h-[2.5rem]">
                  {ad.name}
                </p>

                {/* CTR — primary metric (Smartly style) */}
                <div className="mb-2">
                  <p className="text-[#6B7280] text-[10px]">CTR</p>
                  <p className="text-white text-base font-bold">{ad.ctr.toFixed(2)}%</p>
                </div>

                {/* Secondary metrics */}
                <div className="grid grid-cols-2 gap-1 pt-2 border-t border-[#1C1C27]">
                  <div>
                    <p className="text-[#4B5563] text-[10px]">Xarajat</p>
                    <p className="text-[#9CA3AF] text-xs font-medium">{formatCurrency(ad.spend)}</p>
                  </div>
                  <div>
                    <p className="text-[#4B5563] text-[10px]">Kliklar</p>
                    <p className="text-[#9CA3AF] text-xs font-medium">{formatNumber(ad.clicks)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

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
            <Button variant="ghost" size="sm" onClick={handleRunOptimization} loading={optimizing}>
              Run optimization
            </Button>
          </div>

          {ws.aiStrategy ? (
            <div className="space-y-4">
              <div className="bg-[#1C1C27] rounded-xl p-4 border border-[#2A2A3A]">
                <p className="text-[#D1D5DB] text-sm leading-relaxed">{ws.aiStrategy.summary}</p>
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
                        <div className="h-full bg-[#7C3AED] rounded-full" style={{ width: `${pct}%` }} />
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
              action={{ label: 'Generate Strategy', onClick: () => router.push('/onboarding') }}
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

      {/* ── Quick actions ── */}
      <Card padding="sm">
        <div className="flex items-center justify-between px-2">
          <p className="text-[#6B7280] text-sm font-medium">Tezkor amallar</p>
          <div className="flex items-center gap-2 flex-wrap">
            {[
              { label: 'Kampaniyalar', href: '/campaigns', icon: '📢' },
              { label: 'AI Qarorlar', href: '/ai-decisions', icon: '🤖' },
              { label: 'Byudjet', href: '/budget', icon: '💰' },
              { label: 'Qoidalar', href: '/triggersets', icon: '⚡' },
              { label: 'Simulyatsiya', href: '/simulation', icon: '🔮' },
            ].map((action) => (
              <Button key={action.href} variant="ghost" size="sm" onClick={() => router.push(action.href)}>
                {action.icon} {action.label}
              </Button>
            ))}
          </div>
        </div>
      </Card>

      {/* ── AI Chat Widget ── */}
      <ChatWidget />
    </div>
  )
}
