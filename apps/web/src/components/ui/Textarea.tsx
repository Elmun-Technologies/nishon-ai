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
        {label && <label className="block text-sm font-medium text-[#9CA3AF]">{label}</label>}
        <textarea
          ref={ref}
          className={cn(
            'flex w-full rounded-lg border border-[#2A2A3A] bg-[#1C1C27] px-3 py-2.5 text-sm text-white placeholder-[#6B7280] focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/20 focus:border-[#7C3AED]/30 transition-all duration-200 resize-none',
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
