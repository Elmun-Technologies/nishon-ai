'use client'

export const dynamic = 'force-dynamic'

import { Suspense } from 'react'
import { Marketplace } from '../components/Marketplace'
import { useI18n } from '@/i18n/use-i18n'

function MarketplaceSearchFallback() {
  const { t } = useI18n()
  return (
    <div className="rounded-xl border border-border bg-surface px-6 py-10 text-center text-sm text-text-secondary">
      {t('marketplace.searchLoading', 'Loading marketplace…')}
    </div>
  )
}

export default function MarketplaceSearchPage() {
  return (
    <div className="space-y-6">
      <Suspense fallback={<MarketplaceSearchFallback />}>
        <Marketplace />
      </Suspense>
    </div>
  )
}
