'use client'

import { useCallback, useMemo, useState } from 'react'
import {
  meta as metaApi,
  launchOrchestrator,
  type CreateLaunchJobInput,
} from '@/lib/api-client'
import { useWorkspaceStore } from '@/stores/workspace.store'
import type {
  AccountSummary,
  AudiencePresetId,
  CampaignRow,
  DateRangeId,
  LaunchConfig,
  LaunchPhase,
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

/**
 * Centralized state and side-effects for the Ad Launcher flow.
 * Handles: data loading, selection, step navigation, launch lifecycle.
 */
export function useAdLauncher() {
  const { currentWorkspace } = useWorkspaceStore()
  const workspaceId = currentWorkspace?.id ?? null

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

  // ── Launch state ───────────────────────────────────────────────────────────
  const [launchConfig, setLaunchConfig] = useState<LaunchConfig>({
    objective: 'OUTCOME_SALES',
    budgetType: 'CBO',
    dailyBudget: 25,
    audiences: ['prospecting'],
    splitByFunnelStage: false,
  })
  const [launchPhase, setLaunchPhase] = useState<LaunchPhase>({ state: 'idle' })

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
    return list
  }, [campaigns, accountId, statusFilter, search])

  const selectedAccount = useMemo(
    () => accounts.find((a) => a.id === accountId) ?? null,
    [accounts, accountId],
  )

  // ── Actions ────────────────────────────────────────────────────────────────
  const loadData = useCallback(async () => {
    if (!workspaceId) {
      setLoadError('Workspace tanlanmagan.')
      return
    }
    setLoading(true)
    setLoadError(null)
    try {
      const res = await metaApi.dashboard(workspaceId)
      const { accounts: nextAccounts, campaigns: nextCampaigns } = toCampaignRows(res.data)
      setAccounts(nextAccounts)
      setCampaigns(nextCampaigns)
      setHasLoaded(true)
      // Auto-select first account if none chosen yet
      if (!accountId && nextAccounts[0]) setAccountId(nextAccounts[0].id)
    } catch (err: any) {
      setHasLoaded(true)
      const msg = err?.message || err?.response?.data?.message || 'Ma\'lumot yuklanmadi.'
      setLoadError(msg)
    } finally {
      setLoading(false)
    }
  }, [workspaceId, accountId])

  const triggerSync = useCallback(async () => {
    if (!workspaceId) return
    setSyncing(true)
    setLoadError(null)
    try {
      await metaApi.sync(workspaceId)
      await loadData()
    } catch (err: any) {
      const msg = err?.message || err?.response?.data?.message || 'Sinxronlash bajarilmadi.'
      setLoadError(msg)
    } finally {
      setSyncing(false)
    }
  }, [workspaceId, loadData])

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

  const goToStep = useCallback((next: StepId) => setStep(next), [])

  const updateLaunchConfig = useCallback(
    (patch: Partial<LaunchConfig>) => setLaunchConfig((prev) => ({ ...prev, ...patch })),
    [],
  )

  const launchNow = useCallback(async () => {
    if (!workspaceId) {
      setLaunchPhase({ state: 'error', message: 'Workspace tanlanmagan.' })
      return
    }
    if (launchConfig.audiences.length === 0) {
      setLaunchPhase({ state: 'error', message: 'Kamida bitta auditoriya tanlang.' })
      return
    }
    const payload: CreateLaunchJobInput = {
      workspaceId,
      platform: 'meta',
      objective: launchConfig.objective,
      budgetType: launchConfig.budgetType,
      splitByFunnelStage: launchConfig.splitByFunnelStage,
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
          message: validated.data.error ?? 'Validatsiya muvaffaqiyatsiz.',
          jobId,
        })
        return
      }
      setLaunchPhase({ state: 'launching', jobId })
      const launched = await launchOrchestrator.launch(jobId)
      if (launched.data.status === 'failed') {
        setLaunchPhase({
          state: 'error',
          message: launched.data.error ?? 'Ishga tushirish muvaffaqiyatsiz.',
          jobId,
        })
        return
      }
      setLaunchPhase({
        state: 'success',
        jobId,
        metaCampaignId: launched.data.payload?.launchResult?.campaignId,
      })
    } catch (err: any) {
      const msg = err?.message || err?.response?.data?.message || 'Kutilmagan xato.'
      setLaunchPhase({ state: 'error', message: msg })
    }
  }, [workspaceId, launchConfig])

  const resetLaunch = useCallback(() => {
    setLaunchPhase({ state: 'idle' })
    clearSelection()
    setStep('source')
  }, [clearSelection])

  return {
    // workspace
    workspaceId,
    workspaceName: currentWorkspace?.name ?? '',
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
    // launch
    launchConfig,
    updateLaunchConfig,
    launchPhase,
    launchNow,
    resetLaunch,
  }
}

export type AdLauncherController = ReturnType<typeof useAdLauncher>
