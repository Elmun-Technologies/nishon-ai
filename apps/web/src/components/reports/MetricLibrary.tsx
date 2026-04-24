'use client'

import { useState } from 'react'
import { ChevronDown, ChevronRight, GripVertical, Info, Search } from 'lucide-react'
import { CATEGORY_LABELS, metricLibrary, type MetricCategory } from '@/lib/reports/metrics'

const ORDER: MetricCategory[] = ['sales', 'traffic', 'cost', 'creative', 'ai']

const CAT_ICON: Record<MetricCategory, string> = {
  sales:    '💰',
  traffic:  '📈',
  cost:     '💳',
  creative: '🎨',
  ai:       '🤖',
}

export interface MetricLibraryProps {
  onAdd: (metricId: string) => void
  disabled?: boolean
  atLimit?: boolean
}

export function MetricLibrary({ onAdd, disabled, atLimit }: MetricLibraryProps) {
  const [search, setSearch] = useState('')
  const [collapsed, setCollapsed] = useState<Set<MetricCategory>>(new Set())
  const [dragging, setDragging] = useState<string | null>(null)

  function toggleCat(cat: MetricCategory) {
    setCollapsed((prev) => {
      const next = new Set(prev)
      if (next.has(cat)) next.delete(cat)
      else next.add(cat)
      return next
    })
  }

  function startDrag(e: React.DragEvent, id: string) {
    if (disabled || atLimit) { e.preventDefault(); return }
    e.dataTransfer.setData('application/x-report-metric', id)
    e.dataTransfer.effectAllowed = 'copy'
    setDragging(id)
  }

  const q = search.trim().toLowerCase()
  const filtered = q ? metricLibrary.filter((m) => m.label.toLowerCase().includes(q)) : null

  return (
    <div className="w-full md:w-60 shrink-0 rounded-xl bg-white shadow-sm border border-border overflow-hidden flex flex-col max-h-[calc(100vh-200px)]">
      {/* Header */}
      <div className="px-3 pt-3 pb-2.5 border-b border-border">
        <p className="text-xs font-semibold text-text-primary">Metric Library</p>
        <p className="text-[10px] text-text-tertiary mt-0.5">Surib canvas ga tashlang</p>
        <div className="mt-2 relative">
          <Search className="w-3 h-3 absolute left-2.5 top-1/2 -translate-y-1/2 text-text-tertiary pointer-events-none" />
          <input
            type="text"
            placeholder="Qidirish..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full text-[11px] pl-7 pr-2 py-1.5 rounded-lg border border-border bg-surface-2 text-text-primary placeholder-text-tertiary focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-200 transition-colors"
          />
        </div>
      </div>

      {/* List */}
      <div className="p-2 overflow-y-auto flex-1 space-y-0.5">
        {filtered ? (
          <>
            {filtered.map((m) => (
              <MetricPill
                key={m.id}
                id={m.id}
                label={m.label}
                formula={m.formula}
                isDragging={dragging === m.id}
                disabled={disabled || atLimit}
                onDragStart={(e) => startDrag(e, m.id)}
                onDragEnd={() => setDragging(null)}
                onClick={() => !disabled && !atLimit && onAdd(m.id)}
              />
            ))}
            {filtered.length === 0 && (
              <p className="text-[11px] text-text-tertiary text-center py-6">Topilmadi</p>
            )}
          </>
        ) : (
          ORDER.map((cat) => {
            const items = metricLibrary.filter((m) => m.category === cat)
            const open = !collapsed.has(cat)
            return (
              <div key={cat} className="mb-1">
                <button
                  type="button"
                  onClick={() => toggleCat(cat)}
                  className="w-full flex items-center gap-1.5 px-1.5 py-1 rounded-lg hover:bg-surface-2 transition-colors group/cat"
                >
                  {open
                    ? <ChevronDown className="w-3 h-3 text-text-tertiary shrink-0" />
                    : <ChevronRight className="w-3 h-3 text-text-tertiary shrink-0" />
                  }
                  <span className="text-[10px] uppercase tracking-wider font-semibold text-text-tertiary flex-1 text-left">
                    {CAT_ICON[cat]} {CATEGORY_LABELS[cat]}
                  </span>
                  <span className="text-[9px] text-text-tertiary opacity-0 group-hover/cat:opacity-100 transition-opacity">{items.length}</span>
                </button>
                {open && (
                  <div className="space-y-0.5 mt-0.5 ml-0.5">
                    {items.map((m) => (
                      <MetricPill
                        key={m.id}
                        id={m.id}
                        label={m.label}
                        formula={m.formula}
                        isDragging={dragging === m.id}
                        disabled={disabled || atLimit}
                        onDragStart={(e) => startDrag(e, m.id)}
                        onDragEnd={() => setDragging(null)}
                        onClick={() => !disabled && !atLimit && onAdd(m.id)}
                      />
                    ))}
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>

      {atLimit && (
        <p className="text-[10px] text-amber-600 px-3 py-2 border-t border-amber-100 bg-amber-50/80">
          Maks 12 ta widget. Birini olib tashlang.
        </p>
      )}
    </div>
  )
}

interface MetricPillProps {
  id: string
  label: string
  formula?: string
  isDragging: boolean
  disabled?: boolean
  onDragStart: (e: React.DragEvent) => void
  onDragEnd: () => void
  onClick: () => void
}

function MetricPill({ label, formula, isDragging, disabled, onDragStart, onDragEnd, onClick }: MetricPillProps) {
  const [hovered, setHovered] = useState(false)

  return (
    <button
      type="button"
      draggable={!disabled}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      disabled={disabled}
      className={`
        w-full flex items-center gap-2 text-left px-2 py-1.5 rounded-lg border transition-all duration-150
        disabled:opacity-40 disabled:pointer-events-none group/pill
        ${isDragging
          ? 'border-emerald-400 bg-emerald-50 shadow-lg scale-[0.97] opacity-60'
          : hovered
            ? 'border-emerald-300 bg-white shadow-sm'
            : 'border-border bg-white hover:border-emerald-300 hover:shadow-sm'
        }
      `}
    >
      <GripVertical className="w-3 h-3 shrink-0 text-border group-hover/pill:text-emerald-400 transition-colors" />
      <span className="text-[11px] text-text-primary font-medium flex-1 truncate">{label}</span>
      {hovered && formula ? (
        <span className="text-[9px] text-text-tertiary font-mono max-w-[56px] truncate shrink-0" title={formula}>
          {formula}
        </span>
      ) : (
        <Info className="w-3 h-3 text-border shrink-0 opacity-0 group-hover/pill:opacity-100 transition-opacity" />
      )}
    </button>
  )
}
