'use client'

import Link from 'next/link'
import { useI18n } from '@/i18n/use-i18n'
import { cn } from '@/lib/utils'
import { MOCK_COPY } from '../constants'

interface AdCopyTabProps {
  selectedCopy: Record<string, boolean>
  onToggleCopy: (id: string) => void
}

export function AdCopyTab({ selectedCopy, onToggleCopy }: AdCopyTabProps) {
  const { t } = useI18n()
  const selectedCopyCount = Object.values(selectedCopy).filter(Boolean).length

  return (
    <section className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
      <p className="mb-4 text-xs text-text-secondary">
        {t('metaAudit.copySelectHint', 'Select rows, then send them to Ad Launcher.')}
      </p>

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 text-xs">
        <span className="text-text-secondary">
          {MOCK_COPY.length} {t('metaAudit.copyVariants', 'copy variants')}
        </span>
        <span className="text-text-tertiary">
          {selectedCopyCount} {t('metaAudit.selectedWord', 'selected')}
        </span>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Copy list */}
        <div className="space-y-2 lg:col-span-2">
          {MOCK_COPY.map((row) => {
            const on = Boolean(selectedCopy[row.id])
            return (
              <button
                key={row.id}
                type="button"
                onClick={() => onToggleCopy(row.id)}
                className={cn(
                  'w-full rounded-xl border p-4 text-left transition-colors',
                  on ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/25',
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-semibold text-text-primary">{row.headline}</p>
                    <p className="mt-1 text-xs text-text-secondary">{row.body}</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={on}
                    readOnly
                    className="mt-1 shrink-0 rounded border-border text-primary"
                  />
                </div>
                <div className="mt-2 flex items-center gap-3 text-[11px] text-text-tertiary">
                  <span>CTR {row.ctr}%</span>
                  <span>·</span>
                  <span>{row.leads} {t('metaAudit.kpiLeads', 'Leads').split(' ')[0]}</span>
                </div>
              </button>
            )
          })}
        </div>

        {/* Sidebar */}
        <div className="space-y-3">
          <div className="rounded-xl border border-border p-3">
            <p className="mb-3 text-xs font-semibold text-text-primary">
              {t('metaAudit.adCopyLength', 'Ad copy length')} ({selectedCopyCount})
            </p>
            <div className="grid grid-cols-3 gap-2">
              {(['Short', 'Medium', 'Long'] as const).map((len) => (
                <div
                  key={len}
                  className="flex flex-col items-center gap-1.5 rounded-lg border border-border bg-surface-2/50 p-3 dark:bg-surface-2/30"
                >
                  <p className="text-xs font-bold text-text-primary">{len}</p>
                  <p className="text-lg font-semibold text-text-tertiary">—</p>
                </div>
              ))}
            </div>
          </div>

          {selectedCopyCount > 0 ? (
            <Link
              href="/ad-launcher"
              className="block rounded-lg border border-primary bg-primary py-2.5 text-center text-xs font-semibold text-brand-ink hover:opacity-95"
            >
              {t('metaAudit.openAdLauncher', 'Open in Ad Launcher')}
            </Link>
          ) : (
            <span className="block cursor-not-allowed rounded-lg border border-dashed border-border py-2.5 text-center text-xs font-semibold text-text-tertiary opacity-60">
              {t('metaAudit.openAdLauncher', 'Open in Ad Launcher')}
            </span>
          )}
        </div>
      </div>
    </section>
  )
}
