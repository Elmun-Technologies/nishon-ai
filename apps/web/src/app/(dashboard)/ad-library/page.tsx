'use client'

import { useCallback, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ScanSearch, TrendingUp } from 'lucide-react'
import { useWorkspaceStore } from '@/stores/workspace.store'
import { useI18n } from '@/i18n/use-i18n'
import { PageHeader } from '@/components/ui'
import { Alert } from '@/components/ui/Alert'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { AdCreativeCard } from '@/components/ad-library/AdCreativeCard'
import { getMockAdLibraryRows, getTopAdvertisers } from '@/lib/ad-library/mock'
import { scoreAd } from '@/lib/ad-library/score'
import type { AdLibraryFilters, AdLibraryScoredAd } from '@/lib/ad-library/types'
import {
  appendCreativeProject,
  saveCreativeImportDraft,
} from '@/lib/creative-hub/project-storage'

const defaultFilters: AdLibraryFilters = {
  platform: 'all',
  niche: 'all',
  format: 'all',
  range: '7d',
  sort: 'score',
}

function matchesPlatform(ad: AdLibraryScoredAd, p: AdLibraryFilters['platform']) {
  if (p === 'all') return true
  if (p === 'meta') return ad.platforms.some((x) => x === 'Facebook' || x === 'Instagram')
  if (p === 'yandex') return ad.platforms.includes('Yandex')
  return ad.platforms.includes('TikTok')
}

export default function AdLibraryPage() {
  const { t } = useI18n()
  const router = useRouter()
  const { currentWorkspace } = useWorkspaceStore()
  const workspaceId = currentWorkspace?.id ?? ''

  const [filters, setFilters] = useState<AdLibraryFilters>(defaultFilters)
  const [importingId, setImportingId] = useState<string | null>(null)
  const [importError, setImportError] = useState<string | null>(null)

  const top = useMemo(() => getTopAdvertisers(), [])

  const scoredAds = useMemo(() => getMockAdLibraryRows().map(scoreAd), [])

  const filtered = useMemo(() => {
    const maxLaunch = filters.range === '7d' ? 7 : 30
    let list = scoredAds.filter((ad) => ad.launchedDaysAgo <= maxLaunch)
    if (filters.niche !== 'all') list = list.filter((ad) => ad.niche === filters.niche)
    if (filters.format !== 'all') list = list.filter((ad) => ad.format === filters.format)
    list = list.filter((ad) => matchesPlatform(ad, filters.platform))
    if (filters.sort === 'score') list = [...list].sort((a, b) => b.score - a.score)
    else if (filters.sort === 'new') list = [...list].sort((a, b) => a.launchedDaysAgo - b.launchedDaysAgo)
    else list = [...list].sort((a, b) => b.daysActive - a.daysActive)
    return list
  }, [scoredAds, filters])

  const handleImport = useCallback(
    async (ad: AdLibraryScoredAd) => {
      setImportError(null)
      if (!workspaceId) {
        setImportError(t('adLibrary.noWorkspace', 'Avval workspace tanlang.'))
        return
      }
      setImportingId(ad.id)
      try {
        const res = await fetch('/api/creative-hub/import', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            source: 'ad-library',
            referenceAd: ad.id,
            headline: ad.headline,
            primaryText: ad.primaryText,
            imageUrl: ad.creativeUrl,
            pageName: ad.pageName,
          }),
        })
        const json = (await res.json()) as {
          ok?: boolean
          message?: string
          projectId?: string
          name?: string
          headline?: string
          primaryText?: string
          imageUrl?: string
          referenceAd?: string
        }
        if (!res.ok || !json.ok || !json.projectId || !json.name) {
          setImportError(json.message ?? t('adLibrary.importFailed', 'Import muvaffaqiyatsiz.'))
          return
        }
        appendCreativeProject(workspaceId, {
          id: json.projectId,
          name: json.name,
          updatedAt: Date.now(),
        })
        saveCreativeImportDraft(workspaceId, json.projectId, {
          headline: json.headline ?? '',
          primaryText: json.primaryText ?? '',
          imageUrl: json.imageUrl,
          referenceAd: json.referenceAd ?? ad.id,
        })
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('adspectr-adlib-import-notice', '1')
        }
        router.push('/creative-hub/projects')
      } catch {
        setImportError(t('adLibrary.importFailed', 'Import muvaffaqiyatsiz.'))
      } finally {
        setImportingId(null)
      }
    },
    [workspaceId, router, t],
  )

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-10">
      <PageHeader
        title={t('navigation.adLibrary', 'Ad Library')}
        subtitle={t(
          'adLibrary.subtitle',
          'Raqiblar va trendlar: mock UZ data. Keyin Meta Ad Library API (ads_archive) ulanadi.',
        )}
      />

      <Alert variant="info">
        {t(
          'adLibrary.legalHint',
          'Faqat ilhom manbai: kreativni nusxa ko‘chirish emas, o‘z brendingiz uchun moslashtiring. Meta rasmiy API — legal; scraping alohida siyosat.',
        )}
      </Alert>

      {importError && <Alert variant="warning">{importError}</Alert>}

      <section>
        <div className="flex items-center gap-2 mb-3">
          <ScanSearch className="w-5 h-5 text-violet-400" aria-hidden />
          <h2 className="text-sm font-semibold text-text-primary">
            {t('adLibrary.top30', 'Top 30 reklama beruvchi')}
          </h2>
          <span className="text-xs text-text-tertiary">· {t('adLibrary.top30Hint', 'Har kuni yangilanadi (mock)')}</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
          {top.map((row) => (
            <Card key={row.pageName} padding="sm" className="border-border/80">
              <div className="flex items-start gap-2">
                <span className="text-lg font-bold text-text-tertiary tabular-nums">#{row.rank}</span>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-text-primary truncate">{row.pageName}</p>
                  <p className="text-[10px] text-text-tertiary mt-0.5">{row.categoryLabel}</p>
                  <p className="text-[11px] text-text-secondary mt-1">
                    {row.activeAds} aktiv
                    <span className="inline-flex items-center gap-0.5 ml-1 text-emerald-500">
                      <TrendingUp className="w-3 h-3" aria-hidden />+{row.growthPct}%
                    </span>
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </section>

      <Card padding="md" className="border-border space-y-3">
        <p className="text-xs font-semibold text-text-primary">{t('adLibrary.filters', 'Filtrlar')}</p>
        <div className="flex flex-wrap gap-2 items-end">
          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-text-tertiary uppercase">Platforma</label>
            <select
              className="text-sm rounded-lg border border-border bg-surface px-2 py-1.5 text-text-primary"
              value={filters.platform}
              onChange={(e) =>
                setFilters((f) => ({ ...f, platform: e.target.value as AdLibraryFilters['platform'] }))
              }
            >
              <option value="all">Hammasi</option>
              <option value="meta">Meta (FB/IG)</option>
              <option value="yandex">Yandex</option>
              <option value="tiktok">TikTok</option>
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-text-tertiary uppercase">Niche</label>
            <select
              className="text-sm rounded-lg border border-border bg-surface px-2 py-1.5 text-text-primary"
              value={filters.niche}
              onChange={(e) => setFilters((f) => ({ ...f, niche: e.target.value as AdLibraryFilters['niche'] }))}
            >
              <option value="all">Barcha</option>
              <option value="fashion">Kiyim / fashion</option>
              <option value="course">Kurslar</option>
              <option value="restaurant">Restoran</option>
              <option value="food">Oziq-ovqat</option>
              <option value="edu">Ta’lim</option>
              <option value="services">Xizmat / fintech</option>
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-text-tertiary uppercase">Format</label>
            <select
              className="text-sm rounded-lg border border-border bg-surface px-2 py-1.5 text-text-primary"
              value={filters.format}
              onChange={(e) => setFilters((f) => ({ ...f, format: e.target.value as AdLibraryFilters['format'] }))}
            >
              <option value="all">Hammasi</option>
              <option value="video">Video</option>
              <option value="image">Rasm</option>
              <option value="carousel">Carousel</option>
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-text-tertiary uppercase">Sana</label>
            <select
              className="text-sm rounded-lg border border-border bg-surface px-2 py-1.5 text-text-primary"
              value={filters.range}
              onChange={(e) => setFilters((f) => ({ ...f, range: e.target.value as AdLibraryFilters['range'] }))}
            >
              <option value="7d">Oxirgi 7 kun</option>
              <option value="30d">Oxirgi 30 kun</option>
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-text-tertiary uppercase">Sort</label>
            <select
              className="text-sm rounded-lg border border-border bg-surface px-2 py-1.5 text-text-primary"
              value={filters.sort}
              onChange={(e) => setFilters((f) => ({ ...f, sort: e.target.value as AdLibraryFilters['sort'] }))}
            >
              <option value="score">Score</option>
              <option value="new">Yangi</option>
              <option value="longevity">Uzoq active</option>
            </select>
          </div>
          <Button type="button" variant="ghost" size="sm" className="ml-auto" onClick={() => setFilters(defaultFilters)}>
            {t('adLibrary.resetFilters', 'Tozalash')}
          </Button>
        </div>
        <p className="text-[11px] text-text-tertiary">
          {t('adLibrary.resultsCount', '{n} ta reklama ko‘rsatilmoqda (mock).').replace('{n}', String(filtered.length))}
        </p>
      </Card>

      <section>
        <h2 className="text-sm font-semibold text-text-primary mb-3">{t('adLibrary.adsGrid', 'Reklamalar')}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((ad) => (
            <AdCreativeCard key={ad.id} ad={ad} importing={importingId === ad.id} onImport={handleImport} />
          ))}
        </div>
      </section>
    </div>
  )
}
