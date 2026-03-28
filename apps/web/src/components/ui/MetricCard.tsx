'use client'
import * as React from 'react'
import { cn } from '@/lib/utils'
import { Sparkline } from './Sparkline'
import { Card } from './card'

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
    const isDown = hasChange && change! < 0

    return (
      <Card
        ref={ref}
        className={cn('p-4 flex flex-col justify-between', accent && 'ring-1 ring-ring/20', className)}
        {...props}
      >
        <div className="flex items-center justify-between mb-3">
          <p className="text-muted-foreground text-xs font-medium">{label}</p>
          {icon && <span className="text-base opacity-60" aria-hidden="true">{icon}</span>}
        </div>

        <div className="flex items-end justify-between gap-2">
          <div>
            <p className="text-xl font-semibold leading-tight">
              {loading ? <span className="inline-block h-6 bg-muted rounded animate-pulse w-20" /> : value}
            </p>
            {hasChange && !loading && (
              <span className={cn('inline-flex items-center gap-0.5 text-xs font-medium mt-1.5',
                isUp && 'text-emerald-600', isDown && 'text-red-600', !isUp && !isDown && 'text-muted-foreground')}>
                {isUp ? '↑' : isDown ? '↓' : '→'}{Math.abs(change!)}%
              </span>
            )}
            {!hasChange && subtext && <p className="text-muted-foreground text-xs mt-1">{subtext}</p>}
          </div>
          {sparkline && sparkline.length >= 2 && !loading && (
            <div className="shrink-0 opacity-70">
              <Sparkline data={sparkline} width={64} height={28} positive={isUp ? true : isDown ? false : null} />
            </div>
          )}
        </div>
      </Card>
    )
  }
)
MetricCard.displayName = 'MetricCard'
export { MetricCard }
