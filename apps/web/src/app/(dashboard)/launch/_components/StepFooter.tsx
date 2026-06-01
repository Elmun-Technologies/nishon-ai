'use client'

import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui'
import { useI18n } from '@/i18n/use-i18n'

export function StepFooter({
  onBack,
  backLabel,
  onContinue,
  continueDisabled,
  continueLabel,
  saving,
  primary = 'continue',
}: {
  onBack: () => void
  backLabel?: string
  onContinue: () => void
  continueDisabled?: boolean
  continueLabel?: string
  saving?: boolean
  primary?: 'continue' | 'launch'
}) {
  const { t } = useI18n()
  const lt = (path: string, fallback: string) => t(`launchWizard.${path}`, fallback)

  const backText = backLabel ?? lt('common.back', 'Back')
  const continueText =
    continueLabel ??
    (primary === 'launch' ? lt('common.launch', 'Publish') : lt('common.continue', 'Davom etish'))

  return (
    <div className="flex flex-col-reverse gap-2 border-t border-border px-6 py-4 md:flex-row md:items-center md:justify-between md:px-8">
      <Button type="button" variant="secondary" size="md" onClick={onBack}>
        <ChevronLeft className="h-4 w-4" aria-hidden />
        {backText}
      </Button>
      <Button
        type="button"
        size="md"
        disabled={continueDisabled}
        loading={saving}
        onClick={onContinue}
        className="md:min-w-[160px]"
      >
        {continueText}
        {primary === 'continue' && <ChevronRight className="h-4 w-4" aria-hidden />}
      </Button>
    </div>
  )
}
