import { ClipboardList, Info, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface SummaryRow {
  label: string
  value: string
  hint?: string
  emphasis?: boolean
  muted?: boolean
}

export function SummaryPanel({
  title,
  platformLabel,
  rows,
  estimateLabel,
  estimateValue,
  footnote,
}: {
  title: string
  platformLabel?: string
  rows: SummaryRow[]
  estimateLabel?: string
  estimateValue?: string
  footnote?: string
}) {
  return (
    <aside className="sticky top-4 space-y-3 rounded-2xl border border-border bg-surface p-4 shadow-sm dark:bg-surface-elevated/40">
      <header className="flex items-center justify-between gap-2 border-b border-border pb-3">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-mid/10 text-brand-mid dark:bg-brand-lime/10 dark:text-brand-lime">
            <ClipboardList className="h-4 w-4" aria-hidden />
          </span>
          <h2 className="text-sm font-semibold text-text-primary">{title}</h2>
        </div>
        {platformLabel && (
          <span className="rounded-full border border-border bg-surface-2/60 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-text-tertiary">
            {platformLabel}
          </span>
        )}
      </header>

      <dl className="space-y-2">
        {rows.map((r) => (
          <div key={r.label} className="flex items-start justify-between gap-3">
            <dt className="text-xs font-medium text-text-tertiary">{r.label}</dt>
            <dd
              className={cn(
                'min-w-0 max-w-[60%] break-words text-right text-xs',
                r.muted ? 'text-text-tertiary' : 'text-text-primary',
                r.emphasis && 'text-sm font-semibold',
              )}
              title={r.hint}
            >
              {r.value}
            </dd>
          </div>
        ))}
      </dl>

      {(estimateLabel || footnote) && (
        <div className="space-y-2 border-t border-border pt-3">
          {estimateLabel && estimateValue && (
            <div className="flex items-start gap-2 rounded-lg border border-brand-mid/20 bg-brand-mid/[0.04] p-2.5 dark:border-brand-lime/20 dark:bg-brand-lime/[0.04]">
              <Sparkles
                className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand-mid dark:text-brand-lime"
                aria-hidden
              />
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-bold uppercase tracking-wide text-brand-mid dark:text-brand-lime">
                  {estimateLabel}
                </p>
                <p className="mt-0.5 text-xs font-semibold text-text-primary">{estimateValue}</p>
              </div>
            </div>
          )}
          {footnote && (
            <div className="flex items-start gap-1.5 text-[11px] leading-relaxed text-text-tertiary">
              <Info className="mt-0.5 h-3 w-3 shrink-0" aria-hidden />
              <p>{footnote}</p>
            </div>
          )}
        </div>
      )}
    </aside>
  )
}
