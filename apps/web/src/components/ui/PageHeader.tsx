'use client'

import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface PageHeaderProps {
  title: ReactNode
  subtitle?: ReactNode
  actions?: ReactNode
  className?: string
}

export function PageHeader({ title, subtitle, actions, className }: PageHeaderProps) {
  return (
    <div className={cn('mb-6 flex flex-col gap-3 rounded-2xl border border-border/70 bg-white/80 p-4 shadow-sm backdrop-blur-sm dark:bg-slate-900/60 md:flex-row md:items-start md:justify-between md:p-6', className)}>
      <div className="min-w-0">
        <h1 className="text-2xl font-bold tracking-tight text-text-primary md:text-[1.7rem]">{title}</h1>
        {subtitle && <p className="mt-1.5 text-body text-text-secondary">{subtitle}</p>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </div>
  )
}
