'use client'

import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Alert, Button, Input, Textarea } from '@/components/ui'
import {
  WizardChoiceRow,
  WizardStepCard,
} from '@/components/launch/wizard-shell'
import { useI18n } from '@/i18n/use-i18n'
import { WizardHeader } from '../WizardHeader'
import type { LaunchWizardCtl } from '../../_lib/use-launch-wizard'
import type { YandexStep } from '../../_lib/types'

export function YandexWizard({ ctl }: { ctl: LaunchWizardCtl }) {
  const { t } = useI18n()
  const lt = (path: string, fallback: string) => t(`launchWizard.${path}`, fallback)

  const steps = [
    { id: 1, label: 'Type' },
    { id: 2, label: 'Keywords' },
    { id: 3, label: 'Ad' },
    { id: 4, label: 'Budget' },
  ]

  const isReachable = (id: number) => id <= ctl.yandexStep

  return (
    <div className="mx-auto max-w-3xl space-y-6 py-6">
      <WizardHeader
        title={lt('yandex.pageTitle', 'Yandex')}
        currentStep={ctl.yandexStep}
        steps={steps}
        onJump={(id) => ctl.setYandexStep(id as YandexStep)}
        isStepReachable={isReachable}
        onBack={ctl.exitToMode}
        onExit={ctl.exitToHub}
      />
      {ctl.error ? <Alert variant="error">{ctl.error}</Alert> : null}

      {ctl.yandexStep === 1 && (
        <WizardStepCard>
          <div className="space-y-4 p-6 md:p-8">
            <h2 className="text-lg font-semibold text-text-primary">{lt('yandex.s1Title', '')}</h2>
            <div className="space-y-2">
              {(
                [
                  {
                    value: 'search' as const,
                    title: lt('yandex.s1Search', ''),
                    desc: lt('yandex.s1SearchDesc', ''),
                  },
                  {
                    value: 'smart' as const,
                    title: lt('yandex.s1Smart', ''),
                    desc: lt('yandex.s1SmartDesc', ''),
                  },
                ] as const
              ).map((opt) => (
                <WizardChoiceRow
                  key={opt.value}
                  selected={ctl.yandexData.campaignType === opt.value}
                  onClick={() => ctl.setYandexData((d) => ({ ...d, campaignType: opt.value }))}
                  icon={<span className="text-sm font-bold text-[#FC3F1D]">Y</span>}
                  title={opt.title}
                  description={opt.desc}
                />
              ))}
            </div>
          </div>
          <Footer
            onBack={ctl.exitToMode}
            backLabel={lt('common.back', 'Back')}
            onContinue={() => ctl.setYandexStep(2)}
          />
        </WizardStepCard>
      )}

      {ctl.yandexStep === 2 && (
        <WizardStepCard>
          <div className="space-y-4 p-6 md:p-8">
            <h2 className="text-lg font-semibold text-text-primary">{lt('yandex.s2Title', '')}</h2>
            <Textarea
              value={ctl.yandexData.keywords}
              onChange={(e) => ctl.setYandexData((d) => ({ ...d, keywords: e.target.value }))}
              placeholder={lt('yandex.s2Ph', '')}
              rows={4}
            />
            <Textarea
              value={ctl.yandexData.negativeKeywords}
              onChange={(e) =>
                ctl.setYandexData((d) => ({ ...d, negativeKeywords: e.target.value }))
              }
              placeholder={lt('yandex.s2NegPh', '')}
              rows={2}
            />
          </div>
          <Footer
            onBack={() => ctl.setYandexStep(1)}
            onContinue={() => ctl.setYandexStep(3)}
          />
        </WizardStepCard>
      )}

      {ctl.yandexStep === 3 && (
        <WizardStepCard>
          <div className="space-y-4 p-6 md:p-8">
            <h2 className="text-lg font-semibold text-text-primary">{lt('yandex.s3Title', '')}</h2>
            <Input
              value={ctl.yandexData.headline}
              onChange={(e) => ctl.setYandexData((d) => ({ ...d, headline: e.target.value }))}
              placeholder={lt('yandex.headline', '')}
            />
            <Textarea
              value={ctl.yandexData.description}
              onChange={(e) => ctl.setYandexData((d) => ({ ...d, description: e.target.value }))}
              placeholder={lt('yandex.desc', '')}
              rows={3}
            />
            <Input
              value={ctl.yandexData.url}
              onChange={(e) => ctl.setYandexData((d) => ({ ...d, url: e.target.value }))}
              placeholder={lt('yandex.url', '')}
            />
          </div>
          <Footer
            onBack={() => ctl.setYandexStep(2)}
            onContinue={() => ctl.setYandexStep(4)}
            continueLabel={lt('common.review', 'Review')}
          />
        </WizardStepCard>
      )}

      {ctl.yandexStep === 4 && (
        <WizardStepCard>
          <div className="space-y-4 p-6 md:p-8">
            <h2 className="text-lg font-semibold text-text-primary">{lt('yandex.s4Title', '')}</h2>
            <Input
              type="number"
              min={1}
              label={lt('yandex.daily', '')}
              value={ctl.yandexData.dailyBudget}
              onChange={(e) => ctl.setYandexData((d) => ({ ...d, dailyBudget: e.target.value }))}
              placeholder="50"
            />
            <div>
              <label
                className="text-label mb-2 block font-medium text-text-secondary"
                htmlFor="y-str"
              >
                {lt('yandex.bid', '')}
              </label>
              <select
                id="y-str"
                value={ctl.yandexData.strategy}
                onChange={(e) => ctl.setYandexData((d) => ({ ...d, strategy: e.target.value }))}
                className="w-full rounded-lg border border-border bg-surface px-4 py-2.5 text-sm focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/15"
              >
                <option value="average_cpc">{lt('yandex.bidCpc', '')}</option>
                <option value="highest_position">{lt('yandex.bidPos', '')}</option>
                <option value="weekly_budget">{lt('yandex.bidWeek', '')}</option>
              </select>
            </div>
          </div>
          <Footer
            onBack={() => ctl.setYandexStep(3)}
            backLabel={lt('meta.edit', 'Edit')}
            onContinue={ctl.launchYandex}
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
