'use client'

import { cn } from '@/lib/utils'

const STEPS = ['Preview', 'Tasdiq', 'Ishga tushdi'] as const

export function LaunchFlowProgress({ step }: { step: 0 | 1 | 2 }) {
  return (
    <div className="mb-8">
      <div className="flex items-center justify-between gap-2 text-xs font-medium text-text-tertiary">
        {STEPS.map((label, i) => (
          <div key={label} className="flex flex-1 flex-col items-center gap-2">
            <div
              className={cn(
                'flex h-9 w-9 items-center justify-center rounded-full border-2 text-sm font-bold',
                i < step
                  ? 'border-emerald-500 bg-emerald-500 text-white'
                  : i === step
                    ? 'border-brand-mid bg-brand-mid/15 text-brand-ink dark:border-brand-lime dark:bg-brand-lime/10 dark:text-brand-lime'
                    : 'border-border bg-surface-2 text-text-tertiary',
              )}
            >
              {i < step ? '✓' : i + 1}
            </div>
            <span className={cn('text-center', i === step && 'text-text-primary')}>{label}</span>
          </div>
        ))}
      </div>
      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-surface-2">
        <div
          className="h-full rounded-full bg-gradient-to-r from-brand-mid to-brand-lime transition-all"
          style={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
        />
      </div>
    </div>
  )
}
