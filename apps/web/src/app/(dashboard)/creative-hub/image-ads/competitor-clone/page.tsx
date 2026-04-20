'use client'

import { useState } from 'react'
import { ClipboardPaste, ExternalLink, Search } from 'lucide-react'
import { ImageAdsShell } from '../_components/ImageAdsShell'
import { useI18n } from '@/i18n/use-i18n'

export default function CompetitorCloneImageAdsPage() {
  const { t } = useI18n()
  const [step, setStep] = useState<'input' | 'configure'>('input')
  const [pageQuery, setPageQuery] = useState('')
  const [pasted, setPasted] = useState(false)

  const openDisabled = pageQuery.trim().length < 3

  return (
    <ImageAdsShell
      activeStep={step}
      pageTitle={t('imageAdsPage.shellTitle', 'Image Ads')}
      mainTitle={t('imageAdsPage.competitorTitle', 'Competitor clone')}
      mainSubtitle={t('imageAdsPage.competitorSubtitle', 'Clone competitor ads that are working and make them yours.')}
    >
      {step === 'input' ? (
        <div className="space-y-6">
          <div className="rounded-3xl border border-border/80 bg-surface p-6 shadow-sm dark:bg-surface-elevated/80 md:p-8">
            <div className="flex items-center gap-2 text-sm font-semibold text-text-primary">
              <Search className="h-4 w-4 text-brand-mid dark:text-brand-lime" aria-hidden />
              {t('imageAdsPage.findCompetitor', 'Find competitor ads')}
            </div>
            <p className="mt-2 text-body-sm text-text-secondary">
              {t('imageAdsPage.findCompetitorBody', 'Enter a Facebook Page URL or name and we’ll open their ads in a new tab.')}
            </p>
            <input
              value={pageQuery}
              onChange={(e) => setPageQuery(e.target.value)}
              placeholder={t('imageAdsPage.fbPlaceholder', 'facebook.com/competitor or page name')}
              className="mt-4 w-full rounded-xl border border-border bg-surface-2/80 px-4 py-3 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-mid/30 dark:bg-brand-ink/40"
            />
            <button
              type="button"
              disabled={openDisabled}
              className="mt-3 inline-flex items-center gap-2 rounded-xl border border-border bg-surface-2 px-4 py-2.5 text-sm font-semibold text-text-primary transition-opacity disabled:cursor-not-allowed disabled:opacity-40 dark:bg-brand-ink/40"
              onClick={() => {
                const q = encodeURIComponent(pageQuery.trim())
                window.open(`https://www.facebook.com/ads/library/?active_status=all&ad_type=all&country=ALL&q=${q}`, '_blank', 'noopener,noreferrer')
              }}
            >
              {t('imageAdsPage.openAds', 'Open ads')}
              <ExternalLink className="h-4 w-4" aria-hidden />
            </button>
            <a
              href="https://www.facebook.com/ads/library/"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-block text-sm font-semibold text-brand-mid hover:underline dark:text-brand-lime"
            >
              {t('imageAdsPage.browseAdLibrary', 'Or browse Meta Ad Library directly')}
            </a>
          </div>

          <div
            tabIndex={0}
            role="region"
            aria-label={t('imageAdsPage.pasteZoneLabel', 'Paste or drop competitor ad images')}
            className="rounded-3xl border-2 border-dashed border-border/80 bg-surface-2/30 p-6 text-center outline-none ring-brand-mid/20 focus-visible:ring-2 dark:bg-brand-ink/20 md:p-10"
            onPaste={() => setPasted(true)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault()
              const imgs = Array.from(e.dataTransfer.files).filter((f) => f.type.startsWith('image/'))
              if (imgs.length) setPasted(true)
            }}
          >
            <div className="flex justify-center gap-4 text-text-tertiary">
              <ClipboardPaste className="h-10 w-10" aria-hidden />
              <UploadMini />
            </div>
            <p className="mx-auto mt-4 max-w-lg text-body-sm text-text-secondary">
              {t(
                'imageAdsPage.pasteZone',
                'Right-click an ad image in Meta Ad Library → Copy image → return here and press Ctrl+V. Or drag images from your browser, or drop image files.',
              )}
            </p>
          </div>

          <button
            type="button"
            disabled={!pasted}
            onClick={() => setStep('configure')}
            className="w-full rounded-2xl bg-gradient-to-r from-brand-mid to-brand-lime py-3 text-sm font-semibold text-brand-ink shadow-sm transition-opacity disabled:cursor-not-allowed disabled:opacity-40"
          >
            {t('imageAdsPage.continueConfigure', 'Continue to configure →')}
          </button>
        </div>
      ) : (
        <div className="rounded-3xl border border-border/80 bg-surface p-6 text-body-sm text-text-secondary shadow-sm dark:bg-surface-elevated/80 md:p-8">
          <p className="font-medium text-text-primary">{t('imageAdsPage.configurePlaceholder', 'Configure step')}</p>
          <p className="mt-2">{t('imageAdsPage.configureCompetitorHint', 'Hook, headline, and safe paraphrase controls will land here.')}</p>
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

function UploadMini() {
  return (
    <svg className="h-10 w-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" />
    </svg>
  )
}
