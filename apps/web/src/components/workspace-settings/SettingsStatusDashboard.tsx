'use client'

import { AlertCircle, CheckCircle2, Clock, TrendingUp, AlertTriangle } from 'lucide-react'
import { useI18n } from '@/i18n/use-i18n'
import Link from 'next/link'

interface SettingConfig {
  id: string
  name: string
  status: 'configured' | 'pending' | 'missing' | 'warning'
  href: string
  priority: 'critical' | 'important' | 'optional'
  description: string
  lastUpdated?: string
}

const WORKSPACE_SETTINGS: SettingConfig[] = [
  {
    id: 'ad-accounts',
    name: 'Ad Accounts',
    status: 'configured',
    href: '/settings/workspace/ad-accounts',
    priority: 'critical',
    description: 'Connected advertising platforms',
    lastUpdated: '2 days ago',
  },
  {
    id: 'payments',
    name: 'Payments',
    status: 'pending',
    href: '/settings/workspace/payments',
    priority: 'critical',
    description: 'Billing and payment methods',
  },
  {
    id: 'team',
    name: 'Team Members',
    status: 'configured',
    href: '/settings/workspace/team',
    priority: 'important',
    description: 'Team collaboration setup',
    lastUpdated: '1 week ago',
  },
  {
    id: 'profile',
    name: 'User Profile',
    status: 'configured',
    href: '/settings/workspace/profile',
    priority: 'important',
    description: 'Personal information',
    lastUpdated: '3 weeks ago',
  },
  {
    id: 'mcp-integration',
    name: 'MCP Integration',
    status: 'missing',
    href: '/settings/workspace/mcp',
    priority: 'optional',
    description: 'Third-party integrations',
  },
  {
    id: 'products',
    name: 'Products & Usage',
    status: 'warning',
    href: '/settings/workspace/products',
    priority: 'important',
    description: 'Subscription and usage limits',
  },
]

export function SettingsStatusDashboard() {
  const { t } = useI18n()

  const stats = {
    total: WORKSPACE_SETTINGS.length,
    configured: WORKSPACE_SETTINGS.filter(s => s.status === 'configured').length,
    pending: WORKSPACE_SETTINGS.filter(s => s.status === 'pending').length,
    missing: WORKSPACE_SETTINGS.filter(s => s.status === 'missing').length,
    critical: WORKSPACE_SETTINGS.filter(s => s.priority === 'critical' && s.status !== 'configured').length,
  }

  const completionPercentage = Math.round((stats.configured / stats.total) * 100)

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'configured':
        return <CheckCircle2 className="h-5 w-5 text-emerald-500" />
      case 'pending':
        return <Clock className="h-5 w-5 text-amber-500" />
      case 'missing':
        return <AlertCircle className="h-5 w-5 text-slate-400" />
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-orange-500" />
      default:
        return null
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'configured':
        return 'Configured'
      case 'pending':
        return 'Pending Setup'
      case 'missing':
        return 'Not Set'
      case 'warning':
        return 'Needs Review'
      default:
        return status
    }
  }

  const priorityBadgeColor = (priority: string) => {
    switch (priority) {
      case 'critical':
        return 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/30 dark:text-red-400 dark:border-red-900'
      case 'important':
        return 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-900'
      case 'optional':
        return 'bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-950/30 dark:text-slate-400 dark:border-slate-900'
      default:
        return ''
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-text-primary mb-2">
          Workspace Setup Status
        </h2>
        <p className="text-text-tertiary">
          Complete your workspace configuration to unlock all features
        </p>
      </div>

      {/* Progress Overview */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Completion Progress */}
        <div className="rounded-lg border border-border/50 bg-white dark:bg-slate-950 p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-sm font-medium text-text-secondary">Setup Complete</p>
              <p className="text-3xl font-bold text-text-primary mt-2">{completionPercentage}%</p>
            </div>
            <TrendingUp className="h-8 w-8 text-violet-500" />
          </div>
          <div className="w-full bg-border rounded-full h-2">
            <div
              className="bg-gradient-to-r from-violet-500 to-violet-600 h-2 rounded-full transition-all duration-500"
              style={{ width: `${completionPercentage}%` }}
            />
          </div>
          <p className="text-xs text-text-tertiary mt-2">
            {stats.configured} of {stats.total} settings configured
          </p>
        </div>

        {/* Critical Issues */}
        {stats.critical > 0 && (
          <div className="rounded-lg border border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/20 p-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-6 w-6 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-red-900 dark:text-red-200">
                  {stats.critical} Critical Task{stats.critical !== 1 ? 's' : ''}
                </p>
                <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                  Action required to use workspace
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Pending Setup */}
        {stats.pending > 0 && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/20 p-6">
            <div className="flex items-start gap-3">
              <Clock className="h-6 w-6 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-amber-900 dark:text-amber-200">
                  {stats.pending} Pending Setup
                </p>
                <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                  Complete to enable features
                </p>
              </div>
            </div>
          </div>
        )}

        {/* All Set */}
        {stats.critical === 0 && stats.pending === 0 && (
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-950/20 p-6">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-6 w-6 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-emerald-900 dark:text-emerald-200">
                  All Set!
                </p>
                <p className="text-sm text-emerald-700 dark:text-emerald-300 mt-1">
                  Your workspace is ready to use
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Settings List */}
      <div className="space-y-3">
        <h3 className="font-semibold text-text-primary">All Settings</h3>
        <div className="grid gap-3">
          {WORKSPACE_SETTINGS.map((setting) => (
            <Link
              key={setting.id}
              href={setting.href}
              className="group rounded-lg border border-border/50 bg-white dark:bg-slate-950 p-4 hover:border-violet-400 hover:shadow-sm transition-all"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    {getStatusIcon(setting.status)}
                    <h4 className="font-medium text-text-primary group-hover:text-violet-600 transition-colors">
                      {setting.name}
                    </h4>
                    <span className={`text-xs font-semibold px-2 py-1 rounded border ${priorityBadgeColor(setting.priority)}`}>
                      {setting.priority.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-sm text-text-tertiary mb-2">{setting.description}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-text-tertiary">
                      {getStatusLabel(setting.status)}
                    </span>
                    {setting.lastUpdated && (
                      <span className="text-xs text-text-tertiary">{setting.lastUpdated}</span>
                    )}
                  </div>
                </div>
                <button className="hidden group-hover:flex items-center justify-center w-8 h-8 rounded-lg bg-violet-50 text-violet-600 dark:bg-violet-950/40 dark:text-violet-400 flex-shrink-0">
                  →
                </button>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="rounded-lg border border-border/50 bg-gradient-to-r from-violet-50 to-violet-50/50 dark:from-violet-950/20 dark:to-violet-950/10 p-6">
        <h3 className="font-semibold text-text-primary mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {stats.critical > 0 && (
            <Link
              href="/settings/workspace/payments"
              className="px-4 py-2 rounded-lg bg-red-600 text-white font-medium hover:bg-red-700 transition-colors text-sm"
            >
              Complete Critical Tasks
            </Link>
          )}
          {stats.pending > 0 && (
            <Link
              href="/settings/workspace/ad-accounts"
              className="px-4 py-2 rounded-lg bg-amber-600 text-white font-medium hover:bg-amber-700 transition-colors text-sm"
            >
              Finish Setup
            </Link>
          )}
          <Link
            href="/settings/workspace/team"
            className="px-4 py-2 rounded-lg border border-border bg-white text-text-primary font-medium hover:bg-surface dark:bg-slate-950 transition-colors text-sm"
          >
            Invite Team Members
          </Link>
          <Link
            href="/settings/workspace/mcp"
            className="px-4 py-2 rounded-lg border border-border bg-white text-text-primary font-medium hover:bg-surface dark:bg-slate-950 transition-colors text-sm"
          >
            Setup Integrations
          </Link>
        </div>
      </div>
    </div>
  )
}
