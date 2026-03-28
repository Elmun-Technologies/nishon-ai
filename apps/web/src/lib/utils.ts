import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number | null | undefined, currency = 'USD'): string {
  if (amount === null || amount === undefined) return '—'
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
    }).format(amount)
  } catch (err) {
    return '—'
  }
}

export function formatNumber(num: number | null | undefined): string {
  if (num === null || num === undefined) return '0'
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`
  if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`
  return num.toString()
}

export function formatPercent(value: number | null | undefined): string {
  if (value === null || value === undefined) return '0%'
  return `${(value * 100).toFixed(2)}%`
}

export function timeAgo(date: Date | string | null | undefined): string {
  if (!date) return '—'
  const now = new Date()
  const past = new Date(date)
  if (isNaN(past.getTime())) return '—'
  
  const diffMs = now.getTime() - past.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  return `${diffDays}d ago`
}

export function getPlatformColor(platform: string): string {
  const colors: Record<string, string> = {
    meta: '#1877F2',
    google: '#4285F4',
    tiktok: '#000000',
    youtube: '#FF0000',
    telegram: '#2CA5E0',
  }
  return colors[platform] || '#7C3AED'
}

export function getPlatformEmoji(platform: string): string {
  const emojis: Record<string, string> = {
    meta: '📘',
    google: '🔍',
    tiktok: '🎵',
    youtube: '▶️',
    telegram: '✈️',
  }
  return emojis[platform] || '📢'
}