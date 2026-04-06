// ─── Platform Feature Types ───────────────────────────────────────────────────

export type Platform = 'meta' | 'google' | 'tiktok' | 'yandex'

export type FeatureType =
  | 'keywords'          // Google, Yandex
  | 'interests'         // Meta, TikTok
  | 'placements'        // Meta, Google, TikTok
  | 'pixel_tracking'    // Meta, TikTok
  | 'conversion_events' // Meta
  | 'audience_network'  // Meta
  | 'matched_audiences' // Google, Meta
  | 'contextual'        // Google, Yandex
  | 'lookalike'         // Meta, TikTok
  | 'retargeting_tags'  // All platforms
  | 'device_targeting'  // All platforms
  | 'schedule_options'  // All platforms

export type BudgetOptimization =
  | 'ABO'  // Ad Set Budget Optimization (Meta, TikTok, Yandex)
  | 'CBO'  // Campaign Budget Optimization (Meta, Google, TikTok)
  | 'daily_budget'  // Google Ads standard

// ─── Platform Configuration ───────────────────────────────────────────────────

export interface PlatformFeature {
  id: FeatureType
  label: string
  description: string
  required: boolean
  configurable: boolean
}

export interface PlatformConfig {
  id: Platform
  name: string
  fullName: string
  icon: string
  color: string
  supportedBudgetTypes: BudgetOptimization[]
  defaultBudgetType: BudgetOptimization
  minDailyBudget: number
  maxDailyBudget: number
  supportedFeatures: FeatureType[]
  requiredFeatures: FeatureType[]
  capabilities: {
    supportsPixelTracking: boolean
    supportsConversionEvents: boolean
    supportsKeywordTargeting: boolean
    supportsInterestTargeting: boolean
    supportsPlacementTargeting: boolean
    supportsLookalike: boolean
    supportsAudienceNetwork: boolean
    supportsAutoOptimization: boolean
    maxAudiencesPerCampaign: number
    allowsMultipleAdSets: boolean
  }
}

// ─── Platform Configuration Database ──────────────────────────────────────────

export const PLATFORM_CONFIGS: Record<Platform, PlatformConfig> = {
  meta: {
    id: 'meta',
    name: 'Meta',
    fullName: 'Meta (Facebook / Instagram)',
    icon: '📘',
    color: 'text-blue-600',
    supportedBudgetTypes: ['ABO', 'CBO'],
    defaultBudgetType: 'ABO',
    minDailyBudget: 5,
    maxDailyBudget: 10000,
    supportedFeatures: [
      'pixel_tracking',
      'conversion_events',
      'interests',
      'placements',
      'audience_network',
      'matched_audiences',
      'lookalike',
      'retargeting_tags',
      'device_targeting',
      'schedule_options',
    ],
    requiredFeatures: ['pixel_tracking'],
    capabilities: {
      supportsPixelTracking: true,
      supportsConversionEvents: true,
      supportsKeywordTargeting: false,
      supportsInterestTargeting: true,
      supportsPlacementTargeting: true,
      supportsLookalike: true,
      supportsAudienceNetwork: true,
      supportsAutoOptimization: true,
      maxAudiencesPerCampaign: 50,
      allowsMultipleAdSets: true,
    },
  },

  google: {
    id: 'google',
    name: 'Google',
    fullName: 'Google Ads',
    icon: '🔵',
    color: 'text-blue-500',
    supportedBudgetTypes: ['CBO', 'daily_budget'],
    defaultBudgetType: 'CBO',
    minDailyBudget: 10,
    maxDailyBudget: 50000,
    supportedFeatures: [
      'keywords',
      'contextual',
      'matched_audiences',
      'placements',
      'device_targeting',
      'schedule_options',
    ],
    requiredFeatures: ['keywords', 'matched_audiences'],
    capabilities: {
      supportsPixelTracking: false,
      supportsConversionEvents: false,
      supportsKeywordTargeting: true,
      supportsInterestTargeting: false,
      supportsPlacementTargeting: true,
      supportsLookalike: false,
      supportsAudienceNetwork: false,
      supportsAutoOptimization: true,
      maxAudiencesPerCampaign: 20,
      allowsMultipleAdSets: true,
    },
  },

  tiktok: {
    id: 'tiktok',
    name: 'TikTok',
    fullName: 'TikTok Ads',
    icon: '🎵',
    color: 'text-black',
    supportedBudgetTypes: ['ABO', 'CBO'],
    defaultBudgetType: 'CBO',
    minDailyBudget: 5,
    maxDailyBudget: 5000,
    supportedFeatures: [
      'pixel_tracking',
      'interests',
      'placements',
      'matched_audiences',
      'lookalike',
      'device_targeting',
      'schedule_options',
    ],
    requiredFeatures: ['pixel_tracking'],
    capabilities: {
      supportsPixelTracking: true,
      supportsConversionEvents: true,
      supportsKeywordTargeting: false,
      supportsInterestTargeting: true,
      supportsPlacementTargeting: true,
      supportsLookalike: true,
      supportsAudienceNetwork: false,
      supportsAutoOptimization: true,
      maxAudiencesPerCampaign: 30,
      allowsMultipleAdSets: true,
    },
  },

  yandex: {
    id: 'yandex',
    name: 'Yandex',
    fullName: 'Yandex Direct',
    icon: '🔴',
    color: 'text-red-600',
    supportedBudgetTypes: ['daily_budget', 'CBO'],
    defaultBudgetType: 'daily_budget',
    minDailyBudget: 50,
    maxDailyBudget: 100000,
    supportedFeatures: [
      'keywords',
      'contextual',
      'placements',
      'device_targeting',
      'schedule_options',
    ],
    requiredFeatures: ['keywords'],
    capabilities: {
      supportsPixelTracking: false,
      supportsConversionEvents: false,
      supportsKeywordTargeting: true,
      supportsInterestTargeting: false,
      supportsPlacementTargeting: true,
      supportsLookalike: false,
      supportsAudienceNetwork: false,
      supportsAutoOptimization: false,
      maxAudiencesPerCampaign: 10,
      allowsMultipleAdSets: false,
    },
  },
}

// ─── Helper Functions ─────────────────────────────────────────────────────────

export function getPlatformConfig(platform: Platform): PlatformConfig {
  return PLATFORM_CONFIGS[platform]
}

export function getPlatformsByFeature(feature: FeatureType): Platform[] {
  return (Object.entries(PLATFORM_CONFIGS) as [Platform, PlatformConfig][])
    .filter(([_, config]) => config.supportedFeatures.includes(feature))
    .map(([platform]) => platform)
}

export function isFeatureSupportedByPlatform(
  platform: Platform,
  feature: FeatureType
): boolean {
  return PLATFORM_CONFIGS[platform].supportedFeatures.includes(feature)
}

export function isFeatureRequiredByPlatform(
  platform: Platform,
  feature: FeatureType
): boolean {
  return PLATFORM_CONFIGS[platform].requiredFeatures.includes(feature)
}

export function validateBudgetTypeForPlatform(
  platform: Platform,
  budgetType: string
): boolean {
  const config = getPlatformConfig(platform)
  return config.supportedBudgetTypes.includes(budgetType as BudgetOptimization)
}

export function validateDailyBudget(platform: Platform, budget: number): {
  valid: boolean
  error?: string
} {
  const config = getPlatformConfig(platform)
  if (budget < config.minDailyBudget) {
    return {
      valid: false,
      error: `Minimum daily budget for ${config.name} is $${config.minDailyBudget}`,
    }
  }
  if (budget > config.maxDailyBudget) {
    return {
      valid: false,
      error: `Maximum daily budget for ${config.name} is $${config.maxDailyBudget}`,
    }
  }
  return { valid: true }
}
