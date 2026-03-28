'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

export interface AlertProps
  extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'error' | 'warning' | 'success' | 'info'
}

const Alert = React.forwardRef<HTMLDivElement, AlertProps>(
  (
    {
      className,
      variant = 'info',
      children,
      ...props
    },
    ref
  ) => {
    const variants = {
      error: 'bg-red-50 border border-red-200 text-red-700',
      warning: 'bg-amber-50 border border-amber-200 text-amber-700',
      success: 'bg-emerald-50 border border-emerald-200 text-emerald-700',
      info: 'bg-blue-50 border border-blue-200 text-blue-700'
    }

    return (
      <div
        ref={ref}
        className={cn(
          'rounded-lg px-4 py-3 text-sm',
          variants[variant],
          className
        )}
        {...props}
      >
        {children}
      </div>
    )
  }
)

Alert.displayName = 'Alert'

export function AlertDescription({ children, className }: { children: React.ReactNode; className?: string }) {
  return <p className={cn('text-sm mt-1 opacity-90', className)}>{children}</p>
}

export function AlertTitle({ children, className }: { children: React.ReactNode; className?: string }) {
  return <p className={cn('text-sm font-semibold', className)}>{children}</p>
}

export { Alert }