'use client'

import { useEffect } from 'react'
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  History,
  Loader2,
  RefreshCw,
  XCircle,
} from 'lucide-react'
import { useI18n } from '@/i18n/use-i18n'
import { cn } from '@/lib/utils'
import type { AdLauncherController } from '../_lib/use-ad-launcher'
import type { HistoryItem } from '../_lib/types'

const STATUS_META: Record<string, { Icon: typeof Clock; cls: string }> = {
  launched: { Icon: CheckCircle2, cls: 'text-emerald-600 dark:text-emerald-400' },
  validated: { Icon: Clock, cls: 'text-sky-600 dark:text-sky-400' },
  draft: { Icon: Clock, cls: 'text-text-tertiary' },
  launching: { Icon: Loader2, cls: 'text-sky-600 dark:text-sky-400 animate-spin' },
  failed: { Icon: XCircle, cls: 'text-rose-600 dark:text-rose-400' },
}

function timeAgo(iso: string, t: (key: string, fallback?: string) => string): string {
  const ts = new Date(iso).getTime()
  if (!isFinite(ts)) return '—'
  const diff = Date.now() - ts
  const min = Math.floor(diff / 60000)
  if (min < 1) return t('adLauncher.justNow', 'hozirgina')
  if (min < 60) return `${min}m`
  const hr = Math.floor(min / 60)
  if (hr < 24) return `${hr}h`
  const day = Math.floor(hr / 24)
  return `${day}d`
}

function objectiveShort(o: string): string {
  return o.replace(/^OUTCOME_/, '').toLowerCase()
}

export function LaunchHistory({ ctl }: { ctl: AdLauncherController }) {
  const { t } = useI18n()

  const { loadHistory, workspaceId, isDemoMode } = ctl
  useEffect(() => {
    loadHistory()
  }, [loadHistory, workspaceId, isDemoMode])

  return (
    <section className="rounded-2xl border border-border bg-surface shadow-sm">
      <header className="flex items-center justify-between border-b border-border px-4 py-2.5">
        <h3 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-text-secondary">
          <History className="h-3.5 w-3.5 opacity-70" />
          {t('adLauncher.historyTitle', 'So\'nggi launch\'lar')}
        </h3>
        <button
          type="button"
          onClick={() => ctl.loadHistory()}
          className="rounded p-1 text-text-tertiary transition-colors hover:bg-surface-2 hover:text-text-primary"
          aria-label={t('adLauncher.historyRefresh', 'Yangilash')}
        >
          {ctl.historyLoading ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <RefreshCw className="h-3.5 w-3.5" />
          )}
        </button>
      </header>

      <ul className="divide-y divide-border/60">
        {ctl.historyLoading && ctl.history.length === 0 ? (
          Array.from({ length: 3 }).map((_, i) => (
            <li key={i} className="flex items-center gap-3 px-4 py-2.5">
              <div className="h-4 w-4 animate-pulse rounded-full bg-border/70" />
              <div className="flex-1 space-y-1">
                <div className="h-3 w-2/3 animate-pulse rounded bg-border/70" />
                <div className="h-2.5 w-1/3 animate-pulse rounded bg-border/50" />
              </div>
            </li>
          ))
        ) : ctl.history.length === 0 ? (
          <li className="px-4 py-6 text-center text-xs text-text-tertiary">
            {t('adLauncher.historyEmpty', 'Hali launch yo\'q.')}
          </li>
        ) : (
          ctl.history.slice(0, 5).map((h: HistoryItem) => {
            const meta = STATUS_META[h.status] ?? STATUS_META.draft
            const Icon = meta.Icon
            return (
              <li key={h.id} className="flex items-start gap-3 px-4 py-2.5 text-xs">
                <Icon className={cn('mt-0.5 h-4 w-4 shrink-0', meta.cls)} />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-text-primary">
                    {objectiveShort(h.objective)} · {h.budgetType}
                  </p>
                  {h.status === 'failed' ? (
                    <p className="truncate text-text-tertiary">
                      <span className="inline-flex items-center gap-1 text-rose-600 dark:text-rose-400">
                        <AlertCircle className="h-3 w-3" />
                        {h.error ?? t('adLauncher.historyFailed', 'Failed')}
                      </span>
                    </p>
                  ) : (
                    <>
                      <p className="truncate text-text-tertiary">
                        {h.audiences.length} {t('adLauncher.historyAuds', 'auditoriya')} ·{' '}
                        {timeAgo(h.createdAt, t)}
                      </p>
                      {h.status === 'launched' && (h.adSetCount != null || h.adCount != null) && (
                        <p className="mt-0.5 truncate text-[10px] text-text-tertiary">
                          {h.adSetCount ?? 0} adset · {h.adCount ?? 0} reklama
                          {h.metaCampaignId && (
                            <a
                              href={`https://business.facebook.com/adsmanager/manage/campaigns?selected_campaign_ids=${encodeURIComponent(h.metaCampaignId)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="ml-1.5 text-brand-mid hover:underline dark:text-brand-lime"
                              onClick={(e) => e.stopPropagation()}
                            >
                              ↗ Meta
                            </a>
                          )}
                        </p>
                      )}
                    </>
                  )}
                </div>
              </li>
            )
          })
        )}
      </ul>
    </section>
  )
}
