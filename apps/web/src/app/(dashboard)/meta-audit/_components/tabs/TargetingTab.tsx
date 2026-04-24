'use client'

import { useI18n } from '@/i18n/use-i18n'
import { cn } from '@/lib/utils'
import { MOCK_TARGETING } from '../constants'

function healthColor(score: number): string {
  if (score >= 80) return 'text-emerald-600 dark:text-emerald-400'
  if (score >= 65) return 'text-amber-600 dark:text-amber-400'
  return 'text-red-600 dark:text-red-400'
}

function healthBarColor(score: number): string {
  if (score >= 80) return 'bg-emerald-500'
  if (score >= 65) return 'bg-amber-500'
  return 'bg-red-500'
}

function healthLabel(score: number, t: (k: string, d: string) => string): string {
  if (score >= 80) return t('metaAudit.healthGood', 'Good')
  if (score >= 65) return t('metaAudit.healthFair', 'Fair')
  return t('metaAudit.healthWeak', 'Weak')
}

export function TargetingTab() {
  const { t } = useI18n()

  return (
    <div className="space-y-3">
      <div className="overflow-x-auto rounded-2xl border border-border bg-surface shadow-sm">
        <table className="w-full min-w-[480px] text-left text-sm">
          <thead className="border-b border-border bg-surface-2 text-xs uppercase tracking-wide text-text-tertiary dark:bg-surface-elevated">
            <tr>
              <th className="px-4 py-3">{t('metaAudit.segmentColumn', 'Audience / placement')}</th>
              <th className="px-4 py-3">{t('metaAudit.healthColumn', 'Health')}</th>
              <th className="px-4 py-3 w-48">{t('metaAudit.healthScoreColumn', 'Score')}</th>
              <th className="px-4 py-3">{t('metaAudit.noteColumn', 'Note')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/50">
            {MOCK_TARGETING.map((row) => (
              <tr key={row.id} className="transition-colors hover:bg-surface-2/50">
                <td className="px-4 py-3 font-medium text-text-primary">{row.segment}</td>
                <td className="px-4 py-3">
                  <span className={cn('font-bold text-base tabular-nums', healthColor(row.health))}>
                    {row.health}
                    <span className="text-xs font-normal text-text-tertiary">/100</span>
                  </span>
                  <span className={cn('ml-2 text-xs font-medium', healthColor(row.health))}>
                    {healthLabel(row.health, t)}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="h-2 w-full overflow-hidden rounded-full bg-surface-2">
                    <div
                      className={cn('h-full rounded-full transition-all duration-500', healthBarColor(row.health))}
                      style={{ width: `${row.health}%` }}
                    />
                  </div>
                </td>
                <td className="px-4 py-3 text-text-secondary">{row.note}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-text-tertiary">
        {t('metaAudit.targetingSampleNote', 'Illustrative data — connect Meta Ads for live audience diagnostics.')}
      </p>
    </div>
  )
}
