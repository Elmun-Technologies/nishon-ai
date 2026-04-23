'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useRef, useState, useEffect } from 'react'
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
  ChevronDown,
  Check,
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

function WorkspaceSwitcher() {
  const { currentWorkspace, workspaces, setCurrentWorkspace } = useWorkspaceStore()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  const name = currentWorkspace?.name ?? 'Workspace'

  if (workspaces.length <= 1) {
    return (
      <div className="flex items-center gap-2.5 rounded-2xl border border-border/70 bg-surface p-3 shadow-sm">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-brand-lime/20 text-brand-ink dark:text-brand-lime">
          <Building2 className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-text-primary">{name}</p>
          <p className="text-[11px] text-text-tertiary">Workspace</p>
        </div>
      </div>
    )
  }

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="listbox"
        className="flex w-full items-center gap-2.5 rounded-2xl border border-border/70 bg-surface p-3 shadow-sm transition-colors hover:bg-surface-2"
      >
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-brand-lime/20 text-brand-ink dark:text-brand-lime">
          <Building2 className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1 text-left">
          <p className="truncate text-sm font-semibold text-text-primary">{name}</p>
          <p className="text-[11px] text-text-tertiary">Workspace</p>
        </div>
        <ChevronDown className={`h-3.5 w-3.5 shrink-0 text-text-tertiary transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div
          role="listbox"
          className="absolute left-0 right-0 top-full z-50 mt-1 overflow-hidden rounded-xl border border-border bg-surface shadow-lg"
        >
          {workspaces.map((ws) => (
            <button
              key={ws.id}
              type="button"
              role="option"
              aria-selected={ws.id === currentWorkspace?.id}
              onClick={() => { setCurrentWorkspace(ws); setOpen(false) }}
              className="flex w-full items-center gap-2.5 px-3 py-2.5 text-left text-sm transition-colors hover:bg-surface-2"
            >
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-brand-lime/15 text-[10px] font-bold text-brand-ink dark:text-brand-lime">
                {ws.name.charAt(0).toUpperCase()}
              </div>
              <span className="min-w-0 flex-1 truncate text-text-primary">{ws.name}</span>
              {ws.id === currentWorkspace?.id && (
                <Check className="h-3.5 w-3.5 shrink-0 text-brand-mid dark:text-brand-lime" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default function WorkspaceSettingsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { t } = useI18n()

  return (
    <div className="min-h-screen">
      {/* Top header */}
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

          {/* ── Sidebar (desktop) — sticky ─────────────────── */}
          <aside className="hidden w-56 shrink-0 py-8 lg:block">
            <div className="sticky top-6">
              <WorkspaceSwitcher />

              {/* Nav */}
              <nav className="mt-4 space-y-0.5" aria-label="Workspace settings navigation">
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
            </div>
          </aside>

          {/* ── Main content ─────────────────────────────── */}
          <main className="min-w-0 flex-1 py-6 pb-16 lg:py-8">
            {/* Mobile nav */}
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
