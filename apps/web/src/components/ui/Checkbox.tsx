'use client'
import * as React from 'react'
import { cn } from '@/lib/utils'

export interface CheckboxProps {
  checked: boolean
  onChange: (checked?: boolean) => void
  label?: string
  description?: string
  disabled?: boolean
  id?: string
  className?: string
}

export function Checkbox({ checked, onChange, label, description, disabled, id, className }: CheckboxProps) {
  return (
    <label
      htmlFor={id}
      className={cn('flex items-start gap-3 cursor-pointer', disabled && 'opacity-50 cursor-not-allowed', className)}
    >
      <button
        id={id}
        type="button"
        role="checkbox"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => !disabled && onChange(!checked)}
        className={cn(
          'w-4 h-4 rounded border transition-colors duration-200 shrink-0 mt-0.5 flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-[#111827]/30',
          checked ? 'bg-[#111827] border-[#111827]' : 'bg-transparent border-slate-200 dark:border-slate-700'
        )}
      >
        {checked && (
          <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
            <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        )}
      </button>
      {(label || description) && (
        <div>
          {label && <p className="text-sm text-slate-900 dark:text-slate-50">{label}</p>}
          {description && <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{description}</p>}
        </div>
      )}
    </label>
  )
}
