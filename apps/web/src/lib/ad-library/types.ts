export type AdLibraryNiche = 'fashion' | 'course' | 'restaurant' | 'food' | 'edu' | 'services'

export type AdLibraryPlatform = 'meta' | 'yandex' | 'tiktok'

export type AdLibraryFormat = 'video' | 'image' | 'carousel'

export type AdLibrarySort = 'score' | 'new' | 'longevity'

export interface AdLibraryFilters {
  platform: 'all' | AdLibraryPlatform
  niche: 'all' | AdLibraryNiche
  format: 'all' | AdLibraryFormat
  range: '7d' | '30d'
  sort: AdLibrarySort
}

export interface AdLibraryAdvertiser {
  rank: number
  pageName: string
  niche: AdLibraryNiche
  activeAds: number
  growthPct: number
  categoryLabel: string
}

/** Raw mock row — score computeAdLibraryScore bilan hisoblanadi */
export interface AdLibraryRawAd {
  id: string
  pageName: string
  niche: AdLibraryNiche
  platforms: Array<'Facebook' | 'Instagram' | 'Yandex' | 'TikTok'>
  format: AdLibraryFormat
  headline: string
  primaryText: string
  creativeUrl: string
  /** Kampaniya reklamasi necha kun yuritilmoqda */
  daysActive: number
  /** A/B variantlar soni */
  variationCount: number
  /** 0–1 engagement proxy (izoh/layk) */
  engagement01: number
  /** Yangi kreativ varianti necha kun oldin qo‘shilgan */
  creativeAgeDays: number
  /** Oxirgi N kun ichida snapshot (filter) */
  launchedDaysAgo: number
}

export interface AdLibraryScoredAd extends AdLibraryRawAd {
  score: number
  scoreParts: {
    longevity: number
    variations: number
    engagement: number
    freshness: number
  }
  reasons: string[]
  /** Mock: kunlik taxmin, so‘m */
  estimatedSpendUzs: number
}
