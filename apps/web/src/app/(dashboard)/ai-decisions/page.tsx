'use client'
import Link from 'next/link'
import { useEffect, useMemo, useRef, useState, useCallback } from 'react'
import { useWorkspaceStore } from '@/stores/workspace.store'
import { useRealtimeRefresh } from '@/hooks/useRealtimeRefresh'
import { useI18n } from '@/i18n/use-i18n'
import type { BadgeProps } from '@/components/ui/Badge'
import { Badge } from '@/components/ui/Badge'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
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

type FilterKey = 'all' | 'pending' | 'approved' | 'rejected'
type SortKey = 'newest' | 'oldest' | 'pendingFirst'

function actionLabel(actionType: string, t: (k: string, d?: string) => string) {
  const key = `aiDecisions.action.${actionType}`
  return t(key, t('aiDecisions.action.default', 'AI action'))
}

function formatValueDelta(before: any, after: any) {
  if (typeof before === 'number' && typeof after === 'number' && before !== 0) {
    const pct = Math.round(((after - before) / before) * 100)
    if (!Number.isFinite(pct) || pct === 0) return null
    return pct > 0 ? `+${pct}%` : `${pct}%`
  }
  return null
}

export default function AiDecisionsPage() {
  const { t } = useI18n()
  const { currentWorkspace } = useWorkspaceStore()

  const [decisions, setDecisions] = useState<AiDecision[]>([])
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState('')
  const [demoMode, setDemoMode] = useState(false)
  const [filter, setFilter] = useState<FilterKey>('all')
  const [sort, setSort] = useState<SortKey>('newest')
  const [sortOpen, setSortOpen] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [actionError, setActionError] = useState('')
  const sortMenuRef = useRef<HTMLDivElement>(null)

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

  useEffect(() => {
    if (!sortOpen) return
    const onClick = (e: MouseEvent) => {
      if (sortMenuRef.current && !sortMenuRef.current.contains(e.target as Node)) {
        setSortOpen(false)
      }
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [sortOpen])

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

  const filtered = useMemo(() => {
    const list = decisions.filter((d) => {
      if (filter === 'pending') return d.isApproved === null
      if (filter === 'approved') return d.isApproved === true
      if (filter === 'rejected') return d.isApproved === false
      return true
    })
    const sorted = [...list]
    if (sort === 'newest') {
      sorted.sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))
    } else if (sort === 'oldest') {
      sorted.sort((a, b) => +new Date(a.createdAt) - +new Date(b.createdAt))
    } else if (sort === 'pendingFirst') {
      sorted.sort((a, b) => {
        const ap = a.isApproved === null ? 0 : 1
        const bp = b.isApproved === null ? 0 : 1
        if (ap !== bp) return ap - bp
        return +new Date(b.createdAt) - +new Date(a.createdAt)
      })
    }
    return sorted
  }, [decisions, filter, sort])

  const pendingBannerTitle = t(
    'aiDecisions.pendingBannerTitle',
    '{{count}} decisions need your approval',
  ).replace('{{count}}', String(counts.pending))

  const emptyTitle =
    decisions.length === 0
      ? t('aiDecisions.analyzingTitle', 'AI анализирует ваши данные…')
      : filter === 'pending'
        ? t('aiDecisions.emptyPendingTitle', 'No pending decisions')
        : filter === 'approved'
          ? t('aiDecisions.emptyApprovedTitle', 'No approved decisions')
          : filter === 'rejected'
            ? t('aiDecisions.emptyRejectedTitle', 'No rejected decisions')
            : t('aiDecisions.emptyAllTitle', 'No AI decisions yet')

  const emptyDescription =
    decisions.length === 0
      ? t(
          'aiDecisions.analyzingBody',
          'Первые рекомендации появятся через 15 минут после подключения аккаунта.',
        )
      : filter === 'all'
        ? t(
            'aiDecisions.emptyAllDescription',
            'The optimization loop runs every few hours. After your campaigns are analyzed, every decision appears here with full reasoning.',
          )
        : t('aiDecisions.emptyFilteredDescription', 'Nothing in this filter right now.')

  if (loading) return <PageSpinner />

  const sortLabel =
    sort === 'newest'
      ? t('aiDecisions.sortNewest', 'Сначала новые')
      : sort === 'oldest'
        ? t('aiDecisions.sortOldest', 'Сначала старые')
        : t('aiDecisions.sortPendingFirst', 'Сначала ожидающие')

  return (
    <div className="space-y-6 max-w-4xl">
      <PageHeader
        title={t('navigation.aiDecisions', 'AI Decisions')}
        subtitle={t(
          'aiDecisions.subtitle',
          'Every AI action and recommendation with transparent reasoning',
        )}
        actions={
          <>
            <div
              className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-medium border ${
                demoMode
                  ? 'bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400'
                  : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400'
              }`}
              title={
                demoMode
                  ? t('aiDecisions.statusDemoHint', 'Показаны примеры — подключите аккаунт')
                  : t('aiDecisions.statusLiveHint', 'AI анализирует ваши реальные данные')
              }
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  demoMode ? 'bg-amber-500' : 'bg-emerald-500 animate-pulse'
                }`}
              />
              {demoMode
                ? t('aiDecisions.statusDemo', 'Демо режим')
                : t('aiDecisions.statusLive', 'AI активен')}
            </div>
            <Button variant="secondary" size="sm" onClick={fetchDecisions}>
              <span aria-hidden>↻</span> {t('common.refresh', 'Обновить')}
            </Button>
          </>
        }
      />

      {demoMode && (
        <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/15 flex items-center justify-center text-xl shrink-0">
              🤖
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
                {t('aiDecisions.demoBannerTitle', 'AI работает в демо-режиме')}
              </p>
              <p className="mt-0.5 text-xs leading-relaxed text-emerald-700/90 dark:text-emerald-300/90">
                {t(
                  'aiDecisions.demoBannerBody',
                  'AI анализирует ваши кампании каждые 15 минут. В демо-режиме показаны примеры решений.',
                )}
              </p>
            </div>
            <Link
              href="/settings/integrations"
              className="shrink-0 inline-flex items-center gap-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs font-medium px-3 py-2 transition-colors"
            >
              {t('aiDecisions.demoBannerCta', 'Подключить Meta для реальных данных')} →
            </Link>
          </div>
        </div>
      )}
      {fetchError && <Alert variant="error">{fetchError}</Alert>}
      {actionError && <Alert variant="error">{actionError}</Alert>}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {(
          [
            {
              filterKey: 'all' as const,
              labelKey: 'aiDecisions.statTotal',
              labelFb: 'Всего',
              value: counts.all,
              icon: '📊',
              subtitle: t('aiDecisions.statTotalSub', 'за 7 дней'),
              color: 'text-text-primary',
              bg: 'bg-surface border-border',
              ring: 'ring-text-primary/40',
            },
            {
              filterKey: 'pending' as const,
              labelKey: 'aiDecisions.statPending',
              labelFb: 'Ожидают',
              value: counts.pending,
              icon: '⏳',
              subtitle: t('aiDecisions.statPendingSub', 'требует действия'),
              color: 'text-amber-500',
              bg: 'bg-amber-500/10 border-amber-500/20',
              ring: 'ring-amber-500/40',
            },
            {
              filterKey: 'approved' as const,
              labelKey: 'aiDecisions.statApproved',
              labelFb: 'Подтверждено',
              value: counts.approved,
              icon: '✅',
              subtitle: t('aiDecisions.statApprovedSub', 'выполнено AI'),
              color: 'text-emerald-500',
              bg: 'bg-emerald-500/10 border-emerald-500/20',
              ring: 'ring-emerald-500/40',
            },
            {
              filterKey: 'rejected' as const,
              labelKey: 'aiDecisions.statRejected',
              labelFb: 'Отклонено',
              value: counts.rejected,
              icon: '❌',
              subtitle: t('aiDecisions.statRejectedSub', 'отменено вами'),
              color: 'text-red-500',
              bg: 'bg-red-500/10 border-red-500/20',
              ring: 'ring-red-500/40',
            },
          ] as const
        ).map((s) => {
          const active = filter === s.filterKey
          return (
            <button
              key={s.filterKey}
              type="button"
              onClick={() => setFilter(s.filterKey)}
              className={`border rounded-xl p-3 text-left transition-all duration-200 hover:shadow-sm hover:-translate-y-0.5 ${s.bg} ${
                active ? `ring-2 ${s.ring}` : ''
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <p className="text-text-tertiary text-xs">{t(s.labelKey, s.labelFb)}</p>
                <span className="text-base leading-none" aria-hidden>
                  {s.icon}
                </span>
              </div>
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-text-tertiary text-[11px] mt-0.5 truncate">{s.subtitle}</p>
            </button>
          )
        })}
      </div>

      {counts.pending > 0 && (
        <div className="bg-gradient-to-r from-amber-500/15 to-amber-500/5 border border-amber-500/30 rounded-2xl p-4 sm:p-5 flex items-center gap-4 shadow-sm">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/20 flex items-center justify-center text-2xl shrink-0">
            ⏰
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-amber-700 dark:text-amber-300 font-semibold text-sm sm:text-base">
              {pendingBannerTitle}
            </p>
            <p className="text-amber-700/90 dark:text-amber-300/90 text-xs sm:text-sm mt-0.5 leading-relaxed">
              {t(
                'aiDecisions.pendingBannerBody',
                'Вы в режиме с подтверждением — AI ждёт вас перед выполнением изменений.',
              )}
            </p>
          </div>
          <Button
            size="md"
            onClick={() => setFilter('pending')}
            className="bg-emerald-500 hover:bg-emerald-600 text-white border border-emerald-600 shadow-sm shrink-0"
          >
            {t('aiDecisions.pendingBannerCta', 'Смотреть')} →
          </Button>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1 bg-surface-2 border border-border rounded-xl p-1">
          {(
            [
              { key: 'all' as const, labelKey: 'aiDecisions.tabAll', labelFb: 'Все' },
              {
                key: 'pending' as const,
                labelKey: 'aiDecisions.statPending',
                labelFb: 'Ожидают',
                dotClass: 'bg-amber-500',
              },
              {
                key: 'approved' as const,
                labelKey: 'aiDecisions.statApproved',
                labelFb: 'Подтверждено',
                dotClass: 'bg-emerald-500',
              },
              {
                key: 'rejected' as const,
                labelKey: 'aiDecisions.statRejected',
                labelFb: 'Отклонено',
                dotClass: 'bg-red-500',
              },
            ] as const
          ).map((tab) => {
            const active = filter === tab.key
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setFilter(tab.key)}
                className={`
                  flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium
                  transition-all duration-200
                  ${
                    active
                      ? 'bg-gradient-to-r from-brand-mid to-brand-lime text-brand-ink shadow-sm border border-transparent'
                      : 'text-text-tertiary hover:text-text-primary hover:bg-surface'
                  }
                `}
              >
                {'dotClass' in tab && (
                  <span className={`w-1.5 h-1.5 rounded-full ${tab.dotClass}`} aria-hidden />
                )}
                {t(tab.labelKey, tab.labelFb)}
                {counts[tab.key] > 0 && (
                  <span
                    className={`
                      text-xs px-1.5 py-0.5 rounded-full
                      ${
                        active
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
            )
          })}
        </div>

        <div className="relative" ref={sortMenuRef}>
          <button
            type="button"
            onClick={() => setSortOpen((v) => !v)}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-border bg-surface text-text-secondary hover:text-text-primary hover:bg-surface-2 text-sm font-medium transition-colors"
          >
            <span aria-hidden>⇅</span>
            <span className="hidden sm:inline">{t('aiDecisions.filterLabel', 'Фильтр')}:</span>
            <span className="text-text-primary">{sortLabel}</span>
            <span aria-hidden className={`transition-transform ${sortOpen ? 'rotate-180' : ''}`}>
              ▾
            </span>
          </button>
          {sortOpen && (
            <div className="absolute right-0 mt-1 z-10 w-56 rounded-xl border border-border bg-white/95 dark:bg-slate-900/95 backdrop-blur-md shadow-lg p-1">
              {(
                [
                  { key: 'newest' as const, label: t('aiDecisions.sortNewest', 'Сначала новые') },
                  {
                    key: 'pendingFirst' as const,
                    label: t('aiDecisions.sortPendingFirst', 'Сначала ожидающие'),
                  },
                  { key: 'oldest' as const, label: t('aiDecisions.sortOldest', 'Сначала старые') },
                ] as const
              ).map((opt) => (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => {
                    setSort(opt.key)
                    setSortOpen(false)
                  }}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                    sort === opt.key
                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                      : 'text-text-secondary hover:bg-surface-2 hover:text-text-primary'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {filtered.length === 0 ? (
        <Card>
          <div className="py-6 text-center space-y-3">
            <div className="text-4xl">🤖</div>
            <div className="space-y-1.5">
              <h3 className="text-text-primary text-base font-semibold">{emptyTitle}</h3>
              <p className="text-text-secondary text-sm leading-relaxed max-w-md mx-auto">
                {emptyDescription}
              </p>
            </div>
            {demoMode && decisions.length === 0 && (
              <div className="pt-1">
                <Link
                  href="/settings/integrations"
                  className="inline-flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 text-xs font-medium hover:underline"
                >
                  {t('aiDecisions.demoBannerCta', 'Подключить Meta для реальных данных')} →
                </Link>
              </div>
            )}
          </div>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((decision) => {
            const label = actionLabel(decision.actionType, t)
            const icon = ACTION_ICONS[decision.actionType] ?? '⚙️'
            const variant = ACTION_VARIANT[decision.actionType] ?? 'gray'
            const isPending = decision.isApproved === null
            const isRejected = decision.isApproved === false
            const isApproved = decision.isApproved === true
            const isExpanded = expandedId === decision.id
            const isThisLoading = actionLoading === decision.id

            return (
              <div key={decision.id} className="group">
                <Card
                  padding="none"
                  className={`
                    transition-all duration-200 hover:shadow-md
                    ${isPending ? 'border-amber-500/40' : ''}
                    ${isApproved ? 'border-emerald-500/30' : ''}
                    ${isRejected ? 'border-red-500/20' : ''}
                  `}
                >
                  <div className="p-5">
                    <div className="flex items-start gap-4">
                      <div
                        className={`w-11 h-11 rounded-2xl flex items-center justify-center text-lg shrink-0 mt-0.5 border ${
                          isPending
                            ? 'bg-amber-500/10 border-amber-500/30 text-amber-600'
                            : isApproved
                              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600'
                              : isRejected
                                ? 'bg-red-500/10 border-red-500/20 text-red-500'
                                : 'bg-surface-2 border-border'
                        }`}
                      >
                        {icon}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <Badge variant={variant}>{label}</Badge>

                          {isPending ? (
                            <Badge variant="warning" dot>
                              {t('aiDecisions.badgePending', 'Ждёт подтверждения')}
                            </Badge>
                          ) : decision.isApproved ? (
                            <Badge variant="success" dot>
                              {decision.isExecuted
                                ? t('aiDecisions.badgeExecuted', 'Выполнено')
                                : t('aiDecisions.badgeApproved', 'Подтверждено')}
                            </Badge>
                          ) : (
                            <Badge variant="danger">
                              {t('aiDecisions.badgeRejected', 'Отклонено')}
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
                              💡 {t('aiDecisions.impactLabel', 'Ожидаемый эффект')}:
                            </span>
                            <p className="text-text-tertiary text-xs leading-relaxed">
                              {decision.estimatedImpact}
                            </p>
                          </div>
                        )}

                        {(decision.beforeState || decision.afterState) && (
                          <button
                            type="button"
                            onClick={() => setExpandedId(isExpanded ? null : decision.id)}
                            className="mt-2.5 inline-flex items-center gap-1 text-xs font-medium text-emerald-600 dark:text-emerald-400 hover:underline"
                          >
                            {isExpanded
                              ? t('aiDecisions.collapseReasoning', 'Скрыть данные')
                              : t('aiDecisions.expandReasoning', 'Почему AI так решил?')}{' '}
                            <span aria-hidden>{isExpanded ? '↑' : '↓'}</span>
                          </button>
                        )}
                      </div>
                    </div>

                    {isPending && (
                      <div className="flex items-center justify-end gap-2 mt-4 pt-3 border-t border-border/70">
                        <Button
                          size="sm"
                          variant="secondary"
                          loading={isThisLoading}
                          onClick={() => handleReject(decision.id)}
                          className="text-red-500 border-red-500/20 hover:bg-red-500/10"
                        >
                          ✗ {t('aiDecisions.reject', 'Отклонить')}
                        </Button>
                        <Button
                          size="sm"
                          loading={isThisLoading}
                          onClick={() => handleApprove(decision.id)}
                          className="bg-emerald-500 hover:bg-emerald-600 text-white border border-emerald-600"
                        >
                          ✓ {t('aiDecisions.approve', 'Подтвердить')}
                        </Button>
                      </div>
                    )}
                  </div>

                  {isExpanded && (decision.beforeState || decision.afterState) && (
                    <div className="px-5 pb-5 pt-0">
                      <div className="border-t border-border pt-4">
                        <p className="text-text-tertiary text-xs font-medium uppercase tracking-wide mb-3">
                          {t('aiDecisions.beforeAfter', 'До → После')}
                        </p>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="bg-surface-2 border border-border rounded-xl p-4">
                            <p className="text-text-tertiary text-xs font-medium mb-2 flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full bg-red-400" />
                              {t('aiDecisions.before', 'До')}
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
                                {t('aiDecisions.noBeforeData', 'Нет данных')}
                              </p>
                            )}
                          </div>

                          <div className="bg-surface-2 border border-emerald-500/20 rounded-xl p-4">
                            <p className="text-text-tertiary text-xs font-medium mb-2 flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full bg-emerald-400" />
                              {t('aiDecisions.after', 'После')}
                            </p>
                            {decision.afterState ? (
                              <div className="space-y-1.5">
                                {Object.entries(decision.afterState).map(([key, val]) => {
                                  const delta = formatValueDelta(
                                    decision.beforeState?.[key],
                                    val,
                                  )
                                  return (
                                    <div key={key} className="flex justify-between text-xs">
                                      <span className="text-text-tertiary capitalize">
                                        {key.replace(/([A-Z])/g, ' $1').trim()}
                                      </span>
                                      <span className="flex items-center gap-1.5">
                                        <span className="text-emerald-500 font-mono">
                                          {typeof val === 'number'
                                            ? val.toLocaleString()
                                            : String(val)}
                                        </span>
                                        {delta && (
                                          <span
                                            className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                                              delta.startsWith('+')
                                                ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                                                : 'bg-red-500/10 text-red-500'
                                            }`}
                                          >
                                            {delta}
                                          </span>
                                        )}
                                      </span>
                                    </div>
                                  )
                                })}
                              </div>
                            ) : (
                              <p className="text-text-tertiary text-xs">
                                {t('aiDecisions.afterPending', 'Ожидает выполнения')}
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
