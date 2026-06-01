'use client'

import { Zap } from 'lucide-react'
import { WizardStepCard } from '@/components/launch/wizard-shell'
import { useI18n } from '@/i18n/use-i18n'
import { cn } from '@/lib/utils'
import type { LaunchWizardCtl } from '../../_lib/use-launch-wizard'
import { formatMoneyUsd, parsePositiveNumber } from '../../_lib/utils'
import { StepFooter } from '../StepFooter'

const DURATION_CHIPS = [3, 7, 14, 30] as const

const PRESETS: { id: string; label: string; daily: number; duration: number; hint: string }[] = [
  { id: 'test', label: 'Test paketi', daily: 35, duration: 3, hint: 'Tez sinash' },
  { id: 'standard', label: 'Standard', daily: 20, duration: 7, hint: 'Eng ko\'p tanlangan' },
  { id: 'scale', label: 'Masshtab', daily: 100, duration: 14, hint: 'Kengaytirish' },
]

export function BudgetStep({ ctl }: { ctl: LaunchWizardCtl }) {
  const { t } = useI18n()
  const lt = (path: string, fallback: string) => t(`launchWizard.${path}`, fallback)

  const daily = parsePositiveNumber(ctl.metaData.dailyBudget) ?? 0
  const total = daily * ctl.metaData.campaignDuration

  return (
    <WizardStepCard>
      <div className="space-y-6 p-6 md:p-8">
        <div>
          <h2 className="text-lg font-semibold text-text-primary">
            💰 {lt('meta.budgetTitle', 'Byudjet va davom etish muddati')}
          </h2>
          <p className="mt-1 text-sm text-text-secondary">
            {lt('meta.budgetSubtitle', 'Qancha sarflashga tayyorsiz?')}
          </p>
        </div>

        {/* Smart presets */}
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-text-tertiary">
            Tezkor tanlovlar
          </p>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            {PRESETS.map((p) => {
              const isActive =
                Number(ctl.metaData.dailyBudget) === p.daily &&
                ctl.metaData.campaignDuration === p.duration
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() =>
                    ctl.setMetaData((d) => ({
                      ...d,
                      dailyBudget: String(p.daily),
                      campaignDuration: p.duration,
                    }))
                  }
                  className={cn(
                    'group rounded-xl border p-3 text-left transition-all',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/25',
                    isActive
                      ? 'border-primary bg-primary/[0.06] ring-1 ring-primary/20'
                      : 'border-border bg-surface hover:border-primary/30',
                  )}
                >
                  <div className="flex items-center gap-1.5">
                    {p.id === 'standard' && (
                      <Zap className="h-3.5 w-3.5 text-brand-mid dark:text-brand-lime" aria-hidden />
                    )}
                    <p className="text-sm font-semibold text-text-primary">{p.label}</p>
                  </div>
                  <p className="mt-0.5 text-xs text-text-secondary">
                    ${p.daily}/kun × {p.duration} kun
                  </p>
                  <p className="mt-0.5 text-[11px] text-text-tertiary">{p.hint}</p>
                </button>
              )
            })}
          </div>
        </div>

        {/* Daily budget */}
        <div>
          <label
            className="mb-2 block text-sm font-medium text-text-secondary"
            htmlFor="meta-daily"
          >
            {lt('meta.dailyUsd', 'Kunlik byudjet')}
          </label>
          <div className="flex items-center gap-2">
            <span className="text-text-tertiary">$</span>
            <input
              id="meta-daily"
              type="number"
              min={1}
              step={1}
              value={ctl.metaData.dailyBudget}
              onChange={(e) => ctl.setMetaData((d) => ({ ...d, dailyBudget: e.target.value }))}
              placeholder="50"
              className="min-w-0 flex-1 rounded-lg border border-border bg-surface px-4 py-2.5 text-sm focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/15"
            />
            <span className="text-xs text-text-tertiary">{lt('meta.perDay', '/ kun')}</span>
          </div>
        </div>

        {/* Duration */}
        <div>
          <div className="mb-2 flex items-baseline justify-between">
            <label
              className="text-sm font-medium text-text-secondary"
              htmlFor="meta-dur"
            >
              {lt('meta.duration', 'Davom etishi')}
            </label>
            <span className="text-sm font-semibold text-text-primary">
              {ctl.metaData.campaignDuration} kun
            </span>
          </div>
          <div className="mb-3 flex flex-wrap gap-2">
            {DURATION_CHIPS.map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => ctl.setMetaData((md) => ({ ...md, campaignDuration: d }))}
                className={cn(
                  'rounded-full border px-3 py-1 text-xs font-medium transition-all',
                  ctl.metaData.campaignDuration === d
                    ? 'border-primary bg-primary text-white'
                    : 'border-border bg-surface text-text-secondary hover:border-primary/40',
                )}
              >
                {d} kun
              </button>
            ))}
          </div>
          <input
            id="meta-dur"
            type="range"
            min={1}
            max={90}
            value={ctl.metaData.campaignDuration}
            onChange={(e) =>
              ctl.setMetaData((d) => ({ ...d, campaignDuration: Number(e.target.value) }))
            }
            className="w-full accent-primary"
          />
          <div className="mt-1 flex justify-between text-[11px] text-text-tertiary">
            <span>1 kun</span>
            <span>90 kun</span>
          </div>
        </div>

        {/* Total */}
        <div className="rounded-xl border border-border bg-surface-2/40 p-4 dark:bg-surface-elevated/30">
          <p className="text-xs font-semibold uppercase tracking-wide text-text-tertiary">
            Jami byudjet
          </p>
          <p className="mt-1 text-2xl font-bold text-text-primary">
            {formatMoneyUsd(total)}
          </p>
          <p className="mt-0.5 text-xs text-text-tertiary">
            ${daily || 0}/kun × {ctl.metaData.campaignDuration} kun
          </p>
        </div>
      </div>

      <StepFooter
        onBack={() => ctl.setMetaStep(3)}
        onContinue={() => ctl.setMetaStep(5)}
        continueDisabled={!ctl.metaStepValid}
      />
    </WizardStepCard>
  )
}
