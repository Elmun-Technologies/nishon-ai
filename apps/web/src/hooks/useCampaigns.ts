import { useState, useEffect, useCallback } from 'react'
import { useWorkspaceStore } from '@/stores/workspace.store'
import { campaigns as campaignsApi } from '@/lib/api-client'

export interface CampaignRow {
  id: string
  name: string
  platform: string
  platforms?: string[]
  status: string
  objective: string
  dailyBudget: number
  totalBudget: number
  totalSpend?: number
  totalClicks?: number
  totalConversions?: number
  externalId?: string | null
  createdAt: string
  adSets?: unknown[]
}

export function useCampaigns() {
  const { currentWorkspace } = useWorkspaceStore()
  const [campaigns, setCampaigns] = useState<CampaignRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetch = useCallback(async () => {
    if (!currentWorkspace?.id) return
    setLoading(true)
    setError(null)
    try {
      const res = await campaignsApi.list(currentWorkspace.id)
      setCampaigns((res.data as CampaignRow[]) ?? [])
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load campaigns')
    } finally {
      setLoading(false)
    }
  }, [currentWorkspace?.id])

  useEffect(() => {
    fetch()
  }, [fetch])

  return { campaigns, loading, error, refetch: fetch }
}
