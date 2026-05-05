'use client'

import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { StepId } from '../_lib/types'

type Step = {
  id: StepId
  label: string
  hint: string
}

export function StepIndicator({
  steps,
  current,
  onJump,
  isStepEnabled,
}: {
  steps: Step[]
  current: StepId
  onJump?: (step: StepId) => void
  isStepEnabled?: (step: StepId) => boolean
}) {
  const currentIdx = steps.findIndex((s) => s.id === current)

  return (
    <ol className="flex w-full items-center gap-0">
      {steps.map((s, i) => {
        const done = i < currentIdx
        const active = i === currentIdx
        const enabled = isStepEnabled ? isStepEnabled(s.id) : true
        const clickable = onJump && enabled
        return (
          <li key={s.id} className="flex flex-1 items-center">
            <button
              type="button"
              disabled={!clickable}
              onClick={() => clickable && onJump?.(s.id)}
              className={cn(
                'group flex flex-1 items-center gap-3 rounded-xl p-2 text-left transition-colors',
                clickable && !active ? 'hover:bg-surface-2' : '',
                !clickable ? 'cursor-default' : '',
              )}
            >
              <span
                className={cn(
                  'flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-xs font-semibold transition-colors',
                  done && 'border-primary bg-primary text-brand-ink',
                  active && 'border-primary bg-primary/10 text-primary',
                  !done && !active && 'border-border bg-surface text-text-tertiary',
                )}
              >
                {done ? <Check className="h-4 w-4" /> : i + 1}
              </span>
              <span className="min-w-0">
                <span
                  className={cn(
                    'block truncate text-sm font-semibold',
                    active ? 'text-text-primary' : done ? 'text-text-secondary' : 'text-text-tertiary',
                  )}
                >
                  {s.label}
                </span>
                <span className="block truncate text-xs text-text-tertiary">{s.hint}</span>
              </span>
            </button>
            {i < steps.length - 1 && (
              <span
                className={cn(
                  'mx-1 h-px flex-1 transition-colors',
                  i < currentIdx ? 'bg-primary' : 'bg-border',
                )}
                aria-hidden
              />
            )}
          </li>
        )
      })}
    </ol>
  )
}
