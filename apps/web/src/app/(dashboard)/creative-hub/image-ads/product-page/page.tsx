'use client'

import Link from 'next/link'
import { useState } from 'react'
import { CheckCircle2, Download, Link2, Sparkles } from 'lucide-react'
import { ImageAdsBusyButton, ImageAdsShell } from '../_components/ImageAdsShell'
import { useI18n } from '@/i18n/use-i18n'
import { reve } from '@/lib/api-client'
import { cn } from '@/lib/utils'

function tryHost(url: string): string | null {
  try {
    const u = new URL(url.trim())
    if (u.protocol !== 'http:' && u.protocol !== 'https:') return null
    return u.hostname.replace(/^www\./, '')
  } catch {
    return null
  }
}

export default function ProductPageImageAdsPage() {
  const { t } = useI18n()
  const [step, setStep] = useState<'input' | 'configure'>('input')
  const [productUrl, setProductUrl] = useState('')
  const [analyzing, setAnalyzing] = useState(false)
  const [instructions, setInstructions] = useState('')
  const [aspect, setAspect] = useState<'1:1' | '4:5' | '9:16'>('1:1')
  const [variations, setVariations] = useState(3)
  const [generating, setGenerating] = useState(false)
  const [results, setResults] = useState<string[]>([])
  const [genError, setGenError] = useState('')

  const handleGenerate = async () => {
    const brief = instructions.trim()
    if (!brief) {
      setGenError(t('imageAdsPage.needBrief', 'Add a short brief before generating.'))
      return
    }
    setGenerating(true)
    setGenError('')
    setResults([])
    try {
      const prompt = `${brief}\n\nProfessional, high-converting static advertisement image. Clean composition, the product as the clear focal point, strong lighting, ad-ready, no watermark.`
      const res = await reve.generateImageAd({
        prompt,
        aspectRatio: aspect,
        numImages: Math.min(4, Math.max(1, variations)),
      })
      const imgs = res.data?.images ?? []
      if (imgs.length === 0) {
        setGenError(t('imageAdsPage.genEmpty', 'No image was returned. Try again.'))
      } else {
        setResults(imgs)
      }
    } catch (err: any) {
      const status = err?.response?.status
      if (status === 503) {
        setGenError(
          t(
            'imageAdsPage.genNotConfigured',
            'Rasm generatsiyasi hali sozlanmagan (FAL_KEY). Administrator serverda kalitni qo\'shsin.',
          ),
        )
      } else {
        setGenError(
          err?.response?.data?.message ||
            err?.message ||
            t('imageAdsPage.genFailed', 'Generation failed. Please try again.'),
        )
      }
    } finally {
      setGenerating(false)
    }
  }

  const runAnalyze = () => {
    const host = tryHost(productUrl)
    if (!host) return
    setAnalyzing(true)
    window.setTimeout(() => {
      setInstructions(
        `${t('imageAdsPage.mockBrand', 'Brand')}: ${host}\n${t('imageAdsPage.mockCategory', 'Category')}: ${t('imageAdsPage.mockCategoryValue', 'General commerce')}\n${t('imageAdsPage.mockDescription', 'Description')}: ${t(
          'imageAdsPage.mockDescriptionBody',
          'We prefilled a draft from your URL. Edit any field before generating.',
        )}`,
      )
      setAnalyzing(false)
      setStep('configure')
    }, 900)
  }

  return (
    <ImageAdsShell
      activeStep={step}
      pageTitle={t('imageAdsPage.shellTitle', 'Image Ads')}
      mainTitle={t('imageAdsPage.productPageTitle', 'Product page')}
      mainSubtitle={t(
        'imageAdsPage.productPageSubtitle',
        'Paste a product or landing page URL. We’ll extract everything and create ads.',
      )}
    >
      {step === 'input' ? (
        <div className="space-y-8 rounded-3xl border border-border/80 bg-surface p-6 shadow-sm dark:bg-surface-elevated/80 md:p-8">
          <div>
            <h2 className="text-xl font-bold text-text-primary">{t('imageAdsPage.shareProductTitle', 'Share your product link')}</h2>
            <p className="mt-1 text-body-sm text-text-secondary">
              {t('imageAdsPage.shareProductBody', 'Paste a product URL to analyze, or pick from your existing products.')}
            </p>
          </div>

          <div className="space-y-4 rounded-2xl border border-border/60 bg-surface-2/50 p-5 dark:bg-brand-ink/30">
            <div className="flex items-center gap-2 text-sm font-semibold text-text-primary">
              <Link2 className="h-4 w-4 text-brand-mid dark:text-brand-lime" aria-hidden />
              {t('imageAdsPage.importFromUrl', 'Import from URL')}
            </div>
            <input
              type="url"
              value={productUrl}
              onChange={(e) => setProductUrl(e.target.value)}
              placeholder={t('imageAdsPage.urlPlaceholder', 'https://yourbrand.com/product')}
              className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-brand-mid/30 dark:bg-surface-elevated"
            />
            <ImageAdsBusyButton busy={analyzing} onClick={runAnalyze} disabled={!tryHost(productUrl)}>
              <Sparkles className="h-4 w-4" aria-hidden />
              {t('imageAdsPage.analyze', 'Analyze')}
            </ImageAdsBusyButton>
          </div>

          <div className="relative py-2 text-center text-caption font-semibold uppercase tracking-wider text-text-tertiary">
            <span className="relative z-10 bg-surface px-3 dark:bg-surface-elevated">{t('imageAdsPage.or', 'Or')}</span>
            <div className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-border" aria-hidden />
          </div>

          <div className="space-y-3 rounded-2xl border border-border/60 bg-surface-2/50 p-5 dark:bg-brand-ink/30">
            <div className="flex items-center gap-2 text-sm font-semibold text-text-primary">
              <CheckCircle2 className="h-4 w-4 text-success" aria-hidden />
              {t('imageAdsPage.savedProducts', 'Choose a saved product')}
            </div>
            <p className="text-body-sm text-text-secondary">
              {t('imageAdsPage.savedProductsHint', 'Pick a product you have already set up with images and selling points.')}
            </p>
            <p className="rounded-xl border border-dashed border-border/80 bg-surface/80 px-4 py-8 text-center text-sm text-text-tertiary dark:bg-brand-ink/20">
              {t('imageAdsPage.noProducts', 'No products yet. Import one from a URL above.')}
            </p>
            <Link href="/creative-hub/products" className="text-sm font-semibold text-brand-mid hover:underline dark:text-brand-lime">
              {t('imageAdsPage.manageProducts', 'Manage products')}
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-6 rounded-3xl border border-border/80 bg-surface p-6 shadow-sm dark:bg-surface-elevated/80 md:p-8">
          <label className="block space-y-2">
            <span className="text-sm font-semibold text-text-primary">{t('imageAdsPage.instructionsLabel', 'Instructions')}</span>
            <textarea
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              rows={8}
              maxLength={2000}
              className="w-full resize-y rounded-xl border border-border bg-surface-2/80 px-4 py-3 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-mid/30 dark:bg-brand-ink/40"
            />
            <span className="text-caption text-text-tertiary">
              {instructions.length}/2,000
            </span>
          </label>

          <div>
            <p className="text-sm font-semibold text-text-primary">{t('imageAdsPage.aspectTitle', 'Aspect ratios')}</p>
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              {(
                [
                  { id: '1:1' as const, label: t('imageAdsPage.aspect11', '1:1 Square (feed)') },
                  { id: '4:5' as const, label: t('imageAdsPage.aspect45', '4:5 Portrait (feed)') },
                  { id: '9:16' as const, label: t('imageAdsPage.aspect916', '9:16 Stories / reels') },
                ]
              ).map(({ id, label }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setAspect(id)}
                  className={cn(
                    'rounded-2xl border px-3 py-3 text-left text-sm font-medium transition-colors',
                    aspect === id
                      ? 'border-brand-mid bg-brand-mid text-brand-ink dark:border-brand-lime dark:bg-brand-lime dark:text-brand-ink'
                      : 'border-border/80 bg-surface-2/60 text-text-secondary hover:border-brand-mid/30 dark:bg-brand-ink/30',
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-semibold text-text-primary">{t('imageAdsPage.variations', 'Variations')}</span>
              <span className="text-sm font-bold text-brand-mid dark:text-brand-lime">{variations}</span>
            </div>
            <input
              type="range"
              min={1}
              max={4}
              value={variations}
              onChange={(e) => setVariations(Number(e.target.value))}
              className="mt-2 w-full accent-brand-mid dark:accent-brand-lime"
            />
          </div>

          <div className="rounded-2xl border border-dashed border-border/80 bg-surface-2/40 px-4 py-6 text-center text-body-sm text-text-secondary dark:bg-brand-ink/25">
            {t('imageAdsPage.noBrandKit', 'No brand kits found.')}{' '}
            <Link href="/creative-hub/brand-kit" className="font-semibold text-brand-mid hover:underline dark:text-brand-lime">
              {t('imageAdsPage.createBrandKit', 'Create a brand kit')}
            </Link>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              className="rounded-xl border border-border px-4 py-2.5 text-sm font-medium text-text-secondary hover:bg-surface-2"
              onClick={() => setStep('input')}
            >
              {t('imageAdsPage.backToInput', 'Back to input')}
            </button>
            <ImageAdsBusyButton busy={generating} onClick={handleGenerate}>
              <Sparkles className="h-4 w-4" aria-hidden />
              {generating
                ? t('imageAdsPage.generating', 'Generating…')
                : t('imageAdsPage.generate', 'Generate')}
            </ImageAdsBusyButton>
          </div>

          {genError && (
            <p className="mt-3 rounded-xl border border-amber-400/40 bg-amber-400/10 p-3 text-sm text-amber-700 dark:text-amber-300">
              {genError}
            </p>
          )}

          {generating && (
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {Array.from({ length: Math.min(4, Math.max(1, variations)) }).map((_, i) => (
                <div
                  key={i}
                  className="aspect-square animate-pulse rounded-2xl border border-border/60 bg-surface-2/60"
                />
              ))}
            </div>
          )}

          {results.length > 0 && (
            <div className="mt-5">
              <p className="mb-3 text-sm font-semibold text-text-primary">
                {t('imageAdsPage.resultsTitle', 'Generated ads')}
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                {results.map((url, i) => (
                  <div
                    key={url}
                    className="group relative overflow-hidden rounded-2xl border border-border/70 bg-surface-2/40"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={url}
                      alt={`${t('imageAdsPage.generate', 'Generate')} ${i + 1}`}
                      className="h-full w-full object-cover"
                    />
                    <a
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      download
                      className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-lg bg-black/60 px-2 py-1 text-xs font-medium text-white opacity-0 transition-opacity group-hover:opacity-100"
                    >
                      <Download className="h-3.5 w-3.5" aria-hidden />
                      {t('imageAdsPage.download', 'Download')}
                    </a>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </ImageAdsShell>
  )
}
