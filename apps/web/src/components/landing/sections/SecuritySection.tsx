'use client'

import { ShieldCheck } from 'lucide-react'
import { PublicContainer } from '@/components/public/PublicLayout'
import { useI18n } from '@/i18n/use-i18n'

export function SecuritySection() {
  const { t } = useI18n()

  return (
    <section aria-labelledby="security-heading" className="bg-surface py-16">
      <PublicContainer>
        <div className="grid gap-6 md:grid-cols-2">
          <article className="rounded-2xl border border-border bg-white p-8">
            <h2 id="security-heading" className="text-2xl font-semibold md:text-3xl">
              {t('publicSite.home.security.title', '')}
            </h2>
            <p className="mt-3 text-text-secondary">{t('publicSite.home.security.intro', '')}</p>
            <ul className="mt-5 space-y-2 text-sm text-text-secondary">
              {[0, 1, 2, 3].map((i) => (
                <li key={i} className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 shrink-0 text-[#65a30d]" aria-hidden="true" />
                  {t(`publicSite.home.security.bullet${i}`, '')}
                </li>
              ))}
            </ul>
          </article>

          <article className="rounded-2xl border border-border bg-white p-8">
            <h2 className="text-2xl font-semibold md:text-3xl">{t('publicSite.home.revenue.title', '')}</h2>
            <p className="mt-3 text-text-secondary">{t('publicSite.home.revenue.intro', '')}</p>
            <dl className="mt-5 grid grid-cols-2 gap-3">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="rounded-xl border border-border bg-surface-2 p-3">
                  <dt className="text-xs text-text-tertiary">{t(`publicSite.home.revenue.cell${i}.k`, '')}</dt>
                  <dd className="mt-1 text-sm font-semibold">{t(`publicSite.home.revenue.cell${i}.v`, '')}</dd>
                </div>
              ))}
            </dl>
          </article>
        </div>
      </PublicContainer>
    </section>
  )
}
