'use client'
import { useEffect, useState, useCallback } from 'react'
import { useWorkspaceStore } from '@/stores/workspace.store'
import { Badge } from '@/components/ui/Badge'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { PageSpinner } from '@/components/ui/Spinner'
import { Alert } from '@/components/ui/Alert'
import apiClient from '@/lib/api-client'
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

// Each action type has its own visual identity
// so the user can scan the log quickly by color and icon
const ACTION_CONFIG: Record<
  string,
  { label: string; icon: string; variant: 'success' | 'warning' | 'danger' | 'purple' | 'info' | 'gray' }
> = {
  pause_ad: {
    label: 'Paused Ad',
    icon: '⏸',
    variant: 'warning',
  },
  scale_budget: {
    label: 'Scaled Budget',
    icon: '📈',
    variant: 'success',
  },
  stop_campaign: {
    label: 'Stopped Campaign',
    icon: '⏹',
    variant: 'danger',
  },
  create_ad: {
    label: 'Created Ad',
    icon: '✨',
    variant: 'info',
  },
  shift_budget: {
    label: 'Shifted Budget',
    icon: '🔄',
    variant: 'purple',
  },
  generate_strategy: {
    label: 'Generated Strategy',
    icon: '🧠',
    variant: 'purple',
  },
  adjust_targeting: {
    label: 'Adjusted Targeting',
    icon: '🎯',
    variant: 'info',
  },
  rotate_creative: {
    label: 'Rotated Creative',
    icon: '🔁',
    variant: 'gray',
  },
}

export default function AiDecisionsPage() {
  const { currentWorkspace } = useWorkspaceStore()

  const [decisions, setDecisions] = useState<AiDecision[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [actionError, setActionError] = useState('')

  const fetchDecisions = useCallback(async () => {
    setLoading(true)
    // Simulate API delay
    await new Promise((r) => setTimeout(r, 1000))

    const mockDecisions: AiDecision[] = [
      {
        id: 'd1',
        actionType: 'scale_budget',
        reason:
          'Campaign "Meta | Retargeting" shows ROAS of 4.5x, which is 40% above target. Increasing daily budget by $20 to capitalize on high performance.',
        estimatedImpact: 'Expected to maintain ROAS while increasing volume of conversions by ~15%.',
        beforeState: { dailyBudget: 150, roas: 4.5 },
        afterState: { dailyBudget: 170 },
        isApproved: null,
        isExecuted: false,
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        campaignId: '1',
      },
      {
        id: 'd2',
        actionType: 'pause_ad',
        reason:
          'Ad "Creative_V2" in Google Shopping campaign has spent $45 without any conversions. CTR is also 30% below account average.',
        estimatedImpact: 'Saving ~$15/day of wasted spend to be reallocated to better performing ads.',
        beforeState: { spend: 45, conversions: 0, ctr: '0.8%' },
        afterState: { status: 'paused' },
        isApproved: true,
        isExecuted: true,
        createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        campaignId: '2',
      },
      {
        id: 'd3',
        actionType: 'adjust_targeting',
        reason:
          'Audience "Interest: Fitness" on Meta is performing significantly better for females aged 25-34. Narrowing targeting to this demographic.',
        estimatedImpact: 'Expected to lower CPA by ~10% by eliminating underperforming segments.',
        beforeState: { cpa: 22.5, audience: 'Broad Fitness' },
        afterState: { cpa: 19.8, audience: 'Fitness | Women 25-34' },
        isApproved: true,
        isExecuted: true,
        createdAt: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
        campaignId: '1',
      },
      {
        id: 'd4',
        actionType: 'shift_budget',
        reason:
          'Detected budget saturation on TikTok Awareness campaign. Shifting $30 of daily budget to Meta Retargeting where conversion potential is higher.',
        estimatedImpact: 'Better overall account ROAS by moving funds from awareness to conversion-focused channels.',
        beforeState: { tiktokBudget: 50, metaBudget: 150 },
        afterState: { tiktokBudget: 20, metaBudget: 180 },
        isApproved: false,
        isExecuted: false,
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        campaignId: null,
      },
    ]

    setDecisions(mockDecisions)
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchDecisions()
  }, [fetchDecisions])

  // Approve a pending decision (MOCK)
  async function handleApprove(id: string) {
    setActionLoading(id)
    await new Promise((r) => setTimeout(r, 800))
    setDecisions((prev) =>
      prev.map((d) =>
        d.id === id ? { ...d, isApproved: true, isExecuted: true } : d
      )
    )
    setActionLoading(null)
  }

  // Reject a pending decision (MOCK)
  async function handleReject(id: string) {
    setActionLoading(id)
    await new Promise((r) => setTimeout(r, 800))
    setDecisions((prev) =>
      prev.map((d) =>
        d.id === id ? { ...d, isApproved: false } : d
      )
    )
    setActionLoading(null)
  }

  // Compute counts for filter tabs
  const counts = {
    all: decisions.length,
    pending: decisions.filter((d) => d.isApproved === null).length,
    approved: decisions.filter((d) => d.isApproved === true).length,
    rejected: decisions.filter((d) => d.isApproved === false).length,
  }

  // Apply filter
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
          <h1 className="text-2xl font-bold text-white mb-1">AI Decisions Log</h1>
          <p className="text-[#6B7280] text-sm">
            Every action Nishon AI has taken or recommended — with full reasoning
          </p>
        </div>
        <Button variant="secondary" size="sm" onClick={fetchDecisions}>
          ↻ Refresh
        </Button>
      </div>

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
      <div className="flex items-center gap-1 bg-[#13131A] border border-[#2A2A3A] rounded-xl p-1 w-fit">
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
                ? 'bg-[#7C3AED] text-white'
                : 'text-[#6B7280] hover:text-white hover:bg-[#1C1C27]'
              }
            `}
          >
            {tab.label}
            {counts[tab.key] > 0 && (
              <span
                className={`
                  text-xs px-1.5 py-0.5 rounded-full
                  ${filter === tab.key
                    ? 'bg-white/20 text-white'
                    : tab.key === 'pending'
                    ? 'bg-amber-500/20 text-amber-400'
                    : 'bg-[#2A2A3A] text-[#6B7280]'
                  }
                `}
              >
                {counts[tab.key]}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── Error message ── */}
      {actionError && (
        <Alert variant="error">{actionError}</Alert>
      )}

      {/* ── Decisions list ── */}
      {filtered.length === 0 ? (
        <Card>
          <EmptyState
            icon="🤖"
            title={
              filter === 'all'
                ? 'No AI decisions yet'
                : `No ${filter} decisions`
            }
            description={
              filter === 'all'
                ? 'The optimization loop runs every 2 hours. Once it analyzes your campaigns, all decisions will appear here with full explanations.'
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
                {/* Decision card */}
                <Card
                  padding="none"
                  className={`
                    transition-all duration-200
                    ${isPending ? 'border-amber-500/30' : ''}
                    ${isExpanded ? 'border-[#7C3AED]/30' : ''}
                  `}
                >
                  <div className="p-5">
                    <div className="flex items-start gap-4">

                      {/* Action icon circle */}
                      <div className="w-10 h-10 rounded-xl bg-[#1C1C27] border border-[#2A2A3A] flex items-center justify-center text-lg shrink-0 mt-0.5">
                        {config.icon}
                      </div>

                      {/* Main content */}
                      <div className="flex-1 min-w-0">
                        {/* Top row: action type + status + time */}
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <Badge variant={config.variant}>{config.label}</Badge>

                          {isPending ? (
                            <Badge variant="warning" dot>
                              Awaiting approval
                            </Badge>
                          ) : decision.isApproved ? (
                            <Badge variant="success" dot>
                              {decision.isExecuted ? 'Executed' : 'Approved'}
                            </Badge>
                          ) : (
                            <Badge variant="danger">Rejected</Badge>
                          )}

                          <span className="text-[#4B5563] text-xs ml-auto">
                            {timeAgo(decision.createdAt)}
                          </span>
                        </div>

                        {/* Reason — this is the most important part */}
                        <p className="text-[#D1D5DB] text-sm leading-relaxed">
                          {decision.reason}
                        </p>

                        {/* Estimated impact */}
                        {decision.estimatedImpact && (
                          <div className="flex items-start gap-2 mt-2.5 bg-[#1C1C27] rounded-lg px-3 py-2">
                            <span className="text-[#7C3AED] text-xs font-medium shrink-0 mt-0.5">
                              💡 Expected impact:
                            </span>
                            <p className="text-[#9CA3AF] text-xs leading-relaxed">
                              {decision.estimatedImpact}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Right side: approve/reject OR expand toggle */}
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
                          // Show expand button when there's before/after state data
                          (decision.beforeState || decision.afterState) && (
                            <button
                              onClick={() =>
                                setExpandedId(isExpanded ? null : decision.id)
                              }
                              className="text-[#4B5563] hover:text-[#9CA3AF] text-xs flex items-center gap-1 transition-colors"
                            >
                              {isExpanded ? 'Hide details ↑' : 'Show details ↓'}
                            </button>
                          )
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Expanded state diff panel */}
                  {isExpanded && (decision.beforeState || decision.afterState) && (
                    <div className="px-5 pb-5 pt-0">
                      <div className="border-t border-[#2A2A3A] pt-4">
                        <p className="text-[#6B7280] text-xs font-medium uppercase tracking-wide mb-3">
                          Before → After
                        </p>
                        <div className="grid grid-cols-2 gap-3">
                          {/* Before state */}
                          <div className="bg-[#0D0D15] border border-[#2A2A3A] rounded-xl p-4">
                            <p className="text-[#6B7280] text-xs font-medium mb-2 flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full bg-red-500/60" />
                              Before
                            </p>
                            {decision.beforeState ? (
                              <div className="space-y-1.5">
                                {Object.entries(decision.beforeState).map(
                                  ([key, val]) => (
                                    <div key={key} className="flex justify-between text-xs">
                                      <span className="text-[#4B5563] capitalize">
                                        {key.replace(/([A-Z])/g, ' $1').trim()}
                                      </span>
                                      <span className="text-[#9CA3AF] font-mono">
                                        {typeof val === 'number'
                                          ? val.toLocaleString()
                                          : String(val)}
                                      </span>
                                    </div>
                                  )
                                )}
                              </div>
                            ) : (
                              <p className="text-[#4B5563] text-xs">No data</p>
                            )}
                          </div>

                          {/* After state */}
                          <div className="bg-[#0D0D15] border border-emerald-500/20 rounded-xl p-4">
                            <p className="text-[#6B7280] text-xs font-medium mb-2 flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full bg-emerald-500/60" />
                              After
                            </p>
                            {decision.afterState ? (
                              <div className="space-y-1.5">
                                {Object.entries(decision.afterState).map(
                                  ([key, val]) => (
                                    <div key={key} className="flex justify-between text-xs">
                                      <span className="text-[#4B5563] capitalize">
                                        {key.replace(/([A-Z])/g, ' $1').trim()}
                                      </span>
                                      <span className="text-emerald-400 font-mono">
                                        {typeof val === 'number'
                                          ? val.toLocaleString()
                                          : String(val)}
                                      </span>
                                    </div>
                                  )
                                )}
                              </div>
                            ) : (
                              <p className="text-[#4B5563] text-xs">Pending execution</p>
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

      {/* ── Explainability note ── */}
      <Card variant="outlined" padding="sm">
        <div className="flex items-start gap-3 px-2">
          <span className="text-lg mt-0.5">🔍</span>
          <div>
            <p className="text-white text-sm font-medium mb-0.5">
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