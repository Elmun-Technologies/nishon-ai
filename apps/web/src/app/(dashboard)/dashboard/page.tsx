'use client'
import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { BarChart3, Bot, Brain, Gauge, Layers, Pencil, Settings2 } from 'lucide-react'
import { useWorkspaceStore } from '@/stores/workspace.store'
import { useI18n } from '@/i18n/use-i18n'
import { useRealtimeRefresh } from '@/hooks/useRealtimeRefresh'
import { MetricCard } from '@/components/ui/MetricCard'
import { EmptyState } from '@/components/ui/EmptyState'
import { Alert, Button, DataTable, PageHeader } from '@/components/ui'
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

function MetaGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  )
}

export default function DashboardPage() {
  const { t } = useI18n()
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
  }, [currentWorkspace?.id, loadPerformance])

  useRealtimeRefresh(currentWorkspace?.id, ['meta_synced', 'optimization_done'], loadPerformance)

  async function handleRunOptimization() {
    if (!currentWorkspace?.id) return
    setOptimizing(true); setOptimizeMsg(''); setError('')
    try {
      await aiAgent.optimize(currentWorkspace.id)
      setOptimizeMsg(t('dashboard.optimizationDone', 'Optimization complete — check AI Decisions for results.'))
      setTimeout(() => setOptimizeMsg(''), 4000)
    } catch (err: any) {
      setError(err?.message ?? t('dashboard.optimizationFailed', 'Optimization failed'))
      setTimeout(() => setError(''), 4000)
    } finally { setOptimizing(false) }
  }

  const ws = currentWorkspace
  const roas = performance?.overallRoas ?? performance?.avgRoas ?? 0
  const sparklineSpend = performance?.sparkline?.map((p) => p.spend) ?? []
  const sparklineClicks = performance?.sparkline?.map((p) => p.clicks) ?? []

  if (!ws) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="w-full max-w-xl rounded-2xl border border-border bg-surface p-6">
          <EmptyState
            icon="Workspace"
            title={t('dashboard.welcomeToAdSpectr', 'Welcome to AdSpectr')}
            description={t('dashboard.completeOnboarding', 'Complete onboarding to create your first workspace and let AI manage your ad campaigns.')}
            action={{
              label: t('dashboard.startSetup', 'Start Setup'),
              onClick: () => router.push('/onboarding'),
            }}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-7xl">
      <section className="rounded-2xl border border-blue-200/70 bg-gradient-to-r from-blue-50 via-indigo-50 to-violet-50 p-3 dark:border-slate-700 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800">
        <PageHeader
          className="mb-0 border-0 bg-transparent p-2 shadow-none"
          title={t('navigation.dashboard', 'Dashboard')}
          subtitle={`${currentWorkspace?.name ?? ''} · ${t('dashboard.realtimeOverview', 'Real-time overview')}`}
          actions={
            <Button onClick={handleRunOptimization} disabled={optimizing} className="shadow-sm">
              {optimizing ? t('dashboard.optimizing', 'Optimizing...') : t('dashboard.runOptimization', 'Run AI Optimization')}
            </Button>
          }
        />
      </section>

      {/* Alerts */}
      {error && (
        <Alert variant="error">{error}</Alert>
      )}
      {optimizeMsg && (
        <Alert variant="success">{optimizeMsg}</Alert>
      )}

      {/* Meta source badge */}
      {performance?.metaConnected && (
        <div className="flex items-center gap-2 rounded-xl border border-blue-200/70 bg-blue-50/70 px-3 py-2 text-xs text-blue-900 dark:border-blue-900/50 dark:bg-blue-950/20 dark:text-blue-200">
          <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0 animate-pulse" />
          <span>
            {t('dashboard.metaRealtimePrefix', 'Metrics are streamed in real-time from')} <span className="text-text-primary dark:text-text-secondary font-medium">Meta Ads</span>
          </span>
          <Link href="/settings/meta" className="text-blue-500 hover:text-blue-600 dark:text-blue-400 hover:underline ml-1">
            {t('dashboard.settingsLink', 'settings')} →
          </Link>
        </div>
      )}

      {/* Blended summary + KPI grid (Madgicx-style business dashboard) */}
      <section className="rounded-2xl border border-border/70 bg-white/85 shadow-sm backdrop-blur-sm overflow-hidden dark:bg-slate-900/70">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/70 px-4 py-3.5 bg-surface-2/30 dark:bg-slate-900/80">
          <div className="flex flex-wrap items-center gap-3 min-w-0">
            <div className="flex items-center gap-2 text-text-primary">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500/20 to-blue-500/20 border border-violet-500/25">
                <Layers className="h-4 w-4 text-violet-600 dark:text-violet-300" />
              </span>
              <div>
                <h2 className="text-sm font-semibold tracking-tight">{t('dashboard.blendedSummary', 'Blended summary')}</h2>
                <p className="text-[11px] text-text-tertiary">{t('dashboard.blendedSummaryHint', 'Cross-channel KPIs from connected sources')}</p>
              </div>
            </div>
            <span className="hidden sm:inline text-[11px] text-text-tertiary px-2 py-0.5 rounded-md border border-border/80 bg-surface">
              {t('dashboard.last30Days', 'Last 30 days')}
            </span>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1.5 rounded-lg border border-border/80 bg-surface px-2 py-1" title={t('dashboard.connectedSources', 'Connected sources')}>
              <span className={`flex h-7 w-7 items-center justify-center rounded-md ${performance?.metaConnected ? 'bg-blue-500/15 text-blue-500' : 'bg-surface-2 text-text-tertiary'}`}>
                <MetaGlyph className="h-4 w-4" />
              </span>
              <span
                className={`flex h-7 w-7 items-center justify-center rounded-md text-[10px] font-bold tracking-tight ${
                  performance?.metaConnected ? 'bg-pink-500/10 text-pink-600 dark:text-pink-300' : 'bg-surface-2 text-text-tertiary opacity-60'
                }`}
                title="Instagram"
              >
                IG
              </span>
              <span className="flex h-7 w-7 items-center justify-center rounded-md bg-surface-2 text-xs font-bold text-text-tertiary">G</span>
              <span className="flex h-7 w-7 items-center justify-center rounded-md bg-surface-2 text-xs font-bold text-text-tertiary">TT</span>
            </div>
            <Link
              href="/reporting"
              className="inline-flex items-center gap-1 rounded-lg border border-border px-2.5 py-1.5 text-xs font-medium text-text-secondary hover:bg-surface-2 hover:text-text-primary transition-colors"
            >
              <Pencil className="h-3.5 w-3.5 opacity-70" />
              {t('dashboard.viewReporting', 'Reporting')}
            </Link>
          </div>
        </div>
        <div className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
            <MetricCard label="Xarajat" value={formatCurrency(performance?.totalSpend ?? 0)} subtext="So'nggi 30 kun" loading={loadingPerf} icon="💰" sparkline={sparklineSpend} change={performance?.changes?.spend ?? null} />
            <MetricCard label="Daromad" value={formatCurrency(performance?.totalRevenue ?? 0)} subtext="Jami" loading={loadingPerf} icon="💵" accent />
            <MetricCard label="ROAS" value={roas > 0 ? `${roas.toFixed(2)}x` : '—'} subtext="Return on ad spend" loading={loadingPerf} icon="📈" />
            <MetricCard label="Konversiyalar" value={formatNumber(performance?.totalConversions ?? 0)} subtext="Jami" loading={loadingPerf} icon="🎯" />
            <MetricCard label="Kliklar" value={formatNumber(performance?.totalClicks ?? 0)} subtext="Jami" loading={loadingPerf} icon="👆" sparkline={sparklineClicks} change={performance?.changes?.clicks ?? null} />
            <MetricCard label="Kampaniyalar" value={performance?.activeCampaigns ?? performance?.campaignCount ?? '—'} subtext="Aktiv" loading={loadingPerf} icon="📢" />
          </div>
        </div>
      </section>

      {/* Connect more data sources */}
      <section className="rounded-2xl border border-border/70 bg-white/85 shadow-sm backdrop-blur-sm overflow-hidden dark:bg-slate-900/70">
        <div className="flex items-center gap-2.5 border-b border-border/70 px-4 py-3.5 bg-surface-2/30 dark:bg-slate-900/80">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-blue-600 text-white text-xs font-bold">P</span>
          <div>
            <h2 className="text-sm font-semibold text-text-primary">{t('dashboard.connectDataTitle', 'Connect more data sources')}</h2>
            <p className="text-[11px] text-text-tertiary">{t('dashboard.connectDataSubtitle', 'Unlock blended metrics, LTV, and cross-channel reporting.')}</p>
          </div>
        </div>
        <ul className="divide-y divide-border/70">
          {[
            { id: 'meta', label: 'Facebook / Meta Ads', href: '/settings/meta', connected: !!performance?.metaConnected, glyph: <MetaGlyph className="h-5 w-5 text-blue-500" /> },
            { id: 'google', label: 'Google Ads', href: '/settings/integrations', connected: false, glyph: <span className="text-lg font-bold text-blue-600">G</span> },
            { id: 'ga4', label: 'Google Analytics 4', href: '/settings/integrations', connected: false, glyph: <span className="text-lg">📊</span> },
            { id: 'shopify', label: 'Shopify', href: '/settings/integrations', connected: false, glyph: <span className="text-lg">🛍</span> },
            { id: 'tiktok', label: 'TikTok Ads', href: '/settings/integrations', connected: false, glyph: <span className="text-sm font-bold tracking-tight">TT</span> },
            { id: 'klaviyo', label: 'Klaviyo', href: '/settings/integrations', connected: false, glyph: <span className="text-lg">✉️</span> },
          ].map((src) => (
            <li key={src.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3.5 hover:bg-surface-2/40 transition-colors">
              <div className="flex items-center gap-3 min-w-0">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border/80 bg-surface">{src.glyph}</span>
                <span className="text-sm font-medium text-text-primary truncate">{src.label}</span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {src.connected ? (
                  <>
                    <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">{t('dashboard.sourceConnected', 'Connected')}</span>
                    <Link href={src.href} className="text-xs font-semibold text-violet-600 dark:text-violet-300 hover:underline">
                      {t('dashboard.manageSource', 'Manage')}
                    </Link>
                  </>
                ) : (
                  <Link
                    href={src.href}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-blue-500 to-violet-500 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:opacity-95 transition-opacity"
                  >
                    {t('dashboard.connectSource', 'Connect')}
                  </Link>
                )}
              </div>
            </li>
          ))}
        </ul>
      </section>

      {/* Learning Monitor + Forecast */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {currentWorkspace && <LearningMonitor workspaceId={currentWorkspace.id} />}
        {forecast && forecast.daily?.length > 0 && (
          <div className="lg:col-span-2 rounded-2xl border border-border/70 bg-white/85 p-6 shadow-sm backdrop-blur-sm hover:shadow-lg transition-all duration-300 dark:bg-slate-900/70">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-base font-semibold text-text-primary flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-primary" />
                  {t('dashboard.monthlySpendForecast', 'Monthly spend forecast')}
                </h2>
                <p className="text-xs text-text-tertiary mt-0.5">
                  {forecast.daysElapsed} kun o'tdi · {forecast.daysTotal} kunlik oy
                </p>
              </div>
              <div className="flex items-center gap-4 text-right">
                <div>
                  <p className="text-xs text-text-tertiary">Hozircha</p>
                  <p className="text-text-primary font-bold text-lg">${forecast.spendToDate?.toFixed(0)}</p>
                </div>
                <div>
                  <p className="text-xs text-text-tertiary">Bashorat</p>
                  <p className="text-text-secondary font-bold text-lg">${forecast.predictedTotal?.toFixed(0)}</p>
                </div>
              </div>
            </div>
            <SpendForecastChart daily={forecast.daily} spendToDate={forecast.spendToDate} predictedTotal={forecast.predictedTotal} />
          </div>
        )}
      </div>

      {/* Top Ads */}
      {topAds.length > 0 && (
        <div className="rounded-2xl border border-border/70 bg-white/85 p-6 shadow-sm backdrop-blur-sm hover:shadow-lg transition-all duration-300 dark:bg-slate-900/70">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-base font-semibold text-text-primary">{t('dashboard.topCampaigns', 'Top campaigns')}</h2>
              <p className="text-xs text-text-tertiary mt-0.5">{t('dashboard.topCampaignsSubtitle', `Top ${topAds.length} by CTR · last 30 days`)}</p>
            </div>
            <Button variant="secondary" size="sm" onClick={() => router.push('/settings/meta')}>
              {t('common.view', 'View')} →
            </Button>
          </div>
          <DataTable
            rows={topAds}
            rowKey={(row) => row.campaignId}
            columns={[
              {
                key: 'campaign',
                header: t('dashboard.campaign', 'Campaign'),
                render: (row) => <span className="font-medium text-text-primary">{row.name}</span>,
              },
              {
                key: 'status',
                header: t('dashboard.status', 'Status'),
                render: (row) => (
                  <span className={`rounded-full px-2 py-1 text-xs ${row.status === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-surface-2 text-text-tertiary'}`}>
                    {row.status}
                  </span>
                ),
              },
              { key: 'ctr', header: 'CTR', render: (row) => `${row.ctr.toFixed(2)}%` },
              { key: 'spend', header: t('dashboard.spend', 'Spend'), render: (row) => formatCurrency(row.spend) },
              { key: 'clicks', header: t('dashboard.clicks', 'Clicks'), render: (row) => formatNumber(row.clicks) },
            ]}
          />
        </div>
      )}

      {/* AI Strategy + Autopilot */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 rounded-2xl border border-border/70 bg-white/85 p-6 shadow-sm backdrop-blur-sm hover:shadow-lg transition-all duration-300 dark:bg-slate-900/70">
          <div className="flex items-start justify-between mb-5">
            <div>
              <div className="flex items-center gap-2.5 mb-1">
                <div className="w-8 h-8 bg-gradient-to-br from-violet-500 to-blue-600 rounded-lg flex items-center justify-center">
                  <Bot className="h-4 w-4 text-white" />
                </div>
                <h2 className="font-semibold text-text-primary">AI Strategy</h2>
                {ws.aiStrategy && (
                  <span className="text-xs bg-emerald-500/10 dark:bg-emerald-950 text-emerald-500 dark:text-emerald-400 border border-emerald-500/20 dark:border-emerald-800 px-2 py-0.5 rounded-full font-medium">Active</span>
                )}
              </div>
              <p className="text-text-tertiary text-sm">Generated by AdSpectr based on your business profile</p>
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={handleRunOptimization}
              disabled={optimizing}
            >
              {t('dashboard.runOptimization', 'Run optimization')}
            </Button>
          </div>
          {ws.aiStrategy ? (
            <div className="space-y-4">
              <div className="bg-surface-2 rounded-xl p-4 border border-border/50">
                <p className="text-text-secondary text-sm leading-relaxed">{ws.aiStrategy.summary}</p>
              </div>
              {ws.aiStrategy.budgetAllocation && (
                <div className="space-y-3">
                  <p className="text-text-tertiary text-xs font-semibold uppercase tracking-wider">Budget allocation</p>
                  {Object.entries(ws.aiStrategy.budgetAllocation).map(([platform, pct]) => (
                    <div key={platform}>
                      <div className="flex justify-between text-sm mb-1.5">
                        <span className="text-text-secondary capitalize">{platform}</span>
                        <span className="text-text-primary dark:text-text-secondary font-semibold">{String(pct)}%</span>
                      </div>
                      <div className="h-1.5 bg-surface-2-2 rounded-full overflow-hidden">
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
        <div className="rounded-2xl border border-border/70 bg-white/85 p-6 shadow-sm backdrop-blur-sm hover:shadow-lg transition-all duration-300 dark:bg-slate-900/70">
          <div className="flex items-center gap-2.5 mb-5">
            <div className="w-8 h-8 bg-gradient-to-br from-amber-400 to-orange-500 rounded-lg flex items-center justify-center">
              <Gauge className="h-4 w-4 text-white" />
            </div>
            <h2 className="font-semibold text-text-primary">Autopilot</h2>
          </div>
          <div className="space-y-2">
            {[
              { mode: 'manual', label: 'Manual', desc: 'You decide everything' },
              { mode: 'assisted', label: 'Assisted', desc: 'AI suggests, you approve' },
              { mode: 'full_auto', label: 'Full Auto', desc: 'AI runs autonomously' },
            ].map((option) => {
              const isActive = ws.autopilotMode === option.mode
              return (
                <div
                  key={option.mode}
                  onClick={() => router.push('/settings/workspace/profile')}
                  className={`p-3 rounded-xl border transition-all duration-200 cursor-pointer ${
                    isActive
                      ? 'border-border bg-surface-2 shadow-sm'
                      : 'border-border hover:border-border dark:hover:border-border hover:bg-surface-2 dark:hover:bg-surface/50'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className={`h-2 w-2 rounded-full ${isActive ? 'bg-primary' : 'bg-text-tertiary'}`} />
                    <div className="flex-1">
                      <p className={`text-sm font-semibold ${isActive ? 'text-text-primary' : 'text-text-tertiary'}`}>{option.label}</p>
                      <p className="text-text-tertiary text-xs">{option.desc}</p>
                    </div>
                    {isActive && <span className="w-2 h-2 rounded-full bg-surface-2 shrink-0" />}
                  </div>
                </div>
              )
            })}
          </div>
          {ws.aiStrategy?.monthlyForecast && (
            <div className="mt-5 pt-5 border-t border-border">
              <p className="text-text-tertiary text-xs font-semibold uppercase tracking-wider mb-3">Monthly forecast</p>
              <div className="space-y-2.5">
                {[
                  { label: 'Est. Leads', value: ws.aiStrategy.monthlyForecast.estimatedLeads },
                  { label: 'Est. ROAS', value: ws.aiStrategy.monthlyForecast.estimatedRoas ? `${ws.aiStrategy.monthlyForecast.estimatedRoas?.toFixed(1)}x` : '—' },
                  { label: 'Est. CPA', value: ws.aiStrategy.monthlyForecast.estimatedCpa ? `$${ws.aiStrategy.monthlyForecast.estimatedCpa?.toFixed(0)}` : '—' },
                ].map(({ label, value }) => (
                  <div key={label} className="flex justify-between text-sm">
                    <span className="text-text-tertiary">{label}</span>
                    <span className="text-text-primary dark:text-text-secondary font-semibold">{value ?? '—'}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="rounded-2xl border border-border/70 bg-white/85 px-6 py-4 shadow-sm backdrop-blur-sm flex items-center justify-between transition-all duration-200 dark:bg-slate-900/70">
        <p className="text-text-tertiary text-sm font-medium shrink-0">{t('dashboard.quickActions', 'Quick actions')}</p>
        <div className="flex items-center gap-2 flex-wrap justify-end">
          {[
            { label: t('navigation.campaigns', 'Campaigns'), href: '/campaigns', icon: BarChart3 },
            { label: t('navigation.aiDecisions', 'AI Decisions'), href: '/ai-decisions', icon: Brain },
            { label: t('navigation.budget', 'Budget'), href: '/budget', icon: Settings2 },
            { label: t('navigation.simulation', 'Simulation'), href: '/simulation', icon: Gauge },
          ].map((action) => (
            <Link
              key={action.href}
              className="flex items-center gap-1.5 px-3 py-2 border border-border rounded-lg text-sm text-text-secondary font-medium hover:border-border dark:hover:border-border hover:text-text-primary dark:hover:text-text-secondary hover:bg-surface-2 dark:hover:bg-surface transition-all duration-200 active:scale-95"
              href={action.href}
            >
              <action.icon className="h-3.5 w-3.5" />
              {action.label}
            </Link>
          ))}
        </div>
      </div>

      <ChatWidget />
    </div>
  )
}
