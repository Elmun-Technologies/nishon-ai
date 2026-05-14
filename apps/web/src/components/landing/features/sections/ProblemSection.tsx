'use client'

import { AlertCircle } from 'lucide-react'
import { PublicContainer } from '@/components/public/PublicLayout'

export interface ProblemHook {
  headline: string
  pain: string[]
  cost: string
}

export function ProblemSection({ hook }: { hook: ProblemHook }) {
  return (
    <section aria-labelledby="problem-heading" className="bg-white py-20 md:py-24">
      <PublicContainer>
        <div className="mx-auto max-w-4xl">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#b91c1c]">
            Знакомо?
          </p>
          <h2
            id="problem-heading"
            className="mt-3 text-balance text-3xl font-medium tracking-tight text-text-primary md:text-[40px] md:leading-[1.08]"
          >
            {hook.headline}
          </h2>
          <ul className="mt-8 grid gap-3 md:grid-cols-2">
            {hook.pain.map((line) => (
              <li
                key={line}
                className="flex items-start gap-3 rounded-2xl bg-[#fef2f2] p-5 ring-1 ring-inset ring-[#fecaca]"
              >
                <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#fecaca] text-[#b91c1c]">
                  <AlertCircle className="h-3.5 w-3.5" aria-hidden="true" />
                </span>
                <p className="text-sm leading-relaxed text-[#7f1d1d]">{line}</p>
              </li>
            ))}
          </ul>
          <p className="mt-8 rounded-2xl bg-[#1b2e06] p-5 text-pretty text-base text-white md:text-lg">
            <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#a3e635]/85">
              Стоимость бездействия
            </span>
            <br />
            <span className="mt-2 block">{hook.cost}</span>
          </p>
        </div>
      </PublicContainer>
    </section>
  )
}
