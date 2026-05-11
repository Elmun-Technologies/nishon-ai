'use client'

import * as React from 'react'
import { CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'

type SectionCardProps = {
  title: string
  description?: string
  /** Show a green check next to the title (means the section is filled / valid). */
  complete?: boolean
  /** Optional right-aligned content in the header (e.g., a toggle switch). */
  action?: React.ReactNode
  children: React.ReactNode
  className?: string
}

export function SectionCard({
  title,
  description,
  complete,
  action,
  children,
  className,
}: SectionCardProps) {
  return (
    <section
      className={cn(
        'rounded-2xl border border-border bg-surface shadow-sm dark:bg-surface-elevated/40 dark:shadow-none',
        'ring-1 ring-black/[0.03] dark:ring-white/[0.04]',
        className,
      )}
    >
      <header className="flex items-start gap-3 px-5 pt-5 md:px-6 md:pt-6">
        <span
          className={cn(
            'mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full',
            complete
              ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
              : 'border-2 border-border bg-transparent',
          )}
          aria-hidden
        >
          {complete && <CheckCircle2 className="h-4 w-4" />}
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="text-base font-semibold text-text-primary">{title}</h3>
          {description ? (
            <p className="mt-1 text-sm leading-relaxed text-text-secondary">{description}</p>
          ) : null}
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </header>
      <div className="space-y-4 px-5 pb-5 pt-4 md:px-6 md:pb-6">{children}</div>
    </section>
  )
}

export function ToggleSwitch({
  checked,
  onChange,
  ariaLabel,
}: {
  checked: boolean
  onChange: (next: boolean) => void
  ariaLabel?: string
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      onClick={() => onChange(!checked)}
      className={cn(
        'relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/25 focus-visible:ring-offset-2',
        checked ? 'bg-brand-mid dark:bg-brand-lime' : 'bg-border',
      )}
    >
      <span
        className={cn(
          'pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-sm transition-transform',
          checked ? 'translate-x-5' : 'translate-x-0',
        )}
      />
    </button>
  )
}
