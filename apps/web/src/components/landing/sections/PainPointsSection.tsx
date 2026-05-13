'use client'

import { Zap } from 'lucide-react'
import { PublicContainer } from '@/components/public/PublicLayout'
import { useI18n } from '@/i18n/use-i18n'
import { PAIN_ICONS, PAIN_KEYS } from '../constants'

export function PainPointsSection() {
  const { t } = useI18n()

  return (
    <section aria-labelledby="pain-heading" className="bg-surface py-16">
      <PublicContainer>
        <div className="mb-9 max-w-3xl">
          <p className="text-sm font-medium text-[#65a30d]">{t('publicSite.home.painPoints.eyebrow', '')}</p>
          <h2 id="pain-heading" className="mt-1 text-3xl font-semibold md:text-4xl">
            {t('publicSite.home.painPoints.title', '')}
          </h2>
          <p className="mt-2 text-text-secondary">{t('publicSite.home.painPoints.subtitle', '')}</p>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {PAIN_KEYS.map((key) => {
            const Icon = PAIN_ICONS[key]
            return (
              <article key={key} className="rounded-2xl border border-border bg-white p-6">
                <div className="mb-3 inline-flex rounded-xl border border-[#fecaca] bg-[#fef2f2] p-2 text-[#b91c1c]">
                  <Icon className="h-4 w-4" aria-hidden="true" />
                </div>
                <h3 className="text-heading font-semibold">{t(`publicSite.home.painPoints.${key}.title`, '')}</h3>
                <p className="mt-2 text-body-sm text-text-secondary">
                  {t(`publicSite.home.painPoints.${key}.problem`, '')}
                </p>
                <div className="mt-4 rounded-xl border border-[#bbf7d0] bg-[#f0fdf4] p-3 text-sm text-[#166534]">
                  <p className="flex items-start gap-2">
                    <Zap className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                    <span>{t(`publicSite.home.painPoints.${key}.solution`, '')}</span>
                  </p>
                </div>
              </article>
            )
          })}
        </div>
      </PublicContainer>
    </section>
  )
}
