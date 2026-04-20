'use client'

import Link from 'next/link'
import { useRef, useState } from 'react'
import { Box, Users } from 'lucide-react'
import { ImageAdsShell } from '../_components/ImageAdsShell'
import { useI18n } from '@/i18n/use-i18n'

export default function AiActorProductImageAdsPage() {
  const { t } = useI18n()
  const [step, setStep] = useState<'input' | 'configure'>('input')
  const [productFile, setProductFile] = useState<File | null>(null)
  const [actorsConfirmed, setActorsConfirmed] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const canContinue = Boolean(productFile) && actorsConfirmed

  return (
    <ImageAdsShell
      activeStep={step}
      pageTitle={t('imageAdsPage.shellTitle', 'Image Ads')}
      mainTitle={t('imageAdsPage.actorProductTitle', 'AI actor + product')}
      mainSubtitle={t('imageAdsPage.actorProductSubtitle', 'Combine your product with AI-generated models for UGC-style photos.')}
    >
      {step === 'input' ? (
        <div className="space-y-6">
          <div className="rounded-3xl border border-border/80 bg-surface p-6 shadow-sm dark:bg-surface-elevated/80 md:p-8">
            <div className="flex items-center gap-2 text-sm font-semibold text-text-primary">
              <Box className="h-4 w-4 text-brand-mid dark:text-brand-lime" aria-hidden />
              {t('imageAdsPage.productImage', 'Product image')}
            </div>
            <p className="mt-1 text-body-sm text-text-secondary">
              {t('imageAdsPage.productImageHint', 'A clean product shot on a solid background works best.')}
            </p>
            <input
              ref={inputRef}
              type="file"
              accept="image/png,image/jpeg"
              className="sr-only"
              onChange={(e) => {
                const f = e.target.files?.[0]
                setProductFile(f ?? null)
              }}
            />
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="mt-4 flex w-full flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-border/80 bg-surface-2/40 py-12 text-sm text-text-secondary transition-colors hover:border-brand-mid/40 dark:bg-brand-ink/25"
            >
              <span className="font-medium text-text-primary">{t('imageAdsPage.clickUploadProduct', 'Click to upload a product image')}</span>
              <span className="text-caption">{t('imageAdsPage.pngJpg', 'PNG or JPG')}</span>
            </button>
            {productFile ? <p className="mt-2 text-sm text-text-tertiary">{productFile.name}</p> : null}
            <Link href="/creative-hub/products" className="mt-3 inline-block text-sm font-semibold text-brand-mid hover:underline dark:text-brand-lime">
              {t('imageAdsPage.orSelectProduct', 'Or select from your products')}
            </Link>
          </div>

          <div className="rounded-3xl border border-border/80 bg-surface p-6 shadow-sm dark:bg-surface-elevated/80 md:p-8">
            <div className="flex items-center gap-2 text-sm font-semibold text-text-primary">
              <Users className="h-4 w-4 text-brand-mid dark:text-brand-lime" aria-hidden />
              {t('imageAdsPage.aiActors', 'AI actors')}
            </div>
            <p className="mt-1 text-body-sm text-text-secondary">
              {t('imageAdsPage.aiActorsHint', 'Select one or more AI actors. Each actor will get their own set of variations.')}
            </p>
            <Link
              href="/creative-hub/ai-actors"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-border/80 bg-surface-2/40 py-10 text-center transition-colors hover:border-brand-mid/40 dark:bg-brand-ink/25"
            >
              <Users className="h-8 w-8 text-text-tertiary" aria-hidden />
              <span className="font-semibold text-text-primary">{t('imageAdsPage.browseAvatarGallery', 'Browse avatar gallery')}</span>
              <span className="text-caption text-text-tertiary">{t('imageAdsPage.avatarCount', 'Choose from 300+ AI actors.')}</span>
            </Link>
            <label className="mt-4 flex cursor-pointer items-center gap-2 text-sm text-text-secondary">
              <input
                type="checkbox"
                checked={actorsConfirmed}
                onChange={(e) => setActorsConfirmed(e.target.checked)}
                className="h-4 w-4 rounded border-border text-brand-mid focus:ring-brand-mid/30"
              />
              {t('imageAdsPage.actorsReady', 'I selected one or more actors in the gallery')}
            </label>
          </div>

          <button
            type="button"
            disabled={!canContinue}
            onClick={() => setStep('configure')}
            className="w-full rounded-2xl bg-gradient-to-r from-brand-mid to-brand-lime py-3 text-sm font-semibold text-brand-ink shadow-sm transition-opacity disabled:cursor-not-allowed disabled:opacity-40"
          >
            {t('imageAdsPage.continueConfigure', 'Continue to configure →')}
          </button>
        </div>
      ) : (
        <div className="rounded-3xl border border-border/80 bg-surface p-6 text-body-sm text-text-secondary shadow-sm dark:bg-surface-elevated/80 md:p-8">
          <p className="font-medium text-text-primary">{t('imageAdsPage.configurePlaceholder', 'Configure step')}</p>
          <p className="mt-2">{t('imageAdsPage.configureActorHint', 'Pose, wardrobe, and shot list will be configured here.')}</p>
          <button
            type="button"
            className="mt-6 rounded-xl border border-border px-4 py-2.5 text-sm font-medium text-text-secondary hover:bg-surface-2"
            onClick={() => setStep('input')}
          >
            {t('imageAdsPage.backToInput', 'Back to input')}
          </button>
        </div>
      )}
    </ImageAdsShell>
  )
}
