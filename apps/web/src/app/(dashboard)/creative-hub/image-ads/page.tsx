'use client'

import Link from 'next/link'
import { Globe, Search, Sparkles, Upload, UserCircle2 } from 'lucide-react'
import { useI18n } from '@/i18n/use-i18n'
import { cn } from '@/lib/utils'

const STYLE_CHIPS = [
  'All',
  'Hook',
  'Viral',
  'SALE',
  'Clothing',
  'Beauty',
  'SaaS',
  'Food',
  'Health',
  'Tech',
  'Sports',
  'Pets',
  'Education',
]

export default function ImageAdsHubPage() {
  const { t } = useI18n()

  const methods = [
    {
      href: '/creative-hub/image-ads/product-page',
      titleKey: 'imageAdsPage.methodProductTitle',
      titleFb: 'Product page',
      descKey: 'imageAdsPage.methodProductDesc',
      descFb: 'Paste a URL to extract details and generate on-brand static ads.',
      icon: Globe,
    },
    {
      href: '/creative-hub/image-ads/upload-clone',
      titleKey: 'imageAdsPage.methodUploadTitle',
      titleFb: 'Upload & clone',
      descKey: 'imageAdsPage.methodUploadDesc',
      descFb: 'Upload a reference image and we’ll recreate the style for your brand.',
      icon: Upload,
    },
    {
      href: '/creative-hub/image-ads/competitor-clone',
      titleKey: 'imageAdsPage.methodCompetitorTitle',
      titleFb: 'Competitor clone',
      descKey: 'imageAdsPage.methodCompetitorDesc',
      descFb: 'Find competitor ads and adapt winning layouts to your offer.',
      icon: Search,
    },
    {
      href: '/creative-hub/image-ads/ai-actor-product',
      titleKey: 'imageAdsPage.methodActorTitle',
      titleFb: 'AI actor + product',
      descKey: 'imageAdsPage.methodActorDesc',
      descFb: 'Pair your product with AI actors for UGC-style stills.',
      icon: UserCircle2,
    },
  ] as const

  return (
    <div className="mx-auto max-w-6xl space-y-10 pb-16 pt-2">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-caption font-semibold uppercase tracking-wider text-brand-mid dark:text-brand-lime">
            {t('imageAdsPage.eyebrow', 'Creative Hub')}
          </p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-text-primary md:text-4xl">
            {t('imageAdsPage.title', 'Image ads')}
          </h1>
          <p className="mt-2 max-w-2xl text-body text-text-secondary">
            {t('imageAdsPage.subtitle', 'Choose how you want to start — each path uses the same Input → Configure flow.')}
          </p>
        </div>
        <Link
          href="/creative-hub?tab=image"
          className="inline-flex items-center gap-2 self-start rounded-2xl border border-border/80 bg-surface px-4 py-2.5 text-sm font-medium text-text-secondary shadow-sm transition-colors hover:border-brand-mid/40 hover:text-text-primary dark:bg-surface-elevated"
        >
          <Sparkles className="h-4 w-4 text-brand-mid dark:text-brand-lime" aria-hidden />
          {t('imageAdsPage.quickWorkspace', 'Quick workspace (templates)')}
        </Link>
      </div>

      <section className="grid gap-4 sm:grid-cols-2">
        {methods.map(({ href, titleKey, titleFb, descKey, descFb, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              'group flex flex-col gap-3 rounded-3xl border border-border/80 bg-surface p-6 shadow-sm transition-all',
              'hover:-translate-y-0.5 hover:border-brand-mid/35 hover:shadow-md dark:bg-surface-elevated/80 dark:hover:border-brand-lime/30',
            )}
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-mid/12 text-brand-mid dark:bg-brand-lime/15 dark:text-brand-lime">
              <Icon className="h-6 w-6" aria-hidden />
            </div>
            <div>
              <h2 className="text-lg font-bold text-text-primary">{t(titleKey, titleFb)}</h2>
              <p className="mt-1 text-body-sm leading-relaxed text-text-secondary">{t(descKey, descFb)}</p>
            </div>
            <span className="mt-auto text-caption font-semibold text-brand-mid dark:text-brand-lime">
              {t('imageAdsPage.openFlow', 'Start')} →
            </span>
          </Link>
        ))}
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-bold text-text-primary">{t('imageAdsPage.stylesTitle', 'Choose style & recreate')}</h2>
        <p className="text-body-sm text-text-secondary">{t('imageAdsPage.stylesHint', 'Filter inspiration templates (browse the full gallery from templates).')}</p>
        <div className="flex gap-2 overflow-x-auto pb-1 pt-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {STYLE_CHIPS.map((chip) => (
            <span
              key={chip}
              className={cn(
                'shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold',
                chip === 'All'
                  ? 'border-brand-mid/50 bg-brand-mid/10 text-brand-mid dark:border-brand-lime/40 dark:bg-brand-lime/10 dark:text-brand-lime'
                  : 'border-border/80 bg-surface-2/80 text-text-secondary',
              )}
            >
              {chip}
            </span>
          ))}
        </div>
        <div className="pt-2">
          <Link
            href="/creative-hub/templates/image-ads"
            className="text-sm font-semibold text-brand-mid underline-offset-4 hover:underline dark:text-brand-lime"
          >
            {t('imageAdsPage.browseTemplates', 'Browse image-ad templates')}
          </Link>
        </div>
      </section>
    </div>
  )
}
