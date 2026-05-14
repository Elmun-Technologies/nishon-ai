'use client'

import { CheckCircle2 } from 'lucide-react'
import { PublicContainer } from '@/components/public/PublicLayout'
import { useI18n } from '@/i18n/use-i18n'
import { SectionHeader } from '../ui/SectionHeader'
import { LandingButton } from '../ui/LandingButton'
import { LandingCard } from '../ui/LandingCard'
import { MONETIZATION_KEYS, PLAN_KEYS } from '../constants'

export function PricingSection() {
  const { t } = useI18n()

  return (
    <section
      aria-labelledby="pricing-heading"
      className="border-y border-[#e6efd9] bg-[#fafdf5] py-20 md:py-28"
    >
      <PublicContainer>
        <SectionHeader
          titleId="pricing-heading"
          eyebrow={t('publicSite.home.pricing.eyebrow', '')}
          title={t('publicSite.home.pricing.title', '')}
          description={t('publicSite.home.pricing.subtitle', '')}
          align="center"
        />

        <div className="mt-14 grid gap-5 md:grid-cols-2 xl:grid-cols-5">
          {PLAN_KEYS.map((planKey) => {
            const featured = planKey === 'growth'
            const points = [0, 1, 2, 3].map((i) => t(`publicSite.home.plans.${planKey}.points.${i}`, ''))
            return (
              <article
                key={planKey}
                aria-label={t(`publicSite.home.plans.${planKey}.name`, planKey)}
                className={`relative flex flex-col rounded-2xl p-6 transition-colors ${
                  featured
                    ? 'bg-[#1b2e06] text-white shadow-[0_24px_60px_-24px_rgba(27,46,6,0.55)] ring-1 ring-[#243a12]'
                    : 'bg-white ring-1 ring-inset ring-[#e6efd9] shadow-[0_1px_2px_rgba(27,46,6,0.04)]'
                }`}
              >
                {featured ? (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-[#a3e635] px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-[#1a2e05] shadow-[0_4px_12px_-2px_rgba(27,46,6,0.4)]">
                    {t('publicSite.home.pricing.popular', '')}
                  </span>
                ) : null}
                <h3
                  className={`text-base font-medium tracking-tight ${featured ? 'text-white' : 'text-text-primary'}`}
                >
                  {t(`publicSite.home.plans.${planKey}.name`, '')}
                </h3>
                <p
                  className={`mt-3 text-3xl font-semibold tracking-tight ${featured ? 'text-[#d9f99d]' : 'text-text-primary'}`}
                >
                  {t(`publicSite.home.plans.${planKey}.price`, '')}
                </p>
                <p className={`mt-1.5 text-xs ${featured ? 'text-white/70' : 'text-text-tertiary'}`}>
                  {t(`publicSite.home.plans.${planKey}.who`, '')}
                </p>
                <ul
                  className={`mt-6 flex-1 space-y-2.5 text-xs ${featured ? 'text-white/80' : 'text-text-secondary'}`}
                >
                  {points.map((item) => (
                    <li key={item} className="flex items-start gap-2">
                      <CheckCircle2
                        className={`mt-0.5 h-3.5 w-3.5 shrink-0 ${featured ? 'text-[#a3e635]' : 'text-[#65a30d]'}`}
                        aria-hidden="true"
                      />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-6">
                  {featured ? (
                    <a
                      href="/onboarding"
                      className="inline-flex h-10 w-full items-center justify-center rounded-full bg-[#a3e635] text-sm font-medium text-[#1a2e05] transition hover:bg-[#bef264] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                    >
                      {t('publicSite.home.pricing.cta', '')}
                    </a>
                  ) : (
                    <LandingButton href="/onboarding" variant="secondary" size="sm" className="w-full">
                      {t('publicSite.home.pricing.cta', '')}
                    </LandingButton>
                  )}
                </div>
              </article>
            )
          })}
        </div>

        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {MONETIZATION_KEYS.map((item) => {
            const Icon = item.icon
            return (
              <LandingCard key={item.key} tone="plain" className="flex flex-col">
                <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[#f4f9ea] text-[#3f6212] ring-1 ring-inset ring-[#dfeacb]">
                  <Icon className="h-4 w-4" aria-hidden="true" />
                </div>
                <h3 className="mt-5 text-base font-medium tracking-tight text-text-primary">
                  {t(`publicSite.home.monetization.${item.key}.title`, '')}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-text-secondary">
                  {t(`publicSite.home.monetization.${item.key}.text`, '')}
                </p>
              </LandingCard>
            )
          })}
        </div>
      </PublicContainer>
    </section>
  )
}
