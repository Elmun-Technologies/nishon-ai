'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useWorkspaceStore } from '@/stores/workspace.store'
import { useI18n } from '@/i18n/use-i18n'
import { Store, ChevronDown } from 'lucide-react'

const TABS = [
  { href: '/settings/workspace/ad-accounts', labelKey: 'workspaceSettings.tabs.adAccounts', fallback: 'Ad accounts' },
  { href: '/settings/workspace/products', labelKey: 'workspaceSettings.tabs.products', fallback: 'Products & Usage' },
  { href: '/settings/workspace/payments', labelKey: 'workspaceSettings.tabs.payments', fallback: 'Payments' },
  { href: '/settings/workspace/profile', labelKey: 'workspaceSettings.tabs.profile', fallback: 'User Profile' },
  { href: '/settings/workspace/language', labelKey: 'workspaceSettings.tabs.language', fallback: 'Language' },
  { href: '/settings/workspace/team', labelKey: 'workspaceSettings.tabs.team', fallback: 'Team Members' },
  { href: '/settings/workspace/mcp', labelKey: 'workspaceSettings.tabs.mcp', fallback: 'MCP Integration' },
  { href: '/settings/workspace/help', labelKey: 'workspaceSettings.tabs.help', fallback: 'Resource Center' },
]

export default function WorkspaceSettingsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { currentWorkspace } = useWorkspaceStore()
  const { t } = useI18n()

  return (
    <div className="mx-auto max-w-6xl pb-16">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-widest text-emerald-600 dark:text-emerald-400">
            {t('workspaceSettings.title', 'Workspace settings')}
          </p>
          <div className="mt-1.5 flex flex-wrap items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-text-primary">
              {t('workspaceSettings.title', 'Workspace settings')}
            </h1>
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-lg border border-border bg-white px-3 py-1.5 text-sm font-medium text-text-primary shadow-sm transition-colors hover:bg-surface-2 dark:bg-slate-900 dark:hover:bg-slate-800"
              aria-label={t('workspaceSettings.workspace', 'Workspace')}
            >
              <Store className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              <span className="max-w-[180px] truncate">{currentWorkspace?.name ?? t('workspaceSettings.workspace', 'Workspace')}</span>
              <ChevronDown className="h-3.5 w-3.5 text-text-tertiary" />
            </button>
          </div>
          <p className="mt-1.5 max-w-2xl text-sm text-text-tertiary">
            {t(
              'workspaceSettings.shellSubtitle',
              'Ad accounts, subscription, payments, profile, team, and MCP — in one place.',
            )}
          </p>
        </div>

        <Link
          href="/settings"
          className="mt-0.5 shrink-0 inline-flex items-center gap-1 rounded-lg border border-border bg-white px-3 py-2 text-sm font-medium text-text-secondary shadow-sm transition-colors hover:bg-surface-2 dark:bg-slate-900"
        >
          + {t('workspaceSettings.classicSettings', 'Classic settings')}
        </Link>
      </div>

      <nav
        className="mt-6 flex overflow-x-auto border-b border-border scrollbar-none"
        aria-label="Workspace settings tabs"
      >
        {TABS.map((tab) => {
          const active =
            pathname === tab.href ||
            (tab.href === '/settings/workspace/ad-accounts' && pathname === '/settings/workspace')
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={[
                'shrink-0 whitespace-nowrap border-b-2 px-4 py-3 text-sm font-medium transition-colors',
                active
                  ? 'border-emerald-500 text-text-primary'
                  : 'border-transparent text-text-tertiary hover:text-text-secondary',
              ].join(' ')}
            >
              {t(tab.labelKey, tab.fallback)}
            </Link>
          )
        })}
      </nav>

      <div className="mt-8">{children}</div>
    </div>
  )
}
