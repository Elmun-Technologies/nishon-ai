'use client'

import Link from 'next/link'
import { ArrowRight, CheckCircle2 } from 'lucide-react'
import { PublicContainer } from '@/components/public/PublicLayout'
import { useI18n } from '@/i18n/use-i18n'
import { SectionHeader } from '../ui/SectionHeader'
import { LandingCard } from '../ui/LandingCard'
import { USE_CASE_ICONS, USE_CASE_KEYS } from '../constants'

export function UseCasesSection() {
  const { t } = useI18n()

  return (
    <section
      aria-labelledby="usecases-heading"
      className="border-y border-[#e6efd9] bg-[#fafdf5] py-20 md:py-28"
    >
      <PublicContainer>
        <SectionHeader
          titleId="usecases-heading"
          eyebrow={t('publicSite.home.useCases.eyebrow', '')}
          title={t('publicSite.home.useCases.title', '')}
          description={t('publicSite.home.useCases.subtitle', '')}
        />

        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {USE_CASE_KEYS.map((key) => {
            const Icon = USE_CASE_ICONS[key]
            const points = [0, 1, 2].map((i) => t(`publicSite.home.useCases.${key}.points.${i}`, ''))
            return (
              <LandingCard key={key} tone="elevated" className="flex flex-col">
                <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[#f4f9ea] text-[#3f6212] ring-1 ring-inset ring-[#dfeacb]">
                  <Icon className="h-4 w-4" aria-hidden="true" />
                </div>
                <h3 className="mt-5 text-xl font-medium tracking-tight text-text-primary">
                  {t(`publicSite.home.useCases.${key}.title`, '')}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-text-secondary">
                  {t(`publicSite.home.useCases.${key}.desc`, '')}
                </p>
                <ul className="mt-5 space-y-2 text-sm text-text-secondary">
                  {points.map((p) => (
                    <li key={p} className="flex items-start gap-2">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#65a30d]" aria-hidden="true" />
                      <span>{p}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  href={t(`publicSite.home.useCases.${key}.href`, '/features')}
                  className="mt-6 inline-flex items-center gap-1 text-sm font-medium text-[#3f6212] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1b2e06]"
                >
                  {t('publicSite.home.useCases.cta', '')}
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              </LandingCard>
            )
          })}
        </div>
      </PublicContainer>
    </section>
  )
}
