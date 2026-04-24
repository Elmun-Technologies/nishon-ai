'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useWorkspaceStore } from '@/stores/workspace.store'
import { useI18n } from '@/i18n/use-i18n'
import {
  Building2,
  ChevronDown,
  ChevronRight,
  CreditCard,
  Users,
  Globe,
  Zap,
  HelpCircle,
  BarChart3,
  User,
  Settings as SettingsIcon,
  Menu,
  X,
  Search,
  Star,
  History,
  Shield,
  LineChart,
  Rocket,
  Copy
} from 'lucide-react'
import { useState, useMemo, useEffect, useRef } from 'react'
import { useFavoriteSettings } from '@/hooks/useFavoriteSettings'

interface NavSection {
  title: string;
  titleKey: string;
  icon: React.ReactNode;
  items: {
    href: string;
    label: string;
    labelKey: string;
    icon: React.ReactNode;
    description?: string;
    descriptionKey?: string;
  }[];
}

const NAV_SECTIONS: NavSection[] = [
  {
    title: 'Getting Started',
    titleKey: 'workspaceSettings.sections.gettingStarted',
    icon: <Rocket className="h-4 w-4" />,
    items: [
      {
        href: '/settings/workspace/setup',
        label: 'Setup Wizard',
        labelKey: 'workspaceSettings.tabs.setup',
        icon: <Rocket className="h-4 w-4" />,
        description: 'Step-by-step guide to set up your workspace',
        descriptionKey: 'workspaceSettings.descriptions.setup',
      },
    ],
  },
  {
    title: 'Account Management',
    titleKey: 'workspaceSettings.sections.account',
    icon: <SettingsIcon className="h-4 w-4" />,
    items: [
      {
        href: '/settings/workspace/ad-accounts',
        label: 'Ad Accounts',
        labelKey: 'workspaceSettings.tabs.adAccounts',
        icon: <BarChart3 className="h-4 w-4" />,
        description: 'Connect and manage advertising platforms',
        descriptionKey: 'workspaceSettings.descriptions.adAccounts',
      },
      {
        href: '/settings/workspace/products',
        label: 'Products & Usage',
        labelKey: 'workspaceSettings.tabs.products',
        icon: <BarChart3 className="h-4 w-4" />,
        description: 'View your subscription and usage metrics',
        descriptionKey: 'workspaceSettings.descriptions.products',
      },
      {
        href: '/settings/workspace/payments',
        label: 'Payments',
        labelKey: 'workspaceSettings.tabs.payments',
        icon: <CreditCard className="h-4 w-4" />,
        description: 'Manage billing and payment methods',
        descriptionKey: 'workspaceSettings.descriptions.payments',
      },
      {
        href: '/settings/workspace/templates',
        label: 'Templates',
        labelKey: 'workspaceSettings.tabs.templates',
        icon: <Copy className="h-4 w-4" />,
        description: 'Save and reuse configuration templates',
        descriptionKey: 'workspaceSettings.descriptions.templates',
      },
    ],
  },
  {
    title: 'Profile & Preferences',
    titleKey: 'workspaceSettings.sections.profile',
    icon: <User className="h-4 w-4" />,
    items: [
      {
        href: '/settings/workspace/profile',
        label: 'User Profile',
        labelKey: 'workspaceSettings.tabs.profile',
        icon: <User className="h-4 w-4" />,
        description: 'Update your personal information',
        descriptionKey: 'workspaceSettings.descriptions.profile',
      },
      {
        href: '/settings/workspace/language',
        label: 'Language',
        labelKey: 'workspaceSettings.tabs.language',
        icon: <Globe className="h-4 w-4" />,
        description: 'Choose your preferred language',
        descriptionKey: 'workspaceSettings.descriptions.language',
      },
    ],
  },
  {
    title: 'Collaboration',
    titleKey: 'workspaceSettings.sections.collaboration',
    icon: <Users className="h-4 w-4" />,
    items: [
      {
        href: '/settings/workspace/team',
        label: 'Team Members',
        labelKey: 'workspaceSettings.tabs.team',
        icon: <Users className="h-4 w-4" />,
        description: 'Manage team members and permissions',
        descriptionKey: 'workspaceSettings.descriptions.team',
      },
    ],
  },
  {
    title: 'Integrations & Support',
    titleKey: 'workspaceSettings.sections.integrations',
    icon: <Zap className="h-4 w-4" />,
    items: [
      {
        href: '/settings/workspace/mcp',
        label: 'MCP Integration',
        labelKey: 'workspaceSettings.tabs.mcp',
        icon: <Zap className="h-4 w-4" />,
        description: 'Configure MCP integrations',
        descriptionKey: 'workspaceSettings.descriptions.mcp',
      },
      {
        href: '/settings/workspace/help',
        label: 'Resource Center',
        labelKey: 'workspaceSettings.tabs.help',
        icon: <HelpCircle className="h-4 w-4" />,
        description: 'Documentation and support resources',
        descriptionKey: 'workspaceSettings.descriptions.help',
      },
    ],
  },
  {
    title: 'Audit & Security',
    titleKey: 'workspaceSettings.sections.audit',
    icon: <Shield className="h-4 w-4" />,
    items: [
      {
        href: '/settings/workspace/history',
        label: 'Activity Log',
        labelKey: 'workspaceSettings.tabs.history',
        icon: <History className="h-4 w-4" />,
        description: 'Track all settings changes',
        descriptionKey: 'workspaceSettings.descriptions.history',
      },
      {
        href: '/settings/workspace/analytics',
        label: 'Usage Analytics',
        labelKey: 'workspaceSettings.tabs.analytics',
        icon: <LineChart className="h-4 w-4" />,
        description: 'Track which settings are most used',
        descriptionKey: 'workspaceSettings.descriptions.analytics',
      },
    ],
  },
]

export default function WorkspaceSettingsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const { currentWorkspace } = useWorkspaceStore()
  const { t } = useI18n()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const { favorites, isFavorite, toggleFavorite, isLoaded } = useFavoriteSettings()

  const isActive = (href: string) => {
    return pathname === href || (href === '/settings/workspace/ad-accounts' && pathname === '/settings/workspace')
  }

  const getCurrentPageLabel = () => {
    for (const section of NAV_SECTIONS) {
      for (const item of section.items) {
        if (isActive(item.href)) {
          return { section: section.title, page: item.label }
        }
      }
    }
    return null
  }

  const filteredSections = useMemo(() => {
    if (!searchQuery.trim()) return NAV_SECTIONS

    return NAV_SECTIONS.map(section => ({
      ...section,
      items: section.items.filter(item =>
        item.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        section.title.toLowerCase().includes(searchQuery.toLowerCase())
      )
    })).filter(section => section.items.length > 0)
  }, [searchQuery])

  const currentPage = getCurrentPageLabel()
  const searchInputRef = useRef<HTMLInputElement>(null)

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + K to focus search
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        searchInputRef.current?.focus()
      }

      // Escape to close sidebar on mobile
      if (e.key === 'Escape' && sidebarOpen) {
        setSidebarOpen(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [sidebarOpen])

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="relative border-b border-border/50 bg-gradient-to-b from-white to-white/95 dark:from-slate-950 dark:to-slate-950/95 backdrop-blur-sm">
        <div className="absolute inset-0 bg-gradient-to-r from-violet-50/30 to-transparent dark:from-violet-950/10 dark:to-transparent pointer-events-none" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4 min-w-0">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden inline-flex items-center justify-center rounded-lg border border-border bg-surface/80 p-2 text-text-secondary hover:bg-surface-2 hover:text-text-primary transition-all duration-200 hover:scale-105"
                aria-label="Toggle navigation"
              >
                {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold uppercase tracking-wider text-violet-600 dark:text-violet-400">
                  {t('workspaceSettings.title', 'Workspace Settings')}
                </p>
                <div className="mt-3 flex items-center gap-3 flex-wrap">
                  <h1 className="text-3xl font-bold tracking-tight text-text-primary">
                    {t('workspaceSettings.title', 'Workspace Settings')}
                  </h1>
                  <button
                    type="button"
                    className="hidden sm:inline-flex items-center gap-2 rounded-lg border border-border/80 bg-white/50 px-3 py-2 text-sm font-medium text-text-primary backdrop-blur hover:bg-white/80 hover:border-violet-400/50 dark:bg-slate-800/50 dark:hover:bg-slate-800 transition-all duration-200 group"
                    aria-label={t('workspaceSettings.workspace', 'Workspace')}
                  >
                    <Building2 className="h-4 w-4 text-violet-500 group-hover:scale-110 transition-transform" />
                    <span className="max-w-[250px] truncate">{currentWorkspace?.name ?? t('workspaceSettings.workspace', 'Workspace')}</span>
                    <ChevronDown className="h-4 w-4 text-text-tertiary group-hover:text-violet-600 transition-all group-hover:rotate-180" />
                  </button>
                </div>
                <p className="mt-2 text-sm text-text-tertiary">
                  {t(
                    'workspaceSettings.shellSubtitle',
                    'Manage accounts, billing, team, and integrations in one place.',
                  )}
                </p>
              </div>
            </div>
            <Link
              href="/settings"
              className="shrink-0 inline-flex items-center justify-center rounded-lg border border-border bg-surface/80 px-4 py-2 text-sm font-medium text-text-secondary transition-all duration-200 hover:bg-surface-2 hover:text-text-primary hover:scale-105"
            >
              ← {t('workspaceSettings.classicSettings', 'Back to Settings')}
            </Link>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-4 lg:gap-12">
          {/* Mobile Overlay */}
          {sidebarOpen && (
            <div
              className="fixed inset-0 top-[120px] z-40 bg-black/50 lg:hidden"
              onClick={() => setSidebarOpen(false)}
              aria-hidden="true"
            />
          )}

          {/* Sidebar Navigation */}
          <aside
            className={`
              fixed inset-x-0 top-[120px] bottom-0 z-50 overflow-y-auto border-r border-border/50 bg-white p-4 transition-all dark:bg-slate-950
              lg:relative lg:inset-auto lg:top-auto lg:bottom-auto lg:z-auto lg:overflow-visible lg:border-r-0 lg:bg-transparent lg:p-0
              ${sidebarOpen ? 'block' : 'hidden lg:block'}
            `}
          >
            {/* Favorites Section */}
            {isLoaded && favorites.length > 0 && (
              <div className="mb-6 hidden lg:block">
                <h3 className="mb-3 flex items-center gap-2 px-3 text-xs font-semibold uppercase tracking-wider text-text-tertiary">
                  <Star className="h-4 w-4 fill-amber-500 text-amber-500" />
                  Favorites
                </h3>
                <div className="space-y-1">
                  {favorites.slice(0, 5).map((fav) => {
                    const setting = NAV_SECTIONS.flatMap(s => s.items).find(i => i.href === fav.href)
                    if (!setting) return null
                    return (
                      <Link
                        key={fav.href}
                        href={fav.href}
                        onClick={() => setSidebarOpen(false)}
                        className={`
                          group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium
                          transition-all duration-200 ease-out
                          ${
                            isActive(fav.href)
                              ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300'
                              : 'text-text-secondary hover:bg-surface-2 hover:text-text-primary'
                          }
                        `}
                      >
                        <Star className={`h-4 w-4 flex-shrink-0 ${isActive(fav.href) ? 'fill-amber-500 text-amber-500' : 'fill-amber-400 text-amber-400'}`} />
                        {setting?.label}
                      </Link>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Search Bar */}
            <div className="mb-6 hidden lg:block sticky top-0 z-10">
              <div className="relative group">
                <Search className="absolute left-3 top-3 h-4 w-4 text-text-tertiary pointer-events-none" />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder={t('common.search', 'Search settings...')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-lg border border-border bg-surface/50 py-2 pl-10 pr-8 text-sm text-text-primary placeholder-text-tertiary focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20 dark:bg-slate-800/50 transition-all"
                />
                <kbd className="absolute right-2 top-2 hidden group-focus-within:hidden text-xs font-semibold text-text-tertiary bg-surface/80 px-2 py-1 rounded pointer-events-none">
                  {/Mac|iPhone|iPad|iPod/.test(navigator.platform) ? '⌘' : 'Ctrl'} K
                </kbd>
              </div>
            </div>

            <nav className="space-y-1 lg:sticky lg:top-20" aria-label="Settings navigation">
              {filteredSections.length === 0 ? (
                <div className="px-3 py-8 text-center">
                  <p className="text-sm text-text-tertiary">
                    {t('common.noResults', 'No settings found')}
                  </p>
                </div>
              ) : (
                filteredSections.map((section) => (
                  <div key={section.title} className="mb-6">
                    <h3 className="mb-3 flex items-center gap-2 px-3 text-xs font-semibold uppercase tracking-wider text-text-tertiary">
                      {section.icon}
                      {t(section.titleKey, section.title)}
                    </h3>
                    <div className="space-y-2">
                      {section.items.map((item) => (
                        <div
                          key={item.href}
                          className={`
                            group rounded-lg px-3 py-2.5 text-sm font-medium
                            transition-all duration-200 ease-out flex items-start gap-3
                            ${
                              isActive(item.href)
                                ? 'bg-gradient-to-r from-violet-50 to-violet-50/50 text-violet-700 shadow-sm dark:from-violet-950/50 dark:to-violet-950/20 dark:text-violet-300 border border-violet-200/50 dark:border-violet-900/30'
                                : 'text-text-secondary hover:bg-surface-2 hover:text-text-primary border border-transparent hover:border-border/50'
                            }
                          `}
                        >
                          <Link
                            href={item.href}
                            onClick={() => setSidebarOpen(false)}
                            className="flex-1 flex items-start gap-3 min-w-0"
                          >
                            <span className={`mt-0.5 flex-shrink-0 transition-all duration-200 ${
                              isActive(item.href)
                                ? 'text-violet-600 dark:text-violet-400'
                                : 'text-text-tertiary group-hover:text-violet-600 group-hover:scale-110'
                            }`}>
                              {item.icon}
                            </span>
                            <div className="flex-1 min-w-0">
                              <div className="font-medium">{t(item.labelKey, item.label)}</div>
                              {item.description && (
                                <p className="mt-0.5 text-xs text-text-tertiary group-hover:text-text-secondary transition-colors line-clamp-2">
                                  {t(item.descriptionKey || '', item.description)}
                                </p>
                              )}
                            </div>
                            {isActive(item.href) && (
                              <div className="ml-auto mt-0.5 h-2 w-2 rounded-full bg-violet-600 dark:bg-violet-400 flex-shrink-0 animate-pulse" />
                            )}
                          </Link>
                          <button
                            onClick={(e) => {
                              e.preventDefault()
                              toggleFavorite({
                                id: item.href,
                                href: item.href,
                                label: item.label,
                                icon: 'star',
                              })
                            }}
                            className="ml-auto mt-0.5 p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 hover:bg-white/20"
                            title={isFavorite(item.href) ? 'Remove from favorites' : 'Add to favorites'}
                          >
                            <Star
                              className={`h-4 w-4 transition-all ${
                                isFavorite(item.href)
                                  ? 'fill-amber-500 text-amber-500'
                                  : 'text-text-tertiary hover:text-amber-500'
                              }`}
                            />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </nav>
          </aside>

          {/* Main Content Area */}
          <main className="lg:col-span-3">
            {/* Breadcrumb */}
            {currentPage && (
              <div className="mb-6 flex items-center gap-2 text-sm">
                <span className="text-text-tertiary">{t('workspaceSettings.title', 'Workspace Settings')}</span>
                <ChevronRight className="h-4 w-4 text-text-tertiary" />
                <span className="text-text-secondary">{t(NAV_SECTIONS.find(s => s.items.some(i => isActive(i.href)))?.items.find(i => isActive(i.href))?.labelKey || '', currentPage.page)}</span>
              </div>
            )}

            <div className="rounded-xl border border-border/50 bg-white p-6 dark:bg-slate-950">
              {children}
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}
