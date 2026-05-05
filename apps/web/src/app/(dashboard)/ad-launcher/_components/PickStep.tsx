'use client'

import { useMemo } from 'react'
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  ArrowUpDown,
  Inbox,
  Search,
} from 'lucide-react'
import { Button } from '@/components/ui'
import { useI18n } from '@/i18n/use-i18n'
import { cn } from '@/lib/utils'
import { TableSkeleton } from './TableSkeleton'
import type { AdLauncherController } from '../_lib/use-ad-launcher'
import type { CampaignRow, SortKey } from '../_lib/types'

function fmtMoney(n: number, currency = 'USD') {
  if (!isFinite(n) || n === 0) return '—'
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      maximumFractionDigits: 2,
    }).format(n)
  } catch {
    return `$${n.toFixed(2)}`
  }
}

function fmtNumber(n: number) {
  if (!isFinite(n) || n === 0) return '—'
  return new Intl.NumberFormat('en-US').format(Math.round(n))
}

function fmtPct(n: number) {
  if (!isFinite(n) || n === 0) return '—'
  return `${n.toFixed(2)}%`
}

const HEALTH_STYLE: Record<CampaignRow['aiHealth'], string> = {
  GOOD: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400',
  AVERAGE: 'bg-amber-500/15 text-amber-700 dark:text-amber-400',
  BAD: 'bg-rose-500/15 text-rose-700 dark:text-rose-400',
}

const STATUS_STYLE: Record<string, string> = {
  ACTIVE: 'bg-emerald-500/12 text-emerald-700 dark:text-emerald-300',
  PAUSED: 'bg-amber-500/12 text-amber-700 dark:text-amber-300',
  ARCHIVED: 'bg-slate-500/12 text-slate-700 dark:text-slate-300',
  DELETED: 'bg-rose-500/12 text-rose-700 dark:text-rose-300',
}

function SortableTh({
  label,
  sortKey,
  align = 'left',
  ctl,
}: {
  label: string
  sortKey: SortKey
  align?: 'left' | 'right'
  ctl: AdLauncherController
}) {
  const isActive = ctl.sortKey === sortKey
  const Icon = !isActive ? ArrowUpDown : ctl.sortDir === 'asc' ? ArrowUp : ArrowDown
  return (
    <th
      scope="col"
      aria-sort={isActive ? (ctl.sortDir === 'asc' ? 'ascending' : 'descending') : 'none'}
      className={cn('px-3 py-2.5', align === 'right' && 'text-right')}
    >
      <button
        type="button"
        onClick={() => ctl.toggleSort(sortKey)}
        className={cn(
          'inline-flex items-center gap-1 rounded px-1 py-0.5 text-xs font-semibold uppercase tracking-wide transition-colors',
          align === 'right' && 'flex-row-reverse',
          isActive ? 'text-text-primary' : 'text-text-tertiary hover:text-text-secondary',
        )}
      >
        <span>{label}</span>
        <Icon
          className={cn(
            'h-3 w-3 shrink-0 transition-opacity',
            isActive ? 'opacity-100' : 'opacity-50',
          )}
        />
      </button>
    </th>
  )
}

export function PickStep({ ctl }: { ctl: AdLauncherController }) {
  const { t } = useI18n()
  const currency = ctl.selectedAccount?.currency ?? 'USD'

  const allChecked = useMemo(
    () =>
      ctl.filteredCampaigns.length > 0 &&
      ctl.filteredCampaigns.every((c) => ctl.selectedIds.has(c.id)),
    [ctl.filteredCampaigns, ctl.selectedIds],
  )
  const someChecked = ctl.selectedIds.size > 0 && !allChecked
  const showSkeleton = ctl.loading && ctl.filteredCampaigns.length === 0

  return (
    <div className="animate-in fade-in slide-in-from-bottom-1 space-y-4 duration-300">
      <header>
        <h2 className="text-lg font-semibold text-text-primary">
          {t('adLauncher.pickTitle', '2. Reklamalarni tanlang')}
        </h2>
        <p className="mt-0.5 text-sm text-text-tertiary">
          {ctl.selectedAccount
            ? t('adLauncher.pickSubtitleWithAccount', 'Hisob: {{name}} — kerakli reklamalarni belgilang.').replace(
                '{{name}}',
                ctl.selectedAccount.name,
              )
            : t('adLauncher.pickSubtitle', 'Kerakli reklamalarni belgilang.')}
        </p>
      </header>

      {/* Search */}
      <div className="flex items-center gap-2 rounded-xl border border-border bg-surface px-3 py-2 shadow-sm transition-colors focus-within:border-primary/60">
        <Search className="h-4 w-4 text-text-tertiary" />
        <input
          value={ctl.search}
          onChange={(e) => ctl.setSearch(e.target.value)}
          placeholder={t('adLauncher.searchPlaceholder', 'Nom yoki ID bo\'yicha qidirish...')}
          className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-text-tertiary"
        />
        {ctl.search && (
          <button
            type="button"
            onClick={() => ctl.setSearch('')}
            className="text-xs text-text-tertiary hover:text-text-primary"
          >
            ×
          </button>
        )}
        <span className="text-xs text-text-tertiary">
          {t('adLauncher.foundCount', '{{n}} ta topildi').replace(
            '{{n}}',
            String(ctl.filteredCampaigns.length),
          )}
        </span>
      </div>

      {/* Table */}
      {showSkeleton ? (
        <TableSkeleton rows={6} />
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-border bg-surface shadow-sm">
          <table className="min-w-[840px] w-full border-collapse text-left text-sm">
            <thead className="border-b border-border bg-surface-2 dark:bg-surface-elevated">
              <tr>
                <th className="w-10 px-3 py-2.5">
                  <input
                    type="checkbox"
                    aria-label={t('adLauncher.selectAll', 'Hammasini tanlash')}
                    checked={allChecked}
                    ref={(el) => {
                      if (el) el.indeterminate = someChecked
                    }}
                    onChange={() => (allChecked ? ctl.clearSelection() : ctl.selectAll())}
                    className="rounded border-border text-primary focus:ring-primary/30"
                  />
                </th>
                <SortableTh ctl={ctl} sortKey="name" label={t('adLauncher.colName', 'Reklama nomi')} />
                <SortableTh ctl={ctl} sortKey="status" label={t('adLauncher.colStatus', 'Holat')} />
                <SortableTh ctl={ctl} sortKey="spend" align="right" label={t('adLauncher.colSpend', 'Sarf')} />
                <SortableTh ctl={ctl} sortKey="clicks" align="right" label={t('adLauncher.colClicks', 'Bosishlar')} />
                <SortableTh ctl={ctl} sortKey="ctr" align="right" label={t('adLauncher.colCtr', 'CTR')} />
                <SortableTh ctl={ctl} sortKey="cpc" align="right" label={t('adLauncher.colCpc', 'CPC')} />
                <SortableTh ctl={ctl} sortKey="aiHealth" label={t('adLauncher.colAiHealth', 'AI baho')} />
              </tr>
            </thead>
            <tbody>
              {ctl.filteredCampaigns.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center">
                    <Inbox className="mx-auto h-10 w-10 text-text-tertiary" />
                    <p className="mt-3 font-medium text-text-primary">
                      {ctl.search.trim() || ctl.statusFilter !== 'ALL'
                        ? t('adLauncher.emptyFiltered', 'Filterga mos reklama topilmadi.')
                        : t('adLauncher.emptyNoData', 'Bu hisobda hali reklama yo\'q.')}
                    </p>
                    <p className="mt-1 text-xs text-text-tertiary">
                      {t('adLauncher.emptyHint', 'Filterlarni o\'zgartiring yoki Meta\'dan sinxronlang.')}
                    </p>
                  </td>
                </tr>
              ) : (
                ctl.filteredCampaigns.map((row) => {
                  const on = ctl.selectedIds.has(row.id)
                  return (
                    <tr
                      key={row.id}
                      className={cn(
                        'cursor-pointer border-b border-border/60 transition-colors last:border-0',
                        on ? 'bg-primary/8' : 'hover:bg-surface-2/80',
                      )}
                      onClick={() => ctl.toggleSelect(row.id)}
                    >
                      <td className="px-3 py-2.5">
                        <input
                          type="checkbox"
                          checked={on}
                          onChange={() => ctl.toggleSelect(row.id)}
                          onClick={(e) => e.stopPropagation()}
                          className="rounded border-border text-primary focus:ring-primary/30"
                          aria-label={row.name}
                        />
                      </td>
                      <td className="px-3 py-2.5">
                        <p className="font-medium text-text-primary">{row.name}</p>
                        <p className="text-xs text-text-tertiary">ID {row.id}</p>
                      </td>
                      <td className="px-3 py-2.5">
                        <span
                          className={cn(
                            'inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold',
                            STATUS_STYLE[row.status] ??
                              'bg-slate-500/12 text-slate-700 dark:text-slate-300',
                          )}
                        >
                          {row.status}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-right tabular-nums text-text-secondary">
                        {fmtMoney(row.spend, currency)}
                      </td>
                      <td className="px-3 py-2.5 text-right tabular-nums text-text-secondary">
                        {fmtNumber(row.clicks)}
                      </td>
                      <td className="px-3 py-2.5 text-right tabular-nums text-text-secondary">
                        {fmtPct(row.ctr)}
                      </td>
                      <td className="px-3 py-2.5 text-right tabular-nums text-text-secondary">
                        {fmtMoney(row.cpc, currency)}
                      </td>
                      <td className="px-3 py-2.5">
                        <span
                          className={cn(
                            'inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold',
                            HEALTH_STYLE[row.aiHealth],
                          )}
                          title={row.aiReason}
                        >
                          {row.aiHealth} · {row.aiAction}
                        </span>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Footer nav */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Button type="button" variant="secondary" size="sm" onClick={() => ctl.goToStep('source')}>
          <ArrowLeft className="h-4 w-4" />
          {t('adLauncher.backToSource', 'Orqaga')}
        </Button>
        <div className="flex items-center gap-3">
          <span className="text-xs text-text-tertiary">
            {t('adLauncher.selectedCount', '{{n}} ta tanlandi').replace(
              '{{n}}',
              String(ctl.selectedIds.size),
            )}
          </span>
          <Button
            type="button"
            size="sm"
            disabled={ctl.selectedIds.size === 0}
            onClick={() => ctl.goToStep('launch')}
          >
            {t('adLauncher.continueToLaunch', 'Ishga tushirishga o\'tish')}
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
