'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Alert, Button, Input } from '@/components/ui'
import { auth, workspaces as workspacesApi } from '@/lib/api-client'
import { useWorkspaceStore } from '@/stores/workspace.store'
import { setRefreshToken } from '@/lib/auth-storage'
import { useI18n } from '@/i18n/use-i18n'
import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher'

function FacebookIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="#1877F2">
      <path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.41c0-3.025 1.792-4.697 4.533-4.697 1.312 0 2.686.236 2.686.236v2.97h-1.513c-1.491 0-1.956.93-1.956 1.886v2.268h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073Z" />
    </svg>
  )
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z" fill="#4285F4" />
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z" fill="#34A853" />
      <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332Z" fill="#FBBC05" />
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58Z" fill="#EA4335" />
    </svg>
  )
}

const DEMO_USER = {
  id: 'demo-user-001',
  email: 'demo@adspectr.com',
  name: 'Demo User',
  plan: 'pro',
}

const DEMO_WORKSPACE = {
  id: 'demo-workspace-001',
  name: 'Demo Workspace',
  industry: 'ecommerce',
  monthlyBudget: 5000,
  goal: 'increase_roas',
  autopilotMode: 'assisted',
  isOnboardingComplete: true,
  aiStrategy: null,
  targetAudience: null,
  targetLocation: null,
}

export default function LoginPage() {
  const { t } = useI18n()
  const router = useRouter()
  const { setUser, setAccessToken, setCurrentWorkspace } = useWorkspaceStore()
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  function handleDemoLogin() {
    setAccessToken('demo-token-local-preview')
    setUser(DEMO_USER)
    setCurrentWorkspace(DEMO_WORKSPACE)
    router.push('/dashboard')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const res = await auth.login(form)
      const { accessToken, refreshToken, user } = res.data

      setRefreshToken(refreshToken)
      setAccessToken(accessToken)
      setUser(user)

      const wsRes = await workspacesApi.list()
      const ws = wsRes.data?.[0] ?? null

      if (ws) {
        setCurrentWorkspace(ws)
        router.push('/dashboard')
      } else {
        router.push('/onboarding')
      }
    } catch (err: any) {
      setError(err.response?.data?.message || t('auth.loginPage.badCredentials', 'Invalid email or password'))
    } finally {
      setLoading(false)
    }
  }

  function handleGoogleLogin() {
    window.location.href = auth.googleUrl()
  }

  function handleFacebookLogin() {
    window.location.href = auth.facebookUrl()
  }

  const stats = [
    { value: '3.2x', label: t('auth.loginPage.statRoas', 'Average ROAS') },
    { value: '-40%', label: t('auth.loginPage.statCpa', 'CPA reduction') },
    { value: '24/7', label: t('auth.loginPage.statAi', 'AI monitoring') },
  ]

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
          <p className="text-sm font-medium text-primary">{t('auth.loginPage.welcomeBadge', 'Welcome back')}</p>
          <h1 className="mt-2 text-3xl font-semibold">{t('auth.loginPage.heroTitle', 'Control campaigns from one operating layer')}</h1>
          <p className="mt-3 text-text-secondary">{t('auth.loginPage.heroSubtitle', 'Sign in to access launch workflows, AI decisions, reporting, and workspace governance.')}</p>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            {stats.map((item) => (
              <div key={item.label} className="rounded-xl border border-border bg-surface-2 p-4">
                <p className="text-lg font-semibold">{item.value}</p>
                <p className="text-xs text-text-secondary">{item.label}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-border bg-surface p-8">
          <h2 className="text-xl font-semibold">{t('auth.loginPage.panelTitle', 'Sign in')}</h2>
          <p className="mt-1 text-sm text-text-secondary">{t('auth.loginPage.panelSubtitle', 'Use your account credentials or social auth.')}</p>

          <div className="mt-4 flex flex-col gap-2">
            <button
              type="button"
              onClick={handleGoogleLogin}
              className="flex w-full items-center justify-center gap-3 rounded-lg border border-border bg-surface-2 px-4 py-2.5 text-sm text-text-secondary hover:bg-surface"
            >
              <GoogleIcon />
              {t('auth.loginPage.continueGoogle', 'Continue with Google')}
            </button>
            <button
              type="button"
              onClick={handleFacebookLogin}
              className="flex w-full items-center justify-center gap-3 rounded-lg bg-[#1877F2] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#166FE5]"
            >
              <FacebookIcon />
              {t('auth.loginPage.continueFacebook', 'Continue with Facebook')}
            </button>
          </div>

          <div className="my-4 flex items-center gap-3">
            <div className="h-px flex-1 bg-border" />
            <span className="text-xs text-text-tertiary">{t('auth.loginPage.orEmail', 'or email')}</span>
            <div className="h-px flex-1 bg-border" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label={t('auth.email', 'Email')}
              type="email"
              placeholder={t('auth.loginPage.emailPlaceholder', 'you@company.com')}
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
            />

            <Input
              label={t('auth.password', 'Password')}
              type="password"
              placeholder={t('auth.loginPage.passwordPlaceholder', '••••••••')}
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
            />

            {error && <Alert variant="error">{error}</Alert>}

            <Button type="submit" fullWidth loading={loading} size="lg">
              {t('auth.loginButton', 'Login')}
            </Button>
          </form>

          <button
            type="button"
            onClick={handleDemoLogin}
            className="mt-3 w-full rounded-lg border border-dashed border-border bg-surface-2 px-4 py-2.5 text-sm text-text-tertiary hover:border-text-secondary hover:text-text-secondary"
          >
            {t('auth.loginPage.demoButton', 'Demo sign-in — no account required')}
          </button>

          <p className="mt-5 text-center text-sm text-text-secondary">
            {t('auth.loginPage.createPrompt', "Don't have an account?")}{' '}
            <Link href="/register" className="font-medium text-primary hover:underline">
              {t('auth.loginPage.createLink', 'Create one')}
            </Link>
          </p>
        </section>
      </div>
    </main>
  )
}
