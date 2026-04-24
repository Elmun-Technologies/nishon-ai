'use client'

import Link from 'next/link'
import { Filter } from 'lucide-react'
import { useI18n } from '@/i18n/use-i18n'
import { Button } from '@/components/ui'
import { cn } from '@/lib/utils'
import { CREATIVE_FORMATS, FORMAT_STATS } from '../constants'

interface CreativeTabProps {
  selectedFormats: Record<string, boolean>
  minSpend: string
  maxSpend: string
  gradedBy: string
  onToggleFormat: (id: string) => void
  onMinSpendChange: (v: string) => void
  onMaxSpendChange: (v: string) => void
  onGradedByChange: (v: string) => void
  onOpenFilters: () => void
}

function MetaGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  )
}

export function CreativeTab({
  selectedFormats,
  minSpend,
  maxSpend,
  gradedBy,
  onToggleFormat,
  onMinSpendChange,
  onMaxSpendChange,
  onGradedByChange,
  onOpenFilters,
}: CreativeTabProps) {
  const { t } = useI18n()
  const maxSpendFormat = Math.max(...Object.values(FORMAT_STATS).map((s) => s.spend), 1)
  const selectedFormatCount = Object.values(selectedFormats).filter(Boolean).length

  return (
    <div className="space-y-4">
      {/* Creative filters bar */}
      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-surface-2/50 px-3 py-2 text-xs dark:bg-surface-2/30">
        <div className="flex items-center gap-2">
          <span className="text-text-tertiary">{t('metaAudit.gradedBy', 'Graded by')}</span>
          <div className="flex items-center gap-1 rounded-lg border border-border bg-surface px-2 py-1">
            <MetaGlyph className="h-3.5 w-3.5 text-text-tertiary" />
            <select
              value={gradedBy}
              onChange={(e) => onGradedByChange(e.target.value)}
              className="bg-transparent text-xs font-medium outline-none"
            >
              <option value="leads">{t('metaAudit.kpiLeads', 'Leads (All)')}</option>
              <option value="purchases">{t('metaAudit.kpiPurchases', 'Purchases')}</option>
            </select>
          </div>
        </div>
        <label className="flex items-center gap-1.5 text-text-secondary">
          <span className="text-text-tertiary">{t('metaAudit.minSpend', 'Min. spend')}</span>
          <span className="text-text-tertiary">$</span>
          <input
            value={minSpend}
            onChange={(e) => onMinSpendChange(e.target.value)}
            className="w-16 rounded-md border border-border bg-surface px-2 py-1 text-xs tabular-nums"
          />
        </label>
        <label className="flex items-center gap-1.5 text-text-secondary">
          <span className="text-text-tertiary">{t('metaAudit.maxSpend', 'Max. spend')}</span>
          <span className="text-text-tertiary">$</span>
          <input
            value={maxSpend}
            onChange={(e) => onMaxSpendChange(e.target.value)}
            className="w-16 rounded-md border border-border bg-surface px-2 py-1 text-xs tabular-nums"
          />
        </label>
        <button
          type="button"
          onClick={onOpenFilters}
          className="ml-auto inline-flex items-center gap-1.5 rounded-lg border border-brand-mid/35 bg-brand-lime/15 px-3 py-1.5 text-xs font-semibold text-brand-ink hover:bg-brand-lime/25 dark:text-brand-lime"
        >
          <Filter className="h-3.5 w-3.5" />
          {t('metaAudit.smartFilter', 'Smart filter')}
        </button>
      </div>

      {/* Format cards grid */}
      <div className="grid grid-cols-2 gap-2 md:grid-cols-3 xl:grid-cols-6">
        {CREATIVE_FORMATS.map((f) => {
          const st = FORMAT_STATS[f.id]
          const spendPct = Math.round((st.spend / maxSpendFormat) * 100)
          const on = Boolean(selectedFormats[f.id])
          return (
            <button
              key={f.id}
              type="button"
              onClick={() => onToggleFormat(f.id)}
              className={cn(
                'flex min-h-[168px] flex-col gap-2 rounded-xl border p-3 text-left shadow-sm transition-colors',
                on
                  ? 'border-brand-mid/40 bg-brand-lime/10 ring-1 ring-brand-lime/25 dark:border-brand-mid/50'
                  : 'border-border bg-surface hover:border-brand-mid/30',
              )}
            >
              <div className="flex items-center justify-between gap-1">
                <span className="text-lg" aria-hidden>{f.icon}</span>
                <span className="truncate text-[11px] font-semibold text-text-primary">{t(f.labelKey, f.fallback)}</span>
              </div>
              <div className="grid flex-1 grid-cols-2 gap-x-2 gap-y-1 text-[10px]">
                <span className="text-text-tertiary">{t('metaAudit.amountSpent', 'Spend')}</span>
                <span className="text-right font-medium tabular-nums">${st.spend.toLocaleString()}</span>
                <span className="text-text-tertiary">{t('metaAudit.cpl', 'CPL')}</span>
                <span className="text-right font-medium tabular-nums">${st.cpl.toFixed(2)}</span>
                <span className="text-text-tertiary">CTR</span>
                <span className="text-right font-medium tabular-nums">{st.ctr.toFixed(1)}%</span>
                <span className="text-text-tertiary">{t('metaAudit.convRate', 'Conv. rate')}</span>
                <span className="text-right font-medium tabular-nums">{st.conv.toFixed(1)}%</span>
              </div>
              <div className="space-y-1 border-t border-border/60 pt-1">
                <div className="h-1 overflow-hidden rounded-full bg-surface-2">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-brand-mid to-brand-lime"
                    style={{ width: `${spendPct}%` }}
                  />
                </div>
                <div className="flex justify-between text-[9px] text-text-tertiary">
                  <span>{t('metaAudit.leadsBar', 'Leads')}</span>
                  <span>{t('metaAudit.spendBar', 'Spend')}</span>
                </div>
              </div>
            </button>
          )
        })}
      </div>

      {/* Creative matrix */}
      <section className="overflow-hidden rounded-2xl border border-border bg-surface shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-4 py-3">
          <h2 className="text-sm font-semibold text-text-primary">{t('metaAudit.creativeMatrix', 'Creative matrix')}</h2>
          <Button type="button" variant="secondary" size="sm">
            {t('metaAudit.seeAllCreatives', 'See all creatives')}
          </Button>
        </div>
        <div className="p-4">
          <p className="mb-3 text-xs text-text-secondary">
            {t('metaAudit.matrixBlurb', 'Strong results + controlled spend sit toward the top-right. Early tests sit bottom-left (illustrative).')}
          </p>
          <div className="relative mx-auto aspect-square max-w-lg rounded-2xl border border-border bg-gradient-to-br from-surface-2 via-surface to-surface-2 shadow-inner dark:from-surface-2 dark:via-surface dark:to-brand-ink/20">
            <span className="absolute left-1 top-4 rotate-180 text-[10px] font-bold text-primary [writing-mode:vertical-rl]">
              {t('metaAudit.quadrantScalable', 'SCALABLE')}
            </span>
            <span className="absolute right-1 top-4 text-[10px] font-bold text-text-secondary [writing-mode:vertical-rl]">
              {t('metaAudit.quadrantCore', 'CORE PERFORMERS')}
            </span>
            <span className="absolute bottom-4 left-1 rotate-180 text-[10px] font-bold text-text-tertiary [writing-mode:vertical-rl]">
              {t('metaAudit.quadrantStarted', 'GETTING STARTED')}
            </span>
            <span className="absolute bottom-4 right-1 text-[10px] font-bold text-amber-600 [writing-mode:vertical-rl] dark:text-amber-400">
              {t('metaAudit.quadrantOverspend', 'OVERSPEND')}
            </span>
            <span className="absolute left-1/2 top-2 -translate-x-1/2 text-[10px] font-semibold text-text-tertiary">
              {t('metaAudit.axisLeads', 'Leads (All)')}
            </span>
            <span className="absolute bottom-2 right-3 text-[10px] font-semibold text-text-tertiary">
              {t('metaAudit.axisSpend', 'Spend')}
            </span>
            <div className="pointer-events-none absolute inset-10 flex flex-col items-center justify-center gap-3">
              <div className="h-3 w-3 rounded-full bg-primary/90 shadow" style={{ marginLeft: '38%', marginBottom: '12%' }} />
              <div className="h-3 w-3 rounded-full bg-primary/50" style={{ marginLeft: '22%', marginTop: '8%' }} />
              <div className="h-3 w-3 rounded-full bg-text-tertiary/60" style={{ marginLeft: '-18%', marginTop: '14%' }} />
              <p className="max-w-xs px-4 text-center text-xs text-text-tertiary">
                {t('metaAudit.matrixSampleCaption', 'Illustrative dots — connect Meta to plot your real creatives here.')}
              </p>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border bg-surface-2/40 px-4 py-3 text-xs dark:bg-surface-2/20">
          <span className="text-text-secondary">
            {CREATIVE_FORMATS.length} {t('metaAudit.formatTypes', 'format types')} · {selectedFormatCount} {t('metaAudit.selectedWord', 'selected')}
          </span>
          <div className="flex items-center gap-2">
            {selectedFormatCount > 0 ? (
              <Link
                href="/ad-launcher"
                className="rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-brand-ink hover:opacity-95"
              >
                {t('metaAudit.openAdLauncher', 'Open in Ad Launcher')}
              </Link>
            ) : (
              <span className="cursor-not-allowed rounded-lg bg-surface-2 px-3 py-1.5 text-xs font-semibold text-text-tertiary opacity-70">
                {t('metaAudit.openAdLauncher', 'Open in Ad Launcher')}
              </span>
            )}
          </div>
        </div>
      </section>
    </div>
  )
}
