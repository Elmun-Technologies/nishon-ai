'use client'
import { useEffect, useState, useCallback } from 'react'
import { useWorkspaceStore } from '@/stores/workspace.store'
import { useRealtimeRefresh } from '@/hooks/useRealtimeRefresh'
import { useI18n } from '@/i18n/use-i18n'
import type { BadgeProps } from '@/components/ui/Badge'
import { Badge } from '@/components/ui/Badge'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { PageSpinner } from '@/components/ui/Spinner'
import { Alert } from '@/components/ui/Alert'
import { PageHeader } from '@/components/ui'
import { aiDecisions as aiDecisionsApi } from '@/lib/api-client'
import { timeAgo } from '@/lib/utils'

interface AiDecision {
  id: string
  actionType: string
  reason: string
  estimatedImpact: string | null
  beforeState: Record<string, any> | null
  afterState: Record<string, any> | null
  isApproved: boolean | null
  isExecuted: boolean
  createdAt: string
  campaignId: string | null
}

const DEMO_DECISIONS: AiDecision[] = [
  {
    id: 'demo-pause-1',
    actionType: 'pause_ad',
    reason:
      'CTR dropped 42% over 7 days while frequency climbed. Pausing protects spend until creative refresh.',
    estimatedImpact: 'Save ~$120/week; re-test after new hook.',
    beforeState: { status: 'active', spend: 340, ctr: '0.9%' },
    afterState: { status: 'paused', spend: 340, ctr: '0.9%' },
    isApproved: null,
    isExecuted: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    campaignId: 'demo-camp-1',
  },
  {
    id: 'demo-scale-1',
    actionType: 'scale_budget',
    reason:
      'Stable CPA under target for 5 days with headroom on frequency. Scaling captures demand safely.',
    estimatedImpact: '+18% conversions at same CPA band.',
    beforeState: { dailyBudget: 80, roas: 2.4 },
    afterState: { dailyBudget: 100, roas: 2.4 },
    isApproved: true,
    isExecuted: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(),
    campaignId: 'demo-camp-2',
  },
]

const ACTION_ICONS: Record<string, string> = {
  pause_ad: '⏸',
  scale_budget: '📈',
  stop_campaign: '⏹',
  create_ad: '✨',
  shift_budget: '🔄',
  generate_strategy: '🧠',
  adjust_targeting: '🎯',
  rotate_creative: '🔁',
}

const ACTION_VARIANT: Record<string, BadgeProps['variant']> = {
  pause_ad: 'warning',
  scale_budget: 'success',
  stop_campaign: 'danger',
  create_ad: 'info',
  shift_budget: 'purple',
  generate_strategy: 'purple',
  adjust_targeting: 'info',
  rotate_creative: 'gray',
}

function actionLabel(actionType: string, t: (k: string, d?: string) => string) {
  const key = `aiDecisions.action.${actionType}`
  return t(key, t('aiDecisions.action.default', 'AI action'))
}

export default function AiDecisionsPage() {
  const { t } = useI18n()
  const { currentWorkspace } = useWorkspaceStore()

  const [decisions, setDecisions] = useState<AiDecision[]>([])
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState('')
  const [demoMode, setDemoMode] = useState(false)
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [actionError, setActionError] = useState('')

  const fetchDecisions = useCallback(async () => {
    if (!currentWorkspace?.id) {
      setLoading(false)
      setDecisions([])
      setDemoMode(false)
      return
    }
    setLoading(true)
    setFetchError('')
    try {
      const res = await aiDecisionsApi.list(currentWorkspace.id)
      setDecisions((res.data as any) ?? [])
      setDemoMode(false)
    } catch {
      setDecisions(DEMO_DECISIONS)
      setDemoMode(true)
      setFetchError('')
    } finally {
      setLoading(false)
    }
  }, [currentWorkspace?.id])

  useEffect(() => {
    fetchDecisions()
  }, [fetchDecisions])

  useRealtimeRefresh(currentWorkspace?.id, ['optimization_done'], fetchDecisions)

  const isDemoId = (id: string) => id.startsWith('demo-')

  async function handleApprove(id: string) {
    setActionLoading(id)
    setActionError('')
    if (isDemoId(id)) {
      setDecisions((prev) =>
        prev.map((d) => (d.id === id ? { ...d, isApproved: true, isExecuted: true } : d)),
      )
      setActionLoading(null)
      return
    }
    try {
      await aiDecisionsApi.approve(id)
      setDecisions((prev) =>
        prev.map((d) => (d.id === id ? { ...d, isApproved: true, isExecuted: true } : d)),
      )
    } catch (err: any) {
      setActionError(err?.message ?? t('aiDecisions.approveFailed', 'Failed to approve decision'))
    } finally {
      setActionLoading(null)
    }
  }

  async function handleReject(id: string) {
    setActionLoading(id)
    setActionError('')
    if (isDemoId(id)) {
      setDecisions((prev) => prev.map((d) => (d.id === id ? { ...d, isApproved: false } : d)))
      setActionLoading(null)
      return
    }
    try {
      await aiDecisionsApi.reject(id)
      setDecisions((prev) => prev.map((d) => (d.id === id ? { ...d, isApproved: false } : d)))
    } catch (err: any) {
      setActionError(err?.message ?? t('aiDecisions.rejectFailed', 'Failed to reject decision'))
    } finally {
      setActionLoading(null)
    }
  }

  const counts = {
    all: decisions.length,
    pending: decisions.filter((d) => d.isApproved === null).length,
    approved: decisions.filter((d) => d.isApproved === true).length,
    rejected: decisions.filter((d) => d.isApproved === false).length,
  }

  const filtered = decisions.filter((d) => {
    if (filter === 'pending') return d.isApproved === null
    if (filter === 'approved') return d.isApproved === true
    if (filter === 'rejected') return d.isApproved === false
    return true
  })

  const pendingBannerTitle = t(
    'aiDecisions.pendingBannerTitle',
    '{{count}} decisions need your approval',
  ).replace('{{count}}', String(counts.pending))

  const emptyTitle =
    filter === 'all'
      ? t('aiDecisions.emptyAllTitle', 'No AI decisions yet')
      : filter === 'pending'
        ? t('aiDecisions.emptyPendingTitle', 'No pending decisions')
        : filter === 'approved'
          ? t('aiDecisions.emptyApprovedTitle', 'No approved decisions')
          : t('aiDecisions.emptyRejectedTitle', 'No rejected decisions')

  const emptyDescription =
    filter === 'all'
      ? t(
          'aiDecisions.emptyAllDescription',
          'The optimization loop runs every few hours. After your campaigns are analyzed, every decision appears here with full reasoning.',
        )
      : t('aiDecisions.emptyFilteredDescription', 'Nothing in this filter right now.')

  if (loading) return <PageSpinner />

  return (
    <div className="space-y-6 max-w-4xl">
      <PageHeader
        title={t('navigation.aiDecisions', 'AI Decisions')}
        subtitle={t(
          'aiDecisions.subtitle',
          'Every AI action and recommendation with transparent reasoning',
        )}
        actions={
          <Button variant="secondary" size="sm" onClick={fetchDecisions}>
            {t('common.refresh', 'Refresh')}
          </Button>
        }
      />

      {demoMode && (
        <Alert variant="info">{t('aiDecisions.demoNotice', 'Showing sample decisions.')}</Alert>
      )}
      {fetchError && <Alert variant="error">{fetchError}</Alert>}
      {actionError && <Alert variant="error">{actionError}</Alert>}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {(
          [
            {
              filterKey: 'all' as const,
              labelKey: 'aiDecisions.statTotal',
              labelFb: 'Total',
              value: counts.all,
              color: 'text-text-primary',
              bg: 'bg-surface border-border',
            },
            {
              filterKey: 'pending' as const,
              labelKey: 'aiDecisions.statPending',
              labelFb: 'Pending',
              value: counts.pending,
              color: 'text-amber-500',
              bg: 'bg-amber-500/10 border-amber-500/20',
            },
            {
              filterKey: 'approved' as const,
              labelKey: 'aiDecisions.statApproved',
              labelFb: 'Approved',
              value: counts.approved,
              color: 'text-emerald-500',
              bg: 'bg-emerald-500/10 border-emerald-500/20',
            },
            {
              filterKey: 'rejected' as const,
              labelKey: 'aiDecisions.statRejected',
              labelFb: 'Rejected',
              value: counts.rejected,
              color: 'text-red-500',
              bg: 'bg-red-500/10 border-red-500/20',
            },
          ] as const
        ).map((s) => (
          <button
            key={s.filterKey}
            type="button"
            onClick={() => setFilter(s.filterKey)}
            className={`border rounded-xl p-3 text-left transition-all hover:shadow-sm ${s.bg}`}
          >
            <p className="text-text-tertiary text-xs mb-1">{t(s.labelKey, s.labelFb)}</p>
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
          </button>
        ))}
      </div>

      {counts.pending > 0 && (
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 flex items-center gap-4">
          <span className="text-2xl">⏳</span>
          <div className="flex-1 min-w-0">
            <p className="text-amber-600 dark:text-amber-400 font-medium text-sm">
              {pendingBannerTitle}
            </p>
            <p className="text-amber-600/90 dark:text-amber-400/90 text-xs mt-0.5">
              {t(
                'aiDecisions.pendingBannerBody',
                'You are in assisted mode — the AI waits before executing changes.',
              )}
            </p>
          </div>
          <Button
            size="sm"
            onClick={() => setFilter('pending')}
            className="bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30 hover:bg-amber-500/20 shrink-0"
          >
            {t('aiDecisions.pendingBannerCta', 'Review')} →
          </Button>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-1 bg-surface-2 border border-border rounded-xl p-1 w-fit">
        {(
          [
            { key: 'all' as const, labelKey: 'aiDecisions.tabAll', labelFb: 'All' },
            {
              key: 'pending' as const,
              labelKey: 'aiDecisions.statPending',
              labelFb: 'Pending',
            },
            {
              key: 'approved' as const,
              labelKey: 'aiDecisions.statApproved',
              labelFb: 'Approved',
            },
            {
              key: 'rejected' as const,
              labelKey: 'aiDecisions.statRejected',
              labelFb: 'Rejected',
            },
          ] as const
        ).map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setFilter(tab.key)}
            className={`
              flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium
              transition-all duration-200
              ${
                filter === tab.key
                  ? 'bg-gradient-to-r from-brand-mid to-brand-lime text-brand-ink shadow-sm border border-transparent'
                  : 'text-text-tertiary hover:text-text-primary hover:bg-surface'
              }
            `}
          >
            {t(tab.labelKey, tab.labelFb)}
            {counts[tab.key] > 0 && (
              <span
                className={`
                  text-xs px-1.5 py-0.5 rounded-full
                  ${
                    filter === tab.key
                      ? 'bg-brand-ink/10 text-brand-ink'
                      : tab.key === 'pending'
                        ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400'
                        : 'bg-surface border border-border text-text-tertiary'
                  }
                `}
              >
                {counts[tab.key]}
              </span>
            )}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <Card>
          <EmptyState icon="🤖" title={emptyTitle} description={emptyDescription} />
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((decision) => {
            const label = actionLabel(decision.actionType, t)
            const icon = ACTION_ICONS[decision.actionType] ?? '⚙️'
            const variant = ACTION_VARIANT[decision.actionType] ?? 'gray'
            const isPending = decision.isApproved === null
            const isExpanded = expandedId === decision.id
            const isThisLoading = actionLoading === decision.id

            return (
              <div key={decision.id}>
                <Card
                  padding="none"
                  className={`
                    transition-all duration-200
                    ${isPending ? 'border-amber-500/30' : ''}
                    ${isExpanded ? 'border-border' : ''}
                  `}
                >
                  <div className="p-5">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-xl bg-surface-2 border border-border flex items-center justify-center text-lg shrink-0 mt-0.5">
                        {icon}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <Badge variant={variant}>{label}</Badge>

                          {isPending ? (
                            <Badge variant="warning" dot>
                              {t('aiDecisions.badgePending', 'Awaiting approval')}
                            </Badge>
                          ) : decision.isApproved ? (
                            <Badge variant="success" dot>
                              {decision.isExecuted
                                ? t('aiDecisions.badgeExecuted', 'Executed')
                                : t('aiDecisions.badgeApproved', 'Approved')}
                            </Badge>
                          ) : (
                            <Badge variant="danger">
                              {t('aiDecisions.badgeRejected', 'Rejected')}
                            </Badge>
                          )}

                          <span className="text-text-tertiary text-xs ml-auto">
                            {timeAgo(decision.createdAt)}
                          </span>
                        </div>

                        <p className="text-text-secondary text-sm leading-relaxed">
                          {decision.reason}
                        </p>

                        {decision.estimatedImpact && (
                          <div className="flex items-start gap-2 mt-2.5 bg-surface-2 rounded-lg px-3 py-2">
                            <span className="text-text-secondary text-xs font-medium shrink-0 mt-0.5">
                              💡 {t('aiDecisions.impactLabel', 'Expected impact')}:
                            </span>
                            <p className="text-text-tertiary text-xs leading-relaxed">
                              {decision.estimatedImpact}
                            </p>
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col items-end gap-2 shrink-0">
                        {isPending ? (
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="secondary"
                              loading={isThisLoading}
                              onClick={() => handleReject(decision.id)}
                              className="text-red-500 border-red-500/20 hover:bg-red-500/10"
                            >
                              ✗ {t('aiDecisions.reject', 'Reject')}
                            </Button>
                            <Button
                              size="sm"
                              loading={isThisLoading}
                              onClick={() => handleApprove(decision.id)}
                              className="bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 hover:bg-emerald-500/15"
                            >
                              ✓ {t('aiDecisions.approve', 'Approve')}
                            </Button>
                          </div>
                        ) : (
                          (decision.beforeState || decision.afterState) && (
                            <button
                              type="button"
                              onClick={() => setExpandedId(isExpanded ? null : decision.id)}
                              className="text-text-tertiary hover:text-text-secondary text-xs flex items-center gap-1 transition-colors"
                            >
                              {isExpanded
                                ? `${t('aiDecisions.collapse', 'Collapse')} ↑`
                                : `${t('aiDecisions.expand', 'Details')} ↓`}
                            </button>
                          )
                        )}
                      </div>
                    </div>
                  </div>

                  {isExpanded && (decision.beforeState || decision.afterState) && (
                    <div className="px-5 pb-5 pt-0">
                      <div className="border-t border-border pt-4">
                        <p className="text-text-tertiary text-xs font-medium uppercase tracking-wide mb-3">
                          {t('aiDecisions.beforeAfter', 'Before → After')}
                        </p>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="bg-surface-2 border border-border rounded-xl p-4">
                            <p className="text-text-tertiary text-xs font-medium mb-2 flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full bg-red-400" />
                              {t('aiDecisions.before', 'Before')}
                            </p>
                            {decision.beforeState ? (
                              <div className="space-y-1.5">
                                {Object.entries(decision.beforeState).map(([key, val]) => (
                                  <div key={key} className="flex justify-between text-xs">
                                    <span className="text-text-tertiary capitalize">
                                      {key.replace(/([A-Z])/g, ' $1').trim()}
                                    </span>
                                    <span className="text-text-tertiary font-mono">
                                      {typeof val === 'number' ? val.toLocaleString() : String(val)}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-text-tertiary text-xs">
                                {t('aiDecisions.noBeforeData', 'No data')}
                              </p>
                            )}
                          </div>

                          <div className="bg-surface-2 border border-emerald-500/20 rounded-xl p-4">
                            <p className="text-text-tertiary text-xs font-medium mb-2 flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full bg-emerald-400" />
                              {t('aiDecisions.after', 'After')}
                            </p>
                            {decision.afterState ? (
                              <div className="space-y-1.5">
                                {Object.entries(decision.afterState).map(([key, val]) => (
                                  <div key={key} className="flex justify-between text-xs">
                                    <span className="text-text-tertiary capitalize">
                                      {key.replace(/([A-Z])/g, ' $1').trim()}
                                    </span>
                                    <span className="text-emerald-400 font-mono">
                                      {typeof val === 'number' ? val.toLocaleString() : String(val)}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-text-tertiary text-xs">
                                {t('aiDecisions.afterPending', 'Pending execution')}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </Card>
              </div>
            )
          })}
        </div>
      )}

      <Card variant="outlined" padding="sm">
        <div className="flex items-start gap-3 px-2">
          <span className="text-lg mt-0.5">🔍</span>
          <div>
            <p className="text-text-primary text-sm font-medium mb-0.5">
              {t('aiDecisions.helpTitle', 'Why does AdSpectr show this log?')}
            </p>
            <p className="text-text-tertiary text-xs leading-relaxed">
              {t(
                'aiDecisions.helpBody',
                'Transparency is our core principle. Every optimization the AI makes is recorded here with its rationale, expected impact, and outcome.',
              )}
            </p>
          </div>
        </div>
      </Card>
    </div>
  )
}
