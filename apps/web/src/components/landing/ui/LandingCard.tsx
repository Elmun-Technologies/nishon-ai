import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

type Tone = 'plain' | 'elevated' | 'ink' | 'soft'

const tones: Record<Tone, string> = {
  plain: 'bg-white ring-1 ring-inset ring-[#e6efd9]',
  elevated:
    'bg-white ring-1 ring-inset ring-[#eef3e3] shadow-[0_1px_2px_rgba(27,46,6,0.04),0_8px_24px_-12px_rgba(27,46,6,0.12)]',
  ink: 'bg-[#1b2e06] text-white shadow-[0_8px_32px_-12px_rgba(27,46,6,0.45)]',
  soft: 'bg-[#f7faf2] ring-1 ring-inset ring-[#dfeacb]',
}

export interface LandingCardProps {
  tone?: Tone
  as?: 'article' | 'div' | 'figure' | 'li'
  className?: string
  children: ReactNode
}

export function LandingCard({
  tone = 'plain',
  as: Tag = 'article',
  className,
  children,
}: LandingCardProps) {
  return (
    <Tag className={cn('rounded-2xl p-6 transition-colors duration-200', tones[tone], className)}>
      {children}
    </Tag>
  )
}
