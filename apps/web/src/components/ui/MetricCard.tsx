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
    const isUp = hasChange && change! > 0
    const isDown = hasChange && change! < 0

    return (
      <div
        ref={ref}
        className={cn(
          'group relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/60',
          'rounded-xl p-5 flex flex-col justify-between',
          'hover:border-slate-300 dark:hover:border-slate-600',
          'hover:shadow-lg dark:hover:shadow-slate-900/50',
          'transition-all duration-300 cursor-default',
          accent && 'ring-1 ring-blue-500/20 dark:ring-blue-400/20',
          className
        )}
        {...props}
      >
        {/* Subtle gradient overlay on hover */}
        <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-transparent to-slate-50/50 dark:to-slate-800/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

        {/* Top row */}
        <div className="flex items-center justify-between mb-4 relative">
          <p className="text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider">{label}</p>
          {icon && <span className="text-xl opacity-80 group-hover:opacity-100 transition-opacity">{icon}</span>}
        </div>

        {/* Value */}
        <div className="flex items-end justify-between gap-2 relative">
          <div>
            <p className="text-slate-900 dark:text-slate-50 text-2xl font-bold leading-tight">
              {loading ? (
                <span className="inline-block h-7 bg-slate-200 dark:bg-slate-700 rounded animate-pulse w-24" />
              ) : (
                value
              )}
            </p>
            {hasChange && !loading && (
              <span className={cn(
                'inline-flex items-center gap-0.5 text-xs font-semibold mt-2 px-2 py-0.5 rounded-full',
                isUp   && 'bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400',
                isDown && 'bg-red-50 dark:bg-red-950 text-red-600 dark:text-red-400',
                !isUp && !isDown && 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
              )}>
                {isUp ? '↑' : isDown ? '↓' : '→'} {Math.abs(change!)}%
              </span>
            )}
            {!hasChange && subtext && (
              <p className="text-slate-400 dark:text-slate-500 text-xs mt-1.5">{subtext}</p>
            )}
          </div>

          {sparkline && sparkline.length >= 2 && !loading && (
            <div className="shrink-0 opacity-60 group-hover:opacity-90 transition-opacity">
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
