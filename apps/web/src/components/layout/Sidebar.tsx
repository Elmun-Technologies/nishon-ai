'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useWorkspaceStore } from '@/stores/workspace.store'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard, Globe, Megaphone, BarChart3, Bot, DollarSign,
  FlaskConical, Zap, RefreshCw, Swords, Image, Calculator,
  TrendingUp, Settings, LogOut, ChevronDown,
} from 'lucide-react'

const NAV_ITEMS = [
  { href: '/dashboard',         label: 'Dashboard',              icon: LayoutDashboard },
  { href: '/platforms',         label: 'Platformalar',           icon: Globe },
  { href: '/campaigns',         label: 'Campaigns',              icon: Megaphone },
  { href: '/reporting',         label: 'Hisobot',                icon: BarChart3 },
  { href: '/ai-decisions',      label: 'AI Decisions',           icon: Bot,   badge: true },
  { href: '/budget',            label: 'Budget',                 icon: DollarSign },
  { href: '/simulation',        label: 'Simulation',             icon: FlaskConical },
  { href: '/triggersets',       label: 'Triggersetlar',          icon: Zap },
  { href: '/auto-optimization', label: 'Auto-Optimallashtirish', icon: RefreshCw },
  { href: '/competitors',       label: 'Competitors',            icon: Swords },
  { href: '/creative-scorer',   label: 'Creative Scorer',        icon: Image },
  { href: '/roi-calculator',    label: 'ROI Kalkulyator',        icon: Calculator },
  { href: '/my-portfolio',      label: 'Portfolio',              icon: TrendingUp },
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
    <aside className="w-64 bg-background border-r flex flex-col shrink-0">
      {/* Workspace header */}
      <div className="px-4 py-3 border-b">
        <button className="flex items-center gap-2.5 w-full rounded-md px-1 py-1.5 hover:bg-accent transition-colors">
          <div className="w-7 h-7 rounded-lg bg-foreground flex items-center justify-center shrink-0">
            <span className="text-background font-bold text-xs">N</span>
          </div>
          <div className="flex-1 text-left min-w-0">
            <p className="text-sm font-semibold truncate leading-tight">
              {currentWorkspace?.name ?? 'Nishon AI'}
            </p>
            <p className="text-xs text-muted-foreground truncate">Workspace</p>
          </div>
          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon
          const isActive =
            item.href === '/dashboard'
              ? pathname === '/dashboard'
              : pathname.startsWith(item.href)

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-2.5 px-2.5 py-2 rounded-md text-sm transition-colors group',
                isActive
                  ? 'bg-accent text-accent-foreground font-medium'
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
              )}
            >
              <Icon className={cn('h-4 w-4 shrink-0', isActive ? 'text-foreground' : 'text-muted-foreground group-hover:text-foreground')} />
              <span className="flex-1 truncate">{item.label}</span>
              {item.badge && (
                <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
              )}
            </Link>
          )
        })}
      </nav>

      {/* Autopilot indicator */}
      {currentWorkspace && (
        <div className="px-3 pb-2">
          <div className="bg-muted/50 border rounded-lg px-3 py-2.5">
            <div className="flex items-center gap-2">
              <span className={cn(
                'w-1.5 h-1.5 rounded-full shrink-0',
                currentWorkspace.autopilotMode === 'full_auto' ? 'bg-emerald-500 animate-pulse' :
                currentWorkspace.autopilotMode === 'assisted' ? 'bg-amber-500' : 'bg-muted-foreground'
              )} />
              <p className="text-xs font-medium">
                {currentWorkspace.autopilotMode === 'full_auto' ? 'Full Auto' :
                 currentWorkspace.autopilotMode === 'assisted' ? 'Assisted Mode' : 'Manual Mode'}
              </p>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              {currentWorkspace.autopilotMode === 'full_auto' ? 'AI campaigns autonomously running' :
               currentWorkspace.autopilotMode === 'assisted' ? 'AI suggests, you approve' : 'AI gives suggestions only'}
            </p>
          </div>
        </div>
      )}

      <Separator />

      <div className="px-2 py-2">
        <Link
          href="/settings"
          className={cn(
            'flex items-center gap-2.5 px-2.5 py-2 rounded-md text-sm transition-colors',
            pathname.startsWith('/settings')
              ? 'bg-accent text-accent-foreground font-medium'
              : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
          )}
        >
          <Settings className="h-4 w-4 shrink-0" />
          <span>Settings</span>
        </Link>
      </div>

      {/* User info */}
      <div className="px-3 py-3 border-t">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-full bg-muted border flex items-center justify-center shrink-0">
            <span className="text-foreground text-xs font-semibold">
              {user?.name?.charAt(0)?.toUpperCase() ?? 'U'}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium truncate">{user?.name}</p>
            <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
          </div>
          <Button variant="ghost" size="icon" onClick={handleLogout} className="h-7 w-7 shrink-0" title="Sign out">
            <LogOut className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </aside>
  )
}
