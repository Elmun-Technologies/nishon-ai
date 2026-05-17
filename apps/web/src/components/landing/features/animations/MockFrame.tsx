'use client'

import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

export interface MockFrameProps {
  /** Small label shown in the frame's top bar (e.g. "campaigns table"). */
  label: string
  /** Optional pill on the right of the top bar. */
  badge?: ReactNode
  /** Body content. */
  children: ReactNode
  /** Optional accent for the corner glow. */
  glow?: 'lime' | 'sky' | 'violet' | 'amber'
  className?: string
}

const GLOWS: Record<NonNullable<MockFrameProps['glow']>, string> = {
  lime: 'bg-[radial-gradient(120%_120%_at_0%_0%,#f4f9ea_0%,transparent_55%)]',
  sky: 'bg-[radial-gradient(120%_120%_at_100%_0%,#e0f2fe_0%,transparent_55%)]',
  violet: 'bg-[radial-gradient(120%_120%_at_50%_0%,#f5f3ff_0%,transparent_55%)]',
  amber: 'bg-[radial-gradient(120%_120%_at_100%_0%,#fef3c7_0%,transparent_55%)]',
}

export function MockFrame({ label, badge, children, glow = 'lime', className }: MockFrameProps) {
  return (
    <div
      className={cn(
        'relative isolate overflow-hidden rounded-3xl bg-white ring-1 ring-[#e6efd9] shadow-[0_30px_60px_-30px_rgba(27,46,6,0.32),0_8px_24px_-16px_rgba(27,46,6,0.18)]',
        className,
      )}
    >
      <div className={cn('pointer-events-none absolute inset-0 -z-10', GLOWS[glow])} />

      <div className="flex items-center justify-between border-b border-[#eef3e3] px-5 py-3">
        <div className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-[#f87171]/70" aria-hidden="true" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#facc15]/70" aria-hidden="true" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#84cc16]/80" aria-hidden="true" />
        </div>
        <p className="text-[11px] font-medium text-text-tertiary">{label}</p>
        <div className="min-w-[24px] text-right">{badge}</div>
      </div>

      <div className="p-5">{children}</div>
    </div>
  )
}

export function LiveDot({ label = 'LIVE' }: { label?: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold text-[#3f6212]">
      <span className="relative inline-flex h-2 w-2">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#84cc16] opacity-60" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-[#65a30d]" />
      </span>
      {label}
    </span>
  )
}

export const SHARED_ANIM_STYLES = `
  @keyframes mockFadeIn {
    from { opacity: 0; transform: translateY(6px); }
    to { opacity: 1; transform: translateY(0); }
  }
  @keyframes mockSlideRight {
    from { opacity: 0; transform: translateX(-8px); }
    to { opacity: 1; transform: translateX(0); }
  }
  @keyframes mockPulse {
    0%, 100% { opacity: 0.55; }
    50% { opacity: 1; }
  }
  @media (prefers-reduced-motion: reduce) {
    [style*="mockFadeIn"], [style*="mockSlideRight"], [class*="mockPulse"] {
      animation: none !important; opacity: 1 !important; transform: none !important;
    }
  }
`
