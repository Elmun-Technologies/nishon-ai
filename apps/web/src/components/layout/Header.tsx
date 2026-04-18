'use client'
import { usePathname } from 'next/navigation'
import { useWorkspaceStore } from '@/stores/workspace.store'
import { useTheme } from 'next-themes'
import { Moon, Sun } from 'lucide-react'
import { useEffect, useState } from 'react'
import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher'
import { useI18n } from '@/i18n/use-i18n'

const PAGE_TITLES: Record<string, { titleKey: string; titleFallback: string; subtitleKey: string; subtitleFallback: string }> = {
  '/dashboard':            { titleKey: 'navigation.dashboard', titleFallback: 'Dashboard', subtitleKey: 'header.dashboardSubtitle', subtitleFallback: 'Overview of your advertising performance' },
  '/campaigns':            { titleKey: 'navigation.campaigns', titleFallback: 'Campaigns', subtitleKey: 'header.campaignsSubtitle', subtitleFallback: 'All campaigns managed by Performa' },
  '/audiences':            { titleKey: 'navigation.audiences', titleFallback: 'Audiences', subtitleKey: 'header.audiencesSubtitle', subtitleFallback: 'Build and launch full-funnel audiences' },
  '/ai-decisions':         { titleKey: 'navigation.aiDecisions', titleFallback: 'AI Decisions', subtitleKey: 'header.aiDecisionsSubtitle', subtitleFallback: 'Every action the AI has taken — with full reasoning' },
  '/budget':               { titleKey: 'navigation.budget', titleFallback: 'Budget', subtitleKey: 'header.budgetSubtitle', subtitleFallback: 'Allocation and performance by platform' },
  '/simulation':           { titleKey: 'navigation.simulation', titleFallback: 'Simulation', subtitleKey: 'header.simulationSubtitle', subtitleFallback: 'Forecast results before committing budget' },
  '/competitors':          { titleKey: 'navigation.competitors', titleFallback: 'Competitors', subtitleKey: 'header.competitorsSubtitle', subtitleFallback: 'Competitive intelligence and SWOT benchmarking' },
  '/creative-scorer':      { titleKey: 'navigation.creativeScorer', titleFallback: 'Creative Scorer', subtitleKey: 'header.creativeScorerSubtitle', subtitleFallback: 'AI-powered ad creative evaluation' },
  '/roi-calculator':       { titleKey: 'navigation.roi', titleFallback: 'ROI Calculator', subtitleKey: 'header.roiSubtitle', subtitleFallback: 'Estimate profitability before scaling ads' },
  '/settings':             { titleKey: 'navigation.settings', titleFallback: 'Settings', subtitleKey: 'header.settingsSubtitle', subtitleFallback: 'Workspace and account configuration' },
  '/reporting':            { titleKey: 'navigation.reporting', titleFallback: 'Reporting', subtitleKey: 'header.reportingSubtitle', subtitleFallback: 'Campaign-level metrics and trends' },
  '/marketplace':          { titleKey: 'navigation.marketplace', titleFallback: 'Marketplace', subtitleKey: 'header.marketplaceSubtitle', subtitleFallback: 'Professional marketing specialists' },
  '/launch':               { titleKey: 'navigation.launch', titleFallback: 'Launch', subtitleKey: 'header.launchSubtitle', subtitleFallback: 'Create and launch campaigns efficiently' },
  '/auto-optimization':    { titleKey: 'navigation.autoOptimization', titleFallback: 'Auto Optimization', subtitleKey: 'header.autoOptimizationSubtitle', subtitleFallback: 'Automation settings and execution policy' },
  '/landing-page':         { titleKey: 'navigation.landingPage', titleFallback: 'Landing Page', subtitleKey: 'header.landingPageSubtitle', subtitleFallback: 'AI-powered landing page builder' },
  '/my-portfolio':         { titleKey: 'navigation.portfolio', titleFallback: 'Portfolio', subtitleKey: 'header.portfolioSubtitle', subtitleFallback: 'Manage your specialist profile' },
}

export default function Header() {
  const { t } = useI18n()
  const pathname = usePathname()
  const { currentWorkspace } = useWorkspaceStore()
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const pageConfig =
    pathname.startsWith('/settings/workspace')
      ? {
          title: t('workspaceSettings.title', 'Workspace settings'),
          subtitle: currentWorkspace?.name
            ? `${currentWorkspace.name} — ${t('header.workspaceSubtitle', 'ad accounts, subscription, payments, team, MCP')}`
            : t('header.workspaceSubtitle', 'ad accounts, subscription, payments, team, MCP'),
        }
      : (() => {
          const matched = Object.entries(PAGE_TITLES).find(([route]) => pathname.startsWith(route))?.[1]
          if (!matched) return { title: 'Performa', subtitle: '' }
          return {
            title: t(matched.titleKey, matched.titleFallback),
            subtitle: t(matched.subtitleKey, matched.subtitleFallback),
          }
        })()

  useEffect(() => { setMounted(true) }, [])

  return (
    <header className="h-12 bg-surface border-b border-border px-6 flex items-center justify-between shrink-0 transition-colors">
      <div>
        <h1 className="text-text-primary font-semibold text-sm">{pageConfig.title}</h1>
        {pageConfig.subtitle && (
          <p className="text-text-tertiary text-xs mt-0.5 hidden md:block">{pageConfig.subtitle}</p>
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
            {currentWorkspace.autopilotMode === 'full_auto'
              ? t('sidebar.autopilot.fullAuto', 'Full Auto')
              : currentWorkspace.autopilotMode === 'assisted'
              ? t('sidebar.autopilot.assisted', 'Assisted')
              : t('sidebar.autopilot.manual', 'Manual')}
          </div>
        )}

        {/* Language switcher */}
        <LanguageSwitcher />

        {/* Theme toggle */}
        {mounted && (
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="p-1.5 rounded-lg text-text-secondary hover:text-text-primary hover:bg-surface-2 transition-colors"
            aria-label={t('header.toggleTheme', 'Toggle theme')}
          >
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        )}
      </div>
    </header>
  )
}
