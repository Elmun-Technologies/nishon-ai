'use client'

import { Badge } from '@/components/ui/Badge'
import type { AudienceCompareBlock } from '@/lib/audience-story/types'

export function AudienceComparePanel({ data }: { data: AudienceCompareBlock }) {
  return (
    <section className="rounded-2xl border border-border/80 bg-surface shadow-sm p-5 md:p-6">
      <h3 className="text-sm font-semibold text-text-primary mb-1">Compare</h3>
      <p className="text-xs text-text-tertiary mb-4">Sening auditoriyang vs top raqib (mock).</p>
      <dl className="space-y-3 text-sm">
        <div className="flex flex-col gap-1">
          <dt className="text-[10px] uppercase text-text-tertiary">Yosh</dt>
          <dd className="flex flex-wrap gap-2">
            <span className="text-text-primary">
              Siz: <strong>{data.you.ageRange}</strong>
            </span>
            <span className="text-text-tertiary">·</span>
            <span className="text-text-secondary">
              Raqib: <strong>{data.competitor.ageRange}</strong>
            </span>
          </dd>
        </div>
        <div className="flex flex-col gap-1">
          <dt className="text-[10px] uppercase text-text-tertiary">Faol vaqt</dt>
          <dd className="flex flex-col gap-0.5">
            <span className="text-text-primary">Siz: {data.you.peakHours}</span>
            <span className="text-text-secondary">Raqib: {data.competitor.peakHours}</span>
          </dd>
        </div>
        <div className="flex flex-col gap-1">
          <dt className="text-[10px] uppercase text-text-tertiary">Kanal</dt>
          <dd className="text-text-secondary text-xs">
            Siz: {data.you.channel}
            <br />
            Raqib: {data.competitor.channel}
          </dd>
        </div>
      </dl>
      <p className="text-xs text-text-secondary mt-4 leading-relaxed border-t border-border pt-4">{data.summary}</p>
      {data.lowTimeOverlap && (
        <div className="mt-3">
          <Badge variant="success" size="sm">
            To‘qnashmaysiz — vaqt oralig‘i farq qiladi
          </Badge>
        </div>
      )}
    </section>
  )
}
