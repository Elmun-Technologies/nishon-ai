'use client'

import { Compass, RefreshCw } from 'lucide-react'
import { useI18n } from '@/i18n/use-i18n'
import { DateRangeFilter } from '@/components/filters/DateRangeFilter'
import { Button, Badge } from '@/components/ui'
import { cn } from '@/lib/utils'
import type { DateRange } from './types'

interface AuditHeaderProps {
  isLiveData: boolean
  liveLoading: boolean
  dateRange: DateRange
  customFromDate: string
  customToDate: string
  dateLabel: string
  lastRefresh: Date | null
  onRefresh: () => void
  onDateRangeChange: (v: DateRange) => void
  onFromDateChange: (v: string) => void
  onToDateChange: (v: string) => void
}

export function AuditHeader({
  isLiveData,
  liveLoading,
  dateRange,
  customFromDate,
  customToDate,
  dateLabel,
  lastRefresh,
  onRefresh,
  onDateRangeChange,
  onFromDateChange,
  onToDateChange,
}: AuditHeaderProps) {
  const { t } = useI18n()

  const presets = [
    { id: '7',     label: t('metaAudit.date7',     'Last 7 days') },
    { id: '30',    label: t('metaAudit.date30',    'Last 30 days') },
    { id: 'month', label: t('metaAudit.dateMonth', 'This month') },
  ]

  return (
    <section className="rounded-2xl border border-brand-mid/20 bg-gradient-to-br from-brand-lime/[0.08] via-surface-2/95 to-surface-2/90 p-4 dark:border-brand-mid/25 dark:from-brand-lime/5 dark:via-surface-elevated/90 dark:to-surface-elevated/90">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        {/* Title + badges */}
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-brand-mid/30 bg-gradient-to-br from-brand-mid/25 to-brand-lime/40 text-brand-ink shadow-sm dark:from-brand-mid/40 dark:to-brand-lime/30">
            <Compass className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-lg font-bold text-text-primary">
                {t('metaAudit.title', '360° Meta Audit')}
              </h1>
              <Badge
                variant={isLiveData ? 'success' : 'gray'}
                size="sm"
                dot
              >
                {isLiveData
                  ? t('metaAudit.badgeLive', 'Live data')
                  : t('metaAudit.badgeSample', 'Sample walkthrough')}
              </Badge>
              {liveLoading && (
                <span className="text-xs text-text-tertiary">
                  {t('common.loading', 'Loading…')}
                </span>
              )}
            </div>
            <p className="mt-0.5 text-sm text-text-secondary">
              {isLiveData
                ? t('metaAudit.subtitleLive', 'Six views to diagnose Meta performance. Numbers below come from your connected Meta accounts for the selected period.')
                : t('metaAudit.subtitle', 'Six views to diagnose Meta performance. Below is sample data until your ad account is connected.')}
            </p>
          </div>
        </div>

        {/* Controls */}
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={onRefresh}
            disabled={liveLoading}
            className="gap-1.5"
          >
            <RefreshCw className={cn('h-3.5 w-3.5', liveLoading && 'animate-spin')} />
            {t('common.refresh', 'Refresh')}
          </Button>
          <DateRangeFilter
            variant="select"
            value={dateRange}
            onValueChange={(id) => onDateRangeChange(id as DateRange)}
            presets={presets}
            fromDate={customFromDate}
            toDate={customToDate}
            onFromDateChange={onFromDateChange}
            onToDateChange={onToDateChange}
            selectClassName="rounded-xl border border-brand-mid/20 bg-surface px-3 py-2 text-xs font-medium text-text-primary shadow-sm focus:border-brand-mid focus:outline-none focus:ring-2 focus:ring-brand-lime/40"
            dateInputClassName="rounded-xl border border-brand-mid/20 bg-surface px-3 py-2 text-xs font-medium text-text-primary shadow-sm focus:border-brand-mid focus:outline-none focus:ring-2 focus:ring-brand-lime/40"
          />
          <span className="hidden text-xs text-text-tertiary sm:inline">
            {dateLabel}
            {lastRefresh && (
              <span className="ml-1">
                · {lastRefresh.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
          </span>
        </div>
      </div>
    </section>
  )
}
