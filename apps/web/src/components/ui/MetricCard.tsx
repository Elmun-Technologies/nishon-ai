'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'
import { Sparkline } from './Sparkline'

export interface MetricCardProps extends React.HTMLAttributes<HTMLDivElement> {
  label: string
  value: string | number
  subtext?: string
  icon?: string
  accent?: boolean
  loading?: boolean
  /** Array of numbers for sparkline (last N days) */
  sparkline?: number[]
  /** % change vs previous period (positive = up, negative = down) */
  change?: number | null
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
      sparkline,
      change,
      ...props
    },
    ref
  ) => {
    const hasChange = change !== null && change !== undefined
    const isUp = hasChange && change! > 0
    const isDown = hasChange && change! < 0

    return (
      <div
        ref={ref}
        className={cn(
          'bg-[#13131A] border border-[#2A2A3A] rounded-xl p-4 flex flex-col justify-between',
          accent && 'ring-1 ring-[#7C3AED]/20',
          className
        )}
        {...props}
      >
        {/* Top row: label + icon */}
        <div className="flex items-center justify-between mb-2">
          <p className="text-[#6B7280] text-xs font-medium">{label}</p>
          {icon && (
            <span className="text-base opacity-70" aria-hidden="true">
              {icon}
            </span>
          )}
        </div>

        {/* Value + change badge */}
        <div className="flex items-end justify-between gap-2">
          <div>
            <p className="text-white text-lg font-semibold leading-tight">
              {loading ? (
                <span className="inline-block h-6 bg-[#2A2A3A] rounded animate-pulse w-20" />
              ) : (
                value
              )}
            </p>
            {hasChange && !loading && (
              <span
                className={cn(
                  'inline-flex items-center gap-0.5 text-xs font-medium mt-1',
                  isUp   && 'text-emerald-400',
                  isDown && 'text-red-400',
                  !isUp && !isDown && 'text-[#6B7280]'
                )}
              >
                {isUp ? '↑' : isDown ? '↓' : '→'}
                {Math.abs(change!)}%
              </span>
            )}
            {!hasChange && subtext && (
              <p className="text-[#4B5563] text-xs mt-1">{subtext}</p>
            )}
          </div>

          {/* Sparkline */}
          {sparkline && sparkline.length >= 2 && !loading && (
            <div className="shrink-0 opacity-80">
              <Sparkline
                data={sparkline}
                width={64}
                height={28}
                positive={isUp ? true : isDown ? false : null}
              />
            </div>
          )}
        </div>
      </div>
    )
  }
)

MetricCard.displayName = 'MetricCard'

export { MetricCard }
