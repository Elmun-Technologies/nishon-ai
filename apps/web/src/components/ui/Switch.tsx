'use client'
import * as React from 'react'
import { cn } from '@/lib/utils'

export interface SwitchProps {
  checked: boolean
  onChange: (checked: boolean) => void
  label?: string
  description?: string
  disabled?: boolean
  id?: string
  className?: string
}

export function Switch({ checked, onChange, label, description, disabled, id, className }: SwitchProps) {
  return (
    <label
      htmlFor={id}
      className={cn('flex items-center gap-3 cursor-pointer', disabled && 'opacity-50 cursor-not-allowed', className)}
    >
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => !disabled && onChange(!checked)}
        className={cn(
          'relative w-10 h-6 rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-border/30 shrink-0',
          checked ? 'bg-surface' : 'bg-surface-2'
        )}
      >
        <span
          className={cn(
            'absolute top-1 left-1 w-4 h-4 bg-surface rounded-full shadow transition-transform duration-200',
            checked && 'translate-x-4'
          )}
        />
      </button>
      {(label || description) && (
        <div>
          {label && <p className="text-sm font-medium text-text-primary">{label}</p>}
          {description && <p className="text-xs text-text-tertiary">{description}</p>}
        </div>
      )}
    </label>
  )
}
