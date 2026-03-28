'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'gray' | 'purple' | 'success' | 'warning' | 'error' | 'info' | 'danger' | 'secondary'
  size?: 'sm' | 'md'
  dot?: boolean
}

const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(
  (
    {
      className,
      variant = 'default',
      size = 'md',
      dot = false,
      children,
      ...props
    },
    ref
  ) => {
    const variants = {
      default: 'bg-gray-100 border border-gray-200 text-gray-600',
      secondary: 'bg-gray-100 border border-gray-200 text-gray-600',
      gray: 'bg-gray-100 border border-gray-200 text-gray-600',
      purple: 'bg-violet-50 border border-violet-200 text-violet-700',
      success: 'bg-emerald-50 border border-emerald-200 text-emerald-700',
      warning: 'bg-amber-50 border border-amber-200 text-amber-700',
      error: 'bg-red-50 border border-red-200 text-red-700',
      info: 'bg-blue-50 border border-blue-200 text-blue-700',
      danger: 'bg-red-50 border border-red-200 text-red-700',
    }
    const sizes = {
      sm: 'px-1.5 py-0.5 text-[10px]',
      md: 'px-2.5 py-1 text-xs',
    }

    return (
      <div
        ref={ref}
        className={cn(
          'inline-flex items-center gap-1.5 rounded-full font-medium border',
          variants[variant],
          sizes[size],
          dot && 'pr-2',
          className
        )}
        {...props}
      >
        {dot && (
          <span
            className={cn(
              'w-1.5 h-1.5 rounded-full',
              variant === 'purple' && 'bg-violet-500',
              variant === 'success' && 'bg-emerald-500',
              variant === 'warning' && 'bg-amber-500',
              variant === 'error' && 'bg-red-500',
              (variant === 'default' || variant === 'gray') && 'bg-gray-400'
            )}
          />
        )}
        {children}
      </div>
    )
  }
)

Badge.displayName = 'Badge'

// Convenience component for campaign status
export function CampaignStatusBadge({ status }: { status: string }) {
  const config: Record<string, { variant: BadgeProps['variant']; label: string }> = {
    active: { variant: 'success', label: 'Active' },
    paused: { variant: 'warning', label: 'Paused' },
    draft: { variant: 'gray', label: 'Draft' },
    stopped: { variant: 'error', label: 'Stopped' },
    completed: { variant: 'default', label: 'Completed' },
  }
  const { variant, label } = config[status] ?? { variant: 'default', label: status }
  return <Badge variant={variant}>{label}</Badge>
}

export { Badge }
