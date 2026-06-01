'use client'

import { Check, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  ACTION_LABELS,
  formatRelativeTime,
  type AgentRecommendation,
} from '../_lib/mock-data'

export function RecommendationCard({
  rec,
  onApprove,
  onReject,
  compact = false,
}: {
  rec: AgentRecommendation
  onApprove?: (id: string) => void
  onReject?: (id: string) => void
  compact?: boolean
}) {
  const action = ACTION_LABELS[rec.action]
  const pending = rec.approvalStatus === 'pending'
  const autoApproved = rec.approvalStatus === 'auto_approved'
  const confidence = Math.round(rec.confidence * 100)

  return (
    <div
      className={cn(
        'group relative rounded-2xl border border-border bg-surface-1 transition-all',
        'hover:border-text-tertiary/40 hover:shadow-sm',
        compact ? 'p-3' : 'p-4',
      )}
    >
      <div className="flex items-start gap-3">
        <span
          className={cn(
            'flex shrink-0 items-center justify-center rounded-lg',
            compact ? 'h-8 w-8 text-sm' : 'h-10 w-10 text-base',
          )}
          style={{ background: `${action.color}1a`, color: action.color }}
        >
          {action.emoji}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <p
              className={cn(
                'font-semibold text-text-primary',
                compact ? 'text-sm' : 'text-base',
              )}
            >
              {rec.title}
            </p>
            <span className="shrink-0 text-[11px] text-text-tertiary">
              {formatRelativeTime(rec.createdAt)}
            </span>
          </div>
          <p
            className={cn(
              'mt-1 text-text-secondary',
              compact ? 'text-xs' : 'text-sm',
            )}
          >
            {rec.rationale}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-text-tertiary">
            <span className="inline-flex items-center gap-1">
              <span className="font-semibold text-text-primary">{rec.agentName}</span>
            </span>
            <span aria-hidden>·</span>
            <span>{rec.campaignName}</span>
            <span aria-hidden>·</span>
            <span
              className={cn(
                'inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 font-semibold',
                confidence >= 90
                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300'
                  : confidence >= 75
                    ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300'
                    : 'bg-slate-100 text-slate-600 dark:bg-slate-500/15 dark:text-slate-300',
              )}
            >
              {confidence}% ishonch
            </span>
            <span aria-hidden>·</span>
            <span className="font-semibold text-emerald-600 dark:text-emerald-400">
              ≈ +${rec.estimatedImpactUsd}
            </span>
          </div>
        </div>
      </div>

      {pending && (onApprove || onReject) && (
        <div className="mt-3 flex gap-2 border-t border-border pt-3">
          <button
            type="button"
            onClick={() => onApprove?.(rec.id)}
            className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-[#1b2e06] py-2 text-sm font-semibold text-white transition-all hover:bg-[#243a12] active:scale-[0.98]"
          >
            <Check className="h-3.5 w-3.5" aria-hidden />
            Tasdiqlash
          </button>
          <button
            type="button"
            onClick={() => onReject?.(rec.id)}
            className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-border bg-surface px-4 py-2 text-sm font-medium text-text-secondary transition-colors hover:bg-surface-2 hover:text-text-primary"
          >
            <X className="h-3.5 w-3.5" aria-hidden />
            Rad etish
          </button>
        </div>
      )}

      {autoApproved && (
        <p className="mt-2 inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
          <Check className="h-3 w-3" aria-hidden />
          Avtomatik tasdiq (yuqori ishonch)
        </p>
      )}
    </div>
  )
}
