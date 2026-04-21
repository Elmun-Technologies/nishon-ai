'use client'

import { Alert } from '@/components/ui/Alert'
import type { AudienceInterest } from '@/lib/audience-story/types'

export function InterestMap({ interests, tip }: { interests: AudienceInterest[]; tip: string }) {
  return (
    <section className="rounded-2xl border border-border/80 bg-surface shadow-sm p-5 md:p-6">
      <h3 className="text-sm font-semibold text-text-primary mb-1">Interest Map</h3>
      <p className="text-xs text-text-tertiary mb-4">Dilnoza yana nimalarni yoqtiradi (mock %).</p>
      <ul className="space-y-3">
        {interests.map((row) => (
          <li key={row.name}>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-text-primary font-medium">{row.name}</span>
              <span className="tabular-nums text-text-tertiary">{row.pct}%</span>
            </div>
            <div className="h-2 rounded-full bg-surface-2 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-violet-500 to-blue-500"
                style={{ width: `${row.pct}%` }}
              />
            </div>
          </li>
        ))}
      </ul>
      <Alert variant="info" className="mt-4 text-xs">
        <span className="font-semibold">AI tavsiya: </span>
        {tip}
      </Alert>
    </section>
  )
}
