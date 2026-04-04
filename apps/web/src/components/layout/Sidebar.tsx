'use client'
import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useWorkspaceStore } from '@/stores/workspace.store'
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
} from 'lucide-react'

const NAV_ITEMS = [
  {
    href: '/dashboard',
    label: 'Dashboard',
    icon: LayoutGrid,
  },
  {
    href: '/launch',
    label: 'Reklama Yoqish',
    icon: Rocket,
  },
  {
    href: '/campaigns',
    label: 'Kampaniyalar',
    icon: Zap,
  },
  {
    href: '/reporting',
    label: 'Hisobot',
    icon: BarChart3,
  },
  {
    href: '/ai-decisions',
    label: 'AI Qarorlar',
    icon: Brain,
    badge: true,
  },
  {
    href: '/budget',
    label: 'Byudjet',
    icon: Wallet,
  },
  {
    href: '/auto-optimization',
    label: 'Auto-Optimallashtirish',
    icon: Settings2,
  },
  {
    href: '/competitors',
    label: 'Raqobatchilar',
    icon: Users,
  },
  {
    href: '/creative-scorer',
    label: 'Kreativ Baholash',
    icon: Sparkles,
  },
  {
    href: '/landing-page',
    label: 'Landing Page',
    icon: TrendingUp,
  },
  {
    href: '/roi-calculator',
    label: 'ROI Kalkulyator',
    icon: BarChart3,
  },
  {
    href: '/my-portfolio',
    label: 'Portfolio',
    icon: TrendingUp,
  },
  {
    href: '/marketplace',
    label: 'Marketplace',
    icon: ShoppingBag,
  },
]

const BOTTOM_NAV = [
  {
    href: '/settings',
    label: 'Sozlamalar',
    icon: Settings2,
  },
]

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { currentWorkspace, user, logout } = useWorkspaceStore()
  const [isWorkspaceMenuOpen, setIsWorkspaceMenuOpen] = useState(true)

  function handleLogout() {
    logout()
    router.push('/login')
  }

  return (
    <aside className="w-64 bg-surface border-r border-border flex flex-col shrink-0">
      {/* Header */}
      <div className="px-6 py-5 border-b border-border">
        {/* Logo */}
        <div className="flex items-center gap-3 mb-1">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center shrink-0">
            <span className="text-white font-bold text-sm">P</span>
          </div>
          <h1 className="heading-lg flex-1">Performa</h1>
        </div>
        {currentWorkspace && (
          <p className="text-label text-text-tertiary">
            {currentWorkspace.name}
          </p>
        )}
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
        {/* Dashboard - Always visible */}
        {NAV_ITEMS.slice(0, 1).map((item) => {
          const Icon = item.icon
          const isActive =
            item.href === '/dashboard'
              ? pathname === '/dashboard'
              : pathname.startsWith(item.href)

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`
                flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm
                transition-all duration-150 group
                ${
                  isActive
                    ? 'bg-surface-secondary text-text-primary'
                    : 'text-text-secondary hover:text-text-primary hover:bg-surface-secondary'
                }
              `}
            >
              <Icon
                size={18}
                className={`shrink-0 transition-colors ${
                  isActive ? 'text-text-primary' : 'text-text-tertiary group-hover:text-text-secondary'
                }`}
                strokeWidth={1.5}
              />
              <span className="flex-1 truncate font-medium text-body-sm">{item.label}</span>
              {item.badge && (
                <div className="w-2 h-2 rounded-full bg-blue-500 shrink-0 animate-pulse" />
              )}
            </Link>
          )
        })}

        {/* Collapsible Workspace Menu */}
        <div className="space-y-1">
          <button
            onClick={() => setIsWorkspaceMenuOpen(!isWorkspaceMenuOpen)}
            className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm
              transition-all duration-150 group
              bg-surface-secondary hover:bg-border text-text-primary font-medium"
          >
            <span className="flex-1 text-left text-body-sm">
              {currentWorkspace?.name ?? 'Workspace'}
            </span>
            <svg
              width="16"
              height="16"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
              className={`text-text-secondary transition-transform duration-300 shrink-0 ${
                isWorkspaceMenuOpen ? 'rotate-180' : ''
              }`}
            >
              <path d="M6 9l6 6 6-6" />
            </svg>
          </button>

          {/* Collapsible Items */}
          {isWorkspaceMenuOpen && (
            <div className="space-y-1 pl-2">
              {NAV_ITEMS.slice(1).map((item) => {
                const Icon = item.icon
                const isActive = pathname.startsWith(item.href)
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`
                      flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm
                      transition-all duration-150 group
                      ${
                        isActive
                          ? 'bg-surface-secondary text-text-primary'
                          : 'text-text-secondary hover:text-text-primary hover:bg-surface-secondary'
                      }
                    `}
                  >
                    <Icon
                      size={18}
                      className={`shrink-0 transition-colors ${
                        isActive
                          ? 'text-text-primary'
                          : 'text-text-tertiary group-hover:text-text-secondary'
                      }`}
                      strokeWidth={1.5}
                    />
                    <span className="flex-1 truncate font-medium text-body-sm">
                      {item.label}
                    </span>
                    {item.badge && (
                      <div className="w-2 h-2 rounded-full bg-blue-500 shrink-0 animate-pulse" />
                    )}
                  </Link>
                )
              })}
            </div>
          )}
        </div>
      </nav>

      {/* Autopilot Status */}
      {currentWorkspace && (
        <div className="px-2 pb-4">
          <div className="bg-surface-secondary border border-border rounded-lg px-3 py-3">
            <div className="flex items-center gap-2 mb-2">
              <div
                className={`w-2 h-2 rounded-full shrink-0 ${
                  currentWorkspace.autopilotMode === 'full_auto'
                    ? 'bg-emerald-500 animate-pulse'
                    : currentWorkspace.autopilotMode === 'assisted'
                      ? 'bg-amber-500'
                      : 'bg-gray-400'
                }`}
              />
              <p className="text-label text-text-primary font-medium">
                {currentWorkspace.autopilotMode === 'full_auto'
                  ? 'To\'liq Avto'
                  : currentWorkspace.autopilotMode === 'assisted'
                    ? 'Yordamlashish'
                    : 'Qo\'lda boshqarish'}
              </p>
            </div>
            <p className="text-caption text-text-tertiary leading-relaxed">
              {currentWorkspace.autopilotMode === 'full_auto'
                ? 'AI kampaniyalarni mustaqil boshqarmoqda'
                : currentWorkspace.autopilotMode === 'assisted'
                  ? 'AI tavsiya beradi, siz tasdiqlaysiz'
                  : 'AI faqat maslahat beradi'}
            </p>
          </div>
        </div>
      )}

      {/* Bottom Navigation */}
      <div className="px-2 border-t border-border py-3">
        {BOTTOM_NAV.map((item) => {
          const Icon = item.icon
          const isActive = pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`
                flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm
                transition-all duration-150 group
                ${
                  isActive
                    ? 'bg-surface-secondary text-text-primary'
                    : 'text-text-secondary hover:text-text-primary hover:bg-surface-secondary'
                }
              `}
            >
              <Icon
                size={18}
                className={`shrink-0 transition-colors ${
                  isActive ? 'text-text-primary' : 'text-text-tertiary group-hover:text-text-secondary'
                }`}
                strokeWidth={1.5}
              />
              <span className="flex-1 font-medium text-body-sm">{item.label}</span>
            </Link>
          )
        })}
      </div>

      {/* User Section */}
      <div className="px-3 py-4 border-t border-border">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-surface-secondary border border-border flex items-center justify-center shrink-0">
            <span className="text-label font-semibold text-text-primary">
              {user?.name?.charAt(0)?.toUpperCase() ?? 'U'}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-caption font-medium text-text-primary truncate">{user?.name}</p>
            <p className="text-caption text-text-tertiary truncate">{user?.email}</p>
          </div>
          <button
            onClick={handleLogout}
            title="Sign out"
            className="text-text-tertiary hover:text-text-secondary transition-colors p-1.5 rounded-lg hover:bg-surface-secondary"
          >
            <LogOut size={16} strokeWidth={1.5} />
          </button>
        </div>
      </div>
    </aside>
  )
}
