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
  sparkline?: number[]
  change?: number | null
}

const MetricCard = React.forwardRef<HTMLDivElement, MetricCardProps>(
  ({ className, label, value, subtext, icon, accent = false, loading = false, sparkline, change, ...props }, ref) => {
    const hasChange = change !== null && change !== undefined
    const isUp   = hasChange && change! > 0
    const isDown  = hasChange && change! < 0

    return (
      <div
        ref={ref}
        className={cn(
          'relative bg-surface border border-border rounded-xl p-5 flex flex-col justify-between',
          'hover:shadow-md transition-all duration-200',
          accent && 'ring-1 ring-text-primary/10',
          className
        )}
        {...props}
      >
        {/* Top row */}
        <div className="flex items-center justify-between mb-4">
          <p className="text-text-secondary text-xs font-semibold uppercase tracking-wider">{label}</p>
          {icon && <span className="text-xl opacity-70">{icon}</span>}
        </div>

        {/* Value */}
        <div className="flex items-end justify-between gap-2">
          <div>
            <p className="text-text-primary text-2xl font-bold leading-tight">
              {loading
                ? <span className="inline-block h-7 bg-surface-2 rounded animate-pulse w-24" />
                : value}
            </p>
            {hasChange && !loading && (
              <span className={cn(
                'inline-flex items-center gap-0.5 text-xs font-semibold mt-2 px-2 py-0.5 rounded-full',
                isUp   && 'bg-green-50 dark:bg-green-950/40 text-green-600 dark:text-green-400',
                isDown && 'bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400',
                !isUp && !isDown && 'bg-surface-2 text-text-secondary'
              )}>
                {isUp ? '↑' : isDown ? '↓' : '→'} {Math.abs(change!)}%
              </span>
            )}
            {!hasChange && subtext && (
              <p className="text-text-tertiary text-xs mt-1.5">{subtext}</p>
            )}
          </div>
          {sparkline && sparkline.length >= 2 && !loading && (
            <div className="shrink-0 opacity-60">
              <Sparkline data={sparkline} width={64} height={28} positive={isUp ? true : isDown ? false : null} />
            </div>
          )}
        </div>
      </div>
    )
  }
)
MetricCard.displayName = 'MetricCard'
export { MetricCard }
