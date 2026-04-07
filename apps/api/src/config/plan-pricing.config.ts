import { UserPlan } from '../users/entities/user.entity'

/**
 * Monthly subscription prices in UZS (O'zbek so'mi).
 * Payme works in **tiyin** (1 UZS = 100 tiyin), so we store
 * the human-readable UZS amount here and convert at payment time.
 *
 * FREE plan has price 0 — no payment needed.
 */
export const PLAN_PRICES_UZS: Record<UserPlan, number> = {
  [UserPlan.FREE]: 0,
  [UserPlan.STARTER]: 199_000,   // 199,000 UZS / ~$15
  [UserPlan.GROWTH]: 499_000,    // 499,000 UZS / ~$38
  [UserPlan.PRO]: 999_000,       // 999,000 UZS / ~$77
  [UserPlan.AGENCY]: 2_499_000,  // 2,499,000 UZS / ~$192
}

/** Convert UZS to tiyin (Payme unit) */
export function uzsToTiyin(uzs: number): number {
  return uzs * 100
}

/** Convert tiyin back to UZS for display */
export function tiyinToUzs(tiyin: number): number {
  return tiyin / 100
}

/** Get price in tiyin for a plan (Payme-ready) */
export function getPlanPriceTiyin(plan: UserPlan): number {
  return uzsToTiyin(PLAN_PRICES_UZS[plan] ?? 0)
}
