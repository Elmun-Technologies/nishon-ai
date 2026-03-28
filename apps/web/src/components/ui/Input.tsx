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
          <label className="block text-sm font-medium text-[#374151]">
            {label}
          </label>
        )}
        <div className="relative">
          {leftIcon && (
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#9CA3AF]">
              {leftIcon}
            </div>
          )}
          <input
            type={type}
            className={cn(
              'flex w-full rounded-lg border border-[#E5E7EB] bg-white px-3 py-2.5 text-sm text-[#111827] placeholder-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#111827]/10 focus:border-[#111827] transition-all duration-200',
              leftIcon && 'pl-10',
              rightIcon && 'pr-10',
              error && 'border-red-300 focus:ring-red-100 focus:border-red-400',
              className
            )}
            ref={ref}
            {...props}
          />
          {rightIcon && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#9CA3AF]">
              {rightIcon}
            </div>
          )}
        </div>
        {error && (
          <p className="text-red-600 text-sm">{error}</p>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'

export { Input }
