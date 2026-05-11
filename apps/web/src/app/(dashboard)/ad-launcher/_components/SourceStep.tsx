'use client'

import Link from 'next/link'
import { useEffect } from 'react'
import {
  AlertCircle,
  ArrowRight,
  Loader2,
  PlugZap,
  RefreshCw,
} from 'lucide-react'
import { Button, Alert } from '@/components/ui'
import { useI18n } from '@/i18n/use-i18n'
import { cn } from '@/lib/utils'
import type { AdLauncherController } from '../_lib/use-ad-launcher'
import type { DateRangeId, StatusFilter } from '../_lib/types'

const RANGE_OPTIONS: { id: DateRangeId; labelKey: string; fallback: string }[] = [
  { id: '7d', labelKey: 'adLauncher.range7d', fallback: '7 kun' },
  { id: '30d', labelKey: 'adLauncher.range30d', fallback: '30 kun' },
  { id: '90d', labelKey: 'adLauncher.range90d', fallback: '90 kun' },
]

const STATUS_OPTIONS: { id: StatusFilter; labelKey: string; fallback: string }[] = [
  { id: 'ALL', labelKey: 'adLauncher.statusAll', fallback: 'Hammasi' },
  { id: 'ACTIVE', labelKey: 'adLauncher.statusActive', fallback: 'Faol' },
  { id: 'PAUSED', labelKey: 'adLauncher.statusPaused', fallback: 'To\'xtatilgan' },
]

/** Maps an internal error code into a localized human message. */
function errorMessage(code: string, t: (key: string, fallback?: string) => string): string {
  switch (code) {
    case 'NO_WORKSPACE':
      return t('adLauncher.errNoWorkspace', 'Workspace topilmadi. Qaytadan login qiling.')
    case 'LOAD_FAILED':
      return t('adLauncher.errLoadFailed', 'Ma\'lumot yuklanmadi. Internet aloqasini tekshiring.')
    case 'SYNC_FAILED':
      return t('adLauncher.errSyncFailed', 'Meta\'dan sinxronlash bajarilmadi.')
    default:
      return code || t('adLauncher.errGeneric', 'Kutilmagan xato.')
  }
}

export function SourceStep({ ctl }: { ctl: AdLauncherController }) {
  const { t } = useI18n()

  const { loadData, hasLoaded, loading, workspaceId, isDemoMode } = ctl
  useEffect(() => {
    if (!hasLoaded && !loading) loadData()
  }, [loadData, hasLoaded, loading, workspaceId, isDemoMode])

  const noWorkspace = !ctl.workspaceId && !ctl.isDemoMode
  const noAccounts =
    ctl.hasLoaded && !ctl.loading && ctl.accounts.length === 0 && !ctl.loadError
  const canContinue = !!ctl.accountId && ctl.accounts.length > 0

  return (
    <div className="animate-in fade-in slide-in-from-bottom-1 space-y-4 duration-300">
      <header>
        <h2 className="text-lg font-semibold text-text-primary">
          {t('adLauncher.sourceTitle', '1. Manbani tanlang')}
        </h2>
        <p className="mt-0.5 text-sm text-text-tertiary">
          {t(
            'adLauncher.sourceSubtitle',
            'Meta hisobi, davr va holat — keyingi qadamda shu mezon bo\'yicha reklamalar ro\'yxati ko\'rsatiladi.',
          )}
        </p>
      </header>

      {noWorkspace && (
        <Alert variant="warning">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{t('adLauncher.noWorkspace', 'Workspace topilmadi. Iltimos, qaytadan login qiling.')}</span>
          </div>
        </Alert>
      )}

      {ctl.loadError && (
        <Alert variant="error">
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span className="flex-1">{errorMessage(ctl.loadError, t)}</span>
            <Button size="sm" variant="ghost" onClick={ctl.loadData}>
              {t('common.retry', 'Qayta urinish')}
            </Button>
          </div>
        </Alert>
      )}

      <div className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
        <div className="grid gap-4 md:grid-cols-3">
          {/* Account picker */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wide text-text-tertiary">
              {t('adLauncher.metaAccount', 'Meta reklama hisobi')}
            </label>
            {ctl.loading && ctl.accounts.length === 0 ? (
              <div className="flex h-10 items-center gap-2 rounded-lg border border-border bg-surface-2 px-3 text-sm text-text-tertiary">
                <Loader2 className="h-4 w-4 animate-spin" />
                {t('adLauncher.loadingAccounts', 'Hisoblar yuklanmoqda...')}
              </div>
            ) : ctl.accounts.length === 0 ? (
              <p className="flex h-10 items-center text-sm text-text-tertiary">
                {t('adLauncher.noAccountsShort', 'Ulangan hisob yo\'q.')}
              </p>
            ) : (
              <select
                value={ctl.accountId}
                onChange={(e) => ctl.setAccountId(e.target.value)}
                className="h-10 w-full rounded-lg border border-border bg-surface-2 px-3 text-sm transition-colors focus:border-primary/60 focus:outline-none dark:bg-surface"
              >
                {ctl.accounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name} ({a.campaignCount})
                  </option>
                ))}
              </select>
            )}
            {ctl.selectedAccount && (
              <p className="text-xs text-text-tertiary">
                ID {ctl.selectedAccount.id}
                {ctl.selectedAccount.currency ? ` · ${ctl.selectedAccount.currency}` : ''}
              </p>
            )}
          </div>

          {/* Date range */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wide text-text-tertiary">
              {t('adLauncher.dateRange', 'Davr')}
            </label>
            <div className="flex gap-1 rounded-lg border border-border bg-surface-2 p-1 dark:bg-surface">
              {RANGE_OPTIONS.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => ctl.setDateRange(r.id)}
                  className={cn(
                    'flex-1 rounded-md px-2 py-1.5 text-xs font-medium transition-colors',
                    ctl.dateRange === r.id
                      ? 'bg-primary text-brand-ink shadow-sm'
                      : 'text-text-secondary hover:bg-surface',
                  )}
                >
                  {t(r.labelKey, r.fallback)}
                </button>
              ))}
            </div>
            <p className="text-xs text-text-tertiary">
              {t('adLauncher.dateRangeHint', 'Metrikalar shu davr uchun ko\'rsatiladi.')}
            </p>
          </div>

          {/* Status filter */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wide text-text-tertiary">
              {t('adLauncher.status', 'Holat')}
            </label>
            <div className="flex gap-1 rounded-lg border border-border bg-surface-2 p-1 dark:bg-surface">
              {STATUS_OPTIONS.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => ctl.setStatusFilter(s.id)}
                  className={cn(
                    'flex-1 rounded-md px-2 py-1.5 text-xs font-medium transition-colors',
                    ctl.statusFilter === s.id
                      ? 'bg-primary text-brand-ink shadow-sm'
                      : 'text-text-secondary hover:bg-surface',
                  )}
                >
                  {t(s.labelKey, s.fallback)}
                </button>
              ))}
            </div>
            <p className="text-xs text-text-tertiary">
              {t('adLauncher.statusHint', 'Yetkazib berish holati bo\'yicha filterlash.')}
            </p>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={ctl.triggerSync}
            disabled={ctl.syncing || (!ctl.workspaceId && !ctl.isDemoMode)}
          >
            {ctl.syncing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            {ctl.syncing
              ? t('adLauncher.syncing', 'Sinxronlanmoqda...')
              : t('adLauncher.syncNow', 'Meta\'dan yangilash')}
          </Button>

          <Button
            type="button"
            size="sm"
            disabled={!canContinue}
            onClick={() => ctl.goToStep('pick')}
          >
            {t('adLauncher.continueToPick', 'Reklama tanlashga o\'tish')}
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {noAccounts && !ctl.isDemoMode && (
        <div className="rounded-2xl border border-dashed border-border bg-surface-2/40 p-6 text-center">
          <PlugZap className="mx-auto h-10 w-10 text-text-tertiary" />
          <h3 className="mt-3 font-semibold text-text-primary">
            {t('adLauncher.connectMetaTitle', 'Meta hali ulanmagan')}
          </h3>
          <p className="mx-auto mt-1 max-w-md text-sm text-text-tertiary">
            {t(
              'adLauncher.connectMetaBody',
              'Reklama hisobini ulang yoki Meta\'dan ma\'lumotlarni sinxronlang. Shundan so\'ng bu yerda real reklamalar paydo bo\'ladi.',
            )}
          </p>
          <div className="mt-4 flex justify-center gap-2">
            <Link href="/settings">
              <Button size="sm">{t('adLauncher.connectMetaCta', 'Meta\'ni ulash')}</Button>
            </Link>
            <Button size="sm" variant="secondary" onClick={ctl.triggerSync}>
              {t('adLauncher.syncNow', 'Meta\'dan yangilash')}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
