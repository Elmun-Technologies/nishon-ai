'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      type = 'text',
      label,
      error,
      leftIcon,
      rightIcon,
      ...props
    },
    ref
  ) => {
    return (
      <div className="space-y-1">
        {label && (
          <label className="block text-sm font-medium text-[#9CA3AF]">
            {label}
          </label>
        )}
        <div className="relative">
          {leftIcon && (
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#6B7280]">
              {leftIcon}
            </div>
          )}
          <input
            type={type}
            className={cn(
              'flex w-full rounded-lg border border-[#2A2A3A] bg-[#1C1C27] px-3 py-2.5 text-sm text-white placeholder-[#6B7280] focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/20 focus:border-[#7C3AED]/30 transition-all duration-200',
              leftIcon && 'pl-10',
              rightIcon && 'pr-10',
              error && 'border-red-500/30 focus:ring-red-500/20 focus:border-red-500/40',
              className
            )}
            ref={ref}
            {...props}
          />
          {rightIcon && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#6B7280]">
              {rightIcon}
            </div>
          )}
        </div>
        {error && (
          <p className="text-red-400 text-sm">{error}</p>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'

export { Input }