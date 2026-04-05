import * as React from 'react'
import { cn } from '@/lib/utils'

interface PlatformIconProps {
  platform: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const PLATFORM_CONFIG: Record<
  string,
  { emoji: string; bg: string; border: string }
> = {
  meta: {
    emoji: '📘',
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/20',
  },
  google: {
    emoji: '🔍',
    bg: 'bg-yellow-500/10',
    border: 'border-yellow-500/20',
  },
  tiktok: {
    emoji: '🎵',
    bg: 'bg-pink-500/10',
    border: 'border-pink-500/20',
  },
  youtube: {
    emoji: '▶️',
    bg: 'bg-red-500/10',
    border: 'border-red-500/20',
  },
  telegram: {
    emoji: '✈️',
    bg: 'bg-sky-500/10',
    border: 'border-sky-500/20',
  },
  yandex: {
    emoji: '🔴',
    bg: 'bg-red-600/10',
    border: 'border-red-600/20',
  },
}

const DEFAULT_CONFIG = {
  emoji: '📢',
  bg: 'bg-violet-600/10',
  border: 'border-border/20',
}

export function PlatformIcon({ platform, size = 'md', className }: PlatformIconProps) {
  const config = PLATFORM_CONFIG[platform.toLowerCase()] ?? DEFAULT_CONFIG

  const sizes = {
    sm: 'w-7 h-7 text-sm',
    md: 'w-9 h-9 text-base',
    lg: 'w-11 h-11 text-lg',
  }

  return (
    <div
      className={cn(
        'rounded-xl border flex items-center justify-center shrink-0',
        config.bg,
        config.border,
        sizes[size],
        className
      )}
    >
      {config.emoji}
    </div>
  )
}
