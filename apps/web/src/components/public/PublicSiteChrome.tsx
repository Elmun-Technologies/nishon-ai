'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Menu, X } from 'lucide-react'
import { useI18n } from '@/i18n/use-i18n'
import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher'
import { PublicContainer } from '@/components/public/PublicContainer'
import { LandingButton } from '@/components/landing/ui/LandingButton'
import { cn } from '@/lib/utils'

const NAV_LINKS = [
  { href: '/features', i18nKey: 'publicSite.nav.features', label: 'Features' },
  { href: '/solutions', i18nKey: 'publicSite.nav.solutions', label: 'Solutions' },
  { href: '/marketplace', i18nKey: 'publicSite.nav.marketplace', label: 'Marketplace' },
] as const

export function PublicNavbar() {
  const { t } = useI18n()
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [open])

  return (
    <header
      className={cn(
        'sticky top-0 z-50 transition-all duration-300',
        scrolled
          ? 'border-b border-[#e6efd9] bg-white/80 backdrop-blur-md'
          : 'border-b border-transparent bg-white/40 backdrop-blur-sm',
      )}
    >
      <PublicContainer className="flex h-16 items-center justify-between gap-4">
        <Link
          href="/"
          className="group flex shrink-0 items-center gap-2 text-base font-semibold text-[#1b2e06] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#1b2e06]"
          aria-label={t('publicSite.brand', 'AdSpectr AI')}
        >
          <span
            aria-hidden="true"
            className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-[#1b2e06] text-[11px] font-bold text-[#d9f99d] transition group-hover:rotate-3"
          >
            A
          </span>
          <span className="tracking-tight">{t('publicSite.brand', 'AdSpectr AI')}</span>
        </Link>

        <nav
          aria-label={t('publicSite.nav.label', 'Primary')}
          className="hidden flex-1 items-center justify-center gap-1 md:flex"
        >
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-full px-3 py-1.5 text-sm font-medium text-text-secondary transition-colors hover:bg-[#f4f9ea] hover:text-text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1b2e06]"
            >
              {t(link.i18nKey, link.label)}
            </Link>
          ))}
        </nav>

        <div className="hidden shrink-0 items-center gap-2 md:flex">
          <LanguageSwitcher />
          <Link
            href="/login"
            className="rounded-full px-3 py-1.5 text-sm font-medium text-text-secondary transition-colors hover:text-text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1b2e06]"
          >
            {t('publicSite.cta.login', 'Login')}
          </Link>
          <LandingButton href="/onboarding" size="sm">
            {t('publicSite.cta.startFree', 'Start free')}
          </LandingButton>
        </div>

        <button
          type="button"
          aria-label={open ? t('publicSite.nav.close', 'Close menu') : t('publicSite.nav.open', 'Open menu')}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          className="inline-flex h-10 w-10 items-center justify-center rounded-full text-text-primary transition-colors hover:bg-[#f4f9ea] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1b2e06] md:hidden"
        >
          {open ? <X className="h-5 w-5" aria-hidden="true" /> : <Menu className="h-5 w-5" aria-hidden="true" />}
        </button>
      </PublicContainer>

      {open ? (
        <div className="md:hidden">
          <div className="border-t border-[#e6efd9] bg-white px-4 pb-6 pt-4">
            <nav aria-label="Mobile" className="flex flex-col gap-1">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="rounded-xl px-3 py-2.5 text-base font-medium text-text-primary hover:bg-[#f4f9ea]"
                >
                  {t(link.i18nKey, link.label)}
                </Link>
              ))}
            </nav>
            <div className="mt-4 flex items-center justify-between gap-2">
              <LanguageSwitcher />
              <div className="flex flex-1 items-center justify-end gap-2">
                <Link
                  href="/login"
                  onClick={() => setOpen(false)}
                  className="rounded-full px-3 py-2 text-sm font-medium text-text-secondary"
                >
                  {t('publicSite.cta.login', 'Login')}
                </Link>
                <LandingButton href="/onboarding" size="sm" onClick={() => setOpen(false)}>
                  {t('publicSite.cta.startFree', 'Start free')}
                </LandingButton>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </header>
  )
}

const FOOTER_COLUMNS = [
  {
    titleKey: 'publicSite.footer.columns.product',
    titleDefault: 'Product',
    links: [
      { href: '/features', i18nKey: 'publicSite.footer.features', label: 'Features' },
      { href: '/solutions', i18nKey: 'publicSite.footer.solutions', label: 'Solutions' },
      { href: '/marketplace', i18nKey: 'publicSite.nav.marketplace', label: 'Marketplace' },
    ],
  },
  {
    titleKey: 'publicSite.footer.columns.company',
    titleDefault: 'Company',
    links: [
      { href: '/solutions', i18nKey: 'publicSite.footer.about', label: 'About' },
      { href: '/marketplace', i18nKey: 'publicSite.footer.experts', label: 'Experts' },
    ],
  },
  {
    titleKey: 'publicSite.footer.columns.legal',
    titleDefault: 'Legal',
    links: [
      { href: '/terms', i18nKey: 'publicSite.footer.terms', label: 'Terms' },
      { href: '/privacy', i18nKey: 'publicSite.footer.privacy', label: 'Privacy' },
      { href: '/data-deletion', i18nKey: 'publicSite.footer.dataDeletion', label: 'Data deletion' },
    ],
  },
] as const

export function PublicFooter() {
  const { t } = useI18n()
  const year = new Date().getFullYear()

  return (
    <footer className="border-t border-[#e6efd9] bg-white">
      <PublicContainer className="py-14">
        <div className="grid gap-10 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div>
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-base font-semibold text-[#1b2e06]"
              aria-label={t('publicSite.brand', 'AdSpectr AI')}
            >
              <span
                aria-hidden="true"
                className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-[#1b2e06] text-[11px] font-bold text-[#d9f99d]"
              >
                A
              </span>
              <span className="tracking-tight">{t('publicSite.brand', 'AdSpectr AI')}</span>
            </Link>
            <p className="mt-4 max-w-sm text-sm text-text-secondary">
              {t('publicSite.footer.tagline', 'Autonomous performance marketing for brands and agencies.')}
            </p>
            <div className="mt-6">
              <LanguageSwitcher />
            </div>
          </div>

          {FOOTER_COLUMNS.map((col) => (
            <div key={col.titleKey}>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-text-tertiary">
                {t(col.titleKey, col.titleDefault)}
              </p>
              <ul className="mt-4 space-y-2">
                {col.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-text-secondary transition-colors hover:text-text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1b2e06]"
                    >
                      {t(link.i18nKey, link.label)}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col gap-2 border-t border-[#eef3e3] pt-6 text-xs text-text-tertiary md:flex-row md:items-center md:justify-between">
          <p>© {year} AdSpectr AI · {t('publicSite.footer.rights', 'All rights reserved.')}</p>
          <p className="font-medium">{t('publicSite.footer.madeIn', 'Built in Tashkent for global teams.')}</p>
        </div>
      </PublicContainer>
    </footer>
  )
}
