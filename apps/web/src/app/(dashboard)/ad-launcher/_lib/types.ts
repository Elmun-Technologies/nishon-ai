/**
 * Ad Launcher domain types.
 *
 * The Ad Launcher is a 3-step flow:
 *   1. Source — pick a connected Meta ad account + date range.
 *   2. Pick   — browse synced ads from that account, select any.
 *   3. Launch — push the selected ads into a fresh launch job
 *               (creates a new Meta campaign via /launch-orchestrator).
 *
 * No mock data leaks into live usage. When the user is signed in via the
 * Demo flow we surface a clearly-labeled curated dataset and lock the
 * final launch behind a sign-up CTA.
 */

export type StepId = 'source' | 'pick' | 'launch'

export type DateRangeId = '7d' | '30d' | '90d'

export type StatusFilter = 'ALL' | 'ACTIVE' | 'PAUSED'

export type SortKey = 'name' | 'status' | 'spend' | 'clicks' | 'ctr' | 'cpc' | 'aiHealth'
export type SortDir = 'asc' | 'desc'

export type AccountSummary = {
  id: string
  name: string
  currency: string | null
  timezone: string | null
  campaignCount: number
}

export type CampaignRow = {
  id: string
  accountId: string
  name: string
  status: string
  spend: number
  clicks: number
  impressions: number
  ctr: number
  cpc: number
  aiHealth: 'GOOD' | 'AVERAGE' | 'BAD'
  aiAction: 'SCALE' | 'MONITOR' | 'STOP' | 'KILL'
  aiReason: string
}

export type LaunchObjective =
  | 'OUTCOME_SALES'
  | 'OUTCOME_LEADS'
  | 'OUTCOME_TRAFFIC'
  | 'OUTCOME_ENGAGEMENT'
  | 'OUTCOME_AWARENESS'

export type AudiencePresetId =
  | 'prospecting'
  | 'reengagement'
  | 'retargeting'
  | 'retention'

export type TargetingConfig = {
  /** ISO 3166-1 alpha-2 codes (UZ, RU, KZ, US...) */
  countries: string[]
  ageMin: number
  ageMax: number
  /** Meta encoding: 1=male, 2=female, empty=all */
  genders: number[]
}

export type LaunchConfig = {
  objective: LaunchObjective
  budgetType: 'ABO' | 'CBO'
  dailyBudget: number
  audiences: AudiencePresetId[]
  splitByFunnelStage: boolean
  targeting: TargetingConfig
  /** When true, copy creatives from the selected source campaigns onto the new ad sets. */
  copyCreatives: boolean
}

export type LaunchPhase =
  | { state: 'idle' }
  | { state: 'creating_draft' }
  | { state: 'validating'; jobId: string }
  | { state: 'launching'; jobId: string }
  | { state: 'success'; jobId: string; metaCampaignId?: string }
  | { state: 'error'; message: string; jobId?: string }

export type HistoryItem = {
  id: string
  status: string
  objective: string
  audiences: string[]
  budgetType: 'CBO' | 'ABO'
  createdAt: string
  metaCampaignId?: string
  error?: string | null
}
