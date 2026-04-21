import type { RentRequest, RevenueSplit } from '../types'
import { DEFAULT_REVENUE_SPLIT } from './list'

const DEFAULT_SPLIT: RevenueSplit = {
  targetologistPct: DEFAULT_REVENUE_SPLIT.targetologistPct,
  platformPct: DEFAULT_REVENUE_SPLIT.platformPct,
}

export function estimateMonthlyRevenueUsd(monthlyPrice: number, split: RevenueSplit = DEFAULT_SPLIT): {
  toTargetologist: number
  toPlatform: number
} {
  const t = (monthlyPrice * split.targetologistPct) / 100
  const p = (monthlyPrice * split.platformPct) / 100
  return { toTargetologist: Math.round(t * 100) / 100, toPlatform: Math.round(p * 100) / 100 }
}

export function validateRentRequest(body: Partial<RentRequest>): body is RentRequest {
  return Boolean(body.listingId && body.businessWorkspaceId)
}
