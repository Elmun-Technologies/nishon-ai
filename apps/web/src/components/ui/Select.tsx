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
            'flex w-full rounded-lg border border-[#E5E7EB] bg-[#F9FAFB] px-3 py-2.5 text-sm text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#111827]/20 focus:border-[#D1D5DB] transition-all duration-200 [color-scheme:dark]',
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
