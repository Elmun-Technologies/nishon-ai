'use client'

import { useRef } from 'react'
import { Search } from 'lucide-react'
import { useI18n } from '@/i18n/use-i18n'
import { Button } from '@/components/ui'
import { cn } from '@/lib/utils'
import type { KpiMode, Persona } from './types'

function MetaGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  )
}

interface AuditToolbarProps {
  persona: Persona
  kpi: KpiMode
  isLiveData: boolean
  search: string
  showSearch: boolean
  preset: string
  onPersonaChange: (p: Persona) => void
  onKpiChange: (k: KpiMode) => void
  onSearchChange: (v: string) => void
  onShowSearch: () => void
  onPresetChange: (v: string) => void
  onSaveView: () => void
  onOpenFilters: () => void
}

export function AuditToolbar({
  persona,
  kpi,
  isLiveData,
  search,
  showSearch,
  preset,
  onPersonaChange,
  onKpiChange,
  onSearchChange,
  onShowSearch,
  onPresetChange,
  onSaveView,
}: AuditToolbarProps) {
  const { t } = useI18n()
  const searchRef = useRef<HTMLInputElement>(null)

  const handleShowSearch = () => {
    onShowSearch()
    queueMicrotask(() => searchRef.current?.focus())
  }

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-brand-mid/15 bg-surface p-3 shadow-sm ring-1 ring-border/50 dark:border-brand-mid/20 lg:flex-row lg:flex-wrap lg:items-center">
      {/* Persona toggle */}
      <div className="flex flex-col gap-1 border-b border-border pb-3 text-xs lg:border-b-0 lg:border-r lg:pb-0 lg:pr-4">
        <span className="font-semibold uppercase tracking-wide text-text-tertiary">
          {t('metaAudit.personaLabel', 'View as')}
        </span>
        <div className="flex flex-wrap gap-1.5">
          {(['owner', 'specialist'] as Persona[]).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => onPersonaChange(p)}
              className={cn(
                'rounded-lg border px-3 py-1.5 text-xs font-medium transition-all duration-200',
                persona === p
                  ? 'border-transparent bg-gradient-to-r from-brand-mid to-brand-lime text-brand-ink shadow-sm'
                  : 'border-border text-text-secondary hover:bg-surface-2',
              )}
            >
              {p === 'owner'
                ? t('metaAudit.personaOwner', 'Account owner')
                : t('metaAudit.personaSpecialist', 'Targetologist')}
            </button>
          ))}
        </div>
        <span className="max-w-xs text-[11px] leading-snug text-text-tertiary lg:max-w-[220px]">
          {persona === 'owner'
            ? t('metaAudit.personaHintOwner', 'High-level risks, budget concentration, and clear next checks.')
            : t('metaAudit.personaHintSpecialist', 'Delivery metrics (CTR, CPC), outliers vs. account average, and campaign-level fixes.')}
        </span>
      </div>

      {/* Right side controls */}
      <div className="flex flex-1 flex-wrap items-center gap-2">
        {/* Search toggle */}
        <button
          type="button"
          onClick={handleShowSearch}
          className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs font-medium text-text-secondary transition-colors hover:bg-surface-2"
        >
          <Search className="h-3.5 w-3.5" />
          {t('metaAudit.filterData', 'Filter data')}
        </button>

        {showSearch && (
          <input
            ref={searchRef}
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={t('metaAudit.searchPlaceholder', 'Search campaigns…')}
            className="min-w-[180px] flex-1 rounded-lg border border-border bg-surface-2 px-3 py-2 text-xs outline-none focus:border-primary md:max-w-xs dark:bg-surface"
          />
        )}

        {/* Preset selector */}
        <select
          value={preset}
          onChange={(e) => onPresetChange(e.target.value)}
          className="min-w-[150px] rounded-lg border border-border bg-surface-2 px-2 py-2 text-xs text-text-secondary dark:bg-surface"
        >
          <option value="">{t('metaAudit.loadPreset', 'Load filter preset…')}</option>
          <option value="winners">{t('metaAudit.presetWinners', 'Winning ad sets')}</option>
          <option value="learning">{t('metaAudit.presetLearning', 'Learning limited')}</option>
        </select>

        <Button type="button" variant="secondary" size="sm" onClick={onSaveView}>
          {t('metaAudit.saveView', 'Save this view')}
        </Button>

        <div className="min-w-0 flex-1" />

        {/* KPI selector */}
        <div className="flex items-center gap-1.5 rounded-lg border border-border bg-surface-2 px-2 py-1.5 dark:bg-surface">
          <MetaGlyph className="h-4 w-4 shrink-0 text-text-tertiary" />
          <select
            value={kpi}
            onChange={(e) => onKpiChange(e.target.value as KpiMode)}
            className="min-w-[120px] bg-transparent text-xs font-medium text-text-primary outline-none"
          >
            {isLiveData ? (
              <>
                <option value="spend">{t('metaAudit.metricSpend', 'Amount spent')}</option>
                <option value="ctr">{t('metaAudit.metricCtr', 'CTR (blended)')}</option>
                <option value="clicks">{t('metaAudit.kpiClicks', 'Clicks')}</option>
              </>
            ) : (
              <>
                <option value="roas">{t('metaAudit.metricRoas', 'ROAS (All)')}</option>
                <option value="leads">{t('metaAudit.metricLeads', 'Leads (All)')}</option>
                <option value="spend">{t('metaAudit.metricSpend', 'Amount spent')}</option>
              </>
            )}
          </select>
        </div>
      </div>
    </div>
  )
}
