/**
 * Ad Launcher domain types.
 *
 * The Ad Launcher is a 3-step flow:
 *   1. Source — pick a connected Meta ad account + date range.
 *   2. Pick   — browse synced campaigns from that account, select any.
 *   3. Launch — push the selected campaigns into a fresh launch job
 *               (creates a new Meta campaign via /launch-orchestrator).
 *
 * No mock data. If Meta is not connected or the workspace has no synced data,
 * the UI shows an explicit empty state with a CTA — never fake numbers.
 */

export type StepId = 'source' | 'pick' | 'launch'

export type DateRangeId = '7d' | '30d' | '90d'

export type StatusFilter = 'ALL' | 'ACTIVE' | 'PAUSED'

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

export type LaunchConfig = {
  objective: LaunchObjective
  budgetType: 'ABO' | 'CBO'
  dailyBudget: number
  audiences: AudiencePresetId[]
  splitByFunnelStage: boolean
}

export type LaunchPhase =
  | { state: 'idle' }
  | { state: 'creating_draft' }
  | { state: 'validating'; jobId: string }
  | { state: 'launching'; jobId: string }
  | { state: 'success'; jobId: string; metaCampaignId?: string }
  | { state: 'error'; message: string; jobId?: string }
