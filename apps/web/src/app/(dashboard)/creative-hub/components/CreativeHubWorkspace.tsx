'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import {
  ChevronDown,
  Image,
  LayoutTemplate,
  Sparkles,
  Video,
  Wand2,
} from 'lucide-react'
import { ImageAdGenerator } from '@/components/creative/image-ad-generator'
import { VideoAdGenerator } from '@/components/creative/video-ad-generator'
import { TextToImageGenerator } from '@/components/creative/text-to-image-generator'
import { UGCTemplates } from '@/components/creative/ugc-templates'
import { CreativeLibrary } from '@/components/creative/creative-library'
import { useWorkspaceStore } from '@/stores/workspace.store'
import { fetchMetaDashboard } from '@/lib/meta'
import { useI18n } from '@/i18n/use-i18n'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'

type CreativeType = 'image' | 'video' | 'text-to-image' | 'ugc' | 'library'

const TAB_VALUES: CreativeType[] = ['image', 'video', 'text-to-image', 'ugc', 'library']

const HUB_CARD_IMAGES = {
  image: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=1200&q=80',
  video: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a5?w=1200&q=80',
  tti: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=1200&q=80',
} as const

const UGC_STRIP = [
  { id: 1, name: 'Quick Unboxing', image: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=400&h=500&fit=crop' },
  { id: 2, name: 'Before & After', image: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=400&h=500&fit=crop' },
  { id: 3, name: 'Daily Routine', image: 'https://images.unsplash.com/photo-1487215078519-e21cc028cb29?w=400&h=500&fit=crop' },
  { id: 4, name: 'Problem & Solution', image: 'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=400&h=500&fit=crop' },
  { id: 5, name: 'Testimonial', image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=500&fit=crop' },
  { id: 6, name: 'Trending Sounds', image: 'https://images.unsplash.com/photo-1511379938547-c1f69b13d835?w=400&h=500&fit=crop' },
]

function isCreativeType(v: string | null): v is CreativeType {
  return v !== null && TAB_VALUES.includes(v as CreativeType)
}

export function CreativeHubWorkspace() {
  const { t } = useI18n()
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  const workspaceRef = useRef<HTMLDivElement>(null)
  const { currentWorkspace } = useWorkspaceStore()
  const [activeTab, setActiveTab] = useState<CreativeType>('image')
  const [creatives, setCreatives] = useState<any[]>([])
  const [accountMenuOpen, setAccountMenuOpen] = useState(false)
  const [accountName, setAccountName] = useState(() => t('creativeHubPage.allAdAccounts', 'All ad accounts'))
  const [accounts, setAccounts] = useState<Array<{ id: string; name: string }>>([])

  const selectTab = useCallback(
    (tab: CreativeType, scroll: boolean) => {
      setActiveTab(tab)
      const params = new URLSearchParams(searchParams.toString())
      params.set('tab', tab)
      router.replace(`${pathname}?${params.toString()}`, { scroll: false })
      if (scroll && typeof window !== 'undefined') {
        window.requestAnimationFrame(() => {
          workspaceRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
        })
      }
    },
    [pathname, router, searchParams],
  )

  useEffect(() => {
    const tab = searchParams.get('tab')
    if (isCreativeType(tab)) {
      setActiveTab(tab)
    }
  }, [searchParams])

  const handleSaveCreative = (creative: any) => {
    setCreatives([...creatives, { ...creative, id: Date.now(), createdAt: new Date() }])
  }

  useEffect(() => {
    let cancelled = false
    if (!currentWorkspace?.id) return
    fetchMetaDashboard(currentWorkspace.id)
      .then((res) => {
        if (cancelled) return
        setAccounts((res.accounts ?? []).map((a) => ({ id: a.id, name: a.name })))
      })
      .catch(() => {
        if (!cancelled) setAccounts([])
      })
    return () => {
      cancelled = true
    }
  }, [currentWorkspace?.id])

  const launchCards: Array<{
    tab: Exclude<CreativeType, 'ugc' | 'library'>
    title: string
    desc: string
    image: string
    icon: typeof Image
  }> = [
    {
      tab: 'image',
      title: t('creativeHubPage.cardImageTitle', 'Image ads'),
      desc: t('creativeHubPage.cardImageDesc', ''),
      image: HUB_CARD_IMAGES.image,
      icon: Image,
    },
    {
      tab: 'video',
      title: t('creativeHubPage.cardVideoTitle', 'Video ads'),
      desc: t('creativeHubPage.cardVideoDesc', ''),
      image: HUB_CARD_IMAGES.video,
      icon: Video,
    },
    {
      tab: 'text-to-image',
      title: t('creativeHubPage.cardTtiTitle', 'Text to image'),
      desc: t('creativeHubPage.cardTtiDesc', ''),
      image: HUB_CARD_IMAGES.tti,
      icon: Wand2,
    },
  ]

  return (
    <div className="mx-auto max-w-7xl space-y-10 pb-16 pt-2">
      <section
        className={cn(
          'relative overflow-hidden rounded-3xl border border-border/80 bg-gradient-to-br px-6 py-8 shadow-sm md:px-10 md:py-10',
          'from-white via-surface to-surface-2/90',
          'dark:from-[#1a2d0d] dark:via-brand-ink dark:to-[#152508]',
        )}
      >
        <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-brand-lime/15 blur-3xl dark:bg-brand-lime/10" />
        <div className="relative flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
          <div className="flex min-w-0 items-start gap-4">
            <div
              className={cn(
                'flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl shadow-md ring-1',
                'bg-gradient-to-br from-brand-mid to-brand-lime ring-brand-ink/10',
              )}
            >
              <Sparkles className="h-7 w-7 text-brand-ink" aria-hidden />
            </div>
            <div className="min-w-0">
              <p className="text-caption font-semibold uppercase tracking-wider text-brand-mid dark:text-brand-lime">
                Generatorlar
              </p>
              <h1 className="mt-1 text-3xl font-bold tracking-tight text-text-primary md:text-4xl">
                {t('creativeHubPage.workspaceEyebrow', 'Workspace')}
              </h1>
              <p className="mt-2 max-w-2xl text-body text-text-secondary">
                Tezkor prototiplar: rasm, video, matndan rasm, UGC shablonlari. Professional modullar asosiy Hub
                sahifasida.
              </p>
            </div>
          </div>
          <div className="relative shrink-0">
            <button
              type="button"
              onClick={() => setAccountMenuOpen((v) => !v)}
              className={cn(
                'inline-flex min-w-[12rem] items-center justify-between gap-2 rounded-2xl border border-border/90 bg-surface/95 px-4 py-2.5 text-sm font-medium shadow-sm',
                'text-text-primary hover:border-brand-mid/40 hover:bg-surface-2/80 dark:bg-surface-elevated/80',
              )}
            >
              <span className="truncate">{accountName}</span>
              <ChevronDown className={cn('h-4 w-4 shrink-0 opacity-60 transition-transform', accountMenuOpen && 'rotate-180')} />
            </button>
            {accountMenuOpen && (
              <div className="absolute right-0 top-full z-50 mt-2 max-h-72 min-w-64 overflow-auto rounded-2xl border border-border bg-surface p-2 shadow-xl dark:bg-surface-elevated">
                <button
                  type="button"
                  className="mb-1 w-full rounded-xl px-3 py-2.5 text-left text-sm text-text-secondary hover:bg-surface-2"
                  onClick={() => {
                    setAccountName(t('creativeHubPage.allAdAccounts', 'All ad accounts'))
                    setAccountMenuOpen(false)
                  }}
                >
                  {t('creativeHubPage.allAdAccounts', 'All ad accounts')}
                </button>
                {accounts.map((acc) => (
                  <button
                    key={acc.id}
                    type="button"
                    className="w-full rounded-xl px-3 py-2.5 text-left text-sm text-text-secondary hover:bg-surface-2"
                    onClick={() => {
                      setAccountName(acc.name)
                      setAccountMenuOpen(false)
                    }}
                  >
                    {acc.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex flex-col gap-1 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-text-primary">
              {t('creativeHubPage.createLaunchTitle', 'Create & launch ads')}
            </h2>
            <p className="mt-1 max-w-3xl text-body-sm text-text-secondary md:text-body">
              {t('creativeHubPage.createLaunchSubtitle', '')}
            </p>
          </div>
        </div>
        <div className="grid gap-5 md:grid-cols-3">
          {launchCards.map(({ tab, title, desc, image, icon: Icon }) => {
            const active = activeTab === tab
            return (
              <button
                key={tab}
                type="button"
                onClick={() => {
                  if (tab === 'image') {
                    router.push('/creative-hub/image-ads')
                    return
                  }
                  selectTab(tab, true)
                }}
                className={cn(
                  'group relative flex flex-col overflow-hidden rounded-3xl border text-left shadow-md transition-all',
                  'border-border/80 bg-surface hover:-translate-y-0.5 hover:shadow-lg',
                  active && 'ring-2 ring-brand-mid ring-offset-2 ring-offset-[var(--c-surface-2)] dark:ring-brand-lime dark:ring-offset-brand-ink',
                )}
              >
                <div className="relative aspect-[16/11] w-full overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={image} alt="" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent" />
                  <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between gap-2">
                    <div className="flex items-center gap-2 rounded-xl bg-white/15 px-2.5 py-1.5 backdrop-blur-md">
                      <Icon className="h-5 w-5 text-brand-lime" />
                      <span className="text-xs font-bold uppercase tracking-wide text-white">{title}</span>
                    </div>
                  </div>
                </div>
                <div className="flex flex-1 flex-col gap-2 p-5">
                  <p className="text-body-sm leading-relaxed text-text-secondary">{desc}</p>
                  <span className="mt-auto text-caption font-semibold text-brand-mid dark:text-brand-lime">
                    {active ? `● ${t('creativeHubPage.cardCtaActive', 'Active in workspace')}` : t('creativeHubPage.cardCta', 'Open')}
                  </span>
                </div>
              </button>
            )
          })}
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-text-primary">{t('creativeHubPage.socialTitle', 'Social & UGC')}</h2>
            <p className="mt-1 max-w-2xl text-body-sm text-text-secondary">{t('creativeHubPage.socialSubtitle', '')}</p>
          </div>
          <Button type="button" variant="secondary" className="shrink-0 rounded-2xl" onClick={() => selectTab('ugc', true)}>
            {t('creativeHubPage.seeAll', 'See all')}
          </Button>
        </div>
        <div className="flex gap-4 overflow-x-auto pb-2 pt-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {UGC_STRIP.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => selectTab('ugc', true)}
              className={cn(
                'relative w-36 shrink-0 overflow-hidden rounded-2xl border border-border/80 shadow-md transition-transform hover:-translate-y-0.5 md:w-44',
                activeTab === 'ugc' && 'ring-2 ring-brand-mid dark:ring-brand-lime',
              )}
            >
              <div className="aspect-[3/4] w-full">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={item.image} alt="" className="h-full w-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                <span className="absolute bottom-3 left-3 right-3 text-left text-xs font-semibold leading-tight text-white">
                  {item.name}
                </span>
              </div>
            </button>
          ))}
        </div>
      </section>

      <section>
        <button
          type="button"
          onClick={() => selectTab('library', true)}
          className={cn(
            'flex w-full flex-col gap-4 overflow-hidden rounded-3xl border border-border/80 bg-gradient-to-r p-6 text-left shadow-sm transition-all hover:shadow-md md:flex-row md:items-center md:justify-between md:p-8',
            'from-surface via-white to-surface-2/80 dark:from-surface-elevated dark:via-brand-ink dark:to-[#152508]',
            activeTab === 'library' && 'ring-2 ring-brand-mid dark:ring-brand-lime',
          )}
        >
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-mid/15 dark:bg-brand-lime/10">
              <LayoutTemplate className="h-6 w-6 text-brand-mid dark:text-brand-lime" />
            </div>
            <div>
              <p className="text-caption font-semibold uppercase tracking-wide text-brand-mid dark:text-brand-lime">
                {t('creativeHubPage.libraryEyebrow', 'Library')}
              </p>
              <h2 className="mt-1 text-xl font-bold text-text-primary">{t('creativeHubPage.libraryTitle', '')}</h2>
              <p className="mt-1 max-w-xl text-body-sm text-text-secondary">{t('creativeHubPage.libraryDesc', '')}</p>
            </div>
          </div>
          <span className="inline-flex items-center gap-2 self-start rounded-xl bg-brand-ink px-4 py-2.5 text-sm font-semibold text-brand-lime md:self-center">
            {t('creativeHubPage.openLibrary', 'Open library')}
          </span>
        </button>
      </section>

      <section ref={workspaceRef} id="creative-hub-workspace" className="scroll-mt-24 space-y-3">
        <p className="text-caption font-semibold uppercase tracking-wide text-text-tertiary">
          {t('creativeHubPage.workspaceEyebrow', 'Workspace')}
        </p>
        <div className="dark rounded-3xl border border-border/60 bg-surface p-4 shadow-xl md:p-6">
          <div className="space-y-6">
            {activeTab === 'image' && <ImageAdGenerator onSave={handleSaveCreative} />}
            {activeTab === 'video' && <VideoAdGenerator onSave={handleSaveCreative} />}
            {activeTab === 'text-to-image' && <TextToImageGenerator onSave={handleSaveCreative} />}
            {activeTab === 'ugc' && <UGCTemplates onSelect={handleSaveCreative} />}
            {activeTab === 'library' && <CreativeLibrary creatives={creatives} />}
          </div>
        </div>
      </section>
    </div>
  )
}
