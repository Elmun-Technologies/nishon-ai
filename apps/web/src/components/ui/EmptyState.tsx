'use client'

import * as React from 'react'
import { Button } from './Button'
import { cn } from '@/lib/utils'

export interface EmptyStateProps
  extends React.HTMLAttributes<HTMLDivElement> {
  icon: string
  title: string
  description: string
  action?: {
    label: string
    onClick: () => void
  }
}

const EmptyState = React.forwardRef<HTMLDivElement, EmptyStateProps>(
  (
    {
      className,
      icon,
      title,
      description,
      action,
      ...props
    },
    ref
  ) => {
    return (
      <div
        ref={ref}
        className={cn(
          'bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl p-8 text-center',
          className
        )}
        {...props}
      >
        <div className="space-y-4">
          <div className="text-4xl">{icon}</div>
          <div className="space-y-2">
            <h3 className="text-[#111827] text-lg font-semibold">{title}</h3>
            <p className="text-[#6B7280] text-sm leading-relaxed">{description}</p>
          </div>
          {action && (
            <div className="pt-4">
              <Button
                variant="secondary"
                onClick={action.onClick}
              >
                {action.label}
              </Button>
            </div>
          )}
        </div>
      </div>
    )
  }
)

EmptyState.displayName = 'EmptyState'

export { EmptyState }
