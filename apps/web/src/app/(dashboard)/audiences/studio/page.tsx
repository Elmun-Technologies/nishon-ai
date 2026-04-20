'use client'

import { useMemo, useState } from 'react'
import { DateRangeFilter } from '@/components/filters/DateRangeFilter'
import { Users } from 'lucide-react'
import Link from 'next/link'
import { useI18n } from '@/i18n/use-i18n'
import { cn } from '@/lib/utils'
import { PageHeader } from '@/components/ui'

export default function AudienceStudioPage() {
  const { t } = useI18n()
  const [tab, setTab] = useState<'performance' | 'discover'>('performance')
  const [range, setRange] = useState('last7')
  const [customFromDate, setCustomFromDate] = useState('')
  const [customToDate, setCustomToDate] = useState('')

  const studioRangePresets = useMemo(
    () => [
      { id: 'last7', label: t('audiences.studioLast7d', 'Last 7 days') },
      { id: 'last30', label: t('audiences.studioLast30d', 'Last 30 days') },
    ],
    [t],
  )

  return (
    <div className="space-y-5 max-w-7xl pb-8">
      <PageHeader
        title={t('audiences.studioTitle', 'Audience Studio')}
        subtitle={t('audiences.studioSubtitle', 'Explore performance, discover interests, and build intersections before launch.')}
        actions={
          <Link
            href="/audiences"
            className={cn(
              'inline-flex items-center justify-center rounded-xl font-medium transition-all duration-200 text-sm',
              'bg-white/80 dark:bg-slate-900/70 hover:bg-white dark:hover:bg-slate-900 text-text-primary border border-border hover:border-border px-4 py-2',
            )}
          >
            {t('audiences.backToLauncher', 'Back to Launcher')}
          </Link>
        }
      />

      <div className="border-b border-border flex gap-1">
        <button
          type="button"
          onClick={() => setTab('performance')}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
            tab === 'performance' ? 'border-violet-500 text-violet-600 dark:text-violet-300' : 'border-transparent text-text-tertiary'
          }`}
        >
          {t('audiences.studioTabPerformance', 'Explore audiences by performance')}
        </button>
        <button
          type="button"
          onClick={() => setTab('discover')}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
            tab === 'discover' ? 'border-violet-500 text-violet-600 dark:text-violet-300' : 'border-transparent text-text-tertiary'
          }`}
        >
          {t('audiences.studioTabDiscover', 'Discover new interests')}
        </button>
      </div>

      <section className="rounded-2xl border border-border/70 bg-white/95 p-4 shadow-sm dark:bg-slate-900/75">
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <input
            type="search"
            placeholder={t('audiences.studioSearchPlaceholder', 'Search audiences…')}
            className="flex-1 min-w-[200px] rounded-xl border border-border bg-surface px-4 py-2.5 text-sm outline-none focus:border-violet-500/50"
          />
          <DateRangeFilter
            variant="select"
            value={range}
            onValueChange={setRange}
            presets={studioRangePresets}
            fromDate={customFromDate}
            toDate={customToDate}
            onFromDateChange={setCustomFromDate}
            onToDateChange={setCustomToDate}
            selectClassName="rounded-xl border border-border bg-surface px-3 py-2.5 text-sm"
            dateInputClassName="rounded-xl border border-border bg-surface px-3 py-2.5 text-sm"
          />
        </div>
        <div className="rounded-xl border border-border overflow-hidden">
          <table className="w-full text-sm text-left">
            <thead className="bg-surface-2/80 text-xs text-text-tertiary uppercase tracking-wide">
              <tr>
                <th className="px-4 py-3 w-10" />
                <th className="px-4 py-3">{t('audiences.studioColAudience', 'Audience')}</th>
                <th className="px-4 py-3">{t('audiences.studioColType', 'Type')}</th>
                <th className="px-4 py-3 text-right">{t('audiences.studioColSpend', 'Spend')}</th>
                <th className="px-4 py-3 text-right">ROAS</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td colSpan={5} className="px-4 py-16 text-center text-text-tertiary text-sm">
                  {t('audiences.studioNoData', 'No data found — connect Meta and sync audiences to populate this table.')}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-2xl border border-border/70 bg-white/95 p-5 shadow-sm dark:bg-slate-900/75">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <h2 className="text-sm font-semibold text-text-primary flex items-center gap-2">
            <Users className="h-4 w-4 text-violet-500" />
            {t('audiences.mixerTitle', 'Audience mixer')}
          </h2>
          <div className="flex gap-2">
            <select className="rounded-lg border border-border bg-surface px-2 py-1.5 text-xs text-text-secondary max-w-[220px]">
              <option>{t('audiences.mixerNoPresets', 'No presets for this ad account')}</option>
            </select>
            <button
              type="button"
              className="rounded-lg border border-violet-500/40 px-3 py-1.5 text-xs font-semibold text-violet-600 dark:text-violet-300 opacity-60 cursor-not-allowed"
              disabled
            >
              {t('audiences.mixerSave', 'Save audience selection')}
            </button>
          </div>
        </div>
        <p className="text-xs text-text-tertiary mb-4">{t('audiences.mixerIncluded', 'Included audiences')}</p>
        <div className="flex flex-wrap items-center justify-center gap-2 md:gap-3">
          {(
            [
              t('audiences.mixerSlot0', '0 intersection'),
              t('audiences.mixerSlot1', '1st intersection'),
              t('audiences.mixerSlot2', '2nd intersection'),
            ] as const
          ).map((label, i) => (
            <div key={label} className="contents">
              {i > 0 && (
                <span className="rounded-full bg-teal-600/90 text-white text-[10px] font-bold px-2.5 py-1 shrink-0">AND</span>
              )}
              <div className="flex-1 min-w-[140px] max-w-[200px] rounded-xl border-2 border-dashed border-border bg-surface-2/40 px-4 py-8 text-center">
                <p className="text-[10px] font-semibold text-text-tertiary uppercase tracking-wide">{label}</p>
                <p className="text-xs text-text-tertiary mt-2">{t('audiences.mixerDropHint', 'Add from table above')}</p>
              </div>
            </div>
          ))}
        </div>
        <p className="text-xs text-text-tertiary mt-4 flex items-center gap-1">
          <span className="inline-block h-1 w-1 rounded-full bg-text-tertiary" />
          {t('audiences.mixerReach', 'Potential reach: unavailable until audiences are defined.')}
        </p>
      </section>
    </div>
  )
}
