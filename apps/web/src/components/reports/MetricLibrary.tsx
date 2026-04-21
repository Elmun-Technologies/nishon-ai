'use client'

import { GripVertical } from 'lucide-react'
import { CATEGORY_LABELS, metricLibrary, type MetricCategory } from '@/lib/reports/metrics'

const ORDER: MetricCategory[] = ['sales', 'traffic', 'cost', 'creative', 'ai']

export interface MetricLibraryProps {
  onAdd: (metricId: string) => void
  disabled?: boolean
  atLimit?: boolean
}

export function MetricLibrary({ onAdd, disabled, atLimit }: MetricLibraryProps) {
  function startDrag(e: React.DragEvent, id: string) {
    if (disabled || atLimit) {
      e.preventDefault()
      return
    }
    e.dataTransfer.setData('application/x-report-metric', id)
    e.dataTransfer.effectAllowed = 'copy'
  }

  return (
    <div className="w-full md:w-56 shrink-0 border border-border rounded-xl bg-surface-2/50 overflow-hidden flex flex-col max-h-[70vh]">
      <div className="px-3 py-2 border-b border-border">
        <p className="text-xs font-semibold text-text-primary">Metric Library</p>
        <p className="text-[10px] text-text-tertiary mt-0.5">Surib canvas ga tashlang yoki bosing</p>
      </div>
      <div className="p-2 overflow-y-auto flex-1 space-y-3">
        {ORDER.map((cat) => (
          <div key={cat}>
            <p className="text-[10px] uppercase tracking-wide text-text-tertiary mb-1.5 px-1">
              {CATEGORY_LABELS[cat]}
            </p>
            <div className="space-y-1">
              {metricLibrary
                .filter((m) => m.category === cat)
                .map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    draggable={!disabled && !atLimit}
                    onDragStart={(e) => startDrag(e, m.id)}
                    onClick={() => !disabled && !atLimit && onAdd(m.id)}
                    disabled={disabled || atLimit}
                    className="w-full flex items-center gap-1.5 text-left px-2 py-1.5 rounded-lg border border-border bg-surface hover:bg-surface-2 transition-colors disabled:opacity-40 disabled:pointer-events-none"
                  >
                    <GripVertical className="w-3.5 h-3.5 shrink-0 text-text-tertiary" aria-hidden />
                    <span className="text-xs text-text-primary">{m.label}</span>
                  </button>
                ))}
            </div>
          </div>
        ))}
      </div>
      {atLimit && (
        <p className="text-[10px] text-amber-500/90 px-3 py-2 border-t border-border">
          Maksimum 12 ta widget. Birini olib tashlang.
        </p>
      )}
    </div>
  )
}
