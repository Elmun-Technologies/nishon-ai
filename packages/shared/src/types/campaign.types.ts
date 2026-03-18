import { Platform } from '../enums/platform.enum'
import { CampaignStatus, CampaignObjective } from '../enums/campaign-status.enum'

export interface ICampaign {
  id: string
  name: string
  platform: Platform
  status: CampaignStatus
  objective: CampaignObjective
  dailyBudget: number
  totalBudget: number
  externalId: string | null
  startDate: Date | null
  endDate: Date | null
  createdAt: Date
  updatedAt: Date
}

export interface IPerformanceMetrics {
  impressions: number
  clicks: number
  spend: number
  conversions: number
  revenue: number
  ctr: number
  cpa: number
  roas: number
  cpm: number
}

export interface ICampaignWithMetrics extends ICampaign {
  metrics: IPerformanceMetrics
}