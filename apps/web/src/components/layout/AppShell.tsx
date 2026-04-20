'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { useWorkspaceStore } from '@/stores/workspace.store'
import { getAccessToken } from '@/lib/auth-storage'
import Sidebar from '@/components/layout/Sidebar'
import Header from '@/components/layout/Header'
import { Button } from '@/components/ui/Button'
import { useDashboardContentGate } from '@/hooks/use-dashboard-content-gate'
import { useI18n } from '@/i18n/use-i18n'
import { cn } from '@/lib/utils'

export default function AppShell({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const { t } = useI18n()
  const { accessToken } = useWorkspaceStore()
  const { mode, showBlur } = useDashboardContentGate()

  useEffect(() => {
    const token = accessToken || (typeof window !== 'undefined' ? getAccessToken() : null)

    if (!token) {
      router.push('/login')
    }
  }, [accessToken, router])

  return (
    <div className="flex h-screen overflow-hidden bg-gradient-to-br from-brand-white via-[#f2faeb] to-brand-lime/25 text-text-primary dark:from-brand-ink dark:via-[#1f3510] dark:to-brand-ink">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <Header />
        <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden">
            <main
            className={cn(
              'flex-1 overflow-y-auto p-4 md:p-5 lg:p-6',
              showBlur && 'pointer-events-none select-none'
            )}
            aria-hidden={showBlur}
          >
            {children}
          </main>
          {showBlur ? (
            <div
              className="absolute inset-0 z-20 flex flex-col items-center justify-center p-6"
              role="dialog"
              aria-modal="true"
              aria-labelledby="dashboard-gate-title"
              aria-describedby="dashboard-gate-desc"
            >
              <div
                className="absolute inset-0 backdrop-blur-md bg-white/50 dark:bg-brand-ink/55"
                aria-hidden
              />
              <div className="relative z-10 w-full max-w-md rounded-2xl border border-border bg-surface-primary/95 p-6 shadow-lg dark:bg-surface-secondary/95">
                {mode === 'loading' ? (
                  <>
                    <div className="flex justify-center py-6">
                      <Loader2 className="h-10 w-10 animate-spin text-primary" aria-hidden />
                    </div>
                    <h2 id="dashboard-gate-title" className="text-center text-base font-semibold text-text-primary">
                      {t('dashboard.contentGate.loadingTitle')}
                    </h2>
                    <p id="dashboard-gate-desc" className="mt-2 text-center text-sm text-text-secondary">
                      {t('dashboard.contentGate.loadingBody')}
                    </p>
                  </>
                ) : mode === 'trial_expired' ? (
                  <>
                    <h2 id="dashboard-gate-title" className="text-lg font-semibold text-text-primary">
                      {t('dashboard.contentGate.trialTitle')}
                    </h2>
                    <p id="dashboard-gate-desc" className="mt-2 text-sm text-text-secondary">
                      {t('dashboard.contentGate.trialBody')}
                    </p>
                    <div className="mt-6">
                      <Button
                        type="button"
                        fullWidth
                        onClick={() => router.push('/settings/workspace/payments')}
                      >
                        {t('dashboard.contentGate.trialCta')}
                      </Button>
                    </div>
                  </>
                ) : mode === 'onboarding' ? (
                  <>
                    <h2 id="dashboard-gate-title" className="text-lg font-semibold text-text-primary">
                      {t('dashboard.contentGate.onboardingTitle')}
                    </h2>
                    <p id="dashboard-gate-desc" className="mt-2 text-sm text-text-secondary">
                      {t('dashboard.contentGate.onboardingBody')}
                    </p>
                    <div className="mt-6 flex flex-col gap-2 sm:flex-row">
                      <Button type="button" className="sm:flex-1" onClick={() => router.push('/onboarding')}>
                        {t('dashboard.contentGate.onboardingCta')}
                      </Button>
                      <Button
                        type="button"
                        variant="secondary"
                        className="sm:flex-1"
                        onClick={() => router.push('/settings/workspace/profile')}
                      >
                        {t('dashboard.contentGate.workspaceSettingsCta')}
                      </Button>
                    </div>
                  </>
                ) : (
                  <>
                    <h2 id="dashboard-gate-title" className="text-lg font-semibold text-text-primary">
                      {t('dashboard.contentGate.adAccountTitle')}
                    </h2>
                    <p id="dashboard-gate-desc" className="mt-2 text-sm text-text-secondary">
                      {t('dashboard.contentGate.adAccountBody')}
                    </p>
                    <div className="mt-6">
                      <Button type="button" fullWidth onClick={() => router.push('/settings/meta')}>
                        {t('dashboard.contentGate.adAccountCta')}
                      </Button>
                    </div>
                  </>
                )}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}
