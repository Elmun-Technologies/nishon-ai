'use client'

import { useMemo } from 'react'
import { Sparkles, Users } from 'lucide-react'
import { WizardStepCard } from '@/components/launch/wizard-shell'
import { useI18n } from '@/i18n/use-i18n'
import { cn } from '@/lib/utils'
import { LOCATION_LABELS } from '../../_lib/types'
import type { LaunchWizardCtl } from '../../_lib/use-launch-wizard'
import { estimateAudienceReach, formatAudienceReach } from '../../_lib/utils'
import { StepFooter } from '../StepFooter'

const COUNTRY_CHIPS = [
  { id: 'UZ', label: 'UZ' },
  { id: 'KZ', label: 'KZ' },
  { id: 'TJ', label: 'TJ' },
  { id: 'TM', label: 'TM' },
  { id: 'RU', label: 'RU' },
  { id: 'US', label: 'US' },
] as const

export function AudienceStep({ ctl }: { ctl: LaunchWizardCtl }) {
  const { t } = useI18n()
  const lt = (path: string, fallback: string) => t(`launchWizard.${path}`, fallback)

  const reach = useMemo(
    () =>
      estimateAudienceReach({
        location: ctl.metaData.location,
        minAge: ctl.metaData.minAge,
        maxAge: ctl.metaData.maxAge,
      }),
    [ctl.metaData.location, ctl.metaData.minAge, ctl.metaData.maxAge],
  )

  return (
    <WizardStepCard>
      <div className="space-y-6 p-6 md:p-8">
        <div>
          <h2 className="text-lg font-semibold text-text-primary">
            👥 {lt('meta.audienceTitle', 'Kimga ko\'rsatamiz?')}
          </h2>
          <p className="mt-1 text-sm text-text-secondary">
            Aniq auditoriya = arzon CPL.{' '}
            {lt('meta.audienceSubtitle', 'Define who should see your ads.')}
          </p>
        </div>

        {/* Country chips */}
        <div>
          <p className="mb-2 text-sm font-medium text-text-secondary">📍 Davlat</p>
          <div className="flex flex-wrap gap-2">
            {COUNTRY_CHIPS.map((c) => {
              const selected = ctl.metaData.location === c.id
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => ctl.setMetaData((d) => ({ ...d, location: c.id }))}
                  className={cn(
                    'rounded-full border px-3.5 py-1.5 text-sm font-medium transition-all',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/25',
                    selected
                      ? 'border-primary bg-primary text-white'
                      : 'border-border bg-surface text-text-primary hover:border-primary/40',
                  )}
                >
                  {c.label}
                  {selected && ' ✓'}
                </button>
              )
            })}
          </div>
          <p className="mt-2 text-xs text-text-tertiary">
            {LOCATION_LABELS[ctl.metaData.location] ?? ctl.metaData.location}
          </p>
        </div>

        {/* Age range */}
        <div>
          <div className="mb-2 flex items-baseline justify-between">
            <p className="text-sm font-medium text-text-secondary">
              🎂 {lt('meta.ageLabel', 'Yosh')}
            </p>
            <p className="text-sm font-semibold text-text-primary">
              {ctl.metaData.minAge}–{ctl.metaData.maxAge}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="text-xs text-text-tertiary">Min</span>
              <input
                type="number"
                min={13}
                max={75}
                value={ctl.metaData.minAge}
                onChange={(e) =>
                  ctl.setMetaData((d) => ({ ...d, minAge: Number(e.target.value) }))
                }
                className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/15"
              />
            </label>
            <label className="block">
              <span className="text-xs text-text-tertiary">Max</span>
              <input
                type="number"
                min={13}
                max={75}
                value={ctl.metaData.maxAge}
                onChange={(e) =>
                  ctl.setMetaData((d) => ({ ...d, maxAge: Number(e.target.value) }))
                }
                className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/15"
              />
            </label>
          </div>
        </div>

        {/* Audience reach estimate */}
        <div className="flex items-start gap-3 rounded-xl border border-brand-mid/20 bg-brand-mid/[0.04] p-3.5 dark:border-brand-lime/20 dark:bg-brand-lime/[0.04]">
          <Users className="mt-0.5 h-5 w-5 shrink-0 text-brand-mid dark:text-brand-lime" aria-hidden />
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-brand-mid dark:text-brand-lime">
              Taxminiy auditoriya
            </p>
            <p className="mt-0.5 text-sm font-semibold text-text-primary">
              {formatAudienceReach(reach)} kishi
            </p>
            <p className="mt-0.5 text-xs text-text-tertiary">
              Davlat + yosh asosida taxmin. Aniq qiymat Meta hisobi ulangach hisoblanadi.
            </p>
          </div>
        </div>

        {/* Tip */}
        {ctl.metaData.objective === 'leads' && (
          <div className="flex items-start gap-2 rounded-lg border border-amber-500/20 bg-amber-500/[0.05] p-3">
            <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-600 dark:text-amber-400" aria-hidden />
            <p className="text-xs leading-relaxed text-text-secondary">
              💡 <span className="font-medium text-text-primary">Leads</span> uchun tavsiya: 25–45
              yosh — sotib olish qarorini ko&apos;p shu yoshda qabul qilishadi.
            </p>
          </div>
        )}
      </div>

      <StepFooter
        onBack={() => ctl.setMetaStep(2)}
        onContinue={() => ctl.setMetaStep(4)}
        continueDisabled={!ctl.metaStepValid}
      />
    </WizardStepCard>
  )
}
