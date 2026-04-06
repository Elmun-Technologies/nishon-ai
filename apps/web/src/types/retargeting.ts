// ─── Audience Types ────────────────────────────────────────────────────────

export type AudienceType = 'visitors' | 'engaged' | 'customers' | 'lookalike' | 'custom'

export type FunnelStage = 'prospecting' | 'reengagement' | 'retargeting' | 'retention'

export interface Audience {
  id: string
  name: string
  type: AudienceType
  funnelStage: FunnelStage
  size: number          // estimated reach
  recencyDays: number   // last N days
  description: string
  isActive: boolean
  createdAt: string
}

// ─── Campaign Types ─────────────────────────────────────────────────────────

export type CampaignStatus = 'active' | 'paused' | 'draft' | 'ended'
export type BudgetType = 'CBO' | 'ABO'
export type Platform = 'meta' | 'google' | 'tiktok' | 'yandex'

export interface RetargetingCampaign {
  id: string
  name: string
  audienceId: string
  funnelStage: FunnelStage
  platform: Platform
  budgetType: BudgetType
  dailyBudget: number
  totalBudget: number
  status: CampaignStatus
  startDate: string
  endDate?: string
  createdAt: string
}

// ─── Funnel Types ────────────────────────────────────────────────────────────

export interface FunnelStep {
  stage: FunnelStage
  label: string
  description: string
  audiences: Audience[]
  campaigns: RetargetingCampaign[]
  color: string
}

// ─── Analytics Types ─────────────────────────────────────────────────────────

export interface AudienceMetrics {
  audienceId: string
  impressions: number
  clicks: number
  conversions: number
  spend: number
  ctr: number    // click-through rate %
  cpc: number    // cost per click
  roas: number   // return on ad spend
  period: '7d' | '30d' | '90d'
}

// ─── Wizard Types ─────────────────────────────────────────────────────────────

export interface RetargetingWizardState {
  step: 1 | 2 | 3
  selectedAudience: Audience | null
  selectedPlatforms: Platform[]
  budgetType: BudgetType
  dailyBudget: number
  startDate: string
  endDate: string
  campaignName: string
}
