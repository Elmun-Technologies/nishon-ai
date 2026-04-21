'use client'

import { getMetricById } from '@/lib/reports/metrics'
import { ReportWidget } from '@/components/reports/Widget'
import type { ReportFiltersState } from '@/components/reports/types'

export interface GridCanvasProps {
  widgetIds: string[]
  filters: ReportFiltersState
  onDropMetric: (metricId: string) => void
  onRemoveWidget: (metricId: string) => void
  atLimit: boolean
}

export function GridCanvas({
  widgetIds,
  filters,
  onDropMetric,
  onRemoveWidget,
  atLimit,
}: GridCanvasProps) {
  function handleDragOver(e: React.DragEvent) {
    e.preventDefault()
    e.dataTransfer.dropEffect = atLimit ? 'none' : 'copy'
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    if (atLimit) return
    const id =
      e.dataTransfer.getData('application/x-report-metric') ||
      e.dataTransfer.getData('metric')
    if (id) onDropMetric(id)
  }

  const filterHint = `${filters.range} · ${filters.platform}${filters.campaignId !== 'all' ? ' · kampaniya' : ''}${filters.compare ? ' · compare' : ''}`

  return (
    <div
      className="flex-1 min-h-[420px] rounded-xl border border-dashed border-border bg-surface/30 p-3 md:p-4"
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <p className="text-[10px] text-text-tertiary mb-3">{filterHint}</p>
      {widgetIds.length === 0 ? (
        <div className="h-64 flex flex-col items-center justify-center rounded-lg border border-border border-dashed text-text-tertiary text-sm text-center px-4">
          Chapdan metrikani ushlab, shu yerga tashlang. Canvas 12 ustunli grid.
        </div>
      ) : (
        <div
          className="grid grid-cols-12 gap-3 auto-rows-[minmax(96px,auto)]"
          style={{ gridAutoFlow: 'dense' as const }}
        >
          {widgetIds.map((id) => {
            const m = getMetricById(id)
            if (!m) return null
            return (
              <div
                key={id}
                style={{
                  gridColumn: `span ${Math.min(m.defaultSize.w, 12)} / span ${Math.min(m.defaultSize.w, 12)}`,
                  gridRow: `span ${m.defaultSize.h}`,
                }}
                className="min-h-0"
              >
                <ReportWidget metricId={id} filters={filters} onRemove={() => onRemoveWidget(id)} />
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
