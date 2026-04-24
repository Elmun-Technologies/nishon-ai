'use client'

import { useSettingsHistory } from '@/hooks/useSettingsHistory'
import { useI18n } from '@/i18n/use-i18n'
import { RotateCcw, Trash2, Plus } from 'lucide-react'
import { useState } from 'react'

interface SettingsHistoryLogProps {
  title?: string
  showHeader?: boolean
  maxItems?: number
}

export function SettingsHistoryLog({
  title = 'Activity Log',
  showHeader = true,
  maxItems = 20
}: SettingsHistoryLogProps) {
  const { t } = useI18n()
  const { history, clearHistory, getGroupedByDate, isLoaded } = useSettingsHistory()
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  if (!isLoaded) {
    return <div className="text-text-tertiary">Loading...</div>
  }

  const groupedHistory = getGroupedByDate()
  const displayHistory = history.slice(0, maxItems)

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'created':
        return <Plus className="h-4 w-4" />
      case 'updated':
        return <RotateCcw className="h-4 w-4" />
      case 'deleted':
        return <Trash2 className="h-4 w-4" />
      default:
        return null
    }
  }

  const getActionColor = (action: string) => {
    switch (action) {
      case 'created':
        return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400'
      case 'updated':
        return 'bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400'
      case 'deleted':
        return 'bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400'
      default:
        return ''
    }
  }

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diff = now.getTime() - date.getTime()

    if (diff < 60000) return 'Just now'
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`
    if (diff < 604800000) return `${Math.floor(diff / 86400000)}d ago`

    return date.toLocaleDateString()
  }

  return (
    <div className="space-y-6">
      {showHeader && (
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-text-primary">
              {title}
            </h2>
            <p className="text-text-tertiary text-sm mt-1">
              Track all changes to your workspace settings
            </p>
          </div>
          {history.length > 0 && (
            <div>
              {showDeleteConfirm ? (
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      clearHistory()
                      setShowDeleteConfirm(false)
                    }}
                    className="px-3 py-2 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700 transition-colors"
                  >
                    Clear All
                  </button>
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    className="px-3 py-2 rounded-lg border border-border bg-white text-text-primary text-sm font-medium hover:bg-surface dark:bg-slate-950 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="px-3 py-2 rounded-lg border border-border bg-white text-text-primary text-sm font-medium hover:bg-surface dark:bg-slate-950 transition-colors"
                >
                  Clear History
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {displayHistory.length === 0 ? (
        <div className="rounded-lg border border-border/50 bg-white/50 dark:bg-slate-950/50 p-12 text-center">
          <p className="text-text-tertiary">No activity yet</p>
          <p className="text-sm text-text-tertiary mt-1">
            Changes to your settings will appear here
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {displayHistory.map((entry) => (
            <div
              key={entry.id}
              className="rounded-lg border border-border/50 bg-white dark:bg-slate-950 p-4 hover:border-violet-400/50 transition-all"
            >
              <div className="flex items-start gap-4">
                <div className={`rounded-lg p-2.5 flex-shrink-0 ${getActionColor(entry.action)}`}>
                  {getActionIcon(entry.action)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="font-semibold text-text-primary">
                        {entry.settingName}
                      </h3>
                      <p className="text-sm text-text-tertiary mt-1">
                        {entry.action === 'created' && 'Setting created'}
                        {entry.action === 'updated' && 'Setting updated'}
                        {entry.action === 'deleted' && 'Setting deleted'}
                        {entry.userName && ` by ${entry.userName}`}
                      </p>
                    </div>
                    <span className="text-sm text-text-tertiary flex-shrink-0 whitespace-nowrap">
                      {formatTime(entry.timestamp)}
                    </span>
                  </div>

                  {(entry.oldValue || entry.newValue) && (
                    <div className="mt-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-900/30 text-sm">
                      <div className="grid grid-cols-2 gap-4">
                        {entry.oldValue && (
                          <div>
                            <p className="text-xs text-text-tertiary font-medium mb-1">
                              Previous Value
                            </p>
                            <p className="text-text-primary font-mono text-xs break-all">
                              {entry.oldValue}
                            </p>
                          </div>
                        )}
                        {entry.newValue && (
                          <div>
                            <p className="text-xs text-text-tertiary font-medium mb-1">
                              New Value
                            </p>
                            <p className="text-text-primary font-mono text-xs break-all">
                              {entry.newValue}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}

          {history.length > maxItems && (
            <div className="text-center text-sm text-text-tertiary py-4">
              Showing {maxItems} of {history.length} entries
            </div>
          )}
        </div>
      )}
    </div>
  )
}
