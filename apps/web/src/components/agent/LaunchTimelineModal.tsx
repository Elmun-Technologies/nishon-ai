'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { Bot, Check, Loader2, Rocket, Send, Sparkles, X } from 'lucide-react'
import { useI18n } from '@/i18n/use-i18n'
import { cn } from '@/lib/utils'
import { adCopyFor, detectVertical, type CopyLang, type Vertical } from '@/lib/ad-copy-templates'
import type { FunnelStage } from '@/lib/funnel-allocator'
import { MetaAdPreview } from './MetaAdPreview'
import { TelegramAdPreview } from './TelegramAdPreview'

/**
 * The premium "Launch the AI Agent" overlay. Two phases:
 *
 *   analyzing → 4-step timeline (1.5s each), simulating scrape → audience →
 *               copywriting → guardrails
 *   preview   → tabbed high-fidelity Meta / Telegram ad mocks + "Approve & Go
 *               Live" (activates the agent)
 *
 * The overlay is closable during the preview phase; during analyzing it stays
 * up so the user sees the sequence through.
 */

const LAUNCH_STEPS = [
  { key: 'scrape', ms: 1500 },
  { key: 'audience', ms: 1500 },
  { key: 'copy', ms: 1500 },
  { key: 'guardrails', ms: 1500 },
] as const

type Phase = 'analyzing' | 'preview'
type Platform = 'meta' | 'telegram'

/** Vertical → brand handle + gradient used in the preview mocks. */
const VERTICAL_BRAND: Record<Vertical, { handle: string; gradient: string }> = {
  apparel: {
    handle: 'nishon.fashion',
    gradient: 'linear-gradient(135deg,#f472b6 0%,#a855f7 55%,#3b82f6 100%)',
  },
  education: {
    handle: 'nishon.academy',
    gradient: 'linear-gradient(135deg,#22d3ee 0%,#6366f1 55%,#1e293b 100%)',
  },
  food: {
    handle: 'nishon.kitchen',
    gradient: 'linear-gradient(135deg,#fb923c 0%,#ef4444 55%,#7c2d12 100%)',
  },
  generic: {
    handle: 'nishon.brand',
    gradient: 'linear-gradient(135deg,#84cc16 0%,#22c55e 55%,#0f766e 100%)',
  },
}

export function LaunchTimelineModal({
  open,
  link,
  onApprove,
  onClose,
  activating,
  error,
}: {
  open: boolean
  link: string
  onApprove: () => void
  onClose: () => void
  activating: boolean
  error?: string
}) {
  const { t, language } = useI18n()
  const [phase, setPhase] = useState<Phase>('analyzing')
  const [stepIndex, setStepIndex] = useState(0)
  const [platform, setPlatform] = useState<Platform>('meta')
  const [previewStage, setPreviewStage] = useState<FunnelStage>('BOFU')
  const timers = useRef<ReturnType<typeof setTimeout>[]>([])

  const vertical = useMemo<Vertical>(() => detectVertical(link), [link])
  const brand = VERTICAL_BRAND[vertical]
  const lang: CopyLang = (['uz', 'ru', 'en'] as const).includes(language as CopyLang)
    ? (language as CopyLang)
    : 'uz'
  const copy = useMemo(() => adCopyFor(vertical, previewStage, lang), [vertical, previewStage, lang])

  // Kick off the timeline every time the modal opens.
  useEffect(() => {
    if (!open) return
    setPhase('analyzing')
    setStepIndex(0)
    setPlatform('meta')
    setPreviewStage('BOFU')
    timers.current.forEach(clearTimeout)
    timers.current = []
    let elapsed = 0
    LAUNCH_STEPS.forEach((step, i) => {
      elapsed += step.ms
      timers.current.push(
        setTimeout(() => {
          if (i + 1 < LAUNCH_STEPS.length) setStepIndex(i + 1)
          else setPhase('preview')
        }, elapsed),
      )
    })
    return () => timers.current.forEach(clearTimeout)
  }, [open])

  // Lock body scroll + Esc handling while open.
  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onEsc = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      if (phase === 'preview' && !activating) onClose()
    }
    document.addEventListener('keydown', onEsc)
    return () => {
      document.body.style.overflow = prev
      document.removeEventListener('keydown', onEsc)
    }
  }, [open, phase, activating, onClose])

  if (!open) return null

  const STEP_LABEL: Record<string, string> = {
    scrape: t(
      'agent.launch.scrape',
      'Saytingiz metama’lumotlari yig’ilmoqda va tahlil qilinmoqda…',
    ),
    audience: t(
      'agent.launch.audience',
      'Maqsadli auditoriya va raqobat pozitsiyasi aniqlanmoqda…',
    ),
    copy: t(
      'agent.launch.copy',
      'Meta, Google va Telegram uchun yuqori konversiyali matnlar yaratilmoqda…',
    ),
    guardrails: t(
      'agent.launch.guardrails',
      'Mikro-byudjet taqsimoti tuzilmoqda va stop-loss himoyasi o’rnatilmoqda…',
    ),
  }

  const stagePcts: Record<FunnelStage, number> = { TOFU: 33, MOFU: 67, BOFU: 100 }
  const progress =
    phase === 'preview' ? 100 : Math.round(((stepIndex + 1) / LAUNCH_STEPS.length) * 100)

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-md"
      role="dialog"
      aria-modal="true"
      aria-label={t('agent.launch.title', 'AI Agent ishga tushirilmoqda')}
    >
      <div className="relative w-full max-w-3xl overflow-hidden rounded-3xl border border-brand-lime/25 bg-surface shadow-2xl">
        {/* Header */}
        <div className="flex items-center gap-3 border-b border-border bg-gradient-to-br from-brand-ink/[0.03] to-brand-lime/[0.06] px-6 py-4 dark:from-white/[0.02] dark:to-brand-lime/[0.04]">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-brand-lime/20 text-brand-mid dark:text-brand-lime">
            {phase === 'analyzing' ? (
              <Bot className="h-5 w-5" aria-hidden />
            ) : (
              <Sparkles className="h-5 w-5" aria-hidden />
            )}
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="text-lg font-bold text-text-primary">
              {phase === 'analyzing'
                ? t('agent.launch.title', 'AI Agent ishga tushirilmoqda')
                : t('agent.preview.title', 'AI tayyorlagan reklama namunalari')}
            </h2>
            <p className="text-xs text-text-secondary">
              {phase === 'analyzing'
                ? t('agent.launch.subtitle', 'Bir necha soniyada tayyor bo’ladi')
                : t(
                    'agent.preview.subtitle',
                    'Ko’rib chiqing va tasdiqlang — Agent shu ondayoq boshlaydi.',
                  )}
            </p>
          </div>
          {phase === 'preview' && !activating && (
            <button
              type="button"
              onClick={onClose}
              className="rounded-md p-1 text-text-tertiary hover:bg-surface-2 hover:text-text-primary"
              aria-label={t('common.close', 'Yopish')}
            >
              <X className="h-4 w-4" aria-hidden />
            </button>
          )}
        </div>

        {/* Progress bar */}
        <div className="h-1 w-full bg-surface-2/60">
          <div
            className="h-full rounded-r-full bg-brand-lime transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Body */}
        <div className="p-6">
          {phase === 'analyzing' && (
            <div className="space-y-3">
              {LAUNCH_STEPS.map((step, i) => {
                const done = i < stepIndex
                const current = i === stepIndex
                return (
                  <div
                    key={step.key}
                    className={cn(
                      'flex items-start gap-3 rounded-xl border px-3 py-3 transition-all duration-300',
                      current
                        ? 'border-brand-lime/40 bg-brand-lime/[0.08]'
                        : done
                          ? 'border-border bg-surface-2/40'
                          : 'border-transparent opacity-40',
                    )}
                  >
                    <span
                      className={cn(
                        'mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full',
                        done
                          ? 'bg-emerald-500 text-white'
                          : current
                            ? 'bg-brand-lime/20 text-brand-mid dark:text-brand-lime'
                            : 'bg-surface-2/60 text-text-tertiary',
                      )}
                    >
                      {done ? (
                        <Check className="h-4 w-4" aria-hidden />
                      ) : current ? (
                        <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                      ) : (
                        <span className="text-xs font-semibold">{i + 1}</span>
                      )}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] font-bold uppercase tracking-wide text-text-tertiary">
                        {t('agent.launch.step', 'Qadam')} {i + 1}
                      </p>
                      <p
                        className={cn(
                          'mt-0.5 text-sm leading-snug',
                          current ? 'font-medium text-text-primary' : 'text-text-secondary',
                        )}
                      >
                        {STEP_LABEL[step.key]}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {phase === 'preview' && (
            <div className="space-y-4">
              {/* Platform tabs */}
              <div className="flex gap-1.5">
                {(
                  [
                    { id: 'meta', label: t('agent.preview.metaTab', 'Meta · Instagram Feed') },
                    { id: 'telegram', label: t('agent.preview.telegramTab', 'Telegram Channel') },
                  ] as const
                ).map((tab) => {
                  const active = platform === tab.id
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setPlatform(tab.id)}
                      className={cn(
                        'flex-1 rounded-xl border px-3 py-2 text-sm font-semibold transition-all',
                        active
                          ? 'border-brand-lime bg-brand-lime/10 text-brand-mid dark:text-brand-lime'
                          : 'border-border text-text-secondary hover:border-brand-lime/40',
                      )}
                    >
                      {tab.label}
                    </button>
                  )
                })}
              </div>

              {/* Funnel stage sub-tabs */}
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wide text-text-tertiary">
                  {t('agent.preview.stage', 'Bosqich')}
                </span>
                <div className="flex flex-1 gap-1">
                  {(['TOFU', 'MOFU', 'BOFU'] as FunnelStage[]).map((s) => {
                    const active = previewStage === s
                    return (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setPreviewStage(s)}
                        className={cn(
                          'flex-1 rounded-lg border px-2 py-1 text-[11px] font-semibold transition-colors',
                          active
                            ? 'border-brand-lime bg-brand-lime/10 text-brand-mid dark:text-brand-lime'
                            : 'border-border text-text-secondary hover:border-brand-lime/40',
                        )}
                      >
                        {s} · {stagePcts[s]}%
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* The preview itself */}
              <div className="rounded-2xl border border-border bg-surface-2/30 p-5">
                {platform === 'meta' ? (
                  <MetaAdPreview brand={brand.handle} copy={copy} gradient={brand.gradient} />
                ) : (
                  <TelegramAdPreview brand={brand.handle} copy={copy} gradient={brand.gradient} />
                )}
              </div>

              {error && (
                <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-600 ring-1 ring-inset ring-red-200 dark:bg-red-500/10">
                  {error}
                </p>
              )}

              {/* Approve CTA */}
              <div className="flex flex-wrap items-center gap-2 border-t border-border pt-4">
                <p className="mr-auto text-xs text-text-secondary">
                  <Send className="mr-1 inline h-3 w-3" aria-hidden />
                  {t(
                    'agent.preview.footer',
                    'Faollashtirilgach, Agent Meta, Google va Telegram’da avtomatik boshlaydi.',
                  )}
                </p>
                <button
                  type="button"
                  onClick={onClose}
                  disabled={activating}
                  className="rounded-full border border-border px-4 py-2.5 text-sm font-semibold text-text-secondary transition-colors hover:bg-surface-2/50 disabled:opacity-50"
                >
                  {t('agent.preview.cancel', 'Bekor qilish')}
                </button>
                <button
                  type="button"
                  onClick={onApprove}
                  disabled={activating}
                  className="inline-flex h-11 items-center gap-2 rounded-full bg-[#1b2e06] px-5 text-sm font-semibold text-white shadow-[0_8px_24px_-12px_rgba(27,46,6,0.5)] transition-all hover:bg-[#243a12] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {activating ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                      {t('agent.preview.going', 'Faollashtirilmoqda…')}
                    </>
                  ) : (
                    <>
                      <Rocket className="h-4 w-4" aria-hidden />
                      {t('agent.preview.approve', 'Tasdiqlash va ishga tushirish')}
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default LaunchTimelineModal
