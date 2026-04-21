'use client'

import type { MindmapNode, NodeStatus } from '@/lib/launch-flow/types'
import { cn } from '@/lib/utils'

function statusRing(s: NodeStatus): string {
  if (s === 'ok') return 'border-emerald-500/60 bg-emerald-500/10'
  if (s === 'warn') return 'border-amber-500/60 bg-amber-500/10'
  return 'border-red-500/60 bg-red-500/10'
}

function MindmapRow({
  node,
  depth,
  selectedId,
  onSelect,
}: {
  node: MindmapNode
  depth: number
  selectedId: string | null
  onSelect: (n: MindmapNode) => void
}) {
  const hasChildren = node.children && node.children.length > 0
  return (
    <div className={cn('select-none', depth > 0 && 'ml-4 border-l border-border pl-3')}>
      <button
        type="button"
        onClick={() => onSelect(node)}
        className={cn(
          'mb-1 flex w-full items-start gap-2 rounded-xl border px-3 py-2 text-left text-sm transition-colors',
          statusRing(node.status),
          selectedId === node.id && 'ring-2 ring-brand-mid/40 dark:ring-brand-lime/40',
        )}
      >
        <span
          className={cn(
            'mt-0.5 h-2.5 w-2.5 shrink-0 rounded-full',
            node.status === 'ok' && 'bg-emerald-500',
            node.status === 'warn' && 'bg-amber-500',
            node.status === 'error' && 'bg-red-500',
          )}
        />
        <span className="font-medium text-text-primary">{node.label}</span>
      </button>
      {hasChildren ? (
        <div className="space-y-1 pb-2">
          {node.children!.map((ch) => (
            <MindmapRow key={ch.id} node={ch} depth={depth + 1} selectedId={selectedId} onSelect={onSelect} />
          ))}
        </div>
      ) : null}
    </div>
  )
}

export function StrategyMindmap({
  root,
  selectedId,
  onSelect,
}: {
  root: MindmapNode
  selectedId: string | null
  onSelect: (n: MindmapNode) => void
}) {
  return (
    <div className="rounded-2xl border border-border bg-surface-1 p-4">
      <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-text-tertiary">Strategiya mindmap</p>
      <MindmapRow node={root} depth={0} selectedId={selectedId} onSelect={onSelect} />
    </div>
  )
}
