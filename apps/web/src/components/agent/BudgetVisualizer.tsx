'use client'

import nextDynamic from 'next/dynamic'
import { useI18n } from '@/i18n/use-i18n'
import { cn } from '@/lib/utils'
import {
  CHANNEL_HEX,
  type Channel,
  type FunnelAllocation,
} from '@/lib/funnel-allocator'

// Donut code-splits recharts out of the main bundle; only loads on preview.
const AllocationDonut = nextDynamic(() => import('./AllocationDonut'), {
  ssr: false,
  loading: () => <div className="h-[200px] w-full animate-pulse rounded-2xl bg-surface-2/40" />,
})

function usd(n: number): string {
  return `$${Math.round(n).toLocaleString('en-US')}`
}

/**
 * Interactive budget breakdown across the marketing funnel — a donut of the
 * three stages (TOFU/MOFU/BOFU) plus per-stage rows listing the goal-specific
 * channels and their spend.
 */
export function BudgetVisualizer({ allocation }: { allocation: FunnelAllocation }) {
  const { t } = useI18n()

  const segments = allocation.stages.map((s) => ({
    key: s.stage,
    label: s.stage,
    amount: s.amount,
    pct: s.pct,
    colorHex: s.colorHex,
  }))

  return (
    <div className="rounded-2xl border border-border bg-surface/60 p-4">
      <div className="mb-2 flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wide text-text-tertiary">
          {t('agent.setup.planTitle', 'Byudjet taqsimoti')}
        </p>
        <span className="text-xs font-bold text-text-primary">{usd(allocation.totalBudget)}</span>
      </div>

      <AllocationDonut
        segments={segments}
        total={allocation.totalBudget}
        totalLabel={t('agent.setup.total', 'Jami')}
      />

      {/* Per-stage rows with channel chips */}
      <div className="mt-3 space-y-2.5">
        {allocation.stages.map((stage) => (
          <div key={stage.stage} className="rounded-xl bg-surface-2/40 px-3 py-2.5">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-sm font-semibold text-text-primary">
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: stage.colorHex }}
                />
                {stage.stage}
                <span className="text-[11px] font-normal text-text-tertiary">
                  {t(`agent.setup.stage.${stage.stage}`, stage.label.long)}
                </span>
              </span>
              <span className="tabular-nums text-sm text-text-secondary">
                {usd(stage.amount)} · {stage.pct}%
              </span>
            </div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {stage.channels.map((ch) => (
                <span
                  key={ch.channel}
                  className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-2 py-0.5 text-[11px] font-medium text-text-secondary"
                >
                  <span
                    className="h-1.5 w-1.5 rounded-full"
                    style={{ backgroundColor: CHANNEL_HEX[ch.channel as Channel] }}
                  />
                  {t(`agent.channel.${ch.channel}`, ch.label)}
                  <span className="tabular-nums text-text-tertiary">{usd(ch.amount)}</span>
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

/** Compact static bar (no recharts) for the input-state live preview. */
export function BudgetBars({ allocation }: { allocation: FunnelAllocation }) {
  return (
    <div className={cn('flex h-2.5 overflow-hidden rounded-full bg-surface-2/60')}>
      {allocation.stages
        .filter((s) => s.amount > 0)
        .map((s) => (
          <div
            key={s.stage}
            className="h-full"
            style={{
              width: `${s.pct}%`,
              backgroundColor: s.colorHex,
            }}
            title={`${s.stage}: $${s.amount} (${s.pct}%)`}
          />
        ))}
    </div>
  )
}

export default BudgetVisualizer
