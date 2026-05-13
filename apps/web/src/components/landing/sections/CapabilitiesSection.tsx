'use client'

import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { PublicContainer } from '@/components/public/PublicLayout'
import { useI18n } from '@/i18n/use-i18n'
import { CORE_MODULES } from '../constants'

export function CapabilitiesSection() {
  const { t } = useI18n()

  return (
    <section aria-labelledby="capabilities-heading" className="border-y border-border bg-[#f8fbf2] py-16">
      <PublicContainer>
        <div className="mb-9 max-w-3xl">
          <p className="text-sm font-medium text-[#65a30d]">{t('publicSite.home.capabilitiesEyebrow', '')}</p>
          <h2 id="capabilities-heading" className="mt-1 text-3xl font-semibold md:text-4xl">
            {t('landing.capabilities.title', '')}
          </h2>
          <p className="mt-2 text-text-secondary">{t('landing.capabilities.subtitle', '')}</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {CORE_MODULES.map((item) => {
            const Icon = item.icon
            return (
              <Link
                key={item.key}
                href={item.href}
                className="group rounded-2xl border border-border bg-white p-6 transition hover:border-[#84cc16]/60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#3f6212]"
              >
                <div className="mb-3 inline-flex rounded-xl border border-border bg-[#f4f9ea] p-2 text-[#65a30d]">
                  <Icon className="h-4 w-4" aria-hidden="true" />
                </div>
                <h3 className="text-heading font-semibold">{t(`publicSite.home.modules.${item.key}.title`, '')}</h3>
                <p className="mt-2 text-body-sm text-text-secondary">
                  {t(`publicSite.home.modules.${item.key}.desc`, '')}
                </p>
                <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-[#65a30d]">
                  {t('publicSite.home.openModule', '')}
                  <ArrowRight
                    className="h-4 w-4 transition group-hover:translate-x-0.5 motion-reduce:transition-none motion-reduce:group-hover:translate-x-0"
                    aria-hidden="true"
                  />
                </span>
              </Link>
            )
          })}
        </div>
      </PublicContainer>
    </section>
  )
}
