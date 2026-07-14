/**
 * Funnel budget allocator for the autonomous AI agent.
 *
 * Given a total budget and a single business goal, distribute spend across the
 * three marketing-funnel stages and then across the ad platforms the agent can
 * buy on:
 *
 *   TOFU — Top of Funnel   (cold audience / reach)
 *   MOFU — Middle of Funnel (consideration / engaged)
 *   BOFU — Bottom of Funnel (retargeting / conversion)
 *
 * Platforms: Meta, Google, TikTok, Telegram.
 *
 * This is the programmatic mapper the agent uses to turn "3 inputs" (link +
 * goal + budget) into a concrete, per-platform, per-stage media plan. It is
 * pure and deterministic so it can be unit-tested and reused on the backend.
 */

export type AgentGoal = 'sales' | 'awareness'

export type FunnelStage = 'TOFU' | 'MOFU' | 'BOFU'

export type AdPlatform = 'meta' | 'google' | 'tiktok' | 'telegram'

export const PLATFORMS: readonly AdPlatform[] = ['meta', 'google', 'tiktok', 'telegram']

export const PLATFORM_LABELS: Record<AdPlatform, string> = {
  meta: 'Meta',
  google: 'Google',
  tiktok: 'TikTok',
  telegram: 'Telegram',
}

export const STAGE_LABELS: Record<FunnelStage, { short: string; long: string }> = {
  TOFU: { short: 'TOFU', long: 'Top of Funnel — cold audience' },
  MOFU: { short: 'MOFU', long: 'Middle of Funnel — consideration' },
  BOFU: { short: 'BOFU', long: 'Bottom of Funnel — retargeting' },
}

/**
 * How much of the total budget each funnel stage receives, per goal.
 * Each row sums to 100.
 *
 * - awareness → weight the top of the funnel (build cold reach)
 * - sales     → weight the bottom of the funnel (harvest intent + retarget)
 */
const STAGE_SPLIT: Record<AgentGoal, Record<FunnelStage, number>> = {
  awareness: { TOFU: 60, MOFU: 30, BOFU: 10 },
  sales: { TOFU: 30, MOFU: 30, BOFU: 40 },
}

/**
 * Within a stage, how spend is split across platforms. Each row sums to 100.
 * Reflects where each platform performs best across the journey:
 * - TOFU: broad video/reach → Meta + TikTok lead
 * - MOFU: intent + engagement → Meta + Google
 * - BOFU: conversion + retargeting → Meta + Google, Telegram for warm re-engage
 */
const STAGE_PLATFORM_WEIGHTS: Record<FunnelStage, Record<AdPlatform, number>> = {
  TOFU: { meta: 40, tiktok: 30, google: 15, telegram: 15 },
  MOFU: { meta: 35, google: 35, tiktok: 15, telegram: 15 },
  BOFU: { meta: 40, google: 40, telegram: 15, tiktok: 5 },
}

export interface PlatformSlice {
  platform: AdPlatform
  /** Percent of the *stage* budget (0-100). */
  stagePct: number
  amount: number
}

export interface StageAllocation {
  stage: FunnelStage
  label: { short: string; long: string }
  /** Percent of the *total* budget (0-100). */
  pct: number
  amount: number
  platforms: PlatformSlice[]
}

export interface PlatformTotal {
  platform: AdPlatform
  label: string
  amount: number
  /** Percent of the *total* budget (0-100). */
  pct: number
}

export interface FunnelAllocation {
  goal: AgentGoal
  totalBudget: number
  stages: StageAllocation[]
  byPlatform: PlatformTotal[]
}

/** Round to whole currency units, then fix rounding drift onto the largest bucket. */
function distributeRounded(total: number, weights: number[]): number[] {
  const weightSum = weights.reduce((a, b) => a + b, 0)
  if (weightSum <= 0 || total <= 0) return weights.map(() => 0)
  const raw = weights.map((w) => (w / weightSum) * total)
  const rounded = raw.map((n) => Math.round(n))
  const drift = total - rounded.reduce((a, b) => a + b, 0)
  if (drift !== 0) {
    // Push the leftover onto the largest allocation so the parts sum to `total`.
    let largest = 0
    for (let i = 1; i < rounded.length; i += 1) {
      if (rounded[i] > rounded[largest]) largest = i
    }
    rounded[largest] += drift
  }
  return rounded
}

/**
 * Allocate a total budget across funnel stages and platforms for a given goal.
 * Amounts are integers and reconcile exactly to `totalBudget` at every level.
 */
export function allocateFunnelBudget(opts: {
  goal: AgentGoal
  totalBudget: number
}): FunnelAllocation {
  const goal = opts.goal
  const totalBudget = Math.max(0, Math.round(opts.totalBudget || 0))

  const stageKeys: FunnelStage[] = ['TOFU', 'MOFU', 'BOFU']
  const stagePcts = stageKeys.map((s) => STAGE_SPLIT[goal][s])
  const stageAmounts = distributeRounded(totalBudget, stagePcts)

  const platformTotals: Record<AdPlatform, number> = {
    meta: 0,
    google: 0,
    tiktok: 0,
    telegram: 0,
  }

  const stages: StageAllocation[] = stageKeys.map((stage, i) => {
    const stageAmount = stageAmounts[i]
    const platformWeights = PLATFORMS.map((p) => STAGE_PLATFORM_WEIGHTS[stage][p])
    const platformAmounts = distributeRounded(stageAmount, platformWeights)

    const platforms: PlatformSlice[] = PLATFORMS.map((platform, j) => {
      platformTotals[platform] += platformAmounts[j]
      return {
        platform,
        stagePct: STAGE_PLATFORM_WEIGHTS[stage][platform],
        amount: platformAmounts[j],
      }
    })

    return {
      stage,
      label: STAGE_LABELS[stage],
      pct: STAGE_SPLIT[goal][stage],
      amount: stageAmount,
      platforms,
    }
  })

  const byPlatform: PlatformTotal[] = PLATFORMS.map((platform) => ({
    platform,
    label: PLATFORM_LABELS[platform],
    amount: platformTotals[platform],
    pct: totalBudget > 0 ? Math.round((platformTotals[platform] / totalBudget) * 100) : 0,
  }))

  return { goal, totalBudget, stages, byPlatform }
}
