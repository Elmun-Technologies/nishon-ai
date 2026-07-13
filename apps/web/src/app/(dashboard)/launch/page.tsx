'use client'

import { AGENT_MODE } from '@/lib/agent-mode'
import { AutomatedByAgent } from '@/components/ui/AutomatedByAgent'
import { GoogleWizard } from './_components/google/GoogleWizard'
import { LaunchHub } from './_components/LaunchHub'
import { MetaWizard } from './_components/meta/MetaWizard'
import { ModePicker } from './_components/ModePicker'
import { YandexWizard } from './_components/yandex/YandexWizard'
import { useLaunchWizard } from './_lib/use-launch-wizard'

export default function LaunchPage() {
  // Frozen in autonomous AI Agent mode — the agent owns campaign launches.
  if (AGENT_MODE) return <AutomatedByAgent module="campaignBuilder" />
  return <LaunchPageInner />
}

function LaunchPageInner() {

  const ctl = useLaunchWizard()

  if (!ctl.platform) {
    return <LaunchHub onPick={ctl.handlePlatformPick} />
  }

  if (!ctl.launchModeConfirmed) {
    return (
      <ModePicker
        platform={ctl.platform}
        mode={ctl.launchMode}
        onModeChange={ctl.setLaunchMode}
        onConfirm={ctl.handleLaunchModeConfirm}
        onBack={ctl.exitToHub}
      />
    )
  }

  if (ctl.platform === 'meta') return <MetaWizard ctl={ctl} />
  if (ctl.platform === 'google') return <GoogleWizard ctl={ctl} />
  if (ctl.platform === 'yandex') return <YandexWizard ctl={ctl} />

  return null
}
