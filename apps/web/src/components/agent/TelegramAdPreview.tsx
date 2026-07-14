'use client'

import { Check, Eye, Megaphone } from 'lucide-react'
import type { AdCopy } from '@/lib/ad-copy-templates'

/**
 * High-fidelity mock of a Telegram Channel sponsored message. The image slot
 * uses the vertical's accent gradient — no external assets required.
 */
export function TelegramAdPreview({
  brand,
  copy,
  gradient,
}: {
  brand: string
  copy: AdCopy
  gradient: string
}) {
  return (
    <div className="mx-auto max-w-[360px] rounded-2xl border border-zinc-200 bg-[#e7ebf0] p-3 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      {/* Chat "day" pill */}
      <div className="mb-3 flex justify-center">
        <span className="rounded-full bg-white/70 px-2 py-0.5 text-[10px] font-medium text-zinc-600 backdrop-blur dark:bg-zinc-800/70 dark:text-zinc-300">
          Today
        </span>
      </div>

      {/* Sponsored message bubble */}
      <div className="rounded-2xl rounded-tl-md bg-white p-3 shadow-sm dark:bg-zinc-950">
        <div className="mb-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div
              className="flex h-8 w-8 items-center justify-center rounded-full text-white"
              style={{ background: gradient }}
            >
              <Megaphone className="h-4 w-4" aria-hidden />
            </div>
            <div className="min-w-0 leading-tight">
              <p className="truncate text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                {brand}
              </p>
              <p className="text-[10px] text-zinc-500">Sponsored</p>
            </div>
          </div>
        </div>

        {/* Image slot */}
        <div
          className="relative mb-2 aspect-[16/9] w-full overflow-hidden rounded-xl"
          style={{ background: gradient }}
        >
          <div className="absolute inset-0 bg-[radial-gradient(70%_50%_at_50%_40%,rgba(255,255,255,0.35),transparent_60%)]" />
        </div>

        {/* Copy */}
        <p className="text-[15px] font-semibold leading-snug text-zinc-900 dark:text-zinc-100">
          {copy.headline}
        </p>
        <p className="mt-1 text-sm leading-snug text-zinc-700 dark:text-zinc-300">
          {copy.body}
        </p>

        {/* Inline button */}
        <button
          type="button"
          className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg bg-[#3390ec] px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#2b7fd0]"
        >
          {copy.cta}
        </button>

        {/* Footer meta */}
        <div className="mt-2 flex items-center justify-end gap-1 text-[11px] text-zinc-500">
          <Eye className="h-3 w-3" aria-hidden />
          <span>12.4K</span>
          <span className="tabular-nums">10:15</span>
          <Check className="h-3 w-3" aria-hidden />
        </div>
      </div>
    </div>
  )
}

export default TelegramAdPreview
