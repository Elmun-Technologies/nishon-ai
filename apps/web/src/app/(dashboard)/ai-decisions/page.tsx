'use client'
import { useEffect, useState, useCallback } from 'react'
import { useWorkspaceStore } from '@/stores/workspace.store'
import { useRealtimeRefresh } from '@/hooks/useRealtimeRefresh'
import { Badge } from '@/components/ui/Badge'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { PageSpinner } from '@/components/ui/Spinner'
import { Alert } from '@/components/ui/Alert'
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

const ACTION_CONFIG: Record<
  string,
  { label: string; icon: string; variant: 'success' | 'warning' | 'danger' | 'purple' | 'info' | 'gray' }
> = {
  pause_ad:        { label: 'Paused Ad',           icon: '⏸', variant: 'warning' },
  scale_budget:    { label: 'Scaled Budget',        icon: '📈', variant: 'success' },
  stop_campaign:   { label: 'Stopped Campaign',     icon: '⏹', variant: 'danger' },
  create_ad:       { label: 'Created Ad',           icon: '✨', variant: 'info' },
  shift_budget:    { label: 'Shifted Budget',       icon: '🔄', variant: 'purple' },
  generate_strategy: { label: 'Generated Strategy', icon: '🧠', variant: 'purple' },
  adjust_targeting:  { label: 'Adjusted Targeting', icon: '🎯', variant: 'info' },
  rotate_creative:   { label: 'Rotated Creative',   icon: '🔁', variant: 'gray' },
}

export default function AiDecisionsPage() {
  const { currentWorkspace } = useWorkspaceStore()

  const [decisions, setDecisions] = useState<AiDecision[]>([])
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState('')
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [actionError, setActionError] = useState('')

  const fetchDecisions = useCallback(async () => {
    if (!currentWorkspace?.id) return
    setLoading(true)
    setFetchError('')
    try {
      const res = await aiDecisionsApi.list(currentWorkspace.id)
      setDecisions((res.data as any) ?? [])
    } catch (err: any) {
      setFetchError(err?.message ?? 'Failed to load AI decisions')
    } finally {
      setLoading(false)
    }
  }, [currentWorkspace?.id])

  useEffect(() => {
    fetchDecisions()
  }, [fetchDecisions])

  // Auto-refresh when AI optimization loop completes
  useRealtimeRefresh(currentWorkspace?.id, ['optimization_done'], fetchDecisions)

  async function handleApprove(id: string) {
    setActionLoading(id)
    setActionError('')
    try {
      await aiDecisionsApi.approve(id)
      setDecisions((prev) =>
        prev.map((d) => d.id === id ? { ...d, isApproved: true, isExecuted: true } : d)
      )
    } catch (err: any) {
      setActionError(err?.message ?? 'Failed to approve decision')
    } finally {
      setActionLoading(null)
    }
  }

  async function handleReject(id: string) {
    setActionLoading(id)
    setActionError('')
    try {
      await aiDecisionsApi.reject(id)
      setDecisions((prev) =>
        prev.map((d) => d.id === id ? { ...d, isApproved: false } : d)
      )
    } catch (err: any) {
      setActionError(err?.message ?? 'Failed to reject decision')
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

  if (loading) return <PageSpinner />

  return (
    <div className="space-y-6 max-w-4xl">

      {/* ── Page header ── */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50 mb-1">AI Qarorlar Jurnali</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm">
            Performa qilgan va tavsiya etgan har bir harakat — to'liq asoslama bilan
          </p>
        </div>
        <Button variant="secondary" size="sm" onClick={fetchDecisions}>
          ↻ Yangilash
        </Button>
      </div>

      {fetchError && <Alert variant="error">{fetchError}</Alert>}
      {actionError && <Alert variant="error">{actionError}</Alert>}

      {/* ── Stats summary ── */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Jami', value: counts.all,      color: 'text-slate-900 dark:text-slate-50', bg: 'bg-white dark:bg-slate-900' },
          { label: 'Kutilmoqda', value: counts.pending,  color: 'text-amber-600', bg: 'bg-amber-50 border-amber-200' },
          { label: 'Tasdiqlangan', value: counts.approved, color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-200' },
          { label: 'Rad etilgan', value: counts.rejected, color: 'text-red-500',    bg: 'bg-red-50 border-red-200' },
        ].map((s) => (
          <button
            key={s.label}
            onClick={() => setFilter(s.label === 'Jami' ? 'all' : s.label === 'Kutilmoqda' ? 'pending' : s.label === 'Tasdiqlangan' ? 'approved' : 'rejected')}
            className={`border rounded-xl p-3 text-left transition-all hover:shadow-sm ${s.bg}`}
          >
            <p className="text-slate-500 dark:text-slate-400 text-xs mb-1">{s.label}</p>
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
          </button>
        ))}
      </div>

      {/* ── Pending approval banner ── */}
      {counts.pending > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center gap-4">
          <span className="text-2xl">⏳</span>
          <div className="flex-1">
            <p className="text-amber-700 font-medium text-sm">
              {counts.pending} ta qaror sizning tasdiqlashingizni kutmoqda
            </p>
            <p className="text-amber-600 text-xs mt-0.5">
              Siz Yordamlashish rejimdasiz — AI harakatni amalga oshirishdan oldin sizni kutadi.
            </p>
          </div>
          <Button
            size="sm"
            onClick={() => setFilter('pending')}
            className="bg-amber-100 text-amber-700 border border-amber-300 hover:bg-amber-200 shrink-0"
          >
            Ko'rib chiqish →
          </Button>
        </div>
      )}

      {/* ── Filter tabs ── */}
      <div className="flex items-center gap-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-1 w-fit">
        {(
          [
            { key: 'all', label: 'Barchasi' },
            { key: 'pending', label: 'Kutilmoqda' },
            { key: 'approved', label: 'Tasdiqlangan' },
            { key: 'rejected', label: 'Rad etilgan' },
          ] as const
        ).map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={`
              flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium
              transition-all duration-200
              ${filter === tab.key
                ? 'bg-slate-900 text-white'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:text-slate-50 hover:bg-slate-50 dark:bg-slate-800/50'
              }
            `}
          >
            {tab.label}
            {counts[tab.key] > 0 && (
              <span
                className={`
                  text-xs px-1.5 py-0.5 rounded-full
                  ${filter === tab.key
                    ? 'bg-white dark:bg-slate-900/20 text-slate-900 dark:text-slate-50'
                    : tab.key === 'pending'
                    ? 'bg-amber-500/20 text-amber-400'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                  }
                `}
              >
                {counts[tab.key]}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── Decisions list ── */}
      {filtered.length === 0 ? (
        <Card>
          <EmptyState
            icon="🤖"
            title={filter === 'all' ? 'Hali AI qarorlari yo\'q' : `${filter} qarorlar yo\'q`}
            description={
              filter === 'all'
                ? 'Optimizatsiya tsikli har bir necha soatda ishlaydi. Kampaniyalaringizni tahlil qilgach, barcha qarorlar bu yerda to\'liq izohlari bilan ko\'rinadi.'
                : `Hozirda "${filter}" holatidagi qarorlar yo\'q.`
            }
          />
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((decision) => {
            const config = ACTION_CONFIG[decision.actionType] ?? {
              label: decision.actionType,
              icon: '⚙️',
              variant: 'gray' as const,
            }
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
                    ${isExpanded ? 'border-slate-300 dark:border-slate-600' : ''}
                  `}
                >
                  <div className="p-5">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-lg shrink-0 mt-0.5">
                        {config.icon}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <Badge variant={config.variant}>{config.label}</Badge>

                          {isPending ? (
                            <Badge variant="warning" dot>Tasdiq kutilmoqda</Badge>
                          ) : decision.isApproved ? (
                            <Badge variant="success" dot>
                              {decision.isExecuted ? 'Bajarildi' : 'Tasdiqlandi'}
                            </Badge>
                          ) : (
                            <Badge variant="danger">Rad etildi</Badge>
                          )}

                          <span className="text-slate-500 dark:text-slate-400 text-xs ml-auto">
                            {timeAgo(decision.createdAt)}
                          </span>
                        </div>

                        <p className="text-slate-700 dark:text-slate-300 text-sm leading-relaxed">
                          {decision.reason}
                        </p>

                        {decision.estimatedImpact && (
                          <div className="flex items-start gap-2 mt-2.5 bg-slate-50 dark:bg-slate-800/50 rounded-lg px-3 py-2">
                            <span className="text-slate-700 dark:text-slate-300 text-xs font-medium shrink-0 mt-0.5">
                              💡 Kutilayotgan ta'sir:
                            </span>
                            <p className="text-slate-400 dark:text-slate-500 text-xs leading-relaxed">
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
                              className="text-red-500 border-red-200 hover:bg-red-50"
                            >
                              ✗ Rad etish
                            </Button>
                            <Button
                              size="sm"
                              loading={isThisLoading}
                              onClick={() => handleApprove(decision.id)}
                              className="bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100"
                            >
                              ✓ Tasdiqlash
                            </Button>
                          </div>
                        ) : (
                          (decision.beforeState || decision.afterState) && (
                            <button
                              onClick={() => setExpandedId(isExpanded ? null : decision.id)}
                              className="text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:text-slate-300 text-xs flex items-center gap-1 transition-colors"
                            >
                              {isExpanded ? 'Yopish ↑' : 'Batafsil ↓'}
                            </button>
                          )
                        )}
                      </div>
                    </div>
                  </div>

                  {isExpanded && (decision.beforeState || decision.afterState) && (
                    <div className="px-5 pb-5 pt-0">
                      <div className="border-t border-slate-200 dark:border-slate-700 pt-4">
                        <p className="text-slate-500 dark:text-slate-400 text-xs font-medium uppercase tracking-wide mb-3">
                          Oldin → Keyin
                        </p>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl p-4">
                            <p className="text-slate-500 dark:text-slate-400 text-xs font-medium mb-2 flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full bg-red-400" />
                              Oldin
                            </p>
                            {decision.beforeState ? (
                              <div className="space-y-1.5">
                                {Object.entries(decision.beforeState).map(([key, val]) => (
                                  <div key={key} className="flex justify-between text-xs">
                                    <span className="text-slate-500 dark:text-slate-400 capitalize">
                                      {key.replace(/([A-Z])/g, ' $1').trim()}
                                    </span>
                                    <span className="text-slate-400 dark:text-slate-500 font-mono">
                                      {typeof val === 'number' ? val.toLocaleString() : String(val)}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-slate-500 dark:text-slate-400 text-xs">Ma'lumot yo'q</p>
                            )}
                          </div>

                          <div className="bg-slate-50 dark:bg-slate-800/50 border border-emerald-500/20 rounded-xl p-4">
                            <p className="text-slate-500 dark:text-slate-400 text-xs font-medium mb-2 flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full bg-emerald-400" />
                              Keyin
                            </p>
                            {decision.afterState ? (
                              <div className="space-y-1.5">
                                {Object.entries(decision.afterState).map(([key, val]) => (
                                  <div key={key} className="flex justify-between text-xs">
                                    <span className="text-slate-500 dark:text-slate-400 capitalize">
                                      {key.replace(/([A-Z])/g, ' $1').trim()}
                                    </span>
                                    <span className="text-emerald-400 font-mono">
                                      {typeof val === 'number' ? val.toLocaleString() : String(val)}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-slate-500 dark:text-slate-400 text-xs">Bajarilishi kutilmoqda</p>
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
            <p className="text-slate-900 dark:text-slate-50 text-sm font-medium mb-0.5">
              Performa nima uchun bu jurnalni ko'rsatadi?
            </p>
            <p className="text-slate-500 dark:text-slate-400 text-xs leading-relaxed">
              Shaffoflik bizning asosiy tamoyilimiz. AI qilgan har bir optimizatsiya
              qarori bu yerda asoslamasi, kutilayotgan ta'siri va natijasi bilan qayd etiladi.
              Reklama byudjetingiz bilan nima bo'layotganini — va nima uchun — doimo bilishingiz kerak.
            </p>
          </div>
        </div>
      </Card>
    </div>
  )
}
