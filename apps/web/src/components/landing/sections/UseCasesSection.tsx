'use client'

import Link from 'next/link'
import { ArrowRight, CheckCircle2 } from 'lucide-react'
import { PublicContainer } from '@/components/public/PublicLayout'
import { useI18n } from '@/i18n/use-i18n'
import { USE_CASE_ICONS, USE_CASE_KEYS } from '../constants'

export function UseCasesSection() {
  const { t } = useI18n()

  return (
    <section aria-labelledby="usecases-heading" className="border-y border-border bg-[#f8fbf2] py-16">
      <PublicContainer>
        <div className="mb-8 max-w-3xl">
          <p className="text-sm font-medium text-[#65a30d]">{t('publicSite.home.useCases.eyebrow', '')}</p>
          <h2 id="usecases-heading" className="mt-1 text-3xl font-semibold md:text-4xl">
            {t('publicSite.home.useCases.title', '')}
          </h2>
          <p className="mt-2 text-text-secondary">{t('publicSite.home.useCases.subtitle', '')}</p>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {USE_CASE_KEYS.map((key) => {
            const Icon = USE_CASE_ICONS[key]
            const points = [0, 1, 2].map((i) => t(`publicSite.home.useCases.${key}.points.${i}`, ''))
            return (
              <article key={key} className="rounded-2xl border border-border bg-white p-6">
                <div className="mb-3 inline-flex rounded-xl border border-border bg-[#f4f9ea] p-2 text-[#65a30d]">
                  <Icon className="h-4 w-4" aria-hidden="true" />
                </div>
                <h3 className="text-xl font-semibold">{t(`publicSite.home.useCases.${key}.title`, '')}</h3>
                <p className="mt-2 text-sm text-text-secondary">
                  {t(`publicSite.home.useCases.${key}.desc`, '')}
                </p>
                <ul className="mt-4 space-y-2 text-sm text-text-secondary">
                  {points.map((p) => (
                    <li key={p} className="flex items-start gap-2">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#65a30d]" aria-hidden="true" />
                      <span>{p}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  href={t(`publicSite.home.useCases.${key}.href`, '/features')}
                  className="mt-5 inline-flex items-center gap-1 text-sm font-medium text-[#65a30d] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#3f6212]"
                >
                  {t('publicSite.home.useCases.cta', '')}
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              </article>
            )
          })}
        </div>
      </PublicContainer>
    </section>
  )
}
