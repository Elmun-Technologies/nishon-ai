'use client'
import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useWorkspaceStore } from '@/stores/workspace.store'
import {
  LayoutGrid, Rocket, Zap, BarChart3, Brain, Wallet,
  Settings2, LogOut, Users, Star, TrendingUp, ShoppingBag, ChevronDown, Palette,
  Wand2, Users2, Folder, Palette as PaletteIcon, Package, Image, RefreshCcw, Workflow,
} from 'lucide-react'

const CATEGORIES = [
  {
    id: 'advertising', label: 'Reklama', icon: Rocket,
    items: [
      { href: '/launch',      label: 'Yoqish',       icon: Rocket },
      { href: '/campaigns',   label: 'Kampaniyalar',  icon: Zap },
      { href: '/marketplace', label: 'Marketplace',   icon: ShoppingBag },
    ],
  },
  {
    id: 'analytics', label: 'Analytics & Reports', icon: BarChart3,
    items: [
      { href: '/reporting',    label: 'Hisobot',    icon: BarChart3 },
      { href: '/ai-decisions', label: 'AI Qarorlar', icon: Brain, badge: true },
    ],
  },
  {
    id: 'optimization', label: 'Optimization', icon: Settings2,
    items: [
      { href: '/budget',            label: 'Byudjet',           icon: Wallet },
      { href: '/auto-optimization', label: 'Auto-Optimizatsiya', icon: Settings2 },
      { href: '/roi-calculator',    label: 'ROI Kalkulyator',    icon: BarChart3 },
    ],
  },
  {
    id: 'tools', label: 'Tools & Resources', icon: Star,
    items: [
      { href: '/retargeting',     label: 'Retargeting',      icon: RefreshCcw },
      { href: '/automation',      label: 'Avtomatsiya',      icon: Workflow },
      { href: '/creative-scorer', label: 'Kreativ Baholash', icon: Star },
      { href: '/competitors',     label: 'Raqobatchilar',    icon: Users },
      { href: '/landing-page',    label: 'Landing Page',     icon: TrendingUp },
      { href: '/my-portfolio',    label: 'Portfolio',        icon: TrendingUp },
    ],
  },
  {
    id: 'creative', label: 'Create', icon: Wand2,
    items: [
      { href: '/creative-hub',           label: 'Creative Hub',    icon: Palette },
      { href: '/creative-hub/ai-actors',  label: 'AI Actors',      icon: Users2 },
      { href: '/creative-hub/projects',   label: 'Projects',       icon: Folder },
      { href: '/creative-hub/brand-kit',  label: 'Brand Kit',      icon: PaletteIcon },
      { href: '/creative-hub/products',   label: 'Products',       icon: Package },
      { href: '/creative-hub/media',      label: 'Media Library',   icon: Image },
    ],
  },
]

const BOTTOM_NAV = [{ href: '/settings', label: 'Sozlamalar', icon: Settings2 }]

export default function Sidebar() {
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
          Dashboard
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
                <span className="flex-1 text-left">{cat.label}</span>
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
                        <span className="flex-1 truncate">{item.label}</span>
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
                {currentWorkspace.autopilotMode === 'full_auto' ? 'To\'liq Avto' :
                 currentWorkspace.autopilotMode === 'assisted'  ? 'Yordamlashish' : 'Qo\'lda boshqarish'}
              </p>
            </div>
            <p className="text-text-tertiary text-xs leading-relaxed">
              {currentWorkspace.autopilotMode === 'full_auto' ? 'AI mustaqil boshqarmoqda' :
               currentWorkspace.autopilotMode === 'assisted'  ? 'AI tavsiya beradi, siz tasdiqlaysiz' : 'AI faqat maslahat beradi'}
            </p>
          </div>
        </div>
      )}

      {/* Bottom nav */}
      <div className="px-2 border-t border-border py-2">
        {BOTTOM_NAV.map((item) => {
          const Icon = item.icon
          const isActive = pathname.startsWith(item.href)
          return (
            <Link key={item.href} href={item.href}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive ? 'bg-surface-2 text-text-primary' : 'text-text-secondary hover:text-text-primary hover:bg-surface-2'
              }`}
            >
              <Icon size={16} strokeWidth={1.5} className="shrink-0" />
              {item.label}
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
          <button onClick={handleLogout} title="Sign out"
            className="text-text-tertiary hover:text-text-primary transition-colors p-1.5 rounded-lg hover:bg-surface-2">
            <LogOut size={15} strokeWidth={1.5} />
          </button>
        </div>
      </div>
    </aside>
  )
}
