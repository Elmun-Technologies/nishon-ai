/**
 * Curated demo dataset used when the user is signed in via the
 * "Demo sign-in" flow. The numbers are realistic and diverse so the
 * full Ad Launcher experience can be showcased end-to-end without
 * ever calling Meta or our backend.
 *
 * All ids are prefixed with `demo-` and all visible names include a
 * `DEMO ·` prefix so they cannot be mistaken for live ads.
 */

import type {
  AccountSummary,
  CampaignRow,
} from './types'

export const DEMO_ACCOUNT: AccountSummary = {
  id: 'demo-act-1',
  name: 'DEMO · Brand Account',
  currency: 'USD',
  timezone: 'America/New_York',
  campaignCount: 7,
}

export const DEMO_CAMPAIGNS: CampaignRow[] = [
  {
    id: 'demo-c-1',
    accountId: DEMO_ACCOUNT.id,
    name: 'DEMO · Black Friday — Retargeting 30d',
    status: 'ACTIVE',
    spend: 4820.45,
    clicks: 15062,
    impressions: 358124,
    ctr: 4.21,
    cpc: 0.32,
    aiHealth: 'GOOD',
    aiAction: 'SCALE',
    aiReason: 'High CTR with low CPC across 30 days.',
  },
  {
    id: 'demo-c-2',
    accountId: DEMO_ACCOUNT.id,
    name: 'DEMO · Lead Gen — Lookalike 1%',
    status: 'ACTIVE',
    spend: 2140.0,
    clicks: 3692,
    impressions: 129543,
    ctr: 2.85,
    cpc: 0.58,
    aiHealth: 'AVERAGE',
    aiAction: 'MONITOR',
    aiReason: 'Stable performance — needs creative refresh in 7 days.',
  },
  {
    id: 'demo-c-3',
    accountId: DEMO_ACCOUNT.id,
    name: 'DEMO · Video Prospecting — Cold',
    status: 'ACTIVE',
    spend: 3210.6,
    clicks: 2864,
    impressions: 201580,
    ctr: 1.42,
    cpc: 1.12,
    aiHealth: 'BAD',
    aiAction: 'STOP',
    aiReason: 'CTR fell below 1.5% for 5 consecutive days.',
  },
  {
    id: 'demo-c-4',
    accountId: DEMO_ACCOUNT.id,
    name: 'DEMO · Reactivation — Past 90d Buyers',
    status: 'PAUSED',
    spend: 890.2,
    clicks: 1320,
    impressions: 42580,
    ctr: 3.1,
    cpc: 0.41,
    aiHealth: 'GOOD',
    aiAction: 'MONITOR',
    aiReason: 'Healthy ROAS but limited audience size.',
  },
  {
    id: 'demo-c-5',
    accountId: DEMO_ACCOUNT.id,
    name: 'DEMO · Carousel — Catalog Sales',
    status: 'ACTIVE',
    spend: 5640.3,
    clicks: 7821,
    impressions: 381500,
    ctr: 2.05,
    cpc: 0.76,
    aiHealth: 'AVERAGE',
    aiAction: 'SCALE',
    aiReason: 'Steady ROAS — capacity for +20% budget.',
  },
  {
    id: 'demo-c-6',
    accountId: DEMO_ACCOUNT.id,
    name: 'DEMO · UGC Creators Feed',
    status: 'PAUSED',
    spend: 1230.0,
    clicks: 5021,
    impressions: 100820,
    ctr: 4.98,
    cpc: 0.29,
    aiHealth: 'GOOD',
    aiAction: 'SCALE',
    aiReason: 'Top CTR — relaunch with higher budget.',
  },
  {
    id: 'demo-c-7',
    accountId: DEMO_ACCOUNT.id,
    name: 'DEMO · Awareness Lift — Q4',
    status: 'PAUSED',
    spend: 720.0,
    clicks: 612,
    impressions: 66520,
    ctr: 0.92,
    cpc: 1.45,
    aiHealth: 'BAD',
    aiAction: 'KILL',
    aiReason: 'Below benchmark CTR for awareness in this niche.',
  },
]

export type DemoLaunchHistoryItem = {
  id: string
  status: 'launched' | 'failed' | 'draft'
  objective: string
  audiences: string[]
  budgetType: 'CBO' | 'ABO'
  createdAt: string
  metaCampaignId?: string
  error?: string | null
}

const day = 86400 * 1000
const now = Date.now()

export const DEMO_LAUNCH_HISTORY: DemoLaunchHistoryItem[] = [
  {
    id: 'demo-job-1',
    status: 'launched',
    objective: 'OUTCOME_SALES',
    audiences: ['retargeting', 'prospecting'],
    budgetType: 'CBO',
    createdAt: new Date(now - 1 * day).toISOString(),
    metaCampaignId: '120214192783690',
  },
  {
    id: 'demo-job-2',
    status: 'launched',
    objective: 'OUTCOME_LEADS',
    audiences: ['prospecting'],
    budgetType: 'ABO',
    createdAt: new Date(now - 4 * day).toISOString(),
    metaCampaignId: '120214145720001',
  },
  {
    id: 'demo-job-3',
    status: 'failed',
    objective: 'OUTCOME_TRAFFIC',
    audiences: ['retention'],
    budgetType: 'CBO',
    createdAt: new Date(now - 7 * day).toISOString(),
    error: 'No active Meta account connected for workspace',
  },
]
