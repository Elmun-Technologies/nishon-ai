'use client'

import { cn } from '@/lib/utils'

/**
 * Eight-row skeleton matching the PickStep table layout.
 * Pure decorative — no data dependency.
 */
export function TableSkeleton({ rows = 8 }: { rows?: number }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-surface shadow-sm">
      <div className="border-b border-border bg-surface-2 px-4 py-3 dark:bg-surface-elevated">
        <div className="h-3 w-24 animate-pulse rounded bg-border/70" />
      </div>
      <div className="divide-y divide-border/60">
        {Array.from({ length: rows }).map((_, i) => (
          <div
            key={i}
            className="grid grid-cols-[24px_1fr_80px_90px_80px_70px_70px_120px] items-center gap-3 px-4 py-3"
          >
            <div className="h-4 w-4 animate-pulse rounded bg-border/70" />
            <div className="space-y-1.5">
              <div
                className={cn(
                  'h-3 animate-pulse rounded bg-border/70',
                  i % 3 === 0 ? 'w-2/3' : i % 3 === 1 ? 'w-3/4' : 'w-1/2',
                )}
              />
              <div className="h-2.5 w-24 animate-pulse rounded bg-border/50" />
            </div>
            <div className="h-5 w-16 animate-pulse rounded-full bg-border/60" />
            <div className="ml-auto h-3 w-16 animate-pulse rounded bg-border/70" />
            <div className="ml-auto h-3 w-12 animate-pulse rounded bg-border/70" />
            <div className="ml-auto h-3 w-10 animate-pulse rounded bg-border/70" />
            <div className="ml-auto h-3 w-12 animate-pulse rounded bg-border/70" />
            <div className="h-5 w-24 animate-pulse rounded-full bg-border/60" />
          </div>
        ))}
      </div>
    </div>
  )
}
