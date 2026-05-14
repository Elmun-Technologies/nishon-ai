'use client'

import { ShieldCheck } from 'lucide-react'
import { PublicContainer } from '@/components/public/PublicLayout'
import { useI18n } from '@/i18n/use-i18n'
import { LandingCard } from '../ui/LandingCard'

export function SecuritySection() {
  const { t } = useI18n()

  return (
    <section aria-labelledby="security-heading" className="bg-white py-20 md:py-28">
      <PublicContainer>
        <div className="grid gap-6 md:grid-cols-2">
          <LandingCard tone="elevated" className="p-8 md:p-10">
            <h2 id="security-heading" className="text-2xl font-medium tracking-tight text-text-primary md:text-3xl">
              {t('publicSite.home.security.title', '')}
            </h2>
            <p className="mt-3 text-text-secondary">{t('publicSite.home.security.intro', '')}</p>
            <ul className="mt-6 space-y-2.5 text-sm text-text-secondary">
              {[0, 1, 2, 3].map((i) => (
                <li key={i} className="flex items-start gap-2.5">
                  <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#ecfccb] text-[#3f6212]">
                    <ShieldCheck className="h-3 w-3" aria-hidden="true" />
                  </span>
                  {t(`publicSite.home.security.bullet${i}`, '')}
                </li>
              ))}
            </ul>
          </LandingCard>

          <LandingCard tone="elevated" className="p-8 md:p-10">
            <h2 className="text-2xl font-medium tracking-tight text-text-primary md:text-3xl">
              {t('publicSite.home.revenue.title', '')}
            </h2>
            <p className="mt-3 text-text-secondary">{t('publicSite.home.revenue.intro', '')}</p>
            <dl className="mt-6 grid grid-cols-2 gap-3">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="rounded-xl bg-[#fafdf5] p-3.5 ring-1 ring-inset ring-[#eef3e3]">
                  <dt className="text-[10px] font-semibold uppercase tracking-wider text-text-tertiary">
                    {t(`publicSite.home.revenue.cell${i}.k`, '')}
                  </dt>
                  <dd className="mt-1 text-sm font-medium text-text-primary">
                    {t(`publicSite.home.revenue.cell${i}.v`, '')}
                  </dd>
                </div>
              ))}
            </dl>
          </LandingCard>
        </div>
      </PublicContainer>
    </section>
  )
}
