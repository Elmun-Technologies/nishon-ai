'use client'

import { useState, useEffect } from 'react'

export interface SettingUsageEvent {
  settingKey: string
  settingName: string
  timestamp: number
  actionType: 'view' | 'edit' | 'create'
}

export interface UsageStats {
  totalViews: number
  totalEdits: number
  lastViewed?: number
  frequencyScore: number // 0-100
}

const ANALYTICS_STORAGE_KEY = 'workspace-settings-analytics'
const MAX_EVENTS = 1000

export function useSettingsAnalytics() {
  const [events, setEvents] = useState<SettingUsageEvent[]>([])
  const [isLoaded, setIsLoaded] = useState(false)

  // Load from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(ANALYTICS_STORAGE_KEY)
      if (stored) {
        try {
          setEvents(JSON.parse(stored))
        } catch (e) {
          console.error('Failed to parse analytics:', e)
        }
      }
      setIsLoaded(true)
    }
  }, [])

  // Save to localStorage
  useEffect(() => {
    if (isLoaded && typeof window !== 'undefined') {
      localStorage.setItem(ANALYTICS_STORAGE_KEY, JSON.stringify(events))
    }
  }, [events, isLoaded])

  const trackEvent = (event: Omit<SettingUsageEvent, 'timestamp'>) => {
    const newEvent: SettingUsageEvent = {
      ...event,
      timestamp: Date.now(),
    }

    setEvents(prev => {
      const updated = [newEvent, ...prev]
      return updated.slice(0, MAX_EVENTS)
    })
  }

  const getStatistics = () => {
    const stats: Record<string, UsageStats> = {}
    const now = Date.now()
    const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000

    events.forEach(event => {
      if (!stats[event.settingKey]) {
        stats[event.settingKey] = {
          totalViews: 0,
          totalEdits: 0,
          frequencyScore: 0,
        }
      }

      const stat = stats[event.settingKey]
      if (event.actionType === 'view') {
        stat.totalViews++
      } else if (event.actionType === 'edit') {
        stat.totalEdits++
      }

      // Update lastViewed if this event is more recent
      if (!stat.lastViewed || event.timestamp > stat.lastViewed) {
        stat.lastViewed = event.timestamp
      }
    })

    // Calculate frequency scores (0-100)
    const maxTotal = Math.max(
      ...Object.values(stats).map(s => s.totalViews + s.totalEdits),
      1
    )

    Object.values(stats).forEach(stat => {
      const total = stat.totalViews + stat.totalEdits * 2 // Weight edits higher
      stat.frequencyScore = Math.round((total / maxTotal) * 100)
    })

    return stats
  }

  const getMostUsedSettings = (limit = 5) => {
    const stats = getStatistics()
    return Object.entries(stats)
      .sort(([, a], [, b]) => b.frequencyScore - a.frequencyScore)
      .slice(0, limit)
  }

  const getLeastUsedSettings = (limit = 5) => {
    const stats = getStatistics()
    return Object.entries(stats)
      .filter(([, stat]) => stat.totalViews > 0) // Only show viewed settings
      .sort(([, a], [, b]) => a.frequencyScore - b.frequencyScore)
      .slice(0, limit)
  }

  const getLastAccessedTime = (settingKey: string) => {
    const lastEvent = events.find(e => e.settingKey === settingKey)
    if (!lastEvent) return null

    const diff = Date.now() - lastEvent.timestamp
    if (diff < 60000) return 'Just now'
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`
    return `${Math.floor(diff / 86400000)}d ago`
  }

  return {
    events,
    trackEvent,
    getStatistics,
    getMostUsedSettings,
    getLeastUsedSettings,
    getLastAccessedTime,
    isLoaded,
  }
}
