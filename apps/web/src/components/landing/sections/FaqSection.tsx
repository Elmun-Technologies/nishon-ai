'use client'

import { Plus } from 'lucide-react'
import { PublicContainer } from '@/components/public/PublicLayout'
import { useI18n } from '@/i18n/use-i18n'
import { SectionHeader } from '../ui/SectionHeader'
import { FAQ_INDICES } from '../constants'

export function FaqSection() {
  const { t } = useI18n()

  return (
    <section aria-labelledby="faq-heading" className="bg-white py-20 md:py-28">
      <PublicContainer>
        <SectionHeader
          titleId="faq-heading"
          title={t('publicSite.home.faq.title', '')}
          description={t('publicSite.home.faq.subtitle', '')}
          align="center"
        />

        <div className="mx-auto mt-12 max-w-3xl divide-y divide-[#e6efd9] rounded-2xl bg-white ring-1 ring-inset ring-[#e6efd9]">
          {FAQ_INDICES.map((i) => (
            <details key={i} className="group">
              <summary className="flex cursor-pointer list-none items-start justify-between gap-4 px-6 py-5 text-left text-base font-medium text-text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[#1b2e06]">
                <span className="flex-1 tracking-tight">{t(`publicSite.home.faq.q${i}`, '')}</span>
                <span
                  aria-hidden="true"
                  className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#f4f9ea] text-[#3f6212] transition-transform group-open:rotate-45 motion-reduce:transition-none"
                >
                  <Plus className="h-3.5 w-3.5" />
                </span>
              </summary>
              <p className="px-6 pb-5 text-sm leading-relaxed text-text-secondary">
                {t(`publicSite.home.faq.a${i}`, '')}
              </p>
            </details>
          ))}
        </div>
      </PublicContainer>
    </section>
  )
}
