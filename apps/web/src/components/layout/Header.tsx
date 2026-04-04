'use client'
import { usePathname } from 'next/navigation'
import { useWorkspaceStore } from '@/stores/workspace.store'

const PAGE_TITLES: Record<string, { title: string; subtitle: string }> = {
  '/dashboard': {
    title: 'Dashboard',
    subtitle: 'Overview of your advertising performance',
  },
  '/campaigns': {
    title: 'Campaigns',
    subtitle: 'All campaigns managed by Performa',
  },
  '/ai-decisions': {
    title: 'AI Decisions',
    subtitle: 'Every action the AI has taken — with full reasoning',
  },
  '/budget': {
    title: 'Budget',
    subtitle: 'Allocation and performance by platform',
  },
  '/simulation': {
    title: 'Simulation',
    subtitle: 'Forecast results before committing budget',
  },
  '/competitors': {
    title: 'Competitors',
    subtitle: "Audit va SWOT taqqoslash",
  },
  '/creative-scorer': {
    title: 'Creative Scorer',
    subtitle: 'AI-powered ad creative evaluation',
  },
  '/roi-calculator': {
    title: 'ROI Kalkulyator',
    subtitle: 'Performa bilan reklama foydasini hisoblash',
  },
  '/settings': {
    title: 'Settings',
    subtitle: 'Workspace and account configuration',
  },
}

export default function Header() {
  const pathname = usePathname()
  const { currentWorkspace } = useWorkspaceStore()
  const page = PAGE_TITLES[pathname] ?? { title: 'Performa', subtitle: '' }

  return (
    <header className="h-14 bg-surface border-b border-border px-6 flex items-center justify-between shrink-0">
      <div>
        <h1 className="heading text-text-primary">{page.title}</h1>
        {page.subtitle && (
          <p className="text-caption text-text-tertiary mt-0.5">{page.subtitle}</p>
        )}
      </div>

      <div className="flex items-center gap-2">
        {/* Autopilot mode badge */}
        {currentWorkspace && (
          <div
            className={`
              flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium
              transition-colors duration-200
              ${
                currentWorkspace.autopilotMode === 'full_auto'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                  : currentWorkspace.autopilotMode === 'assisted'
                    ? 'bg-amber-50 border-amber-200 text-amber-700'
                    : 'bg-surface-secondary border-border text-text-secondary'
              }
            `}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                currentWorkspace.autopilotMode === 'full_auto'
                  ? 'bg-emerald-500 animate-pulse'
                  : currentWorkspace.autopilotMode === 'assisted'
                    ? 'bg-amber-500'
                    : 'bg-gray-400'
              }`}
            />
            {currentWorkspace.autopilotMode === 'full_auto'
              ? 'Full Auto'
              : currentWorkspace.autopilotMode === 'assisted'
                ? 'Assisted'
                : 'Manual'}
          </div>
        )}
      </div>
    </header>
  )
}
