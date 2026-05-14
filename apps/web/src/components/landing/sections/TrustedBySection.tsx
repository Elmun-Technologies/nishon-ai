'use client'

import { PublicContainer } from '@/components/public/PublicLayout'
import { useI18n } from '@/i18n/use-i18n'
import { INTEGRATIONS } from '../constants'

export function TrustedBySection() {
  const { t } = useI18n()

  return (
    <section
      aria-label={t('publicSite.home.trustedBy.title', 'Integrations')}
      className="border-b border-[#e6efd9] bg-white"
    >
      <PublicContainer className="py-12">
        <p className="text-center text-[11px] font-semibold uppercase tracking-[0.18em] text-text-tertiary">
          {t('publicSite.home.trustedBy.title', '')}
        </p>
        <ul className="mt-6 flex flex-wrap items-center justify-center gap-x-10 gap-y-4">
          {INTEGRATIONS.map((name) => (
            <li
              key={name}
              className="text-sm font-medium tracking-tight text-text-tertiary/90 transition-colors hover:text-text-primary"
            >
              {name}
            </li>
          ))}
        </ul>
      </PublicContainer>
    </section>
  )
}
