'use client'

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useWorkspaceStore } from '@/stores/workspace.store'
import { useI18n } from '@/i18n/use-i18n'
import {
  LayoutGrid,
  Rocket,
  Zap,
  BarChart3,
  Brain,
  Wallet,
  Settings2,
  LogOut,
  Users,
  Sparkles,
  TrendingUp,
  ShoppingBag,
  ChevronDown,
  Palette,
  Wand2,
  Users2,
  Folder,
  Palette as PaletteIcon,
  Package,
  Image,
  RefreshCcw,
  Workflow,
  Bot,
  Compass,
  Clapperboard,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const STORAGE_KEY = 'adspectr-sidebar-mode'

/** True if `pathname` is exactly `href` or a deeper segment under `href` (avoids `/auto` matching `/automation`). */
function navPathMatches(pathname: string, href: string): boolean {
  if (!pathname || !href) return false
  if (pathname === href) return true
  return pathname.startsWith(`${href}/`)
}

function activeNavHref(pathname: string): string | null {
  const items = CATEGORIES.flatMap((c) => c.items)
  const matches = items.filter((i) => navPathMatches(pathname, i.href))
  if (matches.length === 0) return null
  return matches.reduce((a, b) => (a.href.length >= b.href.length ? a : b)).href
}

const CATEGORIES: Array<{
  id: string
  labelKey: string
  fallback: string
  icon: typeof Rocket
  items: Array<{ href: string; labelKey: string; fallback: string; icon: typeof Rocket; badge?: boolean }>
}> = [
  {
    id: 'marketing',
    labelKey: 'navigation.marketing',
    fallback: 'Marketing',
    icon: Rocket,
    items: [
      { href: '/launch', labelKey: 'navigation.launch', fallback: 'Launch', icon: Rocket },
      { href: '/campaigns', labelKey: 'navigation.campaigns', fallback: 'Campaigns', icon: Zap },
      { href: '/marketplace/search', labelKey: 'navigation.marketplace', fallback: 'Marketplace', icon: ShoppingBag },
      { href: '/audiences', labelKey: 'navigation.audiences', fallback: 'Audiences', icon: Users },
      { href: '/ad-launcher', labelKey: 'navigation.adLauncher', fallback: 'Ad Launcher', icon: Clapperboard },
    ],
  },
  {
    id: 'analytics',
    labelKey: 'navigation.analytics',
    fallback: 'Analytics',
    icon: BarChart3,
    items: [
      { href: '/dashboard', labelKey: 'navigation.dashboard', fallback: 'Dashboard', icon: LayoutGrid },
      { href: '/reporting', labelKey: 'navigation.reporting', fallback: 'Reporting', icon: BarChart3 },
      { href: '/meta-audit', labelKey: 'navigation.metaAudit', fallback: 'Meta Audit', icon: Compass },
      { href: '/ai-decisions', labelKey: 'navigation.aiDecisions', fallback: 'AI Decisions', icon: Brain, badge: true },
      { href: '/performance', labelKey: 'navigation.performance', fallback: 'Performance', icon: TrendingUp },
    ],
  },
  {
    id: 'optimization',
    labelKey: 'navigation.optimization',
    fallback: 'Optimization',
    icon: Settings2,
    items: [
      { href: '/budget', labelKey: 'navigation.budget', fallback: 'Budget', icon: Wallet },
      { href: '/auto-optimization', labelKey: 'navigation.autoOptimization', fallback: 'Auto Optimization', icon: Settings2 },
      { href: '/roi-calculator', labelKey: 'navigation.roi', fallback: 'ROI & outcomes', icon: BarChart3 },
      { href: '/automation', labelKey: 'navigation.automation', fallback: 'Automation', icon: Workflow },
    ],
  },
  {
    id: 'tools',
    labelKey: 'navigation.tools',
    fallback: 'Tools & Resources',
    icon: Sparkles,
    items: [
      { href: '/retargeting', labelKey: 'navigation.retargeting', fallback: 'Retargeting', icon: RefreshCcw },
      { href: '/creative-scorer', labelKey: 'navigation.creativeScorer', fallback: 'Creative Scorer', icon: Sparkles },
      { href: '/competitors', labelKey: 'navigation.competitors', fallback: 'Competitors', icon: Users },
      { href: '/landing-page', labelKey: 'navigation.landingPage', fallback: 'Landing Page', icon: TrendingUp },
      { href: '/my-portfolio', labelKey: 'navigation.portfolio', fallback: 'Portfolio', icon: TrendingUp },
      { href: '/create-agent', labelKey: 'navigation.aiAssistant', fallback: 'AI Assistant', icon: Bot },
    ],
  },
  {
    id: 'creative',
    labelKey: 'navigation.creative',
    fallback: 'Creative',
    icon: Wand2,
    items: [
      { href: '/creative-hub', labelKey: 'navigation.creativeHub', fallback: 'Creative Hub', icon: Palette },
      { href: '/creative-hub/ai-actors', labelKey: 'navigation.aiActors', fallback: 'AI Actors', icon: Users2 },
      { href: '/creative-hub/projects', labelKey: 'navigation.projects', fallback: 'Projects', icon: Folder },
      { href: '/creative-hub/brand-kit', labelKey: 'navigation.brandKit', fallback: 'Brand Kit', icon: PaletteIcon },
      { href: '/creative-hub/products', labelKey: 'navigation.products', fallback: 'Products', icon: Package },
      { href: '/creative-hub/media', labelKey: 'navigation.mediaLibrary', fallback: 'Media Library', icon: Image },
    ],
  },
]

const BOTTOM_NAV = [
  { href: '/settings/workspace', labelKey: 'navigation.workspace', fallback: 'Workspace', icon: Users },
  { href: '/settings', labelKey: 'navigation.settings', fallback: 'Settings', icon: Settings2 },
]

type SidebarMode = 'wide' | 'rail'

function expandedForPath(pathname: string): Record<string, boolean> {
  const href = activeNavHref(pathname)
  const match = href
    ? CATEGORIES.find((c) => c.items.some((i) => i.href === href))
    : CATEGORIES.find((c) => c.items.some((i) => navPathMatches(pathname, i.href)))
  if (!match) {
    return { marketing: true, analytics: false, optimization: false, tools: false, creative: false }
  }
  return Object.fromEntries(CATEGORIES.map((c) => [c.id, c.id === match.id])) as Record<string, boolean>
}

export default function Sidebar() {
  const { t } = useI18n()
  const pathname = usePathname()
  const router = useRouter()
  const currentNavHref = useMemo(() => activeNavHref(pathname), [pathname])
  const { currentWorkspace, user, logout } = useWorkspaceStore()
  const shellRef = useRef<HTMLDivElement>(null)

  const [mode, setMode] = useState<SidebarMode>('wide')
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})
  const [openFlyout, setOpenFlyout] = useState<string | null>(null)

  useLayoutEffect(() => {
    setExpanded(expandedForPath(pathname))
  }, [pathname])

  useEffect(() => {
    try {
      const v = localStorage.getItem(STORAGE_KEY)
      if (v === 'rail' || v === 'wide') setMode(v)
    } catch {
      /* ignore */
    }
  }, [])

  const setModePersist = useCallback((m: SidebarMode) => {
    setMode(m)
    setOpenFlyout(null)
    try {
      localStorage.setItem(STORAGE_KEY, m)
    } catch {
      /* ignore */
    }
  }, [])

  useEffect(() => {
    if (mode !== 'rail' || !openFlyout) return
    function onDocPointerDown(e: PointerEvent) {
      if (shellRef.current?.contains(e.target as Node)) return
      setOpenFlyout(null)
    }
    document.addEventListener('pointerdown', onDocPointerDown)
    return () => document.removeEventListener('pointerdown', onDocPointerDown)
  }, [mode, openFlyout])

  function toggle(id: string) {
    setExpanded((p) => ({ ...p, [id]: !p[id] }))
  }

  function handleLogout() {
    logout()
    router.push('/login')
  }

  const asideClass = cn(
    'flex flex-col shrink-0 border-r border-brand-mid/20 bg-[#142818] text-[#c8e6a8] transition-[width] duration-200 ease-out',
    mode === 'wide' ? 'w-64' : 'w-[72px]',
  )

  const ModeToggle = ({ rail }: { rail: boolean }) => (
    <button
      type="button"
      onClick={() => setModePersist(rail ? 'wide' : 'rail')}
      className="rounded-lg p-1.5 text-brand-lime/60 transition hover:bg-brand-mid/20 hover:text-brand-white"
      title={rail ? t('sidebar.expandWide', 'Expand sidebar') : t('sidebar.compactRail', 'Compact sidebar')}
      aria-label={rail ? t('sidebar.expandWide', 'Expand sidebar') : t('sidebar.compactRail', 'Compact sidebar')}
    >
      {rail ? <ChevronsRight size={18} strokeWidth={1.5} /> : <ChevronsLeft size={18} strokeWidth={1.5} />}
    </button>
  )

  const AutopilotBlock = ({ compact }: { compact?: boolean }) => {
    if (!currentWorkspace) return null
    const modeKey = currentWorkspace.autopilotMode
    const dotClass =
      modeKey === 'full_auto' ? 'bg-success animate-pulse' : modeKey === 'assisted' ? 'bg-warning' : 'bg-text-tertiary'
    const title =
      modeKey === 'full_auto'
        ? t('sidebar.autopilot.fullAutoHint', 'AI manages campaigns automatically.')
        : modeKey === 'assisted'
          ? t('sidebar.autopilot.assistedHint', 'AI suggests actions, you approve.')
          : t('sidebar.autopilot.manualHint', 'AI insights only, manual execution.')

    if (compact) {
      return (
        <div className="flex justify-center px-1 pb-2" title={title}>
          <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-brand-mid/25 bg-brand-mid/10">
            <div className={cn('h-2 w-2 rounded-full', dotClass)} />
          </div>
        </div>
      )
    }

    return (
      <div className="px-3 pb-2">
        <div className="rounded-lg border border-brand-mid/25 bg-brand-mid/10 px-3 py-2.5">
          <div className="mb-1 flex items-center gap-2">
            <div className={cn('h-1.5 w-1.5 shrink-0 rounded-full', dotClass)} />
            <p className="text-xs font-medium text-brand-white">
              {modeKey === 'full_auto'
                ? t('sidebar.autopilot.fullAuto', 'Full Auto')
                : modeKey === 'assisted'
                  ? t('sidebar.autopilot.assisted', 'Assisted')
                  : t('sidebar.autopilot.manual', 'Manual')}
            </p>
          </div>
          <p className="text-xs leading-relaxed text-brand-lime/55">{title}</p>
        </div>
      </div>
    )
  }

  if (mode === 'rail') {
    return (
      <div ref={shellRef} className="relative flex h-full shrink-0">
        <aside className={asideClass}>
          <div className="flex flex-shrink-0 flex-col items-center gap-1 border-b border-brand-mid/20 px-2 py-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-brand-mid to-brand-lime">
              <span className="text-sm font-bold text-brand-ink">P</span>
            </div>
            <ModeToggle rail />
          </div>

          <nav className="flex flex-1 flex-col items-center gap-1 overflow-y-auto px-1.5 py-2">
            {CATEGORIES.map((cat) => {
              const Icon = cat.icon
              const anyActive = cat.items.some((i) => navPathMatches(pathname, i.href))
              const flyoutOpen = openFlyout === cat.id
              return (
                <div key={cat.id} className="relative flex w-full justify-center">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      setOpenFlyout(flyoutOpen ? null : cat.id)
                    }}
                    title={t(cat.labelKey, cat.fallback)}
                    className={cn(
                      'flex h-10 w-10 items-center justify-center rounded-lg transition-colors',
                      anyActive || flyoutOpen
                        ? 'bg-brand-mid/35 text-brand-white ring-1 ring-brand-lime/40'
                        : 'text-brand-lime/70 hover:bg-brand-mid/15 hover:text-brand-white',
                    )}
                  >
                    <Icon size={18} strokeWidth={1.5} />
                  </button>
                </div>
              )
            })}
          </nav>

          <AutopilotBlock compact />

          <div className="flex flex-col items-center gap-0.5 border-t border-brand-mid/20 px-1.5 py-2">
            {BOTTOM_NAV.map((item) => {
              const Icon = item.icon
              const isActive =
                item.href === '/settings/workspace'
                  ? pathname.startsWith('/settings/workspace')
                  : pathname.startsWith('/settings') && !pathname.startsWith('/settings/workspace')
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  title={t(item.labelKey, item.fallback)}
                  onClick={() => setOpenFlyout(null)}
                  className={cn(
                    'flex h-10 w-10 items-center justify-center rounded-lg transition-colors',
                    isActive
                      ? 'bg-brand-mid/35 text-brand-white ring-1 ring-brand-lime/40'
                      : 'text-brand-lime/70 hover:bg-brand-mid/15 hover:text-brand-white',
                  )}
                >
                  <Icon size={18} strokeWidth={1.5} />
                </Link>
              )
            })}
          </div>

          <div className="flex flex-col items-center gap-1 border-t border-brand-mid/20 px-2 py-2">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-brand-mid/30 bg-brand-mid/15">
              <span className="text-xs font-semibold text-brand-white">{user?.name?.charAt(0)?.toUpperCase() ?? 'U'}</span>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              title={t('common.logout', 'Logout')}
              className="rounded-lg p-2 text-brand-lime/55 transition hover:bg-brand-mid/15 hover:text-brand-white"
            >
              <LogOut size={16} strokeWidth={1.5} />
            </button>
          </div>
        </aside>

        {openFlyout && (
          <div
            className="absolute left-[72px] top-0 z-[70] flex h-full min-h-0 w-[min(260px,calc(100vw-5rem))] flex-col border-r border-border/80 bg-surface py-3 shadow-xl dark:border-brand-mid/30 dark:bg-brand-ink"
            onPointerDown={(e) => e.stopPropagation()}
          >
            {CATEGORIES.filter((c) => c.id === openFlyout).map((cat) => (
              <div key={cat.id} className="flex min-h-0 flex-1 flex-col px-2">
                <p className="mb-2 px-2 text-xs font-semibold uppercase tracking-wide text-text-tertiary dark:text-brand-lime/50">
                  {t(cat.labelKey, cat.fallback)}
                </p>
                <div className="min-h-0 flex-1 space-y-0.5 overflow-y-auto pr-1">
                  {cat.items.map((item) => {
                    const ItemIcon = item.icon
                    const isActive = currentNavHref === item.href
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setOpenFlyout(null)}
                        className={cn(
                          'flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition-colors',
                          isActive
                            ? 'bg-primary/15 font-medium text-primary dark:bg-brand-lime/15 dark:text-brand-lime'
                            : 'text-text-secondary hover:bg-surface-2 dark:text-brand-lime/80 dark:hover:bg-brand-mid/20',
                        )}
                      >
                        <ItemIcon size={16} strokeWidth={1.5} className="shrink-0 opacity-80" />
                        <span className="min-w-0 flex-1 truncate">{t(item.labelKey, item.fallback)}</span>
                        {'badge' in item && item.badge && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary dark:bg-brand-lime" />}
                      </Link>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  /* ——— wide mode ——— */
  return (
    <aside className={asideClass}>
      <div className="flex flex-shrink-0 items-start justify-between gap-2 border-b border-brand-mid/20 px-4 py-3">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-brand-mid to-brand-lime">
            <span className="text-sm font-bold text-brand-ink">P</span>
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-sm font-semibold leading-tight text-white">AdSpectr</h1>
            {currentWorkspace && <p className="truncate text-xs text-brand-lime/55">{currentWorkspace.name}</p>}
          </div>
        </div>
        <ModeToggle rail={false} />
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-2 py-3">
        {CATEGORIES.map((cat) => {
          const isOpen = expanded[cat.id]
          const Icon = cat.icon
          return (
            <div key={cat.id}>
              <button
                type="button"
                onClick={() => toggle(cat.id)}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-brand-lime/70 transition-colors hover:bg-brand-mid/15 hover:text-brand-white"
              >
                <Icon size={15} strokeWidth={1.5} className="shrink-0" />
                <span className="min-w-0 flex-1 truncate text-left">{t(cat.labelKey, cat.fallback)}</span>
                <ChevronDown size={13} className={cn('shrink-0 transition-transform duration-200', isOpen ? 'rotate-180' : '')} />
              </button>

              {isOpen && (
                <div className="mb-1 ml-2 mt-0.5 space-y-0.5 border-l border-brand-mid/25 pl-3">
                  {cat.items.map((item) => {
                    const ItemIcon = item.icon
                    const isActive = currentNavHref === item.href
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                          'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
                          isActive
                            ? 'border border-brand-lime/30 bg-brand-mid/25 font-medium text-white'
                            : 'text-brand-lime/75 hover:bg-brand-mid/15 hover:text-brand-white',
                        )}
                      >
                        <ItemIcon size={14} strokeWidth={1.5} className="shrink-0" />
                        <span className="min-w-0 flex-1 truncate">{t(item.labelKey, item.fallback)}</span>
                        {'badge' in item && item.badge && <div className="h-1.5 w-1.5 shrink-0 rounded-full bg-brand-lime" />}
                      </Link>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </nav>

      <AutopilotBlock />

      <div className="border-t border-brand-mid/20 px-2 py-2">
        {BOTTOM_NAV.map((item) => {
          const Icon = item.icon
          const isActive =
            item.href === '/settings/workspace'
              ? pathname.startsWith('/settings/workspace')
              : pathname.startsWith('/settings') && !pathname.startsWith('/settings/workspace')
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'border border-brand-lime/30 bg-brand-mid/25 text-white'
                  : 'text-brand-lime/75 hover:bg-brand-mid/15 hover:text-brand-white',
              )}
            >
              <Icon size={16} strokeWidth={1.5} className="shrink-0" />
              {t(item.labelKey, item.fallback)}
            </Link>
          )
        })}
      </div>

      <div className="border-t border-brand-mid/20 px-3 py-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-brand-mid/30 bg-brand-mid/15">
            <span className="text-xs font-semibold text-brand-white">{user?.name?.charAt(0)?.toUpperCase() ?? 'U'}</span>
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-medium text-brand-white">{user?.name}</p>
            <p className="truncate text-xs text-brand-lime/55">{user?.email}</p>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            title={t('common.logout', 'Logout')}
            className="rounded-lg p-1.5 text-brand-lime/55 transition-colors hover:bg-brand-mid/15 hover:text-brand-white"
          >
            <LogOut size={15} strokeWidth={1.5} />
          </button>
        </div>
      </div>
    </aside>
  )
}
