'use client'

import { useSettingsAnalytics } from '@/hooks/useSettingsAnalytics'
import { TrendingUp, TrendingDown, Eye, Pen } from 'lucide-react'

interface SettingsAnalyticsProps {
  title?: string
  showHeader?: boolean
}

export function SettingsAnalytics({
  title = 'Usage Analytics',
  showHeader = true,
}: SettingsAnalyticsProps) {
  const { getMostUsedSettings, getLeastUsedSettings, getLastAccessedTime, getStatistics, isLoaded } = useSettingsAnalytics()

  if (!isLoaded) {
    return <div className="text-text-tertiary">Loading analytics...</div>
  }

  const stats = getStatistics()
  const mostUsed = getMostUsedSettings(5)
  const leastUsed = getLeastUsedSettings(5)
  const totalEvents = Object.values(stats).reduce((sum, s) => sum + s.totalViews + s.totalEdits, 0)

  return (
    <div className="space-y-8">
      {showHeader && (
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-text-primary">
            {title}
          </h2>
          <p className="text-text-tertiary text-sm mt-1">
            Track which settings are most and least used
          </p>
        </div>
      )}

      {/* Summary Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-border/50 bg-white dark:bg-slate-950 p-6">
          <p className="text-sm font-medium text-text-secondary">Total Interactions</p>
          <p className="text-3xl font-bold text-text-primary mt-2">{totalEvents}</p>
          <p className="text-xs text-text-tertiary mt-2">Across all settings</p>
        </div>

        <div className="rounded-lg border border-border/50 bg-white dark:bg-slate-950 p-6">
          <p className="text-sm font-medium text-text-secondary">Active Settings</p>
          <p className="text-3xl font-bold text-text-primary mt-2">{Object.keys(stats).length}</p>
          <p className="text-xs text-text-tertiary mt-2">Settings accessed</p>
        </div>

        <div className="rounded-lg border border-border/50 bg-white dark:bg-slate-950 p-6">
          <p className="text-sm font-medium text-text-secondary">Avg. Interactions</p>
          <p className="text-3xl font-bold text-text-primary mt-2">
            {Object.keys(stats).length > 0 ? Math.round(totalEvents / Object.keys(stats).length) : 0}
          </p>
          <p className="text-xs text-text-tertiary mt-2">Per setting</p>
        </div>
      </div>

      {/* Most Used Settings */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="h-5 w-5 text-emerald-500" />
          <h3 className="text-lg font-semibold text-text-primary">Most Used Settings</h3>
        </div>

        {mostUsed.length === 0 ? (
          <div className="rounded-lg border border-border/50 bg-white/50 dark:bg-slate-950/50 p-8 text-center">
            <p className="text-text-tertiary">No usage data yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {mostUsed.map(([key, stat]) => (
              <div key={key} className="rounded-lg border border-border/50 bg-white dark:bg-slate-950 p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-text-primary capitalize">
                    {key.replace('-', ' ')}
                  </h4>
                  <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                    {stat.frequencyScore}% used
                  </span>
                </div>

                <div className="w-full bg-border rounded-full h-2 mb-3">
                  <div
                    className="bg-gradient-to-r from-emerald-500 to-emerald-600 h-2 rounded-full transition-all"
                    style={{ width: `${stat.frequencyScore}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-sm text-text-tertiary">
                  <div className="flex gap-4">
                    <span className="flex items-center gap-1">
                      <Eye className="h-4 w-4" />
                      {stat.totalViews} views
                    </span>
                    <span className="flex items-center gap-1">
                      <Pen className="h-4 w-4" />
                      {stat.totalEdits} edits
                    </span>
                  </div>
                  {stat.lastViewed && (
                    <span>{getLastAccessedTime(key)}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Least Used Settings */}
      {leastUsed.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <TrendingDown className="h-5 w-5 text-slate-500" />
            <h3 className="text-lg font-semibold text-text-primary">Features to Explore</h3>
          </div>

          <div className="space-y-3">
            {leastUsed.map(([key, stat]) => (
              <div key={key} className="rounded-lg border border-border/50 bg-white/50 dark:bg-slate-950/50 p-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-text-secondary capitalize">
                    {key.replace('-', ' ')}
                  </h4>
                  <span className="text-sm text-text-tertiary">
                    {stat.totalViews} view{stat.totalViews !== 1 ? 's' : ''}
                  </span>
                </div>
                <p className="text-sm text-text-tertiary mt-1">
                  You haven't used this setting much. It might have features you'd benefit from!
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
