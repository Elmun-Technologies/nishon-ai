'use client'

import type { LegalDocument } from '@/content/legal-documents'

export function LegalDocumentView({ doc }: { doc: LegalDocument }) {
  return (
    <article className="prose prose-neutral max-w-none dark:prose-invert prose-headings:scroll-mt-24 prose-h2:text-xl prose-h2:font-semibold prose-h2:tracking-tight prose-p:text-text-secondary prose-p:leading-relaxed">
      <h1 className="text-3xl font-semibold tracking-tight text-text-primary not-prose">{doc.title}</h1>
      <p className="not-prose mt-2 text-sm font-medium text-text-tertiary">{doc.lastUpdatedLabel}</p>
      <p className="not-prose mt-6 text-base leading-relaxed text-text-secondary">{doc.lead}</p>
      <div className="not-prose mt-10 space-y-10">
        {doc.sections.map((section) => (
          <section key={section.title} className="border-t border-border/80 pt-8 first:border-t-0 first:pt-0">
            <h2 className="text-lg font-semibold text-text-primary">{section.title}</h2>
            <div className="mt-4 space-y-4">
              {section.paragraphs.map((paragraph, i) => (
                <p key={i} className="text-sm leading-relaxed text-text-secondary sm:text-[15px]">
                  {paragraph}
                </p>
              ))}
            </div>
          </section>
        ))}
      </div>
    </article>
  )
}
