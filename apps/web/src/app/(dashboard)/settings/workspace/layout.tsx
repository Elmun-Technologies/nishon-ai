'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useWorkspaceStore } from '@/stores/workspace.store'
import { ChevronDown } from 'lucide-react'
import { useI18n } from '@/i18n/use-i18n'

const TAB_KEYS: { href: string; labelKey: string; fallback: string }[] = [
  { href: '/settings/workspace/ad-accounts', labelKey: 'workspaceSettings.tabs.adAccounts', fallback: 'Ad accounts' },
  { href: '/settings/workspace/products', labelKey: 'workspaceSettings.tabs.products', fallback: 'Products & Usage' },
  { href: '/settings/workspace/payments', labelKey: 'workspaceSettings.tabs.payments', fallback: 'Payments' },
  { href: '/settings/workspace/profile', labelKey: 'workspaceSettings.tabs.profile', fallback: 'User Profile' },
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
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-violet-400/90">
            {t('workspaceSettings.title', 'Workspace settings')}
          </p>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold text-text-primary">{t('workspaceSettings.workspace', 'Workspace')}</h1>
            <span className="inline-flex items-center gap-1 rounded-lg border border-border bg-surface-2 px-2.5 py-1 text-sm text-text-secondary">
              {currentWorkspace?.name ?? 'Workspace tanlanmagan'}
              <ChevronDown className="h-4 w-4 opacity-50" aria-hidden />
            </span>
          </div>
          <p className="mt-2 max-w-2xl text-sm text-text-tertiary">
            Madgicx uslubidagi markaz: Meta accountlar, obuna va limitlar, to'lov, profil, jamoa va AI agentlar uchun MCP.
          </p>
        </div>
        <Link
          href="/settings"
          className="shrink-0 self-start rounded-xl border border-border px-3 py-2 text-sm text-text-secondary transition-colors hover:bg-surface-2 hover:text-text-primary"
        >
          ← {t('workspaceSettings.classicSettings', 'Classic settings')}
        </Link>
      </div>

      <nav
        className="-mx-1 mb-8 flex gap-0.5 overflow-x-auto border-b border-border pb-px scrollbar-thin"
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
                    ? 'border-violet-500 text-text-primary'
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
