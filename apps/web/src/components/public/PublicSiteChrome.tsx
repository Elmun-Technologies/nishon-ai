'use client'

import Link from 'next/link'
import { useI18n } from '@/i18n/use-i18n'
import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher'
import { PublicContainer } from '@/components/public/PublicContainer'

export function PublicNavbar() {
  const { t } = useI18n()

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-surface/90 backdrop-blur">
      <PublicContainer className="flex h-16 items-center justify-between gap-3">
        <Link href="/" className="shrink-0 text-lg font-semibold text-text-primary">
          {t('publicSite.brand', 'AdSpectr AI')}
        </Link>

        <nav className="hidden flex-1 items-center justify-center gap-6 text-sm text-text-secondary md:flex">
          <Link href="/features" className="hover:text-text-primary">
            {t('publicSite.nav.features', 'Features')}
          </Link>
          <Link href="/solutions" className="hover:text-text-primary">
            {t('publicSite.nav.solutions', 'Solutions')}
          </Link>
          <Link href="/marketplace" className="hover:text-text-primary">
            {t('publicSite.nav.marketplace', 'Marketplace')}
          </Link>
          <Link href="/leaderboard" className="hover:text-text-primary">
            {t('publicSite.nav.leaderboard', 'Leaderboard')}
          </Link>
          <Link href="/portfolio" className="hover:text-text-primary">
            {t('publicSite.nav.portfolio', 'Portfolio')}
          </Link>
        </nav>

        <div className="flex shrink-0 items-center gap-2">
          <div className="hidden sm:block">
            <LanguageSwitcher />
          </div>
          <Link
            href="/login"
            className="rounded-lg border border-border px-3 py-2 text-sm text-text-secondary hover:bg-surface-2"
          >
            {t('publicSite.cta.login', 'Login')}
          </Link>
          <Link
            href="/register"
            className="rounded-lg bg-primary px-3 py-2 text-sm font-medium text-white hover:opacity-95"
          >
            {t('publicSite.cta.startFree', 'Start Free')}
          </Link>
        </div>
      </PublicContainer>
    </header>
  )
}

export function PublicFooter() {
  const { t } = useI18n()

  return (
    <footer className="border-t border-border bg-surface">
      <PublicContainer className="flex flex-col gap-4 py-6 text-sm text-text-secondary md:flex-row md:items-center md:justify-between">
        <p>{t('publicSite.footer.tagline', 'AdSpectr AI - Campaign Operations Platform')}</p>
        <div className="flex flex-wrap items-center gap-4">
          <Link href="/features" className="hover:text-text-primary">
            {t('publicSite.footer.features', 'Features')}
          </Link>
          <Link href="/solutions" className="hover:text-text-primary">
            {t('publicSite.footer.solutions', 'Solutions')}
          </Link>
          <Link href="/terms" className="hover:text-text-primary">
            {t('publicSite.footer.terms', 'Terms')}
          </Link>
          <Link href="/privacy" className="hover:text-text-primary">
            {t('publicSite.footer.privacy', 'Privacy')}
          </Link>
        </div>
      </PublicContainer>
    </footer>
  )
}
