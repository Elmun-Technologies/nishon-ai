'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useI18n } from '@/i18n/use-i18n'
import { agents } from '@/lib/api-client'
import { Spinner } from '@/components/ui/Spinner'
import { Alert } from '@/components/ui/Alert'
import { AdAccountsConnection } from '@/components/portfolio/AdAccountsConnection'
import { cn } from '@/lib/utils'

const STEP_DEFS = [
  { id: 0, icon: '🔗' },
  { id: 1, icon: '👤' },
  { id: 2, icon: '👁️' },
  { id: 3, icon: '🚀' },
] as const

const VISIBILITY_IDS = ['roas', 'cpa', 'spend', 'campaigns', 'niches', 'monthly', 'recent'] as const

const NICHE_SUGGESTIONS = [
  'E-commerce',
  'Fashion',
  'Beauty & Cosmetics',
  'Food & Beverage',
  'Real Estate',
  'Education',
  'B2B SaaS',
  'Healthcare',
  'Finance',
]
const PLATFORM_OPTIONS = ['meta', 'google', 'yandex', 'telegram', 'tiktok', 'youtube'] as const

function SetupStep({
  icon,
  label,
  active,
  done,
}: {
  icon: string
  label: string
  active: boolean
  done: boolean
}) {
  return (
    <div
      className={cn(
        'flex items-center gap-3 rounded-xl border p-3 transition-all',
        active && 'border-primary/35 bg-primary/8 shadow-sm ring-1 ring-primary/20 dark:bg-primary/10',
        !active &&
          done &&
          'border-emerald-500/25 bg-emerald-500/5 dark:border-emerald-500/30 dark:bg-emerald-500/10',
        !active && !done && 'border-transparent bg-surface hover:border-border hover:bg-surface-2',
      )}
    >
      <div
        className={cn(
          'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-sm',
          done && 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400',
          active && !done && 'bg-surface-2 text-text-primary dark:bg-surface-elevated',
          !active && !done && 'bg-surface-2 text-text-secondary',
        )}
      >
        {done ? '✓' : icon}
      </div>
      <span
        className={cn(
          'text-sm',
          active && 'font-semibold text-text-primary',
          !active && done && 'text-text-secondary',
          !active && !done && 'text-text-secondary',
        )}
      >
        {label}
      </span>
    </div>
  )
}

export default function PortfolioDashboardPage() {
  const { t } = useI18n()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [existingProfile, setExistingProfile] = useState<any>(null)
  const [activeStep, setActiveStep] = useState(0)
  const [completedSteps, setCompletedSteps] = useState<number[]>([])
  const [portfolioLive, setPortfolioLive] = useState(false)

  const [profile, setProfile] = useState({
    displayName: '',
    title: '',
    bio: '',
    location: '',
    monthlyRate: '',
    commissionRate: '',
    pricingModel: 'fixed' as 'fixed' | 'commission' | 'hybrid',
    niches: [] as string[],
    platforms: [] as string[],
  })
  const [nicheInput, setNicheInput] = useState('')
  const [visibility, setVisibility] = useState<string[]>(['roas', 'cpa', 'campaigns', 'niches'])

  useEffect(() => {
    agents
      .mine()
      .then((res) => {
        const list = res.data as any[]
        if (list && list.length > 0) {
          const p = list[0]
          setExistingProfile(p)
          setProfile({
            displayName: p.displayName || '',
            title: p.title || '',
            bio: p.bio || '',
            location: p.location || '',
            monthlyRate: String(p.monthlyRate || ''),
            commissionRate: String(p.commissionRate || ''),
            pricingModel: p.pricingModel || 'fixed',
            niches: p.niches || [],
            platforms: p.platforms || [],
          })
          if (p.isPublished) {
            setPortfolioLive(true)
          }
          setCompletedSteps([1, 2])
        }
      })
      .catch(() => {
        /* no profile yet */
      })
      .finally(() => setLoading(false))
  }, [])

  const completeStep = (step: number) => {
    if (!completedSteps.includes(step)) setCompletedSteps((prev) => [...prev, step])
    if (step < STEP_DEFS.length) setActiveStep(step + 1)
  }

  const addNiche = () => {
    const v = nicheInput.trim()
    if (v && !profile.niches.includes(v)) {
      setProfile((p) => ({ ...p, niches: [...p.niches, v] }))
      setNicheInput('')
    }
  }

  const togglePlatform = (p: string) => {
    setProfile((prev) => ({
      ...prev,
      platforms: prev.platforms.includes(p) ? prev.platforms.filter((x) => x !== p) : [...prev.platforms, p],
    }))
  }

  const toggleVisibility = (id: string) =>
    setVisibility((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))

  const handlePublish = async () => {
    setSaving(true)
    setError('')
    try {
      const dto = {
        agentType: 'human' as const,
        displayName: profile.displayName || profile.title,
        title: profile.title,
        bio: profile.bio,
        location: profile.location,
        monthlyRate: profile.monthlyRate ? Number(profile.monthlyRate) : 0,
        commissionRate: profile.commissionRate ? Number(profile.commissionRate) : 0,
        pricingModel: profile.pricingModel,
        niches: profile.niches,
        platforms: profile.platforms,
      }

      let savedProfile: any
      if (existingProfile) {
        const res = await agents.update(existingProfile.id, dto)
        savedProfile = res.data
      } else {
        const res = await agents.create(dto)
        savedProfile = res.data
        setExistingProfile(savedProfile)
      }

      if (!savedProfile.isPublished) {
        await agents.togglePublish(savedProfile.id)
      }

      setPortfolioLive(true)
      setSuccess(t('portfolioSetup.successPublished', 'Portfolio published successfully.'))
    } catch (e: any) {
      setError(e?.message || t('portfolioSetup.errorGeneric', 'Something went wrong'))
    } finally {
      setSaving(false)
    }
  }

  const handleUnpublish = async () => {
    if (!existingProfile) return
    setSaving(true)
    try {
      await agents.togglePublish(existingProfile.id)
      setPortfolioLive(false)
      setSuccess(t('portfolioSetup.successHidden', 'Portfolio hidden.'))
      setTimeout(() => setSuccess(''), 3000)
    } catch (e: any) {
      setError(e?.message || t('portfolioSetup.errorGeneric', 'Something went wrong'))
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Spinner size="lg" />
      </div>
    )
  }

  if (portfolioLive && existingProfile) {
    return (
      <div className="mx-auto max-w-2xl p-8 text-center">
        <div className="mb-4 text-6xl">🎉</div>
        <h2 className="mb-3 text-2xl font-bold text-text-primary">
          {t('portfolioSetup.liveTitle', 'Portfolio is live')}
        </h2>
        <p className="mb-8 text-text-secondary">
          {t('portfolioSetup.liveSubtitle', 'Your profile is visible in the public catalog.')}
        </p>
        {success && (
          <Alert variant="success" className="mb-4">
            {success}
          </Alert>
        )}
        {error && (
          <Alert variant="error" className="mb-4">
            {error}
          </Alert>
        )}
        <div className="mb-8 flex items-center gap-3 rounded-xl border border-border bg-surface-elevated p-4">
          <span className="flex-1 truncate text-sm text-text-secondary">
            adspectr.com/marketplace/portfolio/{existingProfile.slug}
          </span>
          <button
            type="button"
            onClick={() => router.push(`/marketplace/portfolio/${existingProfile.slug}`)}
            className="text-sm font-semibold text-text-primary transition-colors hover:underline"
          >
            {t('portfolioSetup.liveOpen', 'View →')}
          </button>
        </div>
        <div className="flex flex-wrap justify-center gap-3">
          <button
            type="button"
            onClick={() => router.push('/marketplace/portfolio')}
            className="rounded-xl bg-text-primary px-6 py-3 font-semibold text-white transition-all hover:opacity-90"
          >
            {t('portfolioSetup.liveCatalog', 'Open catalog')}
          </button>
          <button
            type="button"
            onClick={() => {
              setPortfolioLive(false)
              setActiveStep(1)
            }}
            className="rounded-xl border border-border bg-surface-2 px-6 py-3 font-semibold text-text-primary transition-all hover:bg-surface"
          >
            {t('portfolioSetup.liveEdit', 'Edit')}
          </button>
          <button
            type="button"
            onClick={handleUnpublish}
            disabled={saving}
            className="rounded-xl border border-red-500/25 px-4 py-3 text-sm text-red-600 transition-all hover:bg-red-500/10 dark:text-red-400"
          >
            {saving ? '…' : t('portfolioSetup.liveHide', 'Unpublish')}
          </button>
        </div>
      </div>
    )
  }

  const pricingOptions = [
    { id: 'fixed' as const, label: t('portfolioSetup.pricingFixed', 'Monthly retainer') },
    { id: 'commission' as const, label: t('portfolioSetup.pricingCommission', 'Commission') },
    { id: 'hybrid' as const, label: t('portfolioSetup.pricingHybrid', 'Hybrid') },
  ]

  return (
    <div className="mx-auto max-w-5xl p-6">
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-text-primary">
            {existingProfile
              ? t('portfolioSetup.heroEditTitle', 'Edit your portfolio')
              : t('portfolioSetup.heroCreateTitle', 'Create your portfolio')}
          </h1>
          <p className="mt-1 max-w-xl text-sm text-text-secondary">
            {t(
              'portfolioSetup.heroSubtitle',
              'Complete the steps so clients can see your expertise and contact you.',
            )}
          </p>
        </div>
        {existingProfile && (
          <Link
            href={`/marketplace/portfolio/${existingProfile.slug}`}
            className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-text-primary transition-colors hover:bg-surface-2"
          >
            {t('portfolioSetup.publicViewLink', 'Public profile →')}
          </Link>
        )}
      </div>

      {error && (
        <Alert variant="error" className="mb-4">
          {error}
        </Alert>
      )}
      {success && (
        <Alert variant="success" className="mb-4">
          {success}
        </Alert>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
        <div className="lg:col-span-1">
          <div className="sticky top-4 rounded-2xl border border-border bg-surface-elevated p-4 shadow-sm">
            <p className="mb-3 px-1 text-xs font-bold uppercase tracking-wider text-text-secondary">
              {t('portfolioSetup.stepsTitle', 'Steps')}
            </p>
            <div className="space-y-1">
              {STEP_DEFS.map((step) => (
                <button key={step.id} type="button" onClick={() => setActiveStep(step.id)} className="w-full text-left">
                  <SetupStep
                    icon={step.icon}
                    label={t(`portfolioSetup.step${step.id}`, '')}
                    active={activeStep === step.id}
                    done={completedSteps.includes(step.id)}
                  />
                </button>
              ))}
            </div>
            <div className="mt-4 border-t border-border pt-4">
              <div className="mb-1 flex justify-between text-xs text-text-secondary">
                <span>{t('portfolioSetup.processLabel', 'Progress')}</span>
                <span>
                  {completedSteps.length}/{STEP_DEFS.length}
                </span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-surface-2">
                <div
                  className="h-1.5 rounded-full bg-primary transition-all"
                  style={{ width: `${(completedSteps.length / STEP_DEFS.length) * 100}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6 lg:col-span-3">
          {activeStep === 0 && (
            <div className="rounded-2xl border border-border bg-surface-elevated p-6 shadow-sm">
              <AdAccountsConnection onConnectionComplete={() => completeStep(0)} />
            </div>
          )}

          {activeStep === 1 && (
            <div className="rounded-2xl border border-border bg-surface-elevated p-6 shadow-sm">
              <div className="mb-2 flex items-center gap-3">
                <span className="text-2xl">👤</span>
                <h2 className="text-lg font-bold text-text-primary">
                  {t('portfolioSetup.profileTitle', 'Your profile')}
                </h2>
              </div>
              <p className="mb-6 text-sm text-text-secondary">
                {t('portfolioSetup.profileSubtitle', 'Information shown to businesses.')}
              </p>

              <div className="space-y-5">
                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-text-secondary">
                    {t('portfolioSetup.labelFullName', 'Full name *')}
                  </label>
                  <input
                    value={profile.displayName}
                    onChange={(e) => setProfile((p) => ({ ...p, displayName: e.target.value }))}
                    placeholder={t('portfolioSetup.phFullName', '')}
                    className="w-full rounded-lg border border-border bg-surface px-4 py-3 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary/25"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-text-secondary">
                    {t('portfolioSetup.labelHeadline', 'Headline *')}
                  </label>
                  <input
                    value={profile.title}
                    onChange={(e) => setProfile((p) => ({ ...p, title: e.target.value }))}
                    placeholder={t('portfolioSetup.phHeadline', '')}
                    className="w-full rounded-lg border border-border bg-surface px-4 py-3 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary/25"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-text-secondary">
                    {t('portfolioSetup.labelBio', 'Bio *')}
                  </label>
                  <textarea
                    value={profile.bio}
                    onChange={(e) => setProfile((p) => ({ ...p, bio: e.target.value }))}
                    placeholder={t('portfolioSetup.phBio', '')}
                    rows={4}
                    className="w-full resize-none rounded-lg border border-border bg-surface px-4 py-3 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary/25"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-text-secondary">
                    {t('portfolioSetup.labelCity', 'City')}
                  </label>
                  <input
                    value={profile.location}
                    onChange={(e) => setProfile((p) => ({ ...p, location: e.target.value }))}
                    placeholder={t('portfolioSetup.phCity', '')}
                    className="w-full rounded-lg border border-border bg-surface px-4 py-3 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary/25"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-text-secondary">
                    {t('portfolioSetup.labelPricingModel', 'Pricing model')}
                  </label>
                  <div className="mb-3 grid grid-cols-3 gap-2">
                    {pricingOptions.map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setProfile((p) => ({ ...p, pricingModel: opt.id }))}
                        className={cn(
                          'rounded-lg border py-2 text-xs font-medium transition-all',
                          profile.pricingModel === opt.id
                            ? 'border-primary bg-primary/15 text-text-primary dark:bg-primary/20'
                            : 'border-border bg-surface text-text-secondary hover:border-primary/30',
                        )}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>

                  {(profile.pricingModel === 'fixed' || profile.pricingModel === 'hybrid') && (
                    <div className="mb-2 flex items-center gap-2">
                      <span className="text-sm text-text-secondary">$</span>
                      <input
                        type="number"
                        value={profile.monthlyRate}
                        onChange={(e) => setProfile((p) => ({ ...p, monthlyRate: e.target.value }))}
                        placeholder="500"
                        className="w-32 rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/25"
                      />
                      <span className="text-sm text-text-secondary">{t('portfolioSetup.perMonth', '/ month')}</span>
                    </div>
                  )}
                  {(profile.pricingModel === 'commission' || profile.pricingModel === 'hybrid') && (
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        value={profile.commissionRate}
                        onChange={(e) => setProfile((p) => ({ ...p, commissionRate: e.target.value }))}
                        placeholder="15"
                        className="w-24 rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/25"
                      />
                      <span className="text-sm text-text-secondary">
                        {t('portfolioSetup.commissionSuffix', '% of ad spend')}
                      </span>
                    </div>
                  )}
                </div>

                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-text-secondary">
                    {t('portfolioSetup.labelPlatforms', 'Platforms')}
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {PLATFORM_OPTIONS.map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => togglePlatform(p)}
                        className={cn(
                          'rounded-lg border px-3 py-1.5 text-xs font-medium transition-all',
                          profile.platforms.includes(p)
                            ? 'border-primary bg-primary/15 text-text-primary'
                            : 'border-border bg-surface text-text-secondary hover:border-primary/25',
                        )}
                      >
                        {t(`portfolioSetup.platform.${p}`, p)}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-text-secondary">
                    {t('portfolioSetup.labelNiches', 'Industry focus')}
                  </label>
                  <div className="mb-3 flex gap-2">
                    <input
                      value={nicheInput}
                      onChange={(e) => setNicheInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && addNiche()}
                      placeholder={t('portfolioSetup.phNiche', '')}
                      className="flex-1 rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary/25"
                    />
                    <button
                      type="button"
                      onClick={addNiche}
                      className="rounded-lg border border-border bg-surface px-4 py-2 text-sm font-medium text-text-primary hover:bg-surface-2"
                    >
                      {t('portfolioSetup.nicheAdd', 'Add')}
                    </button>
                  </div>
                  <div className="mb-2 flex flex-wrap gap-2">
                    {NICHE_SUGGESTIONS.filter((n) => !profile.niches.includes(n))
                      .slice(0, 6)
                      .map((n) => (
                        <button
                          key={n}
                          type="button"
                          onClick={() => setProfile((p) => ({ ...p, niches: [...p.niches, n] }))}
                          className="rounded bg-surface-2 px-2 py-1 text-[10px] text-text-secondary transition-colors hover:bg-surface"
                        >
                          + {n}
                        </button>
                      ))}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {profile.niches.map((n) => (
                      <span
                        key={n}
                        className="flex items-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-1.5 text-xs text-text-primary"
                      >
                        {n}
                        <button
                          type="button"
                          onClick={() => setProfile((p) => ({ ...p, niches: p.niches.filter((x) => x !== n) }))}
                          className="text-text-tertiary hover:text-text-primary"
                        >
                          ✕
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  type="button"
                  onClick={() => completeStep(1)}
                  disabled={!profile.title || !profile.bio || !profile.displayName}
                  className="rounded-xl bg-text-primary px-6 py-3 font-semibold text-white transition-all hover:opacity-90 disabled:opacity-40"
                >
                  {t('portfolioSetup.continue', 'Continue →')}
                </button>
              </div>
            </div>
          )}

          {activeStep === 2 && (
            <div className="rounded-2xl border border-border bg-surface-elevated p-6 shadow-sm">
              <div className="mb-2 flex items-center gap-3">
                <span className="text-2xl">👁️</span>
                <h2 className="text-lg font-bold text-text-primary">
                  {t('portfolioSetup.visibilityTitle', 'Public visibility')}
                </h2>
              </div>
              <p className="mb-6 text-sm text-text-secondary">
                {t('portfolioSetup.visibilitySubtitle', 'Choose which metrics appear on your public profile.')}
              </p>

              <div className="space-y-3">
                {VISIBILITY_IDS.map((id) => (
                  <div
                    key={id}
                    className={cn(
                      'flex items-center justify-between rounded-xl border p-4 transition-all',
                      visibility.includes(id)
                        ? 'border-primary/30 bg-primary/5'
                        : 'border-border bg-surface hover:border-primary/20',
                    )}
                  >
                    <span className="text-sm text-text-primary">
                      {t(`portfolioSetup.visibility.${id}`, id)}
                    </span>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={visibility.includes(id)}
                      onClick={() => toggleVisibility(id)}
                      className={cn(
                        'flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full px-0.5 transition-colors',
                        visibility.includes(id) ? 'bg-primary' : 'bg-surface-2',
                      )}
                    >
                      <span
                        className={cn(
                          'h-5 w-5 rounded-full bg-surface-elevated shadow transition-transform',
                          visibility.includes(id) ? 'translate-x-5' : 'translate-x-0',
                        )}
                      />
                    </button>
                  </div>
                ))}
              </div>

              <div className="mt-6 flex justify-between">
                <button
                  type="button"
                  onClick={() => setActiveStep(1)}
                  className="text-sm text-text-secondary transition-colors hover:text-text-primary"
                >
                  {t('portfolioSetup.back', '← Back')}
                </button>
                <button
                  type="button"
                  onClick={() => completeStep(2)}
                  className="rounded-xl bg-text-primary px-6 py-3 font-semibold text-white transition-all hover:opacity-90"
                >
                  {t('portfolioSetup.continue', 'Continue →')}
                </button>
              </div>
            </div>
          )}

          {activeStep === 3 && (
            <div className="rounded-2xl border border-border bg-surface-elevated p-6 shadow-sm">
              <div className="mb-2 flex items-center gap-3">
                <span className="text-2xl">🚀</span>
                <h2 className="text-lg font-bold text-text-primary">
                  {t('portfolioSetup.publishTitle', 'Publish portfolio')}
                </h2>
              </div>
              <p className="mb-6 text-sm text-text-secondary">
                {t('portfolioSetup.publishSubtitle', 'When you publish, your profile can appear in the catalog.')}
              </p>

              <div className="mb-6 space-y-3">
                <div className="flex items-center gap-3 rounded-xl border border-border bg-surface p-3">
                  <span className="text-xl">👤</span>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-text-primary">
                      {profile.displayName || t('portfolioSetup.notSetName', 'Name not entered')}
                    </div>
                    <div className="text-xs text-text-tertiary">
                      {profile.title || t('portfolioSetup.notSetTitle', 'Headline not entered')}
                    </div>
                  </div>
                  {profile.title && profile.bio ? (
                    <span className="text-sm text-emerald-600 dark:text-emerald-400">✓</span>
                  ) : (
                    <button type="button" onClick={() => setActiveStep(1)} className="text-xs font-medium text-primary">
                      {t('portfolioSetup.fillAction', 'Complete')}
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-3 rounded-xl border border-border bg-surface p-3">
                  <span className="text-xl">📢</span>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-text-primary">
                      {t('portfolioSetup.summaryPlatforms', 'Platforms')}
                    </div>
                    <div className="text-xs text-text-tertiary">
                      {profile.platforms.length > 0
                        ? profile.platforms.join(', ')
                        : t('portfolioSetup.notSelected', 'Not selected')}
                    </div>
                  </div>
                  <span className="text-sm text-emerald-600 dark:text-emerald-400">✓</span>
                </div>

                <div className="flex items-center gap-3 rounded-xl border border-border bg-surface p-3">
                  <span className="text-xl">💰</span>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-text-primary">
                      {t('portfolioSetup.summaryPricing', 'Pricing')}
                    </div>
                    <div className="text-xs text-text-tertiary">
                      {profile.pricingModel === 'commission'
                        ? `${profile.commissionRate || 0}%`
                        : profile.pricingModel === 'hybrid'
                          ? `$${profile.monthlyRate || 0} + ${profile.commissionRate || 0}%`
                          : `$${profile.monthlyRate || 0}`}
                    </div>
                  </div>
                  <span className="text-sm text-emerald-600 dark:text-emerald-400">✓</span>
                </div>

                <div className="flex items-center gap-3 rounded-xl border border-[#fcd34d]/50 bg-[#fffbeb] p-3 dark:border-amber-700/40 dark:bg-amber-950/25">
                  <span className="text-xl">⏳</span>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-text-primary">
                      {t('portfolioSetup.summaryModerationTitle', 'Review')}
                    </div>
                    <div className="text-xs text-[#b45309] dark:text-[#fcd34d]">
                      {t('portfolioSetup.summaryModerationBody', 'Profiles may be reviewed before going live.')}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-between">
                <button
                  type="button"
                  onClick={() => setActiveStep(2)}
                  className="text-sm text-text-secondary transition-colors hover:text-text-primary"
                >
                  {t('portfolioSetup.back', '← Back')}
                </button>
                <button
                  type="button"
                  onClick={handlePublish}
                  disabled={saving || !profile.title || !profile.bio}
                  className="flex items-center gap-2 rounded-xl bg-text-primary px-8 py-3 font-bold text-white transition-all hover:opacity-90 disabled:opacity-40"
                >
                  {saving ? (
                    <>
                      <Spinner size="sm" /> {t('portfolioSetup.publishing', 'Saving…')}
                    </>
                  ) : (
                    t('portfolioSetup.publishCta', '🚀 Publish')
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
