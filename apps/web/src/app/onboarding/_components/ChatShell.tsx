'use client'

import { useEffect, useRef } from 'react'
import { cn } from '@/lib/utils'

export function ChatShell({
  children,
  footer,
  progressPercent,
}: {
  children: React.ReactNode
  footer?: React.ReactNode
  progressPercent: number
}) {
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' })
  })

  return (
    <div className="mx-auto flex h-[calc(100dvh-4rem)] max-w-2xl flex-col overflow-hidden rounded-3xl bg-[#fafdf5] ring-1 ring-inset ring-[#e6efd9] shadow-[0_24px_64px_-32px_rgba(27,46,6,0.25)] md:my-6">
      {/* Progress */}
      <div className="border-b border-[#e6efd9] bg-white/80 px-4 py-3 backdrop-blur">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#1b2e06] text-[#d9f99d]">
              <span className="text-xs font-bold">A</span>
            </div>
            <div>
              <p className="text-xs font-semibold tracking-tight text-text-primary">
                Nishon AI
              </p>
              <p className="text-[10px] text-text-tertiary">
                Reklamani boshlash maslahatchisi
              </p>
            </div>
          </div>
          <span className="tabular-nums text-[11px] font-semibold text-text-tertiary">
            {Math.round(progressPercent)}%
          </span>
        </div>
        <div className="mt-2 h-1 overflow-hidden rounded-full bg-[#eef3e3]">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[#3f6212] via-[#65a30d] to-[#a3e635] transition-[width] duration-500 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-5 md:px-6">
        {children}
      </div>

      {/* Footer */}
      {footer && (
        <div className="border-t border-[#e6efd9] bg-white/80 px-4 py-4 backdrop-blur md:px-6">
          {footer}
        </div>
      )}
    </div>
  )
}

export function MessageGroup({ children }: { children: React.ReactNode }) {
  return <div className="space-y-3 animate-[chat-fade-in_0.4s_ease-out_both]">{children}</div>
}

export function ChatStaticHelper({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn('mt-2 ml-10 text-[11px] text-text-tertiary', className)}>{children}</div>
  )
}
