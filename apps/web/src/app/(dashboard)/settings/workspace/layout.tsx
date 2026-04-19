'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useWorkspaceStore } from '@/stores/workspace.store'
import { useI18n } from '@/i18n/use-i18n'
import { Building2, ChevronDown } from 'lucide-react'

const TAB_KEYS: { href: string; labelKey: string; fallback: string }[] = [
  { href: '/settings/workspace/ad-accounts', labelKey: 'workspaceSettings.tabs.adAccounts', fallback: 'Ad accounts' },
  { href: '/settings/workspace/products', labelKey: 'workspaceSettings.tabs.products', fallback: 'Products & Usage' },
  { href: '/settings/workspace/payments', labelKey: 'workspaceSettings.tabs.payments', fallback: 'Payments' },
  { href: '/settings/workspace/profile', labelKey: 'workspaceSettings.tabs.profile', fallback: 'User Profile' },
  { href: '/settings/workspace/language', labelKey: 'workspaceSettings.tabs.language', fallback: 'Language' },
  { href: '/settings/workspace/team', labelKey: 'workspaceSettings.tabs.team', fallback: 'Team Members' },
  { href: '/settings/workspace/mcp', labelKey: 'workspaceSettings.tabs.mcp', fallback: 'MCP Integration' },
  { href: '/settings/workspace/help', labelKey: 'workspaceSettings.tabs.help', fallback: 'Resource Center' },
]

export default function WorkspaceSettingsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const { currentWorkspace } = useWorkspaceStore()
  const { t } = useI18n()

  return (
    <div className="max-w-6xl mx-auto pb-12">
      <div className="mb-2 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-violet-600 dark:text-violet-400">
            {t('workspaceSettings.title', 'Workspace settings')}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-text-primary sm:text-[1.65rem]">
              {t('workspaceSettings.title', 'Workspace settings')}
            </h1>
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-xl border border-border bg-white/90 px-3 py-2 text-sm font-medium text-text-primary shadow-sm backdrop-blur dark:bg-slate-900/80"
              aria-haspopup="listbox"
              aria-label={t('workspaceSettings.workspace', 'Workspace')}
            >
              <Building2 className="h-4 w-4 text-violet-500" />
              <span className="max-w-[200px] truncate">{currentWorkspace?.name ?? t('workspaceSettings.workspace', 'Workspace')}</span>
              <ChevronDown className="h-4 w-4 text-text-tertiary" />
            </button>
          </div>
          <p className="mt-2 max-w-2xl text-sm text-text-tertiary">
            {t(
              'workspaceSettings.shellSubtitle',
              'Ad accounts, subscription, payments, profile, team, and MCP — in one place.',
            )}
          </p>
        </div>
        <Link
          href="/settings"
          className="shrink-0 self-start rounded-xl border border-border bg-surface px-3 py-2 text-sm text-text-secondary transition-colors hover:bg-surface-2 hover:text-text-primary"
        >
          ← {t('workspaceSettings.classicSettings', 'Classic settings')}
        </Link>
      </div>

      <nav
        className="-mx-1 mb-8 flex gap-1 overflow-x-auto border-b border-border/80 pb-px scrollbar-thin"
        aria-label="Workspace settings tabs"
      >
        {TAB_KEYS.map((tab) => {
          const active =
            pathname === tab.href ||
            (tab.href === '/settings/workspace/ad-accounts' && pathname === '/settings/workspace')
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`
                shrink-0 whitespace-nowrap border-b-2 px-3 py-2.5 text-sm font-medium transition-colors
                ${
                  active
                    ? 'border-violet-600 text-violet-700 dark:border-violet-400 dark:text-violet-300'
                    : 'border-transparent text-text-tertiary hover:text-text-secondary'
                }
              `}
            >
              {t(tab.labelKey, tab.fallback)}
            </Link>
          )
        })}
      </nav>

      {children}
    </div>
  )
}
