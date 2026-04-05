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
      default: 'bg-surface-2 border border-border text-text-secondary',
      secondary: 'bg-surface-2 border border-border text-text-secondary',
      gray: 'bg-surface-2 border border-border text-text-secondary',
      purple: 'bg-violet-50 border border-violet-200 text-violet-700',
      success: 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-500',
      warning: 'bg-amber-500/10 border border-amber-500/20 text-amber-500',
      error: 'bg-red-500/10 border border-red-500/20 text-red-500',
      info: 'bg-blue-500/10 border border-blue-500/20 text-blue-700',
      danger: 'bg-red-500/10 border border-red-500/20 text-red-500',
    }
    const sizes = {
      sm: 'px-2 py-0.5 text-xs',
      md: 'px-2.5 py-1 text-xs',
    }

    return (
      <div
        ref={ref}
        className={cn(
          'inline-flex items-center gap-1.5 rounded-full font-medium border transition-colors duration-200',
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
              'w-1.5 h-1.5 rounded-full shrink-0',
              variant === 'purple' && 'bg-violet-500',
              variant === 'success' && 'bg-emerald-500',
              variant === 'warning' && 'bg-amber-500',
              variant === 'error' && 'bg-red-500',
              (variant === 'default' || variant === 'gray' || variant === 'secondary') && 'bg-gray-400'
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
