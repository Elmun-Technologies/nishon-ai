'use client'

import { PublicContainer } from '@/components/public/PublicLayout'
import { useI18n } from '@/i18n/use-i18n'
import { SectionHeader } from '../ui/SectionHeader'
import { FLOW_KEYS } from '../constants'

export function HowItWorksSection() {
  const { t } = useI18n()

  return (
    <section aria-labelledby="flow-heading" className="bg-white py-20 md:py-28">
      <PublicContainer>
        <SectionHeader
          titleId="flow-heading"
          eyebrow={t('publicSite.home.flow.eyebrow', '')}
          title={t('publicSite.home.flow.title', '')}
          description={t('publicSite.home.flow.subtitle', '')}
        />

        <ol className="relative mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute left-0 right-0 top-5 hidden h-px bg-gradient-to-r from-transparent via-[#cfe8c0] to-transparent lg:block"
          />
          {FLOW_KEYS.map((flowKey, i) => (
            <li key={flowKey} className="relative flex flex-col">
              <div className="flex items-center gap-3">
                <span className="relative z-10 inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#1b2e06] text-sm font-semibold text-[#d9f99d] ring-4 ring-white">
                  {i + 1}
                </span>
                <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#65a30d]">
                  {t(`publicSite.home.flow.${flowKey}.step`, '')}
                </span>
              </div>
              <h3 className="mt-5 text-lg font-medium tracking-tight text-text-primary">
                {t(`publicSite.home.flow.${flowKey}.title`, '')}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-text-secondary">
                {t(`publicSite.home.flow.${flowKey}.text`, '')}
              </p>
            </li>
          ))}
        </ol>
      </PublicContainer>
    </section>
  )
}
