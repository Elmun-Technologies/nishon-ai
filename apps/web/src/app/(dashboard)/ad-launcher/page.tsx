'use client'

import { useState } from 'react'
import {
  BarChart3,
  Filter,
  ImageIcon,
  Layers,
  LayoutGrid,
  Search,
  Sparkles,
  ChevronRight,
} from 'lucide-react'
import { useI18n } from '@/i18n/use-i18n'
import { PageHeader, Button } from '@/components/ui'

type AdTab = 'ads' | 'new' | 'clusters' | 'insights'

const TABS: Array<{ id: AdTab; labelKey: string; fallback: string; icon: typeof LayoutGrid }> = [
  { id: 'ads', labelKey: 'adLauncher.tabAds', fallback: 'Ads', icon: LayoutGrid },
  { id: 'new', labelKey: 'adLauncher.tabNewAds', fallback: 'New Ads', icon: ImageIcon },
  { id: 'clusters', labelKey: 'adLauncher.tabClusters', fallback: 'Creative clusters', icon: Layers },
  { id: 'insights', labelKey: 'adLauncher.tabInsights', fallback: 'Insights', icon: BarChart3 },
]

export default function AdLauncherPage() {
  const { t } = useI18n()
  const [tab, setTab] = useState<AdTab>('ads')
  const [previewCount] = useState(0)

  return (
    <div className="space-y-4 max-w-[1600px] pb-8">
      <section className="rounded-2xl border border-blue-200/70 bg-gradient-to-r from-blue-50 via-indigo-50 to-violet-50 p-3 dark:border-slate-700 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800">
        <PageHeader
          className="mb-0 border-0 bg-transparent p-2 shadow-none"
          title={
            <span className="inline-flex items-center gap-2">
              {t('adLauncher.title', 'Ad Launcher')}
              <span
                className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-border text-text-tertiary text-xs"
                title={t('adLauncher.infoHint', 'Pick ads, presets, and filters before pushing to Meta.')}
              >
                ?
              </span>
            </span>
          }
          subtitle={t('adLauncher.subtitle', 'Search, sort, and bundle creatives — Madgicx-style launcher shell (wire to sync later).')}
          actions={
            <div className="flex flex-wrap items-center gap-2">
              <Button variant="secondary" size="sm" className="border-violet-500/40 text-violet-700 dark:text-violet-200">
                <Sparkles className="h-3.5 w-3.5" />
                {t('adLauncher.findInspiration', 'Find inspiration')}
              </Button>
              <Button size="sm" className="gap-1">
                {t('adLauncher.selectAdSets', 'Select existing ad sets')}
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          }
        />
      </section>

      <div className="flex flex-col lg:flex-row gap-4 items-start">
        <div className="flex-1 min-w-0 space-y-4 w-full">
          <div className="border-b border-border flex gap-1 overflow-x-auto">
            {TABS.map(({ id, labelKey, fallback, icon: Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => setTab(id)}
                className={`inline-flex items-center gap-1.5 px-3 py-2.5 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
                  tab === id
                    ? 'border-violet-500 text-violet-600 dark:text-violet-300'
                    : 'border-transparent text-text-tertiary hover:text-text-secondary'
                }`}
              >
                <Icon className="h-4 w-4 opacity-80" />
                {t(labelKey, fallback)}
              </button>
            ))}
          </div>

          <div className="rounded-xl border border-border/70 bg-white/95 dark:bg-slate-900/75 p-3 flex flex-wrap items-center gap-2 shadow-sm">
            <select className="rounded-lg border border-border bg-surface px-2 py-2 text-xs min-w-[120px]">
              <option>{t('adLauncher.sortBy', 'Sort by: Last edited')}</option>
            </select>
            <div className="flex items-center gap-1 rounded-lg border border-border bg-surface px-2 py-1.5">
              <span className="text-[10px] text-text-tertiary">{t('adLauncher.metric', 'Metric')}</span>
              <select className="bg-transparent text-xs font-medium outline-none min-w-[130px]">
                <option>{t('adLauncher.cpl', 'Cost per lead (All)')}</option>
              </select>
            </div>
            <label className="flex items-center gap-1 text-xs text-text-secondary">
              <span className="text-text-tertiary">{t('adLauncher.minSpend', 'Min. spend')}</span>
              <span className="text-text-tertiary">$</span>
              <input defaultValue="0" className="w-14 rounded-md border border-border bg-surface px-2 py-1 text-xs tabular-nums" />
            </label>
            <div className="flex-1" />
            <button
              type="button"
              className="inline-flex items-center gap-1 rounded-lg border border-border px-3 py-2 text-xs font-medium text-text-secondary hover:bg-surface-2"
            >
              <Search className="h-3.5 w-3.5" />
              {t('adLauncher.filterData', 'Filter data')}
            </button>
            <button
              type="button"
              className="inline-flex items-center gap-1 rounded-lg border border-violet-500/50 bg-violet-500/10 px-3 py-2 text-xs font-semibold text-violet-700 dark:text-violet-200"
            >
              <Filter className="h-3.5 w-3.5" />
              {t('adLauncher.smartFilter', 'Smart filter')}
            </button>
          </div>

          <div className="rounded-2xl border border-border/70 bg-white/95 dark:bg-slate-900/75 shadow-sm min-h-[320px] flex flex-col items-center justify-center px-6 py-16 text-center">
            <div className="inline-flex h-14 w-14 items-center justify-center rounded-xl bg-violet-500/15 text-violet-600 dark:text-violet-300 mb-4">
              <Layers className="h-7 w-7 opacity-80" />
            </div>
            <h3 className="text-base font-semibold text-text-primary mb-1">{t('adLauncher.emptyTitle', 'No data for this time frame')}</h3>
            <p className="text-sm text-text-tertiary max-w-sm">
              {t('adLauncher.emptyBody', 'Choose another date range or connect Meta to load ads and creatives into the launcher.')}
            </p>
          </div>
        </div>

        <aside className="w-full lg:w-80 shrink-0 rounded-2xl border border-border/70 bg-white/95 dark:bg-slate-900/75 shadow-sm overflow-hidden flex flex-col">
          <div className="border-b border-border/70 px-3 py-2.5 flex items-center justify-between bg-violet-500/10">
            <span className="text-xs font-semibold text-violet-800 dark:text-violet-200">
              {t('adLauncher.previewTitle', 'Ad selection preview')} ({previewCount})
            </span>
          </div>
          <div className="p-4 space-y-4 flex-1">
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-semibold text-text-tertiary uppercase tracking-wide">
                {t('adLauncher.creativeSet', 'Creative set')}
              </label>
              <select className="rounded-lg border border-border bg-surface px-2 py-2 text-xs">
                <option>{t('adLauncher.newPreset', 'New preset')}</option>
              </select>
              <button
                type="button"
                disabled
                className="rounded-lg border border-violet-500/40 px-3 py-2 text-xs font-semibold text-violet-400 cursor-not-allowed"
              >
                {t('adLauncher.saveSelection', 'Save creative selection')}
              </button>
            </div>
            <div className="rounded-xl border border-dashed border-border p-3 space-y-2">
              <p className="text-xs font-medium text-text-primary">{t('adLauncher.manualAdd', 'Manually add by')}</p>
              <select className="w-full rounded-lg border border-border bg-surface px-2 py-1.5 text-xs">
                <option>Ad ID</option>
              </select>
              <input
                placeholder={t('adLauncher.adIdPlaceholder', 'Enter an ad ID to add')}
                className="w-full rounded-lg border border-border bg-surface px-2 py-2 text-xs"
              />
              <Button type="button" size="sm" variant="secondary" className="w-full">
                {t('common.apply', 'Apply')}
              </Button>
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}
