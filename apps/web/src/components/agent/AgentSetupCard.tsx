'use client'

import { useMemo, useState } from 'react'
import { Bot, Link2, Loader2, Megaphone, Shield, Sparkles, Target, TrendingUp } from 'lucide-react'
import { Input } from '@/components/ui'
import { useI18n } from '@/i18n/use-i18n'
import { cn } from '@/lib/utils'
import { aiAgent } from '@/lib/api-client'
import {
  allocateFunnelBudget,
  PLATFORM_LABELS,
  type AdPlatform,
  type AgentGoal,
} from '@/lib/funnel-allocator'

/**
 * The autonomous agent's ultra-fast setup surface — the dashboard hero.
 *
 * Three inputs only:
 *   1. Website / channel link
 *   2. Business goal  (Sales  vs  Brand awareness)
 *   3. Total budget
 *
 * From these, the Budget Allocator maps spend across the marketing funnel
 * (TOFU / MOFU / BOFU) and across Meta / Google / TikTok / Telegram, live.
 *
 * "Activate" persists the config locally and kicks the real AI optimization
 * loop (`aiAgent.optimize`) — it does NOT fabricate a launch, and it never
 * creates a duplicate workspace.
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
    return raw ? (JSON.parse(raw) as AgentConfig) : null
  } catch {
    return null
  }
}

const PLATFORM_ACCENT: Record<AdPlatform, string> = {
  meta: 'bg-blue-500',
  google: 'bg-red-500',
  tiktok: 'bg-fuchsia-500',
  telegram: 'bg-sky-500',
}

function usd(n: number): string {
  return `$${Math.round(n).toLocaleString('en-US')}`
}

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

  const [link, setLink] = useState(defaultLink)
  const [goal, setGoal] = useState<AgentGoal>('sales')
  const [budget, setBudget] = useState(1000)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const allocation = useMemo(
    () => allocateFunnelBudget({ goal, totalBudget: budget }),
    [goal, budget],
  )

  const canActivate = link.trim().length > 3 && budget >= 100 && !submitting

  async function handleActivate() {
    if (!canActivate) return
    setSubmitting(true)
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
        // Persist the plan client-side so the dashboard can show "agent active".
        try {
          window.localStorage.setItem(configKey(workspaceId), JSON.stringify(config))
        } catch {
          /* ignore quota / private-mode errors */
        }
        // Kick the real autonomous optimization loop.
        await aiAgent.optimize(workspaceId)
      }
      onActivated?.(config)
    } catch (e: unknown) {
      setError(
        e instanceof Error
          ? e.message
          : t('agent.setup.activateError', "AI Agent'ni ishga tushirishda xato"),
      )
    } finally {
      setSubmitting(false)
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
      id: 'awareness',
      icon: Megaphone,
      title: t('agent.setup.goalAwareness', 'Brend tanitish'),
      sub: t('agent.setup.goalAwarenessSub', 'Reach va yangi auditoriya'),
    },
  ]

  const PRESETS = [1000, 2000, 3000]

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

      <div className="grid gap-6 p-6 lg:grid-cols-2">
        {/* ── Inputs ───────────────────────────────────────────────────────── */}
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

          {/* Guardrail info — Hard Stop-Loss */}
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

          {error && (
            <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-600 ring-1 ring-inset ring-red-200 dark:bg-red-500/10">
              {error}
            </p>
          )}

          <button
            type="button"
            onClick={() => void handleActivate()}
            disabled={!canActivate}
            className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-[#1b2e06] text-base font-semibold text-white shadow-[0_8px_24px_-12px_rgba(27,46,6,0.5)] transition-all hover:bg-[#243a12] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                {t('agent.setup.activating', 'Agent ishga tushmoqda…')}
              </>
            ) : (
              <>
                <Bot className="h-4 w-4" aria-hidden />
                {t('agent.setup.activate', 'AI Agentni ishga tushirish')}
              </>
            )}
          </button>
        </div>

        {/* ── Live funnel allocation preview ───────────────────────────────── */}
        <div className="rounded-2xl border border-border bg-surface/60 p-4">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wide text-text-tertiary">
              {t('agent.setup.planTitle', 'Byudjet taqsimoti (jonli)')}
            </p>
            <span className="text-xs font-bold text-text-primary">{usd(budget)}</span>
          </div>

          {/* Funnel stages */}
          <div className="space-y-2.5">
            {allocation.stages.map((stage) => (
              <div key={stage.stage}>
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-text-primary">
                    {stage.stage}
                    <span className="ml-1.5 font-normal text-text-tertiary">
                      {t(`agent.setup.stage.${stage.stage}`, stage.label.long)}
                    </span>
                  </span>
                  <span className="tabular-nums text-text-secondary">
                    {usd(stage.amount)} · {stage.pct}%
                  </span>
                </div>
                <div className="mt-1 flex h-2 overflow-hidden rounded-full bg-surface-2/60">
                  {stage.platforms
                    .filter((p) => p.amount > 0)
                    .map((p) => (
                      <div
                        key={p.platform}
                        className={cn('h-full', PLATFORM_ACCENT[p.platform])}
                        style={{ width: `${(p.amount / Math.max(stage.amount, 1)) * 100}%` }}
                        title={`${PLATFORM_LABELS[p.platform]}: ${usd(p.amount)}`}
                      />
                    ))}
                </div>
              </div>
            ))}
          </div>

          {/* Per-platform totals */}
          <div className="mt-4 border-t border-border pt-3">
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-text-tertiary">
              {t('agent.setup.byPlatform', 'Platformalar bo\'yicha')}
            </p>
            <div className="grid grid-cols-2 gap-2">
              {allocation.byPlatform.map((p) => (
                <div
                  key={p.platform}
                  className="flex items-center justify-between rounded-lg bg-surface-2/40 px-2.5 py-1.5"
                >
                  <span className="flex items-center gap-1.5 text-xs font-medium text-text-primary">
                    <span className={cn('h-2 w-2 rounded-full', PLATFORM_ACCENT[p.platform])} />
                    {p.label}
                  </span>
                  <span className="tabular-nums text-xs text-text-secondary">{usd(p.amount)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AgentSetupCard
