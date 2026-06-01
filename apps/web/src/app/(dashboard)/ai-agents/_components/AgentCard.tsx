import Link from 'next/link'
import { ArrowRight, Settings, TrendingUp, Zap } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  VERTICAL_LABELS_AGENTS,
  type MyAgent,
  type StoreAgent,
} from '../_lib/mock-data'
import { AgentAvatar } from './AgentAvatar'
import { StatusBadge } from './StatusBadge'

export function MyAgentCard({ agent }: { agent: MyAgent }) {
  const approvalRate = agent.recommendationsCount > 0
    ? Math.round((agent.approvedCount / agent.recommendationsCount) * 100)
    : 0

  return (
    <Link
      href={`/ai-agents/runtime?agent=${agent.id}`}
      className="group block rounded-2xl border border-border bg-surface p-5 transition-all hover:border-text-tertiary/40 hover:shadow-sm"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <AgentAvatar
            emoji={agent.emoji}
            accent={agent.accent}
            size="lg"
            pulse={agent.status === 'active'}
          />
          <div className="min-w-0">
            <p className="truncate text-base font-bold text-text-primary">
              {agent.name}
            </p>
            <p className="mt-0.5 text-xs text-text-tertiary">
              {VERTICAL_LABELS_AGENTS[agent.vertical]} ·{' '}
              {agent.source === 'platform'
                ? 'Platforma'
                : agent.source === 'rented'
                  ? `Ijara — $${agent.monthlyCostUsd}/oy`
                  : 'O\'z agentim'}
            </p>
          </div>
        </div>
        <StatusBadge status={agent.status} />
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2">
        <div className="rounded-xl bg-surface-2/60 p-2.5 dark:bg-surface-elevated/40">
          <p className="text-[10px] font-medium uppercase tracking-wide text-text-tertiary">
            Foyda
          </p>
          <p className="mt-0.5 text-sm font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
            +${agent.impactUsd}
          </p>
        </div>
        <div className="rounded-xl bg-surface-2/60 p-2.5 dark:bg-surface-elevated/40">
          <p className="text-[10px] font-medium uppercase tracking-wide text-text-tertiary">
            Tavsiya
          </p>
          <p className="mt-0.5 text-sm font-bold tabular-nums text-text-primary">
            {agent.recommendationsCount}
          </p>
        </div>
        <div className="rounded-xl bg-surface-2/60 p-2.5 dark:bg-surface-elevated/40">
          <p className="text-[10px] font-medium uppercase tracking-wide text-text-tertiary">
            Tasdiq
          </p>
          <p className="mt-0.5 text-sm font-bold tabular-nums text-text-primary">
            {approvalRate}%
          </p>
        </div>
      </div>

      {agent.recent.filter((r) => r.approvalStatus === 'pending').length > 0 && (
        <div className="mt-3 flex items-center justify-between rounded-xl border border-amber-500/30 bg-amber-500/[0.06] px-3 py-2 dark:border-amber-500/40">
          <span className="text-xs font-medium text-amber-700 dark:text-amber-300">
            ⚠ {agent.recent.filter((r) => r.approvalStatus === 'pending').length} ta tavsiya kutilmoqda
          </span>
          <ArrowRight className="h-3.5 w-3.5 text-amber-700 dark:text-amber-300" aria-hidden />
        </div>
      )}

      {agent.autoApprove && (
        <div className="mt-2 inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400">
          <Zap className="h-3 w-3" aria-hidden />
          Auto-approve yoqilgan
        </div>
      )}
    </Link>
  )
}

export function StoreAgentCard({
  agent,
  onRent,
  loading,
}: {
  agent: StoreAgent
  onRent?: (id: string) => void
  loading?: boolean
}) {
  return (
    <div className="group rounded-2xl border border-border bg-surface p-5 transition-all hover:border-text-tertiary/40 hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <AgentAvatar emoji={agent.emoji} accent={agent.accent} size="lg" />
          <div className="min-w-0">
            <p className="truncate text-base font-bold text-text-primary">
              {agent.name}
            </p>
            <p className="mt-0.5 flex items-center gap-1 text-xs text-text-tertiary">
              <span>{agent.authorAvatar}</span>
              <span className="truncate">{agent.author}</span>
            </p>
          </div>
        </div>
        {agent.status === 'testing' && (
          <span className="shrink-0 rounded-full border border-blue-500/40 bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-700 dark:bg-blue-500/20 dark:text-blue-300">
            Sinov · {agent.testDaysRemaining} kun
          </span>
        )}
      </div>

      <p className="mt-3 line-clamp-2 text-sm text-text-secondary">
        {agent.description}
      </p>

      <div className="mt-3 flex flex-wrap gap-1">
        {agent.tags.map((t) => (
          <span
            key={t}
            className="rounded-full border border-border bg-surface-2/60 px-2 py-0.5 text-[10px] font-medium text-text-secondary"
          >
            {t}
          </span>
        ))}
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2 border-t border-border pt-3">
        <div>
          <p className="text-[10px] font-medium uppercase tracking-wide text-text-tertiary">
            Reyting
          </p>
          <p className="mt-0.5 text-sm font-bold text-text-primary">
            ★ {agent.rating.toFixed(1)}
          </p>
          <p className="text-[10px] text-text-tertiary">({agent.reviewsCount} sharh)</p>
        </div>
        <div>
          <p className="text-[10px] font-medium uppercase tracking-wide text-text-tertiary">
            ROAS
          </p>
          <p className="mt-0.5 inline-flex items-center gap-0.5 text-sm font-bold text-emerald-600 dark:text-emerald-400">
            <TrendingUp className="h-3 w-3" aria-hidden />
            {agent.avgRoasMultiplier.toFixed(1)}×
          </p>
          <p className="text-[10px] text-text-tertiary">o'rtacha</p>
        </div>
        <div>
          <p className="text-[10px] font-medium uppercase tracking-wide text-text-tertiary">
            Ijarachilar
          </p>
          <p className="mt-0.5 text-sm font-bold text-text-primary">
            {agent.rentersCount}
          </p>
        </div>
      </div>

      <div className="mt-4 flex items-baseline justify-between border-t border-border pt-3">
        <div>
          <p className="text-lg font-bold tabular-nums text-text-primary">
            {agent.priceMonthlyUsd > 0 ? `$${agent.priceMonthlyUsd}` : 'Bepul'}
            <span className="text-xs font-normal text-text-tertiary">
              {agent.priceMonthlyUsd > 0 && '/oy'}
            </span>
          </p>
          {agent.pricePerActionUsd != null && (
            <p className="text-[11px] text-text-tertiary">
              yoki ${agent.pricePerActionUsd}/action
            </p>
          )}
        </div>
        <button
          type="button"
          disabled={loading}
          onClick={() => onRent?.(agent.id)}
          className={cn(
            'inline-flex items-center gap-1.5 rounded-full bg-[#1b2e06] px-4 py-2 text-sm font-semibold text-white transition-all',
            'hover:bg-[#243a12] active:scale-[0.98] disabled:opacity-50',
          )}
        >
          {loading ? (
            <>
              <Settings className="h-3.5 w-3.5 animate-spin" aria-hidden />
              ...
            </>
          ) : (
            <>
              Ijaraga olish
              <ArrowRight className="h-3.5 w-3.5" aria-hidden />
            </>
          )}
        </button>
      </div>
    </div>
  )
}
