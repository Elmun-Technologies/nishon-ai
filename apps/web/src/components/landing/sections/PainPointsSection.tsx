'use client'

import { Zap } from 'lucide-react'
import { PublicContainer } from '@/components/public/PublicLayout'
import { useI18n } from '@/i18n/use-i18n'
import { SectionHeader } from '../ui/SectionHeader'
import { LandingCard } from '../ui/LandingCard'
import { PAIN_ICONS, PAIN_KEYS } from '../constants'

export function PainPointsSection() {
  const { t } = useI18n()

  return (
    <section aria-labelledby="pain-heading" className="bg-white py-20 md:py-28">
      <PublicContainer>
        <SectionHeader
          titleId="pain-heading"
          eyebrow={t('publicSite.home.painPoints.eyebrow', '')}
          title={t('publicSite.home.painPoints.title', '')}
          description={t('publicSite.home.painPoints.subtitle', '')}
        />

        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {PAIN_KEYS.map((key) => {
            const Icon = PAIN_ICONS[key]
            return (
              <LandingCard key={key} tone="elevated" className="flex flex-col">
                <div className="mb-5 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[#fef2f2] text-[#b91c1c] ring-1 ring-inset ring-[#fecaca]">
                  <Icon className="h-4 w-4" aria-hidden="true" />
                </div>
                <h3 className="text-lg font-medium tracking-tight text-text-primary">
                  {t(`publicSite.home.painPoints.${key}.title`, '')}
                </h3>
                <p className="mt-2 text-sm text-text-secondary">
                  {t(`publicSite.home.painPoints.${key}.problem`, '')}
                </p>
                <div className="mt-5 flex items-start gap-2.5 rounded-xl bg-[#f0fdf4] p-3.5 text-sm text-[#166534] ring-1 ring-inset ring-[#bbf7d0]">
                  <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#bbf7d0] text-[#166534]">
                    <Zap className="h-3 w-3" aria-hidden="true" />
                  </span>
                  <span>{t(`publicSite.home.painPoints.${key}.solution`, '')}</span>
                </div>
              </LandingCard>
            )
          })}
        </div>
      </PublicContainer>
    </section>
  )
}
