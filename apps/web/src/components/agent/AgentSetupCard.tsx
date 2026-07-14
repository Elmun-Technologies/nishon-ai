'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import {
  ArrowLeft,
  Bot,
  Check,
  Link2,
  Loader2,
  Megaphone,
  Shield,
  Sparkles,
  Target,
  TrendingUp,
} from 'lucide-react'
import { Input } from '@/components/ui'
import { useI18n } from '@/i18n/use-i18n'
import { cn } from '@/lib/utils'
import { aiAgent } from '@/lib/api-client'
import { allocateFunnelBudget, normalizeGoal, type AgentGoal } from '@/lib/funnel-allocator'
import { detectVertical, type Vertical } from '@/lib/ad-copy-templates'
import { BudgetVisualizer, BudgetBars } from './BudgetVisualizer'
import { AdCopyPreview } from './AdCopyPreview'

/**
 * The autonomous agent's setup surface — the dashboard hero. A three-phase,
 * high-fidelity flow:
 *
 *   input     → link + goal + budget, "Analyze & Allocate"
 *   analyzing → staged "AI Agent is analyzing…" sequence (2s / 1.5s / 1.5s)
 *   result    → interactive Budget Visualizer + tabbed AI ad-copy preview,
 *               then "Activate Agent" (the only step that hits the backend)
 *
 * Analysis + preview are entirely client-side (allocator + copy templates), so
 * they are instant and free. Activation calls the real optimization loop and
 * never creates a duplicate workspace.
 */

const STOP_LOSS_DEFAULT_USD = 30

function configKey(workspaceId: string) {
  return `nishon.agentConfig.${workspaceId}`
}

export interface AgentConfig {
  link: string
  goal: AgentGoal
  budget: number
  stopLossUsd: number
  activatedAt: string
}

export function loadAgentConfig(workspaceId: string | undefined): AgentConfig | null {
  if (!workspaceId || typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(configKey(workspaceId))
    if (!raw) return null
    const parsed = JSON.parse(raw) as AgentConfig
    return { ...parsed, goal: normalizeGoal(parsed.goal) }
  } catch {
    return null
  }
}

function usd(n: number): string {
  return `$${Math.round(n).toLocaleString('en-US')}`
}

/** Analyzing sequence — labels + duration (ms) per step. */
const ANALYZE_STEPS = [
  { key: 'scan', ms: 2000 },
  { key: 'audience', ms: 1500 },
  { key: 'strategy', ms: 1500 },
] as const

type Phase = 'input' | 'analyzing' | 'result'

export function AgentSetupCard({
  workspaceId,
  defaultLink = '',
  onActivated,
}: {
  workspaceId?: string
  defaultLink?: string
  onActivated?: (config: AgentConfig) => void
}) {
  const { t } = useI18n()

  const [phase, setPhase] = useState<Phase>('input')
  const [link, setLink] = useState(defaultLink)
  const [goal, setGoal] = useState<AgentGoal>('sales')
  const [budget, setBudget] = useState(2000)
  const [analyzeStep, setAnalyzeStep] = useState(0)
  const [activating, setActivating] = useState(false)
  const [error, setError] = useState('')

  const timers = useRef<ReturnType<typeof setTimeout>[]>([])
  useEffect(() => () => timers.current.forEach(clearTimeout), [])

  const allocation = useMemo(
    () => allocateFunnelBudget({ goal, totalBudget: budget }),
    [goal, budget],
  )
  const vertical = useMemo<Vertical>(() => detectVertical(link), [link])

  const canAnalyze = link.trim().length > 3 && budget >= 100

  function startAnalysis() {
    if (!canAnalyze) return
    setError('')
    setPhase('analyzing')
    setAnalyzeStep(0)
    timers.current.forEach(clearTimeout)
    timers.current = []
    let elapsed = 0
    ANALYZE_STEPS.forEach((step, i) => {
      elapsed += step.ms
      timers.current.push(
        setTimeout(() => {
          if (i + 1 < ANALYZE_STEPS.length) setAnalyzeStep(i + 1)
          else setPhase('result')
        }, elapsed),
      )
    })
  }

  async function activate() {
    setActivating(true)
    setError('')
    const config: AgentConfig = {
      link: link.trim(),
      goal,
      budget,
      stopLossUsd: STOP_LOSS_DEFAULT_USD,
      activatedAt: new Date().toISOString(),
    }
    try {
      if (workspaceId) {
        try {
          window.localStorage.setItem(configKey(workspaceId), JSON.stringify(config))
        } catch {
          /* ignore quota / private-mode errors */
        }
        await aiAgent.optimize(workspaceId)
      }
      onActivated?.(config)
    } catch (e: unknown) {
      setError(
        e instanceof Error
          ? e.message
          : t('agent.setup.activateError', "AI Agent'ni ishga tushirishda xato"),
      )
      setActivating(false)
    }
  }

  const GOALS: Array<{ id: AgentGoal; icon: typeof Target; title: string; sub: string }> = [
    {
      id: 'sales',
      icon: Target,
      title: t('agent.setup.goalSales', 'Sotuv'),
      sub: t('agent.setup.goalSalesSub', 'Konversiya va daromad'),
    },
    {
      id: 'brand',
      icon: Megaphone,
      title: t('agent.setup.goalBrand', 'Brend tanitish'),
      sub: t('agent.setup.goalBrandSub', 'Reach va yangi auditoriya'),
    },
  ]

  const PRESETS = [1000, 2000, 3000]

  const STEP_LABELS: Record<string, string> = {
    scan: t('agent.analyze.scan', 'Sayt kontenti skanerlanmoqda va brend identifikatsiyasi aniqlanmoqda…'),
    audience: t('agent.analyze.audience', 'Maqsadli auditoriya va platforma trendlari tahlil qilinmoqda…'),
    strategy: t('agent.analyze.strategy', 'Funnel strategiyasi va reklama matni tayyorlanmoqda…'),
  }

  return (
    <div className="overflow-hidden rounded-3xl border border-brand-lime/25 bg-gradient-to-br from-brand-ink/[0.03] to-brand-lime/[0.06] shadow-sm dark:from-white/[0.02] dark:to-brand-lime/[0.04]">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 border-b border-brand-lime/20 px-6 py-4">
        <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-brand-lime/20 text-brand-mid dark:text-brand-lime">
          <Bot className="h-5 w-5" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-text-primary">
              {t('agent.setup.title', 'AI Marketing Agent')}
            </h2>
            <span className="inline-flex items-center gap-1 rounded-full border border-brand-lime/30 bg-brand-lime/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-brand-mid dark:text-brand-lime">
              <Sparkles className="h-2.5 w-2.5" aria-hidden />
              {t('agent.setup.badge', 'Autonomous')}
            </span>
          </div>
          <p className="text-xs text-text-secondary">
            {t('agent.setup.subtitle', '3 ta qadam — havola, maqsad, byudjet. Qolganini Agent bajaradi.')}
          </p>
        </div>
      </div>

      {/* ── Phase: analyzing ───────────────────────────────────────────────── */}
      {phase === 'analyzing' && (
        <div className="p-6">
          <AnalyzeSequence stepLabels={STEP_LABELS} activeIndex={analyzeStep} />
        </div>
      )}

      {/* ── Phase: result ──────────────────────────────────────────────────── */}
      {phase === 'result' && (
        <div className="space-y-4 p-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-medium text-text-primary">
              <Check className="mr-1 inline h-4 w-4 text-emerald-500" aria-hidden />
              {t('agent.result.ready', 'Strategiya tayyor')} ·{' '}
              <span className="text-text-secondary">
                {goal === 'sales'
                  ? t('agent.setup.goalSales', 'Sotuv')
                  : t('agent.setup.goalBrand', 'Brend tanitish')}{' '}
                · {usd(budget)}
              </span>
            </p>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <BudgetVisualizer allocation={allocation} />
            <AdCopyPreview vertical={vertical} />
          </div>

          {error && (
            <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-600 ring-1 ring-inset ring-red-200 dark:bg-red-500/10">
              {error}
            </p>
          )}

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setPhase('input')}
              disabled={activating}
              className="inline-flex items-center gap-1.5 rounded-full border border-border px-4 py-2.5 text-sm font-semibold text-text-secondary transition-colors hover:bg-surface-2/50 disabled:opacity-50"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden />
              {t('agent.result.adjust', 'O‘zgartirish')}
            </button>
            <button
              type="button"
              onClick={() => void activate()}
              disabled={activating}
              className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-full bg-[#1b2e06] text-base font-semibold text-white shadow-[0_8px_24px_-12px_rgba(27,46,6,0.5)] transition-all hover:bg-[#243a12] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {activating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                  {t('agent.setup.activating', 'Agent ishga tushmoqda…')}
                </>
              ) : (
                <>
                  <Bot className="h-4 w-4" aria-hidden />
                  {t('agent.result.activate', 'AI Agentni faollashtirish')}
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* ── Phase: input ───────────────────────────────────────────────────── */}
      {phase === 'input' && (
        <div className="grid gap-6 p-6 lg:grid-cols-2">
          {/* Inputs */}
          <div className="space-y-5">
            {/* 1. Link */}
            <div>
              <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-text-tertiary">
                <Link2 className="h-3.5 w-3.5" aria-hidden />
                {t('agent.setup.linkLabel', '1. Sayt yoki kanal havolasi')}
              </label>
              <Input
                value={link}
                onChange={(e) => setLink(e.target.value)}
                placeholder="https://example.uz  ·  t.me/kanal"
                className="rounded-xl"
                inputMode="url"
              />
            </div>

            {/* 2. Goal */}
            <div>
              <p className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-text-tertiary">
                <Target className="h-3.5 w-3.5" aria-hidden />
                {t('agent.setup.goalLabel', '2. Maqsad')}
              </p>
              <div className="grid grid-cols-2 gap-2">
                {GOALS.map((g) => {
                  const Icon = g.icon
                  const selected = goal === g.id
                  return (
                    <button
                      key={g.id}
                      type="button"
                      onClick={() => setGoal(g.id)}
                      className={cn(
                        'flex flex-col items-start gap-1 rounded-xl border p-3 text-left transition-all',
                        selected
                          ? 'border-brand-lime bg-brand-lime/10 ring-1 ring-brand-lime/40'
                          : 'border-border bg-surface hover:border-brand-lime/40',
                      )}
                    >
                      <Icon
                        className={cn('h-4 w-4', selected ? 'text-brand-mid dark:text-brand-lime' : 'text-text-tertiary')}
                        aria-hidden
                      />
                      <span className="text-sm font-semibold text-text-primary">{g.title}</span>
                      <span className="text-[11px] text-text-tertiary">{g.sub}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* 3. Budget */}
            <div>
              <p className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-text-tertiary">
                <TrendingUp className="h-3.5 w-3.5" aria-hidden />
                {t('agent.setup.budgetLabel', '3. Umumiy byudjet')}
              </p>
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-text-tertiary">
                    $
                  </span>
                  <Input
                    type="number"
                    min={100}
                    step={100}
                    value={String(budget)}
                    onChange={(e) => setBudget(Math.max(0, Number(e.target.value) || 0))}
                    className="rounded-xl pl-6"
                  />
                </div>
                <div className="flex gap-1">
                  {PRESETS.map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setBudget(p)}
                      className={cn(
                        'rounded-lg border px-2.5 py-2 text-xs font-semibold transition-colors',
                        budget === p
                          ? 'border-brand-lime bg-brand-lime/10 text-brand-mid dark:text-brand-lime'
                          : 'border-border text-text-secondary hover:border-brand-lime/40',
                      )}
                    >
                      ${p / 1000}k
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Guardrail info */}
            <div className="flex items-start gap-2 rounded-xl border border-amber-500/25 bg-amber-500/[0.06] p-3">
              <Shield className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" aria-hidden />
              <p className="text-xs text-text-secondary">
                <span className="font-semibold text-text-primary">
                  {t('agent.setup.guardrailTitle', 'Hard Stop-Loss')}
                </span>{' '}
                — {t(
                  'agent.setup.guardrailBody',
                  "reklama {amount} sarflab konversiya bermasa, Agent uni avtomatik to'xtatadi.",
                ).replace('{amount}', usd(STOP_LOSS_DEFAULT_USD))}
              </p>
            </div>

            <button
              type="button"
              onClick={startAnalysis}
              disabled={!canAnalyze}
              className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-[#1b2e06] text-base font-semibold text-white shadow-[0_8px_24px_-12px_rgba(27,46,6,0.5)] transition-all hover:bg-[#243a12] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Sparkles className="h-4 w-4" aria-hidden />
              {t('agent.setup.analyze', 'Tahlil qilish & Taqsimlash')}
            </button>
          </div>

          {/* Live mini preview */}
          <div className="rounded-2xl border border-border bg-surface/60 p-4">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wide text-text-tertiary">
                {t('agent.setup.livePreview', 'Jonli ko‘rinish')}
              </p>
              <span className="text-xs font-bold text-text-primary">{usd(budget)}</span>
            </div>
            <BudgetBars allocation={allocation} />
            <div className="mt-3 space-y-1.5">
              {allocation.stages.map((s) => (
                <div key={s.stage} className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1.5 font-medium text-text-primary">
                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: s.colorHex }} />
                    {s.stage}
                    <span className="font-normal text-text-tertiary">
                      {s.channels.map((c) => t(`agent.channel.${c.channel}`, c.label)).join(' · ')}
                    </span>
                  </span>
                  <span className="tabular-nums text-text-secondary">
                    {usd(s.amount)} · {s.pct}%
                  </span>
                </div>
              ))}
            </div>
            <p className="mt-3 text-[11px] text-text-tertiary">
              {t('agent.setup.livePreviewHint', '“Tahlil qilish”ni bosing — to‘liq strategiya va reklama matnini ko‘rasiz.')}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

/** The staged "AI Agent is analyzing…" panel. */
function AnalyzeSequence({
  stepLabels,
  activeIndex,
}: {
  stepLabels: Record<string, string>
  activeIndex: number
}) {
  const { t } = useI18n()
  const progress = Math.round(((activeIndex + 1) / ANALYZE_STEPS.length) * 100)

  return (
    <div className="flex min-h-[240px] flex-col justify-center gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="relative inline-flex h-9 w-9 items-center justify-center rounded-2xl bg-brand-lime/20 text-brand-mid dark:text-brand-lime">
            <Bot className="h-4 w-4" aria-hidden />
            <span className="absolute inset-0 animate-ping rounded-2xl bg-brand-lime/20" />
          </span>
          <p className="text-sm font-semibold text-text-primary">
            {t('agent.analyze.title', 'AI Agent tahlil qilmoqda…')}
          </p>
        </div>
        <span className="text-xs font-bold tabular-nums text-text-secondary">{progress}%</span>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 overflow-hidden rounded-full bg-surface-2/60">
        <div
          className="h-full rounded-full bg-brand-lime transition-all duration-500 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="space-y-2.5">
        {ANALYZE_STEPS.map((step, i) => {
          const done = i < activeIndex
          const current = i === activeIndex
          return (
            <div
              key={step.key}
              className={cn(
                'flex items-center gap-3 rounded-xl border px-3 py-2.5 transition-all duration-300',
                current
                  ? 'border-brand-lime/40 bg-brand-lime/[0.08]'
                  : done
                    ? 'border-border bg-surface-2/40'
                    : 'border-transparent opacity-40',
              )}
            >
              <span
                className={cn(
                  'inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full',
                  done
                    ? 'bg-emerald-500 text-white'
                    : current
                      ? 'bg-brand-lime/20 text-brand-mid dark:text-brand-lime'
                      : 'bg-surface-2/60 text-text-tertiary',
                )}
              >
                {done ? (
                  <Check className="h-3.5 w-3.5" aria-hidden />
                ) : current ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
                ) : (
                  <span className="text-[11px] font-semibold">{i + 1}</span>
                )}
              </span>
              <span
                className={cn(
                  'text-sm',
                  current ? 'font-medium text-text-primary' : 'text-text-secondary',
                )}
              >
                {stepLabels[step.key]}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default AgentSetupCard
