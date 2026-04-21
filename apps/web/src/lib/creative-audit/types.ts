/** 7 ustun — vaznlar onboarding dan kelishi mumkin (default = spec). */

export type AuditCriterionKey =
  | 'brandFit'
  | 'technical'
  | 'messageClarity'
  | 'audienceMatch'
  | 'platformFit'
  | 'visualQuality'
  | 'performancePrediction'

export const DEFAULT_AUDIT_WEIGHTS: Record<AuditCriterionKey, number> = {
  brandFit: 0.2,
  technical: 0.15,
  messageClarity: 0.2,
  audienceMatch: 0.15,
  platformFit: 0.1,
  visualQuality: 0.1,
  performancePrediction: 0.1,
}

export type ScoreBandKey = 'excellent' | 'good' | 'average' | 'poor'

export interface CriterionScore {
  key: AuditCriterionKey
  labelUz: string
  /** 0–100 */
  score: number
  weight: number
  checks: string
}

export interface AuditIssue {
  severity: 'error' | 'warning' | 'ok'
  message: string
}

export interface CreativeAuditResult {
  score: number
  band: ScoreBandKey
  bandLabelUz: string
  criteria: CriterionScore[]
  issues: AuditIssue[]
  suggestions: string[]
  /** Cloudinary yoki ichki */
  assetId?: string
  assetUrl?: string
  visionRaw?: Record<string, unknown>
  usedOpenAi: boolean
}

export type IntendedPlacement = 'feed_square' | 'feed_portrait' | 'story' | 'link_preview' | 'unknown'

export interface AuditOnboardingContext {
  brandPrimaryHex?: string
  /** Masalan 18-24 */
  audienceAgeMin?: number
  audienceAgeMax?: number
  intendedPlacement?: IntendedPlacement
  /** Signal bridge: o‘xshash kreativlar o‘rtacha ROAS (0–5) */
  historicalRoasSimilar?: number
}

export interface HumanAuditOverrides {
  /** Brand awareness — CTA majburiy emas */
  ignoreMissingCta?: boolean
  ignoreTextRatio?: boolean
  notes?: string
}
