import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface ProgressStep {
  id: number
  label: string
}

export function ProgressRibbon({
  steps,
  current,
  onJump,
  isStepReachable,
}: {
  steps: ProgressStep[]
  current: number
  onJump?: (id: number) => void
  isStepReachable?: (id: number) => boolean
}) {
  return (
    <ol className="flex flex-wrap items-center gap-1.5" aria-label="Wizard progress">
      {steps.map((s, idx) => {
        const isDone = s.id < current
        const isCurrent = s.id === current
        const reachable = isStepReachable ? isStepReachable(s.id) : isDone || isCurrent
        return (
          <li key={s.id} className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => reachable && onJump?.(s.id)}
              disabled={!reachable}
              aria-current={isCurrent ? 'step' : undefined}
              className={cn(
                'group flex items-center gap-2 rounded-full border px-2.5 py-1.5 text-xs font-medium transition-all',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/25',
                isCurrent
                  ? 'border-primary/50 bg-primary/10 text-text-primary'
                  : isDone
                    ? 'border-brand-mid/30 bg-brand-mid/[0.06] text-brand-mid dark:border-brand-lime/30 dark:bg-brand-lime/[0.06] dark:text-brand-lime'
                    : 'border-border bg-transparent text-text-tertiary',
                reachable ? 'cursor-pointer hover:border-primary/40' : 'cursor-not-allowed',
              )}
            >
              <span
                className={cn(
                  'flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold',
                  isCurrent
                    ? 'bg-primary text-white'
                    : isDone
                      ? 'bg-brand-mid text-white dark:bg-brand-lime dark:text-bg'
                      : 'bg-surface-2 text-text-tertiary',
                )}
              >
                {isDone ? <Check className="h-3 w-3" aria-hidden /> : s.id}
              </span>
              <span className="hidden whitespace-nowrap sm:inline">{s.label}</span>
            </button>
            {idx < steps.length - 1 && (
              <span className="hidden h-px w-4 bg-border md:inline-block" aria-hidden />
            )}
          </li>
        )
      })}
    </ol>
  )
}
