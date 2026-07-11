export type Platform = 'meta' | 'google' | 'yandex'
export type LaunchMode = 'self' | 'ai' | 'expert'

export type MetaObjective =
  | 'awareness'
  | 'traffic'
  | 'engagement'
  | 'leads'
  | 'app_promotion'
  | 'sales'

export type MetaStep = 1 | 2 | 3 | 4 | 5 | 6
export type GoogleStep = 1 | 2 | 3 | 4 | 5
export type YandexStep = 1 | 2 | 3 | 4

export type MetaAbTestType = 'creative' | 'audience' | 'placement' | 'custom'

export type MetaSpecialAdCategory = 'credit' | 'employment' | 'housing' | 'social_issues'

export type MetaCtaButton =
  | 'learn_more'
  | 'contact_us'
  | 'shop_now'
  | 'sign_up'

export type MetaLocation = 'UZ' | 'KZ' | 'TJ' | 'TM' | 'RU' | 'US'

export interface MetaData {
  name: string
  objective: '' | MetaObjective
  minAge: number
  maxAge: number
  location: MetaLocation | string
  dailyBudget: string
  campaignDuration: number
  creativeName: string
  creativeUrl: string
  creativeText: string
  /** Public image URL (Reve-generated) → Meta creative picture. Empty = text-only. */
  imageUrl: string
  ctaButton: MetaCtaButton | string
  /** Selected Facebook Page id — required for new ad creative. */
  pageId: string
  abTestEnabled: boolean
  abTestType: MetaAbTestType
  abTestDuration: number
  abTestMetric: string
  specialAdCategories: string[]
}

export interface GoogleData {
  name: string
  campaignType: string
  objective: string
  keywords: string
  headline1: string
  headline2: string
  headline3: string
  description1: string
  description2: string
  finalUrl: string
  dailyBudget: string
  biddingStrategy: string
}

export interface YandexData {
  name: string
  campaignType: string
  keywords: string
  negativeKeywords: string
  headline: string
  description: string
  url: string
  dailyBudget: string
  strategy: string
}

export const LOCATION_LABELS: Record<string, string> = {
  UZ: 'Uzbekistan',
  KZ: 'Kazakhstan',
  TJ: 'Tajikistan',
  TM: 'Turkmenistan',
  RU: 'Russia',
  US: 'United States',
}

export const SPECIAL_AD_CATEGORY_LABELS: Record<string, string> = {
  credit: 'Financial products',
  employment: 'Employment',
  housing: 'Housing',
  social_issues: 'Social issues / politics',
}
