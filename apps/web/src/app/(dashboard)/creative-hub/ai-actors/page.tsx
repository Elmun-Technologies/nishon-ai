'use client'

export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { LayoutGrid, Plus, Search, Sparkles, Users2 } from 'lucide-react'
import { useI18n } from '@/i18n/use-i18n'
import { Button } from '@/components/ui'
import { CreateAIActorModal } from '../components/CreateAIActorModal'
import { cn } from '@/lib/utils'
import { DEMO_AI_ACTORS, type ActorCardModel } from './actor-seed'

type GenderFilter = 'all' | 'male' | 'female'
type StyleFilter = 'all' | 'professional' | 'casual' | 'ugc'
type AgeFilter = 'all' | 'young' | 'middle' | 'senior'
type ShootFilter = 'all' | 'selfie' | 'presenter'

const SKIN_SWATCHES = [
  'linear-gradient(135deg,#fde4d6,#e8bc9a)',
  'linear-gradient(135deg,#f5d0b5,#d4a574)',
  'linear-gradient(135deg,#e8c4a8,#b8835a)',
  'linear-gradient(135deg,#c68642,#8d5520)',
  'linear-gradient(135deg,#5c3d2e,#2d1a12)',
]

export default function AiActorsPage() {
  const { t } = useI18n()
  const [modalOpen, setModalOpen] = useState(false)
  const [actors, setActors] = useState<ActorCardModel[]>(() => [...DEMO_AI_ACTORS])
  const [query, setQuery] = useState('')
  const [gender, setGender] = useState<GenderFilter>('all')
  const [skinTone, setSkinTone] = useState<number | null>(null)
  const [shooting, setShooting] = useState<ShootFilter>('all')
  const [age, setAge] = useState<AgeFilter>('all')
  const [style, setStyle] = useState<StyleFilter>('all')
  const [denseGrid, setDenseGrid] = useState(false)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return actors.filter((a) => {
      if (q && !a.name.toLowerCase().includes(q) && !a.tags.some((t) => t.toLowerCase().includes(q))) return false
      if (gender !== 'all' && a.gender !== gender) return false
      if (skinTone !== null && a.skinTone !== skinTone) return false
      if (shooting !== 'all' && a.shootingStyle !== shooting) return false
      if (age !== 'all' && a.age !== age) return false
      if (style !== 'all' && a.style !== style) return false
      return true
    })
  }, [actors, query, gender, skinTone, shooting, age, style])

  const pill = (active: boolean) =>
    cn(
      'rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors',
      active
        ? 'border-brand-mid bg-brand-mid/15 text-brand-mid dark:border-brand-lime dark:bg-brand-lime/15 dark:text-brand-lime'
        : 'border-border/80 bg-surface-2/70 text-text-secondary hover:border-brand-mid/30 dark:bg-brand-ink/40',
    )

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 pb-10">
      <section
        className={cn(
          'rounded-3xl border border-border/80 bg-gradient-to-br p-5 shadow-sm md:p-6',
          'from-white via-surface to-surface-2/95',
          'dark:from-[#1e3310] dark:via-brand-ink dark:to-[#152508]',
        )}
      >
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex min-w-0 items-start gap-4">
            <div
              className={cn(
                'flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl shadow-md ring-1',
                'bg-gradient-to-br from-brand-mid to-brand-lime ring-brand-ink/10',
              )}
            >
              <Users2 className="h-7 w-7 text-brand-ink" aria-hidden />
            </div>
            <div className="min-w-0">
              <h1 className="text-2xl font-bold tracking-tight text-text-primary md:text-[1.75rem]">
                {t('navigation.aiActors', 'AI Actors')}
              </h1>
              <p className="mt-1.5 max-w-2xl text-body-sm text-text-secondary md:text-body">
                {t('aiActorsPage.subtitle', 'Browse, filter, and manage your AI actor library.')}
              </p>
            </div>
          </div>
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setDenseGrid((v) => !v)}
              className={cn(
                'inline-flex items-center gap-2 rounded-2xl border border-border px-3 py-2 text-sm font-medium text-text-secondary transition-colors hover:bg-surface-2',
                denseGrid && 'border-brand-mid/50 text-brand-mid dark:text-brand-lime',
              )}
              aria-pressed={denseGrid}
            >
              <LayoutGrid className="h-4 w-4" aria-hidden />
              {t('aiActorsPage.layoutToggle', 'Density')}
            </button>
            <Button type="button" className="gap-2 rounded-2xl" onClick={() => setModalOpen(true)}>
              <Sparkles className="h-4 w-4" aria-hidden />
              {t('aiActorsPage.createActor', 'Create AI actor')}
            </Button>
            <Link
              href="/creative-hub"
              className={cn(
                'inline-flex items-center justify-center rounded-2xl border border-border px-4 py-2 text-sm font-medium',
                'bg-white/80 text-text-primary transition-all hover:bg-white active:scale-95',
                'dark:bg-slate-900/70 dark:hover:bg-slate-900',
              )}
            >
              {t('aiActorsPage.openCreativeHub', 'Creative Hub')}
            </Link>
          </div>
        </div>
      </section>

      <p className="text-body-sm text-text-secondary">{t('aiActorsPage.heygenNotice', '')}</p>

      <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
        <aside className="w-full shrink-0 space-y-5 rounded-3xl border border-border/80 bg-surface p-4 shadow-sm dark:bg-surface-elevated/80 lg:w-64">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-tertiary" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t('aiActorsPage.searchPh', 'Search actors…')}
              className="w-full rounded-xl border border-border bg-surface-2/80 py-2.5 pl-9 pr-3 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-brand-mid/30 dark:bg-brand-ink/40"
            />
          </div>

          <div>
            <p className="mb-2 text-caption font-semibold uppercase tracking-wide text-text-tertiary">
              {t('aiActorsPage.filterGender', 'Gender')}
            </p>
            <div className="flex flex-wrap gap-2">
              {(['all', 'male', 'female'] as const).map((g) => (
                <button key={g} type="button" className={pill(gender === g)} onClick={() => setGender(g)}>
                  {g === 'all'
                    ? t('aiActorsPage.all', 'All')
                    : g === 'male'
                      ? t('aiActorsPage.male', 'Male')
                      : t('aiActorsPage.female', 'Female')}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-2 text-caption font-semibold uppercase tracking-wide text-text-tertiary">
              {t('aiActorsPage.filterSkin', 'Skin tone')}
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                className={pill(skinTone === null)}
                onClick={() => setSkinTone(null)}
              >
                {t('aiActorsPage.all', 'All')}
              </button>
              {SKIN_SWATCHES.map((bg, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setSkinTone(i)}
                  className={cn(
                    'h-9 w-9 rounded-full border-2 shadow-sm transition-transform hover:scale-105',
                    skinTone === i ? 'border-brand-mid ring-2 ring-brand-mid/30 dark:border-brand-lime' : 'border-white/80',
                  )}
                  style={{ background: bg }}
                  aria-label={`${t('aiActorsPage.skinTone', 'Skin tone')} ${i + 1}`}
                />
              ))}
            </div>
          </div>

          <div>
            <p className="mb-2 text-caption font-semibold uppercase tracking-wide text-text-tertiary">
              {t('aiActorsPage.filterShooting', 'Shooting style')}
            </p>
            <div className="flex flex-wrap gap-2">
              {(['all', 'selfie', 'presenter'] as const).map((s) => (
                <button key={s} type="button" className={pill(shooting === s)} onClick={() => setShooting(s)}>
                  {s === 'all'
                    ? t('aiActorsPage.all', 'All')
                    : s === 'selfie'
                      ? t('aiActorsPage.selfie', 'Selfie')
                      : t('aiActorsPage.presenter', 'Presenter')}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-2 text-caption font-semibold uppercase tracking-wide text-text-tertiary">
              {t('aiActorsPage.filterAge', 'Age')}
            </p>
            <div className="flex flex-wrap gap-2">
              {(['all', 'young', 'middle', 'senior'] as const).map((a) => (
                <button key={a} type="button" className={pill(age === a)} onClick={() => setAge(a)}>
                  {a === 'all'
                    ? t('aiActorsPage.all', 'All')
                    : a === 'young'
                      ? t('aiActorsPage.ageYoung', 'Young adult')
                      : a === 'middle'
                        ? t('aiActorsPage.ageMiddle', 'Middle aged')
                        : t('aiActorsPage.ageSenior', 'Senior')}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-2 text-caption font-semibold uppercase tracking-wide text-text-tertiary">
              {t('aiActorsPage.filterStyle', 'Style')}
            </p>
            <div className="flex flex-wrap gap-2">
              {(['all', 'professional', 'casual', 'ugc'] as const).map((s) => (
                <button key={s} type="button" className={pill(style === s)} onClick={() => setStyle(s)}>
                  {s === 'all'
                    ? t('aiActorsPage.all', 'All')
                    : s === 'professional'
                      ? t('aiActorsPage.stylePro', 'Professional')
                      : s === 'casual'
                        ? t('aiActorsPage.styleCasual', 'Casual')
                        : t('aiActorsPage.styleUgc', 'UGC')}
                </button>
              ))}
            </div>
          </div>
        </aside>

        <div className="min-w-0 flex-1">
          {filtered.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-border/80 bg-surface-2/40 px-6 py-16 text-center text-text-secondary dark:bg-brand-ink/25">
              {t('aiActorsPage.empty', 'No actors match these filters.')}
            </div>
          ) : (
            <div
              className={cn(
                'grid gap-4',
                denseGrid ? 'sm:grid-cols-3 lg:grid-cols-4' : 'sm:grid-cols-2 lg:grid-cols-3',
              )}
            >
              <button
                type="button"
                onClick={() => setModalOpen(true)}
                className="flex min-h-[220px] flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-border/80 bg-surface-2/30 text-text-secondary transition-colors hover:border-brand-mid/40 hover:text-brand-mid dark:bg-brand-ink/20 dark:hover:text-brand-lime"
              >
                <Plus className="h-10 w-10" aria-hidden />
                <span className="text-sm font-semibold">{t('aiActorsPage.createTile', 'Create AI actor')}</span>
              </button>
              {filtered.map((a) => (
                <article
                  key={a.id}
                  className="overflow-hidden rounded-2xl border border-border/80 bg-surface shadow-sm transition-shadow hover:shadow-md dark:bg-surface-elevated/80"
                >
                  <div className="aspect-[3/4] w-full overflow-hidden bg-surface-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={a.image} alt="" className="h-full w-full object-cover" />
                  </div>
                  <div className="p-3">
                    <p className="truncate font-semibold text-text-primary">{a.name}</p>
                    <div className="mt-2 flex flex-wrap gap-1">
                      {a.tags.map((tag) => (
                        <span
                          key={tag}
                          className="rounded-md bg-surface-2 px-2 py-0.5 text-caption text-text-tertiary dark:bg-brand-ink/50"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </div>

      <CreateAIActorModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        libraryVisualStyle={style === 'all' ? 'ugc' : style}
        libraryShootingStyle={shooting === 'all' ? null : shooting}
        onActorCreated={(actor) => setActors((prev) => [actor, ...prev])}
      />
    </div>
  )
}
