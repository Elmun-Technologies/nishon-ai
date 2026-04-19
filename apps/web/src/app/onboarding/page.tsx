'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowRight, CheckCircle2, ChevronLeft } from 'lucide-react'
import { PublicContainer, PublicFooter, PublicNavbar } from '@/components/public/PublicLayout'
import { useI18n } from '@/i18n/use-i18n'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'
import {
  clearPreAuthOnboarding,
  loadPreAuthOnboardingDraft,
  markPreAuthOnboardingComplete,
  savePreAuthOnboardingDraft,
  type PreAuthOnboardingDraft,
} from '@/lib/pre-auth-onboarding'

const TOTAL_STEPS = 5

const GOALS = ['roas', 'leads', 'awareness', 'scale'] as const
const BUDGETS = ['under_1k', '1k_5k', '5k_20k', '20k_plus'] as const
const INDUSTRIES = ['ecommerce', 'saas', 'local', 'agency', 'other'] as const

type GoalId = (typeof GOALS)[number]
type BudgetId = (typeof BUDGETS)[number]
type IndustryId = (typeof INDUSTRIES)[number]

function ChoiceTile({
  selected,
  label,
  onClick,
}: {
  selected: boolean
  label: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'rounded-2xl border px-4 py-4 text-left text-sm font-medium transition-all',
        selected
          ? 'border-brand-mid bg-brand-mid/10 text-text-primary shadow-sm ring-2 ring-brand-mid/30 dark:border-brand-lime dark:bg-brand-lime/10 dark:ring-brand-lime/25'
          : 'border-border bg-white hover:border-brand-mid/40 hover:bg-surface-2 dark:bg-surface-elevated/60',
      )}
    >
      {label}
    </button>
  )
}

export default function OnboardingPage() {
  const { t } = useI18n()
  const router = useRouter()
  const p = (key: string, fb: string) => t(`preAuthOnboarding.${key}`, fb)

  const [step, setStep] = useState(0)
  const [draft, setDraft] = useState<PreAuthOnboardingDraft>(() =>
    typeof window === 'undefined' ? { v: 1, goal: '', budgetBand: '', industry: '' } : loadPreAuthOnboardingDraft(),
  )

  useEffect(() => {
    setDraft(loadPreAuthOnboardingDraft())
  }, [])

  const syncDraft = useCallback((next: Partial<PreAuthOnboardingDraft>) => {
    savePreAuthOnboardingDraft(next)
    setDraft(loadPreAuthOnboardingDraft())
  }, [])

  const canNext = useMemo(() => {
    if (step === 0) return true
    if (step === 1) return !!draft.goal
    if (step === 2) return !!draft.budgetBand
    if (step === 3) return !!draft.industry
    return true
  }, [step, draft])

  const goRegister = () => {
    markPreAuthOnboardingComplete()
    router.push('/register')
  }

  const restart = () => {
    clearPreAuthOnboarding()
    setDraft({ v: 1, goal: '', budgetBand: '', industry: '' })
    setStep(0)
  }

  return (
    <main className="min-h-screen bg-surface text-text-primary">
      <PublicNavbar />
      <section className="border-b border-border bg-[#f7faf2] py-10 dark:bg-surface-2/40">
        <PublicContainer className="max-w-2xl">
          <div className="mb-8 flex items-center justify-between gap-3">
            <p className="text-caption font-semibold uppercase tracking-wide text-brand-mid dark:text-brand-lime">
              {p('badge', 'Onboarding')}
            </p>
            <p className="text-sm text-text-tertiary">
              {p('step', 'Step')} {Math.min(step + 1, TOTAL_STEPS)} {p('of', 'of')} {TOTAL_STEPS}
            </p>
          </div>
          <div className="mb-6 h-2 overflow-hidden rounded-full bg-surface-2 dark:bg-surface-elevated">
            <div
              className="h-full rounded-full bg-gradient-to-r from-brand-mid to-brand-lime transition-all duration-300"
              style={{ width: `${((step + 1) / TOTAL_STEPS) * 100}%` }}
            />
          </div>

          {step === 0 && (
            <div>
              <h1 className="text-3xl font-semibold md:text-4xl">{p('welcomeTitle', 'Welcome to AdSpectr')}</h1>
              <p className="mt-4 text-lg text-text-secondary">{p('welcomeBody', '')}</p>
              <ul className="mt-6 space-y-3 text-text-secondary">
                {[0, 1, 2].map((i) => (
                  <li key={i} className="flex gap-2 text-sm">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-brand-mid" />
                    {p(`welcomeBullet${i}`, '')}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {step === 1 && (
            <div>
              <h1 className="text-2xl font-semibold md:text-3xl">{p('goalTitle', 'What is your main goal?')}</h1>
              <p className="mt-2 text-text-secondary">{p('goalSubtitle', '')}</p>
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                {GOALS.map((id) => (
                  <ChoiceTile
                    key={id}
                    selected={draft.goal === id}
                    label={p(`goal.${id}`, id)}
                    onClick={() => syncDraft({ goal: id })}
                  />
                ))}
              </div>
            </div>
          )}

          {step === 2 && (
            <div>
              <h1 className="text-2xl font-semibold md:text-3xl">{p('budgetTitle', 'Monthly ad spend (approx.)')}</h1>
              <p className="mt-2 text-text-secondary">{p('budgetSubtitle', '')}</p>
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                {BUDGETS.map((id) => (
                  <ChoiceTile
                    key={id}
                    selected={draft.budgetBand === id}
                    label={p(`budget.${id}`, id)}
                    onClick={() => syncDraft({ budgetBand: id })}
                  />
                ))}
              </div>
            </div>
          )}

          {step === 3 && (
            <div>
              <h1 className="text-2xl font-semibold md:text-3xl">{p('industryTitle', 'What do you market?')}</h1>
              <p className="mt-2 text-text-secondary">{p('industrySubtitle', '')}</p>
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                {INDUSTRIES.map((id) => (
                  <ChoiceTile
                    key={id}
                    selected={draft.industry === id}
                    label={p(`industry.${id}`, id)}
                    onClick={() => syncDraft({ industry: id })}
                  />
                ))}
              </div>
            </div>
          )}

          {step === 4 && (
            <div>
              <h1 className="text-2xl font-semibold md:text-3xl">{p('summaryTitle', 'You are ready to register')}</h1>
              <p className="mt-2 text-text-secondary">{p('summaryIntro', '')}</p>
              <dl className="mt-6 space-y-3 rounded-2xl border border-border bg-white p-5 dark:bg-surface-elevated/80">
                <div className="flex justify-between gap-4 text-sm">
                  <dt className="text-text-tertiary">{p('summaryGoal', 'Goal')}</dt>
                  <dd className="font-medium text-text-primary">{draft.goal ? p(`goal.${draft.goal as GoalId}`, draft.goal) : '—'}</dd>
                </div>
                <div className="flex justify-between gap-4 text-sm">
                  <dt className="text-text-tertiary">{p('summaryBudget', 'Budget')}</dt>
                  <dd className="font-medium text-text-primary">
                    {draft.budgetBand ? p(`budget.${draft.budgetBand as BudgetId}`, draft.budgetBand) : '—'}
                  </dd>
                </div>
                <div className="flex justify-between gap-4 text-sm">
                  <dt className="text-text-tertiary">{p('summaryIndustry', 'Industry')}</dt>
                  <dd className="font-medium text-text-primary">
                    {draft.industry ? p(`industry.${draft.industry as IndustryId}`, draft.industry) : '—'}
                  </dd>
                </div>
              </dl>
              <p className="mt-4 text-xs text-text-tertiary">{p('summaryNote', '')}</p>
            </div>
          )}

          <div className="mt-10 flex flex-wrap items-center gap-3">
            {step > 0 && (
              <Button type="button" variant="secondary" className="gap-1 rounded-xl" onClick={() => setStep((s) => s - 1)}>
                <ChevronLeft className="h-4 w-4" />
                {p('back', 'Back')}
              </Button>
            )}
            {step < TOTAL_STEPS - 1 && (
              <Button type="button" className="gap-1 rounded-xl" disabled={!canNext} onClick={() => setStep((s) => s + 1)}>
                {p('next', 'Continue')}
                <ArrowRight className="h-4 w-4" />
              </Button>
            )}
            {step === TOTAL_STEPS - 1 && (
              <Button type="button" className="gap-1 rounded-xl" onClick={goRegister}>
                {p('ctaRegister', 'Create account')}
                <ArrowRight className="h-4 w-4" />
              </Button>
            )}
            <button type="button" onClick={restart} className="ml-auto text-sm text-text-tertiary underline hover:text-text-primary">
              {p('restart', 'Start over')}
            </button>
          </div>

          <p className="mt-8 text-center text-sm text-text-secondary">
            {p('hasAccount', 'Already have an account?')}{' '}
            <Link href="/login" className="font-medium text-primary hover:underline">
              {p('login', 'Log in')}
            </Link>
          </p>
        </PublicContainer>
      </section>
      <PublicFooter />
    </main>
  )
}
