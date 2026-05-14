import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

export interface SectionHeaderProps {
  eyebrow?: string
  title: ReactNode
  description?: ReactNode
  align?: 'left' | 'center'
  className?: string
  titleId?: string
}

export function SectionHeader({
  eyebrow,
  title,
  description,
  align = 'left',
  className,
  titleId,
}: SectionHeaderProps) {
  return (
    <div
      className={cn(
        'max-w-3xl',
        align === 'center' && 'mx-auto text-center',
        className,
      )}
    >
      {eyebrow ? (
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-[#65a30d]">
          {eyebrow}
        </p>
      ) : null}
      <h2
        id={titleId}
        className="text-balance text-3xl font-medium tracking-tight text-text-primary md:text-[44px] md:leading-[1.05]"
      >
        {title}
      </h2>
      {description ? (
        <p className="mt-4 text-pretty text-base text-text-secondary md:text-lg">{description}</p>
      ) : null}
    </div>
  )
}
