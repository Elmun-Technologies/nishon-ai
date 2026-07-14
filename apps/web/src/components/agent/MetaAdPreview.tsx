'use client'

import { Bookmark, Heart, MessageCircle, MoreHorizontal, Send } from 'lucide-react'
import type { AdCopy } from '@/lib/ad-copy-templates'

/**
 * High-fidelity mock of a Meta (Instagram) Feed ad. Pure visual: no data
 * fetching, no external assets — the "image" is a gradient placeholder that
 * carries the vertical's accent color.
 */
export function MetaAdPreview({
  brand,
  copy,
  gradient,
}: {
  brand: string
  copy: AdCopy
  gradient: string
}) {
  return (
    <div className="mx-auto max-w-[360px] overflow-hidden rounded-2xl border border-zinc-200 bg-white text-zinc-900 shadow-sm dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2.5">
        <div className="flex items-center gap-2">
          <div
            className="h-8 w-8 rounded-full ring-2 ring-white"
            style={{ background: gradient }}
          />
          <div className="min-w-0 leading-tight">
            <p className="truncate text-sm font-semibold">{brand}</p>
            <p className="text-[10px] text-zinc-500">Sponsored · Tashkent</p>
          </div>
        </div>
        <MoreHorizontal className="h-4 w-4 text-zinc-500" aria-hidden />
      </div>

      {/* Image slot */}
      <div
        className="relative aspect-square w-full"
        style={{ background: gradient }}
      >
        <div className="absolute inset-0 bg-[radial-gradient(60%_50%_at_50%_35%,rgba(255,255,255,0.35),transparent_60%)]" />
        <div className="absolute inset-x-0 bottom-0 flex items-end justify-between p-4">
          <p className="max-w-[70%] text-lg font-bold leading-tight text-white drop-shadow-md">
            {copy.headline}
          </p>
          <span className="inline-flex items-center rounded-lg bg-white/90 px-2.5 py-1 text-[11px] font-bold text-zinc-900 backdrop-blur">
            {copy.cta}
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between px-3 py-2">
        <div className="flex items-center gap-3">
          <Heart className="h-5 w-5" aria-hidden />
          <MessageCircle className="h-5 w-5" aria-hidden />
          <Send className="h-5 w-5" aria-hidden />
        </div>
        <Bookmark className="h-5 w-5" aria-hidden />
      </div>

      {/* Caption */}
      <div className="px-3 pb-3">
        <p className="text-sm leading-snug">
          <span className="font-semibold">{brand}</span>{' '}
          <span className="text-zinc-700 dark:text-zinc-300">{copy.body}</span>
        </p>
      </div>
    </div>
  )
}

export default MetaAdPreview
