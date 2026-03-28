'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useWorkspaceStore } from '@/stores/workspace.store'

const NAV_ITEMS = [
  {
    href: '/dashboard',
    label: 'Dashboard',
    icon: (
      <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <rect x="3" y="3" width="7" height="7" rx="1.5"/>
        <rect x="14" y="3" width="7" height="7" rx="1.5"/>
        <rect x="3" y="14" width="7" height="7" rx="1.5"/>
        <rect x="14" y="14" width="7" height="7" rx="1.5"/>
      </svg>
    ),
  },
  {
    href: '/platforms',
    label: 'Platformalar',
    icon: (
      <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9"/>
      </svg>
    ),
  },
  {
    href: '/campaigns',
    label: 'Campaigns',
    icon: (
      <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z"/>
      </svg>
    ),
  },
  {
    href: '/reporting',
    label: 'Hisobot',
    icon: (
      <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
      </svg>
    ),
  },
  {
    href: '/ai-decisions',
    label: 'AI Decisions',
    icon: (
      <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
      </svg>
    ),
    badge: true,
  },
  {
    href: '/budget',
    label: 'Budget',
    icon: (
      <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
      </svg>
    ),
  },
  {
    href: '/simulation',
    label: 'Simulation',
    icon: (
      <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
      </svg>
    ),
  },
  {
    href: '/triggersets',
    label: 'Triggersetlar',
    icon: (
      <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path d="M13 10V3L4 14h7v7l9-11h-7z"/>
      </svg>
    ),
  },
  {
    href: '/auto-optimization',
    label: 'Auto-Optimallashtirish',
    icon: (
      <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
      </svg>
    ),
  },
  {
    href: '/competitors',
    label: 'Competitors',
    icon: (
      <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path d="M8 21h8" />
        <path d="M12 17v4" />
        <path d="M4 7l8-4 8 4-8 4-8-4Z" />
        <path d="M4 7v10l8 4 8-4V7" />
      </svg>
    ),
  },
  {
    href: '/creative-scorer',
    label: 'Creative Scorer',
    icon: (
      <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
      </svg>
    ),
  },
  {
    href: '/roi-calculator',
    label: 'ROI Kalkulyator',
    icon: (
      <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 11h.01M12 11h.01M15 11h.01M4 19h16a2 2 0 002-2V7a2 2 0 00-2-2H4a2 2 0 00-2 2v10a2 2 0 002 2z"/>
      </svg>
    ),
  },
  {
    href: '/my-portfolio',
    label: 'Portfolio',
    icon: (
      <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16 8v8m-4-5v5m-4-2v2M3 20h18M3 4h18M3 12h18" />
      </svg>
    ),
  },
]

const BOTTOM_NAV = [
  {
    href: '/settings',
    label: 'Settings',
    icon: (
      <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/>
        <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
      </svg>
    ),
  },
]

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { currentWorkspace, user, logout } = useWorkspaceStore()

  function handleLogout() {
    logout()
    router.push('/login')
  }

  return (
    <aside className="w-64 bg-white border-r border-[#E5E7EB] flex flex-col shrink-0">

      {/* Logo + workspace selector */}
      <div className="px-4 py-4 border-b border-[#E5E7EB]">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-[#111827] flex items-center justify-center shrink-0">
            <span className="text-white font-bold text-xs">N</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[#111827] font-semibold text-sm leading-tight truncate">
              {currentWorkspace?.name ?? 'Nishon AI'}
            </p>
            {currentWorkspace && (
              <p className="text-[#9CA3AF] text-xs truncate">Workspace</p>
            )}
          </div>
          <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} className="text-[#9CA3AF] shrink-0">
            <path d="M19 9l-7 7-7-7"/>
          </svg>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const isActive =
            item.href === '/dashboard'
              ? pathname === '/dashboard'
              : pathname.startsWith(item.href)

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`
                flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm
                transition-all duration-150 group
                ${isActive
                  ? 'bg-[#F3F4F6] text-[#111827] font-medium'
                  : 'text-[#6B7280] hover:text-[#111827] hover:bg-[#F9FAFB]'
                }
              `}
            >
              <span className={`shrink-0 ${isActive ? 'text-[#111827]' : 'text-[#9CA3AF] group-hover:text-[#6B7280]'}`}>
                {item.icon}
              </span>
              <span className="flex-1 truncate">{item.label}</span>
              {item.badge && (
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
              )}
            </Link>
          )
        })}
      </nav>

      {/* Autopilot status */}
      {currentWorkspace && (
        <div className="px-2 pb-2">
          <div className="bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg px-3 py-2.5">
            <div className="flex items-center gap-2">
              <div
                className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                  currentWorkspace.autopilotMode === 'full_auto'
                    ? 'bg-emerald-500 animate-pulse'
                    : currentWorkspace.autopilotMode === 'assisted'
                    ? 'bg-amber-500'
                    : 'bg-gray-400'
                }`}
              />
              <p className="text-[#374151] text-xs font-medium">
                {currentWorkspace.autopilotMode === 'full_auto'
                  ? 'Full Auto'
                  : currentWorkspace.autopilotMode === 'assisted'
                  ? 'Assisted Mode'
                  : 'Manual Mode'}
              </p>
            </div>
            <p className="text-[#9CA3AF] text-xs mt-0.5 leading-relaxed">
              {currentWorkspace.autopilotMode === 'full_auto'
                ? 'AI campaigns autonomously running'
                : currentWorkspace.autopilotMode === 'assisted'
                ? 'AI suggests, you approve'
                : 'AI gives suggestions only'}
            </p>
          </div>
        </div>
      )}

      {/* Bottom nav */}
      <div className="px-2 border-t border-[#E5E7EB] py-2">
        {BOTTOM_NAV.map((item) => {
          const isActive = pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`
                flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm
                transition-all duration-150 group
                ${isActive
                  ? 'bg-[#F3F4F6] text-[#111827] font-medium'
                  : 'text-[#6B7280] hover:text-[#111827] hover:bg-[#F9FAFB]'
                }
              `}
            >
              <span className={`shrink-0 ${isActive ? 'text-[#111827]' : 'text-[#9CA3AF] group-hover:text-[#6B7280]'}`}>
                {item.icon}
              </span>
              <span>{item.label}</span>
            </Link>
          )
        })}
      </div>

      {/* User info + logout */}
      <div className="px-3 py-3 border-t border-[#E5E7EB]">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-full bg-[#F3F4F6] border border-[#E5E7EB] flex items-center justify-center shrink-0">
            <span className="text-[#374151] text-xs font-semibold">
              {user?.name?.charAt(0)?.toUpperCase() ?? 'U'}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[#111827] text-xs font-medium truncate">{user?.name}</p>
            <p className="text-[#9CA3AF] text-xs truncate">{user?.email}</p>
          </div>
          <button
            onClick={handleLogout}
            title="Sign out"
            className="text-[#9CA3AF] hover:text-[#6B7280] transition-colors p-1 rounded"
          >
            <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
            </svg>
          </button>
        </div>
      </div>
    </aside>
  )
}
