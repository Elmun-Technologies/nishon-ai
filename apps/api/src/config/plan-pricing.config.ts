import { UserPlan } from "../users/entities/user.entity";

/**
 * Monthly subscription prices in UZS (O'zbek so'mi).
 * Payme works in **tiyin** (1 UZS = 100 tiyin), so we store
 * the human-readable UZS amount here and convert at payment time.
 *
 * FREE plan has price 0 — no payment needed.
 */
// These MUST match the prices shown to the user in the web app
// (apps/web/src/lib/subscription-plans.ts) — the frontend is the single source
// of truth for displayed pricing, and Payme charges from this table, so any
// divergence means the user is charged a different amount than they saw.
export const PLAN_PRICES_UZS: Record<UserPlan, number> = {
  [UserPlan.FREE]: 0,
  [UserPlan.STARTER]: 199_000, // matches web 'starter'
  [UserPlan.GROWTH]: 499_000, // web has no 'growth' tier; kept for legacy rows
  [UserPlan.PRO]: 499_000, // matches web 'pro' (499,000 UZS)
  [UserPlan.AGENCY]: 1_199_000, // matches web 'agency' (1,199,000 UZS)
};

/** Convert UZS to tiyin (Payme unit) */
export function uzsToTiyin(uzs: number): number {
  return uzs * 100;
}

/** Convert tiyin back to UZS for display */
export function tiyinToUzs(tiyin: number): number {
  return tiyin / 100;
}

/** Get price in tiyin for a plan (Payme-ready) */
export function getPlanPriceTiyin(plan: UserPlan): number {
  return uzsToTiyin(PLAN_PRICES_UZS[plan] ?? 0);
}
