'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

export interface MetricCardProps
  extends React.HTMLAttributes<HTMLDivElement> {
  label: string
  value: string | number
  subtext?: string
  icon?: string
  accent?: boolean
  loading?: boolean
}

const MetricCard = React.forwardRef<HTMLDivElement, MetricCardProps>(
  (
    {
      className,
      label,
      value,
      subtext,
      icon,
      accent = false,
      loading = false,
      ...props
    },
    ref
  ) => {
    return (
      <div
        ref={ref}
        className={cn(
          'bg-[#13131A] border border-[#2A2A3A] rounded-xl p-4',
          accent && 'ring-1 ring-[#7C3AED]/20',
          className
        )}
        {...props}
      >
        <div className="flex items-center justify-between mb-2">
          <p className="text-[#6B7280] text-xs font-medium">{label}</p>
          {icon && (
            <span className="text-lg opacity-80" aria-hidden="true">
              {icon}
            </span>
          )}
        </div>
        
        <div className="flex items-end justify-between">
          <div>
            <p className="text-white text-lg font-semibold">
              {loading ? (
                <div className="h-6 bg-[#2A2A3A] rounded animate-pulse w-20" />
              ) : (
                value
              )}
            </p>
            {subtext && (
              <p className="text-[#4B5563] text-xs mt-1">{subtext}</p>
            )}
          </div>
        </div>
      </div>
    )
  }
)

MetricCard.displayName = 'MetricCard'

export { MetricCard }