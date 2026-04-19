import apiClient from './api-client'
import { env } from './env'

// ─── Types ────────────────────────────────────────────────────────────────────

export type MetaHealthScore = 'GOOD' | 'AVERAGE' | 'BAD'
export type MetaCampaignAction = 'SCALE' | 'MONITOR' | 'STOP' | 'KILL'

export type MetaDashboardCampaign = {
  id: string
  name: string
  status: string
  metrics: {
    spend: number
    clicks: number
    impressions: number
    ctr: number
    cpc: number
  }
  ai: {
    health: MetaHealthScore
    action: MetaCampaignAction
    reason: string
  }
}

export type MetaDashboardAccount = {
  id: string
  name: string
  currency: string | null
  timezone: string | null
  campaigns: MetaDashboardCampaign[]
}

export type MetaDashboard = {
  workspaceId: string
  accounts: MetaDashboardAccount[]
}

export type SyncResult = {
  success: boolean
  accountsSynced: number
  campaignsSynced: number
  insightRowsSynced: number
  errors: string[]
}

// ─── OAuth ────────────────────────────────────────────────────────────────────

/**
 * Starts the Meta OAuth flow by redirecting the browser to the backend.
 * Must be a full page redirect — NOT fetch().
 *
 * workspaceId is required: the backend encodes it in OAuth state so the
 * callback knows which workspace to save the token to.
 */
export function buildMetaConnectUrl(workspaceId: string, redirectTo?: string): string | null {
  if (!workspaceId) {
    console.error('[AdSpectr] connectMeta: workspaceId is required')
    return null
  }

  const backendUrl = env.apiBaseUrl.replace(/\/$/, '')
  const url = new URL(`${backendUrl}/meta/connect`)
  url.searchParams.set('workspaceId', workspaceId)
  if (redirectTo) url.searchParams.set('redirectTo', redirectTo)

  return url.toString()
}

export function connectMeta(workspaceId: string): void {
  const redirectTo =
    typeof window !== 'undefined' ? `${window.location.origin}/settings/meta` : undefined
  const url = buildMetaConnectUrl(workspaceId, redirectTo)
  if (!url || typeof window === 'undefined') return
  window.location.href = url
}

// ─── API calls (authenticated via JWT in api-client) ─────────────────────────

/**
 * Returns the full Meta dashboard for a workspace:
 * ad accounts → campaigns → aggregated metrics + AI analysis.
 * Throws if the workspace has no connected Meta account.
 */
export async function fetchMetaDashboard(workspaceId: string): Promise<MetaDashboard> {
  const res = await apiClient.get<MetaDashboard>(
    `/meta/dashboard?workspaceId=${encodeURIComponent(workspaceId)}`,
  )
  return res.data
}

/**
 * Triggers a full Meta Ads sync for a workspace.
 * Fetches all ad accounts, campaigns, and daily insights from the Graph API
 * and upserts them into the local database.
 */
export async function triggerSync(workspaceId: string): Promise<SyncResult> {
  const res = await apiClient.post<{ success: boolean; result: SyncResult }>(
    '/meta/sync',
    { workspaceId },
  )
  return res.data.result
}
