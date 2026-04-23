'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useWorkspaceStore } from '@/stores/workspace.store'
import { useI18n } from '@/i18n/use-i18n'
import {
  Building2,
  ChevronDown,
  CreditCard,
  Users,
  Globe,
  Zap,
  HelpCircle,
  BarChart3,
  User,
  Settings as SettingsIcon,
  Menu,
  X
} from 'lucide-react'
import { useState } from 'react'

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

  const isActive = (href: string) => {
    return pathname === href || (href === '/settings/workspace/ad-accounts' && pathname === '/settings/workspace')
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border/50 bg-white dark:bg-slate-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4 min-w-0">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden inline-flex items-center justify-center rounded-lg border border-border bg-surface p-2 text-text-secondary hover:bg-surface-2 hover:text-text-primary transition-all"
                aria-label="Toggle navigation"
              >
                {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold uppercase tracking-wider text-violet-600 dark:text-violet-400">
                  {t('workspaceSettings.title', 'Workspace Settings')}
                </p>
                <div className="mt-3 flex items-center gap-3">
                  <h1 className="text-3xl font-bold tracking-tight text-text-primary">
                    {t('workspaceSettings.title', 'Workspace Settings')}
                  </h1>
                  <button
                    type="button"
                    className="hidden sm:inline-flex items-center gap-2 rounded-lg border border-border bg-white/50 px-3 py-2 text-sm font-medium text-text-primary backdrop-blur hover:bg-white/80 dark:bg-slate-800/50 dark:hover:bg-slate-800"
                    aria-label={t('workspaceSettings.workspace', 'Workspace')}
                  >
                    <Building2 className="h-4 w-4 text-violet-500" />
                    <span className="max-w-[250px] truncate">{currentWorkspace?.name ?? t('workspaceSettings.workspace', 'Workspace')}</span>
                    <ChevronDown className="h-4 w-4 text-text-tertiary" />
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
              className="shrink-0 inline-flex items-center justify-center rounded-lg border border-border bg-surface px-4 py-2 text-sm font-medium text-text-secondary transition-all hover:bg-surface-2 hover:text-text-primary"
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
            <nav className="space-y-1 lg:sticky lg:top-8" aria-label="Settings navigation">
              {NAV_SECTIONS.map((section) => (
                <div key={section.title} className="mb-6">
                  <h3 className="mb-3 flex items-center gap-2 px-3 text-xs font-semibold uppercase tracking-wider text-text-tertiary">
                    {section.icon}
                    {t(section.titleKey, section.title)}
                  </h3>
                  <div className="space-y-1">
                    {section.items.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setSidebarOpen(false)}
                        className={`
                          flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all
                          ${
                            isActive(item.href)
                              ? 'bg-violet-50 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300'
                              : 'text-text-secondary hover:bg-surface-2 hover:text-text-primary'
                          }
                        `}
                      >
                        <span className={`${isActive(item.href) ? 'text-violet-600' : 'text-text-tertiary'}`}>
                          {item.icon}
                        </span>
                        {t(item.labelKey, item.label)}
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </nav>
          </aside>

          {/* Main Content Area */}
          <main className="lg:col-span-3">
            <div className="rounded-xl border border-border/50 bg-white p-6 dark:bg-slate-950">
              {children}
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}
