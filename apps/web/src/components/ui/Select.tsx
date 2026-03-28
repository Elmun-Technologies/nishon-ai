'use client'
import * as React from 'react'
import { cn } from '@/lib/utils'

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  options?: { value: string; label: string }[]
  placeholder?: string
}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, options, placeholder, children, ...props }, ref) => {
    return (
      <div className="space-y-1">
        {label && <label className="block text-sm font-medium text-[#9CA3AF]">{label}</label>}
        <select
          ref={ref}
          className={cn(
            'flex w-full rounded-lg border border-[#2A2A3A] bg-[#1C1C27] px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/20 focus:border-[#7C3AED]/30 transition-all duration-200 [color-scheme:dark]',
            error && 'border-red-500/30',
            className
          )}
          {...props}
        >
          {placeholder && <option value="">{placeholder}</option>}
          {options
            ? options.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))
            : children}
        </select>
        {error && <p className="text-red-400 text-xs">{error}</p>}
      </div>
    )
  }
)
Select.displayName = 'Select'

export { Select }
