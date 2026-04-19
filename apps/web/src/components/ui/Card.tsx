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
      default:  'bg-white/85 dark:bg-slate-900/70 border border-border/70 shadow-sm backdrop-blur-sm',
      elevated: 'bg-white/90 dark:bg-slate-900/75 border border-border/70 shadow-md backdrop-blur-sm',
      outlined: 'bg-transparent border border-border/80',
    }
    const paddings = { none: '', sm: 'p-4', md: 'p-6', lg: 'p-8' }
    return (
      <div
        ref={ref}
        className={cn(
          'rounded-2xl',
          variants[variant],
          paddings[padding],
          hoverable && 'cursor-pointer hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200',
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
