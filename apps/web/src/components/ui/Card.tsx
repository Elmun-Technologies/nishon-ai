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
      default: 'bg-white border border-[#E5E7EB]',
      elevated: 'bg-white border border-[#E5E7EB] shadow-sm',
      outlined: 'bg-transparent border border-[#E5E7EB]',
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
          hoverable && 'cursor-pointer hover:border-[#D1D5DB] hover:shadow-sm transition-all duration-200',
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
