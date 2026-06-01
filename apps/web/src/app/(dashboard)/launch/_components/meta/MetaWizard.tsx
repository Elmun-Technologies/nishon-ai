'use client'

import { Alert } from '@/components/ui'
import { useI18n } from '@/i18n/use-i18n'
import type { LaunchWizardCtl } from '../../_lib/use-launch-wizard'
import type { MetaStep } from '../../_lib/types'
import { WizardHeader } from '../WizardHeader'
import { AudienceStep } from './AudienceStep'
import { BudgetStep } from './BudgetStep'
import { CreativeStep } from './CreativeStep'
import { MetaSummary } from './MetaSummary'
import { ObjectiveStep } from './ObjectiveStep'
import { ReviewStep } from './ReviewStep'
import { SettingsStep } from './SettingsStep'

export function MetaWizard({ ctl }: { ctl: LaunchWizardCtl }) {
  const { t } = useI18n()
  const lt = (path: string, fallback: string) => t(`launchWizard.${path}`, fallback)

  const steps = [
    { id: 1, label: 'Maqsad' },
    { id: 2, label: 'Sozlamalar' },
    { id: 3, label: 'Auditoriya' },
    { id: 4, label: 'Byudjet' },
    { id: 5, label: 'Kreativ' },
    { id: 6, label: 'Tasdiq' },
  ]

  const isStepReachable = (id: number) => {
    if (id <= ctl.metaStep) return true
    if (id === 2) return !!ctl.metaData.objective
    if (id === 3) return !!ctl.metaData.objective && ctl.metaData.name.trim().length >= 2
    if (id === 4)
      return (
        !!ctl.metaData.objective &&
        ctl.metaData.name.trim().length >= 2 &&
        ctl.metaData.minAge < ctl.metaData.maxAge
      )
    return false
  }

  return (
    <div className="mx-auto max-w-[1280px] py-6">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0 space-y-6">
          <WizardHeader
            title={lt('meta.pageTitle', 'Meta — Yangi kampaniya')}
            currentStep={ctl.metaStep}
            steps={steps}
            onJump={(id) => ctl.setMetaStep(id as MetaStep)}
            isStepReachable={isStepReachable}
            onBack={ctl.exitToMode}
            onExit={ctl.exitToHub}
          />
          {ctl.error ? <Alert variant="error">{ctl.error}</Alert> : null}

          {ctl.metaStep === 1 && <ObjectiveStep ctl={ctl} />}
          {ctl.metaStep === 2 && <SettingsStep ctl={ctl} />}
          {ctl.metaStep === 3 && <AudienceStep ctl={ctl} />}
          {ctl.metaStep === 4 && <BudgetStep ctl={ctl} />}
          {ctl.metaStep === 5 && <CreativeStep ctl={ctl} />}
          {ctl.metaStep === 6 && <ReviewStep ctl={ctl} />}
        </div>
        <div className="lg:block">
          <MetaSummary ctl={ctl} />
        </div>
      </div>
    </div>
  )
}
