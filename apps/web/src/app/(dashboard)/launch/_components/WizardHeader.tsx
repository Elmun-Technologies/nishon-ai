'use client'

import { ChevronLeft, X } from 'lucide-react'
import { useI18n } from '@/i18n/use-i18n'
import { ProgressRibbon, type ProgressStep } from './ProgressRibbon'

export function WizardHeader({
  title,
  subtitle,
  currentStep,
  steps,
  onJump,
  isStepReachable,
  onBack,
  onExit,
}: {
  title: string
  subtitle?: string
  currentStep: number
  steps: ProgressStep[]
  onJump?: (id: number) => void
  isStepReachable?: (id: number) => boolean
  onBack: () => void
  onExit?: () => void
}) {
  const { t } = useI18n()
  const lt = (path: string, fallback: string) => t(`launchWizard.${path}`, fallback)

  const currentLabel = steps.find((s) => s.id === currentStep)?.label ?? ''

  return (
    <div className="space-y-3">
      <div className="flex items-start justify-between gap-3">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-1 text-sm text-text-tertiary transition-colors hover:text-text-primary"
        >
          <ChevronLeft className="h-4 w-4" aria-hidden />
          {lt('common.back', 'Back')}
        </button>
        {onExit && (
          <button
            type="button"
            onClick={onExit}
            aria-label={lt('common.exitWizard', 'Chiqish')}
            className="rounded-lg p-1 text-text-tertiary transition-colors hover:bg-surface-2/80 hover:text-text-primary"
          >
            <X className="h-4 w-4" aria-hidden />
          </button>
        )}
      </div>
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-text-primary">{title}</h1>
        <p className="mt-1 text-sm text-text-secondary">
          {currentStep}/{steps.length}
          {currentLabel ? ` — ${currentLabel}` : ''}
          {subtitle ? ` · ${subtitle}` : ''}
        </p>
      </div>
      <ProgressRibbon
        steps={steps}
        current={currentStep}
        onJump={onJump}
        isStepReachable={isStepReachable}
      />
    </div>
  )
}
