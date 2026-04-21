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
  '/campaigns':            { titleKey: 'navigation.campaigns', titleFallback: 'Campaigns', subtitleKey: 'header.campaignsSubtitle', subtitleFallback: 'All campaigns managed by AdSpectr' },
  '/audiences/story':      { titleKey: 'audienceStory.pageTitle', titleFallback: 'Audience Story', subtitleKey: 'header.audienceStorySubtitle', subtitleFallback: 'Persona narrative, journey, interests, creative fit, and competitor timing' },
  '/audiences/studio':     { titleKey: 'audiences.studioTitle', titleFallback: 'Audience Studio', subtitleKey: 'header.audienceStudioSubtitle', subtitleFallback: 'Performance table and audience mixer' },
  '/audiences':            { titleKey: 'navigation.audiences', titleFallback: 'Audiences', subtitleKey: 'header.audiencesSubtitle', subtitleFallback: 'Build and launch full-funnel audiences' },
  '/ai-decisions':         { titleKey: 'navigation.aiDecisions', titleFallback: 'AI Decisions', subtitleKey: 'header.aiDecisionsSubtitle', subtitleFallback: 'Every action the AI has taken — with full reasoning' },
  '/budget':               { titleKey: 'navigation.budget', titleFallback: 'Budget', subtitleKey: 'header.budgetSubtitle', subtitleFallback: 'Allocation and performance by platform' },
  '/simulation':           { titleKey: 'navigation.simulation', titleFallback: 'Simulation', subtitleKey: 'header.simulationSubtitle', subtitleFallback: 'Forecast results before committing budget' },
  '/competitors':          { titleKey: 'navigation.competitors', titleFallback: 'Competitors', subtitleKey: 'header.competitorsSubtitle', subtitleFallback: 'Meta Ad Library signals plus AI portfolio synthesis' },
  '/ad-library':           { titleKey: 'navigation.adLibrary', titleFallback: 'Ad Library', subtitleKey: 'header.adLibrarySubtitle', subtitleFallback: 'Competitive ads intelligence for Uzbekistan — filters, scoring, Creative Hub handoff' },
  '/creative-scorer':      { titleKey: 'navigation.creativeScorer', titleFallback: 'Creative Scorer', subtitleKey: 'header.creativeScorerSubtitle', subtitleFallback: 'AI-powered ad creative evaluation' },
  '/roi-calculator':       { titleKey: 'navigation.roi', titleFallback: 'ROI & outcomes', subtitleKey: 'header.roiSubtitle', subtitleFallback: 'We learn from real outcomes first; the ROI calculator launches when benchmark data is ready.' },
  '/settings':             { titleKey: 'navigation.settings', titleFallback: 'Settings', subtitleKey: 'header.settingsSubtitle', subtitleFallback: 'Workspace and account configuration' },
  '/reporting':            { titleKey: 'navigation.reporting', titleFallback: 'Reporting', subtitleKey: 'header.reportingSubtitle', subtitleFallback: 'Campaign-level metrics and trends' },
  '/reports':              { titleKey: 'navigation.reportBuilder', titleFallback: 'Report builder', subtitleKey: 'header.reportBuilderSubtitle', subtitleFallback: 'Metric library, canvas, and saved layouts by persona' },
  '/meta-audit':           { titleKey: 'navigation.metaAudit', titleFallback: 'Meta Audit', subtitleKey: 'header.metaAuditSubtitle', subtitleFallback: '360° creative, targeting, and auction diagnostics' },
  '/retargeting/wizard':   { titleKey: 'navigation.retargeting', titleFallback: 'Retargeting', subtitleKey: 'header.retargetingWizardSubtitle', subtitleFallback: 'Step-by-step retargeting setup' },
  '/retargeting':          { titleKey: 'navigation.retargeting', titleFallback: 'Retargeting', subtitleKey: 'header.retargetingSubtitle', subtitleFallback: 'Audiences and flows for bringing visitors back' },
  '/retarget':             { titleKey: 'navigation.signalBridge', titleFallback: 'Signal Bridge (CRM)', subtitleKey: 'header.signalBridgeSubtitle', subtitleFallback: 'Post-purchase Redis signals and repeat-buy flow' },
  '/wizard':               { titleKey: 'navigation.campaignWizard', titleFallback: 'Campaign wizard', subtitleKey: 'header.wizardSubtitle', subtitleFallback: 'Guided setup for campaigns and workspace' },
  '/performance':        { titleKey: 'navigation.performance', titleFallback: 'Performance', subtitleKey: 'header.performanceSubtitle', subtitleFallback: 'Campaign table from Meta reporting for the selected period' },
  '/creative-hub':         { titleKey: 'navigation.creativeHub', titleFallback: 'Creative Hub', subtitleKey: 'header.creativeHubSubtitle', subtitleFallback: 'Image ads, actors, brand kit, and media in one place' },
  '/marketplace/search':   { titleKey: 'navigation.marketplaceSearch', titleFallback: 'Browse specialists', subtitleKey: 'header.marketplaceSearchSubtitle', subtitleFallback: 'Search and filter marketing specialists for your business' },
  '/marketplace/leaderboard': { titleKey: 'navigation.leaderboard', titleFallback: 'Leaderboard', subtitleKey: 'header.marketplaceLeaderboardSubtitle', subtitleFallback: 'Top performers and benchmark visibility' },
  '/marketplace/portfolio': { titleKey: 'navigation.marketplacePortfolios', titleFallback: 'Portfolios', subtitleKey: 'header.marketplacePortfoliosSubtitle', subtitleFallback: 'Public specialist showcases on the marketplace' },
  '/marketplace':          { titleKey: 'navigation.marketplace', titleFallback: 'Marketplace', subtitleKey: 'header.marketplaceSubtitle', subtitleFallback: 'Professional marketing specialists' },
  '/launch':               { titleKey: 'navigation.launch', titleFallback: 'Launch', subtitleKey: 'header.launchSubtitle', subtitleFallback: 'Create and launch campaigns efficiently' },
  '/auto-optimization':    { titleKey: 'navigation.autoOptimization', titleFallback: 'Auto Optimization', subtitleKey: 'header.autoOptimizationSubtitle', subtitleFallback: 'Automation settings and execution policy' },
  '/automation/wizard':    { titleKey: 'automationWizard.pageTitle', titleFallback: 'Automation wizard', subtitleKey: 'header.automationWizardSubtitle', subtitleFallback: 'Build rules with steps, conditions, and schedules' },
  '/automation':           { titleKey: 'navigation.automation', titleFallback: 'Automation', subtitleKey: 'header.automationSubtitle', subtitleFallback: 'Tactics, triggers, and automation health' },
  '/ad-launcher':          { titleKey: 'navigation.adLauncher', titleFallback: 'Ad Launcher', subtitleKey: 'header.adLauncherSubtitle', subtitleFallback: 'Select ads, presets, and creative bundles' },
  '/landing-page':         { titleKey: 'navigation.landingPage', titleFallback: 'Landing Page', subtitleKey: 'header.landingPageSubtitle', subtitleFallback: 'AI-powered landing page builder' },
  '/my-portfolio':         { titleKey: 'navigation.portfolio', titleFallback: 'Portfolio', subtitleKey: 'header.portfolioSubtitle', subtitleFallback: 'Manage your specialist profile' },
}

export default function Header() {
  const { t } = useI18n()
  const pathname = usePathname()
  const { currentWorkspace } = useWorkspaceStore()
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const hideTitleForPageHeaderRoutes =
    pathname === '/dashboard' ||
    pathname === '/campaigns' ||
    pathname === '/reporting' ||
    pathname === '/reports' ||
    pathname === '/ad-library' ||
    pathname === '/meta-audit' ||
    pathname === '/automation' ||
    pathname.startsWith('/automation/wizard') ||
    pathname === '/ad-launcher' ||
    pathname === '/audiences/studio' ||
    pathname === '/audiences/story' ||
    pathname === '/settings' ||
    pathname.startsWith('/settings/workspace') ||
    pathname === '/create-agent' ||
    pathname === '/creative-hub/ai-actors' ||
    pathname === '/creative-hub/projects' ||
    pathname === '/creative-hub/brand-kit' ||
    pathname === '/creative-hub/products' ||
    pathname === '/creative-hub/media' ||
    pathname.startsWith('/creative-hub/image-ads') ||
    pathname === '/retarget'
  const pageConfig =
    pathname.startsWith('/settings/workspace')
      ? {
          title: t('workspaceSettings.title', 'Workspace settings'),
          subtitle: currentWorkspace?.name
            ? `${currentWorkspace.name} — ${t('header.workspaceSubtitle', 'ad accounts, subscription, payments, team, MCP')}`
            : t('header.workspaceSubtitle', 'ad accounts, subscription, payments, team, MCP'),
        }
      : (() => {
          const matched = [...Object.entries(PAGE_TITLES)]
            .sort((a, b) => b[0].length - a[0].length)
            .find(([route]) => pathname.startsWith(route))?.[1]
          if (!matched) return { title: 'AdSpectr', subtitle: '' }
          return {
            title: t(matched.titleKey, matched.titleFallback),
            subtitle: t(matched.subtitleKey, matched.subtitleFallback),
          }
        })()

  useEffect(() => { setMounted(true) }, [])

  return (
    <header className="flex h-12 shrink-0 items-center justify-between border-b border-border/60 bg-brand-white/90 px-4 backdrop-blur-md transition-colors supports-[backdrop-filter]:bg-brand-white/80 md:px-5 dark:border-white/[0.08] dark:bg-[#161618]/95">
      <div className="min-w-0 pr-2">
        {!hideTitleForPageHeaderRoutes && (
          <>
            <h1 className="truncate text-sm font-semibold tracking-tight text-text-primary">{pageConfig.title}</h1>
            {pageConfig.subtitle && (
              <p className="mt-0.5 hidden max-w-2xl truncate text-xs text-text-tertiary md:block">{pageConfig.subtitle}</p>
            )}
          </>
        )}
      </div>

      <div className="flex shrink-0 items-center gap-2 md:gap-2.5">
        {currentWorkspace && (
          <div
            className={`hidden items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium sm:flex ${
              currentWorkspace.autopilotMode === 'full_auto'
                ? 'border-success/25 bg-success/10 text-success'
                : currentWorkspace.autopilotMode === 'assisted'
                  ? 'border-amber-500/25 bg-amber-500/10 text-amber-700 dark:text-amber-400'
                  : 'border-border bg-surface-2/80 text-text-secondary dark:border-white/10 dark:bg-white/[0.05]'
            }`}
          >
            <span
              className={`h-1.5 w-1.5 shrink-0 rounded-full ${
                currentWorkspace.autopilotMode === 'full_auto'
                  ? 'animate-pulse bg-success'
                  : currentWorkspace.autopilotMode === 'assisted'
                    ? 'bg-warning'
                    : 'bg-text-tertiary'
              }`}
            />
            {currentWorkspace.autopilotMode === 'full_auto'
              ? t('sidebar.autopilot.fullAuto', 'Full Auto')
              : currentWorkspace.autopilotMode === 'assisted'
                ? t('sidebar.autopilot.assisted', 'Assisted')
                : t('sidebar.autopilot.manual', 'Manual')}
          </div>
        )}

        <LanguageSwitcher />

        {mounted && (
          <button
            type="button"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="rounded-lg p-1.5 text-text-secondary transition-colors hover:bg-surface-2 hover:text-text-primary dark:hover:bg-white/[0.08]"
            aria-label={t('header.toggleTheme', 'Toggle theme')}
          >
            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
        )}
      </div>
    </header>
  )
}
