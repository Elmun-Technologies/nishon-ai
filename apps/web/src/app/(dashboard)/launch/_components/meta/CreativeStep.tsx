'use client'

import Link from 'next/link'
import { ExternalLink } from 'lucide-react'
import { Input, Textarea } from '@/components/ui'
import { WizardStepCard } from '@/components/launch/wizard-shell'
import { useI18n } from '@/i18n/use-i18n'
import type { LaunchWizardCtl } from '../../_lib/use-launch-wizard'
import { StepFooter } from '../StepFooter'

export function CreativeStep({ ctl }: { ctl: LaunchWizardCtl }) {
  const { t } = useI18n()
  const lt = (path: string, fallback: string) => t(`launchWizard.${path}`, fallback)

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

        <Input
          label={lt('meta.creativeUrl', 'URL')}
          value={ctl.metaData.creativeUrl}
          onChange={(e) => ctl.setMetaData((d) => ({ ...d, creativeUrl: e.target.value }))}
          placeholder="https://"
        />

        <div className="space-y-2">
          <label className="block text-sm font-medium text-text-secondary">
            {lt('meta.creativeText', 'Reklama matni')}
          </label>
          <Textarea
            value={ctl.metaData.creativeText}
            onChange={(e) => ctl.setMetaData((d) => ({ ...d, creativeText: e.target.value }))}
            placeholder="…"
            rows={4}
          />
          <p className="text-[11px] text-text-tertiary">
            {ctl.metaData.creativeText.length} ta belgi
          </p>
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
