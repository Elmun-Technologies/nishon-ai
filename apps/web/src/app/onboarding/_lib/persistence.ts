import {
  markPreAuthOnboardingComplete,
  savePreAuthOnboardingDraft,
  type ChannelSplit,
  type PreAuthOnboardingDraft,
} from '@/lib/pre-auth-onboarding'
import { setFirstCampaignBanner } from '@/lib/onboarding-v2'
import type {
  BusinessVertical,
  CjmStage,
  ConversationalOnboardingState,
} from './types'
import { DEFAULT_STATE } from './types'

export const STORAGE_KEY = 'adspectr-onboarding-conversational'

export function loadState(): ConversationalOnboardingState {
  if (typeof window === 'undefined') return { ...DEFAULT_STATE }
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { ...DEFAULT_STATE }
    const parsed = JSON.parse(raw) as Partial<ConversationalOnboardingState>
    return {
      ...DEFAULT_STATE,
      ...parsed,
      geos: Array.isArray(parsed.geos) && parsed.geos.length > 0 ? parsed.geos : DEFAULT_STATE.geos,
      ageRanges: Array.isArray(parsed.ageRanges) ? parsed.ageRanges : [],
      touchpoints: Array.isArray(parsed.touchpoints) ? parsed.touchpoints : [],
      allocation: parsed.allocation && typeof parsed.allocation === 'object' ? parsed.allocation : {},
      monthlyBudgetUzs:
        typeof parsed.monthlyBudgetUzs === 'number' && parsed.monthlyBudgetUzs > 0
          ? parsed.monthlyBudgetUzs
          : DEFAULT_STATE.monthlyBudgetUzs,
    }
  } catch {
    return { ...DEFAULT_STATE }
  }
}

export function saveState(state: ConversationalOnboardingState) {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    /* ignore */
  }
}

export function clearState() {
  if (typeof window === 'undefined') return
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    /* ignore */
  }
}

/** Map conversational state → pre-auth draft for the register flow. */
export function applyToPreAuthDraft(state: ConversationalOnboardingState) {
  const industry = mapVerticalToIndustry(state.vertical)
  const goal = mapCjmToGoal(state.cjm)
  const budgetBand = budgetBandForMonthlyUzs(state.monthlyBudgetUzs)

  // Map allocation to ChannelSplit for the draft.
  const channelSplit: ChannelSplit = {
    instagram: state.allocation.instagram ?? 0,
    metaAds: state.allocation.metaAds ?? 0,
    google: state.allocation.google ?? 0,
    yandex: state.allocation.yandex ?? 0,
    olx: state.allocation.olx ?? 0,
    uzum: state.allocation.uzum ?? 0,
    telegram: state.allocation.telegram ?? 0,
  }

  const touchpointSummary = [
    'Conversational onboarding',
    `vertical: ${state.vertical || 'other'}`,
    `cjm: ${state.cjm || 'conversion'}`,
    `monthlyUzs: ${state.monthlyBudgetUzs}`,
    state.geos.length ? `geos: ${state.geos.join(',')}` : '',
    state.ageRanges.length ? `age: ${state.ageRanges.join(',')}` : '',
    state.telegram ? `telegram: ${state.telegram}` : '',
  ]
    .filter(Boolean)
    .join(' · ')

  const draft: Partial<PreAuthOnboardingDraft> = {
    goal,
    industry,
    budgetBand,
    channelSplit,
    geoFocus: state.geos.includes('UZ')
      ? 'home'
      : state.geos.some((g) => ['KZ', 'RU', 'KG', 'TJ'].includes(g))
        ? 'cis'
        : 'global',
    customerTouchpoints: touchpointSummary,
  }

  savePreAuthOnboardingDraft(draft)
}

export function finalizeForRegister(state: ConversationalOnboardingState) {
  applyToPreAuthDraft(state)
  markPreAuthOnboardingComplete()
  clearState()
}

export function finalizeForLoggedIn() {
  setFirstCampaignBanner()
  clearState()
}

function mapVerticalToIndustry(v: BusinessVertical | ''): PreAuthOnboardingDraft['industry'] {
  switch (v) {
    case 'ecommerce':
      return 'ecommerce'
    case 'local':
      return 'local'
    case 'education':
      return 'local'
    case 'service':
      return 'agency'
    case 'realestate':
      return 'local'
    default:
      return 'other'
  }
}

function mapCjmToGoal(c: CjmStage | ''): string {
  switch (c) {
    case 'awareness':
      return 'awareness'
    case 'consideration':
      return 'leads'
    case 'conversion':
      return 'roas'
    case 'retention':
      return 'roas'
    default:
      return 'roas'
  }
}

function budgetBandForMonthlyUzs(monthly: number): PreAuthOnboardingDraft['budgetBand'] {
  // Convert monthly UZS to rough USD bands (1 USD ≈ 12,500 UZS).
  const usd = monthly / 12500
  if (usd < 1000) return 'under_1k'
  if (usd < 5000) return '1k_5k'
  if (usd < 20000) return '5k_20k'
  return '20k_plus'
}
