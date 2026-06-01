'use client'

import { CheckCircle2 } from 'lucide-react'
import { PublicContainer } from '@/components/public/PublicLayout'
import { SectionHeader } from '@/components/landing/ui/SectionHeader'

export interface ValueProp {
  title: string
  body: string
  highlight?: string
}

export function ValuePropsSection({
  title,
  eyebrow,
  description,
  items,
}: {
  title: string
  eyebrow?: string
  description?: string
  items: ValueProp[]
}) {
  return (
    <section
      aria-labelledby="vp-heading"
      className="border-y border-[#e6efd9] bg-[#fafdf5] py-20 md:py-24"
    >
      <PublicContainer>
        <SectionHeader titleId="vp-heading" eyebrow={eyebrow} title={title} description={description} />

        <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {items.map((item, i) => (
            <article
              key={item.title}
              className="relative flex flex-col rounded-2xl bg-white p-7 ring-1 ring-inset ring-[#e6efd9] shadow-[0_1px_2px_rgba(27,46,6,0.04),0_8px_24px_-16px_rgba(27,46,6,0.12)]"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#65a30d]">
                0{i + 1}
              </p>
              <h3 className="mt-3 text-xl font-medium tracking-tight text-text-primary">
                {item.title}
              </h3>
              <p className="mt-3 flex-1 text-sm leading-relaxed text-text-secondary">{item.body}</p>
              {item.highlight ? (
                <div className="mt-5 flex items-start gap-2 rounded-xl bg-[#f0fdf4] p-3 text-sm text-[#166534] ring-1 ring-inset ring-[#bbf7d0]">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                  <span>{item.highlight}</span>
                </div>
              ) : null}
            </article>
          ))}
        </div>
      </PublicContainer>
    </section>
  )
}
