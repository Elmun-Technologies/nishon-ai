'use client'

import { PublicContainer } from '@/components/public/PublicLayout'
import { useI18n } from '@/i18n/use-i18n'
import { INTEGRATIONS } from '../constants'

export function TrustedBySection() {
  const { t } = useI18n()

  return (
    <section aria-label={t('publicSite.home.trustedBy.title', 'Integrations')} className="border-b border-border bg-white">
      <PublicContainer className="py-8">
        <p className="text-center text-xs font-medium uppercase tracking-wide text-text-tertiary">
          {t('publicSite.home.trustedBy.title', '')}
        </p>
        <ul className="mt-5 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm font-medium text-text-secondary">
          {INTEGRATIONS.map((name) => (
            <li key={name} className="rounded-md border border-border bg-surface px-3 py-1.5">
              {name}
            </li>
          ))}
        </ul>
      </PublicContainer>
    </section>
  )
}
