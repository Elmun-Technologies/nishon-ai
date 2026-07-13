'use client'

import { AGENT_MODE } from '@/lib/agent-mode'
import { AutomatedByAgent } from '@/components/ui/AutomatedByAgent'
import { PageHeader } from '@/components/ui'
import { useI18n } from '@/i18n/use-i18n'
import { ConfirmLaunchDialog } from './_components/ConfirmLaunchDialog'
import { DemoBanner } from './_components/DemoBanner'
import { LaunchHistory } from './_components/LaunchHistory'
import { LaunchStep } from './_components/LaunchStep'
import { PickStep } from './_components/PickStep'
import { SelectionTray } from './_components/SelectionTray'
import { SourceStep } from './_components/SourceStep'
import { StepIndicator } from './_components/StepIndicator'
import { useAdLauncher } from './_lib/use-ad-launcher'
import type { StepId } from './_lib/types'

export default function AdLauncherPage() {
  // Frozen in autonomous AI Agent mode — the agent owns ad launches.
  if (AGENT_MODE) return <AutomatedByAgent module="campaignBuilder" />
  return <AdLauncherPageInner />
}

function AdLauncherPageInner() {

  const { t } = useI18n()
  const ctl = useAdLauncher()

  const steps: { id: StepId; label: string; hint: string }[] = [
    {
      id: 'source',
      label: t('adLauncher.stepSource', 'Manba'),
      hint: t('adLauncher.stepSourceHint', 'Hisob va davr'),
    },
    {
      id: 'pick',
      label: t('adLauncher.stepPick', 'Tanlash'),
      hint: t('adLauncher.stepPickHint', 'Reklamalarni belgilang'),
    },
    {
      id: 'launch',
      label: t('adLauncher.stepLaunch', 'Ishga tushirish'),
      hint: t('adLauncher.stepLaunchHint', 'Yangi kampaniya yaratish'),
    },
  ]

  // Step 'pick' requires accountId; 'launch' requires at least one selection.
  const isStepEnabled = (s: StepId) => {
    if (s === 'source') return true
    if (s === 'pick') return !!ctl.accountId && ctl.accounts.length > 0
    if (s === 'launch') return ctl.selectedCampaigns.length > 0
    return true
  }

  return (
    <div className="mx-auto max-w-[1600px] space-y-4 pb-8">
      <PageHeader
        title={t('adLauncher.title', 'Ad Launcher')}
        subtitle={t(
          'adLauncher.subtitle',
          'Mavjud Meta reklamalardan tezda yangi kampaniya yarating — 3 qadam.',
        )}
      />

      {ctl.isDemoMode && <DemoBanner />}

      <section className="rounded-2xl border border-border bg-surface p-3 shadow-sm">
        <StepIndicator
          steps={steps}
          current={ctl.step}
          onJump={ctl.goToStep}
          isStepEnabled={isStepEnabled}
          selectedCount={ctl.selectedCampaigns.length}
        />
      </section>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0 space-y-4">
          {ctl.step === 'source' && <SourceStep ctl={ctl} />}
          {ctl.step === 'pick' && <PickStep ctl={ctl} />}
          {ctl.step === 'launch' && <LaunchStep ctl={ctl} />}
        </div>
        <aside className="space-y-4">
          <div className="lg:sticky lg:top-4">
            <SelectionTray ctl={ctl} />
          </div>
          <LaunchHistory ctl={ctl} />
        </aside>
      </div>

      <ConfirmLaunchDialog ctl={ctl} />
    </div>
  )
}
