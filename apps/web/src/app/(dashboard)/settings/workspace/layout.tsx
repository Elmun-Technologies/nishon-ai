'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useWorkspaceStore } from '@/stores/workspace.store'
import { useI18n } from '@/i18n/use-i18n'
import {
  LayoutGrid,
  Package,
  CreditCard,
  User,
  Globe,
  Users,
  Plug,
  BookOpen,
  Building2,
  ArrowLeft,
} from 'lucide-react'

const NAV_ITEMS = [
  { href: '/settings/workspace/ad-accounts', icon: LayoutGrid, labelKey: 'workspaceSettings.tabs.adAccounts', fallback: 'Ad accounts' },
  { href: '/settings/workspace/products', icon: Package, labelKey: 'workspaceSettings.tabs.products', fallback: 'Products & Usage' },
  { href: '/settings/workspace/payments', icon: CreditCard, labelKey: 'workspaceSettings.tabs.payments', fallback: 'Payments' },
  { href: '/settings/workspace/profile', icon: User, labelKey: 'workspaceSettings.tabs.profile', fallback: 'User Profile' },
  { href: '/settings/workspace/language', icon: Globe, labelKey: 'workspaceSettings.tabs.language', fallback: 'Language' },
  { href: '/settings/workspace/team', icon: Users, labelKey: 'workspaceSettings.tabs.team', fallback: 'Team Members' },
  { href: '/settings/workspace/mcp', icon: Plug, labelKey: 'workspaceSettings.tabs.mcp', fallback: 'MCP Integration' },
  { href: '/settings/workspace/help', icon: BookOpen, labelKey: 'workspaceSettings.tabs.help', fallback: 'Resource Center' },
]

function isActive(pathname: string, href: string) {
  return pathname === href || (href === '/settings/workspace/ad-accounts' && pathname === '/settings/workspace')
}

export default function WorkspaceSettingsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { currentWorkspace } = useWorkspaceStore()
  const { t } = useI18n()

  return (
    <div className="min-h-screen">
      {/* Top header bar */}
      <div className="border-b border-border/70 bg-surface/95 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-text-tertiary">
                {t('workspaceSettings.title', 'Workspace settings')}
              </p>
              <h1 className="mt-0.5 text-xl font-bold tracking-tight text-text-primary">
                {t('workspaceSettings.title', 'Workspace settings')}
              </h1>
              <p className="mt-0.5 hidden text-xs text-text-tertiary sm:block">
                {t('workspaceSettings.shellSubtitle', 'Ad accounts, subscription, payments, profile, team, and MCP — in one place.')}
              </p>
            </div>
            <Link
              href="/settings"
              className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-border bg-surface px-3 py-2 text-xs font-medium text-text-secondary transition-colors hover:bg-surface-2 hover:text-text-primary"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              {t('workspaceSettings.classicSettings', 'Classic settings')}
            </Link>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex gap-0 lg:gap-10">
          {/* ── Sidebar (desktop) ─────────────────────────────── */}
          <aside className="hidden w-56 shrink-0 py-8 lg:block">
            {/* Workspace pill */}
            <div className="mb-5 flex items-center gap-3 rounded-2xl border border-border/70 bg-surface p-3 shadow-sm">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-lime/20 text-brand-ink dark:text-brand-lime">
                <Building2 className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-text-primary">
                  {currentWorkspace?.name ?? t('workspaceSettings.workspace', 'Workspace')}
                </p>
                <p className="text-[11px] text-text-tertiary">Workspace</p>
              </div>
            </div>

            {/* Nav */}
            <nav className="space-y-0.5" aria-label="Workspace settings navigation">
              {NAV_ITEMS.map((item) => {
                const active = isActive(pathname, item.href)
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
                      active
                        ? 'bg-brand-lime/15 text-brand-ink shadow-sm dark:bg-brand-lime/10 dark:text-brand-lime'
                        : 'text-text-tertiary hover:bg-surface-2 hover:text-text-primary'
                    }`}
                  >
                    <item.icon
                      className={`h-4 w-4 shrink-0 ${
                        active ? 'text-brand-mid dark:text-brand-lime' : 'text-text-tertiary'
                      }`}
                    />
                    {t(item.labelKey, item.fallback)}
                  </Link>
                )
              })}
            </nav>
          </aside>

          {/* ── Main content ───────────────────────────────────── */}
          <main className="min-w-0 flex-1 py-6 pb-16 lg:py-8">
            {/* Mobile nav — horizontal scrollable tabs */}
            <nav
              className="-mx-4 mb-6 flex gap-0 overflow-x-auto border-b border-border/70 px-4 scrollbar-thin sm:-mx-6 sm:px-6 lg:hidden"
              aria-label="Workspace settings tabs"
            >
              {NAV_ITEMS.map((item) => {
                const active = isActive(pathname, item.href)
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex shrink-0 items-center gap-1.5 whitespace-nowrap border-b-2 px-3 py-3 text-sm font-medium transition-colors ${
                      active
                        ? 'border-brand-mid text-brand-ink dark:border-brand-lime dark:text-brand-lime'
                        : 'border-transparent text-text-tertiary hover:text-text-secondary'
                    }`}
                  >
                    <item.icon className="h-3.5 w-3.5" />
                    {t(item.labelKey, item.fallback)}
                  </Link>
                )
              })}
            </nav>

            {children}
          </main>
        </div>
      </div>
    </div>
  )
}
