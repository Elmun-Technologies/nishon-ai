'use client'
import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useWorkspaceStore } from '@/stores/workspace.store'
import { useRealtimeRefresh } from '@/hooks/useRealtimeRefresh'
import { MetricCard } from '@/components/ui/MetricCard'
import { EmptyState } from '@/components/ui/EmptyState'
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
    metaApi.topAds(currentWorkspace.id, 5)
      .then((res) => setTopAds((res.data as any) ?? []))
      .catch(() => {})
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
        <div className="max-w-md w-full text-center p-10 bg-white dark:bg-slate-900 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-xl">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-violet-600 rounded-2xl flex items-center justify-center mx-auto mb-5 text-3xl shadow-lg shadow-blue-500/30">
            🚀
          </div>
          <h2 className="text-slate-900 dark:text-slate-50 text-xl font-bold mb-2">Welcome to Performa</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm mb-6 leading-relaxed">
            Complete onboarding to create your first workspace and let AI manage your ad campaigns.
          </p>
          <button
            onClick={() => router.push('/onboarding')}
            className="w-full py-3 bg-gradient-to-r from-blue-500 to-violet-600 hover:from-blue-600 hover:to-violet-700 text-white rounded-xl font-semibold transition-all duration-200 shadow-lg shadow-blue-500/30 active:scale-95"
          >
            Start Setup →
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-7xl">

      {/* Page header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">Dashboard</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            {currentWorkspace?.name} · Real-time overview
          </p>
        </div>
        <button
          onClick={handleRunOptimization}
          disabled={optimizing}
          className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-700 hover:to-blue-700 disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition-all duration-200 shadow-lg shadow-violet-500/25 active:scale-95"
        >
          {optimizing ? (
            <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Optimizing...</>
          ) : (
            <><span>⚡</span> Run AI Optimization</>
          )}
        </button>
      </div>

      {/* Alerts */}
      {error && (
        <div className="flex items-center gap-3 px-4 py-3 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 rounded-xl text-red-700 dark:text-red-300 text-sm">
          <span>⚠️</span> {error}
        </div>
      )}
      {optimizeMsg && (
        <div className="flex items-center gap-3 px-4 py-3 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 rounded-xl text-emerald-700 dark:text-emerald-300 text-sm">
          <span>✓</span> {optimizeMsg}
        </div>
      )}

      {/* Meta source badge */}
      {performance?.metaConnected && (
        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
          <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0 animate-pulse" />
          <span>
            Ko'rsatkichlar <span className="text-slate-900 dark:text-slate-100 font-medium">Meta Ads</span> dan real vaqt rejimida olinmoqda
          </span>
          <a href="/settings/meta" className="text-blue-500 hover:text-blue-600 dark:text-blue-400 hover:underline ml-1">
            sozlamalar →
          </a>
        </div>
      )}

      {/* KPI metrics */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
        <MetricCard label="Xarajat" value={formatCurrency(performance?.totalSpend ?? 0)} subtext="So'nggi 30 kun" loading={loadingPerf} icon="💰" sparkline={sparklineSpend} change={performance?.changes?.spend ?? null} />
        <MetricCard label="Daromad" value={formatCurrency(performance?.totalRevenue ?? 0)} subtext="Jami" loading={loadingPerf} icon="💵" accent />
        <MetricCard label="ROAS" value={roas > 0 ? `${roas.toFixed(2)}x` : '—'} subtext="Return on ad spend" loading={loadingPerf} icon="📈" />
        <MetricCard label="Konversiyalar" value={formatNumber(performance?.totalConversions ?? 0)} subtext="Jami" loading={loadingPerf} icon="🎯" />
        <MetricCard label="Kliklar" value={formatNumber(performance?.totalClicks ?? 0)} subtext="Jami" loading={loadingPerf} icon="👆" sparkline={sparklineClicks} change={performance?.changes?.clicks ?? null} />
        <MetricCard label="Kampaniyalar" value={performance?.activeCampaigns ?? performance?.campaignCount ?? '—'} subtext="Aktiv" loading={loadingPerf} icon="📢" />
      </div>

      {/* Learning Monitor + Forecast */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {currentWorkspace && <LearningMonitor workspaceId={currentWorkspace.id} />}
        {forecast && forecast.daily?.length > 0 && (
          <div className="lg:col-span-2 bg-white dark:bg-slate-900 dark:bg-slate-900 border border-slate-200 dark:border-slate-700/60 rounded-xl p-6 hover:border-slate-300 dark:hover:border-slate-600 hover:shadow-lg transition-all duration-300">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-base font-semibold text-slate-900 dark:text-slate-50 flex items-center gap-2">
                  <span>📊</span> Oylik xarajat bashorati
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {forecast.daysElapsed} kun o'tdi · {forecast.daysTotal} kunlik oy
                </p>
              </div>
              <div className="flex items-center gap-4 text-right">
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Hozircha</p>
                  <p className="text-slate-900 dark:text-slate-50 font-bold text-lg">${forecast.spendToDate?.toFixed(0)}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Bashorat</p>
                  <p className="text-slate-600 dark:text-slate-300 font-bold text-lg">${forecast.predictedTotal?.toFixed(0)}</p>
                </div>
              </div>
            </div>
            <SpendForecastChart daily={forecast.daily} spendToDate={forecast.spendToDate} predictedTotal={forecast.predictedTotal} />
          </div>
        )}
      </div>

      {/* Top Ads */}
      {topAds.length > 0 && (
        <div className="bg-white dark:bg-slate-900 dark:bg-slate-900 border border-slate-200 dark:border-slate-700/60 rounded-xl p-6 hover:border-slate-300 dark:hover:border-slate-600 hover:shadow-lg transition-all duration-300">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-base font-semibold text-slate-900 dark:text-slate-50">🏆 Eng yaxshi kampaniyalar</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">CTR bo'yicha top {topAds.length} ta · so'nggi 30 kun</p>
            </div>
            <button onClick={() => router.push('/settings/meta')} className="text-sm text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 font-medium transition-colors">
              Barchasi →
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
            {topAds.map((ad, idx) => (
              <div key={ad.campaignId} className="group bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 rounded-xl p-4 hover:border-slate-300 dark:hover:border-slate-600 hover:bg-white dark:bg-slate-900 dark:hover:bg-slate-800 hover:shadow-md transition-all duration-200">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400 bg-slate-200 dark:bg-slate-700 px-2 py-0.5 rounded-md">#{idx + 1}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-md font-medium ${ad.status === 'ACTIVE' ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400' : 'bg-slate-100 dark:bg-slate-700 text-slate-500'}`}>
                    {ad.status}
                  </span>
                </div>
                <p className="text-slate-800 dark:text-slate-200 text-xs font-medium leading-tight mb-3 line-clamp-2 min-h-[2.5rem]">{ad.name}</p>
                <div className="mb-3">
                  <p className="text-slate-500 dark:text-slate-400 text-[10px] uppercase tracking-wider">CTR</p>
                  <p className="text-slate-900 dark:text-slate-50 text-lg font-bold">{ad.ctr.toFixed(2)}%</p>
                </div>
                <div className="grid grid-cols-2 gap-2 pt-3 border-t border-slate-200 dark:border-slate-700">
                  <div>
                    <p className="text-slate-500 dark:text-slate-400 text-[10px] uppercase tracking-wider">Xarajat</p>
                    <p className="text-slate-700 dark:text-slate-300 text-xs font-semibold">{formatCurrency(ad.spend)}</p>
                  </div>
                  <div>
                    <p className="text-slate-500 dark:text-slate-400 text-[10px] uppercase tracking-wider">Kliklar</p>
                    <p className="text-slate-700 dark:text-slate-300 text-xs font-semibold">{formatNumber(ad.clicks)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* AI Strategy + Autopilot */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 dark:bg-slate-900 border border-slate-200 dark:border-slate-700/60 rounded-xl p-6 hover:border-slate-300 dark:hover:border-slate-600 hover:shadow-lg transition-all duration-300">
          <div className="flex items-start justify-between mb-5">
            <div>
              <div className="flex items-center gap-2.5 mb-1">
                <div className="w-8 h-8 bg-gradient-to-br from-violet-500 to-blue-600 rounded-lg flex items-center justify-center text-sm">🤖</div>
                <h2 className="font-semibold text-slate-900 dark:text-slate-50">AI Strategy</h2>
                {ws.aiStrategy && (
                  <span className="text-xs bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 px-2 py-0.5 rounded-full font-medium">Active</span>
                )}
              </div>
              <p className="text-slate-500 dark:text-slate-400 text-sm">Generated by Performa based on your business profile</p>
            </div>
            <button
              onClick={handleRunOptimization}
              disabled={optimizing}
              className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-medium rounded-lg transition-all duration-200 disabled:opacity-50"
            >
              Run optimization
            </button>
          </div>
          {ws.aiStrategy ? (
            <div className="space-y-4">
              <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-200 dark:border-slate-700/50">
                <p className="text-slate-700 dark:text-slate-300 text-sm leading-relaxed">{ws.aiStrategy.summary}</p>
              </div>
              {ws.aiStrategy.budgetAllocation && (
                <div className="space-y-3">
                  <p className="text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider">Budget allocation</p>
                  {Object.entries(ws.aiStrategy.budgetAllocation).map(([platform, pct]) => (
                    <div key={platform}>
                      <div className="flex justify-between text-sm mb-1.5">
                        <span className="text-slate-600 dark:text-slate-400 capitalize">{platform}</span>
                        <span className="text-slate-900 dark:text-slate-100 font-semibold">{String(pct)}%</span>
                      </div>
                      <div className="h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-violet-500 to-blue-500 rounded-full transition-all duration-700" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <EmptyState icon="🧠" title="No strategy yet" description="Complete onboarding to generate your AI strategy." action={{ label: 'Generate Strategy', onClick: () => router.push('/onboarding') }} />
          )}
        </div>

        {/* Autopilot */}
        <div className="bg-white dark:bg-slate-900 dark:bg-slate-900 border border-slate-200 dark:border-slate-700/60 rounded-xl p-6 hover:border-slate-300 dark:hover:border-slate-600 hover:shadow-lg transition-all duration-300">
          <div className="flex items-center gap-2.5 mb-5">
            <div className="w-8 h-8 bg-gradient-to-br from-amber-400 to-orange-500 rounded-lg flex items-center justify-center text-sm">⚡</div>
            <h2 className="font-semibold text-slate-900 dark:text-slate-50">Autopilot</h2>
          </div>
          <div className="space-y-2">
            {[
              { mode: 'manual', icon: '🖐', label: 'Manual', desc: 'You decide everything' },
              { mode: 'assisted', icon: '🤝', label: 'Assisted', desc: 'AI suggests, you approve' },
              { mode: 'full_auto', icon: '🚀', label: 'Full Auto', desc: 'AI runs autonomously' },
            ].map((option) => {
              const isActive = ws.autopilotMode === option.mode
              return (
                <div
                  key={option.mode}
                  onClick={() => router.push('/settings')}
                  className={`p-3 rounded-xl border transition-all duration-200 cursor-pointer ${
                    isActive
                      ? 'border-slate-900 dark:border-slate-400 bg-slate-50 dark:bg-slate-800 shadow-sm'
                      : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-lg">{option.icon}</span>
                    <div className="flex-1">
                      <p className={`text-sm font-semibold ${isActive ? 'text-slate-900 dark:text-slate-50' : 'text-slate-500 dark:text-slate-400'}`}>{option.label}</p>
                      <p className="text-slate-400 dark:text-slate-500 text-xs">{option.desc}</p>
                    </div>
                    {isActive && <span className="w-2 h-2 rounded-full bg-slate-900 dark:bg-slate-100 shrink-0" />}
                  </div>
                </div>
              )
            })}
          </div>
          {ws.aiStrategy?.monthlyForecast && (
            <div className="mt-5 pt-5 border-t border-slate-200 dark:border-slate-700">
              <p className="text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider mb-3">Monthly forecast</p>
              <div className="space-y-2.5">
                {[
                  { label: 'Est. Leads', value: ws.aiStrategy.monthlyForecast.estimatedLeads },
                  { label: 'Est. ROAS', value: ws.aiStrategy.monthlyForecast.estimatedRoas ? `${ws.aiStrategy.monthlyForecast.estimatedRoas?.toFixed(1)}x` : '—' },
                  { label: 'Est. CPA', value: ws.aiStrategy.monthlyForecast.estimatedCpa ? `$${ws.aiStrategy.monthlyForecast.estimatedCpa?.toFixed(0)}` : '—' },
                ].map(({ label, value }) => (
                  <div key={label} className="flex justify-between text-sm">
                    <span className="text-slate-500 dark:text-slate-400">{label}</span>
                    <span className="text-slate-900 dark:text-slate-100 font-semibold">{value ?? '—'}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white dark:bg-slate-900 dark:bg-slate-900 border border-slate-200 dark:border-slate-700/60 rounded-xl px-6 py-4 flex items-center justify-between hover:border-slate-300 dark:hover:border-slate-600 transition-all duration-200">
        <p className="text-slate-500 dark:text-slate-400 text-sm font-medium shrink-0">Tezkor amallar</p>
        <div className="flex items-center gap-2 flex-wrap justify-end">
          {[
            { label: 'Kampaniyalar', href: '/campaigns', icon: '📢' },
            { label: 'AI Qarorlar', href: '/ai-decisions', icon: '🤖' },
            { label: 'Byudjet', href: '/budget', icon: '💰' },
            { label: 'Qoidalar', href: '/triggersets', icon: '⚡' },
            { label: 'Simulyatsiya', href: '/simulation', icon: '🔮' },
          ].map((action) => (
            <button
              key={action.href}
              onClick={() => router.push(action.href)}
              className="flex items-center gap-1.5 px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-600 dark:text-slate-400 font-medium hover:border-slate-400 dark:hover:border-slate-500 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all duration-200 active:scale-95"
            >
              <span>{action.icon}</span> {action.label}
            </button>
          ))}
        </div>
      </div>

      <ChatWidget />
    </div>
  )
}
