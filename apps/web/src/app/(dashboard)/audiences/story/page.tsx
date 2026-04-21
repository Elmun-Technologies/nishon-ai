'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { RefreshCw } from 'lucide-react'
import { useWorkspaceStore } from '@/stores/workspace.store'
import { useI18n } from '@/i18n/use-i18n'
import { PageHeader } from '@/components/ui'
import { Button } from '@/components/ui/Button'
import { Alert } from '@/components/ui/Alert'
import { PersonaCard } from '@/components/audience-story/PersonaCard'
import { JourneyFunnel } from '@/components/audience-story/JourneyFunnel'
import { InterestMap } from '@/components/audience-story/InterestMap'
import { CreativeAffinityPanel } from '@/components/audience-story/CreativeAffinityPanel'
import { AudienceComparePanel } from '@/components/audience-story/AudienceComparePanel'
import type { AudienceStoryPayload } from '@/lib/audience-story/types'
import { cn } from '@/lib/utils'

export default function AudienceStoryPage() {
  const { t } = useI18n()
  const { currentWorkspace } = useWorkspaceStore()
  const ws = currentWorkspace?.id ?? 'demo'

  const [data, setData] = useState<AudienceStoryPayload | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/audience/story?workspaceId=${encodeURIComponent(ws)}`)
      const json = await res.json()
      if (!res.ok || !json.ok) {
        setError(json.message ?? 'Yuklash xato')
        setData(null)
        return
      }
      const { ok: _ok, ...rest } = json
      setData(rest as AudienceStoryPayload)
    } catch {
      setError(t('audienceStory.loadError', 'Could not load Audience Story.'))
      setData(null)
    } finally {
      setLoading(false)
    }
  }, [ws, t])

  useEffect(() => {
    void load()
  }, [load])

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-10">
      <PageHeader
        title={t('audienceStory.pageTitle', 'Audience Story')}
        subtitle={t(
          'audienceStory.pageSubtitle',
          '“Kimga sotyapmiz” — grafik emas, hikoya. MVP mock; keyin Meta Insights + Signal Bridge + klaster.',
        )}
        actions={
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="secondary" size="sm" className="gap-1.5 rounded-xl" disabled={loading} onClick={() => void load()}>
              <RefreshCw className={cn('w-3.5 h-3.5', loading && 'animate-spin')} aria-hidden />
              {t('audienceStory.refresh', 'Yangilash')}
            </Button>
            <Link
              href="/audiences"
              className={cn(
                'inline-flex items-center justify-center rounded-xl border border-border px-3 py-1.5 text-xs font-medium',
                'bg-surface hover:bg-surface-2 text-text-primary',
              )}
            >
              {t('audiences.backToLauncher', 'Back to Launcher')}
            </Link>
          </div>
        }
      />

      {error && <Alert variant="warning">{error}</Alert>}

      {loading && !data && (
        <p className="text-sm text-text-tertiary">{t('audienceStory.loading', 'Audience tahlil qilinmoqda…')}</p>
      )}

      {data && (
        <>
          <div className="flex justify-end text-[11px] text-text-tertiary">
            {t('audienceStory.updated', 'Yangilangan')}:{' '}
            {new Date(data.updatedAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}
          </div>
          <Alert variant="info">{data.confidenceNote}</Alert>
          <PersonaCard persona={data.persona} />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <JourneyFunnel steps={data.journey} />
              <CreativeAffinityPanel items={data.creativeAffinity} />
            </div>
            <div className="space-y-6">
              <InterestMap interests={data.interests} tip={data.interestAiTip} />
              <AudienceComparePanel data={data.compare} />
            </div>
          </div>
          <div className="flex flex-wrap gap-2 pt-2">
            <Button type="button" variant="ghost" size="sm" disabled className="rounded-xl">
              {t('audienceStory.exportPdf', 'PDF export — tez orada')}
            </Button>
            <Button type="button" variant="ghost" size="sm" disabled className="rounded-xl">
              {t('audienceStory.sendToSpecialist', 'Targetologga yuborish — tez orada')}
            </Button>
          </div>
        </>
      )}
    </div>
  )
}
