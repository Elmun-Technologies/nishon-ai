'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { AlertCircle, ExternalLink, Facebook, Sparkles } from 'lucide-react'
import { Input, Textarea } from '@/components/ui'
import { WizardStepCard } from '@/components/launch/wizard-shell'
import { useI18n } from '@/i18n/use-i18n'
import { aiAgent, platforms } from '@/lib/api-client'
import { useWorkspaceStore } from '@/stores/workspace.store'
import { cn } from '@/lib/utils'
import type { LaunchWizardCtl } from '../../_lib/use-launch-wizard'
import { StepFooter } from '../StepFooter'

export function CreativeStep({ ctl }: { ctl: LaunchWizardCtl }) {
  const { t } = useI18n()
  const lt = (path: string, fallback: string) => t(`launchWizard.${path}`, fallback)
  const { currentWorkspace } = useWorkspaceStore()
  const [pages, setPages] = useState<Array<{ id: string; name: string }>>([])
  const [pagesLoading, setPagesLoading] = useState(false)
  const [pagesError, setPagesError] = useState('')
  const [copyLoading, setCopyLoading] = useState(false)
  const [copyError, setCopyError] = useState('')

  /**
   * Let the agent write the ad copy — one click instead of a blank textarea.
   * Uses the workspace + chosen objective as context, then fills the message,
   * campaign name and CTA. Everything stays editable (Vaqt, not lock-in).
   */
  const handleWriteCopy = async () => {
    setCopyLoading(true)
    setCopyError('')
    try {
      const productName =
        currentWorkspace?.name?.trim() || ctl.metaData.name.trim() || 'Mahsulot'
      const audience =
        currentWorkspace?.targetAudience?.trim() || 'Keng omma va potentsial mijozlar'
      const benefits = [currentWorkspace?.industry?.trim()].filter(
        (b): b is string => !!b,
      )
      const res = await aiAgent.wizardAdCopy({
        productName,
        benefits: benefits.length ? benefits : ['sifat', 'ishonch', 'tezkor xizmat'],
        objective: ctl.metaData.objective || 'leads',
        audience,
        platform: 'meta',
      })
      const copy = (res.data ?? {}) as {
        headlines?: string[]
        descriptions?: string[]
        cta?: string
        primaryText?: string
      }
      const body =
        copy.primaryText?.trim() ||
        copy.descriptions?.[0]?.trim() ||
        copy.headlines?.[0]?.trim() ||
        ''
      if (!body) {
        setCopyError('AI matn qaytarmadi — qayta urinib ko\'ring.')
        return
      }
      ctl.setMetaData((d) => ({
        ...d,
        creativeText: body,
        creativeName: d.creativeName || copy.headlines?.[0]?.trim() || d.creativeName,
      }))
    } catch (err: any) {
      setCopyError(
        err?.response?.data?.message ||
          err?.message ||
          'Matn yaratishda xato. Keyinroq urinib ko\'ring.',
      )
    } finally {
      setCopyLoading(false)
    }
  }

  useEffect(() => {
    if (!currentWorkspace?.id) return
    let cancelled = false
    setPagesLoading(true)
    setPagesError('')
    platforms
      .getMetaPages(currentWorkspace.id)
      .then((res) => {
        if (cancelled) return
        const list = (res.data ?? []).map((p) => ({ id: p.id, name: p.name }))
        setPages(list)
        // Auto-select first Page if user hasn't picked one yet.
        if (!ctl.metaData.pageId && list.length > 0) {
          ctl.setMetaData((d) => ({ ...d, pageId: list[0].id }))
        }
      })
      .catch((err: any) => {
        if (cancelled) return
        // Don't surface 404/no-account errors loudly — the user simply
        // hasn't connected Meta yet. They can still continue without a
        // Page (campaign + adset will be created, ad will be empty).
        const msg = err?.response?.data?.message || err?.message || ''
        if (/No active|not connected|404/i.test(msg)) {
          setPagesError('')
        } else {
          setPagesError(msg)
        }
      })
      .finally(() => {
        if (!cancelled) setPagesLoading(false)
      })
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentWorkspace?.id])

  return (
    <WizardStepCard>
      <div className="space-y-6 p-6 md:p-8">
        <div>
          <h2 className="text-lg font-semibold text-text-primary">
            🎨 {lt('meta.creativeTitle', 'Kreativ')}
          </h2>
          <p className="mt-1 text-sm text-text-secondary">
            {lt('meta.creativeSubtitle', "Foydalanuvchilar nimani ko'rishadi?")}
          </p>
        </div>

        <Link
          href="/creative-hub"
          target="_blank"
          className="flex items-center gap-2 rounded-xl border border-brand-mid/30 bg-brand-mid/[0.05] px-3 py-2.5 text-sm text-brand-mid transition-colors hover:bg-brand-mid/10 dark:border-brand-lime/30 dark:bg-brand-lime/[0.05] dark:text-brand-lime"
        >
          <ExternalLink className="h-3.5 w-3.5" aria-hidden />
          Creative Hub&apos;da yangi kreativ yarating
        </Link>

        {/* Facebook Page selector — required for new ad creative */}
        <div className="space-y-2">
          <label
            className="block text-sm font-medium text-text-secondary"
            htmlFor="meta-page"
          >
            <span className="inline-flex items-center gap-1.5">
              <Facebook className="h-3.5 w-3.5 text-[#0866FF]" aria-hidden />
              Facebook Page <span className="text-rose-500">*</span>
            </span>
          </label>
          {pagesLoading ? (
            <div className="h-11 animate-pulse rounded-lg bg-surface-2/60" />
          ) : pages.length === 0 ? (
            <div className="flex items-start gap-2 rounded-xl border border-amber-500/30 bg-amber-50 p-3 dark:border-amber-500/40 dark:bg-amber-500/10">
              <AlertCircle
                className="mt-0.5 h-4 w-4 shrink-0 text-amber-700 dark:text-amber-400"
                aria-hidden
              />
              <div className="min-w-0 text-xs leading-relaxed text-amber-900 dark:text-amber-100">
                <p className="font-semibold">Facebook Page topilmadi</p>
                <p className="mt-0.5 text-amber-800 dark:text-amber-200/80">
                  Meta hisobingiz ulanmagan yoki Page tug&apos;mish ruxsati berilmagan.
                  Reklama hozir ko&apos;rinmaydi — keyin Meta&apos;da qo&apos;shasiz.
                </p>
                <Link
                  href="/settings/meta"
                  className="mt-1.5 inline-flex items-center gap-1 font-semibold text-amber-900 underline-offset-2 hover:underline dark:text-amber-100"
                >
                  Meta&apos;ni sozlash
                  <ExternalLink className="h-3 w-3" aria-hidden />
                </Link>
              </div>
            </div>
          ) : (
            <select
              id="meta-page"
              value={ctl.metaData.pageId}
              onChange={(e) =>
                ctl.setMetaData((d) => ({ ...d, pageId: e.target.value }))
              }
              className="w-full rounded-lg border border-border bg-surface px-4 py-2.5 text-sm focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/15"
            >
              <option value="">Page tanlang…</option>
              {pages.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          )}
          {pagesError && (
            <p
              className={cn(
                'text-xs',
                /No active|not connected/i.test(pagesError)
                  ? 'text-text-tertiary'
                  : 'text-rose-600',
              )}
            >
              {pagesError}
            </p>
          )}
        </div>

        <Input
          label={lt('meta.creativeUrl', 'URL')}
          value={ctl.metaData.creativeUrl}
          onChange={(e) => ctl.setMetaData((d) => ({ ...d, creativeUrl: e.target.value }))}
          placeholder="https://"
        />

        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <label className="block text-sm font-medium text-text-secondary">
              {lt('meta.creativeText', 'Reklama matni')}
            </label>
            <button
              type="button"
              onClick={handleWriteCopy}
              disabled={copyLoading}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition-colors',
                'border-brand-mid/30 bg-brand-mid/[0.06] text-brand-mid hover:bg-brand-mid/12',
                'disabled:cursor-not-allowed disabled:opacity-60',
                'dark:border-brand-lime/30 dark:bg-brand-lime/[0.06] dark:text-brand-lime',
              )}
            >
              <Sparkles className={cn('h-3.5 w-3.5', copyLoading && 'animate-pulse')} aria-hidden />
              {copyLoading ? 'AI yozmoqda…' : 'AI matn yozib bersin'}
            </button>
          </div>
          <Textarea
            value={ctl.metaData.creativeText}
            onChange={(e) => ctl.setMetaData((d) => ({ ...d, creativeText: e.target.value }))}
            placeholder="…"
            rows={4}
          />
          <div className="flex items-center justify-between gap-2">
            <p className="text-[11px] text-text-tertiary">
              {ctl.metaData.creativeText.length} ta belgi
            </p>
            {copyError && <p className="text-[11px] text-rose-600">{copyError}</p>}
          </div>
        </div>

        <div>
          <label
            className="mb-2 block text-sm font-medium text-text-secondary"
            htmlFor="meta-cta"
          >
            {lt('meta.ctaLabel', 'CTA tugmasi')}
          </label>
          <select
            id="meta-cta"
            value={ctl.metaData.ctaButton}
            onChange={(e) => ctl.setMetaData((d) => ({ ...d, ctaButton: e.target.value }))}
            className="w-full rounded-lg border border-border bg-surface px-4 py-2.5 text-sm focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/15"
          >
            <option value="learn_more">{lt('meta.cta_learn_more', 'Learn more')}</option>
            <option value="contact_us">{lt('meta.cta_contact', 'Contact us')}</option>
            <option value="shop_now">{lt('meta.cta_shop', 'Shop now')}</option>
            <option value="sign_up">{lt('meta.cta_signup', 'Sign up')}</option>
          </select>
        </div>

        {ctl.metaData.creativeText && (
          <div className="rounded-xl border border-border bg-surface-2/40 p-4 dark:bg-surface-elevated/30">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-text-tertiary">
              Ko&apos;rinish (taxminiy)
            </p>
            <div className="rounded-lg border border-border bg-surface p-3 shadow-sm">
              <p className="line-clamp-3 text-sm text-text-primary">{ctl.metaData.creativeText}</p>
              <button
                type="button"
                disabled
                className="mt-3 rounded-md bg-[#0866FF] px-4 py-1.5 text-xs font-semibold text-white"
              >
                {ctl.metaData.ctaButton === 'learn_more'
                  ? 'Learn more'
                  : ctl.metaData.ctaButton === 'contact_us'
                    ? 'Contact us'
                    : ctl.metaData.ctaButton === 'shop_now'
                      ? 'Shop now'
                      : 'Sign up'}
              </button>
            </div>
          </div>
        )}
      </div>

      <StepFooter
        onBack={() => ctl.setMetaStep(4)}
        onContinue={() => ctl.setMetaStep(6)}
        continueLabel={lt('common.review', 'Tasdiqlash')}
      />
    </WizardStepCard>
  )
}
