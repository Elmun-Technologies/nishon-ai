'use client'

import Link from 'next/link'
import { ArrowLeft, Check, Loader2, Settings, Upload } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useI18n } from '@/i18n/use-i18n'

export type ImageAdsStep = 'input' | 'configure'

interface ImageAdsShellProps {
  /** Current step in the left rail */
  activeStep: ImageAdsStep
  /** Page title shown next to back link (e.g. "Image Ads") */
  pageTitle: string
  /** Main column heading */
  mainTitle: string
  mainSubtitle?: string
  children: React.ReactNode
}

function StepRow({
  label,
  hint,
  active,
  done,
  icon: Icon,
}: {
  label: string
  hint: string
  active: boolean
  done: boolean
  icon: typeof Upload
}) {
  return (
    <div
      className={cn(
        'flex gap-3 rounded-2xl border px-3 py-3 transition-colors',
        active
          ? 'border-brand-mid/50 bg-brand-mid/10 dark:border-brand-lime/40 dark:bg-brand-lime/10'
          : 'border-border/70 bg-surface/80 dark:bg-surface-elevated/60',
      )}
    >
      <div
        className={cn(
          'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl',
          active ? 'bg-brand-mid text-brand-ink dark:bg-brand-lime dark:text-brand-ink' : 'bg-surface-2 text-text-tertiary',
        )}
      >
        {done && !active ? <Check className="h-5 w-5 text-success" aria-hidden /> : <Icon className="h-5 w-5" aria-hidden />}
      </div>
      <div className="min-w-0">
        <p className={cn('text-sm font-semibold', active ? 'text-brand-mid dark:text-brand-lime' : 'text-text-primary')}>
          {label}
        </p>
        <p className="text-caption text-text-tertiary">{hint}</p>
      </div>
    </div>
  )
}

export function ImageAdsShell({ activeStep, pageTitle, mainTitle, mainSubtitle, children }: ImageAdsShellProps) {
  const { t } = useI18n()
  const inputDone = activeStep === 'configure'

  return (
    <div className="mx-auto max-w-6xl space-y-6 pb-16 pt-2">
      <div className="flex flex-wrap items-center gap-3">
        <Link
          href="/creative-hub/image-ads"
          className="inline-flex items-center gap-2 text-sm font-medium text-text-secondary transition-colors hover:text-brand-mid dark:hover:text-brand-lime"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          {t('imageAdsPage.backToImageAds', 'Back to Image Ads')}
        </Link>
        <span className="text-text-tertiary">·</span>
        <span className="text-sm font-semibold text-text-primary">{pageTitle}</span>
      </div>

      <div className="flex flex-col gap-8 lg:flex-row lg:items-start">
        <aside className="w-full shrink-0 space-y-3 lg:w-56">
          <StepRow
            label={t('imageAdsPage.stepInput', 'Input')}
            hint={activeStep === 'input' ? t('imageAdsPage.stepInProgress', 'In progress') : t('imageAdsPage.stepDone', 'Done')}
            active={activeStep === 'input'}
            done={inputDone}
            icon={Upload}
          />
          <StepRow
            label={t('imageAdsPage.stepConfigure', 'Configure')}
            hint={
              activeStep === 'configure'
                ? t('imageAdsPage.stepInProgress', 'In progress')
                : t('imageAdsPage.stepPending', 'Pending')
            }
            active={activeStep === 'configure'}
            done={false}
            icon={Settings}
          />
        </aside>

        <div className="min-w-0 flex-1 space-y-2">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-text-primary md:text-3xl">{mainTitle}</h1>
            {mainSubtitle ? <p className="mt-1 max-w-2xl text-body-sm text-text-secondary">{mainSubtitle}</p> : null}
          </div>
          <div className="mt-6">{children}</div>
        </div>
      </div>
    </div>
  )
}

export function ImageAdsBusyButton({
  busy,
  children,
  className,
  disabled,
  ...props
}: React.ComponentProps<'button'> & { busy?: boolean }) {
  return (
    <button
      type="button"
      disabled={busy || disabled}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-brand-ink shadow-sm transition-opacity disabled:cursor-not-allowed disabled:opacity-50',
        'bg-gradient-to-r from-brand-mid to-brand-lime',
        className,
      )}
      {...props}
    >
      {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
      {children}
    </button>
  )
}
