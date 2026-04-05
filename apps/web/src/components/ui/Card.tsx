'use client'
import * as React from 'react'
import { cn } from '@/lib/utils'

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'elevated' | 'outlined'
  padding?: 'none' | 'sm' | 'md' | 'lg'
  hoverable?: boolean
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = 'default', padding = 'md', hoverable = false, children, ...props }, ref) => {
    const variants = {
      default:  'bg-surface border border-border',
      elevated: 'bg-surface border border-border shadow-sm',
      outlined: 'bg-transparent border border-border',
    }
    const paddings = { none: '', sm: 'p-4', md: 'p-6', lg: 'p-8' }
    return (
      <div
        ref={ref}
        className={cn(
          'rounded-xl',
          variants[variant],
          paddings[padding],
          hoverable && 'cursor-pointer hover:shadow-md transition-all duration-200',
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
