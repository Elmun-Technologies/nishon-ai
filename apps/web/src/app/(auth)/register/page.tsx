'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ContentMediaSlot } from '@/components/media/ContentMediaSlot'
import { Alert, Button, Input } from '@/components/ui'
import { PageSpinner } from '@/components/ui/Spinner'
import { auth } from '@/lib/api-client'
import { useI18n } from '@/i18n/use-i18n'
import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher'
import {
  CHANNEL_COLORS,
  CHANNEL_KEYS,
  clearPreAuthOnboarding,
  isPreAuthOnboardingComplete,
  loadPreAuthOnboardingDraft,
} from '@/lib/pre-auth-onboarding'

export default function RegisterPage() {
  const { t } = useI18n()
  const router = useRouter()
  const [gateChecked, setGateChecked] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const draft = useMemo(() => (gateChecked ? loadPreAuthOnboardingDraft() : null), [gateChecked])

  useEffect(() => {
    if (!isPreAuthOnboardingComplete()) {
      router.replace('/onboarding')
      return
    }
    setGateChecked(true)
  }, [router])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await auth.register(form)
      clearPreAuthOnboarding()
      router.push('/login')
    } catch (err: any) {
      setError(err?.response?.data?.message || t('auth.registerPage.genericError', 'Registration failed. Please try again.'))
    } finally {
      setLoading(false)
    }
  }

  const statCards = [
    { label: t('auth.registerPage.statModules', 'Modules'), value: t('auth.registerPage.statModulesVal', '20+') },
    { label: t('auth.registerPage.statLanguages', 'Languages'), value: t('auth.registerPage.statLanguagesVal', '3') },
    { label: t('auth.registerPage.statAutopilot', 'Autopilot'), value: t('auth.registerPage.statAutopilotVal', 'Built-in') },
  ]

  if (!gateChecked) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-surface text-text-secondary">
        <div className="flex flex-col items-center gap-3">
          <PageSpinner />
          <p className="text-sm">{t('preAuthOnboarding.registerGateLoading', 'Checking onboarding…')}</p>
        </div>
      </main>
    )
  }

  const p = (key: string, fb: string) => t(`preAuthOnboarding.${key}`, fb)

  return (
    <main className="min-h-screen bg-surface px-4 py-10 text-text-primary md:py-14">
      <div className="mx-auto flex max-w-6xl items-center justify-end gap-3 pb-6">
        <Link href="/" className="text-sm text-text-secondary transition-colors hover:text-text-primary">
          {t('common.home', 'Home')}
        </Link>
        <LanguageSwitcher />
      </div>

      <div className="mx-auto grid w-full max-w-6xl gap-6 lg:grid-cols-2 lg:gap-8">
        <section className="flex flex-col rounded-2xl border border-border bg-surface p-6 shadow-sm md:p-8 dark:bg-surface-elevated/30">
          <p className="inline-flex w-fit rounded-md border border-border bg-surface-2 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-text-secondary">
            {t('auth.registerPage.badge', 'Create account')}
          </p>
          <h1 className="mt-4 text-balance text-2xl font-semibold tracking-tight md:text-3xl">
            {t('auth.registerPage.heroTitle', 'Start using AdSpectr in minutes')}
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-text-secondary md:text-base">
            {t('auth.registerPage.heroSubtitle', '')}
          </p>

          <ContentMediaSlot
            slotId="register-hero"
            ratio="16:9"
            caption={t('preAuthOnboarding.mediaSlotCaption', '')}
            className="mx-auto mt-6 max-w-lg"
          />
          <p className="mt-2 text-center text-[11px] text-text-tertiary">{t('preAuthOnboarding.mediaSlotHint', '')}</p>

          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            {statCards.map((card) => (
              <div key={card.label} className="rounded-xl border border-border bg-surface-2/60 p-4 dark:bg-surface-2/25">
                <p className="text-lg font-semibold tabular-nums">{card.value}</p>
                <p className="mt-1 text-xs text-text-secondary">{card.label}</p>
              </div>
            ))}
          </div>

          {draft ? (
            <div className="mt-8 rounded-xl border border-border bg-surface-2/40 p-4 dark:bg-surface-2/20">
              <p className="text-xs font-semibold uppercase tracking-wide text-text-tertiary">
                {t('auth.registerPage.planTitle', 'From your onboarding')}
              </p>
              <p className="mt-1 text-sm text-text-secondary">{t('auth.registerPage.planSubtitle', '')}</p>
              <dl className="mt-4 space-y-2.5 text-sm">
                <div className="flex justify-between gap-3">
                  <dt className="text-text-tertiary">{p('summaryGoal', 'Goal')}</dt>
                  <dd className="max-w-[58%] text-right font-medium text-text-primary">
                    {draft.goal ? p(`goal.${draft.goal}`, draft.goal) : '—'}
                  </dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-text-tertiary">{p('summaryBudget', 'Budget')}</dt>
                  <dd className="max-w-[58%] text-right font-medium text-text-primary">
                    {draft.budgetBand ? p(`budget.${draft.budgetBand}`, draft.budgetBand) : '—'}
                  </dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-text-tertiary">{p('summaryIndustry', 'Industry')}</dt>
                  <dd className="max-w-[58%] text-right font-medium text-text-primary">
                    {draft.industry ? p(`industry.${draft.industry}`, draft.industry) : '—'}
                  </dd>
                </div>
                <div>
                  <dt className="text-text-tertiary">{p('summarySplit', 'Channel mix')}</dt>
                  <dd className="mt-2">
                    <div className="flex h-2 min-h-[8px] overflow-hidden rounded-full bg-border/50">
                      {CHANNEL_KEYS.map((k) => (
                        <div
                          key={k}
                          className="min-w-0"
                          style={{ width: `${draft.channelSplit[k]}%`, backgroundColor: CHANNEL_COLORS[k] }}
                        />
                      ))}
                    </div>
                    <p className="mt-1.5 text-xs leading-relaxed text-text-secondary">
                      {CHANNEL_KEYS.filter((k) => draft.channelSplit[k] > 0)
                        .map((k) => `${p(`splitChannel.${k}`, k)} ${draft.channelSplit[k]}%`)
                        .join(' · ') || '—'}
                    </p>
                  </dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-text-tertiary">{p('summaryGeo', 'Geo focus')}</dt>
                  <dd className="max-w-[58%] text-right font-medium text-text-primary">
                    {draft.geoFocus ? p(`geo.${draft.geoFocus}`, draft.geoFocus) : '—'}
                  </dd>
                </div>
              </dl>
              <p className="mt-4 border-t border-border pt-3 text-xs leading-relaxed text-text-tertiary">
                {p('registerPlanHint', '')}
              </p>
            </div>
          ) : null}
        </section>

        <section className="rounded-2xl border border-border bg-surface p-6 shadow-sm md:p-8 dark:bg-surface-elevated/30">
          <h2 className="text-xl font-semibold tracking-tight">{t('auth.registerPage.panelTitle', 'Register')}</h2>
          <p className="mt-2 text-sm text-text-secondary">{t('auth.registerPage.panelSubtitle', '')}</p>

          <div className="mt-5 rounded-lg border border-border/80 bg-surface-2/50 px-4 py-3 text-sm text-text-secondary dark:bg-surface-2/25">
            {p('registerPlanTitle', 'Your setup plan')} — {p('registerReady', '')}
          </div>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <Input
              label={t('auth.registerPage.nameLabel', 'Full name')}
              value={form.name}
              onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
              placeholder={t('auth.registerPage.namePlaceholder', 'Your name')}
              required
            />
            <Input
              label={t('auth.email', 'Email')}
              type="email"
              value={form.email}
              onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
              placeholder={t('auth.loginPage.emailPlaceholder', 'you@company.com')}
              required
            />
            <Input
              label={t('auth.password', 'Password')}
              type="password"
              value={form.password}
              onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
              placeholder={t('auth.registerPage.passwordHint', 'At least 8 characters')}
              required
            />

            {error ? <Alert variant="error">{error}</Alert> : null}

            <Button type="submit" loading={loading} fullWidth size="lg" className="min-h-[3rem]">
              {t('auth.registerPage.createButton', 'Create account')}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-text-secondary">
            {t('auth.registerPage.signInPrompt', 'Already have an account?')}{' '}
            <Link href="/login" className="font-semibold text-text-primary underline-offset-2 hover:underline">
              {t('auth.registerPage.signInLink', 'Sign in')}
            </Link>
          </p>
        </section>
      </div>
    </main>
  )
}
