export type AdPlatform = 'meta' | 'google' | 'tiktok' | 'yandex' | 'telegram'

export interface PerformancePoint {
  date: string
  spend: number
  roas: number
  cpa: number
  purchases: number
}

export interface PortfolioCase {
  id: string
  client: string
  niche: string
  durationDays: number
  startCpa: number
  endCpa: number
  spend: number
  creativesUsed: number
  chart: PerformancePoint[]
}

export interface TargetologistProfile {
  id: string
  name: string
  avatar: string
  /** Meta Audit / platform verification */
  verified: boolean
  niche: string[]
  platforms: AdPlatform[]
  languages: string[]
  location: string
  /** Jami sarflangan (USD shartli demo) */
  totalSpend: number
  performance: PerformancePoint[]
  accountAgeDays: number
  policyViolations: number
  portfolio: PortfolioCase[]
  /** Risk radar */
  banHistoryMonthsAgo?: number | null
  /** Oxirgi 7 kun vs oldingi 7 kun ROAS, foizda tushish = musbat */
  roasWeekOverWeekDropPct?: number
}

export interface MarketplaceScores {
  performance: number
  stability: number
  growth: number
  trust: number
  total: number
}

export type BudgetBand = '' | '0-1k' | '1-5k' | '5k+'

export interface MarketplaceFilters {
  niche: string
  platform: string
  budget: BudgetBand
  language: string
  location: string
  verifiedOnly: boolean
  consistencyOnly: boolean
  healthyAccountOnly: boolean
}
