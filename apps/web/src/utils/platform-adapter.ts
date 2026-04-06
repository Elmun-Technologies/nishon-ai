import type { Platform } from '@/types/platform-config'
import {
  getPlatformConfig,
  validateBudgetTypeForPlatform,
  validateDailyBudget,
  isFeatureRequiredByPlatform,
} from '@/types/platform-config'
import {
  type MetaCampaignSettings,
  type GoogleCampaignSettings,
  type TikTokCampaignSettings,
  type YandexCampaignSettings,
  getDefaultSettingsForPlatform,
} from '@/types/platform-settings'

// ─── Platform Adapter Interface ───────────────────────────────────────────────

export interface PlatformAdapter {
  platform: Platform
  validateCampaignSettings(): { valid: boolean; errors: string[] }
  getRequiredFields(): string[]
  getOptionalFields(): string[]
  getDefaultSettings(): Record<string, any>
  formatSettingsForAPI(): Record<string, any>
}

// ─── Meta Adapter ─────────────────────────────────────────────────────────────

export class MetaAdapter implements PlatformAdapter {
  platform: Platform = 'meta'
  settings: MetaCampaignSettings

  constructor(settings?: Partial<MetaCampaignSettings>) {
    this.settings = {
      pixelConfig: { pixelId: '', trackingEvents: [] },
      interests: [],
      placements: ['facebook_feed', 'instagram_feed'],
      enableAutoAdvancedMatching: true,
      enableLookalikeAudience: false,
      ...settings,
    }
  }

  validateCampaignSettings(): { valid: boolean; errors: string[] } {
    const errors: string[] = []

    if (!this.settings.pixelConfig.pixelId) {
      errors.push('Meta Pixel ID is required')
    }
    if (this.settings.placements.length === 0) {
      errors.push('At least one placement must be selected')
    }
    if (this.settings.enableLookalikeAudience && !this.settings.lookalikePercentage) {
      errors.push('Lookalike audience percentage is required when enabled')
    }

    return { valid: errors.length === 0, errors }
  }

  getRequiredFields(): string[] {
    return ['pixelConfig.pixelId', 'placements']
  }

  getOptionalFields(): string[] {
    return ['interests', 'enableAutoAdvancedMatching', 'enableLookalikeAudience', 'lookalikePercentage']
  }

  getDefaultSettings(): Record<string, any> {
    return getDefaultSettingsForPlatform('meta')
  }

  formatSettingsForAPI(): Record<string, any> {
    return {
      pixel_id: this.settings.pixelConfig.pixelId,
      tracking_events: this.settings.pixelConfig.trackingEvents,
      interests: this.settings.interests,
      placements: this.settings.placements,
      auto_advanced_matching: this.settings.enableAutoAdvancedMatching,
      lookalike_enabled: this.settings.enableLookalikeAudience,
      lookalike_percentage: this.settings.lookalikePercentage,
    }
  }
}

// ─── Google Adapter ───────────────────────────────────────────────────────────

export class GoogleAdapter implements PlatformAdapter {
  platform: Platform = 'google'
  settings: GoogleCampaignSettings

  constructor(settings?: Partial<GoogleCampaignSettings>) {
    this.settings = {
      keywords: [],
      placements: [],
      bidStrategy: 'maximize_conversions',
      enableDynamicSearchAds: false,
      ...settings,
    }
  }

  validateCampaignSettings(): { valid: boolean; errors: string[] } {
    const errors: string[] = []

    if (this.settings.keywords.length === 0) {
      errors.push('At least one keyword is required for Google Ads')
    }
    if (this.settings.bidStrategy === 'target_cpa' && !this.settings.targetCPA) {
      errors.push('Target CPA is required when using target CPA bid strategy')
    }
    if (this.settings.bidStrategy === 'target_roas' && !this.settings.targetROAS) {
      errors.push('Target ROAS is required when using target ROAS bid strategy')
    }

    return { valid: errors.length === 0, errors }
  }

  getRequiredFields(): string[] {
    return ['keywords', 'bidStrategy']
  }

  getOptionalFields(): string[] {
    return ['placements', 'targetCPA', 'targetROAS', 'enableDynamicSearchAds']
  }

  getDefaultSettings(): Record<string, any> {
    return getDefaultSettingsForPlatform('google')
  }

  formatSettingsForAPI(): Record<string, any> {
    return {
      keywords: this.settings.keywords.map(kw => ({
        text: kw.text,
        match_type: kw.matchType,
        bid_modifier: kw.bidModifier,
      })),
      placements: this.settings.placements,
      bid_strategy: this.settings.bidStrategy,
      target_cpa: this.settings.targetCPA,
      target_roas: this.settings.targetROAS,
      dynamic_search_ads: this.settings.enableDynamicSearchAds,
    }
  }
}

// ─── TikTok Adapter ───────────────────────────────────────────────────────────

export class TikTokAdapter implements PlatformAdapter {
  platform: Platform = 'tiktok'
  settings: TikTokCampaignSettings

  constructor(settings?: Partial<TikTokCampaignSettings>) {
    this.settings = {
      pixelConfig: { pixelId: '', events: [] },
      interests: [],
      placements: ['feed'],
      enableAutoTargeting: true,
      ...settings,
    }
  }

  validateCampaignSettings(): { valid: boolean; errors: string[] } {
    const errors: string[] = []

    if (!this.settings.pixelConfig.pixelId) {
      errors.push('TikTok Pixel ID is required')
    }
    if (this.settings.placements.length === 0) {
      errors.push('At least one placement must be selected')
    }

    return { valid: errors.length === 0, errors }
  }

  getRequiredFields(): string[] {
    return ['pixelConfig.pixelId', 'placements']
  }

  getOptionalFields(): string[] {
    return ['interests', 'enableAutoTargeting', 'lookalikeAudience']
  }

  getDefaultSettings(): Record<string, any> {
    return getDefaultSettingsForPlatform('tiktok')
  }

  formatSettingsForAPI(): Record<string, any> {
    return {
      pixel_id: this.settings.pixelConfig.pixelId,
      events: this.settings.pixelConfig.events,
      interests: this.settings.interests,
      placements: this.settings.placements,
      auto_targeting: this.settings.enableAutoTargeting,
      lookalike_audience: this.settings.lookalikeAudience,
    }
  }
}

// ─── Yandex Adapter ───────────────────────────────────────────────────────────

export class YandexAdapter implements PlatformAdapter {
  platform: Platform = 'yandex'
  settings: YandexCampaignSettings

  constructor(settings?: Partial<YandexCampaignSettings>) {
    this.settings = {
      keywords: [],
      bidStrategy: 'auto_budget',
      deviceTargeting: { desktop: true, mobile: true, tablet: true },
      region: 'US',
      useContextualPlacement: true,
      ...settings,
    }
  }

  validateCampaignSettings(): { valid: boolean; errors: string[] } {
    const errors: string[] = []

    if (this.settings.keywords.length === 0) {
      errors.push('At least one keyword is required for Yandex Direct')
    }
    if (!this.settings.region) {
      errors.push('Region is required for Yandex Direct')
    }

    return { valid: errors.length === 0, errors }
  }

  getRequiredFields(): string[] {
    return ['keywords', 'region']
  }

  getOptionalFields(): string[] {
    return ['bidStrategy', 'deviceTargeting', 'useContextualPlacement']
  }

  getDefaultSettings(): Record<string, any> {
    return getDefaultSettingsForPlatform('yandex')
  }

  formatSettingsForAPI(): Record<string, any> {
    return {
      keywords: this.settings.keywords.map(kw => ({
        text: kw.text,
        bid: kw.bid,
        contextual_bid: kw.contextualBid,
      })),
      bid_strategy: this.settings.bidStrategy,
      device_targeting: this.settings.deviceTargeting,
      region: this.settings.region,
      contextual_placement: this.settings.useContextualPlacement,
    }
  }
}

// ─── Factory Function ─────────────────────────────────────────────────────────

export function createPlatformAdapter(
  platform: Platform,
  settings?: Record<string, any>
): PlatformAdapter {
  switch (platform) {
    case 'meta':
      return new MetaAdapter(settings as Partial<MetaCampaignSettings>)
    case 'google':
      return new GoogleAdapter(settings as Partial<GoogleCampaignSettings>)
    case 'tiktok':
      return new TikTokAdapter(settings as Partial<TikTokCampaignSettings>)
    case 'yandex':
      return new YandexAdapter(settings as Partial<YandexCampaignSettings>)
    default:
      throw new Error(`Unknown platform: ${platform}`)
  }
}

// ─── Campaign Validator ────────────────────────────────────────────────────────

export interface CampaignValidationResult {
  valid: boolean
  errors: Record<string, string[]>
}

export function validateCampaignForPlatforms(
  platforms: Platform[],
  budgetType: string,
  dailyBudget: number,
  platformConfigs: Record<Platform, Record<string, any>>
): CampaignValidationResult {
  const errors: Record<string, string[]> = {}

  for (const platform of platforms) {
    const platformErrors: string[] = []

    // Validate budget type
    if (!validateBudgetTypeForPlatform(platform, budgetType)) {
      platformErrors.push(`Budget type ${budgetType} is not supported on ${platform}`)
    }

    // Validate daily budget
    const budgetValidation = validateDailyBudget(platform, dailyBudget)
    if (!budgetValidation.valid && budgetValidation.error) {
      platformErrors.push(budgetValidation.error)
    }

    // Validate platform-specific settings
    const adapter = createPlatformAdapter(platform, platformConfigs[platform])
    const settingsValidation = adapter.validateCampaignSettings()
    if (!settingsValidation.valid) {
      platformErrors.push(...settingsValidation.errors)
    }

    if (platformErrors.length > 0) {
      errors[platform] = platformErrors
    }
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  }
}
