'use client'

import Link from 'next/link'
import { PublicContainer, PublicFooter, PublicNavbar } from '@/components/public/PublicLayout'
import { useI18n } from '@/i18n/use-i18n'

export default function OnboardingPage() {
  const { t } = useI18n()
  const o = (k: string, fb = '') => t(`publicSite.marketing.onboarding.${k}`, fb)

  return (
    <main className="min-h-screen bg-surface text-text-primary">
      <PublicNavbar />
      <section className="border-b border-border bg-[#f7faf2] py-14">
        <PublicContainer className="max-w-2xl">
          <h1 className="text-3xl font-semibold md:text-4xl">{o('title')}</h1>
          <p className="mt-4 text-lg text-text-secondary">{o('subtitle')}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/login" className="rounded-xl border border-border bg-white px-5 py-3 text-sm font-medium hover:bg-surface-2">
              {o('login')}
            </Link>
            <Link href="/register" className="rounded-xl bg-[#84cc16] px-5 py-3 text-sm font-semibold text-[#1a2e05] hover:opacity-90">
              {o('register')}
            </Link>
          </div>
        </PublicContainer>
      </section>
      <PublicFooter />
    </main>
  )
}
