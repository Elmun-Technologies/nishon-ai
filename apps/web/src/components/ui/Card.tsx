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
      default: 'bg-[#13131A] border border-[#2A2A3A]',
      elevated: 'bg-[#13131A] border border-[#2A2A3A] shadow-[0_8px_30px_0_rgba(0,0,0,0.12)]',
      outlined: 'bg-transparent border border-[#2A2A3A]',
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
          hoverable && 'cursor-pointer hover:border-[#7C3AED]/30 transition-colors duration-200',
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