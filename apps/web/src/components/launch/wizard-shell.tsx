'use client'

import * as React from 'react'
import { CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'

export function WizardProgressBar({ step, total }: { step: number; total: number }) {
  const pct = Math.min(100, Math.max(0, (step / total) * 100))
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-border/40 dark:bg-border/25">
      <div
        className="h-full rounded-full bg-gradient-to-r from-brand-mid to-brand-lime transition-[width] duration-300 ease-out"
        style={{ width: `${pct}%` }}
        role="progressbar"
        aria-valuenow={step}
        aria-valuemin={1}
        aria-valuemax={total}
      />
    </div>
  )
}

export function WizardStepCard({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        'rounded-2xl border border-border bg-surface shadow-sm dark:shadow-none dark:bg-surface-elevated/40',
        'ring-1 ring-black/[0.03] dark:ring-white/[0.04]',
        className,
      )}
    >
      {children}
    </div>
  )
}

export function WizardAsideHint({ children }: { children: React.ReactNode }) {
  return (
    <aside className="hidden rounded-2xl border border-dashed border-border/80 bg-surface-2/40 p-5 text-sm leading-relaxed text-text-secondary lg:block">
      {children}
    </aside>
  )
}

type ChoiceTone = 'default' | 'meta'

export function WizardChoiceRow({
  selected,
  onClick,
  icon,
  title,
  description,
  tone = 'default',
}: {
  selected: boolean
  onClick: () => void
  icon: React.ReactNode
  title: string
  description?: string
  tone?: ChoiceTone
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex w-full gap-4 rounded-xl border px-4 py-3.5 text-left transition-all',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/25 focus-visible:ring-offset-2 focus-visible:ring-offset-surface',
        selected
          ? tone === 'meta'
            ? 'border-[#0866FF]/50 bg-[#0866FF]/[0.06] shadow-sm ring-1 ring-[#0866FF]/20 dark:border-[#0866FF]/40 dark:bg-[#0866FF]/10'
            : 'border-brand-mid/50 bg-brand-mid/[0.06] shadow-sm ring-1 ring-brand-mid/20 dark:border-brand-lime/40 dark:bg-brand-lime/10'
          : 'border-border bg-white/90 hover:border-text-tertiary/40 hover:bg-surface-2/80 dark:bg-surface-elevated/50 dark:hover:bg-surface-elevated',
      )}
    >
      <span
        className={cn(
          'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border text-text-primary',
          selected
            ? tone === 'meta'
              ? 'border-[#0866FF]/30 bg-white dark:bg-surface-elevated'
              : 'border-brand-mid/25 bg-white dark:bg-surface-elevated'
            : 'border-border bg-surface-2/80 dark:bg-surface-2',
        )}
      >
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="font-semibold text-text-primary">{title}</span>
        {description ? <span className="mt-1 block text-sm text-text-secondary">{description}</span> : null}
      </span>
      {selected ? (
        <CheckCircle2
          className={cn(
            'h-5 w-5 shrink-0',
            tone === 'meta' ? 'text-[#0866FF]' : 'text-brand-mid dark:text-brand-lime',
          )}
          aria-hidden
        />
      ) : (
        <span className="h-5 w-5 shrink-0 rounded-full border-2 border-border bg-transparent" aria-hidden />
      )}
    </button>
  )
}
