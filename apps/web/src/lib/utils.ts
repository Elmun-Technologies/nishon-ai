import { type ClassValue, clsx } from 'clsx'

export function cn(...inputs: ClassValue[]) {
  return inputs.filter(Boolean).join(' ')
}

export function formatCurrency(amount: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(amount)
}

export function formatNumber(num: number): string {
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`
  if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`
  return num.toString()
}

export function formatPercent(value: number): string {
  return `${(value * 100).toFixed(2)}%`
}

export function timeAgo(date: Date | string): string {
  const now = new Date()
  const past = new Date(date)
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