'use client'

import { Bot } from 'lucide-react'
import { cn } from '@/lib/utils'

export function ThinkingDots({ persona }: { persona: string }) {
  return (
    <div className="flex justify-start">
      <div
        className={cn(
          'flex items-center gap-3 rounded-2xl border border-border/80 bg-surface px-4 py-3 shadow-sm',
          'dark:border-brand-mid/20 dark:bg-surface-elevated/90',
          'animate-in fade-in slide-in-from-bottom-1 duration-200',
        )}
      >
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-mid/15 dark:bg-brand-lime/10">
          <Bot className="h-4 w-4 text-brand-mid dark:text-brand-lime" aria-hidden />
        </span>
        <div className="flex items-center gap-1">
          <span className="text-xs text-text-tertiary">{persona}</span>
          <span className="ml-1 flex items-center gap-0.5">
            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-brand-mid dark:bg-brand-lime [animation-delay:-0.3s]" />
            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-brand-mid dark:bg-brand-lime [animation-delay:-0.15s]" />
            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-brand-mid dark:bg-brand-lime" />
          </span>
        </div>
      </div>
    </div>
  )
}
