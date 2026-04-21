'use client'

import { Sparkles } from 'lucide-react'
import type { AudienceCreativeAffinity } from '@/lib/audience-story/types'
import { Card } from '@/components/ui/Card'

export function CreativeAffinityPanel({ items }: { items: AudienceCreativeAffinity[] }) {
  return (
    <section className="rounded-2xl border border-border/80 bg-surface shadow-sm p-5 md:p-6">
      <div className="flex items-center gap-2 mb-1">
        <Sparkles className="w-4 h-4 text-violet-500" aria-hidden />
        <h3 className="text-sm font-semibold text-text-primary">Creative Affinity</h3>
      </div>
      <p className="text-xs text-text-tertiary mb-4">Kampaniya datangizdan (mock ko‘rsatkichlar).</p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {items.map((row) => (
          <Card key={row.id} padding="md" className="border-border/90 bg-surface-2/30">
            <p className="text-[10px] uppercase tracking-wide text-text-tertiary">{row.title}</p>
            <p className="text-2xl font-bold text-text-primary mt-1 tabular-nums">
              {row.multiplier}x
            </p>
            <p className="text-xs text-text-secondary mt-2">
              <span className="text-emerald-600 dark:text-emerald-400 font-medium">{row.winner}</span>
              {' > '}
              <span className="text-text-tertiary">{row.loser}</span>
            </p>
            <p className="text-[11px] text-text-tertiary mt-2 leading-relaxed">{row.shortInsight}</p>
          </Card>
        ))}
      </div>
    </section>
  )
}
