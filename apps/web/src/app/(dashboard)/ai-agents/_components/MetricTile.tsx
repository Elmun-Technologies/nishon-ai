import { type LucideIcon, TrendingDown, TrendingUp } from 'lucide-react'
import { cn } from '@/lib/utils'

export function MetricTile({
  label,
  value,
  delta,
  deltaDirection,
  icon: Icon,
  accent = '#65a30d',
}: {
  label: string
  value: string
  delta?: string
  deltaDirection?: 'up' | 'down' | 'neutral'
  icon?: LucideIcon
  accent?: string
}) {
  const deltaUp = deltaDirection === 'up'
  return (
    <div className="rounded-2xl border border-border bg-surface-1 p-4 dark:bg-surface-elevated/30">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium uppercase tracking-wide text-text-tertiary">
          {label}
        </p>
        {Icon && (
          <span
            className="flex h-7 w-7 items-center justify-center rounded-lg"
            style={{ background: `${accent}1a`, color: accent }}
          >
            <Icon className="h-3.5 w-3.5" aria-hidden />
          </span>
        )}
      </div>
      <p className="mt-2 text-2xl font-bold tabular-nums tracking-tight text-text-primary">
        {value}
      </p>
      {delta && (
        <p
          className={cn(
            'mt-1 inline-flex items-center gap-1 text-xs font-medium',
            deltaUp
              ? 'text-emerald-600 dark:text-emerald-400'
              : deltaDirection === 'down'
                ? 'text-rose-600 dark:text-rose-400'
                : 'text-text-tertiary',
          )}
        >
          {deltaUp && <TrendingUp className="h-3 w-3" aria-hidden />}
          {deltaDirection === 'down' && <TrendingDown className="h-3 w-3" aria-hidden />}
          {delta}
        </p>
      )}
    </div>
  )
}
