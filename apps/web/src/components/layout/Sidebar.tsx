'use client'
import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useWorkspaceStore } from '@/stores/workspace.store'
import { useI18n } from '@/i18n/use-i18n'
import {
  LayoutGrid, Rocket, Zap, BarChart3, Brain, Wallet,
  Settings2, LogOut, Users, Sparkles, TrendingUp, ShoppingBag, ChevronDown, Palette,
  Wand2, Users2, Folder, Palette as PaletteIcon, Package, Image, RefreshCcw, Workflow, Bot,
} from 'lucide-react'

const CATEGORIES: Array<{
  id: string
  labelKey: string
  fallback: string
  icon: any
  items: Array<{ href: string; labelKey: string; fallback: string; icon: any; badge?: boolean }>
}> = [
  {
    id: 'marketing',
    labelKey: 'navigation.marketing',
    fallback: 'Marketing',
    icon: Rocket,
    items: [
      { href: '/launch', labelKey: 'navigation.launch', fallback: 'Launch', icon: Rocket },
      { href: '/campaigns', labelKey: 'navigation.campaigns', fallback: 'Campaigns', icon: Zap },
      { href: '/marketplace', labelKey: 'navigation.marketplace', fallback: 'Marketplace', icon: ShoppingBag },
      { href: '/audiences', labelKey: 'navigation.audiences', fallback: 'Audiences', icon: Users },
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
      { href: '/roi-calculator', labelKey: 'navigation.roi', fallback: 'ROI Calculator', icon: BarChart3 },
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

export default function Sidebar() {
  const { t } = useI18n()
  const pathname = usePathname()
  const router = useRouter()
  const { currentWorkspace, user, logout } = useWorkspaceStore()
  const [expanded, setExpanded] = useState<Record<string, boolean>>({
    advertising: true, analytics: true, optimization: true, tools: true, creative: true,
  })

  function toggle(id: string) {
    setExpanded(p => ({ ...p, [id]: !p[id] }))
  }

  function handleLogout() {
    logout()
    router.push('/login')
  }

  return (
    <aside className="w-64 bg-surface border-r border-border flex flex-col shrink-0 transition-colors">
      {/* Logo */}
      <div className="px-5 py-4 border-b border-border flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-text-primary flex items-center justify-center shrink-0">
            <span className="text-surface font-bold text-sm">P</span>
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-text-primary font-semibold text-sm leading-tight">Performa</h1>
            {currentWorkspace && (
              <p className="text-text-tertiary text-xs truncate">{currentWorkspace.name}</p>
            )}
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 py-3 space-y-1 overflow-y-auto">
        {/* Dashboard */}
        <Link
          href="/dashboard"
          className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
            pathname === '/dashboard'
              ? 'bg-surface-2 text-text-primary'
              : 'text-text-secondary hover:text-text-primary hover:bg-surface-2'
          }`}
        >
          <LayoutGrid size={16} className="shrink-0" strokeWidth={1.5} />
          {t('navigation.dashboard', 'Dashboard')}
        </Link>

        {/* Categories */}
        {CATEGORIES.map((cat) => {
          const isOpen = expanded[cat.id]
          const Icon = cat.icon
          return (
            <div key={cat.id}>
              <button
                onClick={() => toggle(cat.id)}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-text-secondary hover:text-text-primary hover:bg-surface-2 transition-colors"
              >
                <Icon size={15} strokeWidth={1.5} className="shrink-0" />
                <span className="flex-1 text-left">{t(cat.labelKey, cat.fallback)}</span>
                <ChevronDown size={13} className={`shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
              </button>

              {isOpen && (
                <div className="ml-2 pl-3 border-l border-border space-y-0.5 mt-0.5 mb-1">
                  {cat.items.map((item) => {
                    const ItemIcon = item.icon
                    const isActive = pathname.startsWith(item.href)
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                          isActive
                            ? 'bg-surface-2 text-text-primary font-medium'
                            : 'text-text-secondary hover:text-text-primary hover:bg-surface-2'
                        }`}
                      >
                        <ItemIcon size={14} strokeWidth={1.5} className="shrink-0" />
                        <span className="flex-1 truncate">{t(item.labelKey, item.fallback)}</span>
                        {'badge' in item && item.badge && (
                          <div className="w-1.5 h-1.5 rounded-full bg-info shrink-0" />
                        )}
                      </Link>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </nav>

      {/* Autopilot status */}
      {currentWorkspace && (
        <div className="px-3 pb-2">
          <div className="bg-surface-2 border border-border rounded-lg px-3 py-2.5">
            <div className="flex items-center gap-2 mb-1">
              <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                currentWorkspace.autopilotMode === 'full_auto' ? 'bg-success animate-pulse' :
                currentWorkspace.autopilotMode === 'assisted'  ? 'bg-warning' : 'bg-text-tertiary'
              }`} />
              <p className="text-text-primary text-xs font-medium">
                {currentWorkspace.autopilotMode === 'full_auto'
                  ? t('sidebar.autopilot.fullAuto', 'Full Auto')
                  : currentWorkspace.autopilotMode === 'assisted'
                  ? t('sidebar.autopilot.assisted', 'Assisted')
                  : t('sidebar.autopilot.manual', 'Manual')}
              </p>
            </div>
            <p className="text-text-tertiary text-xs leading-relaxed">
              {currentWorkspace.autopilotMode === 'full_auto'
                ? t('sidebar.autopilot.fullAutoHint', 'AI manages campaigns automatically.')
                : currentWorkspace.autopilotMode === 'assisted'
                ? t('sidebar.autopilot.assistedHint', 'AI suggests actions, you approve.')
                : t('sidebar.autopilot.manualHint', 'AI insights only, manual execution.')}
            </p>
          </div>
        </div>
      )}

      {/* Bottom nav */}
      <div className="px-2 border-t border-border py-2">
        {BOTTOM_NAV.map((item) => {
          const Icon = item.icon
          const isActive =
            item.href === '/settings/workspace'
              ? pathname.startsWith('/settings/workspace')
              : pathname.startsWith('/settings') && !pathname.startsWith('/settings/workspace')
          return (
            <Link key={item.href} href={item.href}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive ? 'bg-surface-2 text-text-primary' : 'text-text-secondary hover:text-text-primary hover:bg-surface-2'
              }`}
            >
              <Icon size={16} strokeWidth={1.5} className="shrink-0" />
              {t(item.labelKey, item.fallback)}
            </Link>
          )
        })}
      </div>

      {/* User */}
      <div className="px-3 py-3 border-t border-border">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-surface-2 border border-border flex items-center justify-center shrink-0">
            <span className="text-xs font-semibold text-text-primary">
              {user?.name?.charAt(0)?.toUpperCase() ?? 'U'}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-text-primary text-xs font-medium truncate">{user?.name}</p>
            <p className="text-text-tertiary text-xs truncate">{user?.email}</p>
          </div>
          <button onClick={handleLogout} title={t('common.logout', 'Logout')}
            className="text-text-tertiary hover:text-text-primary transition-colors p-1.5 rounded-lg hover:bg-surface-2">
            <LogOut size={15} strokeWidth={1.5} />
          </button>
        </div>
      </div>
    </aside>
  )
}
