'use client'

import { PublicContainer } from '@/components/public/PublicLayout'
import { useI18n } from '@/i18n/use-i18n'
import { FAQ_INDICES } from '../constants'

export function FaqSection() {
  const { t } = useI18n()

  return (
    <section aria-labelledby="faq-heading" className="bg-surface py-16">
      <PublicContainer>
        <div className="mb-8 text-center">
          <h2 id="faq-heading" className="text-3xl font-semibold md:text-4xl">
            {t('publicSite.home.faq.title', '')}
          </h2>
          <p className="mt-2 text-text-secondary">{t('publicSite.home.faq.subtitle', '')}</p>
        </div>
        <div className="mx-auto grid max-w-5xl gap-4 md:grid-cols-2">
          {FAQ_INDICES.map((i) => (
            <details
              key={i}
              className="group rounded-2xl border border-border bg-white p-6 open:shadow-sm"
            >
              <summary className="cursor-pointer list-none text-lg font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#3f6212]">
                {t(`publicSite.home.faq.q${i}`, '')}
              </summary>
              <p className="mt-2 text-sm text-text-secondary">{t(`publicSite.home.faq.a${i}`, '')}</p>
            </details>
          ))}
        </div>
      </PublicContainer>
    </section>
  )
}
