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
    subtitle: "Audit va SWOT taqqoslash",
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
    <header className="h-14 bg-white border-b border-[#E5E7EB] px-6 flex items-center justify-between shrink-0">
      <div>
        <h1 className="text-[#111827] font-semibold text-sm">{page.title}</h1>
        {page.subtitle && (
          <p className="text-[#9CA3AF] text-xs mt-0.5">{page.subtitle}</p>
        )}
      </div>

      <div className="flex items-center gap-2">
        {/* Autopilot mode badge */}
        {currentWorkspace && (
          <div
            className={`
              flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-medium
              ${currentWorkspace.autopilotMode === 'full_auto'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                : currentWorkspace.autopilotMode === 'assisted'
                ? 'bg-amber-50 border-amber-200 text-amber-700'
                : 'bg-gray-100 border-gray-200 text-gray-600'
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
