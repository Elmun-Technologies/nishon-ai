'use client'

import { useCallback, useEffect, useState } from 'react'
import { useWorkspaceStore } from '@/stores/workspace.store'
import {
  approveRecommendation,
  fetchAgentsForWorkspace,
  rejectRecommendation,
  triggerOptimization,
} from './api'
import { DEMO_MY_AGENTS, type MyAgent } from './mock-data'

export interface UseAgentsResult {
  agents: MyAgent[]
  loading: boolean
  error: string | null
  /** True if we're showing demo data (no workspace or no decisions yet). */
  isDemo: boolean
  /** Force a fresh fetch from the backend. */
  refresh: () => Promise<void>
  /** Approve a recommendation by id. Optimistically updates UI. */
  approve: (id: string) => Promise<void>
  /** Reject a recommendation by id. Optimistically updates UI. */
  reject: (id: string) => Promise<void>
  /** Trigger a new optimization run on the backend. */
  optimizing: boolean
  optimize: () => Promise<void>
}

export function useAgents(): UseAgentsResult {
  const { currentWorkspace } = useWorkspaceStore()
  const workspaceId = currentWorkspace?.id

  const [agents, setAgents] = useState<MyAgent[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isDemo, setIsDemo] = useState(true)
  const [optimizing, setOptimizing] = useState(false)

  const load = useCallback(async () => {
    if (!workspaceId) {
      setAgents(DEMO_MY_AGENTS)
      setIsDemo(true)
      setLoading(false)
      setError(null)
      return
    }
    setLoading(true)
    setError(null)
    try {
      const real = await fetchAgentsForWorkspace(workspaceId)
      // If backend has at least one decision in any agent — show real.
      const hasAny = real.some((a) => a.recommendationsCount > 0)
      if (hasAny) {
        setAgents(real)
        setIsDemo(false)
      } else {
        // Show the 3 empty platform agents (real backend, just no decisions yet)
        // so the user can trigger optimization.
        setAgents(real)
        setIsDemo(false)
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Xato')
      // Fall back to demo so UI doesn't break.
      setAgents(DEMO_MY_AGENTS)
      setIsDemo(true)
    } finally {
      setLoading(false)
    }
  }, [workspaceId])

  useEffect(() => {
    void load()
  }, [load])

  const approve = useCallback(
    async (id: string) => {
      // Optimistic update.
      setAgents((prev) =>
        prev.map((a) => ({
          ...a,
          recent: a.recent.map((r) =>
            r.id === id ? { ...r, approvalStatus: 'approved' as const } : r,
          ),
          approvedCount: a.recent.find((r) => r.id === id) ? a.approvedCount + 1 : a.approvedCount,
        })),
      )
      if (isDemo) return
      try {
        await approveRecommendation(id)
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : 'Approve xato')
        // Revert on error.
        void load()
      }
    },
    [isDemo, load],
  )

  const reject = useCallback(
    async (id: string) => {
      setAgents((prev) =>
        prev.map((a) => ({
          ...a,
          recent: a.recent.map((r) =>
            r.id === id ? { ...r, approvalStatus: 'rejected' as const } : r,
          ),
        })),
      )
      if (isDemo) return
      try {
        await rejectRecommendation(id)
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : 'Reject xato')
        void load()
      }
    },
    [isDemo, load],
  )

  const optimize = useCallback(async () => {
    if (!workspaceId) {
      setError("Avval workspace tanlang")
      return
    }
    setOptimizing(true)
    setError(null)
    try {
      await triggerOptimization(workspaceId)
      // After optimization the backend creates new decisions — refresh.
      await load()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Optimizatsiya xato')
    } finally {
      setOptimizing(false)
    }
  }, [workspaceId, load])

  return {
    agents,
    loading,
    error,
    isDemo,
    refresh: load,
    approve,
    reject,
    optimizing,
    optimize,
  }
}
