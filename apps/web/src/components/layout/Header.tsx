'use client'
import { usePathname } from 'next/navigation'
import { useWorkspaceStore } from '@/stores/workspace.store'
import { useTheme } from 'next-themes'
import { Moon, Sun } from 'lucide-react'
import { useEffect, useState } from 'react'

const PAGE_TITLES: Record<string, { title: string; subtitle: string }> = {
  '/dashboard': {
    title: 'Dashboard',
    subtitle: 'Overview of your advertising performance',
  },
  '/campaigns': {
    title: 'Campaigns',
    subtitle: 'All campaigns managed by Performa',
  },
  '/audiences': {
    title: 'Audience Launcher',
    subtitle: 'Build and launch full-funnel audiences with AI-assisted presets',
  },
  '/platform-architecture': {
    title: 'Platform Blueprint',
    subtitle: 'Full multi-network architecture, modules, roadmap, and execution checklist',
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
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const page = PAGE_TITLES[pathname] ?? { title: 'Performa', subtitle: '' }

  useEffect(() => {
    setMounted(true)
  }, [])

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark')
  }

  return (
    <header className="h-14 bg-white dark:bg-slate-900 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 px-6 flex items-center justify-between shrink-0 transition-colors">
      <div>
        <h1 className="text-slate-900 dark:text-slate-50 font-semibold text-sm">{page.title}</h1>
        {page.subtitle && (
          <p className="text-slate-500 dark:text-slate-400 text-xs mt-0.5">{page.subtitle}</p>
        )}
      </div>

      <div className="flex items-center gap-4">
        {/* Autopilot mode badge */}
        {currentWorkspace && (
          <div
            className={`
              flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-medium transition-colors
              ${currentWorkspace.autopilotMode === 'full_auto'
                ? 'bg-emerald-50 dark:bg-emerald-950 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300'
                : currentWorkspace.autopilotMode === 'assisted'
                ? 'bg-amber-50 dark:bg-amber-950 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300'
                : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
              }
            `}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                currentWorkspace.autopilotMode === 'full_auto'
                  ? 'bg-emerald-500 animate-pulse'
                  : currentWorkspace.autopilotMode === 'assisted'
                  ? 'bg-amber-500'
                  : 'bg-slate-400'
              }`}
            />
            {currentWorkspace.autopilotMode === 'full_auto'
              ? 'Full Auto'
              : currentWorkspace.autopilotMode === 'assisted'
              ? 'Assisted'
              : 'Manual'}
          </div>
        )}

        {/* Theme toggle */}
        {mounted && (
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-600 dark:text-slate-400"
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4" />
            ) : (
              <Moon className="w-4 h-4" />
            )}
          </button>
        )}
      </div>
    </header>
  )
}
