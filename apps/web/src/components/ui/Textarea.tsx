'use client'
import * as React from 'react'
import { cn } from '@/lib/utils'

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, ...props }, ref) => {
    return (
      <div className="space-y-1">
        {label && <label className="block text-sm font-medium text-slate-400 dark:text-slate-500">{label}</label>}
        <textarea
          ref={ref}
          className={cn(
            'flex w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 px-3 py-2.5 text-sm text-slate-900 dark:text-slate-50 placeholder-[#6B7280] focus:outline-none focus:ring-2 focus:ring-[#111827]/20 focus:border-slate-300 dark:border-slate-600 transition-all duration-200 resize-none',
            error && 'border-red-500/30',
            className
          )}
          {...props}
        />
        {error && <p className="text-red-400 text-xs">{error}</p>}
      </div>
    )
  }
)
Textarea.displayName = 'Textarea'

export { Textarea }
