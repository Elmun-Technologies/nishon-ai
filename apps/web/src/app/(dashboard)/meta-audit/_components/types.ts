export type AuditTab = 'meta' | 'targeting' | 'auction' | 'geo' | 'creative' | 'adcopy'
export type KpiMode = 'roas' | 'leads' | 'spend' | 'ctr' | 'clicks'
export type Persona = 'owner' | 'specialist'
export type DateRange = '7' | '30' | 'month' | 'custom'

export interface CampaignMetrics {
  spend: number
  clicks: number
  impressions: number
  ctr: number
  cpc: number
}

export interface ReportCampaign {
  id: string
  name: string
  status: string
  objective: string | null
  metrics: CampaignMetrics
}

export interface ReportAccount {
  id: string
  name: string
  currency: string
  campaigns: ReportCampaign[]
}

export interface ReportData {
  workspaceId: string
  days: number
  accounts: ReportAccount[]
}

export interface LiveCampaignRow {
  id: string
  name: string
  status: string
  spend: number
  clicks: number
  impressions: number
  ctr: number
  cpc: number
  accountName: string
  currency: string
}

export interface AuditFindings {
  facts: string[]
  risks: string[]
  actions: string[]
}

export interface LiveTotals {
  spend: number
  clicks: number
  impressions: number
  ctr: number
  currency: string
}
