'use client'

import { Check, X } from 'lucide-react'
import { PublicContainer } from '@/components/public/PublicLayout'
import { SectionHeader } from '@/components/landing/ui/SectionHeader'

export interface ComparisonRow {
  manual: string
  adspectr: string
}

export function ComparisonSection({
  title,
  description,
  manualLabel = 'Без AdSpectr',
  adspectrLabel = 'С AdSpectr',
  rows,
}: {
  title: string
  description?: string
  manualLabel?: string
  adspectrLabel?: string
  rows: ComparisonRow[]
}) {
  return (
    <section aria-labelledby="cmp-heading" className="bg-white py-20 md:py-24">
      <PublicContainer>
        <SectionHeader titleId="cmp-heading" eyebrow="Сравнение" title={title} description={description} align="center" />

        <div className="mx-auto mt-12 max-w-4xl overflow-hidden rounded-3xl ring-1 ring-inset ring-[#e6efd9] shadow-[0_1px_2px_rgba(27,46,6,0.04),0_24px_48px_-24px_rgba(27,46,6,0.18)]">
          <div className="grid grid-cols-2 border-b border-[#e6efd9]">
            <div className="bg-[#fafdf5] p-5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-text-tertiary">
                {manualLabel}
              </p>
            </div>
            <div className="bg-[#1b2e06] p-5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#a3e635]">
                {adspectrLabel}
              </p>
            </div>
          </div>

          {rows.map((row, i) => (
            <div
              key={`${row.manual}-${i}`}
              className={`grid grid-cols-2 ${i !== rows.length - 1 ? 'border-b border-[#eef3e3]' : ''}`}
            >
              <div className="flex items-start gap-3 bg-white p-5">
                <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#fef2f2] text-[#b91c1c]">
                  <X className="h-3 w-3" aria-hidden="true" />
                </span>
                <p className="text-sm leading-relaxed text-text-secondary">{row.manual}</p>
              </div>
              <div className="flex items-start gap-3 bg-[#fafdf5] p-5">
                <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#ecfccb] text-[#3f6212]">
                  <Check className="h-3 w-3" aria-hidden="true" />
                </span>
                <p className="text-sm leading-relaxed text-text-primary">{row.adspectr}</p>
              </div>
            </div>
          ))}
        </div>
      </PublicContainer>
    </section>
  )
}
