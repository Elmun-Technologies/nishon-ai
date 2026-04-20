'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowRight, Check, CheckCircle2, ChevronLeft } from 'lucide-react'
import { ContentMediaSlot } from '@/components/media/ContentMediaSlot'
import { PublicContainer, PublicFooter, PublicNavbar } from '@/components/public/PublicLayout'
import { useI18n } from '@/i18n/use-i18n'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'
import {
  adjustPlatformSplit,
  clearPreAuthOnboarding,
  loadPreAuthOnboardingDraft,
  markPreAuthOnboardingComplete,
  savePreAuthOnboardingDraft,
  type PreAuthOnboardingDraft,
} from '@/lib/pre-auth-onboarding'

const TOTAL_STEPS = 7

const GEO_OPTIONS = ['home', 'cis', 'global'] as const
type GeoOption = (typeof GEO_OPTIONS)[number]

const GOALS = ['roas', 'leads', 'awareness', 'scale'] as const
const BUDGETS = ['under_1k', '1k_5k', '5k_20k', '20k_plus'] as const
const INDUSTRIES = ['ecommerce', 'saas', 'local', 'agency', 'other'] as const

type GoalId = (typeof GOALS)[number]
type BudgetId = (typeof BUDGETS)[number]
type IndustryId = (typeof INDUSTRIES)[number]

function ChoiceTile({
  selected,
  label,
  description,
  onClick,
}: {
  selected: boolean
  label: string
  description?: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'relative flex w-full items-start gap-3 rounded-xl border px-4 py-3.5 text-left text-sm font-medium transition-all duration-200',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:ring-offset-2',
        selected
          ? 'border-border bg-surface-2 shadow-sm ring-1 ring-black/[0.04] dark:ring-white/[0.06]'
          : 'border-border bg-surface hover:border-text-tertiary/25 hover:bg-surface-2/80 dark:bg-surface-elevated/40',
      )}
    >
      <span
        className={cn(
          'mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border text-[10px]',
          selected
            ? 'border-brand-mid/50 bg-brand-mid/15 text-brand-ink dark:border-brand-lime/40 dark:bg-brand-lime/15 dark:text-brand-lime'
            : 'border-border bg-transparent text-transparent',
        )}
        aria-hidden
      >
        {selected ? <Check className="h-3 w-3" strokeWidth={3} /> : null}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block leading-snug text-text-primary">{label}</span>
        {description ? <span className="mt-1 block text-xs font-normal leading-relaxed text-text-secondary">{description}</span> : null}
      </span>
    </button>
  )
}

function SplitSlider({
  label,
  value,
  accent,
  onChange,
}: {
  label: string
  value: number
  accent: string
  onChange: (n: number) => void
}) {
  return (
    <div>
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-sm font-medium text-text-primary">{label}</span>
        <span className="tabular-nums text-sm text-text-secondary">{value}%</span>
      </div>
      <input
        type="range"
        min={0}
        max={100}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-2 h-2 w-full cursor-pointer rounded-full bg-border/60 dark:bg-border/40"
        style={{ accentColor: accent }}
      />
    </div>
  )
}

export default function OnboardingPage() {
  const { t } = useI18n()
  const router = useRouter()
  const p = (key: string, fb: string) => t(`preAuthOnboarding.${key}`, fb)

  const [step, setStep] = useState(0)
  const [draft, setDraft] = useState<PreAuthOnboardingDraft>(() =>
    typeof window === 'undefined'
      ? {
          v: 2,
          goal: '',
          budgetBand: '',
          industry: '',
          platformSplit: { meta: 45, google: 35, yandex: 20 },
          geoFocus: '',
        }
      : loadPreAuthOnboardingDraft(),
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
    if (step === 4) return true
    if (step === 5) return !!draft.geoFocus
    return true
  }, [step, draft])

  const goRegister = () => {
    markPreAuthOnboardingComplete()
    router.push('/register')
  }

  const restart = () => {
    clearPreAuthOnboarding()
    setDraft(loadPreAuthOnboardingDraft())
    setStep(0)
  }

  const updateSplit = (key: keyof PreAuthOnboardingDraft['platformSplit'], value: number) => {
    const next = adjustPlatformSplit(draft.platformSplit, key, value)
    savePreAuthOnboardingDraft({ platformSplit: next })
    setDraft(loadPreAuthOnboardingDraft())
  }

  return (
    <main className="flex min-h-screen flex-col bg-surface text-text-primary">
      <PublicNavbar />
      <section className="relative flex flex-1 flex-col border-b border-border bg-surface py-12 md:py-16">
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(147,199,91,0.12),transparent_55%)] dark:bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(147,199,91,0.08),transparent_55%)]"
          aria-hidden
        />
        <PublicContainer className="relative z-[1] flex max-w-4xl flex-1 flex-col">
          <div className="flex flex-1 flex-col rounded-2xl border border-border bg-surface/90 p-6 shadow-[0_1px_3px_rgba(0,0,0,0.06),0_12px_40px_-16px_rgba(0,0,0,0.12)] backdrop-blur-sm dark:bg-surface-elevated/50 dark:shadow-[0_1px_0_rgba(255,255,255,0.04)_inset,0_20px_50px_-24px_rgba(0,0,0,0.5)] md:p-10">
            <div className="mb-8 flex flex-wrap items-end justify-between gap-4 border-b border-border pb-6">
              <div>
                <p className="inline-flex items-center rounded-md border border-border bg-surface-2 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-text-secondary">
                  {p('badge', 'Onboarding')}
                </p>
                <p className="mt-3 text-xs text-text-tertiary md:text-sm">
                  {p('step', 'Step')} <span className="font-semibold text-text-primary">{Math.min(step + 1, TOTAL_STEPS)}</span>{' '}
                  {p('of', 'of')} {TOTAL_STEPS}
                </p>
              </div>
            </div>
            <div className="mb-10 h-1.5 overflow-hidden rounded-full bg-border/40 dark:bg-border/30">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#5c8239] to-[#7aab4d] transition-[width] duration-500 ease-out dark:from-[#6d9048] dark:to-[#8fbc62]"
                style={{ width: `${((step + 1) / TOTAL_STEPS) * 100}%` }}
                role="progressbar"
                aria-valuenow={step + 1}
                aria-valuemin={1}
                aria-valuemax={TOTAL_STEPS}
              />
            </div>

            <div className="min-h-0 flex-1">
          {step === 0 && (
            <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(260px,360px)] lg:items-start lg:gap-10">
              <div className="order-2 max-w-xl lg:order-1">
                <h1 className="text-balance text-3xl font-semibold tracking-tight text-text-primary md:text-[2rem] md:leading-tight">
                  {p('welcomeTitle', 'Welcome to AdSpectr')}
                </h1>
                <p className="mt-5 text-base leading-relaxed text-text-secondary md:text-lg">{p('welcomeBody', '')}</p>
                <ul className="mt-8 space-y-4 text-sm leading-relaxed text-text-secondary md:text-[15px]">
                  {[0, 1, 2].map((i) => (
                    <li key={i} className="flex gap-3">
                      <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-surface-2 text-[#5c8239] dark:text-[#8fbc62]">
                        <CheckCircle2 className="h-3.5 w-3.5" strokeWidth={2.25} />
                      </span>
                      <span>{p(`welcomeBullet${i}`, '')}</span>
                    </li>
                  ))}
                </ul>
                <p className="mt-6 hidden text-xs text-text-tertiary lg:block">{p('mediaSlotHint', '')}</p>
              </div>
              <div className="order-1 lg:sticky lg:top-6 lg:order-2">
                <ContentMediaSlot
                  slotId="onboarding-step-0-welcome"
                  ratio="4:3"
                  caption={p('mediaSlotCaption', '')}
                  priority
                  className="mx-auto max-w-md lg:mx-0 lg:max-w-none"
                />
              </div>
            </div>
          )}

          {step === 1 && (
            <div>
              <h1 className="text-balance text-2xl font-semibold tracking-tight text-text-primary md:text-3xl">
                {p('goalTitle', 'What is your main goal?')}
              </h1>
              <p className="mt-3 max-w-xl text-sm leading-relaxed text-text-secondary md:text-base">{p('goalSubtitle', '')}</p>
              <div className="mt-8 grid gap-3 sm:grid-cols-2">
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
              <h1 className="text-balance text-2xl font-semibold tracking-tight text-text-primary md:text-3xl">
                {p('budgetTitle', 'Monthly ad spend (approx.)')}
              </h1>
              <p className="mt-3 max-w-xl text-sm leading-relaxed text-text-secondary md:text-base">{p('budgetSubtitle', '')}</p>
              <ContentMediaSlot
                slotId="onboarding-step-2-budget"
                ratio="21:9"
                caption={p('mediaSlotCaption', '')}
                className="mx-auto mt-6 max-w-2xl"
              />
              <div className="mt-8 grid gap-3 sm:grid-cols-2">
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
              <h1 className="text-balance text-2xl font-semibold tracking-tight text-text-primary md:text-3xl">
                {p('industryTitle', 'What do you market?')}
              </h1>
              <p className="mt-3 max-w-xl text-sm leading-relaxed text-text-secondary md:text-base">{p('industrySubtitle', '')}</p>
              <ContentMediaSlot
                slotId="onboarding-step-3-industry"
                ratio="21:9"
                caption={p('mediaSlotCaption', '')}
                className="mx-auto mt-6 max-w-2xl"
              />
              <div className="mt-8 grid gap-3 sm:grid-cols-2">
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
            <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(240px,360px)] lg:items-start">
              <div>
                <h1 className="text-balance text-2xl font-semibold tracking-tight text-text-primary md:text-3xl">
                  {p('splitTitle', 'Split budget across platforms')}
                </h1>
                <p className="mt-3 max-w-xl text-sm leading-relaxed text-text-secondary md:text-base">{p('splitSubtitle', '')}</p>
                <div className="mt-4 flex h-3 overflow-hidden rounded-full bg-border/50 dark:bg-border/30">
                  <div className="bg-[#1877F2] transition-all duration-300" style={{ width: `${draft.platformSplit.meta}%` }} />
                  <div className="bg-[#4285F4] transition-all duration-300" style={{ width: `${draft.platformSplit.google}%` }} />
                  <div className="bg-[#FC3F1D] transition-all duration-300" style={{ width: `${draft.platformSplit.yandex}%` }} />
                </div>
                <p className="mt-2 text-xs text-text-tertiary">{p('splitTotal', 'Total')}: 100%</p>
                <div className="mt-8 max-w-lg space-y-6">
                  <SplitSlider
                    label={p('splitMeta', 'Meta')}
                    value={draft.platformSplit.meta}
                    accent="#1877F2"
                    onChange={(n) => updateSplit('meta', n)}
                  />
                  <SplitSlider
                    label={p('splitGoogle', 'Google Ads')}
                    value={draft.platformSplit.google}
                    accent="#4285F4"
                    onChange={(n) => updateSplit('google', n)}
                  />
                  <SplitSlider
                    label={p('splitYandex', 'Yandex Direct')}
                    value={draft.platformSplit.yandex}
                    accent="#FC3F1D"
                    onChange={(n) => updateSplit('yandex', n)}
                  />
                </div>
                <p className="mt-6 text-xs leading-relaxed text-text-tertiary">{p('splitHint', '')}</p>
              </div>
              <ContentMediaSlot
                slotId="onboarding-step-4-split"
                ratio="4:3"
                caption={p('mediaSlotCaption', '')}
                className="lg:sticky lg:top-6"
              />
            </div>
          )}

          {step === 5 && (
            <div>
              <h1 className="text-balance text-2xl font-semibold tracking-tight text-text-primary md:text-3xl">
                {p('geoTitle', 'Where should spend focus first?')}
              </h1>
              <p className="mt-3 max-w-xl text-sm leading-relaxed text-text-secondary md:text-base">{p('geoSubtitle', '')}</p>
              <ContentMediaSlot
                slotId="onboarding-step-5-geo"
                ratio="16:9"
                caption={p('mediaSlotCaption', '')}
                className="mx-auto mt-6 max-w-2xl"
              />
              <div className="mt-8 space-y-2">
                {GEO_OPTIONS.map((id) => (
                  <ChoiceTile
                    key={id}
                    selected={draft.geoFocus === id}
                    label={p(`geo.${id}`, id)}
                    description={p(`geoDesc.${id}`, '')}
                    onClick={() => syncDraft({ geoFocus: id })}
                  />
                ))}
              </div>
            </div>
          )}

          {step === 6 && (
            <div>
              <h1 className="text-balance text-2xl font-semibold tracking-tight text-text-primary md:text-3xl">
                {p('summaryTitle', 'You are ready to register')}
              </h1>
              <p className="mt-3 max-w-xl text-sm leading-relaxed text-text-secondary md:text-base">{p('summaryIntro', '')}</p>
              <ContentMediaSlot
                slotId="onboarding-step-6-summary"
                ratio="16:9"
                caption={p('mediaSlotCaption', '')}
                className="mx-auto mt-6 max-w-xl"
              />
              <dl className="mt-8 space-y-0 divide-y divide-border rounded-xl border border-border bg-surface-2/40 p-1 dark:bg-surface-2/20">
                <div className="flex justify-between gap-4 px-4 py-3 text-sm">
                  <dt className="text-text-tertiary">{p('summaryGoal', 'Goal')}</dt>
                  <dd className="max-w-[55%] text-right font-medium text-text-primary">
                    {draft.goal ? p(`goal.${draft.goal as GoalId}`, draft.goal) : '—'}
                  </dd>
                </div>
                <div className="flex justify-between gap-4 px-4 py-3 text-sm">
                  <dt className="text-text-tertiary">{p('summaryBudget', 'Budget')}</dt>
                  <dd className="max-w-[55%] text-right font-medium text-text-primary">
                    {draft.budgetBand ? p(`budget.${draft.budgetBand as BudgetId}`, draft.budgetBand) : '—'}
                  </dd>
                </div>
                <div className="flex justify-between gap-4 px-4 py-3 text-sm">
                  <dt className="text-text-tertiary">{p('summaryIndustry', 'Industry')}</dt>
                  <dd className="max-w-[55%] text-right font-medium text-text-primary">
                    {draft.industry ? p(`industry.${draft.industry as IndustryId}`, draft.industry) : '—'}
                  </dd>
                </div>
                <div className="px-4 py-3 text-sm">
                  <dt className="text-text-tertiary">{p('summarySplit', 'Platform mix')}</dt>
                  <dd className="mt-2">
                    <div className="flex h-2.5 overflow-hidden rounded-full bg-border/50">
                      <div className="bg-[#1877F2]" style={{ width: `${draft.platformSplit.meta}%` }} />
                      <div className="bg-[#4285F4]" style={{ width: `${draft.platformSplit.google}%` }} />
                      <div className="bg-[#FC3F1D]" style={{ width: `${draft.platformSplit.yandex}%` }} />
                    </div>
                    <p className="mt-2 text-xs text-text-secondary">
                      Meta {draft.platformSplit.meta}% · Google {draft.platformSplit.google}% · Yandex {draft.platformSplit.yandex}%
                    </p>
                  </dd>
                </div>
                <div className="flex justify-between gap-4 px-4 py-3 text-sm">
                  <dt className="text-text-tertiary">{p('summaryGeo', 'Geo focus')}</dt>
                  <dd className="max-w-[55%] text-right font-medium text-text-primary">
                    {draft.geoFocus ? p(`geo.${draft.geoFocus}`, draft.geoFocus) : '—'}
                  </dd>
                </div>
              </dl>
              <p className="mt-5 text-xs leading-relaxed text-text-tertiary">{p('summaryNote', '')}</p>
            </div>
          )}
            </div>

            <div className="mt-auto border-t border-border pt-8">
              <div className="flex flex-col-reverse gap-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
                <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                  {step > 0 ? (
                    <Button type="button" variant="secondary" size="lg" className="gap-2" onClick={() => setStep((s) => s - 1)}>
                      <ChevronLeft className="h-4 w-4" />
                      {p('back', 'Back')}
                    </Button>
                  ) : null}
                  <Button type="button" variant="ghost" size="lg" className="text-text-tertiary hover:text-text-primary" onClick={restart}>
                    {p('restart', 'Start over')}
                  </Button>
                </div>
                <div className="w-full sm:w-auto sm:shrink-0">
                  {step < TOTAL_STEPS - 1 ? (
                    <Button type="button" size="lg" fullWidth className="min-h-[3rem] gap-2 px-8 sm:w-auto sm:min-w-[13rem]" disabled={!canNext} onClick={() => setStep((s) => s + 1)}>
                      {p('next', 'Continue')}
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  ) : null}
                  {step === TOTAL_STEPS - 1 ? (
                    <Button type="button" size="lg" fullWidth className="min-h-[3rem] gap-2 px-8 sm:w-auto sm:min-w-[13rem]" onClick={goRegister}>
                      {p('ctaRegister', 'Create account')}
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  ) : null}
                </div>
              </div>

              <p className="mt-8 rounded-lg bg-surface-2/60 px-4 py-3 text-center text-sm text-text-secondary dark:bg-surface-2/30">
                {p('hasAccount', 'Already have an account?')}{' '}
                <Link href="/login" className="font-semibold text-text-primary underline-offset-2 hover:underline">
                  {p('login', 'Log in')}
                </Link>
              </p>
            </div>
          </div>
        </PublicContainer>
      </section>
      <PublicFooter />
    </main>
  )
}
