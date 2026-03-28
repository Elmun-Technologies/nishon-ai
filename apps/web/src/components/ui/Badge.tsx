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
      default: 'bg-[#2A2A3A] border border-[#3A3A4A] text-[#9CA3AF]',
      secondary: 'bg-[#2A2A3A] border border-[#3A3A4A] text-[#9CA3AF]',
      gray: 'bg-[#2A2A3A] border border-[#3A3A4A] text-[#9CA3AF]',
      purple: 'bg-[#7C3AED]/10 border border-[#7C3AED]/20 text-[#A78BFA]',
      success: 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400',
      warning: 'bg-amber-500/10 border border-amber-500/20 text-amber-400',
      error: 'bg-red-500/10 border border-red-500/20 text-red-400',
      info: 'bg-blue-500/10 border border-blue-500/20 text-blue-400',
      danger: 'bg-red-500/10 border border-red-500/20 text-red-400',
    }
    const sizes = {
      sm: 'px-1.5 py-0.5 text-[10px]',
      md: 'px-2.5 py-1 text-xs',
    }

    return (
      <div
        ref={ref}
        className={cn(
          'inline-flex items-center gap-1.5 rounded-lg font-medium border',
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
              variant === 'purple' && 'bg-[#A78BFA]',
              variant === 'success' && 'bg-emerald-400',
              variant === 'warning' && 'bg-amber-400',
              variant === 'error' && 'bg-red-400',
              (variant === 'default' || variant === 'gray') && 'bg-[#6B7280]'
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