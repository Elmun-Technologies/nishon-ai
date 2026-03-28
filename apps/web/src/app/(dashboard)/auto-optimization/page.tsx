'use client'
import { useState } from 'react'
import { useWorkspaceStore } from '@/stores/workspace.store'
import { autoOptimization } from '@/lib/api-client'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'

// ─── Types (mirrors backend OptimizationReport) ───────────────────────────────

type GovernanceDecision = 'AUTO_APPLY_ALLOWED' | 'APPROVAL_REQUIRED' | 'BLOCKED'

interface GovernedAction {
  action: {
    type: string
    targetId: string
    targetType: string
    reason: string
    expectedImpact: string
    priority: string
  }
  governance: GovernanceDecision
  governanceReason: string
  riskLevel: 'low' | 'medium' | 'high'
}

interface GovernanceSummary {
  total: number
  autoApply: number
  approvalRequired: number
  blocked: number
}

interface OptimizationReport {
  campaignId: string
  platform: string
  mode: string
  completedSteps: string[]
  errors: Record<string, string>
  ruleAnalysis: {
    problems: { type: string; severity: string; message: string; targetId: string; targetType: string }[]
    opportunities: { message: string; potentialImpact: string }[]
    winners: string[]
    losers: string[]
    dataQuality: string
    confidence: number
  } | null
  aiSuggestion: {
    summary: string
    overallHealthScore: number
    keyInsights: string[]
  } | null
  rankedActions: { action: any; score: number; effortLevel: string }[]
  governedActions: GovernedAction[]
  governanceSummary: GovernanceSummary | null
  autoAppliedActions: string[]
  generatedCreatives: any | null
  summary: string
  metadata: { model: string; tokensUsed: number; durationMs: number }
}

interface HistoryRun {
  id: string
  campaignId: string
  platform: string
  mode: string
  healthScore: number | null
  summary: string
  governanceSummary: GovernanceSummary | null
  autoAppliedActions: string[]
  durationMs: number
  createdAt: string
}

// ─── Governance badge ─────────────────────────────────────────────────────────

function GovBadge({ decision }: { decision: GovernanceDecision }) {
  if (decision === 'AUTO_APPLY_ALLOWED') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
        Auto
      </span>
    )
  }
  if (decision === 'APPROVAL_REQUIRED') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
        Approval
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-500/10 text-red-400 border border-red-500/20">
      <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
      Blocked
    </span>
  )
}

function RiskDot({ level }: { level: 'low' | 'medium' | 'high' }) {
  const cls =
    level === 'low' ? 'bg-emerald-400'
    : level === 'medium' ? 'bg-amber-400'
    : 'bg-red-400'
  return <span className={`inline-block w-2 h-2 rounded-full ${cls} shrink-0`} />
}

function SeverityBadge({ severity }: { severity: string }) {
  if (severity === 'critical') return <Badge variant="danger" size="sm">critical</Badge>
  if (severity === 'warning') return <Badge variant="warning" size="sm">warning</Badge>
  return <Badge variant="gray" size="sm">info</Badge>
}

// ─── Health score ring ────────────────────────────────────────────────────────

function HealthScore({ score }: { score: number }) {
  const color =
    score >= 70 ? '#34d399'
    : score >= 45 ? '#f59e0b'
    : '#f87171'

  const circumference = 2 * Math.PI * 28
  const offset = circumference - (score / 100) * circumference

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-20 h-20">
        <svg className="w-20 h-20 -rotate-90" viewBox="0 0 64 64">
          <circle cx="32" cy="32" r="28" fill="none" stroke="#2A2A3A" strokeWidth="6" />
          <circle
            cx="32" cy="32" r="28"
            fill="none"
            stroke={color}
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            style={{ transition: 'stroke-dashoffset 0.6s ease' }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xl font-bold text-[#111827]">{score}</span>
        </div>
      </div>
      <p className="text-[#6B7280] text-xs mt-2">Health Score</p>
    </div>
  )
}

// ─── Demo input ───────────────────────────────────────────────────────────────

const DEMO_PAYLOAD = {
  platform: 'meta' as const,
  performance: {
    campaignId: 'demo-campaign-1',
    campaignName: 'Summer Sale 2024',
    platform: 'meta',
    objective: 'conversions',
    impressions: 45000,
    clicks: 810,
    ctr: 1.8,
    cpc: 0.62,
    spend: 502,
    conversions: 18,
    cpa: 27.9,
    roas: 2.1,
    dailyBudget: 80,
    adSets: [
      {
        adSetId: 'as-001',
        adSetName: 'Lookalike 1%',
        impressions: 28000,
        clicks: 504,
        ctr: 1.8,
        cpc: 0.56,
        spend: 282,
        conversions: 12,
        cpa: 23.5,
        roas: 2.5,
        ads: [
          {
            adId: 'ad-001',
            adName: 'Video — product demo',
            impressions: 15000,
            clicks: 300,
            ctr: 2.0,
            cpc: 0.5,
            cpm: 10,
            spend: 150,
            conversions: 8,
            cpa: 18.75,
            roas: 3.2,
            frequency: 2.1,
            hookRate: 18,
          },
          {
            adId: 'ad-002',
            adName: 'Static — discount banner',
            impressions: 13000,
            clicks: 204,
            ctr: 1.57,
            cpc: 0.65,
            cpm: 10.15,
            spend: 132,
            conversions: 4,
            cpa: 33,
            roas: 1.8,
            frequency: 4.8,
          },
        ],
      },
      {
        adSetId: 'as-002',
        adSetName: 'Retargeting 30d',
        impressions: 17000,
        clicks: 306,
        ctr: 1.8,
        cpc: 0.72,
        spend: 220,
        conversions: 6,
        cpa: 36.7,
        roas: 1.5,
        ads: [
          {
            adId: 'ad-003',
            adName: 'Carousel — testimonials',
            impressions: 17000,
            clicks: 306,
            ctr: 1.8,
            cpc: 0.72,
            cpm: 12.94,
            spend: 220,
            conversions: 6,
            cpa: 36.7,
            roas: 1.5,
            frequency: 5.2,
          },
        ],
      },
    ],
  },
  mode: 'recommend',
  goal: { type: 'conversions', targetCpa: 20, targetRoas: 3.0 },
}

// ─── Page ─────────────────────────────────────────────────────────────────────

type Tab = 'run' | 'history'

export default function AutoOptimizationPage() {
  const { currentWorkspace } = useWorkspaceStore()

  const [tab, setTab] = useState<Tab>('run')
  const [mode, setMode] = useState<'recommend' | 'auto_apply'>('recommend')
  const [loading, setLoading] = useState(false)
  const [historyLoading, setHistoryLoading] = useState(false)
  const [report, setReport] = useState<OptimizationReport | null>(null)
  const [history, setHistory] = useState<HistoryRun[]>([])
  const [error, setError] = useState<string | null>(null)

  const workspaceId = currentWorkspace?.id ?? 'demo'

  async function handleRun() {
    setLoading(true)
    setError(null)
    setReport(null)
    try {
      const res = await autoOptimization.run(workspaceId, { ...DEMO_PAYLOAD, mode })
      setReport((res as any).data)
    } catch (err: any) {
      setError(err?.message ?? 'Optimization failed')
    } finally {
      setLoading(false)
    }
  }

  async function handleLoadHistory() {
    setHistoryLoading(true)
    try {
      const res = await autoOptimization.history(workspaceId, 20)
      setHistory(((res as any).data) ?? [])
    } catch {
      setHistory([])
    } finally {
      setHistoryLoading(false)
    }
  }

  function handleTabChange(t: Tab) {
    setTab(t)
    if (t === 'history' && history.length === 0) {
      handleLoadHistory()
    }
  }

  return (
    <div className="space-y-6 max-w-5xl">

      {/* ── Header ── */}
      <div>
        <h1 className="text-2xl font-bold text-[#111827] mb-1">Auto-Optimallashtirish</h1>
        <p className="text-[#6B7280] text-sm">
          AI reklama kampaniyangizni tahlil qiladi, muammolarni aniqlaydi va harakatlarni tavsiya qiladi.
          Har bir harakat xavf darajasi va tasdiqlash talabiga qarab boshqariladi.
        </p>
      </div>

      {/* ── Tabs ── */}
      <div className="flex gap-1 bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl p-1 w-fit">
        {(['run', 'history'] as Tab[]).map(t => (
          <button
            key={t}
            onClick={() => handleTabChange(t)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
              tab === t
                ? 'bg-[#111827] text-white'
                : 'text-[#6B7280] hover:text-[#111827]'
            }`}
          >
            {t === 'run' ? 'Tahlil' : 'Tarix'}
          </button>
        ))}
      </div>

      {/* ══ TAB: RUN ════════════════════════════════════════════════════════════ */}
      {tab === 'run' && (
        <>
          {/* Config card */}
          <Card>
            <h2 className="text-[#111827] font-semibold mb-4">Sozlamalar</h2>

            {/* Mode selector */}
            <div className="mb-5">
              <p className="text-[#6B7280] text-xs mb-2 uppercase tracking-wide font-medium">Ish rejimi</p>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setMode('recommend')}
                  className={`text-left p-4 rounded-xl border transition-all ${
                    mode === 'recommend'
                      ? 'border-[#111827] bg-[#F3F4F6]'
                      : 'border-[#E5E7EB] hover:border-[#D1D5DB]'
                  }`}
                >
                  <p className="text-[#111827] font-medium text-sm mb-1">Tavsiya rejimi</p>
                  <p className="text-[#6B7280] text-xs leading-relaxed">
                    AI tavsiyalar beradi — siz tasdiqlaysiz. Eng xavfsiz variant.
                  </p>
                </button>
                <button
                  onClick={() => setMode('auto_apply')}
                  className={`text-left p-4 rounded-xl border transition-all ${
                    mode === 'auto_apply'
                      ? 'border-amber-500 bg-amber-500/10'
                      : 'border-[#E5E7EB] hover:border-amber-500/40'
                  }`}
                >
                  <p className="text-[#111827] font-medium text-sm mb-1">
                    Avtomatik rejim
                    <span className="ml-2 text-xs text-amber-400 font-normal">xavf bor</span>
                  </p>
                  <p className="text-[#6B7280] text-xs leading-relaxed">
                    Faqat xavfsiz kontent harakatlar avtomatik. Platforma o'zgarishlari — tasdiq talab qiladi.
                  </p>
                </button>
              </div>
            </div>

            {/* Demo notice */}
            <div className="flex items-start gap-2 bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg p-3 mb-5">
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="#A78BFA" strokeWidth={1.8} className="shrink-0 mt-0.5">
                <path d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-[#6B7280] text-xs leading-relaxed">
                Demo ma'lumotlar ishlatilmoqda: Summer Sale 2024 kampaniyasi (Meta), $502 sarflov,
                ROAS 2.1x, 18 konversiya. Real platformaga ulanish sozlamalardan amalga oshiriladi.
              </p>
            </div>

            <Button
              onClick={handleRun}
              disabled={loading}
              className="w-full"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <Spinner size="sm" /> Tahlil qilinmoqda...
                </span>
              ) : (
                'Optimallashtirish boshlash'
              )}
            </Button>

            {error && (
              <div className="mt-3 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}
          </Card>

          {/* ── Results ── */}
          {report && <OptimizationResults report={report} />}
        </>
      )}

      {/* ══ TAB: HISTORY ════════════════════════════════════════════════════════ */}
      {tab === 'history' && (
        <HistoryTab
          history={history}
          loading={historyLoading}
          onRefresh={handleLoadHistory}
        />
      )}
    </div>
  )
}

// ─── Results panel ────────────────────────────────────────────────────────────

function OptimizationResults({ report }: { report: OptimizationReport }) {
  const govSummary = report.governanceSummary
  const problems   = report.ruleAnalysis?.problems ?? []
  const insights   = report.aiSuggestion?.keyInsights ?? []
  const governed   = report.governedActions ?? []
  const creatives  = report.generatedCreatives

  const hasErrors = Object.keys(report.errors).length > 0

  return (
    <div className="space-y-4">

      {/* Header row: health + governance summary + steps */}
      <Card>
        <div className="flex items-center gap-8 flex-wrap">
          {report.aiSuggestion?.overallHealthScore != null && (
            <HealthScore score={report.aiSuggestion.overallHealthScore} />
          )}

          {govSummary && (
            <div className="flex-1 min-w-0">
              <p className="text-[#6B7280] text-xs uppercase tracking-wide mb-3 font-medium">
                Governance xulosasi
              </p>
              <div className="grid grid-cols-3 gap-3">
                <div className="text-center">
                  <p className="text-2xl font-bold text-emerald-400">{govSummary.autoApply}</p>
                  <p className="text-[#6B7280] text-xs">Avtomatik</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-amber-400">{govSummary.approvalRequired}</p>
                  <p className="text-[#6B7280] text-xs">Tasdiq kerak</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-red-400">{govSummary.blocked}</p>
                  <p className="text-[#6B7280] text-xs">Bloklangan</p>
                </div>
              </div>
            </div>
          )}

          <div className="text-right shrink-0">
            <p className="text-[#6B7280] text-xs mb-1">
              {report.metadata.durationMs}ms &middot; {report.metadata.model}
            </p>
            <div className="flex flex-wrap gap-1 justify-end">
              {report.completedSteps.map(s => (
                <span key={s} className="px-2 py-0.5 rounded-full bg-[#F9FAFB] border border-[#E5E7EB] text-[#6B7280] text-xs">
                  {s}
                </span>
              ))}
            </div>
          </div>
        </div>

        {report.summary && (
          <p className="text-[#9CA3AF] text-sm leading-relaxed mt-4 pt-4 border-t border-[#E5E7EB]">
            {report.summary}
          </p>
        )}
      </Card>

      {/* Errors */}
      {hasErrors && (
        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl space-y-1">
          {Object.entries(report.errors).map(([step, msg]) => (
            <p key={step} className="text-red-400 text-xs">
              <span className="font-medium">{step}:</span> {msg}
            </p>
          ))}
        </div>
      )}

      {/* Problems */}
      {problems.length > 0 && (
        <Card>
          <h3 className="text-[#111827] font-semibold mb-3 flex items-center gap-2">
            Aniqlangan muammolar
            <Badge variant="danger" size="sm">{problems.length}</Badge>
          </h3>
          <div className="space-y-2">
            {problems.map((p, i) => (
              <div key={i} className="flex items-start gap-3 p-3 bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg">
                <SeverityBadge severity={p.severity} />
                <div className="flex-1 min-w-0">
                  <p className="text-[#111827] text-sm">{p.message}</p>
                  <p className="text-[#6B7280] text-xs mt-0.5">
                    {p.targetType} · {p.targetId}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* AI insights */}
      {insights.length > 0 && (
        <Card>
          <h3 className="text-[#111827] font-semibold mb-3">AI tavsiyalar</h3>
          <ul className="space-y-2">
            {insights.map((insight, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="text-[#374151] mt-0.5 shrink-0">›</span>
                <p className="text-[#9CA3AF] text-sm leading-relaxed">{insight}</p>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {/* Governed actions */}
      {governed.length > 0 && (
        <Card>
          <h3 className="text-[#111827] font-semibold mb-3 flex items-center gap-2">
            Harakatlar
            <Badge variant="gray" size="sm">{governed.length} ta</Badge>
          </h3>
          <div className="space-y-2">
            {governed.map((ga, i) => (
              <div
                key={i}
                className={`p-3 rounded-lg border transition-colors ${
                  ga.governance === 'AUTO_APPLY_ALLOWED'
                    ? 'bg-emerald-500/5 border-emerald-500/15'
                    : ga.governance === 'APPROVAL_REQUIRED'
                    ? 'bg-amber-500/5 border-amber-500/15'
                    : 'bg-red-500/5 border-red-500/15'
                }`}
              >
                <div className="flex items-start gap-3">
                  <RiskDot level={ga.riskLevel} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="text-[#111827] text-sm font-medium">
                        {ga.action.type.replace(/_/g, ' ')}
                      </span>
                      <GovBadge decision={ga.governance} />
                      <span className="text-[#6B7280] text-xs">
                        {ga.action.targetType} · {ga.action.targetId}
                      </span>
                    </div>
                    <p className="text-[#9CA3AF] text-xs leading-relaxed">{ga.action.reason}</p>
                    <p className="text-[#6B7280] text-xs mt-1 italic">{ga.governanceReason}</p>
                  </div>
                  <Badge
                    variant={
                      ga.action.priority === 'critical' ? 'danger'
                      : ga.action.priority === 'high' ? 'warning'
                      : 'gray'
                    }
                    size="sm"
                  >
                    {ga.action.priority}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Creative refresh */}
      {creatives && (
        <Card>
          <h3 className="text-[#111827] font-semibold mb-3">Kreativ yangilanish takliflari</h3>
          <pre className="text-[#9CA3AF] text-xs leading-relaxed whitespace-pre-wrap bg-[#F9FAFB] p-4 rounded-lg border border-[#E5E7EB]">
            {typeof creatives === 'string' ? creatives : JSON.stringify(creatives, null, 2)}
          </pre>
        </Card>
      )}
    </div>
  )
}

// ─── History tab ──────────────────────────────────────────────────────────────

function HistoryTab({
  history,
  loading,
  onRefresh,
}: {
  history: HistoryRun[]
  loading: boolean
  onRefresh: () => void
}) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Spinner />
      </div>
    )
  }

  if (history.length === 0) {
    return (
      <Card>
        <div className="text-center py-12">
          <p className="text-[#6B7280] text-sm mb-3">Hali hech qanday optimallashtirish o'tkazilmagan.</p>
          <Button variant="secondary" size="sm" onClick={onRefresh}>
            Yangilash
          </Button>
        </div>
      </Card>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-[#6B7280] text-sm">{history.length} ta run</p>
        <Button variant="secondary" size="sm" onClick={onRefresh}>Yangilash</Button>
      </div>

      {history.map(run => (
        <Card key={run.id}>
          <div className="flex items-start gap-4">
            {/* Health score */}
            <div className="text-center shrink-0 w-12">
              {run.healthScore != null ? (
                <>
                  <p className={`text-xl font-bold ${
                    run.healthScore >= 70 ? 'text-emerald-400'
                    : run.healthScore >= 45 ? 'text-amber-400'
                    : 'text-red-400'
                  }`}>{run.healthScore}</p>
                  <p className="text-[#6B7280] text-xs">sog'liq</p>
                </>
              ) : (
                <p className="text-[#6B7280] text-sm">—</p>
              )}
            </div>

            {/* Details */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span className="text-[#111827] text-sm font-medium capitalize">{run.platform}</span>
                <Badge variant={run.mode === 'auto_apply' ? 'warning' : 'purple'} size="sm">
                  {run.mode === 'auto_apply' ? 'auto' : 'recommend'}
                </Badge>
                {run.governanceSummary && (
                  <>
                    <span className="text-emerald-400 text-xs">{run.governanceSummary.autoApply} auto</span>
                    <span className="text-amber-400 text-xs">{run.governanceSummary.approvalRequired} tasdiq</span>
                    {run.governanceSummary.blocked > 0 && (
                      <span className="text-red-400 text-xs">{run.governanceSummary.blocked} bloklangan</span>
                    )}
                  </>
                )}
              </div>
              <p className="text-[#9CA3AF] text-xs leading-relaxed line-clamp-2">{run.summary}</p>
            </div>

            {/* Time */}
            <div className="text-right shrink-0">
              <p className="text-[#6B7280] text-xs">{new Date(run.createdAt).toLocaleDateString('uz-UZ')}</p>
              <p className="text-[#6B7280] text-xs">{run.durationMs}ms</p>
            </div>
          </div>
        </Card>
      ))}
    </div>
  )
}
