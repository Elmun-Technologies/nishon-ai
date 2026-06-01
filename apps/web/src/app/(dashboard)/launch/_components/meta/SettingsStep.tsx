'use client'

import { Briefcase, Flag, Home, Landmark } from 'lucide-react'
import { Input } from '@/components/ui'
import { WizardStepCard } from '@/components/launch/wizard-shell'
import { useI18n } from '@/i18n/use-i18n'
import { cn } from '@/lib/utils'
import type { LaunchWizardCtl } from '../../_lib/use-launch-wizard'
import { StepFooter } from '../StepFooter'

const SPECIAL_AD_CATEGORIES = [
  {
    id: 'credit',
    icon: Landmark,
    label: 'Financial products and services',
    desc: "Kreditlar, moliyaviy xizmatlar, sug'urta, investitsiya xizmatlari uchun reklamalar.",
  },
  {
    id: 'employment',
    icon: Briefcase,
    label: 'Employment',
    desc: "Ish o'rinlari, stajirovka, professional sertifikatlar uchun reklamalar.",
  },
  {
    id: 'housing',
    icon: Home,
    label: 'Housing',
    desc: "Ko'chmas mulk, uy-joy sug'urtasi, ipoteka kreditlari uchun reklamalar.",
  },
  {
    id: 'social_issues',
    icon: Flag,
    label: 'Social issues, elections or politics',
    desc: 'Ijtimoiy masalalar, saylovlar yoki siyosiy shaxslarga oid reklamalar.',
  },
] as const

export function SettingsStep({ ctl }: { ctl: LaunchWizardCtl }) {
  const { t } = useI18n()
  const lt = (path: string, fallback: string) => t(`launchWizard.${path}`, fallback)

  return (
    <WizardStepCard>
      <div className="space-y-6 p-6 md:p-8">
        <div>
          <h2 className="text-lg font-semibold text-text-primary">Kampaniya sozlamalari</h2>
          <p className="mt-1 text-sm text-text-secondary">
            Nom, A/B test va maxsus kategoriyalarni belgilang.
          </p>
        </div>

        <Input
          label="Kampaniya nomi"
          value={ctl.metaData.name}
          onChange={(e) => ctl.setMetaData((d) => ({ ...d, name: e.target.value }))}
          placeholder="Masalan: Bahor aktsiyasi 2026"
        />

        <div className="rounded-xl border border-border bg-surface-2/40 p-4 dark:bg-surface-elevated/20">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-text-primary">A/B test</p>
              <p className="mt-0.5 text-xs text-text-secondary">
                Qaysi versiya yaxshiroq ishlashini aniqlash uchun variantlarni solishtiring.
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={ctl.metaData.abTestEnabled}
              onClick={() =>
                ctl.setMetaData((d) => ({ ...d, abTestEnabled: !d.abTestEnabled }))
              }
              className={cn(
                'relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/25 focus-visible:ring-offset-2',
                ctl.metaData.abTestEnabled ? 'bg-[#0866FF]' : 'bg-border',
              )}
            >
              <span
                className={cn(
                  'pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-sm transition-transform',
                  ctl.metaData.abTestEnabled ? 'translate-x-5' : 'translate-x-0',
                )}
              />
            </button>
          </div>

          {ctl.metaData.abTestEnabled && (
            <div className="mt-4 space-y-4 border-t border-border pt-4">
              <div>
                <label
                  className="mb-1.5 block text-sm font-medium text-text-secondary"
                  htmlFor="ab-type"
                >
                  Nima sinab ko&apos;rmoqchisiz?
                </label>
                <select
                  id="ab-type"
                  value={ctl.metaData.abTestType}
                  onChange={(e) =>
                    ctl.setMetaData((d) => ({
                      ...d,
                      abTestType: e.target.value as typeof d.abTestType,
                    }))
                  }
                  className="w-full rounded-lg border border-border bg-surface px-4 py-2.5 text-sm focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/15"
                >
                  <option value="creative">
                    Creative — qaysi rasm/video yaxshi ishlashini aniqlash
                  </option>
                  <option value="audience">
                    Audience — yangi auditoriya ta&apos;sirini ko&apos;rish
                  </option>
                  <option value="placement">
                    Placement — eng samarali joylarni topish
                  </option>
                  <option value="custom">
                    Custom — bir nechta o&apos;zgaruvchini solishtirish
                  </option>
                </select>
              </div>
              <div>
                <label
                  className="mb-1.5 block text-sm font-medium text-text-secondary"
                  htmlFor="ab-dur"
                >
                  Test qancha davom etsin?
                </label>
                <div className="flex items-center gap-2">
                  <input
                    id="ab-dur"
                    type="number"
                    min={1}
                    max={30}
                    value={ctl.metaData.abTestDuration}
                    onChange={(e) =>
                      ctl.setMetaData((d) => ({
                        ...d,
                        abTestDuration: Math.max(1, Number(e.target.value)),
                      }))
                    }
                    className="w-24 rounded-lg border border-border bg-surface px-3 py-2.5 text-sm focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/15"
                  />
                  <span className="text-sm text-text-tertiary">kun</span>
                </div>
              </div>
              <div>
                <label
                  className="mb-1.5 block text-sm font-medium text-text-secondary"
                  htmlFor="ab-metric"
                >
                  Natijani qanday o&apos;lchash kerak?
                </label>
                <select
                  id="ab-metric"
                  value={ctl.metaData.abTestMetric}
                  onChange={(e) =>
                    ctl.setMetaData((d) => ({ ...d, abTestMetric: e.target.value }))
                  }
                  className="w-full rounded-lg border border-border bg-surface px-4 py-2.5 text-sm focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/15"
                >
                  <option value="cost_per_result">Cost per result (Tavsiya etiladi)</option>
                  <option value="cpc">CPC (cost per link click)</option>
                  <option value="cpm">Cost per 1,000 Meta Accounts reached</option>
                  <option value="cost_per_purchase">Cost per purchase</option>
                  <optgroup label="Standard Events">
                    <option value="cost_per_video_play">Cost per 3-second video play</option>
                    <option value="cost_per_add_to_cart">Cost per add to cart</option>
                    <option value="cost_per_app_install">Cost per app install</option>
                    <option value="cost_per_checkout">Cost per checkout initiated</option>
                    <option value="cost_per_content_view">Cost per content view</option>
                    <option value="cost_per_lead">Cost per lead</option>
                    <option value="cost_per_registration">Cost per registration completed</option>
                  </optgroup>
                </select>
              </div>
            </div>
          )}
        </div>

        <div className="rounded-xl border border-border bg-surface-2/40 p-4 dark:bg-surface-elevated/20">
          <div className="flex items-start gap-2.5 pb-3">
            <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
              <svg viewBox="0 0 16 16" className="h-3 w-3 fill-current" aria-hidden>
                <path d="M13.78 4.22a.75.75 0 010 1.06l-7.25 7.25a.75.75 0 01-1.06 0L2.22 9.28a.75.75 0 011.06-1.06L6 10.94l6.72-6.72a.75.75 0 011.06 0z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-text-primary">Special Ad Categories</p>
              <p className="mt-0.5 text-xs leading-relaxed text-text-secondary">
                Moliyaviy mahsulotlar, ish joylari, uy-joy yoki siyosatga oid reklamalar
                bo&apos;lsa, e&apos;lon qiling. Reklama rad etilishini oldini olishga yordam
                beradi.
              </p>
            </div>
          </div>

          <div className="mb-3 border-t border-border pt-3">
            <p className="mb-2 text-xs font-semibold text-text-secondary">Kategoriyalar</p>
            <p className="mb-3 text-xs text-text-tertiary">
              Kampaniyangizni eng yaxshi tavsiflovchi kategoriyalarni tanlang.
            </p>
            <div className="space-y-2">
              {SPECIAL_AD_CATEGORIES.map(({ id, icon: Icon, label, desc }) => {
                const checked = ctl.metaData.specialAdCategories.includes(id)
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() =>
                      ctl.setMetaData((d) => ({
                        ...d,
                        specialAdCategories: checked
                          ? d.specialAdCategories.filter((c) => c !== id)
                          : [...d.specialAdCategories, id],
                      }))
                    }
                    className={cn(
                      'flex w-full items-start gap-3 rounded-xl border px-4 py-3 text-left transition-all',
                      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0866FF]/20',
                      checked
                        ? 'border-[#0866FF]/40 bg-[#0866FF]/[0.05] ring-1 ring-[#0866FF]/15'
                        : 'border-border bg-surface hover:border-text-tertiary/30 hover:bg-surface-2/50',
                    )}
                  >
                    <div
                      className={cn(
                        'mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border',
                        checked
                          ? 'border-[#0866FF]/25 bg-white dark:bg-surface-elevated'
                          : 'border-border bg-surface-2',
                      )}
                    >
                      <Icon className={cn('h-4 w-4', checked ? 'text-[#0866FF]' : 'text-text-tertiary')} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-text-primary">{label}</p>
                      <p className="mt-0.5 text-xs leading-relaxed text-text-secondary">{desc}</p>
                    </div>
                    <span
                      className={cn(
                        'mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 transition-all',
                        checked
                          ? 'border-[#0866FF] bg-[#0866FF]'
                          : 'border-border bg-transparent',
                      )}
                    >
                      {checked && (
                        <svg viewBox="0 0 12 10" className="h-3 w-3 fill-white" aria-hidden>
                          <path d="M1 5l3.5 3.5L11 1" strokeWidth="2" stroke="white" fill="none" />
                        </svg>
                      )}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          <div className="border-t border-border pt-3">
            <label
              className="mb-0.5 block text-sm font-semibold text-text-primary"
              htmlFor="meta-country"
            >
              Countries
            </label>
            <p className="mb-2 text-xs text-text-secondary">
              Kampaniyani qaysi mamlakatda o&apos;tkazmoqchisiz? Qo&apos;shimcha talablar
              bo&apos;lishi mumkin.
            </p>
            <select
              id="meta-country"
              value={ctl.metaData.location}
              onChange={(e) => ctl.setMetaData((d) => ({ ...d, location: e.target.value }))}
              className="w-full rounded-lg border border-border bg-surface px-4 py-2.5 text-sm focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/15"
            >
              <option value="UZ">{lt('meta.locUZ', 'Uzbekistan')}</option>
              <option value="KZ">{lt('meta.locKZ', 'Kazakhstan')}</option>
              <option value="TJ">{lt('meta.locTJ', 'Tajikistan')}</option>
              <option value="TM">{lt('meta.locTM', 'Turkmenistan')}</option>
              <option value="RU">Russia</option>
              <option value="US">United States</option>
            </select>
          </div>
        </div>
      </div>

      <StepFooter
        onBack={() => ctl.setMetaStep(1)}
        onContinue={() => ctl.setMetaStep(3)}
        continueDisabled={!ctl.metaStepValid}
      />
    </WizardStepCard>
  )
}
