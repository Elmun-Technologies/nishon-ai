'use client'

import { useState } from 'react'
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

const RANGE_LABEL: Record<string, string> = {
  today: 'Bugun', yesterday: 'Kecha', '7d': '7 kun', '30d': '30 kun',
}

export function GridCanvas({ widgetIds, filters, onDropMetric, onRemoveWidget, atLimit }: GridCanvasProps) {
  const [dragOver, setDragOver] = useState(false)

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault()
    e.dataTransfer.dropEffect = atLimit ? 'none' : 'copy'
    if (!atLimit) setDragOver(true)
  }

  function handleDragLeave(e: React.DragEvent) {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) setDragOver(false)
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragOver(false)
    if (atLimit) return
    const id = e.dataTransfer.getData('application/x-report-metric') || e.dataTransfer.getData('metric')
    if (id) onDropMetric(id)
  }

  const hintParts = [
    RANGE_LABEL[filters.range] ?? filters.range,
    filters.platform === 'all' ? 'Hammasi' : filters.platform,
    filters.campaignId !== 'all' ? 'kampaniya' : null,
    filters.compare ? '📊 taqqoslash' : null,
  ].filter(Boolean) as string[]

  return (
    <div
      className={`flex-1 min-h-[500px] rounded-xl border-2 transition-all duration-200 relative overflow-hidden flex flex-col
        ${dragOver && !atLimit
          ? 'border-emerald-400'
          : 'border-dashed border-border bg-white'
        }
      `}
      style={
        dragOver
          ? { background: 'rgba(16,185,129,0.04)', borderColor: '#10b981' }
          : {
              backgroundImage: 'radial-gradient(circle, #cfe8c0 1px, transparent 1px)',
              backgroundSize: '22px 22px',
              backgroundColor: '#fff',
            }
      }
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-white/95 backdrop-blur-sm shrink-0">
        <div className="flex items-center gap-1.5">
          {hintParts.map((part, i) => (
            <span key={i} className="flex items-center gap-1">
              {i > 0 && <span className="text-border select-none">·</span>}
              <span className="text-[11px] text-text-tertiary font-medium">{part}</span>
            </span>
          ))}
        </div>
        {dragOver && !atLimit && (
          <span className="text-[11px] text-emerald-600 font-semibold animate-pulse">
            ✓ Shu yerga tashlang
          </span>
        )}
      </div>

      <div className="p-4 flex-1">
        {widgetIds.length === 0 ? (
          <div className="h-full min-h-[300px] flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-border text-center px-6 gap-3">
            <div className="w-14 h-14 rounded-full bg-surface-2 flex items-center justify-center text-3xl select-none">
              📊
            </div>
            <div>
              <p className="text-sm font-semibold text-text-secondary">Drag metrics here</p>
              <p className="text-[11px] text-text-tertiary mt-1">
                Chapdan metric library dan surib olib keling
              </p>
            </div>
          </div>
        ) : (
          <div
            className="grid grid-cols-12 gap-3 auto-rows-[minmax(104px,auto)]"
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
    </div>
  )
}
