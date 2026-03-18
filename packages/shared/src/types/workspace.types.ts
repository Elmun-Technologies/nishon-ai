import { AutopilotMode } from '../enums/autopilot-mode.enum'
import { CampaignObjective } from '../enums/campaign-status.enum'

export interface IWorkspace {
  id: string
  name: string
  industry: string
  productDescription: string
  targetAudience: string
  monthlyBudget: number
  goal: CampaignObjective
  autopilotMode: AutopilotMode
  aiStrategy: IAiStrategy | null
  isOnboardingComplete: boolean
  createdAt: Date
  updatedAt: Date
}

export interface IAiStrategy {
  summary: string
  recommendedPlatforms: string[]
  budgetAllocation: Record<string, number>  // e.g. { meta: 60, google: 40 }
  targetingRecommendations: string[]
  estimatedKpis: {
    cpa: number
    roas: number
    ctr: number
    monthlyLeads: number
  }
  creativeGuidelines: string[]
  generatedAt: Date
}