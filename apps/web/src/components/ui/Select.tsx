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
  ({ className, label, error, options, placeholder, children, ...props }, ref) => (
    <div className="space-y-1">
      {label && <label className="block text-xs font-medium text-text-secondary">{label}</label>}
      <select
        ref={ref}
        className={cn(
          'flex w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-sm text-text-primary',
          'focus:outline-none focus:ring-2 focus:ring-text-primary/10 focus:border-text-primary transition-colors',
          error && 'border-error/50',
          className
        )}
        {...props}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options ? options.map(o => <option key={o.value} value={o.value}>{o.label}</option>) : children}
      </select>
      {error && <p className="text-error text-xs">{error}</p>}
    </div>
  )
)
Select.displayName = 'Select'
export { Select }
