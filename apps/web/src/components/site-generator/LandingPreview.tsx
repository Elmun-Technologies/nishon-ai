'use client'

import type { ReactNode } from 'react'
import type { LandingPageSpec, LandingSection } from '@/lib/site-generator/types'
import { cn } from '@/lib/utils'
import { Star } from 'lucide-react'

function SectionBlock({ children, className }: { children: ReactNode; className?: string }) {
  return <section className={cn('px-4 py-8', className)}>{children}</section>
}

function renderSection(s: LandingSection) {
  switch (s.type) {
    case 'hero':
      return (
        <SectionBlock key={s.id} className="bg-gradient-to-b from-brand-ink to-[#152508] text-white">
          <p className="text-center text-xs font-semibold uppercase tracking-widest text-brand-lime/90">Sotuv mashinasi</p>
          <h2 className="mt-3 text-center text-2xl font-bold leading-tight">{s.headline}</h2>
          {s.subheadline ? <p className="mt-2 text-center text-sm text-white/80">{s.subheadline}</p> : null}
          <div className="mt-6 flex justify-center">
            <a
              href={s.ctaHref || '#lead'}
              className="rounded-2xl bg-gradient-to-r from-brand-mid to-brand-lime px-6 py-3 text-sm font-bold text-brand-ink shadow-lg"
            >
              {s.ctaLabel ?? 'CTA'}
            </a>
          </div>
        </SectionBlock>
      )
    case 'problem_solution':
      return (
        <SectionBlock key={s.id} className="bg-surface-1">
          <h3 className="text-lg font-bold text-text-primary">{s.headline}</h3>
          {s.body ? <p className="mt-2 text-sm leading-relaxed text-text-secondary">{s.body}</p> : null}
          {s.items?.map((it) => (
            <div key={it.title} className="mt-4 rounded-xl border border-border bg-white p-4 dark:bg-slate-950">
              <p className="font-semibold text-text-primary">{it.title}</p>
              <p className="mt-1 text-sm text-text-secondary">{it.body}</p>
            </div>
          ))}
        </SectionBlock>
      )
    case 'gallery':
      return (
        <SectionBlock key={s.id}>
          <h3 className="text-lg font-bold text-text-primary">{s.headline}</h3>
          <div className="mt-4 grid grid-cols-2 gap-2">
            {(s.images ?? []).slice(0, 4).map((src, i) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={i}
                src={src}
                alt=""
                className={cn('h-28 w-full rounded-xl object-cover', i === 0 && 'col-span-2 h-40')}
              />
            ))}
          </div>
        </SectionBlock>
      )
    case 'utp':
      return (
        <SectionBlock key={s.id} className="bg-brand-mid/10 dark:bg-brand-lime/5">
          <h3 className="text-lg font-bold text-text-primary">{s.headline}</h3>
          <ul className="mt-3 space-y-2">
            {(s.bullets ?? []).map((b) => (
              <li key={b} className="flex gap-2 text-sm text-text-secondary">
                <span className="text-brand-mid dark:text-brand-lime">✓</span>
                {b}
              </li>
            ))}
          </ul>
        </SectionBlock>
      )
    case 'reviews':
      return (
        <SectionBlock key={s.id}>
          <h3 className="text-lg font-bold text-text-primary">{s.headline}</h3>
          <div className="mt-4 space-y-3">
            {(s.testimonials ?? []).map((t) => (
              <div key={t.name} className="rounded-xl border border-border bg-surface-1 p-4">
                <div className="flex gap-1 text-amber-500">
                  {Array.from({ length: t.rating }).map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-current" aria-hidden />
                  ))}
                </div>
                <p className="mt-2 text-sm text-text-secondary">&ldquo;{t.text}&rdquo;</p>
                <p className="mt-2 text-xs font-semibold text-text-primary">— {t.name}</p>
              </div>
            ))}
          </div>
        </SectionBlock>
      )
    case 'faq':
      return (
        <SectionBlock key={s.id} className="bg-surface-1">
          <h3 className="text-lg font-bold text-text-primary">{s.headline}</h3>
          <div className="mt-4 space-y-3">
            {(s.faq ?? []).map((f) => (
              <details key={f.q} className="rounded-xl border border-border bg-white p-3 dark:bg-slate-950">
                <summary className="cursor-pointer text-sm font-medium text-text-primary">{f.q}</summary>
                <p className="mt-2 text-sm text-text-secondary">{f.a}</p>
              </details>
            ))}
          </div>
        </SectionBlock>
      )
    case 'lead_form':
      return (
        <SectionBlock key={s.id} id="lead" className="border-t border-border">
          <h3 className="text-lg font-bold text-text-primary">{s.headline}</h3>
          {s.subheadline ? <p className="mt-1 text-sm text-text-secondary">{s.subheadline}</p> : null}
          <form
            className="mt-4 space-y-3"
            onSubmit={(e) => {
              e.preventDefault()
              alert("Demo: keyin Signal Bridge ga `purchase` / CRM click yuboriladi.")
            }}
          >
            <input
              className="w-full rounded-xl border border-border bg-white px-3 py-2.5 text-sm dark:bg-slate-950"
              placeholder="Ism"
              required
            />
            <input
              className="w-full rounded-xl border border-border bg-white px-3 py-2.5 text-sm dark:bg-slate-950"
              placeholder="+998 __ ___ __ __"
              required
            />
            <button
              type="submit"
              className="w-full rounded-xl bg-brand-ink py-3 text-sm font-semibold text-brand-lime"
            >
              {s.ctaLabel ?? 'Yuborish'}
            </button>
          </form>
        </SectionBlock>
      )
    case 'payment_embed':
      return (
        <SectionBlock key={s.id} id="pay" className="bg-surface-2/50">
          <h3 className="text-lg font-bold text-text-primary">{s.headline}</h3>
          <p className="mt-2 text-sm text-text-secondary">{s.body}</p>
          <div className="mt-4 flex flex-col gap-2 rounded-xl border border-dashed border-border bg-white/60 p-6 text-center text-sm text-text-tertiary dark:bg-slate-950/60">
            Click / Payme widget slot
          </div>
        </SectionBlock>
      )
    case 'tech_strip':
      return (
        <SectionBlock key={s.id}>
          <h3 className="text-sm font-bold uppercase tracking-wide text-text-tertiary">{s.headline}</h3>
          <ul className="mt-2 space-y-1 text-xs text-text-secondary">
            {(s.bullets ?? []).map((b) => (
              <li key={b}>· {b}</li>
            ))}
          </ul>
        </SectionBlock>
      )
    case 'footer':
      return (
        <SectionBlock key={s.id} className="border-t border-border pb-10 pt-6 text-center text-xs text-text-tertiary">
          <p className="font-semibold text-text-primary">{s.headline}</p>
          {s.body ? <p className="mt-2">{s.body}</p> : null}
          <p className="mt-4">Meta Pixel + CAPI · Schema.org</p>
        </SectionBlock>
      )
    default:
      return null
  }
}

export function LandingPreview({ spec, className }: { spec: LandingPageSpec; className?: string }) {
  return (
    <div className={cn('mx-auto w-full max-w-md overflow-hidden rounded-3xl border border-border bg-white shadow-xl dark:bg-slate-950', className)}>
      <div className="border-b border-border bg-surface-2/80 px-3 py-2 text-center text-[10px] font-medium text-text-tertiary">
        Mobil ko‘rinish · {spec.templateId} · {spec.locale}
      </div>
      <div className="max-h-[720px] overflow-y-auto overscroll-contain">
        {spec.sections.map((s) => renderSection(s))}
      </div>
    </div>
  )
}
