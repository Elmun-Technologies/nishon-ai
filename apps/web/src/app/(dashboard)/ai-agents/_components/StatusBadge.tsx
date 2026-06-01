import { cn } from '@/lib/utils'
import { STATUS_LABELS, type AgentStatus } from '../_lib/mock-data'

export function StatusBadge({ status }: { status: AgentStatus }) {
  const def = STATUS_LABELS[status]
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide',
        def.bg,
      )}
      style={{ color: def.color }}
    >
      {status === 'active' && (
        <span className="relative flex h-1.5 w-1.5">
          <span
            className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-75"
            style={{ background: def.color }}
          />
          <span
            className="relative inline-flex h-1.5 w-1.5 rounded-full"
            style={{ background: def.color }}
          />
        </span>
      )}
      {def.title}
    </span>
  )
}
