'use client'

import { PublicContainer } from '@/components/public/PublicLayout'
import { useI18n } from '@/i18n/use-i18n'
import { FLOW_KEYS } from '../constants'

export function HowItWorksSection() {
  const { t } = useI18n()

  return (
    <section aria-labelledby="flow-heading" className="bg-surface py-16">
      <PublicContainer>
        <div className="mb-8 max-w-3xl">
          <p className="text-sm font-medium text-[#65a30d]">{t('publicSite.home.flow.eyebrow', '')}</p>
          <h2 id="flow-heading" className="mt-1 text-3xl font-semibold md:text-4xl">
            {t('publicSite.home.flow.title', '')}
          </h2>
          <p className="mt-2 text-text-secondary">{t('publicSite.home.flow.subtitle', '')}</p>
        </div>
        <ol className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {FLOW_KEYS.map((flowKey) => (
            <li key={flowKey} className="rounded-2xl border border-border bg-white p-5">
              <p className="text-xs font-semibold tracking-wide text-[#65a30d]">
                {t(`publicSite.home.flow.${flowKey}.step`, '')}
              </p>
              <h3 className="mt-2 text-lg font-semibold">{t(`publicSite.home.flow.${flowKey}.title`, '')}</h3>
              <p className="mt-2 text-sm text-text-secondary">{t(`publicSite.home.flow.${flowKey}.text`, '')}</p>
            </li>
          ))}
        </ol>
      </PublicContainer>
    </section>
  )
}
