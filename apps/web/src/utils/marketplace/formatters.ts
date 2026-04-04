export function formatPerformanceMetrics(roas: number, cpa: number, cpc?: number): {
  roasLabel: string
  cpaLabel: string
  cpcLabel?: string
} {
  return {
    roasLabel: `${roas.toFixed(2)}x ROAS`,
    cpaLabel: `$${cpa.toFixed(2)} CPA`,
    cpcLabel: cpc ? `$${cpc.toFixed(2)} CPC` : undefined,
  }
}

export function formatCurrency(value: number, currencyCode = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currencyCode,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat('en-US').format(value)
}

export function formatPercentage(value: number, decimals = 1): string {
  return `${value.toFixed(decimals)}%`
}

export function formatDate(date: string | Date, format: 'short' | 'long' = 'short'): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date

  if (format === 'short') {
    return dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  return dateObj.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
}

export function formatTimeAgo(date: string | Date): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  const now = new Date()
  const seconds = Math.floor((now.getTime() - dateObj.getTime()) / 1000)

  if (seconds < 60) return 'Just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}d ago`
  const months = Math.floor(days / 30)
  if (months < 12) return `${months}mo ago`
  return `${Math.floor(months / 12)}y ago`
}

export function formatExperience(years: number): string {
  if (years < 1) return '< 1 year'
  if (years === 1) return '1 year'
  return `${years}+ years`
}

export function formatResponseTime(time: string): string {
  return time
}

export function formatMinBudget(budget: number): string {
  if (budget >= 1000) {
    return `$${(budget / 1000).toFixed(0)}K`
  }
  return `$${budget}`
}
