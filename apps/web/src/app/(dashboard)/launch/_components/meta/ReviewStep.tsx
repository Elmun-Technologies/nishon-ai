'use client'

import { WizardStepCard } from '@/components/launch/wizard-shell'
import { cn } from '@/lib/utils'
import {
  LOCATION_LABELS,
  SPECIAL_AD_CATEGORY_LABELS,
} from '../../_lib/types'
import { findMetaObjective } from '../../_lib/meta-objectives'
import type { LaunchWizardCtl } from '../../_lib/use-launch-wizard'
import { formatMoneyUsd, parsePositiveNumber } from '../../_lib/utils'
import { StepFooter } from '../StepFooter'

export function ReviewStep({ ctl }: { ctl: LaunchWizardCtl }) {
  const { metaData } = ctl
  const objLabel = findMetaObjective(metaData.objective || null)?.label ?? '—'
  const total = (parsePositiveNumber(metaData.dailyBudget) ?? 0) * metaData.campaignDuration

  const rows: { label: string; value: string; note?: string; bold?: boolean }[] = [
    { label: 'Campaign name', value: metaData.name || '—' },
    { label: 'Buying type', value: 'Auction' },
    { label: 'Objective', value: objLabel },
    {
      label: 'A/B Test',
      value: metaData.abTestEnabled
        ? `On — ${metaData.abTestType}, ${metaData.abTestDuration} kun`
        : 'Off',
      note: metaData.abTestEnabled
        ? "Publish bosgandan so'ng kampaniyaning B versiyasi avtomatik yaratiladi."
        : undefined,
    },
    {
      label: 'Budget strategy',
      value: `Campaign budget — Daily ${metaData.dailyBudget ? `$${metaData.dailyBudget}` : '—'} / day`,
    },
    {
      label: 'Campaign duration',
      value: `${metaData.campaignDuration} kun`,
    },
    {
      label: 'Total budget',
      value: formatMoneyUsd(total),
      bold: true,
    },
    {
      label: 'Audience',
      value: `${metaData.minAge}–${metaData.maxAge} yosh, ${LOCATION_LABELS[metaData.location] ?? metaData.location}`,
    },
    { label: 'Campaign bid strategy', value: 'Highest volume' },
    { label: 'Delivery type', value: 'Standard' },
    {
      label: 'Special Ad Categories',
      value:
        metaData.specialAdCategories.length > 0
          ? metaData.specialAdCategories
              .map((c) => SPECIAL_AD_CATEGORY_LABELS[c] ?? c)
              .join(', ')
          : 'None',
    },
  ]

  return (
    <WizardStepCard>
      <div className="p-6 md:p-8">
        <div className="mb-5">
          <h2 className="text-lg font-semibold text-text-primary">Tasdiqlash</h2>
          <p className="mt-1 text-sm text-text-secondary">
            Publish qilishdan oldin kampaniya ma&apos;lumotlarini tekshiring.
          </p>
        </div>
        <div className="divide-y divide-border rounded-xl border border-border bg-surface-2/30 dark:bg-surface-elevated/20">
          {rows.map(({ label, value, note, bold }) => (
            <div key={label} className="px-4 py-3">
              <p className="text-xs font-semibold text-text-tertiary">{label}</p>
              <p
                className={cn(
                  'mt-0.5 text-sm text-text-primary',
                  bold && 'text-base font-semibold',
                )}
              >
                {value}
              </p>
              {note && <p className="mt-1 text-xs text-text-secondary">{note}</p>}
            </div>
          ))}
        </div>
      </div>
      <StepFooter
        onBack={() => ctl.setMetaStep(5)}
        backLabel="Edit"
        onContinue={ctl.launchMeta}
        primary="launch"
        saving={ctl.saving}
      />
    </WizardStepCard>
  )
}
