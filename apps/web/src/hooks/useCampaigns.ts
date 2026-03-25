'use client'

import { useState, useEffect } from 'react'
import { campaigns as campaignsApi } from '@/lib/api-client'
import { useWorkspaceStore } from '@/stores/workspace.store'

export function useCampaigns() {
  const { currentWorkspace: activeWorkspace } = useWorkspaceStore()
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!activeWorkspace?.id) {
      setLoading(false)
      return
    }
    setLoading(true)
    campaignsApi
      .list(activeWorkspace.id)
      .then((res: any) => {
        const list = Array.isArray(res) ? res : res?.data ?? []
        setData(list)
        setError(null)
      })
      .catch((err: any) => {
        setError(err?.message ?? 'Failed to load campaigns')
      })
      .finally(() => setLoading(false))
  }, [activeWorkspace?.id])

  return { campaigns: data, loading, error }
}
