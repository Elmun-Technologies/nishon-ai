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
          <h1 className="text-2xl font-bold text-[#111827] mb-1">AI Decisions Log</h1>
          <p className="text-[#6B7280] text-sm">
            Every action Nishon AI has taken or recommended — with full reasoning
          </p>
        </div>
        <Button variant="secondary" size="sm" onClick={fetchDecisions}>
          ↻ Refresh
        </Button>
      </div>

      {fetchError && <Alert variant="error">{fetchError}</Alert>}
      {actionError && <Alert variant="error">{actionError}</Alert>}

      {/* ── Pending approval banner ── */}
      {counts.pending > 0 && (
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 flex items-center gap-4">
          <span className="text-2xl">⏳</span>
          <div className="flex-1">
            <p className="text-amber-400 font-medium text-sm">
              {counts.pending} decision{counts.pending !== 1 ? 's' : ''} waiting for your approval
            </p>
            <p className="text-[#6B7280] text-xs mt-0.5">
              You are in Assisted mode — AI waits for your confirmation before acting.
            </p>
          </div>
          <Button
            size="sm"
            onClick={() => setFilter('pending')}
            className="bg-amber-500/20 text-amber-400 border border-amber-500/30 hover:bg-amber-500/30 shrink-0"
          >
            Review now →
          </Button>
        </div>
      )}

      {/* ── Filter tabs ── */}
      <div className="flex items-center gap-1 bg-white border border-[#E5E7EB] rounded-xl p-1 w-fit">
        {(
          [
            { key: 'all', label: 'All' },
            { key: 'pending', label: 'Pending' },
            { key: 'approved', label: 'Approved' },
            { key: 'rejected', label: 'Rejected' },
          ] as const
        ).map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={`
              flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium
              transition-all duration-200
              ${filter === tab.key
                ? 'bg-[#111827] text-white'
                : 'text-[#6B7280] hover:text-[#111827] hover:bg-[#F9FAFB]'
              }
            `}
          >
            {tab.label}
            {counts[tab.key] > 0 && (
              <span
                className={`
                  text-xs px-1.5 py-0.5 rounded-full
                  ${filter === tab.key
                    ? 'bg-white/20 text-[#111827]'
                    : tab.key === 'pending'
                    ? 'bg-amber-500/20 text-amber-400'
                    : 'bg-[#F3F4F6] text-[#6B7280]'
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
            title={filter === 'all' ? 'No AI decisions yet' : `No ${filter} decisions`}
            description={
              filter === 'all'
                ? 'The optimization loop runs every few hours. Once it analyzes your campaigns, all decisions will appear here with full explanations.'
                : `No decisions with "${filter}" status right now.`
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
                    ${isExpanded ? 'border-[#D1D5DB]' : ''}
                  `}
                >
                  <div className="p-5">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-xl bg-[#F9FAFB] border border-[#E5E7EB] flex items-center justify-center text-lg shrink-0 mt-0.5">
                        {config.icon}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <Badge variant={config.variant}>{config.label}</Badge>

                          {isPending ? (
                            <Badge variant="warning" dot>Awaiting approval</Badge>
                          ) : decision.isApproved ? (
                            <Badge variant="success" dot>
                              {decision.isExecuted ? 'Executed' : 'Approved'}
                            </Badge>
                          ) : (
                            <Badge variant="danger">Rejected</Badge>
                          )}

                          <span className="text-[#6B7280] text-xs ml-auto">
                            {timeAgo(decision.createdAt)}
                          </span>
                        </div>

                        <p className="text-[#374151] text-sm leading-relaxed">
                          {decision.reason}
                        </p>

                        {decision.estimatedImpact && (
                          <div className="flex items-start gap-2 mt-2.5 bg-[#F9FAFB] rounded-lg px-3 py-2">
                            <span className="text-[#374151] text-xs font-medium shrink-0 mt-0.5">
                              💡 Expected impact:
                            </span>
                            <p className="text-[#9CA3AF] text-xs leading-relaxed">
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
                              className="text-red-400 border-red-500/20 hover:bg-red-500/10"
                            >
                              ✗ Reject
                            </Button>
                            <Button
                              size="sm"
                              loading={isThisLoading}
                              onClick={() => handleApprove(decision.id)}
                              className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20"
                            >
                              ✓ Approve
                            </Button>
                          </div>
                        ) : (
                          (decision.beforeState || decision.afterState) && (
                            <button
                              onClick={() => setExpandedId(isExpanded ? null : decision.id)}
                              className="text-[#6B7280] hover:text-[#9CA3AF] text-xs flex items-center gap-1 transition-colors"
                            >
                              {isExpanded ? 'Hide details ↑' : 'Show details ↓'}
                            </button>
                          )
                        )}
                      </div>
                    </div>
                  </div>

                  {isExpanded && (decision.beforeState || decision.afterState) && (
                    <div className="px-5 pb-5 pt-0">
                      <div className="border-t border-[#E5E7EB] pt-4">
                        <p className="text-[#6B7280] text-xs font-medium uppercase tracking-wide mb-3">
                          Before → After
                        </p>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="bg-[#0D0D15] border border-[#E5E7EB] rounded-xl p-4">
                            <p className="text-[#6B7280] text-xs font-medium mb-2 flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full bg-red-500/60" />
                              Before
                            </p>
                            {decision.beforeState ? (
                              <div className="space-y-1.5">
                                {Object.entries(decision.beforeState).map(([key, val]) => (
                                  <div key={key} className="flex justify-between text-xs">
                                    <span className="text-[#6B7280] capitalize">
                                      {key.replace(/([A-Z])/g, ' $1').trim()}
                                    </span>
                                    <span className="text-[#9CA3AF] font-mono">
                                      {typeof val === 'number' ? val.toLocaleString() : String(val)}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-[#6B7280] text-xs">No data</p>
                            )}
                          </div>

                          <div className="bg-[#0D0D15] border border-emerald-500/20 rounded-xl p-4">
                            <p className="text-[#6B7280] text-xs font-medium mb-2 flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full bg-emerald-500/60" />
                              After
                            </p>
                            {decision.afterState ? (
                              <div className="space-y-1.5">
                                {Object.entries(decision.afterState).map(([key, val]) => (
                                  <div key={key} className="flex justify-between text-xs">
                                    <span className="text-[#6B7280] capitalize">
                                      {key.replace(/([A-Z])/g, ' $1').trim()}
                                    </span>
                                    <span className="text-emerald-400 font-mono">
                                      {typeof val === 'number' ? val.toLocaleString() : String(val)}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-[#6B7280] text-xs">Pending execution</p>
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
            <p className="text-[#111827] text-sm font-medium mb-0.5">
              Why does Nishon AI show this log?
            </p>
            <p className="text-[#6B7280] text-xs leading-relaxed">
              Transparency is core to how we operate. Every optimization decision
              the AI makes is recorded here with its reasoning, expected impact,
              and outcome. You should always know what&apos;s happening with your
              ad budget — and why.
            </p>
          </div>
        </div>
      </Card>
    </div>
  )
}
