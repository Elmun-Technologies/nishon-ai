/**
 * Pre-auth onboarding: answers stored locally until the user finishes
 * and is allowed to open `/register`.
 */
const STORAGE_DRAFT = 'adspectr-preauth-onboarding-draft'
const STORAGE_READY = 'adspectr-preauth-onboarding-register-allowed'

export type PreAuthOnboardingDraft = {
  v: 1
  goal: string
  budgetBand: string
  industry: string
}

function emptyDraft(): PreAuthOnboardingDraft {
  return { v: 1, goal: '', budgetBand: '', industry: '' }
}

export function loadPreAuthOnboardingDraft(): PreAuthOnboardingDraft {
  if (typeof window === 'undefined') return emptyDraft()
  try {
    const raw = localStorage.getItem(STORAGE_DRAFT)
    if (!raw) return emptyDraft()
    const p = JSON.parse(raw) as Partial<PreAuthOnboardingDraft>
    if (p?.v !== 1) return emptyDraft()
    return {
      v: 1,
      goal: typeof p.goal === 'string' ? p.goal : '',
      budgetBand: typeof p.budgetBand === 'string' ? p.budgetBand : '',
      industry: typeof p.industry === 'string' ? p.industry : '',
    }
  } catch {
    return emptyDraft()
  }
}

export function savePreAuthOnboardingDraft(partial: Partial<PreAuthOnboardingDraft>) {
  if (typeof window === 'undefined') return
  const next = { ...loadPreAuthOnboardingDraft(), ...partial, v: 1 as const }
  localStorage.setItem(STORAGE_DRAFT, JSON.stringify(next))
}

export function isPreAuthOnboardingComplete(): boolean {
  if (typeof window === 'undefined') return false
  return localStorage.getItem(STORAGE_READY) === '1'
}

/** Call when the user finishes the last onboarding step (before navigating to `/register`). */
export function markPreAuthOnboardingComplete() {
  if (typeof window === 'undefined') return
  localStorage.setItem(STORAGE_READY, '1')
}

export function clearPreAuthOnboarding() {
  if (typeof window === 'undefined') return
  localStorage.removeItem(STORAGE_DRAFT)
  localStorage.removeItem(STORAGE_READY)
}
