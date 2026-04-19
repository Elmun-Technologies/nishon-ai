'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Alert, Button, Input } from '@/components/ui'
import { PageSpinner } from '@/components/ui/Spinner'
import { auth } from '@/lib/api-client'
import { useI18n } from '@/i18n/use-i18n'
import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher'
import { clearPreAuthOnboarding, isPreAuthOnboardingComplete } from '@/lib/pre-auth-onboarding'

export default function RegisterPage() {
  const { t } = useI18n()
  const router = useRouter()
  const [gateChecked, setGateChecked] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

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
      <main className="flex min-h-screen items-center justify-center bg-surface-2 text-text-secondary">
        <div className="flex flex-col items-center gap-3">
          <PageSpinner />
          <p className="text-sm">{t('preAuthOnboarding.registerGateLoading', 'Checking onboarding…')}</p>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-surface-2 px-4 py-10 text-text-primary">
      <div className="mx-auto flex max-w-6xl items-center justify-end gap-3 px-0 pb-4">
        <Link href="/" className="text-sm text-text-secondary hover:text-text-primary">
          {t('common.home', 'Home')}
        </Link>
        <LanguageSwitcher />
      </div>
      <div className="mx-auto grid w-full max-w-6xl gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-border bg-surface p-8">
          <p className="text-sm font-medium text-primary">{t('auth.registerPage.badge', 'Create account')}</p>
          <h1 className="mt-2 text-3xl font-semibold">{t('auth.registerPage.heroTitle', 'Start using AdSpectr in minutes')}</h1>
          <p className="mt-3 text-text-secondary">{t('auth.registerPage.heroSubtitle', 'Launch campaigns, track AI decisions, and manage workspace governance from one place.')}</p>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            {statCards.map((card) => (
              <div key={card.label} className="rounded-xl border border-border bg-surface-2 p-4">
                <p className="text-lg font-semibold">{card.value}</p>
                <p className="text-xs text-text-secondary">{card.label}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-border bg-surface p-8">
          <h2 className="text-xl font-semibold">{t('auth.registerPage.panelTitle', 'Register')}</h2>
          <p className="mt-1 text-sm text-text-secondary">{t('auth.registerPage.panelSubtitle', 'Use your work email to create a workspace account.')}</p>

          <Alert variant="success" className="mt-4">
            {t('preAuthOnboarding.registerReady', 'Onboarding complete — create your account below.')}
          </Alert>

          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            <Input
              label={t('auth.registerPage.nameLabel', 'Full name')}
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              placeholder={t('auth.registerPage.namePlaceholder', 'Your name')}
              required
            />
            <Input
              label={t('auth.email', 'Email')}
              type="email"
              value={form.email}
              onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
              placeholder={t('auth.loginPage.emailPlaceholder', 'you@company.com')}
              required
            />
            <Input
              label={t('auth.password', 'Password')}
              type="password"
              value={form.password}
              onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
              placeholder={t('auth.registerPage.passwordHint', 'At least 8 characters')}
              required
            />

            {error && <Alert variant="error">{error}</Alert>}

            <Button type="submit" loading={loading} fullWidth size="lg">
              {t('auth.registerPage.createButton', 'Create account')}
            </Button>
          </form>

          <p className="mt-4 text-center text-sm text-text-secondary">
            {t('auth.registerPage.signInPrompt', 'Already have an account?')}{' '}
            <Link href="/login" className="font-medium text-primary hover:underline">
              {t('auth.registerPage.signInLink', 'Sign in')}
            </Link>
          </p>
        </section>
      </div>
    </main>
  )
}
