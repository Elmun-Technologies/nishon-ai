'use client'
import * as React from 'react'
import { cn } from '@/lib/utils'
import { Button } from './button'

export interface EmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
  icon: string
  title: string
  description: string
  action?: { label: string; onClick: () => void }
}

const EmptyState = React.forwardRef<HTMLDivElement, EmptyStateProps>(
  ({ className, icon, title, description, action, ...props }, ref) => (
    <div ref={ref} className={cn('bg-muted/30 border rounded-xl p-8 text-center', className)} {...props}>
      <div className="space-y-4">
        <div className="text-4xl">{icon}</div>
        <div className="space-y-2">
          <h3 className="font-semibold text-lg">{title}</h3>
          <p className="text-muted-foreground text-sm leading-relaxed">{description}</p>
        </div>
        {action && (
          <div className="pt-4">
            <Button variant="outline" onClick={action.onClick}>{action.label}</Button>
          </div>
        )}
      </div>
    </div>
  )
)
EmptyState.displayName = 'EmptyState'
export { EmptyState }
