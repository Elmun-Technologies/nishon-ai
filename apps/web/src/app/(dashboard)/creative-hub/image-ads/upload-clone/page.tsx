'use client'

import { useRef, useState } from 'react'
import { Library, Sparkles, Upload } from 'lucide-react'
import { ImageAdsShell } from '../_components/ImageAdsShell'
import { MediaLibraryModal } from '../../components/MediaLibraryModal'
import { useI18n } from '@/i18n/use-i18n'
import { cn } from '@/lib/utils'

export default function UploadCloneImageAdsPage() {
  const { t } = useI18n()
  const [step, setStep] = useState<'input' | 'configure'>('input')
  const [files, setFiles] = useState<File[]>([])
  const [libraryOpen, setLibraryOpen] = useState(false)
  const [pickedFromLibrary, setPickedFromLibrary] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const canContinue = files.length > 0 || pickedFromLibrary

  return (
    <ImageAdsShell
      activeStep={step}
      pageTitle={t('imageAdsPage.shellTitle', 'Image Ads')}
      mainTitle={t('imageAdsPage.uploadCloneTitle', 'Upload & clone')}
      mainSubtitle={t('imageAdsPage.uploadCloneSubtitle', 'Upload a reference image and we’ll recreate the style for your brand.')}
    >
      {step === 'input' ? (
        <div className="space-y-6 rounded-3xl border border-border/80 bg-surface p-6 shadow-sm dark:bg-surface-elevated/80 md:p-8">
          <div className="flex items-center gap-2 text-sm font-semibold text-text-primary">
            <Sparkles className="h-4 w-4 text-brand-mid dark:text-brand-lime" aria-hidden />
            {t('imageAdsPage.uploadInspiration', 'Upload inspiration')}
          </div>
          <p className="text-body-sm text-text-secondary">
            {t(
              'imageAdsPage.uploadInspirationBody',
              'Upload ads, designs, or screenshots that inspire you. The AI will analyze the style, layout, and visual elements to generate fresh creatives for your brand.',
            )}
          </p>

          <div
            className={cn(
              'flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-border/80 bg-surface-2/40 px-6 py-14 text-center transition-colors hover:border-brand-mid/40 dark:bg-brand-ink/25',
            )}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault()
              const list = Array.from(e.dataTransfer.files).filter((f) => f.type.startsWith('image/'))
              if (list.length) setFiles((prev) => [...prev, ...list])
            }}
          >
            <Upload className="h-10 w-10 text-text-tertiary" aria-hidden />
            <span className="text-sm text-text-secondary">{t('imageAdsPage.dragDrop', 'Drag & drop images, or')}</span>
            <div className="flex flex-wrap items-center justify-center gap-2">
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                multiple
                className="sr-only"
                onChange={(e) => {
                  const list = e.target.files ? Array.from(e.target.files) : []
                  if (list.length) setFiles((prev) => [...prev, ...list])
                  e.target.value = ''
                }}
              />
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="inline-flex rounded-xl bg-gradient-to-r from-brand-mid to-brand-lime px-4 py-2 text-sm font-semibold text-brand-ink"
              >
                {t('imageAdsPage.upload', 'Upload')}
              </button>
              <button
                type="button"
                onClick={() => setLibraryOpen(true)}
                className="rounded-xl border border-border bg-surface px-4 py-2 text-sm font-semibold text-text-primary shadow-sm hover:bg-surface-2"
              >
                <span className="inline-flex items-center gap-2">
                  <Library className="h-4 w-4" aria-hidden />
                  {t('imageAdsPage.browseLibrary', 'Browse library')}
                </span>
              </button>
            </div>
          </div>

          {files.length > 0 ? (
            <ul className="text-sm text-text-secondary">
              {files.map((f) => (
                <li key={f.name + f.size}>{f.name}</li>
              ))}
            </ul>
          ) : null}

          <MediaLibraryModal
            isOpen={libraryOpen}
            onClose={() => setLibraryOpen(false)}
            onSelect={(items) => {
              if (items.length) setPickedFromLibrary(true)
              setLibraryOpen(false)
            }}
          />

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
          <p className="mt-2">
            {t('imageAdsPage.configureCloneHint', 'Aspect ratio, variations, and brand kit will match the product-page flow in a future iteration.')}
          </p>
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
