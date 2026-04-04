'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

export interface CardProps
  extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'elevated' | 'outlined'
  padding?: 'none' | 'sm' | 'md' | 'lg'
  hoverable?: boolean
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  (
    {
      className,
      variant = 'default',
      padding = 'md',
      hoverable = false,
      children,
      ...props
    },
    ref
  ) => {
    const variants = {
      default: 'bg-white dark:bg-slate-900 dark:bg-slate-900 border border-slate-200 dark:border-slate-700/60',
      elevated: 'bg-white dark:bg-slate-900 dark:bg-slate-900 border border-slate-200 dark:border-slate-700/60 shadow-sm',
      outlined: 'bg-transparent border border-slate-200 dark:border-slate-700',
    }

    const paddings = {
      none: '',
      sm: 'p-4',
      md: 'p-6',
      lg: 'p-8',
    }

    return (
      <div
        ref={ref}
        className={cn(
          'rounded-xl',
          variants[variant],
          paddings[padding],
          hoverable && 'cursor-pointer hover:border-slate-300 dark:hover:border-slate-600 hover:shadow-md transition-all duration-200',
          className
        )}
        {...props}
      >
        {children}
      </div>
    )
  }
)

Card.displayName = 'Card'

export { Card }
