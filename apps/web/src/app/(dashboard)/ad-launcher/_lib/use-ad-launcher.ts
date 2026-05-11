'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  meta as metaApi,
  launchOrchestrator,
  type CreateLaunchJobInput,
} from '@/lib/api-client'
import { getAccessToken, isDemoToken } from '@/lib/auth-storage'
import { useWorkspaceStore } from '@/stores/workspace.store'
import {
  DEMO_ACCOUNT,
  DEMO_CAMPAIGNS,
  DEMO_LAUNCH_HISTORY,
} from './demo-data'
import type {
  AccountSummary,
  AudiencePresetId,
  CampaignRow,
  DateRangeId,
  HistoryItem,
  LaunchConfig,
  LaunchPhase,
  SortDir,
  SortKey,
  StatusFilter,
  StepId,
} from './types'

/** Maps the raw /meta/dashboard response into rows we render in the table. */
function toCampaignRows(payload: any): { accounts: AccountSummary[]; campaigns: CampaignRow[] } {
  const accounts: AccountSummary[] = []
  const campaigns: CampaignRow[] = []
  const accountList = Array.isArray(payload?.accounts) ? payload.accounts : []
  for (const acc of accountList) {
    const accCampaigns = Array.isArray(acc?.campaigns) ? acc.campaigns : []
    accounts.push({
      id: String(acc?.id ?? ''),
      name: String(acc?.name ?? acc?.id ?? '—'),
      currency: acc?.currency ?? null,
      timezone: acc?.timezone ?? null,
      campaignCount: accCampaigns.length,
    })
    for (const c of accCampaigns) {
      campaigns.push({
        id: String(c?.id ?? ''),
        accountId: String(acc?.id ?? ''),
        name: String(c?.name ?? c?.id ?? '—'),
        status: String(c?.status ?? 'UNKNOWN').toUpperCase(),
        spend: Number(c?.metrics?.spend ?? 0),
        clicks: Number(c?.metrics?.clicks ?? 0),
        impressions: Number(c?.metrics?.impressions ?? 0),
        ctr: Number(c?.metrics?.ctr ?? 0),
        cpc: Number(c?.metrics?.cpc ?? 0),
        aiHealth: (c?.ai?.health ?? 'AVERAGE') as CampaignRow['aiHealth'],
        aiAction: (c?.ai?.action ?? 'MONITOR') as CampaignRow['aiAction'],
        aiReason: String(c?.ai?.reason ?? ''),
      })
    }
  }
  return { accounts, campaigns }
}

const FUNNEL_STAGE_BY_PRESET: Record<AudiencePresetId, CreateLaunchJobInput['audiences'][number]['funnelStage']> = {
  prospecting: 'acquisition_prospecting',
  reengagement: 'acquisition_reengagement',
  retargeting: 'retargeting',
  retention: 'retention',
}

const PRESET_NAME: Record<AudiencePresetId, string> = {
  prospecting: 'Prospecting — broad cold',
  reengagement: 'Re-engagement — warm visitors',
  retargeting: 'Retargeting — 30d traffic',
  retention: 'Retention — purchasers',
}

const HEALTH_RANK: Record<CampaignRow['aiHealth'], number> = { BAD: 0, AVERAGE: 1, GOOD: 2 }

const DEFAULT_LAUNCH_CONFIG: LaunchConfig = {
  objective: 'OUTCOME_SALES',
  budgetType: 'CBO',
  dailyBudget: 25,
  audiences: ['prospecting'],
  splitByFunnelStage: false,
}

/** Sleep helper for simulating network timings in demo mode. */
const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms))

function isDemoApiError(err: unknown): boolean {
  return Boolean(err && typeof err === 'object' && (err as any).code === 'DEMO_MODE')
}

/**
 * Centralized state and side-effects for the Ad Launcher flow.
 * Handles: data loading, selection, sort, step navigation, demo mode,
 * launch lifecycle and recent-launch history.
 */
export function useAdLauncher() {
  const { currentWorkspace } = useWorkspaceStore()
  const workspaceId = currentWorkspace?.id ?? null

  // ── Demo detection (stable across renders) ─────────────────────────────────
  const [isDemoMode, setIsDemoMode] = useState(false)
  useEffect(() => {
    setIsDemoMode(isDemoToken(getAccessToken()))
  }, [])

  // ── Step navigation ────────────────────────────────────────────────────────
  const [step, setStep] = useState<StepId>('source')

  // ── Source filters ─────────────────────────────────────────────────────────
  const [accountId, setAccountId] = useState<string>('')
  const [dateRange, setDateRange] = useState<DateRangeId>('30d')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL')

  // ── Data fetch ─────────────────────────────────────────────────────────────
  const [accounts, setAccounts] = useState<AccountSummary[]>([])
  const [campaigns, setCampaigns] = useState<CampaignRow[]>([])
  const [loading, setLoading] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [hasLoaded, setHasLoaded] = useState(false)

  // ── Pick state ─────────────────────────────────────────────────────────────
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [search, setSearch] = useState('')
  const [sortKey, setSortKey] = useState<SortKey>('spend')
  const [sortDir, setSortDir] = useState<SortDir>('desc')

  // ── Launch state ───────────────────────────────────────────────────────────
  const [launchConfig, setLaunchConfig] = useState<LaunchConfig>(DEFAULT_LAUNCH_CONFIG)
  const [launchPhase, setLaunchPhase] = useState<LaunchPhase>({ state: 'idle' })
  const [confirmOpen, setConfirmOpen] = useState(false)

  // ── History ────────────────────────────────────────────────────────────────
  const [history, setHistory] = useState<HistoryItem[]>([])
  const [historyLoading, setHistoryLoading] = useState(false)

  // ── Derived ────────────────────────────────────────────────────────────────
  const selectedCampaigns = useMemo(
    () => campaigns.filter((c) => selectedIds.has(c.id)),
    [campaigns, selectedIds],
  )

  const filteredCampaigns = useMemo(() => {
    let list = accountId ? campaigns.filter((c) => c.accountId === accountId) : campaigns
    if (statusFilter !== 'ALL') list = list.filter((c) => c.status === statusFilter)
    const q = search.trim().toLowerCase()
    if (q) {
      list = list.filter(
        (c) => c.name.toLowerCase().includes(q) || c.id.toLowerCase().includes(q),
      )
    }
    const sign = sortDir === 'asc' ? 1 : -1
    const sorted = [...list].sort((a, b) => {
      switch (sortKey) {
        case 'name':
          return a.name.localeCompare(b.name) * sign
        case 'status':
          return a.status.localeCompare(b.status) * sign
        case 'aiHealth':
          return (HEALTH_RANK[a.aiHealth] - HEALTH_RANK[b.aiHealth]) * sign
        case 'clicks':
          return (a.clicks - b.clicks) * sign
        case 'ctr':
          return (a.ctr - b.ctr) * sign
        case 'cpc':
          return (a.cpc - b.cpc) * sign
        case 'spend':
        default:
          return (a.spend - b.spend) * sign
      }
    })
    return sorted
  }, [campaigns, accountId, statusFilter, search, sortKey, sortDir])

  const selectedAccount = useMemo(
    () => accounts.find((a) => a.id === accountId) ?? null,
    [accounts, accountId],
  )

  // ── Actions ────────────────────────────────────────────────────────────────
  const loadData = useCallback(async () => {
    if (!workspaceId && !isDemoMode) {
      setLoadError('NO_WORKSPACE')
      return
    }
    setLoading(true)
    setLoadError(null)
    try {
      if (isDemoMode) {
        // Simulate a network round-trip so skeletons are visible.
        await sleep(450)
        setAccounts([DEMO_ACCOUNT])
        setCampaigns(DEMO_CAMPAIGNS)
        setHasLoaded(true)
        setAccountId((prev) => prev || DEMO_ACCOUNT.id)
        return
      }
      const res = await metaApi.dashboard(workspaceId as string)
      const { accounts: nextAccounts, campaigns: nextCampaigns } = toCampaignRows(res.data)
      setAccounts(nextAccounts)
      setCampaigns(nextCampaigns)
      setHasLoaded(true)
      if (nextAccounts[0]) setAccountId((prev) => prev || nextAccounts[0].id)
    } catch (err: any) {
      // If the API client raised our DEMO_MODE marker, fall back to demo data
      // gracefully — never surface a raw "demo" error to the user.
      if (isDemoApiError(err)) {
        await sleep(200)
        setIsDemoMode(true)
        setAccounts([DEMO_ACCOUNT])
        setCampaigns(DEMO_CAMPAIGNS)
        setHasLoaded(true)
        setAccountId((prev) => prev || DEMO_ACCOUNT.id)
        return
      }
      setHasLoaded(true)
      const code = err?.code ?? err?.response?.data?.code
      const msg = code ?? err?.message ?? 'LOAD_FAILED'
      setLoadError(msg)
    } finally {
      setLoading(false)
    }
  }, [workspaceId, isDemoMode])

  const triggerSync = useCallback(async () => {
    if (isDemoMode) {
      // Just re-shuffle the existing demo dataset to show a refreshed UI.
      setSyncing(true)
      await sleep(700)
      setSyncing(false)
      return
    }
    if (!workspaceId) {
      setLoadError('NO_WORKSPACE')
      return
    }
    setSyncing(true)
    setLoadError(null)
    try {
      await metaApi.sync(workspaceId)
      await loadData()
    } catch (err: any) {
      if (isDemoApiError(err)) {
        setIsDemoMode(true)
        await loadData()
        return
      }
      const code = err?.code ?? err?.response?.data?.code
      const msg = code ?? err?.message ?? 'SYNC_FAILED'
      setLoadError(msg)
    } finally {
      setSyncing(false)
    }
  }, [workspaceId, isDemoMode, loadData])

  const loadHistory = useCallback(async () => {
    setHistoryLoading(true)
    try {
      if (isDemoMode) {
        await sleep(250)
        setHistory(DEMO_LAUNCH_HISTORY as HistoryItem[])
        return
      }
      if (!workspaceId) return
      const res = await launchOrchestrator.list(workspaceId)
      const list = (res.data ?? []).slice(0, 5).map((j) => ({
        id: j.id,
        status: j.status,
        objective: String((j.payload as any)?.objective ?? '—'),
        audiences: Array.isArray((j.payload as any)?.audiences)
          ? (j.payload as any).audiences.map((a: any) => a?.funnelStage ?? '').filter(Boolean)
          : [],
        budgetType: ((j.payload as any)?.budgetType ?? 'CBO') as 'CBO' | 'ABO',
        createdAt: j.createdAt,
        metaCampaignId: j.payload?.launchResult?.campaignId,
        error: j.error,
      }))
      setHistory(list)
    } catch (err: unknown) {
      if (isDemoApiError(err)) {
        setIsDemoMode(true)
        setHistory(DEMO_LAUNCH_HISTORY as HistoryItem[])
      }
      // Silent: history is a non-critical secondary widget.
    } finally {
      setHistoryLoading(false)
    }
  }, [workspaceId, isDemoMode])

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  const selectAll = useCallback(() => {
    setSelectedIds(new Set(filteredCampaigns.map((c) => c.id)))
  }, [filteredCampaigns])

  const clearSelection = useCallback(() => setSelectedIds(new Set()), [])

  const toggleSort = useCallback((key: SortKey) => {
    setSortKey((prevKey) => {
      if (prevKey === key) {
        setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
        return prevKey
      }
      // numeric columns default to desc, text columns to asc
      const isNumeric = key === 'spend' || key === 'clicks' || key === 'ctr' || key === 'cpc' || key === 'aiHealth'
      setSortDir(isNumeric ? 'desc' : 'asc')
      return key
    })
  }, [])

  const goToStep = useCallback((next: StepId) => setStep(next), [])

  const updateLaunchConfig = useCallback(
    (patch: Partial<LaunchConfig>) => setLaunchConfig((prev) => ({ ...prev, ...patch })),
    [],
  )

  const requestLaunch = useCallback(() => setConfirmOpen(true), [])
  const cancelLaunch = useCallback(() => setConfirmOpen(false), [])

  const launchNow = useCallback(async () => {
    setConfirmOpen(false)
    if (launchConfig.audiences.length === 0) {
      setLaunchPhase({ state: 'error', message: 'NO_AUDIENCE' })
      return
    }
    if (isDemoMode) {
      // Simulate the full lifecycle visually so the demo feels real.
      setLaunchPhase({ state: 'creating_draft' })
      await sleep(700)
      setLaunchPhase({ state: 'validating', jobId: 'demo-job-' + Date.now() })
      await sleep(700)
      setLaunchPhase({ state: 'launching', jobId: 'demo-job-' + Date.now() })
      await sleep(900)
      setLaunchPhase({
        state: 'error',
        message: 'DEMO_LAUNCH_BLOCKED',
        jobId: undefined,
      })
      return
    }

    if (!workspaceId) {
      setLaunchPhase({ state: 'error', message: 'NO_WORKSPACE' })
      return
    }
    const payload: CreateLaunchJobInput = {
      workspaceId,
      platform: 'meta',
      objective: launchConfig.objective,
      budgetType: launchConfig.budgetType,
      dailyBudget: launchConfig.dailyBudget,
      splitByFunnelStage: launchConfig.splitByFunnelStage,
      sourceCampaignIds: [...selectedIds],
      audiences: launchConfig.audiences.map((preset) => ({
        name: PRESET_NAME[preset],
        funnelStage: FUNNEL_STAGE_BY_PRESET[preset],
      })),
    }

    setLaunchPhase({ state: 'creating_draft' })
    try {
      const draft = await launchOrchestrator.draft(payload)
      const jobId = draft.data.id
      setLaunchPhase({ state: 'validating', jobId })
      const validated = await launchOrchestrator.validate(jobId)
      if (validated.data.status === 'failed') {
        setLaunchPhase({
          state: 'error',
          message: validated.data.error ?? 'VALIDATION_FAILED',
          jobId,
        })
        return
      }
      setLaunchPhase({ state: 'launching', jobId })
      const launched = await launchOrchestrator.launch(jobId)
      if (launched.data.status === 'failed') {
        setLaunchPhase({
          state: 'error',
          message: launched.data.error ?? 'LAUNCH_FAILED',
          jobId,
        })
        return
      }
      setLaunchPhase({
        state: 'success',
        jobId,
        metaCampaignId: launched.data.payload?.launchResult?.campaignId,
      })
      // Refresh history so the new job appears in the side widget.
      void loadHistory()
    } catch (err: any) {
      const code = err?.code ?? err?.response?.data?.code
      const msg = code ?? err?.message ?? 'UNEXPECTED_ERROR'
      setLaunchPhase({ state: 'error', message: msg })
    }
  }, [workspaceId, launchConfig, isDemoMode, loadHistory, selectedIds])

  const resetLaunch = useCallback(() => {
    setLaunchPhase({ state: 'idle' })
    setLaunchConfig(DEFAULT_LAUNCH_CONFIG)
    clearSelection()
    setSearch('')
    setStep('source')
  }, [clearSelection])

  return {
    // workspace
    workspaceId,
    workspaceName: currentWorkspace?.name ?? '',
    isDemoMode,
    // step
    step,
    goToStep,
    // source
    accountId,
    setAccountId,
    dateRange,
    setDateRange,
    statusFilter,
    setStatusFilter,
    accounts,
    selectedAccount,
    // data
    campaigns,
    filteredCampaigns,
    loading,
    syncing,
    loadError,
    hasLoaded,
    loadData,
    triggerSync,
    // pick
    selectedIds,
    selectedCampaigns,
    toggleSelect,
    selectAll,
    clearSelection,
    search,
    setSearch,
    sortKey,
    sortDir,
    toggleSort,
    // launch
    launchConfig,
    updateLaunchConfig,
    launchPhase,
    confirmOpen,
    requestLaunch,
    cancelLaunch,
    launchNow,
    resetLaunch,
    // history
    history,
    historyLoading,
    loadHistory,
  }
}

export type AdLauncherController = ReturnType<typeof useAdLauncher>
