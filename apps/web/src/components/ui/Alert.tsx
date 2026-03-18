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
      error: 'bg-red-500/10 border border-red-500/20 text-red-400',
      warning: 'bg-amber-500/10 border border-amber-500/20 text-amber-400',
      success: 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400',
      info: 'bg-blue-500/10 border border-blue-500/20 text-blue-400'
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

export { Alert }