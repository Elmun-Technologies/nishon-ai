'use client'

import { useMemo } from 'react'
import { Bot, Shield, Target, Wallet } from 'lucide-react'
import { Button } from '@/components/ui'
import { useI18n } from '@/i18n/use-i18n'
import {
  allocateFunnelBudget,
  CHANNEL_HEX,
  type Channel,
} from '@/lib/funnel-allocator'
import type { AgentConfig } from '@/lib/agent-config'
import { BudgetBars } from './BudgetVisualizer'

function usd(n: number): string {
  return `$${Math.round(n).toLocaleString('en-US')}`
}

/**
 * Post-activation plan summary shown on the dashboard. Replaces the thin
 * one-line "agent active" banner with the actual plan the backend now enforces:
 * goal, monthly budget, stop-loss guardrail, and the funnel/channel split.
 *
 * The allocation is recomputed from the persisted goal + budget (same pure
 * allocator the backend uses), so what the user sees matches what the engine
 * paces against.
 */
export function AgentPlanSummary({
  config,
  onReconfigure,
}: {
  config: AgentConfig
  onReconfigure?: () => void
}) {
  const { t } = useI18n()

  const allocation = useMemo(
    () => allocateFunnelBudget({ goal: config.goal, totalBudget: config.budget }),
    [config.goal, config.budget],
  )

  const goalLabel =
    config.goal === 'brand'
      ? t('agent.setup.goalBrand', 'Brend tanitish')
      : t('agent.setup.goalSales', 'Sotuv')

  const topChannels = [...allocation.byChannel]
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 4)

  return (
    <div className="rounded-2xl border border-border bg-surface/60 p-4 sm:p-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Bot className="h-5 w-5" />
          </span>
          <div>
            <p className="text-sm font-bold text-text-primary">
              {t('agent.plan.title', 'Agent rejasi')}
            </p>
            <p className="flex items-center gap-1.5 text-xs text-emerald-500">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
              {t('agent.active.banner', 'AI Agent faol — kampaniyalar avtomatik boshqarilmoqda.')}
            </p>
          </div>
        </div>
        {onReconfigure && (
          <Button variant="ghost" size="sm" onClick={onReconfigure}>
            {t('agent.active.reconfigure', 'Qayta sozlash')}
          </Button>
        )}
      </div>

      {/* Stat chips */}
      <div className="mt-4 grid grid-cols-1 gap-2.5 sm:grid-cols-3">
        <PlanStat
          icon={<Wallet className="h-4 w-4" />}
          label={t('agent.plan.budgetLabel', 'Oylik byudjet')}
          value={usd(config.budget)}
        />
        <PlanStat
          icon={<Target className="h-4 w-4" />}
          label={t('agent.setup.goalLabel', 'Maqsad').replace(/^\d+\.\s*/, '')}
          value={goalLabel}
        />
        <PlanStat
          icon={<Shield className="h-4 w-4" />}
          label={t('agent.plan.stopLossLabel', 'Stop-loss himoyasi')}
          value={usd(config.stopLossUsd)}
        />
      </div>

      {/* Funnel split bar */}
      <div className="mt-4">
        <div className="mb-1.5 flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wide text-text-tertiary">
            {t('agent.setup.planTitle', 'Byudjet taqsimoti')}
          </span>
          <span className="text-xs font-bold text-text-primary">
            {usd(allocation.totalBudget)}
          </span>
        </div>
        <BudgetBars allocation={allocation} />
        <div className="mt-3 flex flex-wrap gap-1.5">
          {topChannels.map((ch) => (
            <span
              key={ch.channel}
              className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-2 py-0.5 text-[11px] font-medium text-text-secondary"
            >
              <span
                className="h-1.5 w-1.5 rounded-full"
                style={{ backgroundColor: CHANNEL_HEX[ch.channel as Channel] }}
              />
              {t(`agent.channel.${ch.channel}`, ch.label)}
              <span className="tabular-nums text-text-tertiary">{ch.pct}%</span>
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}

function PlanStat({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode
  label: string
  value: string
}) {
  return (
    <div className="flex items-center gap-2.5 rounded-xl bg-surface-2/40 px-3 py-2.5">
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-surface text-text-tertiary">
        {icon}
      </span>
      <div className="min-w-0">
        <p className="truncate text-[11px] text-text-tertiary">{label}</p>
        <p className="truncate text-sm font-bold text-text-primary">{value}</p>
      </div>
    </div>
  )
}

export default AgentPlanSummary
