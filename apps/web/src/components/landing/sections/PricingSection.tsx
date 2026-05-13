'use client'

import Link from 'next/link'
import { CheckCircle2 } from 'lucide-react'
import { PublicContainer } from '@/components/public/PublicLayout'
import { useI18n } from '@/i18n/use-i18n'
import { MONETIZATION_KEYS, PLAN_KEYS } from '../constants'

export function PricingSection() {
  const { t } = useI18n()

  return (
    <section aria-labelledby="pricing-heading" className="border-y border-border bg-[#f8fbf2] py-16">
      <PublicContainer>
        <div className="mb-8 text-center">
          <p className="text-sm font-medium text-[#65a30d]">{t('publicSite.home.pricing.eyebrow', '')}</p>
          <h2 id="pricing-heading" className="mt-1 text-4xl font-semibold">
            {t('publicSite.home.pricing.title', '')}
          </h2>
          <p className="mx-auto mt-3 max-w-3xl text-text-secondary">{t('publicSite.home.pricing.subtitle', '')}</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          {PLAN_KEYS.map((planKey) => {
            const featured = planKey === 'growth'
            const points = [0, 1, 2, 3].map((i) => t(`publicSite.home.plans.${planKey}.points.${i}`, ''))
            return (
              <article
                key={planKey}
                className={`relative rounded-2xl border p-5 ${
                  featured ? 'border-[#84cc16] bg-[#1f2b0f] text-white' : 'border-border bg-white'
                }`}
                aria-label={t(`publicSite.home.plans.${planKey}.name`, planKey)}
              >
                {featured && (
                  <span className="absolute -top-3 left-5 rounded-full bg-[#84cc16] px-3 py-1 text-xs font-semibold text-[#1a2e05]">
                    {t('publicSite.home.pricing.popular', '')}
                  </span>
                )}
                <h3 className="text-lg font-semibold">{t(`publicSite.home.plans.${planKey}.name`, '')}</h3>
                <p className={`mt-2 text-xl font-semibold ${featured ? 'text-[#d9f99d]' : 'text-text-primary'}`}>
                  {t(`publicSite.home.plans.${planKey}.price`, '')}
                </p>
                <p className={`mt-1 text-xs ${featured ? 'text-slate-300' : 'text-text-secondary'}`}>
                  {t(`publicSite.home.plans.${planKey}.who`, '')}
                </p>
                <ul className={`mt-4 space-y-2 text-xs ${featured ? 'text-slate-200' : 'text-text-secondary'}`}>
                  {points.map((item) => (
                    <li key={item} className="flex items-start gap-2">
                      <CheckCircle2
                        className={`mt-0.5 h-3.5 w-3.5 shrink-0 ${featured ? 'text-[#d9f99d]' : 'text-[#65a30d]'}`}
                        aria-hidden="true"
                      />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  href="/onboarding"
                  className={`mt-5 block rounded-lg px-3 py-2 text-center text-xs font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#3f6212] ${
                    featured
                      ? 'bg-[#84cc16] text-[#1a2e05]'
                      : 'border border-border bg-surface text-text-primary hover:bg-surface-2'
                  }`}
                >
                  {t('publicSite.home.pricing.cta', '')}
                </Link>
              </article>
            )
          })}
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {MONETIZATION_KEYS.map((item) => {
            const Icon = item.icon
            return (
              <article key={item.key} className="rounded-2xl border border-border bg-white p-5">
                <div className="mb-3 inline-flex rounded-xl border border-border bg-[#f4f9ea] p-2 text-[#65a30d]">
                  <Icon className="h-4 w-4" aria-hidden="true" />
                </div>
                <h3 className="font-semibold">{t(`publicSite.home.monetization.${item.key}.title`, '')}</h3>
                <p className="mt-2 text-sm text-text-secondary">
                  {t(`publicSite.home.monetization.${item.key}.text`, '')}
                </p>
              </article>
            )
          })}
        </div>
      </PublicContainer>
    </section>
  )
}
