'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { PublicContainer, PublicNavbar } from '@/components/public/PublicLayout'
import { useI18n } from '@/i18n/use-i18n'

function hubTabActive(pathname: string, tab: 'browse' | 'leaderboard' | 'portfolio') {
  if (tab === 'browse') {
    return pathname === '/marketplace' || pathname.startsWith('/marketplace/specialists')
  }
  if (tab === 'leaderboard') return pathname.startsWith('/marketplace/leaderboard')
  return pathname.startsWith('/marketplace/portfolio')
}

export default function MarketplaceLayoutClient({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? ''
  const { t } = useI18n()

  const tabs = [
    { id: 'browse' as const, href: '/marketplace', label: t('publicSite.marketplaceHub.browse', 'Browse') },
    {
      id: 'leaderboard' as const,
      href: '/marketplace/leaderboard',
      label: t('publicSite.nav.leaderboard', 'Leaderboard'),
    },
    {
      id: 'portfolio' as const,
      href: '/marketplace/portfolio',
      label: t('publicSite.nav.portfolio', 'Portfolio'),
    },
  ]

  return (
    <>
      <PublicNavbar />
      <div className="border-b border-border bg-surface-2">
        <PublicContainer className="flex flex-wrap gap-1 py-2">
          {tabs.map((tab) => {
            const active = hubTabActive(pathname, tab.id)
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
                  active ? 'bg-primary/10 text-primary' : 'text-text-secondary hover:bg-surface hover:text-text-primary'
                }`}
              >
                {tab.label}
              </Link>
            )
          })}
        </PublicContainer>
      </div>
      {children}
    </>
  )
}
