'use client'

import { Suspense } from 'react'
import { useI18n } from '@/i18n/use-i18n'
import { CreativeHubWorkspace } from '../components/CreativeHubWorkspace'

export default function CreativeHubWorkspacePage() {
  const { t } = useI18n()
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[40vh] items-center justify-center text-text-secondary">
          {t('common.loading', 'Loading...')}
        </div>
      }
    >
      <CreativeHubWorkspace />
    </Suspense>
  )
}
