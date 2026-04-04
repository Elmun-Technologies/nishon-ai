import * as React from 'react'
import { cn } from '@/lib/utils'

export interface ProgressProps {
  value: number
  max?: number
  className?: string
  barClassName?: string
  label?: string
}

export function Progress({ value, max = 100, className, barClassName, label }: ProgressProps) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100))
  return (
    <div className={cn('space-y-1', className)}>
      {label && <p className="text-xs text-slate-500 dark:text-slate-400">{label}</p>}
      <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
        <div
          className={cn('h-full bg-[#111827] rounded-full transition-all duration-300', barClassName)}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}
