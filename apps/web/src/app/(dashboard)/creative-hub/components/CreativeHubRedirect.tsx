'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Spinner } from '@/components/ui'
import { useI18n } from '@/i18n/use-i18n'

export type CreativeHubTab = 'image' | 'video' | 'text-to-image' | 'ugc' | 'library'

export function CreativeHubRedirect({ tab }: { tab?: CreativeHubTab }) {
  const router = useRouter()
  const { t } = useI18n()

  useEffect(() => {
    const q = tab ? `?tab=${encodeURIComponent(tab)}` : ''
    router.replace(`/creative-hub${q}`)
  }, [router, tab])

  return (
    <div className="mx-auto flex min-h-[45vh] w-full max-w-lg flex-col items-center justify-center gap-4 px-4 text-center">
      <Spinner size="lg" />
      <p className="text-body-sm text-text-secondary">{t('creativeHubRedirect.message', 'Opening Creative Hub…')}</p>
    </div>
  )
}
