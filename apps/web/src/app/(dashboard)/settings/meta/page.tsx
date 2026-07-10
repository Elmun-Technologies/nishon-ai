'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import {
  connectMeta,
  fetchMetaDashboard,
  triggerSync,
  type MetaDashboard,
  type MetaDashboardAccount,
  type MetaDashboardCampaign,
  type MetaHealthScore,
} from '@/lib/meta'
import { useWorkspaceStore } from '@/stores/workspace.store'
import { MetaTermsReviewModal } from '@/components/settings/MetaTermsReviewModal'
import { useI18n } from '@/i18n/use-i18n'

type TFn = (key: string, fallback?: string) => string

// ─── Sub-components ───────────────────────────────────────────────────────────

function HealthBadge({ health }: { health: MetaHealthScore }) {
  const { t } = useI18n()
  const cfg = {
    GOOD: { dot: 'bg-emerald-400', text: 'text-emerald-400', bg: 'bg-emerald-400/10 border-emerald-400/20', label: t('settingsMeta.healthGood', 'Good') },
    AVERAGE: { dot: 'bg-amber-400', text: 'text-amber-400', bg: 'bg-amber-400/10 border-amber-400/20', label: t('settingsMeta.healthAverage', 'Average') },
    BAD: { dot: 'bg-red-400', text: 'text-red-400', bg: 'bg-red-400/10 border-red-400/20', label: t('settingsMeta.healthPoor', 'Poor') },
  }[health]

  return (
    <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-md border ${cfg.bg} ${cfg.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  )
}

function ActionBadge({ action }: { action: string }) {
  const cfg: Record<string, string> = {
    SCALE: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    MONITOR: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    STOP: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
    KILL: 'bg-red-500/10 text-red-400 border-red-500/20',
  }
  return (
    <span className={`text-xs px-2 py-0.5 rounded-md border ${cfg[action] ?? 'bg-surface-2 text-text-tertiary border-border'}`}>
      {action}
    </span>
  )
}

function StatusDot({ status }: { status: string }) {
  const active = status === 'ACTIVE'
  return (
    <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${active ? 'bg-emerald-400' : 'bg-surface-2'}`} />
  )
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-center">
      <p className="text-base font-semibold text-text-primary">{value}</p>
      <p className="text-xs text-text-tertiary mt-0.5">{label}</p>
    </div>
  )
}

interface AccountRecommendation {
  title: string
  detail: string
}

function buildAccountRecommendations(account: MetaDashboardAccount, t: TFn): AccountRecommendation[] {
  const totalCampaigns = account.campaigns.length
  const activeCampaigns = account.campaigns.filter((c) => c.status === 'ACTIVE').length
  const spend = account.campaigns.reduce((s, c) => s + c.metrics.spend, 0)
  const clicks = account.campaigns.reduce((s, c) => s + c.metrics.clicks, 0)
  const impressions = account.campaigns.reduce((s, c) => s + c.metrics.impressions, 0)
  const ctr = impressions > 0 ? (clicks / impressions) * 100 : 0
  const cpc = clicks > 0 ? spend / clicks : 0

  const tips: AccountRecommendation[] = []

  if (totalCampaigns === 0) {
    tips.push({
      title: t('settingsMeta.recNoCampaignsTitle', 'No campaigns'),
      detail: t('settingsMeta.recNoCampaignsDetail', 'Account connected, but no campaigns found. Check the structure and objective after syncing.'),
    })
    return tips
  }

  if (activeCampaigns === 0) {
    tips.push({
      title: t('settingsMeta.recAllPausedTitle', 'All campaigns paused'),
      detail: t('settingsMeta.recAllPausedDetail', 'Activate at least 1 test campaign (ACTIVE), otherwise no signal reaches you from the account.'),
    })
  } else if (activeCampaigns < Math.ceil(totalCampaigns * 0.4)) {
    tips.push({
      title: t('settingsMeta.recFewActiveTitle', 'Few active campaigns'),
      detail: `${t('settingsMeta.recFewActivePre', 'Currently ')}${activeCampaigns}/${totalCampaigns}${t('settingsMeta.recFewActivePost', ' active. Simplify the structure and activate the winning ad sets.')}`,
    })
  }

  if (ctr < 1) {
    tips.push({
      title: t('settingsMeta.recLowCtrTitle', 'Low CTR'),
      detail: `CTR ${ctr.toFixed(2)}%.${t('settingsMeta.recLowCtrPost', ' Refresh the creative angle, hook and CTA via A/B testing.')}`,
    })
  }

  if (cpc > 1.5) {
    tips.push({
      title: t('settingsMeta.recHighCpcTitle', 'High CPC'),
      detail: `${t('settingsMeta.recHighCpcPre', 'Average CPC $')}${cpc.toFixed(2)}.${t('settingsMeta.recHighCpcPost', ' Clean up audience overlap and placements.')}`,
    })
  }

  if (spend > 0 && clicks === 0) {
    tips.push({
      title: t('settingsMeta.recSpendNoClicksTitle', 'Spend but no clicks'),
      detail: t('settingsMeta.recSpendNoClicksDetail', 'Budget is being spent, but there is no traffic. Check tracking and targeting immediately.'),
    })
  }

  if (tips.length === 0) {
    tips.push({
      title: t('settingsMeta.recHealthyTitle', 'Account healthy'),
      detail: t('settingsMeta.recHealthyDetail', 'Core metrics look good. Scale the winning campaigns step by step.'),
    })
  }

  return tips
}

function CampaignRow({ campaign }: { campaign: MetaDashboardCampaign }) {
  const { t } = useI18n()
  const [open, setOpen] = useState(false)
  const { spend, clicks, impressions, ctr, cpc } = campaign.metrics

  return (
    <div className="border border-border rounded-xl overflow-hidden">
      {/* Header row */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-surface-2 transition-colors text-left"
      >
        <StatusDot status={campaign.status} />
        <span className="flex-1 min-w-0 text-sm text-text-primary truncate">{campaign.name}</span>
        <HealthBadge health={campaign.ai.health} />
        <ActionBadge action={campaign.ai.action} />
        <span className="text-sm font-medium text-text-primary ml-2 shrink-0">
          ${spend.toFixed(2)}
        </span>
        {/* Chevron */}
        <svg
          width="16" height="16" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth={2}
          className={`text-text-tertiary shrink-0 transition-transform ${open ? 'rotate-180' : ''}`}
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {/* Expanded metrics */}
      {open && (
        <div className="border-t border-border px-4 py-4 bg-surface">
          <div className="grid grid-cols-5 gap-4 mb-4">
            <Metric label={t('settingsMeta.metricSpend', 'Spend')} value={`$${spend.toFixed(2)}`} />
            <Metric label={t('settingsMeta.metricImpressions', 'Impressions')} value={impressions.toLocaleString()} />
            <Metric label={t('settingsMeta.metricClicks', 'Clicks')} value={clicks.toLocaleString()} />
            <Metric label={t('settingsMeta.metricCtr', 'CTR')} value={`${ctr.toFixed(2)}%`} />
            <Metric label={t('settingsMeta.metricCpc', 'CPC')} value={`$${cpc.toFixed(2)}`} />
          </div>
          {campaign.ai.reason && (
            <div className="flex items-start gap-2 rounded-lg bg-surface-2 border border-border p-3">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="text-text-secondary mt-0.5 shrink-0">
                <path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
              <p className="text-xs text-text-tertiary leading-relaxed">{campaign.ai.reason}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function AccountCard({
  account,
  selected,
  onSelectToggle,
}: {
  account: MetaDashboardAccount
  selected: boolean
  onSelectToggle: () => void
}) {
  const { t } = useI18n()
  const totalSpend = account.campaigns.reduce((s, c) => s + c.metrics.spend, 0)
  const totalImpressions = account.campaigns.reduce((s, c) => s + c.metrics.impressions, 0)
  const totalClicks = account.campaigns.reduce((s, c) => s + c.metrics.clicks, 0)
  const recommendations = buildAccountRecommendations(account, t)
  const campaignCount = account.campaigns.length
  const campaignWord = campaignCount !== 1
    ? t('settingsMeta.campaignsPlural', 'campaigns')
    : t('settingsMeta.campaignSingular', 'campaign')

  return (
    <div className="rounded-xl border border-border bg-surface overflow-hidden">
      {/* Account header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-border">
        <div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={selected}
              onChange={onSelectToggle}
              className="rounded border-border"
            />
            <p className="text-sm font-semibold text-text-primary">{account.name}</p>
          </div>
          <p className="text-xs text-text-tertiary mt-0.5">
            {account.id} · {account.currency ?? '—'} · {account.timezone ?? '—'}
          </p>
        </div>
        <span className="text-xs px-2 py-1 rounded-lg bg-surface-2 border border-border text-text-tertiary">
          {campaignCount} {campaignWord}
        </span>
      </div>

      {/* Aggregate stats */}
      <div className="grid grid-cols-3 divide-x divide-[#2A2A3A] border-b border-border">
        <div className="px-5 py-3 text-center">
          <p className="text-sm font-semibold text-text-primary">${totalSpend.toFixed(2)}</p>
          <p className="text-xs text-text-tertiary">{t('settingsMeta.totalSpend', 'Total Spend')}</p>
        </div>
        <div className="px-5 py-3 text-center">
          <p className="text-sm font-semibold text-text-primary">{totalImpressions.toLocaleString()}</p>
          <p className="text-xs text-text-tertiary">{t('settingsMeta.metricImpressions', 'Impressions')}</p>
        </div>
        <div className="px-5 py-3 text-center">
          <p className="text-sm font-semibold text-text-primary">{totalClicks.toLocaleString()}</p>
          <p className="text-xs text-text-tertiary">{t('settingsMeta.metricClicks', 'Clicks')}</p>
        </div>
      </div>

      {/* Campaigns */}
      <div className="p-4 space-y-2">
        <div className="rounded-lg border border-border bg-surface-2 p-3">
          <p className="text-xs font-semibold text-text-secondary mb-1.5">{t('settingsMeta.accountRecommendations', 'Account recommendations')}</p>
          <ul className="space-y-1">
            {recommendations.map((tip) => (
              <li key={tip.title} className="text-xs text-text-tertiary">
                <span className="font-medium text-text-secondary">{tip.title}:</span> {tip.detail}
              </li>
            ))}
          </ul>
        </div>
        {account.campaigns.length === 0 ? (
          <p className="text-sm text-text-tertiary text-center py-4">{t('settingsMeta.noCampaignsFound', 'No campaigns found.')}</p>
        ) : (
          account.campaigns.map((campaign) => (
            <CampaignRow key={campaign.id} campaign={campaign} />
          ))
        )}
      </div>
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

type PageState = 'loading' | 'not-connected' | 'connected' | 'error'

export default function MetaSettingsPage() {
  const { t } = useI18n()
  const currentWorkspace = useWorkspaceStore((s) => s.currentWorkspace)
  const workspaceId = currentWorkspace?.id ?? ''

  const [pageState, setPageState] = useState<PageState>('loading')
  const [dashboard, setDashboard] = useState<MetaDashboard | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [syncing, setSyncing] = useState(false)
  const [syncResult, setSyncResult] = useState<string | null>(null)
  const [syncResultError, setSyncResultError] = useState(false)
  const [justConnected, setJustConnected] = useState(false)
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null)
  const [connecting, setConnecting] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [query, setQuery] = useState('')
  const [selectedAccounts, setSelectedAccounts] = useState<Set<string>>(new Set())
  const [showOnlySelected, setShowOnlySelected] = useState(false)
  const [metaTermsOpen, setMetaTermsOpen] = useState(false)

  const loadDashboard = useCallback(async (background = false) => {
    if (!workspaceId) return
    setError(null)
    if (background) setRefreshing(true)

    try {
      const data = await fetchMetaDashboard(workspaceId)
      setDashboard(data)
      setPageState('connected')
    } catch (err: any) {
      const status = err?.response?.status
      // 404 = no Meta integration found for this workspace
      if (status === 404 || status === 403) {
        setPageState('not-connected')
      } else {
        setError(err?.message ?? t('settingsMeta.errorTitle', 'Failed to load Meta data'))
        setPageState('error')
      }
    } finally {
      if (background) setRefreshing(false)
    }
  }, [workspaceId, t])

  // On mount: detect OAuth redirect and trigger initial load
  useEffect(() => {
    if (!workspaceId) {
      setPageState('not-connected')
      return
    }

    const params = new URLSearchParams(window.location.search)
    if (params.get('connected') === '1') {
      setJustConnected(true)
      // Clean URL
      window.history.replaceState({}, '', window.location.pathname)
    }

    void loadDashboard(false)
  }, [workspaceId, loadDashboard])

  useEffect(() => {
    if (pageState !== 'connected') return
    const timer = window.setInterval(() => {
      void loadDashboard(true)
    }, 60000)
    return () => window.clearInterval(timer)
  }, [pageState, loadDashboard])

  // After connecting: auto-trigger sync to pull initial data
  useEffect(() => {
    if (justConnected && workspaceId) {
      void handleSync()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [justConnected])

  async function handleSync() {
    if (!workspaceId || syncing) return
    setSyncing(true)
    setSyncResult(null)
    setSyncResultError(false)

    try {
      const result = await triggerSync(workspaceId)
      setLastSyncedAt(new Date())
      if (result.errors.length === 0) {
        const accountWord = result.accountsSynced !== 1
          ? t('settingsMeta.accountsPlural', 'accounts')
          : t('settingsMeta.accountSingular', 'account')
        const campaignWord = result.campaignsSynced !== 1
          ? t('settingsMeta.campaignsPlural', 'campaigns')
          : t('settingsMeta.campaignSingular', 'campaign')
        setSyncResult(
          `${t('settingsMeta.synced', 'Synced')} ${result.accountsSynced} ${accountWord}, ${result.campaignsSynced} ${campaignWord}`,
        )
        setSyncResultError(false)
      } else {
        const errorWord = result.errors.length !== 1
          ? t('settingsMeta.errorsPlural', 'errors')
          : t('settingsMeta.errorSingular', 'error')
        setSyncResult(`${t('settingsMeta.partialSync', 'Partial sync:')} ${result.errors.length} ${errorWord}`)
        setSyncResultError(true)
      }
      await loadDashboard(true)
    } catch (err: any) {
      setSyncResult(`${t('settingsMeta.syncFailedPrefix', 'Sync failed:')} ${err?.message ?? t('settingsMeta.unknownError', 'Unknown error')}`)
      setSyncResultError(true)
    } finally {
      setSyncing(false)
    }
  }

  function handleConnect() {
    if (!workspaceId || connecting) return
    setConnecting(true)
    connectMeta(workspaceId)
  }

  // ── Loading ────────────────────────────────────────────────────────────────
  if (pageState === 'loading') {
    return (
      <div className="max-w-6xl mx-auto space-y-4">
        <MetaPageHeader />
        <div className="rounded-2xl border border-border/70 bg-white/85 p-12 shadow-sm backdrop-blur-sm flex items-center justify-center dark:bg-slate-900/70">
          <div className="flex items-center gap-3 text-text-tertiary">
            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <span className="text-sm">{t('settingsMeta.loading', 'Loading Meta integration…')}</span>
          </div>
        </div>
      </div>
    )
  }

  // ── No workspace selected ──────────────────────────────────────────────────
  if (!workspaceId) {
    return (
      <div className="max-w-6xl mx-auto space-y-4">
        <MetaPageHeader />
        <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-6">
          <p className="text-sm text-amber-400">
            {t('settingsMeta.noWorkspace', 'No workspace selected. Please select a workspace from the sidebar first.')}
          </p>
        </div>
      </div>
    )
  }

  // ── Error ──────────────────────────────────────────────────────────────────
  if (pageState === 'error') {
    return (
      <div className="max-w-6xl mx-auto space-y-4">
        <MetaPageHeader />
        <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-6 flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-red-400">{t('settingsMeta.errorTitle', 'Failed to load Meta data')}</p>
            <p className="text-xs text-text-tertiary mt-1">{error}</p>
          </div>
          <button
            type="button"
            onClick={() => { setPageState('loading'); void loadDashboard() }}
            className="text-xs px-3 py-1.5 rounded-lg border border-border text-text-secondary hover:bg-surface-2 transition-colors shrink-0 ml-4"
          >
            {t('settingsMeta.retry', 'Retry')}
          </button>
        </div>
      </div>
    )
  }

  // ── Not connected ──────────────────────────────────────────────────────────
  if (pageState === 'not-connected') {
    return (
      <div className="max-w-6xl mx-auto space-y-4">
        <MetaPageHeader />
        <div className="rounded-2xl border border-border/70 bg-white/85 p-8 text-center shadow-sm backdrop-blur-sm dark:bg-slate-900/70">
          {/* Meta logo */}
          <div className="w-16 h-16 rounded-2xl bg-surface-2 border border-border flex items-center justify-center mx-auto mb-5">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor" className="text-blue-400">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
            </svg>
          </div>

          <h2 className="text-lg font-semibold text-text-primary mb-2">{t('settingsMeta.connectTitle', 'Connect Meta Ads')}</h2>
          <p className="text-sm text-text-tertiary max-w-sm mx-auto mb-6 leading-relaxed">
            {t('settingsMeta.connectSubtitle', 'Connect your Meta Business account to sync Facebook and Instagram campaigns, spend, and AI-powered insights.')}
          </p>

          {/* Benefits */}
          <div className="grid grid-cols-3 gap-3 max-w-lg mx-auto mb-8">
            {[
              { icon: '📊', label: t('settingsMeta.benefitMetrics', 'Campaign metrics') },
              { icon: '🤖', label: t('settingsMeta.benefitHealth', 'AI health scores') },
              { icon: '🔄', label: t('settingsMeta.benefitAutoSync', 'Auto-sync every 10m') },
            ].map((b) => (
              <div key={b.label} className="rounded-xl border border-border bg-surface p-3">
                <div className="text-xl mb-1">{b.icon}</div>
                <p className="text-xs text-text-tertiary">{b.label}</p>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={handleConnect}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-violet-500 text-white text-sm font-medium transition-colors hover:opacity-95"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="text-text-primary">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
            </svg>
            {t('settingsMeta.connectButton', 'Connect with Meta')}
          </button>
          <p className="text-xs text-text-tertiary mt-4">
            {t('settingsMeta.connectDisclaimer', "You'll be redirected to Meta to authorize access. No passwords are shared.")}
          </p>
        </div>
      </div>
    )
  }

  // ── Connected ──────────────────────────────────────────────────────────────
  const accounts = dashboard?.accounts ?? []
  const filteredAccounts = accounts
    .filter((a) => a.name.toLowerCase().includes(query.toLowerCase()) || a.id.toLowerCase().includes(query.toLowerCase()))
    .filter((a) => (showOnlySelected ? selectedAccounts.has(a.id) : true))
  const totalAccounts = accounts.length
  const totalCampaigns = accounts.reduce((s, a) => s + a.campaigns.length, 0)
  const totalSpend = accounts.reduce(
    (s, a) => s + a.campaigns.reduce((cs, c) => cs + c.metrics.spend, 0),
    0,
  )

  return (
    <div className="max-w-6xl mx-auto space-y-5">
      <MetaTermsReviewModal open={metaTermsOpen} onClose={() => setMetaTermsOpen(false)} />
      <MetaPageHeader />

      {/* Just connected banner */}
      {justConnected && (
        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-5 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} className="text-emerald-400 shrink-0">
              <path d="M5 13l4 4L19 7" />
            </svg>
            <p className="text-sm text-emerald-400 font-medium">{t('settingsMeta.connectedSuccess', 'Meta connected successfully!')}</p>
          </div>
          <button type="button" onClick={() => setJustConnected(false)} aria-label={t('settingsMeta.dismiss', 'Dismiss')} className="text-emerald-400/60 hover:text-emerald-400">
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>
      )}

      {/* Status bar */}
      <div className="rounded-2xl border border-border/70 bg-white/85 px-5 py-4 shadow-sm backdrop-blur-sm flex items-center justify-between flex-wrap gap-3 dark:bg-slate-900/70">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-surface-2 border border-border flex items-center justify-center shrink-0">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="text-blue-400">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
            </svg>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-text-primary">Meta Ads</span>
              <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-md bg-emerald-400/10 text-emerald-400 border border-emerald-400/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                {t('settingsMeta.statusConnected', 'Connected')}
              </span>
            </div>
            <p className="text-xs text-text-tertiary mt-0.5">
              {lastSyncedAt
                ? `${t('settingsMeta.lastSyncedPrefix', 'Last synced:')} ${lastSyncedAt.toLocaleTimeString()}`
                : t('settingsMeta.autoSyncEvery10', 'Auto-syncs every 10 minutes')}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap justify-end">
          <button
            type="button"
            onClick={() => setMetaTermsOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-amber-500/30 text-sm text-amber-700 dark:text-amber-300 hover:bg-amber-500/10 transition-colors"
          >
            {t('settingsMeta.reviewMetaTerms', 'Review Meta terms')}
          </button>
          {refreshing && <span className="text-xs text-text-tertiary">{t('settingsMeta.refreshing', 'Refreshing…')}</span>}
          {syncResult && (
            <span className={`text-xs ${syncResultError ? 'text-red-400' : 'text-emerald-400'}`}>
              {syncResult}
            </span>
          )}
          <button
            type="button"
            onClick={() => void loadDashboard(true)}
            disabled={refreshing || syncing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-sm text-text-secondary hover:bg-surface-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {refreshing ? t('settingsMeta.refreshing', 'Refreshing…') : t('settingsMeta.reload', 'Reload')}
          </button>
          <button
            type="button"
            onClick={() => void handleSync()}
            disabled={syncing || refreshing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-blue-500 to-violet-500 text-sm text-white hover:opacity-95 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <svg
              width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
              className={syncing ? 'animate-spin' : ''}
            >
              <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
            </svg>
            {syncing ? t('settingsMeta.syncing', 'Syncing…') : t('settingsMeta.syncNow', 'Sync Now')}
          </button>
        </div>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: t('settingsMeta.statAdAccounts', 'Ad Accounts'), value: totalAccounts.toString() },
          { label: t('settingsMeta.statCampaigns', 'Campaigns'), value: totalCampaigns.toString() },
          { label: t('settingsMeta.statTotalSpend30d', 'Total Spend (30d)'), value: `$${totalSpend.toFixed(2)}` },
        ].map((stat) => (
          <div key={stat.label} className="rounded-2xl border border-border/70 bg-white/85 px-4 py-4 text-center shadow-sm backdrop-blur-sm dark:bg-slate-900/70">
            <p className="text-xl font-bold text-text-primary">{stat.value}</p>
            <p className="text-xs text-text-tertiary mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Accounts & campaigns */}
      {accounts.length === 0 ? (
        <div className="rounded-xl border border-border bg-surface p-10 text-center">
          <p className="text-sm font-medium text-text-primary mb-1">{t('settingsMeta.noDataTitle', 'No data yet')}</p>
          <p className="text-xs text-text-tertiary mb-5">
            {t('settingsMeta.noDataDetail', 'Your Meta account is connected but no campaigns have been synced yet.')}
          </p>
          <button
            type="button"
            onClick={() => void handleSync()}
            disabled={syncing}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary hover:bg-primary/90 text-brand-ink text-sm font-medium disabled:opacity-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
          >
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} className={syncing ? 'animate-spin' : ''}>
              <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
            </svg>
            {syncing ? t('settingsMeta.syncing', 'Syncing…') : t('settingsMeta.syncNow', 'Sync Now')}
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="rounded-2xl border border-border/70 bg-white/85 p-3 shadow-sm backdrop-blur-sm flex items-center gap-2 flex-wrap dark:bg-slate-900/70">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t('settingsMeta.searchPlaceholder', 'Search ad account...')}
              className="px-3 py-2 rounded-lg border border-border text-sm text-text-primary flex-1 min-w-56 bg-surface"
            />
            <button
              type="button"
              onClick={() => {
                if (selectedAccounts.size === filteredAccounts.length) {
                  setSelectedAccounts(new Set())
                } else {
                  setSelectedAccounts(new Set(filteredAccounts.map((a) => a.id)))
                }
              }}
              className="text-xs px-3 py-2 rounded-lg border border-border text-text-secondary hover:bg-surface-2"
            >
              {selectedAccounts.size === filteredAccounts.length ? t('settingsMeta.clearSelection', 'Clear selection') : t('settingsMeta.selectVisible', 'Select visible')}
            </button>
            <button
              type="button"
              onClick={() => setShowOnlySelected((v) => !v)}
              className={`text-xs px-3 py-2 rounded-lg border ${
                showOnlySelected ? 'border-border bg-gradient-to-r from-blue-500 to-violet-500 text-white' : 'border-border text-text-secondary hover:bg-surface-2'
              }`}
            >
              {showOnlySelected ? t('settingsMeta.showingSelected', 'Showing selected') : t('settingsMeta.showSelectedOnly', 'Show selected only')}
            </button>
            <span className="text-xs text-text-tertiary">
              {t('settingsMeta.selectedCount', 'Selected:')} {selectedAccounts.size}
            </span>
          </div>

          <h2 className="text-sm font-semibold text-text-tertiary uppercase tracking-wider px-1">
            {t('settingsMeta.statAdAccounts', 'Ad Accounts')} ({filteredAccounts.length}/{totalAccounts})
          </h2>
          {filteredAccounts.map((account) => (
            <AccountCard
              key={account.id}
              account={account}
              selected={selectedAccounts.has(account.id)}
              onSelectToggle={() =>
                setSelectedAccounts((prev) => {
                  const next = new Set(prev)
                  if (next.has(account.id)) next.delete(account.id)
                  else next.add(account.id)
                  return next
                })
              }
            />
          ))}
        </div>
      )}

      {/* Reconnect */}
      <div className="rounded-2xl border border-border/70 bg-white/85 px-5 py-4 shadow-sm backdrop-blur-sm flex items-center justify-between dark:bg-slate-900/70">
        <div>
          <p className="text-sm font-medium text-text-primary">{t('settingsMeta.reconnectTitle', 'Reconnect Meta')}</p>
          <p className="text-xs text-text-tertiary mt-0.5">
            {t('settingsMeta.reconnectDetail', 'Refresh your Meta access token or connect a different account.')}
          </p>
        </div>
        <button
          type="button"
          onClick={handleConnect}
          disabled={connecting}
          className="text-xs px-3 py-1.5 rounded-lg border border-border text-text-tertiary hover:text-text-primary hover:bg-surface-2 transition-colors shrink-0"
        >
          {connecting ? t('settingsMeta.redirecting', 'Redirecting…') : t('settingsMeta.reconnect', 'Reconnect')}
        </button>
      </div>
    </div>
  )
}

// ─── Page header ──────────────────────────────────────────────────────────────

function MetaPageHeader() {
  const { t } = useI18n()
  return (
    <section className="rounded-2xl border border-blue-200/70 bg-gradient-to-r from-blue-50 via-indigo-50 to-violet-50 p-4 dark:border-slate-700 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800">
      <div className="flex items-center gap-2 text-xs text-text-tertiary mb-3">
        <Link href="/settings" className="hover:text-text-primary transition-colors">{t('settingsMeta.breadcrumbSettings', 'Settings')}</Link>
        <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path d="M9 18l6-6-6-6" />
        </svg>
        <span className="text-text-tertiary">{t('settingsMeta.breadcrumbMeta', 'Meta Integration')}</span>
      </div>
      <h1 className="text-2xl font-bold text-text-primary">{t('settingsMeta.pageTitle', 'Meta Ads Integration')}</h1>
      <p className="mt-1 text-sm text-text-tertiary">
        {t('settingsMeta.pageSubtitle', 'Manage your Facebook and Instagram advertising connection.')}
      </p>
    </section>
  )
}
