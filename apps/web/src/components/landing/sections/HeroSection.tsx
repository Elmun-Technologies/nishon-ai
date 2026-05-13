'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import { ArrowRight, CheckCircle2 } from 'lucide-react'
import { PublicContainer } from '@/components/public/PublicLayout'
import { ContentMediaSlot } from '@/components/media/ContentMediaSlot'
import { useI18n } from '@/i18n/use-i18n'

export function HeroSection() {
  const { t } = useI18n()

  const heroBullets = useMemo(
    () => [0, 1, 2].map((i) => t(`publicSite.home.hero.bullet${i}`, '')),
    [t],
  )
  const stats = useMemo(
    () =>
      [0, 1, 2, 3].map((i) => ({
        v: t(`publicSite.home.stats.${i}.value`, ''),
        l: t(`publicSite.home.stats.${i}.label`, ''),
      })),
    [t],
  )

  return (
    <section aria-labelledby="hero-heading" className="border-b border-border bg-[#f7faf2]">
      <PublicContainer className="grid gap-10 py-14 md:grid-cols-[1.1fr_1fr] md:py-20">
        <div>
          <p className="inline-flex rounded-full border border-[#b5d98f] bg-[#ebf8d9] px-3 py-1 text-xs font-medium text-[#3f6212]">
            {t('landing.hero.badge', '')}
          </p>
          <h1 id="hero-heading" className="mt-4 text-4xl font-semibold leading-tight md:text-6xl">
            {t('landing.hero.title1', '')}
            <br />
            {t('landing.hero.title2', '')}
            <br />
            <span className="text-[#3f6212]">{t('landing.hero.title3', '')}</span>
          </h1>
          <p className="mt-4 max-w-xl text-lg text-text-secondary">{t('landing.hero.subtitle', '')}</p>
          <ul className="mt-6 space-y-2 text-sm text-text-secondary">
            {heroBullets.map((line) => (
              <li key={line} className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-[#65a30d]" aria-hidden="true" />
                {line}
              </li>
            ))}
          </ul>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link
              href="/onboarding"
              className="rounded-xl bg-[#84cc16] px-5 py-3 text-sm font-semibold text-[#1a2e05] transition hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#3f6212]"
            >
              {t('landing.hero.buttonStart', '')}
            </Link>
            <Link
              href="/features"
              className="inline-flex items-center gap-2 rounded-xl border border-border bg-white px-5 py-3 text-sm font-medium transition hover:bg-surface-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#3f6212]"
            >
              {t('publicSite.home.hero.secondaryCta', '')}
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
          <p className="mt-4 text-xs text-text-tertiary">{t('publicSite.home.hero.noCard', '')}</p>
        </div>

        <div className="space-y-3">
          <ContentMediaSlot
            slotId="public-home-hero-media"
            ratio="16:9"
            imageSrc="/stock/home-hero-demo.svg"
            imageAlt={t('landing.hero.title1', 'Nishon AI')}
            caption={t('preAuthOnboarding.mediaSlotCaption', 'Illustration / motion')}
            priority
          />
          <div className="grid gap-3 sm:grid-cols-2">
            {stats.map((item) => (
              <article key={item.l} className="rounded-2xl border border-border bg-white p-5">
                <p className="text-2xl font-semibold">{item.v}</p>
                <p className="mt-1 text-sm text-text-secondary">{item.l}</p>
              </article>
            ))}
          </div>
        </div>
      </PublicContainer>
    </section>
  )
}
