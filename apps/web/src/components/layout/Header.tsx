'use client'
import { usePathname } from 'next/navigation'
import { useWorkspaceStore } from '@/stores/workspace.store'
import { Badge } from '@/components/ui/badge'

const PAGE_TITLES: Record<string, { title: string; subtitle: string }> = {
  '/dashboard':         { title: 'Dashboard',        subtitle: 'Overview of your advertising performance' },
  '/campaigns':         { title: 'Campaigns',         subtitle: 'All campaigns managed by Nishon AI' },
  '/ai-decisions':      { title: 'AI Decisions',      subtitle: 'Every action the AI has taken — with full reasoning' },
  '/budget':            { title: 'Budget',             subtitle: 'Allocation and performance by platform' },
  '/simulation':        { title: 'Simulation',         subtitle: 'Forecast results before committing budget' },
  '/competitors':       { title: 'Competitors',        subtitle: 'Audit va SWOT taqqoslash' },
  '/creative-scorer':   { title: 'Creative Scorer',    subtitle: 'AI-powered ad creative evaluation' },
  '/roi-calculator':    { title: 'ROI Kalkulyator',    subtitle: 'Nishon AI bilan reklama foydasini hisoblash' },
  '/settings':          { title: 'Settings',           subtitle: 'Workspace and account configuration' },
  '/platforms':         { title: 'Platformalar',       subtitle: 'Ulangan reklama platformalari' },
  '/reporting':         { title: 'Hisobot',            subtitle: 'Performance hisobotlari' },
  '/triggersets':       { title: 'Triggersetlar',      subtitle: 'Avtomatik qoidalar' },
  '/auto-optimization': { title: 'Auto-Optimallashtirish', subtitle: 'AI avtomatik optimallashtiruv' },
  '/my-portfolio':      { title: 'Portfolio',          subtitle: 'Portfolio boshqaruvi' },
}

export default function Header() {
  const pathname = usePathname()
  const { currentWorkspace } = useWorkspaceStore()
  const page = PAGE_TITLES[pathname] ?? { title: 'Nishon AI', subtitle: '' }

  return (
    <header className="h-14 bg-background border-b px-6 flex items-center justify-between shrink-0">
      <div>
        <h1 className="text-sm font-semibold">{page.title}</h1>
        {page.subtitle && (
          <p className="text-xs text-muted-foreground mt-0.5">{page.subtitle}</p>
        )}
      </div>

      <div className="flex items-center gap-2">
        {currentWorkspace && (
          <Badge
            variant={
              currentWorkspace.autopilotMode === 'full_auto' ? 'success' :
              currentWorkspace.autopilotMode === 'assisted' ? 'warning' : 'secondary'
            }
            className="gap-1.5"
          >
            <span className={`w-1.5 h-1.5 rounded-full ${
              currentWorkspace.autopilotMode === 'full_auto' ? 'bg-emerald-500 animate-pulse' :
              currentWorkspace.autopilotMode === 'assisted' ? 'bg-amber-500' : 'bg-muted-foreground'
            }`} />
            {currentWorkspace.autopilotMode === 'full_auto' ? 'Full Auto' :
             currentWorkspace.autopilotMode === 'assisted' ? 'Assisted' : 'Manual'}
          </Badge>
        )}
      </div>
    </header>
  )
}
