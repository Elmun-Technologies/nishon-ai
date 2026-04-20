'use client'

import Image from 'next/image'
import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

const RATIO_CLASS = {
  '16:9': 'aspect-video',
  '4:3': 'aspect-[4/3]',
  '1:1': 'aspect-square',
  '21:9': 'aspect-[21/9]',
} as const

export type ContentMediaRatio = keyof typeof RATIO_CLASS

export interface ContentMediaSlotProps {
  /** Stable id — must match `public/onboarding/assets.json` + QA selectors. */
  slotId: string
  ratio: ContentMediaRatio
  /** When you add a file under /public, pass e.g. `/onboarding/welcome.webp` */
  imageSrc?: string
  imageAlt?: string
  /** Shown under the frame (i18n). */
  caption?: string
  className?: string
  /** Softer loading for below-the-fold slots */
  priority?: boolean
  children?: ReactNode
}

/**
 * Reserved frame for illustrations / Lottie / Rive.
 * - Static image: pass `imageSrc`.
 * - Motion: render library into `children` or portal to `[data-animation-root]` inside the slot.
 */
export function ContentMediaSlot({
  slotId,
  ratio,
  imageSrc,
  imageAlt = '',
  caption,
  className,
  priority = false,
  children,
}: ContentMediaSlotProps) {
  const hasImage = Boolean(imageSrc)

  return (
    <figure className={cn('w-full', className)}>
      <div
        className={cn(
          'relative w-full overflow-hidden rounded-2xl border border-dashed border-border/90 bg-gradient-to-br from-surface-2/90 to-surface-2/40 shadow-inner dark:from-surface-elevated/60 dark:to-surface-2/30',
          RATIO_CLASS[ratio],
        )}
        data-media-slot={slotId}
        data-media-ratio={ratio}
      >
        {hasImage ? (
          <Image
            src={imageSrc!}
            alt={imageAlt || caption || slotId}
            fill
            priority={priority}
            sizes="(max-width: 1024px) 100vw, 420px"
            className="object-cover"
          />
        ) : (
          <>
            <Image
              src="/onboarding/placeholder.svg"
              alt=""
              fill
              priority={priority}
              sizes="(max-width: 1024px) 100vw, 420px"
              className="object-cover opacity-[0.35] dark:opacity-25"
            />
            <div className="absolute inset-0 flex items-center justify-center p-4" data-animation-root>
              {children ?? (
                <div
                  className="h-[70%] w-[86%] rounded-xl border border-border/40 bg-surface/25 backdrop-blur-[1px] animate-pulse dark:border-white/10 dark:bg-black/15"
                  aria-hidden
                />
              )}
            </div>
          </>
        )}
      </div>
      {caption ? (
        <figcaption className="mt-2 text-center text-[11px] font-medium uppercase tracking-wide text-text-tertiary">
          {caption}
        </figcaption>
      ) : null}
    </figure>
  )
}
