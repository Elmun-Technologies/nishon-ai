import type { MetaData, MetaObjective } from './types'

/** Blank Meta wizard state — the baseline the launcher opens with. */
export const INITIAL_META_DATA: MetaData = {
  name: '',
  objective: '',
  minAge: 18,
  maxAge: 65,
  location: 'UZ',
  dailyBudget: '',
  campaignDuration: 7,
  creativeName: '',
  creativeUrl: '',
  creativeText: '',
  imageUrl: '',
  ctaButton: 'learn_more',
  pageId: '',
  abTestEnabled: false,
  abTestType: 'creative',
  abTestDuration: 7,
  abTestMetric: 'cost_per_result',
  specialAdCategories: [],
}

/** Meta objectives the wizard can safely prefill from onboarding. */
const PREFILLABLE_META_OBJECTIVES: MetaObjective[] = [
  'awareness',
  'traffic',
  'engagement',
  'leads',
  'app_promotion',
  'sales',
]

/**
 * Derive Meta wizard defaults from the workspace's onboarding-captured
 * `aiStrategy.launchDefaults`. Returns a full MetaData (INITIAL_META_DATA with
 * the AI suggestions merged over it) plus a `prefilled` flag the UI uses to
 * show an "AI suggested" badge. The agent does the setup the user would
 * otherwise type by hand (Vaqt); every value stays fully editable.
 */
export function metaDefaultsFromStrategy(aiStrategy: unknown): {
  data: MetaData
  prefilled: boolean
} {
  const ld =
    aiStrategy && typeof aiStrategy === 'object'
      ? (aiStrategy as { launchDefaults?: Record<string, unknown> }).launchDefaults
      : undefined
  if (!ld || typeof ld !== 'object') {
    return { data: INITIAL_META_DATA, prefilled: false }
  }

  const rawObjective = ld.objective
  const objective =
    typeof rawObjective === 'string' &&
    PREFILLABLE_META_OBJECTIVES.includes(rawObjective as MetaObjective)
      ? (rawObjective as MetaObjective)
      : INITIAL_META_DATA.objective

  const ageMin = typeof ld.ageMin === 'number' && Number.isFinite(ld.ageMin) ? ld.ageMin : null
  const ageMax = typeof ld.ageMax === 'number' && Number.isFinite(ld.ageMax) ? ld.ageMax : null
  const minAge = ageMin != null ? Math.max(13, Math.round(ageMin)) : INITIAL_META_DATA.minAge
  const maxAge = ageMax != null ? Math.min(65, Math.round(ageMax)) : INITIAL_META_DATA.maxAge
  const ageValid = minAge < maxAge

  const location =
    typeof ld.primaryGeo === 'string' && ld.primaryGeo ? ld.primaryGeo : INITIAL_META_DATA.location
  const dailyBudget =
    typeof ld.dailyBudgetUsd === 'number' && Number.isFinite(ld.dailyBudgetUsd) && ld.dailyBudgetUsd > 0
      ? String(Math.round(ld.dailyBudgetUsd))
      : INITIAL_META_DATA.dailyBudget

  const data: MetaData = {
    ...INITIAL_META_DATA,
    objective,
    minAge: ageValid ? minAge : INITIAL_META_DATA.minAge,
    maxAge: ageValid ? maxAge : INITIAL_META_DATA.maxAge,
    location,
    dailyBudget,
  }

  const prefilled =
    data.objective !== INITIAL_META_DATA.objective ||
    data.location !== INITIAL_META_DATA.location ||
    data.dailyBudget !== INITIAL_META_DATA.dailyBudget ||
    data.minAge !== INITIAL_META_DATA.minAge ||
    data.maxAge !== INITIAL_META_DATA.maxAge

  return { data, prefilled }
}
