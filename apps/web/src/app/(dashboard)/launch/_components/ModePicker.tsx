'use client'

import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui'
import { useI18n } from '@/i18n/use-i18n'
import { cn } from '@/lib/utils'
import type { LaunchMode, Platform } from '../_lib/types'

export function ModePicker({
  platform,
  mode,
  onModeChange,
  onConfirm,
  onBack,
}: {
  platform: Platform
  mode: LaunchMode
  onModeChange: (m: LaunchMode) => void
  onConfirm: () => void
  onBack: () => void
}) {
  const { t } = useI18n()
  const lt = (path: string, fallback: string) => t(`launchWizard.${path}`, fallback)

  const platformTitle =
    platform === 'meta'
      ? lt('platforms.metaName', 'Meta')
      : platform === 'google'
        ? lt('platforms.googleName', 'Google Ads')
        : lt('platforms.yandexName', 'Yandex Direct')

  const modes = [
    { id: 'self' as const, title: lt('mode.selfTitle', ''), desc: lt('mode.selfDesc', '') },
    { id: 'ai' as const, title: lt('mode.aiTitle', ''), desc: lt('mode.aiDesc', '') },
    { id: 'expert' as const, title: lt('mode.expertTitle', ''), desc: lt('mode.expertDesc', '') },
  ]

  return (
    <div className="mx-auto max-w-3xl space-y-8 py-6">
      <div>
        <button
          type="button"
          onClick={onBack}
          className="mb-3 flex items-center gap-1 text-sm text-text-tertiary transition-colors hover:text-text-primary"
        >
          <ChevronLeft className="h-4 w-4" aria-hidden />
          {lt('mode.back', 'Back')}
        </button>
        <h1 className="mb-1 text-2xl font-semibold text-text-primary">{platformTitle}</h1>
        <p className="text-sm font-medium text-text-primary">{lt('mode.howTitle', '')}</p>
        <p className="mt-1 text-sm text-text-secondary">{lt('mode.howSubtitle', '')}</p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {modes.map((m) => (
          <button
            key={m.id}
            type="button"
            onClick={() => onModeChange(m.id)}
            className={cn(
              'rounded-2xl border-2 p-5 text-left transition-all',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/25',
              mode === m.id
                ? 'border-primary bg-primary/[0.06] shadow-sm'
                : 'border-border hover:border-text-tertiary/40',
            )}
          >
            <p className="mb-2 text-sm font-semibold text-text-primary">{m.title}</p>
            <p className="text-xs leading-relaxed text-text-secondary">{m.desc}</p>
          </button>
        ))}
      </div>

      <Button type="button" size="lg" fullWidth onClick={onConfirm}>
        {mode === 'self'
          ? lt('mode.confirmSelf', '')
          : mode === 'ai'
            ? lt('mode.confirmAi', '')
            : lt('mode.confirmExpert', '')}
        <ChevronRight className="h-4 w-4" aria-hidden />
      </Button>
    </div>
  )
}
