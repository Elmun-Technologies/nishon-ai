'use client'

import { ArrowRight } from 'lucide-react'
import { PublicContainer } from '@/components/public/PublicLayout'
import { SectionHeader } from '@/components/landing/ui/SectionHeader'

export interface UseCase {
  persona: string
  role: string
  scenario: string
  outcome: string
}

export function UseCasesSection({
  title,
  description,
  cases,
}: {
  title: string
  description?: string
  cases: UseCase[]
}) {
  return (
    <section
      aria-labelledby="uc-heading"
      className="border-y border-[#e6efd9] bg-[#fafdf5] py-20 md:py-24"
    >
      <PublicContainer>
        <SectionHeader
          titleId="uc-heading"
          eyebrow="Применение"
          title={title}
          description={description}
        />

        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {cases.map((c) => (
            <article
              key={c.persona}
              className="flex flex-col rounded-2xl bg-white p-7 ring-1 ring-inset ring-[#e6efd9] shadow-[0_1px_2px_rgba(27,46,6,0.04)]"
            >
              <div className="flex items-center gap-3">
                <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#1b2e06] text-sm font-semibold text-[#d9f99d]">
                  {c.persona.charAt(0).toUpperCase()}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold tracking-tight text-text-primary">
                    {c.persona}
                  </p>
                  <p className="truncate text-xs text-text-tertiary">{c.role}</p>
                </div>
              </div>

              <div className="mt-5">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-text-tertiary">
                  Сценарий
                </p>
                <p className="mt-2 text-sm leading-relaxed text-text-secondary">{c.scenario}</p>
              </div>

              <div className="mt-5 flex items-start gap-2 rounded-xl bg-[#f0fdf4] p-4 ring-1 ring-inset ring-[#bbf7d0]">
                <ArrowRight className="mt-0.5 h-4 w-4 shrink-0 text-[#166534]" aria-hidden="true" />
                <p className="text-sm leading-relaxed text-[#166534]">
                  <span className="font-semibold">Результат:</span> {c.outcome}
                </p>
              </div>
            </article>
          ))}
        </div>
      </PublicContainer>
    </section>
  )
}
