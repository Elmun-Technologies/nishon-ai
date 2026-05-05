'use client'

import { Trash2, X } from 'lucide-react'
import { useI18n } from '@/i18n/use-i18n'
import { Button } from '@/components/ui'
import type { AdLauncherController } from '../_lib/use-ad-launcher'

/**
 * Sticky right-rail tray. Always visible across all 3 steps so the user
 * can see their selection at a glance and remove items without losing context.
 */
export function SelectionTray({ ctl }: { ctl: AdLauncherController }) {
  const { t } = useI18n()
  const items = ctl.selectedCampaigns

  return (
    <aside className="sticky top-4 flex w-full flex-col overflow-hidden rounded-2xl border border-border bg-surface shadow-sm lg:w-80">
      <header className="flex items-center justify-between border-b border-border bg-surface-2 px-3 py-2.5 dark:bg-surface-elevated">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-text-primary">
          {t('adLauncher.trayTitle', 'Tanlangan')}
        </h3>
        <span className="rounded-full bg-primary/15 px-2 py-0.5 text-xs font-semibold text-primary">
          {items.length}
        </span>
      </header>

      <div className="flex-1 overflow-y-auto p-3">
        {items.length === 0 ? (
          <div className="py-8 text-center">
            <p className="text-sm font-medium text-text-secondary">
              {t('adLauncher.trayEmptyTitle', 'Hech narsa tanlanmagan')}
            </p>
            <p className="mt-1 text-xs text-text-tertiary">
              {t(
                'adLauncher.trayEmptyHint',
                'Reklama tanlash qadamida belgilangan reklamalar shu yerda ko\'rinadi.',
              )}
            </p>
          </div>
        ) : (
          <ul className="space-y-2">
            {items.map((c) => (
              <li
                key={c.id}
                className="flex items-start justify-between gap-2 rounded-lg border border-border bg-surface-2 px-2 py-2 text-xs dark:bg-surface"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium text-text-primary">{c.name}</p>
                  <p className="text-text-tertiary">
                    {c.status} · ID {c.id}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => ctl.toggleSelect(c.id)}
                  className="shrink-0 rounded p-1 text-text-tertiary hover:bg-surface hover:text-text-primary"
                  aria-label={t('adLauncher.remove', 'O\'chirish')}
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {items.length > 0 && (
        <footer className="border-t border-border p-3">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            fullWidth
            onClick={ctl.clearSelection}
          >
            <Trash2 className="h-3.5 w-3.5" />
            {t('adLauncher.clearAll', 'Hammasini tozalash')}
          </Button>
        </footer>
      )}
    </aside>
  )
}
