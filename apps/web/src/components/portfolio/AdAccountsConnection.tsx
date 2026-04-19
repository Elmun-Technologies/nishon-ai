'use client'

import { useState } from 'react'
import { useI18n } from '@/i18n/use-i18n'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

interface AdAccountsConnectionProps {
  onConnectionComplete?: () => void
}

const PLATFORM_IDS = ['meta', 'google', 'yandex'] as const

function platformLabel(id: (typeof PLATFORM_IDS)[number], t: (k: string, d?: string) => string) {
  const key = `portfolioSetup.adAccounts.${id}Name` as const
  return t(key, id)
}

function interpolate(template: string, platform: string) {
  return template.replace(/\{\{platform\}\}/g, platform)
}

export function AdAccountsConnection({ onConnectionComplete }: AdAccountsConnectionProps) {
  const { t } = useI18n()
  const [step, setStep] = useState<'select' | 'connect' | 'confirm'>('select')
  const [selectedPlatform, setSelectedPlatform] = useState<(typeof PLATFORM_IDS)[number] | null>(null)

  const icons: Record<string, string> = { meta: '📘', google: '🔍', yandex: '🟡' }

  return (
    <div className="space-y-6">
      {step === 'select' && (
        <Card className="p-6">
          <h3 className="mb-2 text-xl font-bold text-text-primary">
            {t('portfolioSetup.adAccounts.title', 'Connect an ad account')}
          </h3>
          <p className="mb-6 text-sm text-text-secondary">
            {t(
              'portfolioSetup.adAccounts.subtitle',
              'Link accounts you use so performance can be verified.',
            )}
          </p>

          <div className="grid gap-4 md:grid-cols-3">
            {PLATFORM_IDS.map((platform) => (
              <button
                key={platform}
                type="button"
                onClick={() => {
                  setSelectedPlatform(platform)
                  setStep('connect')
                }}
                className="rounded-xl border border-border bg-surface p-4 text-left transition-all hover:border-[#2563eb]/35 hover:shadow-md dark:hover:border-[#60a5fa]/40"
              >
                <div className="mb-2 text-2xl">{icons[platform]}</div>
                <h4 className="font-semibold text-text-primary">{platformLabel(platform, t)}</h4>
              </button>
            ))}
          </div>
        </Card>
      )}

      {step === 'connect' && selectedPlatform && (
        <Card className="p-6">
          <h3 className="mb-4 text-lg font-semibold text-text-primary">
            {interpolate(
              t('portfolioSetup.adAccounts.connectTitle', 'Connect {{platform}}'),
              platformLabel(selectedPlatform, t),
            )}
          </h3>
          <p className="mb-6 text-text-secondary">
            {t('portfolioSetup.adAccounts.connectBody', 'You will be redirected to authorize access.')}
          </p>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              onClick={() => {
                setStep('confirm')
              }}
            >
              {interpolate(
                t('portfolioSetup.adAccounts.continue', 'Continue to {{platform}}'),
                platformLabel(selectedPlatform, t),
              )}
            </Button>
            <Button type="button" variant="secondary" onClick={() => setStep('select')}>
              {t('portfolioSetup.adAccounts.cancel', 'Back')}
            </Button>
          </div>
        </Card>
      )}

      {step === 'confirm' && (
        <Card className="border border-[#6ee7b7]/40 bg-[#ecfdf5] p-6 dark:border-[#059669]/35 dark:bg-[#064e3b]/35">
          <h3 className="mb-4 text-lg font-semibold text-[#065f46] dark:text-[#a7f3d0]">
            {t('portfolioSetup.adAccounts.successTitle', 'Connection complete')}
          </h3>
          <p className="mb-6 text-sm text-[#047857] dark:text-[#d1fae5]">
            {t('portfolioSetup.adAccounts.successBody', 'Account linked for this workspace.')}
          </p>
          <Button type="button" onClick={() => onConnectionComplete?.()}>
            {t('portfolioSetup.adAccounts.done', 'Done')}
          </Button>
        </Card>
      )}
    </div>
  )
}
