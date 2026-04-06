import type { Platform } from './platform-config'

// ─── Meta / Facebook Specific ─────────────────────────────────────────────────

export interface MetaPixelConfig {
  pixelId: string
  trackingEvents: ('Purchase' | 'AddToCart' | 'ViewContent' | 'InitiateCheckout' | 'CompleteRegistration')[]
}

export interface MetaCampaignSettings {
  pixelConfig: MetaPixelConfig
  interests: string[]
  placements: ('facebook_feed' | 'instagram_feed' | 'instagram_stories' | 'facebook_reels' | 'audience_network')[]
  enableAutoAdvancedMatching: boolean
  enableLookalikeAudience: boolean
  lookalikePercentage?: number // 1-10
}

// ─── Google Ads Specific ──────────────────────────────────────────────────────

export interface GoogleKeyword {
  text: string
  matchType: 'broad' | 'phrase' | 'exact'
  bidModifier?: number
}

export interface GoogleCampaignSettings {
  keywords: GoogleKeyword[]
  placements: string[]
  bidStrategy: 'target_cpa' | 'target_roas' | 'maximize_conversions' | 'maximize_clicks'
  targetCPA?: number
  targetROAS?: number
  enableDynamicSearchAds: boolean
}

// ─── TikTok Specific ──────────────────────────────────────────────────────────

export interface TikTokPixelConfig {
  pixelId: string
  events: ('ViewContent' | 'Search' | 'AddToCart' | 'Purchase' | 'PlaceAnOrder')[]
}

export interface TikTokCampaignSettings {
  pixelConfig: TikTokPixelConfig
  interests: string[]
  placements: ('feed' | 'pax' | 'search' | 'top_level')[]
  enableAutoTargeting: boolean
  lookalikeAudience?: {
    enabled: boolean
    sourceCountry: string
  }
}

// ─── Yandex Direct Specific ───────────────────────────────────────────────────

export interface YandexKeyword {
  text: string
  bid: number
  contextualBid?: number
}

export interface YandexCampaignSettings {
  keywords: YandexKeyword[]
  bidStrategy: 'fixed' | 'auto_budget'
  deviceTargeting: {
    desktop: boolean
    mobile: boolean
    tablet: boolean
  }
  region: string // ISO country code or region code
  useContextualPlacement: boolean
}

// ─── Union Type for All Platform Settings ─────────────────────────────────────

export type PlatformSettings =
  | { platform: 'meta'; settings: MetaCampaignSettings }
  | { platform: 'google'; settings: GoogleCampaignSettings }
  | { platform: 'tiktok'; settings: TikTokCampaignSettings }
  | { platform: 'yandex'; settings: YandexCampaignSettings }

// ─── Helper Functions ─────────────────────────────────────────────────────────

export function getPlatformSettings(
  platform: Platform,
  settings: unknown
): PlatformSettings | null {
  switch (platform) {
    case 'meta':
      return { platform: 'meta', settings: settings as MetaCampaignSettings }
    case 'google':
      return { platform: 'google', settings: settings as GoogleCampaignSettings }
    case 'tiktok':
      return { platform: 'tiktok', settings: settings as TikTokCampaignSettings }
    case 'yandex':
      return { platform: 'yandex', settings: settings as YandexCampaignSettings }
    default:
      return null
  }
}

export function getDefaultSettingsForPlatform(
  platform: Platform
): MetaCampaignSettings | GoogleCampaignSettings | TikTokCampaignSettings | YandexCampaignSettings {
  switch (platform) {
    case 'meta':
      return {
        pixelConfig: { pixelId: '', trackingEvents: [] },
        interests: [],
        placements: ['facebook_feed', 'instagram_feed'],
        enableAutoAdvancedMatching: true,
        enableLookalikeAudience: false,
      }
    case 'google':
      return {
        keywords: [],
        placements: [],
        bidStrategy: 'maximize_conversions',
        enableDynamicSearchAds: false,
      }
    case 'tiktok':
      return {
        pixelConfig: { pixelId: '', events: [] },
        interests: [],
        placements: ['feed'],
        enableAutoTargeting: true,
      }
    case 'yandex':
      return {
        keywords: [],
        bidStrategy: 'auto_budget',
        deviceTargeting: { desktop: true, mobile: true, tablet: true },
        region: 'US',
        useContextualPlacement: true,
      }
  }
}
