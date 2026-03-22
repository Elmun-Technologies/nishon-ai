'use client'

import { useCallback, useEffect, useState } from 'react'
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

// ─── Sub-components ───────────────────────────────────────────────────────────

function HealthBadge({ health }: { health: MetaHealthScore }) {
  const cfg = {
    GOOD: { dot: 'bg-emerald-400', text: 'text-emerald-400', bg: 'bg-emerald-400/10 border-emerald-400/20', label: 'Good' },
    AVERAGE: { dot: 'bg-amber-400', text: 'text-amber-400', bg: 'bg-amber-400/10 border-amber-400/20', label: 'Average' },
    BAD: { dot: 'bg-red-400', text: 'text-red-400', bg: 'bg-red-400/10 border-red-400/20', label: 'Poor' },
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
    <span className={`text-xs px-2 py-0.5 rounded-md border ${cfg[action] ?? 'bg-[#1C1C27] text-[#6B7280] border-[#2A2A3A]'}`}>
      {action}
    </span>
  )
}

function StatusDot({ status }: { status: string }) {
  const active = status === 'ACTIVE'
  return (
    <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${active ? 'bg-emerald-400' : 'bg-[#4B5563]'}`} />
  )
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-center">
      <p className="text-base font-semibold text-white">{value}</p>
      <p className="text-xs text-[#6B7280] mt-0.5">{label}</p>
    </div>
  )
}

function CampaignRow({ campaign }: { campaign: MetaDashboardCampaign }) {
  const [open, setOpen] = useState(false)
  const { spend, clicks, impressions, ctr, cpc } = campaign.metrics

  return (
    <div className="border border-[#2A2A3A] rounded-xl overflow-hidden">
      {/* Header row */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[#1C1C27] transition-colors text-left"
      >
        <StatusDot status={campaign.status} />
        <span className="flex-1 min-w-0 text-sm text-white truncate">{campaign.name}</span>
        <HealthBadge health={campaign.ai.health} />
        <ActionBadge action={campaign.ai.action} />
        <span className="text-sm font-medium text-white ml-2 shrink-0">
          ${spend.toFixed(2)}
        </span>
        {/* Chevron */}
        <svg
          width="16" height="16" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth={2}
          className={`text-[#4B5563] shrink-0 transition-transform ${open ? 'rotate-180' : ''}`}
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {/* Expanded metrics */}
      {open && (
        <div className="border-t border-[#2A2A3A] px-4 py-4 bg-[#0A0A10]">
          <div className="grid grid-cols-5 gap-4 mb-4">
            <Metric label="Spend" value={`$${spend.toFixed(2)}`} />
            <Metric label="Impressions" value={impressions.toLocaleString()} />
            <Metric label="Clicks" value={clicks.toLocaleString()} />
            <Metric label="CTR" value={`${ctr.toFixed(2)}%`} />
            <Metric label="CPC" value={`$${cpc.toFixed(2)}`} />
          </div>
          {campaign.ai.reason && (
            <div className="flex items-start gap-2 rounded-lg bg-[#1C1C27] border border-[#2A2A3A] p-3">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="text-[#A78BFA] mt-0.5 shrink-0">
                <path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
              <p className="text-xs text-[#9CA3AF] leading-relaxed">{campaign.ai.reason}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function AccountCard({ account }: { account: MetaDashboardAccount }) {
  const totalSpend = account.campaigns.reduce((s, c) => s + c.metrics.spend, 0)
  const totalImpressions = account.campaigns.reduce((s, c) => s + c.metrics.impressions, 0)
  const totalClicks = account.campaigns.reduce((s, c) => s + c.metrics.clicks, 0)

  return (
    <div className="rounded-xl border border-[#2A2A3A] bg-[#0F0F15] overflow-hidden">
      {/* Account header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-[#2A2A3A]">
        <div>
          <p className="text-sm font-semibold text-white">{account.name}</p>
          <p className="text-xs text-[#6B7280] mt-0.5">
            {account.id} · {account.currency ?? '—'} · {account.timezone ?? '—'}
          </p>
        </div>
        <span className="text-xs px-2 py-1 rounded-lg bg-[#1C1C27] border border-[#2A2A3A] text-[#9CA3AF]">
          {account.campaigns.length} campaign{account.campaigns.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Aggregate stats */}
      <div className="grid grid-cols-3 divide-x divide-[#2A2A3A] border-b border-[#2A2A3A]">
        <div className="px-5 py-3 text-center">
          <p className="text-sm font-semibold text-white">${totalSpend.toFixed(2)}</p>
          <p className="text-xs text-[#6B7280]">Total Spend</p>
        </div>
        <div className="px-5 py-3 text-center">
          <p className="text-sm font-semibold text-white">{totalImpressions.toLocaleString()}</p>
          <p className="text-xs text-[#6B7280]">Impressions</p>
        </div>
        <div className="px-5 py-3 text-center">
          <p className="text-sm font-semibold text-white">{totalClicks.toLocaleString()}</p>
          <p className="text-xs text-[#6B7280]">Clicks</p>
        </div>
      </div>

      {/* Campaigns */}
      <div className="p-4 space-y-2">
        {account.campaigns.length === 0 ? (
          <p className="text-sm text-[#6B7280] text-center py-4">No campaigns found.</p>
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
  const currentWorkspace = useWorkspaceStore((s) => s.currentWorkspace)
  const workspaceId = currentWorkspace?.id ?? ''

  const [pageState, setPageState] = useState<PageState>('loading')
  const [dashboard, setDashboard] = useState<MetaDashboard | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [syncing, setSyncing] = useState(false)
  const [syncResult, setSyncResult] = useState<string | null>(null)
  const [justConnected, setJustConnected] = useState(false)
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null)

  const loadDashboard = useCallback(async () => {
    if (!workspaceId) return
    setError(null)

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
        setError(err?.message ?? 'Failed to load Meta data')
        setPageState('error')
      }
    }
  }, [workspaceId])

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

    void loadDashboard()
  }, [workspaceId, loadDashboard])

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

    try {
      const result = await triggerSync(workspaceId)
      setLastSyncedAt(new Date())
      setSyncResult(
        result.errors.length === 0
          ? `Synced ${result.accountsSynced} account${result.accountsSynced !== 1 ? 's' : ''}, ${result.campaignsSynced} campaign${result.campaignsSynced !== 1 ? 's' : ''}`
          : `Partial sync: ${result.errors.length} error${result.errors.length !== 1 ? 's' : ''}`,
      )
      await loadDashboard()
    } catch (err: any) {
      setSyncResult(`Sync failed: ${err?.message ?? 'Unknown error'}`)
    } finally {
      setSyncing(false)
    }
  }

  function handleConnect() {
    if (!workspaceId) return
    connectMeta(workspaceId)
  }

  // ── Loading ────────────────────────────────────────────────────────────────
  if (pageState === 'loading') {
    return (
      <div className="max-w-4xl mx-auto space-y-4">
        <MetaPageHeader />
        <div className="rounded-xl border border-[#2A2A3A] bg-[#0F0F15] p-12 flex items-center justify-center">
          <div className="flex items-center gap-3 text-[#6B7280]">
            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <span className="text-sm">Loading Meta integration…</span>
          </div>
        </div>
      </div>
    )
  }

  // ── No workspace selected ──────────────────────────────────────────────────
  if (!workspaceId) {
    return (
      <div className="max-w-4xl mx-auto space-y-4">
        <MetaPageHeader />
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-6">
          <p className="text-sm text-amber-400">
            No workspace selected. Please select a workspace from the sidebar first.
          </p>
        </div>
      </div>
    )
  }

  // ── Error ──────────────────────────────────────────────────────────────────
  if (pageState === 'error') {
    return (
      <div className="max-w-4xl mx-auto space-y-4">
        <MetaPageHeader />
        <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-6 flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-red-400">Failed to load Meta data</p>
            <p className="text-xs text-[#9CA3AF] mt-1">{error}</p>
          </div>
          <button
            type="button"
            onClick={() => { setPageState('loading'); void loadDashboard() }}
            className="text-xs px-3 py-1.5 rounded-lg border border-[#2A2A3A] text-[#D1D5DB] hover:bg-[#1C1C27] transition-colors shrink-0 ml-4"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  // ── Not connected ──────────────────────────────────────────────────────────
  if (pageState === 'not-connected') {
    return (
      <div className="max-w-4xl mx-auto space-y-4">
        <MetaPageHeader />
        <div className="rounded-xl border border-[#2A2A3A] bg-[#0F0F15] p-8 text-center">
          {/* Meta logo */}
          <div className="w-16 h-16 rounded-2xl bg-[#1C1C27] border border-[#2A2A3A] flex items-center justify-center mx-auto mb-5">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor" className="text-blue-400">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
            </svg>
          </div>

          <h2 className="text-lg font-semibold text-white mb-2">Connect Meta Ads</h2>
          <p className="text-sm text-[#6B7280] max-w-sm mx-auto mb-6 leading-relaxed">
            Connect your Meta Business account to sync Facebook and Instagram campaigns, spend, and AI-powered insights.
          </p>

          {/* Benefits */}
          <div className="grid grid-cols-3 gap-3 max-w-lg mx-auto mb-8">
            {[
              { icon: '📊', label: 'Campaign metrics' },
              { icon: '🤖', label: 'AI health scores' },
              { icon: '🔄', label: 'Auto-sync every 10m' },
            ].map((b) => (
              <div key={b.label} className="rounded-xl border border-[#2A2A3A] bg-[#13131A] p-3">
                <div className="text-xl mb-1">{b.icon}</div>
                <p className="text-xs text-[#9CA3AF]">{b.label}</p>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={handleConnect}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#7C3AED] hover:bg-[#6D28D9] text-white text-sm font-medium transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="text-white">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
            </svg>
            Connect with Meta
          </button>
          <p className="text-xs text-[#4B5563] mt-4">
            You'll be redirected to Meta to authorize access. No passwords are shared.
          </p>
        </div>
      </div>
    )
  }

  // ── Connected ──────────────────────────────────────────────────────────────
  const accounts = dashboard?.accounts ?? []
  const totalAccounts = accounts.length
  const totalCampaigns = accounts.reduce((s, a) => s + a.campaigns.length, 0)
  const totalSpend = accounts.reduce(
    (s, a) => s + a.campaigns.reduce((cs, c) => cs + c.metrics.spend, 0),
    0,
  )

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      <MetaPageHeader />

      {/* Just connected banner */}
      {justConnected && (
        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-5 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} className="text-emerald-400 shrink-0">
              <path d="M5 13l4 4L19 7" />
            </svg>
            <p className="text-sm text-emerald-400 font-medium">Meta connected successfully!</p>
          </div>
          <button type="button" onClick={() => setJustConnected(false)} className="text-emerald-400/60 hover:text-emerald-400">
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>
      )}

      {/* Status bar */}
      <div className="rounded-xl border border-[#2A2A3A] bg-[#0F0F15] px-5 py-4 flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#1C1C27] border border-[#2A2A3A] flex items-center justify-center shrink-0">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="text-blue-400">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
            </svg>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-white">Meta Ads</span>
              <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-md bg-emerald-400/10 text-emerald-400 border border-emerald-400/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                Connected
              </span>
            </div>
            <p className="text-xs text-[#6B7280] mt-0.5">
              {lastSyncedAt
                ? `Last synced: ${lastSyncedAt.toLocaleTimeString()}`
                : 'Auto-syncs every 10 minutes'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {syncResult && (
            <span className={`text-xs ${syncResult.includes('failed') || syncResult.includes('error') ? 'text-red-400' : 'text-emerald-400'}`}>
              {syncResult}
            </span>
          )}
          <button
            type="button"
            onClick={() => void handleSync()}
            disabled={syncing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#2A2A3A] text-sm text-[#D1D5DB] hover:bg-[#1C1C27] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <svg
              width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
              className={syncing ? 'animate-spin' : ''}
            >
              <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
            </svg>
            {syncing ? 'Syncing…' : 'Sync Now'}
          </button>
        </div>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Ad Accounts', value: totalAccounts.toString() },
          { label: 'Campaigns', value: totalCampaigns.toString() },
          { label: 'Total Spend (30d)', value: `$${totalSpend.toFixed(2)}` },
        ].map((stat) => (
          <div key={stat.label} className="rounded-xl border border-[#2A2A3A] bg-[#0F0F15] px-4 py-4 text-center">
            <p className="text-xl font-bold text-white">{stat.value}</p>
            <p className="text-xs text-[#6B7280] mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Accounts & campaigns */}
      {accounts.length === 0 ? (
        <div className="rounded-xl border border-[#2A2A3A] bg-[#0F0F15] p-10 text-center">
          <p className="text-sm font-medium text-white mb-1">No data yet</p>
          <p className="text-xs text-[#6B7280] mb-5">
            Your Meta account is connected but no campaigns have been synced yet.
          </p>
          <button
            type="button"
            onClick={() => void handleSync()}
            disabled={syncing}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#7C3AED] hover:bg-[#6D28D9] text-white text-sm font-medium disabled:opacity-50 transition-colors"
          >
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} className={syncing ? 'animate-spin' : ''}>
              <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
            </svg>
            {syncing ? 'Syncing…' : 'Sync Now'}
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <h2 className="text-sm font-semibold text-[#9CA3AF] uppercase tracking-wider px-1">
            Ad Accounts ({totalAccounts})
          </h2>
          {accounts.map((account) => (
            <AccountCard key={account.id} account={account} />
          ))}
        </div>
      )}

      {/* Reconnect */}
      <div className="rounded-xl border border-[#2A2A3A] bg-[#0F0F15] px-5 py-4 flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-white">Reconnect Meta</p>
          <p className="text-xs text-[#6B7280] mt-0.5">
            Refresh your Meta access token or connect a different account.
          </p>
        </div>
        <button
          type="button"
          onClick={handleConnect}
          className="text-xs px-3 py-1.5 rounded-lg border border-[#2A2A3A] text-[#9CA3AF] hover:text-white hover:bg-[#1C1C27] transition-colors shrink-0"
        >
          Reconnect
        </button>
      </div>
    </div>
  )
}

// ─── Page header ──────────────────────────────────────────────────────────────

function MetaPageHeader() {
  return (
    <div>
      <div className="flex items-center gap-2 text-xs text-[#6B7280] mb-4">
        <a href="/settings" className="hover:text-white transition-colors">Settings</a>
        <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path d="M9 18l6-6-6-6" />
        </svg>
        <span className="text-[#9CA3AF]">Meta Integration</span>
      </div>
      <h1 className="text-2xl font-bold text-white">Meta Ads Integration</h1>
      <p className="mt-1 text-sm text-[#6B7280]">
        Manage your Facebook and Instagram advertising connection.
      </p>
    </div>
  )
}
