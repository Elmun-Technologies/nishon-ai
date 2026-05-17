'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Briefcase,
  ChevronLeft,
  Flag,
  Globe,
  Home,
  Landmark,
  Megaphone,
  MessageCircle,
  ShoppingCart,
  Smartphone,
  Target,
} from 'lucide-react'
import { Alert, Button, Input, Textarea } from '@/components/ui'
import { useI18n } from '@/i18n/use-i18n'
import { campaigns as campaignsApi } from '@/lib/api-client'
import { useWorkspaceStore } from '@/stores/workspace.store'
import { cn } from '@/lib/utils'
import { SectionCard, ToggleSwitch } from './SectionCard'

type MetaObjective =
  | 'awareness'
  | 'traffic'
  | 'engagement'
  | 'leads'
  | 'app_promotion'
  | 'sales'

type SpecialCategory = 'credit' | 'employment' | 'housing' | 'social_issues'

type MetaFormData = {
  name: string
  objective: '' | MetaObjective
  minAge: number
  maxAge: number
  location: string
  dailyBudget: string
  campaignDuration: number
  creativeUrl: string
  creativeText: string
  ctaButton: string
  abTestEnabled: boolean
  abTestType: 'creative' | 'audience' | 'placement' | 'custom'
  abTestDuration: number
  abTestMetric: string
  specialAdCategories: SpecialCategory[]
}

const INITIAL: MetaFormData = {
  name: '',
  objective: '',
  minAge: 18,
  maxAge: 65,
  location: 'UZ',
  dailyBudget: '',
  campaignDuration: 7,
  creativeUrl: '',
  creativeText: '',
  ctaButton: 'learn_more',
  abTestEnabled: false,
  abTestType: 'creative',
  abTestDuration: 7,
  abTestMetric: 'cost_per_result',
  specialAdCategories: [],
}

function parsePositiveNumber(v: string) {
  const n = Number(String(v).replace(',', '.'))
  return Number.isFinite(n) && n > 0 ? n : null
}

function formatMoneyUsd(n: number) {
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(n)
}

export function MetaCampaignForm({ onBack }: { onBack: () => void }) {
  const { t } = useI18n()
  const router = useRouter()
  const { currentWorkspace } = useWorkspaceStore()
  const [data, setData] = useState<MetaFormData>(INITIAL)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const lt = (path: string, fallback: string) => t(`launchWizard.${path}`, fallback)

  const objectives = useMemo(
    () =>
      [
        {
          id: 'awareness' as const,
          icon: Megaphone,
          label: 'Awareness',
          color: 'bg-amber-500/15',
          iconColor: 'text-amber-600 dark:text-amber-400',
        },
        {
          id: 'traffic' as const,
          icon: Globe,
          label: 'Traffic',
          color: 'bg-yellow-400/15',
          iconColor: 'text-yellow-600 dark:text-yellow-400',
        },
        {
          id: 'engagement' as const,
          icon: MessageCircle,
          label: 'Engagement',
          color: 'bg-sky-500/15',
          iconColor: 'text-sky-600 dark:text-sky-400',
        },
        {
          id: 'leads' as const,
          icon: Target,
          label: 'Leads',
          color: 'bg-orange-500/15',
          iconColor: 'text-orange-600 dark:text-orange-400',
        },
        {
          id: 'app_promotion' as const,
          icon: Smartphone,
          label: 'App promotion',
          color: 'bg-violet-500/15',
          iconColor: 'text-violet-600 dark:text-violet-400',
        },
        {
          id: 'sales' as const,
          icon: ShoppingCart,
          label: 'Sales',
          color: 'bg-emerald-500/15',
          iconColor: 'text-emerald-600 dark:text-emerald-400',
        },
      ],
    [],
  )

  const specialCats = useMemo(
    () =>
      [
        {
          id: 'credit' as const,
          icon: Landmark,
          label: lt('form.specialFinancial', 'Financial products and services'),
          desc: lt('form.specialFinancialDesc', 'Loans, insurance, investments.'),
        },
        {
          id: 'employment' as const,
          icon: Briefcase,
          label: lt('form.specialEmployment', 'Employment'),
          desc: lt('form.specialEmploymentDesc', 'Jobs, internships, certifications.'),
        },
        {
          id: 'housing' as const,
          icon: Home,
          label: lt('form.specialHousing', 'Housing'),
          desc: lt('form.specialHousingDesc', 'Real estate, mortgages, home insurance.'),
        },
        {
          id: 'social_issues' as const,
          icon: Flag,
          label: lt('form.specialPolitics', 'Social issues, elections and politics'),
          desc: lt('form.specialPoliticsDesc', 'Elections, political figures, social causes.'),
        },
      ],
    [t],
  )

  const totalSpend = useMemo(() => {
    const daily = parsePositiveNumber(data.dailyBudget) ?? 0
    return daily * data.campaignDuration
  }, [data.dailyBudget, data.campaignDuration])

  const valid = {
    name: data.name.trim().length >= 2,
    objective: !!data.objective,
    audience: data.minAge >= 13 && data.minAge < data.maxAge,
    budget: parsePositiveNumber(data.dailyBudget) !== null,
  }
  const allValid = valid.name && valid.objective && valid.audience && valid.budget

  const handleLaunch = async () => {
    setError('')
    if (!valid.name) return setError(lt('meta.errorName', 'Enter a campaign name.'))
    if (!valid.budget) return setError(lt('meta.errorBudget', 'Enter a valid daily budget.'))
    if (!valid.audience) return setError(lt('meta.errorAge', 'Invalid age range.'))
    setSaving(true)
    try {
      await campaignsApi.create(currentWorkspace?.id ?? '', {
        name: data.name.trim(),
        platform: 'meta',
        objective: data.objective || 'leads',
        dailyBudget: parsePositiveNumber(data.dailyBudget) ?? 0,
        totalBudget: totalSpend,
      })
      router.push('/campaigns')
    } catch (err: any) {
      setError(err?.message || 'Error creating campaign')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-5 py-6">
      <div>
        <button
          type="button"
          onClick={onBack}
          className="mb-2 flex items-center gap-1 text-sm text-text-tertiary hover:text-text-primary"
        >
          <ChevronLeft className="h-4 w-4" aria-hidden />
          {lt('common.back', 'Back')}
        </button>
        <h1 className="text-2xl font-semibold tracking-tight text-text-primary">
          {lt('meta.pageTitle', 'Meta campaign')}
        </h1>
        <p className="mt-1 text-sm text-text-secondary">
          {lt('form.saved', 'All changes saved')}
        </p>
      </div>

      {error ? <Alert variant="error">{error}</Alert> : null}

      <SectionCard
        title={lt('form.secName', 'Campaign name')}
        description={lt('form.secNameDesc', 'Internal name — visible only to you.')}
        complete={valid.name}
      >
        <Input
          value={data.name}
          onChange={(e) => setData((d) => ({ ...d, name: e.target.value }))}
          placeholder={lt('meta.campaignNamePh', 'e.g.: Spring leads — UZ')}
        />
      </SectionCard>

      <SectionCard
        title={lt('form.secObjective', 'Campaign objective')}
        description={lt('form.secObjectiveDesc', 'Optimization signal depends on this objective.')}
        complete={valid.objective}
      >
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {objectives.map((o) => {
            const Icon = o.icon
            const selected = data.objective === o.id
            return (
              <button
                key={o.id}
                type="button"
                onClick={() => setData((d) => ({ ...d, objective: o.id }))}
                className={cn(
                  'flex items-center gap-3 rounded-xl border px-3.5 py-3 text-left transition-all',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/25',
                  selected
                    ? 'border-brand-mid/50 bg-brand-mid/[0.06] ring-1 ring-brand-mid/20 dark:border-brand-lime/40 dark:bg-brand-lime/10'
                    : 'border-border bg-surface hover:border-text-tertiary/40 hover:bg-surface-2/60',
                )}
              >
                <span
                  className={cn(
                    'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg',
                    o.color,
                  )}
                >
                  <Icon className={cn('h-4 w-4', o.iconColor)} />
                </span>
                <span className="min-w-0 flex-1 text-sm font-medium text-text-primary">
                  {o.label}
                </span>
                <span
                  className={cn(
                    'flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-all',
                    selected
                      ? 'border-brand-mid bg-brand-mid dark:border-brand-lime dark:bg-brand-lime'
                      : 'border-border bg-transparent',
                  )}
                >
                  {selected && <span className="h-2 w-2 rounded-full bg-white" />}
                </span>
              </button>
            )
          })}
        </div>
      </SectionCard>

      <SectionCard
        title={lt('form.secAudience', 'Audience')}
        description={lt('form.secAudienceDesc', 'Age and location.')}
        complete={valid.audience}
      >
        <div>
          <label className="mb-2 block text-sm font-medium text-text-secondary">
            {lt('meta.ageLabel', 'Age range')}
          </label>
          <div className="flex flex-wrap items-center gap-3">
            <input
              type="number"
              min={13}
              max={75}
              value={data.minAge}
              onChange={(e) => setData((d) => ({ ...d, minAge: Number(e.target.value) }))}
              className="w-24 rounded-lg border border-border bg-surface px-3 py-2 text-sm focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/15"
            />
            <span className="text-text-tertiary">—</span>
            <input
              type="number"
              min={13}
              max={75}
              value={data.maxAge}
              onChange={(e) => setData((d) => ({ ...d, maxAge: Number(e.target.value) }))}
              className="w-24 rounded-lg border border-border bg-surface px-3 py-2 text-sm focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/15"
            />
          </div>
        </div>
        <div>
          <label
            className="mb-2 block text-sm font-medium text-text-secondary"
            htmlFor="meta-country"
          >
            {lt('form.secCountries', 'Country')}
          </label>
          <select
            id="meta-country"
            value={data.location}
            onChange={(e) => setData((d) => ({ ...d, location: e.target.value }))}
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
      </SectionCard>

      <SectionCard
        title={lt('form.secBudget', 'Budget and duration')}
        description={lt('form.secBudgetDesc', 'Set daily spend and campaign length.')}
        complete={valid.budget}
      >
        <div>
          <label className="mb-2 block text-sm font-medium text-text-secondary" htmlFor="meta-daily">
            {lt('meta.dailyUsd', 'Daily budget (USD)')}
          </label>
          <div className="flex items-center gap-2">
            <span className="text-text-tertiary">$</span>
            <input
              id="meta-daily"
              type="number"
              min={1}
              step={1}
              value={data.dailyBudget}
              onChange={(e) => setData((d) => ({ ...d, dailyBudget: e.target.value }))}
              placeholder="50"
              className="min-w-0 flex-1 rounded-lg border border-border bg-surface px-4 py-2.5 text-sm focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/15"
            />
            <span className="text-xs text-text-tertiary">{lt('meta.perDay', '/ day')}</span>
          </div>
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium text-text-secondary" htmlFor="meta-dur">
            {lt('meta.duration', 'Duration')}:{' '}
            {lt('meta.durationDays', '{{n}} days').replace('{{n}}', String(data.campaignDuration))}
          </label>
          <input
            id="meta-dur"
            type="range"
            min={1}
            max={90}
            value={data.campaignDuration}
            onChange={(e) =>
              setData((d) => ({ ...d, campaignDuration: Number(e.target.value) }))
            }
            className="mt-2 w-full accent-primary"
          />
          <p className="mt-2 text-xs text-text-tertiary">
            {lt('form.estTotal', 'Estimated total spend')}: {formatMoneyUsd(totalSpend)}
          </p>
        </div>
      </SectionCard>

      <SectionCard
        title={lt('form.secCreative', 'Creative')}
        description={lt('form.secCreativeDesc', 'Media URL, primary text and CTA.')}
      >
        <Input
          label={lt('meta.creativeUrl', 'Image or video URL')}
          value={data.creativeUrl}
          onChange={(e) => setData((d) => ({ ...d, creativeUrl: e.target.value }))}
          placeholder="https://"
        />
        <div className="space-y-2">
          <label className="text-sm font-medium text-text-secondary">
            {lt('meta.creativeText', 'Primary text')}
          </label>
          <Textarea
            value={data.creativeText}
            onChange={(e) => setData((d) => ({ ...d, creativeText: e.target.value }))}
            placeholder="…"
            rows={4}
          />
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium text-text-secondary" htmlFor="meta-cta">
            {lt('meta.ctaLabel', 'CTA button')}
          </label>
          <select
            id="meta-cta"
            value={data.ctaButton}
            onChange={(e) => setData((d) => ({ ...d, ctaButton: e.target.value }))}
            className="w-full rounded-lg border border-border bg-surface px-4 py-2.5 text-sm focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/15"
          >
            <option value="learn_more">{lt('meta.cta_learn_more', 'Learn more')}</option>
            <option value="contact_us">{lt('meta.cta_contact', 'Contact us')}</option>
            <option value="shop_now">{lt('meta.cta_shop', 'Shop now')}</option>
            <option value="sign_up">{lt('meta.cta_signup', 'Sign up')}</option>
          </select>
        </div>
      </SectionCard>

      <SectionCard
        title={lt('form.secAbTest', 'A/B testing')}
        description={lt('form.secAbTestDesc', 'Compare variants to find the best performer.')}
        action={
          <ToggleSwitch
            checked={data.abTestEnabled}
            onChange={(next) => setData((d) => ({ ...d, abTestEnabled: next }))}
            ariaLabel={lt('form.secAbTest', 'A/B testing')}
          />
        }
      >
        {data.abTestEnabled ? (
          <>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-text-secondary" htmlFor="ab-type">
                {lt('form.abTestType', 'What do you want to test?')}
              </label>
              <select
                id="ab-type"
                value={data.abTestType}
                onChange={(e) =>
                  setData((d) => ({
                    ...d,
                    abTestType: e.target.value as MetaFormData['abTestType'],
                  }))
                }
                className="w-full rounded-lg border border-border bg-surface px-4 py-2.5 text-sm focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/15"
              >
                <option value="creative">{lt('form.abCreative', 'Creative')}</option>
                <option value="audience">{lt('form.abAudience', 'Audience')}</option>
                <option value="placement">{lt('form.abPlacement', 'Placement')}</option>
                <option value="custom">{lt('form.abCustom', 'Custom')}</option>
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-text-secondary" htmlFor="ab-dur">
                {lt('form.abDuration', 'Test duration')}
              </label>
              <div className="flex items-center gap-2">
                <input
                  id="ab-dur"
                  type="number"
                  min={1}
                  max={30}
                  value={data.abTestDuration}
                  onChange={(e) =>
                    setData((d) => ({
                      ...d,
                      abTestDuration: Math.max(1, Number(e.target.value)),
                    }))
                  }
                  className="w-24 rounded-lg border border-border bg-surface px-3 py-2.5 text-sm focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/15"
                />
                <span className="text-sm text-text-tertiary">{lt('form.abDays', 'days')}</span>
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-text-secondary" htmlFor="ab-metric">
                {lt('form.abMetric', 'Primary metric')}
              </label>
              <select
                id="ab-metric"
                value={data.abTestMetric}
                onChange={(e) => setData((d) => ({ ...d, abTestMetric: e.target.value }))}
                className="w-full rounded-lg border border-border bg-surface px-4 py-2.5 text-sm focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/15"
              >
                <option value="cost_per_result">Cost per result</option>
                <option value="cpc">CPC</option>
                <option value="cpm">CPM</option>
                <option value="cost_per_purchase">Cost per purchase</option>
                <option value="cost_per_lead">Cost per lead</option>
              </select>
            </div>
          </>
        ) : null}
      </SectionCard>

      <SectionCard
        title={lt('form.secSpecialCats', 'Special ad categories')}
        description={lt(
          'form.secSpecialCatsDesc',
          'Declare finance, jobs, housing or politics to avoid rejection.',
        )}
        complete={data.specialAdCategories.length === 0 ? false : true}
      >
        <div className="space-y-2">
          {specialCats.map(({ id, icon: Icon, label, desc }) => {
            const checked = data.specialAdCategories.includes(id)
            return (
              <button
                key={id}
                type="button"
                onClick={() =>
                  setData((d) => ({
                    ...d,
                    specialAdCategories: checked
                      ? d.specialAdCategories.filter((c) => c !== id)
                      : [...d.specialAdCategories, id],
                  }))
                }
                className={cn(
                  'flex w-full items-start gap-3 rounded-xl border px-4 py-3 text-left transition-all',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20',
                  checked
                    ? 'border-brand-mid/40 bg-brand-mid/[0.05] ring-1 ring-brand-mid/15 dark:border-brand-lime/40 dark:bg-brand-lime/10'
                    : 'border-border bg-surface hover:border-text-tertiary/30 hover:bg-surface-2/50',
                )}
              >
                <div
                  className={cn(
                    'mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border',
                    checked
                      ? 'border-brand-mid/25 bg-white dark:bg-surface-elevated'
                      : 'border-border bg-surface-2',
                  )}
                >
                  <Icon
                    className={cn(
                      'h-4 w-4',
                      checked ? 'text-brand-mid dark:text-brand-lime' : 'text-text-tertiary',
                    )}
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-text-primary">{label}</p>
                  <p className="mt-0.5 text-xs leading-relaxed text-text-secondary">{desc}</p>
                </div>
                <span
                  className={cn(
                    'mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 transition-all',
                    checked
                      ? 'border-brand-mid bg-brand-mid dark:border-brand-lime dark:bg-brand-lime'
                      : 'border-border bg-transparent',
                  )}
                >
                  {checked && (
                    <svg viewBox="0 0 12 10" className="h-3 w-3" aria-hidden>
                      <path d="M1 5l3.5 3.5L11 1" strokeWidth="2" stroke="white" fill="none" />
                    </svg>
                  )}
                </span>
              </button>
            )
          })}
        </div>
      </SectionCard>

      <div className="sticky bottom-4 z-10 flex flex-col-reverse gap-3 rounded-2xl border border-border bg-surface/95 p-4 shadow-lg backdrop-blur dark:bg-surface-elevated/95 sm:flex-row sm:items-center sm:justify-between">
        <Button type="button" variant="secondary" onClick={onBack}>
          <ChevronLeft className="h-4 w-4" aria-hidden />
          {lt('common.back', 'Back')}
        </Button>
        <Button
          type="button"
          loading={saving}
          disabled={!allValid || saving}
          onClick={handleLaunch}
          className="sm:min-w-[200px]"
        >
          {lt('common.launch', 'Publish')}
        </Button>
      </div>
    </div>
  )
}
