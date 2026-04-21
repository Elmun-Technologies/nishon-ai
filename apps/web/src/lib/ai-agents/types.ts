/** Agentlar — yordamchi, boss emas (tavsiya + tasdiq). */

export type AgentLayer = 'platform' | 'targetologist' | 'business'

export type VerticalId = 'ecommerce' | 'course' | 'restaurant'

export type PlatformAgentRole = 'media_buyer' | 'creative' | 'analyst'

export interface PlatformAgentDef {
  id: PlatformAgentRole
  nameUz: string
  descriptionUz: string
  verticals: VerticalId[]
}

export interface TargetologistAgentDraft {
  name: string
  vertical: VerticalId
  /** Signal bridge / kampaniya ID lar (stub) */
  campaignIds: string[]
  rules: string
  toneUz: string
}

export interface AgentMemorySnapshot {
  business_id: string
  learnings: string[]
  rules: string[]
}

export interface StoreListing {
  id: string
  name: string
  author: string
  vertical: VerticalId
  priceMonthlyUsd: number
  pricePerActionUsd?: number
  testDaysRemaining?: number
  status: 'testing' | 'published'
}

export interface RentRequest {
  listingId: string
  businessWorkspaceId: string
}

export interface RevenueSplit {
  targetologistPct: number
  platformPct: number
}
