'use client'

import Link from 'next/link'
import { Lock } from 'lucide-react'
import { PublicContainer } from '@/components/public/PublicLayout'
import { useI18n } from '@/i18n/use-i18n'

export function FinalCtaSection() {
  const { t } = useI18n()

  return (
    <section aria-labelledby="final-cta-heading" className="bg-surface py-16">
      <PublicContainer>
        <div className="grid items-center gap-8 md:grid-cols-[1fr_1fr]">
          <div>
            <p className="text-sm font-medium text-[#65a30d]">{t('publicSite.home.finalCta.eyebrow', '')}</p>
            <h2 id="final-cta-heading" className="mt-1 text-4xl font-semibold md:text-5xl">
              {t('publicSite.home.finalCta.title', '')}
            </h2>
            <p className="mt-3 text-lg text-text-secondary">{t('publicSite.home.finalCta.subtitle', '')}</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/onboarding"
                className="rounded-xl bg-[#84cc16] px-5 py-3 text-sm font-semibold text-[#1a2e05] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#3f6212]"
              >
                {t('publicSite.cta.startFree', '')}
              </Link>
              <Link
                href="/solutions"
                className="rounded-xl border border-border bg-white px-5 py-3 text-sm font-medium focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#3f6212]"
              >
                {t('publicSite.home.finalCta.solutions', '')}
              </Link>
            </div>
            <p className="mt-3 text-xs text-text-tertiary">{t('publicSite.home.finalCta.note', '')}</p>
          </div>
          <div className="rounded-2xl border border-border bg-[#f8fbf2] p-6">
            <div className="mb-4 flex items-center justify-between">
              <p className="font-semibold">{t('publicSite.home.snapshot.title', '')}</p>
              <Lock className="h-4 w-4 text-[#65a30d]" aria-hidden="true" />
            </div>
            <ul className="space-y-3">
              {[0, 1, 2, 3].map((i) => (
                <li
                  key={i}
                  className="flex items-center justify-between rounded-lg border border-border bg-white px-3 py-2.5"
                >
                  <span className="text-sm">{t(`publicSite.home.snapshot.row${i}.label`, '')}</span>
                  <span className="text-xs font-medium text-[#65a30d]">
                    {t(`publicSite.home.snapshot.row${i}.status`, '')}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </PublicContainer>
    </section>
  )
}
