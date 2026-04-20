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
  Search,
  Trophy,
  ChevronDown,
  Palette,
  Wand2,
  Users2,
  ImagePlus,
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
  UserCircle,
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
    id: 'marketplace',
    labelKey: 'navigation.marketplace',
    fallback: 'Marketplace',
    icon: ShoppingBag,
    items: [
      {
        href: '/marketplace/search',
        labelKey: 'navigation.marketplaceSearch',
        fallback: 'Browse specialists',
        icon: Search,
      },
      {
        href: '/marketplace/leaderboard',
        labelKey: 'navigation.leaderboard',
        fallback: 'Leaderboard',
        icon: Trophy,
      },
      {
        href: '/marketplace/portfolio',
        labelKey: 'navigation.marketplacePortfolios',
        fallback: 'Portfolios',
        icon: Folder,
      },
      { href: '/my-portfolio', labelKey: 'navigation.portfolio', fallback: 'My portfolio', icon: UserCircle },
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
      { href: '/creative-hub/image-ads', labelKey: 'navigation.imageAds', fallback: 'Image Ads', icon: ImagePlus },
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
    return {
      marketing: true,
      analytics: false,
      optimization: false,
      marketplace: false,
      tools: false,
      creative: false,
    }
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
    'flex flex-col shrink-0 border-r border-white/[0.06] bg-[#121214] text-zinc-400 antialiased transition-[width] duration-200 ease-out',
    mode === 'wide' ? 'w-56 sm:w-[240px]' : 'w-[60px]',
  )

  const ModeToggle = ({ rail }: { rail: boolean }) => (
    <button
      type="button"
      onClick={() => setModePersist(rail ? 'wide' : 'rail')}
      className="rounded-md p-1 text-zinc-500 transition hover:bg-white/[0.06] hover:text-zinc-200"
      title={rail ? t('sidebar.expandWide', 'Expand sidebar') : t('sidebar.compactRail', 'Compact sidebar')}
      aria-label={rail ? t('sidebar.expandWide', 'Expand sidebar') : t('sidebar.compactRail', 'Compact sidebar')}
    >
      {rail ? <ChevronsRight size={16} strokeWidth={1.5} /> : <ChevronsLeft size={16} strokeWidth={1.5} />}
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
        <div className="flex justify-center px-1 pb-1.5" title={title}>
          <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.04]">
            <div className={cn('h-1.5 w-1.5 rounded-full', dotClass)} />
          </div>
        </div>
      )
    }

    return (
      <div className="px-2 pb-1.5">
        <div className="rounded-lg border border-white/[0.08] bg-white/[0.04] px-2.5 py-2">
          <div className="mb-0.5 flex items-center gap-1.5">
            <div className={cn('h-1.5 w-1.5 shrink-0 rounded-full', dotClass)} />
            <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-300">
              {modeKey === 'full_auto'
                ? t('sidebar.autopilot.fullAuto', 'Full Auto')
                : modeKey === 'assisted'
                  ? t('sidebar.autopilot.assisted', 'Assisted')
                  : t('sidebar.autopilot.manual', 'Manual')}
            </p>
          </div>
          <p className="text-[11px] leading-snug text-zinc-500">{title}</p>
        </div>
      </div>
    )
  }

  if (mode === 'rail') {
    return (
      <div ref={shellRef} className="relative flex h-full shrink-0">
        <aside className={asideClass}>
          <div className="flex flex-shrink-0 flex-col items-center gap-0.5 border-b border-white/[0.06] px-1.5 py-2">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-brand-mid to-brand-lime">
              <span className="text-xs font-bold text-brand-ink">P</span>
            </div>
            <ModeToggle rail />
          </div>

          <nav className="flex flex-1 flex-col items-center gap-0.5 overflow-y-auto px-1 py-1.5">
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
                      'flex h-9 w-9 items-center justify-center rounded-lg transition-colors',
                      anyActive || flyoutOpen
                        ? 'bg-brand-lime/15 text-brand-lime ring-1 ring-brand-lime/25'
                        : 'text-zinc-500 hover:bg-white/[0.06] hover:text-zinc-200',
                    )}
                  >
                    <Icon size={17} strokeWidth={1.5} />
                  </button>
                </div>
              )
            })}
          </nav>

          <AutopilotBlock compact />

          <div className="flex flex-col items-center gap-0.5 border-t border-white/[0.06] px-1 py-1.5">
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

          <div className="flex flex-col items-center gap-0.5 border-t border-white/[0.06] px-1.5 py-1.5">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/[0.1] bg-white/[0.05]">
              <span className="text-[11px] font-semibold text-zinc-200">{user?.name?.charAt(0)?.toUpperCase() ?? 'U'}</span>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              title={t('common.logout', 'Logout')}
              className="rounded-lg p-1.5 text-zinc-500 transition hover:bg-white/[0.06] hover:text-zinc-200"
            >
              <LogOut size={15} strokeWidth={1.5} />
            </button>
          </div>
        </aside>

        {openFlyout && (
          <div
            className="absolute left-[60px] top-0 z-[70] flex h-full min-h-0 w-[min(248px,calc(100vw-4.5rem))] flex-col border-r border-white/[0.08] bg-[#121214] py-2 shadow-2xl shadow-black/40"
            onPointerDown={(e) => e.stopPropagation()}
          >
            {CATEGORIES.filter((c) => c.id === openFlyout).map((cat) => (
              <div key={cat.id} className="flex min-h-0 flex-1 flex-col px-1.5">
                <p className="mb-1.5 px-2 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                  {t(cat.labelKey, cat.fallback)}
                </p>
                <div className="min-h-0 flex-1 space-y-px overflow-y-auto pr-0.5">
                  {cat.items.map((item) => {
                    const ItemIcon = item.icon
                    const isActive = currentNavHref === item.href
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setOpenFlyout(null)}
                        className={cn(
                          'flex items-center gap-2 rounded-md px-2 py-1.5 text-[12px] leading-snug transition-colors',
                          isActive
                            ? 'bg-brand-lime/10 font-medium text-brand-lime'
                            : 'text-zinc-500 hover:bg-white/[0.05] hover:text-zinc-200',
                        )}
                      >
                        <ItemIcon size={14} strokeWidth={1.5} className="shrink-0 opacity-90" />
                        <span className="min-w-0 flex-1 truncate">{t(item.labelKey, item.fallback)}</span>
                        {'badge' in item && item.badge && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-brand-lime" />}
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
      <div className="flex flex-shrink-0 items-center justify-between gap-1.5 border-b border-white/[0.06] px-2.5 py-2">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-brand-mid to-brand-lime">
            <span className="text-[11px] font-bold text-brand-ink">P</span>
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-[13px] font-semibold leading-tight tracking-tight text-zinc-100">AdSpectr</h1>
            {currentWorkspace && (
              <p className="truncate text-[10px] leading-tight text-zinc-500">{currentWorkspace.name}</p>
            )}
          </div>
        </div>
        <ModeToggle rail={false} />
      </div>

      <nav className="flex-1 space-y-0.5 overflow-y-auto px-1.5 py-2">
        {CATEGORIES.map((cat) => {
          const isOpen = expanded[cat.id]
          const Icon = cat.icon
          const anyActive = cat.items.some((i) => navPathMatches(pathname, i.href))
          const showSub = Boolean(isOpen || anyActive)
          return (
            <div key={cat.id} className="rounded-lg">
              <button
                type="button"
                onClick={() => toggle(cat.id)}
                className={cn(
                  'flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-[13px] font-medium leading-snug transition-colors',
                  anyActive
                    ? 'bg-white/[0.06] text-brand-lime'
                    : 'text-zinc-500 hover:bg-white/[0.04] hover:text-zinc-200',
                )}
              >
                <Icon size={15} strokeWidth={1.5} className={cn('shrink-0', anyActive ? 'text-brand-lime' : 'text-zinc-500')} />
                <span className="min-w-0 flex-1 truncate">{t(cat.labelKey, cat.fallback)}</span>
                <ChevronDown
                  size={12}
                  strokeWidth={2}
                  className={cn(
                    'shrink-0 text-zinc-600 transition-transform duration-200',
                    showSub ? 'rotate-180' : '',
                    anyActive && 'text-brand-lime/70',
                  )}
                />
              </button>

              {showSub && (
                <div className="mb-0.5 ml-2 mt-0.5 border-l border-zinc-700/80 pl-2">
                  <div className="space-y-px py-0.5">
                    {cat.items.map((item) => {
                      const ItemIcon = item.icon
                      const isActive = currentNavHref === item.href
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          className={cn(
                            'flex items-center gap-2 rounded-md py-1.5 pl-1.5 pr-1.5 text-[12px] leading-snug transition-colors',
                            isActive
                              ? 'bg-brand-lime/10 font-medium text-brand-lime'
                              : 'text-zinc-500 hover:bg-white/[0.04] hover:text-zinc-300',
                          )}
                        >
                          <ItemIcon size={13} strokeWidth={1.5} className={cn('shrink-0', isActive ? 'text-brand-lime' : 'opacity-80')} />
                          <span className="min-w-0 flex-1 truncate">{t(item.labelKey, item.fallback)}</span>
                          {'badge' in item && item.badge && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-brand-lime" />}
                        </Link>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </nav>

      <AutopilotBlock />

      <div className="space-y-px border-t border-white/[0.06] px-1.5 py-1.5">
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
                'flex items-center gap-2 rounded-lg px-2 py-1.5 text-[12px] font-medium leading-snug transition-colors',
                isActive
                  ? 'bg-brand-lime/10 text-brand-lime'
                  : 'text-zinc-500 hover:bg-white/[0.04] hover:text-zinc-200',
              )}
            >
              <Icon size={14} strokeWidth={1.5} className="shrink-0" />
              <span className="truncate">{t(item.labelKey, item.fallback)}</span>
            </Link>
          )
        })}
      </div>

      <div className="border-t border-white/[0.06] px-2 py-2">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-white/[0.1] bg-white/[0.05]">
            <span className="text-[10px] font-semibold text-zinc-200">{user?.name?.charAt(0)?.toUpperCase() ?? 'U'}</span>
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[11px] font-medium text-zinc-200">{user?.name}</p>
            <p className="truncate text-[10px] text-zinc-500">{user?.email}</p>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            title={t('common.logout', 'Logout')}
            className="rounded-md p-1 text-zinc-500 transition-colors hover:bg-white/[0.06] hover:text-zinc-200"
          >
            <LogOut size={14} strokeWidth={1.5} />
          </button>
        </div>
      </div>
    </aside>
  )
}
