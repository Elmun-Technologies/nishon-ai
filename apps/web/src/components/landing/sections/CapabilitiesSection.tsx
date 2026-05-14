'use client'

import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'
import { PublicContainer } from '@/components/public/PublicLayout'
import { useI18n } from '@/i18n/use-i18n'
import { SectionHeader } from '../ui/SectionHeader'
import { CORE_MODULES } from '../constants'

export function CapabilitiesSection() {
  const { t } = useI18n()

  return (
    <section
      aria-labelledby="capabilities-heading"
      className="border-y border-[#e6efd9] bg-[#fafdf5] py-20 md:py-28"
    >
      <PublicContainer>
        <SectionHeader
          titleId="capabilities-heading"
          eyebrow={t('publicSite.home.capabilitiesEyebrow', '')}
          title={t('landing.capabilities.title', '')}
          description={t('landing.capabilities.subtitle', '')}
        />

        <div className="mt-12 grid gap-px overflow-hidden rounded-3xl bg-[#e6efd9] ring-1 ring-[#e6efd9] md:grid-cols-2 lg:grid-cols-3">
          {CORE_MODULES.map((item) => {
            const Icon = item.icon
            return (
              <Link
                key={item.key}
                href={item.href}
                className="group relative flex flex-col bg-white p-7 transition-colors hover:bg-[#fafdf5] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[#1b2e06]"
              >
                <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[#f4f9ea] text-[#3f6212] ring-1 ring-inset ring-[#dfeacb]">
                  <Icon className="h-4 w-4" aria-hidden="true" />
                </div>
                <h3 className="mt-5 text-lg font-medium tracking-tight text-text-primary">
                  {t(`publicSite.home.modules.${item.key}.title`, '')}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-text-secondary">
                  {t(`publicSite.home.modules.${item.key}.desc`, '')}
                </p>
                <span className="mt-6 inline-flex items-center gap-1 text-sm font-medium text-[#3f6212]">
                  {t('publicSite.home.openModule', '')}
                  <ArrowUpRight
                    className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 motion-reduce:transition-none motion-reduce:group-hover:translate-x-0 motion-reduce:group-hover:translate-y-0"
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
