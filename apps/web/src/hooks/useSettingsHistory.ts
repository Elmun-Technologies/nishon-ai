'use client'

import { useState, useEffect } from 'react'

export interface HistoryEntry {
  id: string
  settingName: string
  settingKey: string
  oldValue: string
  newValue: string
  timestamp: number
  userId?: string
  userName?: string
  action: 'created' | 'updated' | 'deleted'
}

const HISTORY_STORAGE_KEY = 'workspace-settings-history'
const MAX_HISTORY_ITEMS = 100

export function useSettingsHistory() {
  const [history, setHistory] = useState<HistoryEntry[]>([])
  const [isLoaded, setIsLoaded] = useState(false)

  // Load from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(HISTORY_STORAGE_KEY)
      if (stored) {
        try {
          setHistory(JSON.parse(stored))
        } catch (e) {
          console.error('Failed to parse history:', e)
        }
      }
      setIsLoaded(true)
    }
  }, [])

  // Save to localStorage
  useEffect(() => {
    if (isLoaded && typeof window !== 'undefined') {
      localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(history))
    }
  }, [history, isLoaded])

  const addEntry = (entry: Omit<HistoryEntry, 'id' | 'timestamp'>) => {
    const newEntry: HistoryEntry = {
      ...entry,
      id: `${Date.now()}-${Math.random()}`,
      timestamp: Date.now(),
    }

    setHistory(prev => {
      const updated = [newEntry, ...prev]
      return updated.slice(0, MAX_HISTORY_ITEMS)
    })
  }

  const getHistory = (
    filter?: {
      settingKey?: string
      startDate?: number
      endDate?: number
      userId?: string
    }
  ) => {
    let filtered = [...history]

    if (filter?.settingKey) {
      filtered = filtered.filter(h => h.settingKey === filter.settingKey)
    }

    if (filter?.startDate) {
      filtered = filtered.filter(h => h.timestamp >= filter.startDate!)
    }

    if (filter?.endDate) {
      filtered = filtered.filter(h => h.timestamp <= filter.endDate!)
    }

    if (filter?.userId) {
      filtered = filtered.filter(h => h.userId === filter.userId)
    }

    return filtered.sort((a, b) => b.timestamp - a.timestamp)
  }

  const clearHistory = () => {
    setHistory([])
  }

  const getGroupedByDate = () => {
    const grouped: Record<string, HistoryEntry[]> = {}

    history.forEach(entry => {
      const date = new Date(entry.timestamp).toLocaleDateString()
      if (!grouped[date]) {
        grouped[date] = []
      }
      grouped[date].push(entry)
    })

    return grouped
  }

  return {
    history,
    addEntry,
    getHistory,
    clearHistory,
    getGroupedByDate,
    isLoaded,
  }
}
