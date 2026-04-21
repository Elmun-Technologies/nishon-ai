/**
 * Tezkor onboarding (v2): 3 daqiqada — biznes turi, maqsad, pixel, byudjet.
 * localStorage: `adspectr-onboarding-v2`
 * Ro‘yxatdan o‘tish: pre-auth draft ga map qilinadi (`markPreAuthOnboardingComplete`).
 */

import { markPreAuthOnboardingComplete, savePreAuthOnboardingDraft, type PreAuthOnboardingDraft } from '@/lib/pre-auth-onboarding'

export const ONBOARDING_V2_KEY = 'adspectr-onboarding-v2'

export type BusinessTypeV2 = 'shop' | 'course' | 'restaurant' | 'service' | 'other'
export type GoalV2 = 'sales' | 'leads' | 'awareness'
export type PixelModeV2 = 'has_pixel' | 'help' | 'skipped'

export interface OnboardingV2State {
  step: number
  businessType: BusinessTypeV2 | ''
  goal: GoalV2 | ''
  pixelMode: PixelModeV2 | ''
  pixelId: string | null
  dailyBudgetUzs: number
  telegram: string
}

export const DEFAULT_ONBOARDING_V2: OnboardingV2State = {
  step: 0,
  businessType: '',
  goal: '',
  pixelMode: '',
  pixelId: null,
  dailyBudgetUzs: 100_000,
  telegram: '',
}

export function loadOnboardingV2(): OnboardingV2State {
  if (typeof window === 'undefined') return { ...DEFAULT_ONBOARDING_V2 }
  try {
    const raw = localStorage.getItem(ONBOARDING_V2_KEY)
    if (!raw) return { ...DEFAULT_ONBOARDING_V2 }
    const p = JSON.parse(raw) as Partial<OnboardingV2State>
    return {
      ...DEFAULT_ONBOARDING_V2,
      ...p,
      step: typeof p.step === 'number' ? Math.max(0, Math.min(5, p.step)) : DEFAULT_ONBOARDING_V2.step,
      dailyBudgetUzs: typeof p.dailyBudgetUzs === 'number' ? p.dailyBudgetUzs : DEFAULT_ONBOARDING_V2.dailyBudgetUzs,
      pixelId: p.pixelId === undefined ? null : p.pixelId,
      telegram: typeof p.telegram === 'string' ? p.telegram : '',
    }
  } catch {
    return { ...DEFAULT_ONBOARDING_V2 }
  }
}

export function saveOnboardingV2(partial: Partial<OnboardingV2State>) {
  if (typeof window === 'undefined') return
  const cur = loadOnboardingV2()
  const next = { ...cur, ...partial }
  localStorage.setItem(ONBOARDING_V2_KEY, JSON.stringify(next))
}

export function clearOnboardingV2() {
  if (typeof window === 'undefined') return
  localStorage.removeItem(ONBOARDING_V2_KEY)
}

/** Ro‘yxatdan o‘tish uchun mavjud pre-auth draft bilan to‘ldirish */
export function applyV2ToPreAuthDraft(state: OnboardingV2State) {
  const industryMap: Record<BusinessTypeV2, PreAuthOnboardingDraft['industry']> = {
    shop: 'ecommerce',
    course: 'local',
    restaurant: 'local',
    service: 'agency',
    other: 'other',
  }
  const goalMap: Record<GoalV2, string> = {
    sales: 'roas',
    leads: 'leads',
    awareness: 'awareness',
  }
  const b = state.dailyBudgetUzs
  const budgetBand: PreAuthOnboardingDraft['budgetBand'] =
    b < 120_000 ? 'under_1k' : b < 220_000 ? '1k_5k' : b < 400_000 ? '5k_20k' : '20k_plus'

  const industry = (state.businessType && industryMap[state.businessType as BusinessTypeV2]) || 'other'
  const goal = (state.goal && goalMap[state.goal as GoalV2]) || 'roas'

  savePreAuthOnboardingDraft({
    goal,
    industry,
    budgetBand,
    geoFocus: 'home',
    customerTouchpoints: [
      'Quick onboarding (v2)',
      `business: ${state.businessType || 'other'}`,
      `goal: ${state.goal || 'sales'}`,
      `pixel: ${state.pixelMode || 'skipped'} ${state.pixelId ? `id=${state.pixelId}` : ''}`,
      `dailyBudgetUzs: ${state.dailyBudgetUzs}`,
      state.telegram ? `telegram: ${state.telegram}` : '',
    ]
      .filter(Boolean)
      .join(' · '),
  })
}

export function finalizeForRegister(state: OnboardingV2State) {
  applyV2ToPreAuthDraft(state)
  markPreAuthOnboardingComplete()
  clearOnboardingV2()
}

export const FIRST_CAMPAIGN_BANNER_KEY = 'adspectr-first-campaign-banner'

export function setFirstCampaignBanner() {
  if (typeof window === 'undefined') return
  try {
    sessionStorage.setItem(FIRST_CAMPAIGN_BANNER_KEY, '1')
  } catch {
    /* ignore */
  }
}
