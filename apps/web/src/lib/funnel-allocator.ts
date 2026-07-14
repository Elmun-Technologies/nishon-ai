/**
 * Funnel budget allocator for the autonomous AI agent.
 *
 * Given a total budget and a business goal, distribute spend across the three
 * marketing-funnel stages and, within each stage, across the channels that fit
 * that goal:
 *
 *   TOFU — Top of Funnel   (cold audience / reach)
 *   MOFU — Middle of Funnel (consideration / engaged)
 *   BOFU — Bottom of Funnel (retargeting / conversion)
 *
 * Goal-specific plan (stage % + channels):
 *
 *   Sales  → TOFU 30% (Meta · TikTok) · MOFU 40% (Google · Telegram) · BOFU 30% (Retargeting)
 *   Brand  → TOFU 60% (Meta · YouTube) · MOFU 30% (Influencers · Telegram) · BOFU 10% (Search)
 *
 * Within a stage the budget splits evenly across its channels. Pure and
 * deterministic so it can be unit-tested and reused on the backend.
 */

export type AgentGoal = 'sales' | 'brand'

export type FunnelStage = 'TOFU' | 'MOFU' | 'BOFU'

export type Channel =
  | 'meta'
  | 'tiktok'
  | 'google'
  | 'telegram'
  | 'youtube'
  | 'influencers'
  | 'search'
  | 'retargeting'

export const CHANNEL_LABELS: Record<Channel, string> = {
  meta: 'Meta',
  tiktok: 'TikTok',
  google: 'Google',
  telegram: 'Telegram',
  youtube: 'YouTube',
  influencers: 'Influencers',
  search: 'Search',
  retargeting: 'Retargeting',
}

/** Hex accents for channel chips (kept close to each brand's hue). */
export const CHANNEL_HEX: Record<Channel, string> = {
  meta: '#3b82f6', // blue
  tiktok: '#d946ef', // fuchsia
  google: '#ef4444', // red
  telegram: '#0ea5e9', // sky
  youtube: '#dc2626', // red-600
  influencers: '#f59e0b', // amber
  search: '#10b981', // emerald
  retargeting: '#8b5cf6', // violet
}

export const STAGE_LABELS: Record<FunnelStage, { short: string; long: string }> = {
  TOFU: { short: 'TOFU', long: 'Top of Funnel — cold audience' },
  MOFU: { short: 'MOFU', long: 'Middle of Funnel — consideration' },
  BOFU: { short: 'BOFU', long: 'Bottom of Funnel — retargeting' },
}

/** Distinct hues for the three funnel stages (used by the donut / bars). */
export const STAGE_HEX: Record<FunnelStage, string> = {
  TOFU: '#3b82f6', // blue
  MOFU: '#8b5cf6', // violet
  BOFU: '#10b981', // emerald
}

interface StagePlan {
  pct: number
  channels: Channel[]
}

/** The goal-specific media plan. Each goal's stage percentages sum to 100. */
const PLAN: Record<AgentGoal, Record<FunnelStage, StagePlan>> = {
  sales: {
    TOFU: { pct: 30, channels: ['meta', 'tiktok'] },
    MOFU: { pct: 40, channels: ['google', 'telegram'] },
    BOFU: { pct: 30, channels: ['retargeting'] },
  },
  brand: {
    TOFU: { pct: 60, channels: ['meta', 'youtube'] },
    MOFU: { pct: 30, channels: ['influencers', 'telegram'] },
    BOFU: { pct: 10, channels: ['search'] },
  },
}

const STAGE_ORDER: FunnelStage[] = ['TOFU', 'MOFU', 'BOFU']

export interface ChannelSlice {
  channel: Channel
  label: string
  amount: number
}

export interface StageAllocation {
  stage: FunnelStage
  label: { short: string; long: string }
  /** Percent of the *total* budget (0-100). */
  pct: number
  amount: number
  colorHex: string
  channels: ChannelSlice[]
}

export interface ChannelTotal {
  channel: Channel
  label: string
  amount: number
  /** Percent of the *total* budget (0-100). */
  pct: number
}

export interface FunnelAllocation {
  goal: AgentGoal
  totalBudget: number
  stages: StageAllocation[]
  byChannel: ChannelTotal[]
}

/** Round to whole units, then fix rounding drift onto the largest bucket. */
function distributeRounded(total: number, weights: number[]): number[] {
  const weightSum = weights.reduce((a, b) => a + b, 0)
  if (weightSum <= 0 || total <= 0) return weights.map(() => 0)
  const rounded = weights.map((w) => Math.round((w / weightSum) * total))
  const drift = total - rounded.reduce((a, b) => a + b, 0)
  if (drift !== 0) {
    let largest = 0
    for (let i = 1; i < rounded.length; i += 1) {
      if (rounded[i] > rounded[largest]) largest = i
    }
    rounded[largest] += drift
  }
  return rounded
}

/** Normalize any legacy/unknown goal (e.g. stored "awareness") to a valid goal. */
export function normalizeGoal(goal: string | undefined): AgentGoal {
  return goal === 'brand' || goal === 'awareness' ? 'brand' : 'sales'
}

/**
 * Allocate a total budget across funnel stages and channels for a goal.
 * Amounts are integers and reconcile exactly to `totalBudget` at every level.
 */
export function allocateFunnelBudget(opts: {
  goal: AgentGoal
  totalBudget: number
}): FunnelAllocation {
  const goal = opts.goal
  const totalBudget = Math.max(0, Math.round(opts.totalBudget || 0))
  const plan = PLAN[goal]

  const stageAmounts = distributeRounded(
    totalBudget,
    STAGE_ORDER.map((s) => plan[s].pct),
  )

  const channelTotals = new Map<Channel, number>()

  const stages: StageAllocation[] = STAGE_ORDER.map((stage, i) => {
    const amount = stageAmounts[i]
    const chans = plan[stage].channels
    const chanAmounts = distributeRounded(
      amount,
      chans.map(() => 1),
    )
    const channels: ChannelSlice[] = chans.map((channel, j) => {
      channelTotals.set(channel, (channelTotals.get(channel) ?? 0) + chanAmounts[j])
      return { channel, label: CHANNEL_LABELS[channel], amount: chanAmounts[j] }
    })
    return {
      stage,
      label: STAGE_LABELS[stage],
      pct: plan[stage].pct,
      amount,
      colorHex: STAGE_HEX[stage],
      channels,
    }
  })

  const byChannel: ChannelTotal[] = [...channelTotals.entries()].map(
    ([channel, amount]) => ({
      channel,
      label: CHANNEL_LABELS[channel],
      amount,
      pct: totalBudget > 0 ? Math.round((amount / totalBudget) * 100) : 0,
    }),
  )

  return { goal, totalBudget, stages, byChannel }
}
