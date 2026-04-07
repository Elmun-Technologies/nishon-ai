'use client'
import { usePathname } from 'next/navigation'
import { useWorkspaceStore } from '@/stores/workspace.store'
import { useTheme } from 'next-themes'
import { Moon, Sun } from 'lucide-react'
import { useEffect, useState } from 'react'
import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher'

const PAGE_TITLES: Record<string, { title: string; subtitle: string }> = {
  '/dashboard':            { title: 'Dashboard',         subtitle: 'Overview of your advertising performance' },
  '/campaigns':            { title: 'Campaigns',         subtitle: 'All campaigns managed by Performa' },
  '/audiences':            { title: 'Audience Launcher', subtitle: 'Build and launch full-funnel audiences' },
  '/ai-decisions':         { title: 'AI Decisions',      subtitle: 'Every action the AI has taken — with full reasoning' },
  '/budget':               { title: 'Budget',            subtitle: 'Allocation and performance by platform' },
  '/simulation':           { title: 'Simulation',        subtitle: 'Forecast results before committing budget' },
  '/competitors':          { title: 'Competitors',       subtitle: 'Audit va SWOT taqqoslash' },
  '/creative-scorer':      { title: 'Creative Scorer',   subtitle: 'AI-powered ad creative evaluation' },
  '/roi-calculator':       { title: 'ROI Kalkulyator',   subtitle: 'Performa bilan reklama foydasini hisoblash' },
  '/settings':             { title: 'Settings',          subtitle: 'Workspace and account configuration' },
  '/reporting':            { title: 'Hisobot',           subtitle: 'Meta Ads — kampaniya darajasida ko\'rsatkichlar' },
  '/marketplace':          { title: 'Marketplace',       subtitle: 'Professional marketing specialists' },
  '/launch':               { title: 'Yoqish',            subtitle: 'Kampaniya yaratish va ishga tushirish' },
  '/auto-optimization':    { title: 'Auto-Optimizatsiya',subtitle: 'Avtomatik optimallashtirish sozlamalari' },
  '/landing-page':         { title: 'Landing Page',      subtitle: 'AI-powered landing page builder' },
  '/my-portfolio':         { title: 'Portfolio',         subtitle: 'Sizning mutaxassis profilingiz' },
}

export default function Header() {
  const pathname = usePathname()
  const { currentWorkspace } = useWorkspaceStore()
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const page = PAGE_TITLES[pathname] ?? { title: 'Performa', subtitle: '' }

  useEffect(() => { setMounted(true) }, [])

  return (
    <header className="h-12 bg-surface border-b border-border px-6 flex items-center justify-between shrink-0 transition-colors">
      <div>
        <h1 className="text-text-primary font-semibold text-sm">{page.title}</h1>
        {page.subtitle && (
          <p className="text-text-tertiary text-xs mt-0.5 hidden md:block">{page.subtitle}</p>
        )}
      </div>

      <div className="flex items-center gap-3">
        {/* Autopilot badge */}
        {currentWorkspace && (
          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-medium ${
            currentWorkspace.autopilotMode === 'full_auto'
              ? 'bg-success/10 border-success/20 text-success'
              : currentWorkspace.autopilotMode === 'assisted'
              ? 'bg-warning/10 border-warning/20 text-warning'
              : 'bg-surface-2 border-border text-text-secondary'
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${
              currentWorkspace.autopilotMode === 'full_auto' ? 'bg-success animate-pulse' :
              currentWorkspace.autopilotMode === 'assisted'  ? 'bg-warning' : 'bg-text-tertiary'
            }`} />
            {currentWorkspace.autopilotMode === 'full_auto' ? 'Full Auto' :
             currentWorkspace.autopilotMode === 'assisted'  ? 'Assisted' : 'Manual'}
          </div>
        )}

        {/* Language switcher */}
        <LanguageSwitcher />

        {/* Theme toggle */}
        {mounted && (
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="p-1.5 rounded-lg text-text-secondary hover:text-text-primary hover:bg-surface-2 transition-colors"
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        )}
      </div>
    </header>
  )
}
