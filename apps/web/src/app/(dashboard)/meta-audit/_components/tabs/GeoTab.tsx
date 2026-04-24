'use client'

import { useI18n } from '@/i18n/use-i18n'
import { MOCK_GEO } from '../constants'

const BRAND_COLORS = [
  'bg-brand-mid',
  'bg-brand-lime',
  'bg-emerald-500',
  'bg-teal-500',
]

export function GeoTab() {
  const { t } = useI18n()
  const maxShare = Math.max(...MOCK_GEO.map((r) => r.share))

  return (
    <div className="space-y-3">
      <div className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
        <p className="mb-4 text-xs font-semibold uppercase tracking-wide text-text-tertiary">
          {t('metaAudit.regionColumn', 'Region')} · {t('metaAudit.shareColumn', 'Spend share')}
        </p>

        <div className="space-y-4">
          {MOCK_GEO.map((row, i) => (
            <div key={row.region}>
              <div className="mb-1.5 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${BRAND_COLORS[i % BRAND_COLORS.length]}`} />
                  <span className="truncate text-sm font-medium text-text-primary">{row.region}</span>
                </div>
                <div className="flex items-center gap-3 shrink-0 text-sm tabular-nums text-text-secondary">
                  <span className="font-semibold text-text-primary">{row.share}%</span>
                  <span className="text-text-tertiary">${row.spend.toLocaleString()}</span>
                </div>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-surface-2">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${BRAND_COLORS[i % BRAND_COLORS.length]}`}
                  style={{ width: `${(row.share / maxShare) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Summary table */}
      <div className="overflow-x-auto rounded-xl border border-border bg-surface shadow-sm">
        <table className="w-full min-w-[360px] text-left text-sm">
          <thead className="border-b border-border bg-surface-2 text-xs uppercase tracking-wide text-text-tertiary dark:bg-surface-elevated">
            <tr>
              <th className="px-4 py-2.5">{t('metaAudit.regionColumn', 'Region')}</th>
              <th className="px-4 py-2.5 text-right">{t('metaAudit.shareColumn', 'Spend share')}</th>
              <th className="px-4 py-2.5 text-right">{t('metaAudit.spendColumn', 'Spend')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/50">
            {MOCK_GEO.map((row) => (
              <tr key={row.region} className="transition-colors hover:bg-surface-2/50">
                <td className="px-4 py-2.5 font-medium text-text-primary">{row.region}</td>
                <td className="px-4 py-2.5 text-right tabular-nums text-text-secondary">{row.share}%</td>
                <td className="px-4 py-2.5 text-right tabular-nums text-text-secondary">${row.spend.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-text-tertiary">
        {t('metaAudit.geoSampleNote', 'Illustrative data — geo split requires region breakdowns from Meta.')}
      </p>
    </div>
  )
}
