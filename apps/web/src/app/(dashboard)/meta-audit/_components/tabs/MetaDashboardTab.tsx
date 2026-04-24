'use client'

import { useI18n } from '@/i18n/use-i18n'
import { MetricCard, Badge } from '@/components/ui'
import { formatCurrency, formatNumber, cn } from '@/lib/utils'
import { MOCK_CAMPAIGNS, STATUS_COLORS } from '../constants'
import type { KpiMode, LiveCampaignRow, LiveTotals } from '../types'

interface MetaDashboardTabProps {
  isLiveData: boolean
  liveLoading: boolean
  liveTotals: LiveTotals | null
  filteredLiveRows: LiveCampaignRow[]
  filteredMockCampaigns: typeof MOCK_CAMPAIGNS
  kpi: KpiMode
  dateLabel: string
  sampleSpendMultiplier: number
}

function statusVariant(status: string): 'success' | 'warning' | 'error' | 'gray' {
  const s = status.toUpperCase()
  if (s === 'ACTIVE') return 'success'
  if (s === 'PAUSED' || s === 'LIMITED') return 'warning'
  if (s === 'DELETED') return 'error'
  return 'gray'
}

export function MetaDashboardTab({
  isLiveData,
  liveLoading,
  liveTotals,
  filteredLiveRows,
  filteredMockCampaigns,
  kpi,
  dateLabel,
  sampleSpendMultiplier,
}: MetaDashboardTabProps) {
  const { t } = useI18n()

  return (
    <div className="space-y-4">
      {/* KPI cards */}
      <div className="grid gap-3 sm:grid-cols-3">
        {isLiveData && liveTotals ? (
          <>
            <MetricCard
              label={t('metaAudit.kpiSpend', 'Amount spent')}
              value={formatCurrency(liveTotals.spend, liveTotals.currency)}
              subtext={dateLabel}
              loading={liveLoading}
            />
            <MetricCard
              label={t('metaAudit.kpiCtr', 'CTR (blended)')}
              value={`${liveTotals.ctr.toFixed(2)}%`}
              subtext={t('metaAudit.metricCtr', 'CTR (blended)')}
              accent
              loading={liveLoading}
            />
            <MetricCard
              label={t('metaAudit.kpiClicks', 'Clicks')}
              value={formatNumber(liveTotals.clicks)}
              subtext={t('metaAudit.roasUnavailableNote', 'ROAS is not in this reporting sync yet.')}
              loading={liveLoading}
            />
          </>
        ) : (
          <>
            <MetricCard
              label={t('metaAudit.kpiSpend', 'Amount spent')}
              value={`$${(13270 * sampleSpendMultiplier).toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
              subtext={dateLabel}
            />
            <MetricCard
              label={t('metaAudit.metricRoas', 'ROAS (All)')}
              value={kpi === 'roas' ? '2.6×' : '—'}
              accent
            />
            <MetricCard
              label={t('metaAudit.kpiLeads', 'Leads (All)')}
              value={kpi === 'leads' ? '184' : '142'}
            />
          </>
        )}
      </div>

      {/* Campaign table */}
      <div className="overflow-x-auto rounded-2xl border border-brand-mid/15 bg-surface shadow-sm dark:border-brand-mid/20">
        <table className="w-full min-w-[560px] border-collapse text-left text-sm">
          <thead className="border-b border-brand-mid/10 bg-surface-2 text-xs uppercase tracking-wide text-text-tertiary dark:bg-surface-elevated">
            <tr>
              <th className="px-4 py-3">{t('metaAudit.campaignColumn', 'Campaign')}</th>
              <th className="px-4 py-3 text-right">{t('metaAudit.spendColumn', 'Spend')}</th>
              {isLiveData ? (
                <>
                  <th className="px-4 py-3 text-right">{t('metaAudit.clicksColumn', 'Clicks')}</th>
                  <th className="px-4 py-3 text-right">{t('metaAudit.impressionsColumn', 'Impressions')}</th>
                  <th className="px-4 py-3 text-right">{t('metaAudit.ctrColumn', 'CTR')}</th>
                  <th className="px-4 py-3 text-right">{t('metaAudit.cpcColumn', 'CPC')}</th>
                </>
              ) : (
                <th className="px-4 py-3 text-right">{t('metaAudit.roasColumn', 'ROAS')}</th>
              )}
              <th className="px-4 py-3">{t('metaAudit.statusColumn', 'Status')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/50">
            {isLiveData
              ? filteredLiveRows.map((row) => (
                  <tr key={row.id} className="transition-colors hover:bg-surface-2/50">
                    <td className="px-4 py-3 font-medium text-text-primary">{row.name}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-text-secondary">
                      {formatCurrency(row.spend, row.currency)}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-text-secondary">{formatNumber(row.clicks)}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-text-secondary">{formatNumber(row.impressions)}</td>
                    <td
                      className={cn(
                        'px-4 py-3 text-right tabular-nums font-medium',
                        row.ctr >= 2 ? 'text-emerald-600 dark:text-emerald-400' : row.ctr >= 1 ? 'text-text-primary' : row.ctr > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-text-tertiary',
                      )}
                    >
                      {row.ctr.toFixed(2)}%
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-text-secondary">
                      {row.cpc > 0 ? formatCurrency(row.cpc, row.currency) : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={statusVariant(row.status)} size="sm">
                        {row.status}
                      </Badge>
                    </td>
                  </tr>
                ))
              : filteredMockCampaigns.map((row) => (
                  <tr key={row.id} className="transition-colors hover:bg-surface-2/50">
                    <td className="px-4 py-3 font-medium text-text-primary">{row.name}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-text-secondary">${row.spend.toLocaleString()}</td>
                    <td className="px-4 py-3 text-right tabular-nums font-medium text-brand-ink dark:text-brand-lime">{row.roas.toFixed(1)}×</td>
                    <td className="px-4 py-3">
                      <Badge variant={statusVariant(row.status)} size="sm">
                        {row.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
          </tbody>
        </table>
      </div>

      {!isLiveData && (
        <p className="text-center text-xs">
          <span className="inline-flex rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 font-medium text-amber-900 dark:text-amber-200">
            {t('metaAudit.sampleNote', 'Sample data')}
          </span>
        </p>
      )}
    </div>
  )
}
