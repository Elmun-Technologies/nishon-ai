'use client'
import { usePathname } from 'next/navigation'
import { useWorkspaceStore } from '@/stores/workspace.store'

// Maps route paths to human-readable page titles
const PAGE_TITLES: Record<string, { title: string; subtitle: string }> = {
  '/dashboard': {
    title: 'Dashboard',
    subtitle: 'Overview of your advertising performance',
  },
  '/campaigns': {
    title: 'Campaigns',
    subtitle: 'All campaigns managed by Nishon AI',
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
    subtitle: "12 bo‘limli audit va SWOT taqqoslash",
  },
  '/creative-scorer': {
    title: 'Creative Scorer',
    subtitle: 'AI-powered ad creative evaluation',
  },
  '/roi-calculator': {
    title: 'ROI Kalkulyator',
    subtitle: 'Nishon AI bilan reklama foydasini hisoblash',
  },
  '/settings': {
    title: 'Settings',
    subtitle: 'Workspace and account configuration',
  },
}

export default function Header() {
  const pathname = usePathname()
  const { currentWorkspace } = useWorkspaceStore()
  const page = PAGE_TITLES[pathname] ?? { title: 'Nishon AI', subtitle: '' }

  return (
    <header className="h-16 bg-[#13131A] border-b border-[#2A2A3A] px-6 flex items-center justify-between shrink-0">
      <div>
        <h1 className="text-white font-semibold text-base">{page.title}</h1>
        {page.subtitle && (
          <p className="text-[#6B7280] text-xs mt-0.5">{page.subtitle}</p>
        )}
      </div>

      <div className="flex items-center gap-3">
        {/* Autopilot mode badge */}
        {currentWorkspace && (
          <div
            className={`
              flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-medium
              ${currentWorkspace.autopilotMode === 'full_auto'
                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                : currentWorkspace.autopilotMode === 'assisted'
                ? 'bg-amber-500/10 border-amber-500/20 text-amber-400'
                : 'bg-[#2A2A3A] border-[#3A3A4A] text-[#9CA3AF]'
              }
            `}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                currentWorkspace.autopilotMode === 'full_auto'
                  ? 'bg-emerald-400 animate-pulse'
                  : currentWorkspace.autopilotMode === 'assisted'
                  ? 'bg-amber-400'
                  : 'bg-[#6B7280]'
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