'use client'

import { useI18n } from '@/i18n/use-i18n'
import { cn } from '@/lib/utils'
import { MOCK_AUCTION } from '../constants'

function signalColor(value: number) {
  if (value >= 70) return { bar: 'bg-emerald-500', text: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20' }
  if (value >= 50) return { bar: 'bg-amber-500',   text: 'text-amber-600 dark:text-amber-400',     bg: 'bg-amber-50   dark:bg-amber-500/10   border-amber-200   dark:border-amber-500/20'   }
  return             { bar: 'bg-red-500',           text: 'text-red-600 dark:text-red-400',         bg: 'bg-red-50     dark:bg-red-500/10     border-red-200     dark:border-red-500/20'     }
}

export function AuctionTab() {
  const { t } = useI18n()

  return (
    <div className="space-y-3 rounded-2xl border border-border bg-surface p-5 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-text-tertiary">
        {t('metaAudit.auctionSignal', 'Signal')}
      </p>

      <div className="grid gap-4 sm:grid-cols-3">
        {MOCK_AUCTION.map((row) => {
          const colors = signalColor(row.value)
          return (
            <div
              key={row.key}
              className={cn('rounded-xl border p-4', colors.bg)}
            >
              <div className="mb-3 flex items-center justify-between gap-2">
                <p className="text-sm font-medium text-text-primary">{t(row.labelKey, row.fb)}</p>
                <span className={cn('text-xl font-bold tabular-nums', colors.text)}>
                  {row.value}
                  <span className="text-xs font-normal text-text-tertiary">%</span>
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-surface-2 dark:bg-black/20">
                <div
                  className={cn('h-full rounded-full transition-all duration-500', colors.bar)}
                  style={{ width: `${row.value}%` }}
                />
              </div>
            </div>
          )
        })}
      </div>

      <p className="text-xs text-text-tertiary">
        {t('metaAudit.auctionValue', 'Value (sample)')} · {t('metaAudit.auctionSampleNote', 'Illustrative — real auction diagnostics need placement breakdowns from Meta.')}
      </p>
    </div>
  )
}
