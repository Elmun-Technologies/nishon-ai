'use client'

import { ChevronLeft, ChevronRight, Search } from 'lucide-react'
import { Alert, Button, Input, Textarea } from '@/components/ui'
import {
  WizardChoiceRow,
  WizardStepCard,
} from '@/components/launch/wizard-shell'
import { useI18n } from '@/i18n/use-i18n'
import { WizardHeader } from '../WizardHeader'
import type { LaunchWizardCtl } from '../../_lib/use-launch-wizard'
import type { GoogleStep } from '../../_lib/types'

export function GoogleWizard({ ctl }: { ctl: LaunchWizardCtl }) {
  const { t } = useI18n()
  const lt = (path: string, fallback: string) => t(`launchWizard.${path}`, fallback)

  const steps = [
    { id: 1, label: 'Type' },
    { id: 2, label: 'Keywords' },
    { id: 3, label: 'Ads' },
    { id: 4, label: 'Budget' },
    { id: 5, label: 'Review' },
  ]

  const isReachable = (id: number) => id <= ctl.googleStep

  return (
    <div className="mx-auto max-w-3xl space-y-6 py-6">
      <WizardHeader
        title={lt('google.pageTitle', 'Google Ads')}
        currentStep={ctl.googleStep}
        steps={steps}
        onJump={(id) => ctl.setGoogleStep(id as GoogleStep)}
        isStepReachable={isReachable}
        onBack={ctl.exitToMode}
        onExit={ctl.exitToHub}
      />
      {ctl.error ? <Alert variant="error">{ctl.error}</Alert> : null}

      {ctl.googleStep === 1 && (
        <WizardStepCard>
          <div className="space-y-5 p-6 md:p-8">
            <h2 className="text-lg font-semibold text-text-primary">{lt('google.s1Title', '')}</h2>
            <div className="space-y-2">
              {(
                [
                  {
                    value: 'search' as const,
                    title: lt('google.s1Search', ''),
                    desc: lt('google.s1SearchDesc', ''),
                  },
                  {
                    value: 'display' as const,
                    title: lt('google.s1Display', ''),
                    desc: lt('google.s1DisplayDesc', ''),
                  },
                  {
                    value: 'smart' as const,
                    title: lt('google.s1Smart', ''),
                    desc: lt('google.s1SmartDesc', ''),
                  },
                ] as const
              ).map((opt) => (
                <WizardChoiceRow
                  key={opt.value}
                  selected={ctl.googleData.campaignType === opt.value}
                  onClick={() => ctl.setGoogleData((d) => ({ ...d, campaignType: opt.value }))}
                  icon={<Search className="h-5 w-5" aria-hidden />}
                  title={opt.title}
                  description={opt.desc}
                />
              ))}
            </div>
          </div>
          <Footer
            onBack={ctl.exitToMode}
            backLabel={lt('common.back', 'Back')}
            onContinue={() => ctl.setGoogleStep(2)}
          />
        </WizardStepCard>
      )}

      {ctl.googleStep === 2 && (
        <WizardStepCard>
          <div className="space-y-4 p-6 md:p-8">
            <h2 className="text-lg font-semibold text-text-primary">{lt('google.s2Title', '')}</h2>
            <Textarea
              value={ctl.googleData.keywords}
              onChange={(e) => ctl.setGoogleData((d) => ({ ...d, keywords: e.target.value }))}
              placeholder={lt('google.s2Ph', '')}
              rows={5}
            />
          </div>
          <Footer
            onBack={() => ctl.setGoogleStep(1)}
            onContinue={() => ctl.setGoogleStep(3)}
          />
        </WizardStepCard>
      )}

      {ctl.googleStep === 3 && (
        <WizardStepCard>
          <div className="space-y-4 p-6 md:p-8">
            <h2 className="text-lg font-semibold text-text-primary">{lt('google.s3Title', '')}</h2>
            <Input
              value={ctl.googleData.headline1}
              onChange={(e) => ctl.setGoogleData((d) => ({ ...d, headline1: e.target.value }))}
              placeholder={lt('google.h1', '')}
            />
            <Input
              value={ctl.googleData.headline2}
              onChange={(e) => ctl.setGoogleData((d) => ({ ...d, headline2: e.target.value }))}
              placeholder={lt('google.h2', '')}
            />
            <Input
              value={ctl.googleData.headline3}
              onChange={(e) => ctl.setGoogleData((d) => ({ ...d, headline3: e.target.value }))}
              placeholder={lt('google.h3', '')}
            />
            <Textarea
              value={ctl.googleData.description1}
              onChange={(e) => ctl.setGoogleData((d) => ({ ...d, description1: e.target.value }))}
              placeholder={lt('google.d1', '')}
              rows={2}
            />
            <Textarea
              value={ctl.googleData.description2}
              onChange={(e) => ctl.setGoogleData((d) => ({ ...d, description2: e.target.value }))}
              placeholder={lt('google.d2', '')}
              rows={2}
            />
          </div>
          <Footer
            onBack={() => ctl.setGoogleStep(2)}
            onContinue={() => ctl.setGoogleStep(4)}
          />
        </WizardStepCard>
      )}

      {ctl.googleStep === 4 && (
        <WizardStepCard>
          <div className="space-y-4 p-6 md:p-8">
            <h2 className="text-lg font-semibold text-text-primary">{lt('google.s4Title', '')}</h2>
            <Input
              type="number"
              min={1}
              label={lt('google.daily', '')}
              value={ctl.googleData.dailyBudget}
              onChange={(e) => ctl.setGoogleData((d) => ({ ...d, dailyBudget: e.target.value }))}
              placeholder="50"
            />
            <div>
              <label
                className="text-label mb-2 block font-medium text-text-secondary"
                htmlFor="g-bid"
              >
                {lt('google.bid', '')}
              </label>
              <select
                id="g-bid"
                value={ctl.googleData.biddingStrategy}
                onChange={(e) =>
                  ctl.setGoogleData((d) => ({ ...d, biddingStrategy: e.target.value }))
                }
                className="w-full rounded-lg border border-border bg-surface px-4 py-2.5 text-sm focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/15"
              >
                <option value="target_cpa">{lt('google.bidTcpa', '')}</option>
                <option value="maximize">{lt('google.bidMax', '')}</option>
                <option value="manual">{lt('google.bidManual', '')}</option>
              </select>
            </div>
          </div>
          <Footer
            onBack={() => ctl.setGoogleStep(3)}
            onContinue={() => ctl.setGoogleStep(5)}
            continueLabel={lt('common.review', 'Review')}
          />
        </WizardStepCard>
      )}

      {ctl.googleStep === 5 && (
        <WizardStepCard>
          <div className="space-y-5 p-6 md:p-8">
            <h2 className="text-lg font-semibold text-text-primary">{lt('google.s5Title', '')}</h2>
            <dl className="space-y-2 rounded-xl border border-border bg-surface-2/50 p-4 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-text-tertiary">{lt('google.revType', '')}</dt>
                <dd className="font-medium">{ctl.googleData.campaignType}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-text-tertiary">{lt('google.revBudget', '')}</dt>
                <dd className="font-medium">${ctl.googleData.dailyBudget || '—'}/day</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-text-tertiary">{lt('google.revAds', '')}</dt>
                <dd className="max-w-[55%] text-right font-medium">{lt('google.revAdsVal', '')}</dd>
              </div>
            </dl>
          </div>
          <Footer
            onBack={() => ctl.setGoogleStep(4)}
            backLabel={lt('meta.edit', 'Edit')}
            onContinue={ctl.launchGoogle}
            continueLabel={lt('common.launch', 'Publish')}
            primary="launch"
            saving={ctl.saving}
          />
        </WizardStepCard>
      )}
    </div>
  )
}

function Footer({
  onBack,
  backLabel,
  onContinue,
  continueLabel,
  saving,
  primary = 'continue',
}: {
  onBack: () => void
  backLabel?: string
  onContinue: () => void
  continueLabel?: string
  saving?: boolean
  primary?: 'continue' | 'launch'
}) {
  const { t } = useI18n()
  const lt = (path: string, fallback: string) => t(`launchWizard.${path}`, fallback)
  const backText = backLabel ?? lt('common.back', 'Back')
  const continueText =
    continueLabel ??
    (primary === 'launch' ? lt('common.launch', 'Publish') : lt('common.continue', 'Continue'))
  return (
    <div className="flex flex-col-reverse gap-2 border-t border-border px-6 py-4 md:flex-row md:justify-between md:px-8">
      <Button type="button" variant="secondary" onClick={onBack}>
        <ChevronLeft className="h-4 w-4" aria-hidden />
        {backText}
      </Button>
      <Button type="button" loading={saving} onClick={onContinue}>
        {continueText}
        {primary === 'continue' && <ChevronRight className="h-4 w-4" aria-hidden />}
      </Button>
    </div>
  )
}
