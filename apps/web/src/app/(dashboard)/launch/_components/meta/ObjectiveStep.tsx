'use client'

import { useState } from 'react'
import { Sparkles } from 'lucide-react'
import { WizardStepCard } from '@/components/launch/wizard-shell'
import { cn } from '@/lib/utils'
import { META_OBJECTIVES, findMetaObjective } from '../../_lib/meta-objectives'
import type { LaunchWizardCtl } from '../../_lib/use-launch-wizard'
import type { MetaObjective } from '../../_lib/types'
import { StepFooter } from '../StepFooter'

export function ObjectiveStep({ ctl }: { ctl: LaunchWizardCtl }) {
  const [hovered, setHovered] = useState<MetaObjective | null>(null)
  const previewObj = findMetaObjective((hovered ?? ctl.metaData.objective) || null)

  return (
    <WizardStepCard>
      <div className="grid gap-0 md:grid-cols-[minmax(0,1fr)_minmax(0,260px)]">
        {/* Left — objective list */}
        <div className="p-6 md:p-8">
          <div className="mb-5">
            <label
              className="text-xs font-semibold uppercase tracking-wide text-text-tertiary"
              htmlFor="meta-buying-type"
            >
              Xarid turi
            </label>
            <select
              id="meta-buying-type"
              disabled
              className="mt-2 w-full cursor-not-allowed rounded-xl border border-border bg-surface-2/80 px-4 py-3 text-sm text-text-secondary"
            >
              <option>Auktsion — real vaqtda stavka</option>
            </select>
          </div>

          <h2 className="mb-1 text-base font-semibold text-text-primary">
            Kampaniya maqsadini tanlang
          </h2>
          <p className="mb-4 text-sm text-text-secondary">
            Erishmoqchi bo&apos;lgan biznes natijani belgilang.
          </p>

          {ctl.metaPrefilled && (
            <div className="mb-4 flex items-start gap-2 rounded-lg border border-[#0866FF]/25 bg-[#0866FF]/[0.05] p-3">
              <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#0866FF]" aria-hidden />
              <p className="text-xs leading-relaxed text-text-secondary">
                <span className="font-semibold text-text-primary">AI tayyorladi.</span>{' '}
                Onboarding javoblaringizga qarab maqsad, hudud, yosh va byudjet oldindan
                to&apos;ldirildi — istalgan qiymatni o&apos;zgartirishingiz mumkin.
              </p>
            </div>
          )}

          <div className="space-y-1">
            {META_OBJECTIVES.map((o) => {
              const Icon = o.icon
              const selected = ctl.metaData.objective === o.id
              const isHovered = hovered === o.id
              return (
                <button
                  key={o.id}
                  type="button"
                  onMouseEnter={() => setHovered(o.id)}
                  onMouseLeave={() => setHovered(null)}
                  onClick={() => ctl.setMetaData((d) => ({ ...d, objective: o.id }))}
                  className={cn(
                    'flex w-full items-center gap-3 rounded-xl border px-4 py-2.5 text-left transition-all',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0866FF]/25',
                    selected
                      ? 'border-[#0866FF]/40 bg-[#0866FF]/[0.06] ring-1 ring-[#0866FF]/15'
                      : isHovered
                        ? 'border-border bg-surface-2/80'
                        : 'border-transparent bg-transparent',
                  )}
                >
                  <span
                    className={cn(
                      'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg',
                      selected || isHovered ? o.color : 'bg-surface-2',
                    )}
                  >
                    <Icon
                      className={cn(
                        'h-4 w-4',
                        selected || isHovered ? o.iconColor : 'text-text-tertiary',
                      )}
                    />
                  </span>
                  <span className="min-w-0 flex-1 text-sm font-medium text-text-primary">
                    {o.label}
                  </span>
                  <span
                    className={cn(
                      'flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-all',
                      selected ? 'border-[#0866FF] bg-[#0866FF]' : 'border-border bg-transparent',
                    )}
                  >
                    {selected && <span className="h-2 w-2 rounded-full bg-white" />}
                  </span>
                </button>
              )
            })}
          </div>

          <div className="mt-4 flex items-start gap-2 rounded-lg border border-brand-mid/20 bg-brand-mid/[0.04] p-3 dark:border-brand-lime/20 dark:bg-brand-lime/[0.04]">
            <Sparkles
              className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand-mid dark:text-brand-lime"
              aria-hidden
            />
            <p className="text-xs leading-relaxed text-text-secondary">
              Aniq emasmisiz? <span className="font-medium text-text-primary">Leads</span> —
              ko&apos;p biznes uchun tavsiya etiladi (kontakt, ariza, qo&apos;ng&apos;iroq).
            </p>
          </div>
        </div>

        {/* Right — dynamic preview */}
        <div className="hidden rounded-r-2xl border-l border-border bg-surface-2/30 p-6 md:flex md:flex-col md:justify-center dark:bg-surface-elevated/20">
          {previewObj ? (
            <div className="space-y-4">
              <div
                className={cn(
                  'flex h-24 w-24 items-center justify-center rounded-2xl',
                  previewObj.color,
                )}
              >
                <previewObj.icon className={cn('h-12 w-12', previewObj.iconColor)} />
              </div>
              <div>
                <h3 className="text-base font-semibold text-text-primary">{previewObj.label}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-text-secondary">
                  {previewObj.desc}
                </p>
              </div>
              <div>
                <p className="mb-2 text-xs font-bold text-text-primary">Good for:</p>
                <div className="flex flex-wrap gap-1.5">
                  {previewObj.goodFor.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full border border-border bg-surface px-2.5 py-0.5 text-xs text-text-secondary"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <p className="text-sm text-text-tertiary">Hover over an objective to see details.</p>
          )}
        </div>
      </div>

      <StepFooter
        onBack={ctl.exitToMode}
        backLabel="Chiqish"
        onContinue={() => ctl.setMetaStep(2)}
        continueDisabled={!ctl.metaData.objective}
      />
    </WizardStepCard>
  )
}
