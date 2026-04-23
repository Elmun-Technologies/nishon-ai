'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Check, ChevronLeft } from 'lucide-react'
import { PublicContainer, PublicFooter, PublicNavbar } from '@/components/public/PublicLayout'
import { useI18n } from '@/i18n/use-i18n'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui'
import { cn } from '@/lib/utils'
import { getAccessToken } from '@/lib/auth-storage'
import {
  type BusinessTypeV2,
  type GoalV2,
  type OnboardingV2State,
  type PixelModeV2,
  clearOnboardingV2,
  finalizeForRegister,
  loadOnboardingV2,
  saveOnboardingV2,
  setFirstCampaignBanner,
} from '@/lib/onboarding-v2'
import { useWorkspaceStore } from '@/stores/workspace.store'

const TOTAL = 6

const BIZ: { id: BusinessTypeV2; emoji: string; labelUz: string }[] = [
  { id: 'shop', emoji: '🛍️', labelUz: "Do'kon (kiyim, aksessuar)" },
  { id: 'course', emoji: '🎓', labelUz: 'Kurs / Ta‘lim' },
  { id: 'restaurant', emoji: '🍔', labelUz: 'Restoran / Kafe' },
  { id: 'service', emoji: '💼', labelUz: 'Xizmat' },
  { id: 'other', emoji: '📦', labelUz: 'Boshqa' },
]

const GOALS: { id: GoalV2; titleUz: string; subUz: string }[] = [
  { id: 'sales', titleUz: 'Savdo oshirish', subUz: 'Dashboardda asosiy metrika — savdo / ROAS' },
  { id: 'leads', titleUz: "Lead yig'ish", subUz: 'Dashboardda birinchi — ariza / lead' },
  { id: 'awareness', titleUz: 'Brand awareness', subUz: 'Dashboardda birinchi — qamrov va eslash' },
]

function formatUzs(n: number) {
  return new Intl.NumberFormat('uz-UZ').format(n) + " so'm"
}

function estimatedReach(dailyUzs: number) {
  return Math.max(1000, Math.round(dailyUzs / 3.33))
}

function looksLikeMetaPixelId(s: string) {
  const t = s.replace(/\s/g, '')
  return /^\d{8,20}$/.test(t)
}

function ensureComplete(s: OnboardingV2State): OnboardingV2State {
  const pixelMode = (s.pixelMode || 'skipped') as PixelModeV2
  const pixelId =
    pixelMode === 'has_pixel' && s.pixelId?.trim() && looksLikeMetaPixelId(s.pixelId) ? s.pixelId.trim() : null
  return {
    ...s,
    businessType: (s.businessType || 'other') as BusinessTypeV2,
    goal: (s.goal || 'sales') as GoalV2,
    pixelMode,
    pixelId,
    dailyBudgetUzs: s.dailyBudgetUzs >= 50_000 && s.dailyBudgetUzs <= 500_000 ? s.dailyBudgetUzs : 100_000,
    telegram: s.telegram.trim().replace(/^@+/, '') ? `@${s.telegram.trim().replace(/^@+/, '')}` : '',
  }
}

function BigChoice({
  selected,
  onClick,
  children,
  className,
}: {
  selected: boolean
  onClick: () => void
  children: React.ReactNode
  className?: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'w-full rounded-2xl border px-4 py-4 text-left text-base font-semibold transition-all',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:ring-offset-2',
        'active:scale-[0.99]',
        selected
          ? 'border-brand-mid/50 bg-brand-mid/10 shadow-md ring-2 ring-brand-mid/25'
          : 'border-border bg-surface hover:bg-surface-2',
        className,
      )}
    >
      {children}
    </button>
  )
}

export default function OnboardingPage() {
  const { t } = useI18n()
  const router = useRouter()
  const accessToken = useWorkspaceStore((s) => s.accessToken)
  const setCurrentWorkspace = useWorkspaceStore((s) => s.setCurrentWorkspace)

  const [state, setState] = useState<OnboardingV2State>(() => ({
    ...loadOnboardingV2(),
  }))
  const [hydrated, setHydrated] = useState(false)
  const [pixelInput, setPixelInput] = useState('')
  const [pixelError, setPixelError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [finishError, setFinishError] = useState('')

  useEffect(() => {
    const d = loadOnboardingV2()
    setState(d)
    if (d.pixelId) setPixelInput(d.pixelId)
    setHydrated(true)
  }, [])

  useEffect(() => {
    if (!hydrated) return
    saveOnboardingV2(state)
  }, [state, hydrated])

  const pct = useMemo(() => Math.round(((state.step + 1) / TOTAL) * 100), [state.step])

  const go = useCallback((step: number) => {
    setState((s) => ({ ...s, step: Math.max(0, Math.min(5, step)) }))
  }, [])

  const skipStep = useCallback(() => {
    go(state.step + 1)
  }, [go, state.step])

  const back = useCallback(() => {
    go(state.step - 1)
  }, [go, state.step])

  const finish = useCallback(async () => {
    const ready = ensureComplete({ ...state, pixelId: state.pixelMode === 'has_pixel' ? pixelInput : state.pixelId })
    setSubmitting(true)
    setPixelError('')
    setFinishError('')

    if (ready.pixelMode === 'has_pixel' && ready.pixelId == null) {
      setPixelError(t('onboardingV2.pixelInvalid', 'Pixel ID noto‘g‘ri — faqat raqam, 8–20 belgi.'))
      setSubmitting(false)
      go(3)
      return
    }

    const body = {
      businessType: ready.businessType,
      goal: ready.goal,
      pixelId: ready.pixelId,
      pixelMode: ready.pixelMode,
      dailyBudget: ready.dailyBudgetUzs,
      telegram: ready.telegram,
    }

    try {
      if (accessToken) {
        const headers: Record<string, string> = { 'Content-Type': 'application/json' }
        const tok = getAccessToken()
        if (tok) headers.Authorization = `Bearer ${tok}`
        const res = await fetch('/api/onboarding/complete', {
          method: 'POST',
          headers,
          credentials: 'include',
          body: JSON.stringify(body),
        })
        if (res.ok) {
          const data = await res.json().catch(() => ({})) as { workspace?: any }
          if (data.workspace) setCurrentWorkspace(data.workspace)
        }
        // Workspace creation may fail on first deploy (DB migration pending) — still
        // navigate to dashboard so the user isn't stuck. They can set up workspace later.
        setFirstCampaignBanner()
        clearOnboardingV2()
        router.push('/dashboard')
      } else {
        finalizeForRegister(ready)
        router.push('/register')
      }
    } catch (e: unknown) {
      setFinishError(e instanceof Error ? e.message : "Xatolik yuz berdi. Qayta urinib ko'ring.")
      setSubmitting(false)
    }
  }, [accessToken, go, router, setCurrentWorkspace, state, pixelInput, t])

  const skipAll = useCallback(() => {
    setState((prev) => {
      const merged = ensureComplete({
        ...prev,
        businessType: (prev.businessType || 'other') as BusinessTypeV2,
        goal: (prev.goal || 'sales') as GoalV2,
        pixelMode: (prev.pixelMode || 'skipped') as PixelModeV2,
      })
      return { ...merged, step: 5 }
    })
  }, [])

  if (!hydrated) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center text-text-secondary text-sm">
        {t('onboardingV2.loading', 'Yuklanmoqda…')}
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <PublicNavbar />
      <PublicContainer className="flex-1 py-6 md:py-10">
        <div className="mx-auto max-w-lg w-full px-1">
          {/* Progress */}
          <div className="mb-6">
            <div className="flex justify-between text-xs text-text-tertiary mb-1.5">
              <span>
                {t('onboardingV2.stepOf', '{n}-qadam').replace('{n}', String(state.step + 1))} / {TOTAL}
              </span>
              <span>{pct}%</span>
            </div>
            <div className="h-2 rounded-full bg-surface-2 overflow-hidden border border-border/60">
              <div
                className="h-full rounded-full bg-gradient-to-r from-violet-500 to-brand-mid transition-[width] duration-300"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>

          <div className="flex items-center justify-between gap-2 mb-4">
            {state.step > 0 ? (
              <button
                type="button"
                onClick={back}
                className="inline-flex items-center gap-1 text-sm text-text-secondary hover:text-text-primary"
              >
                <ChevronLeft className="w-4 h-4" />
                {t('onboardingV2.back', 'Orqaga')}
              </button>
            ) : (
              <span />
            )}
            {state.step < 5 && (
              <div className="flex items-center gap-2">
                <button type="button" onClick={skipAll} className="text-xs text-text-tertiary hover:text-text-secondary underline">
                  {t('onboardingV2.skipAll', "Hammasini o'tkazish")}
                </button>
                <button type="button" onClick={skipStep} className="text-sm font-medium text-violet-600 dark:text-violet-400">
                  {t('onboardingV2.skip', "O'tkazib yuborish")}
                </button>
              </div>
            )}
          </div>

          {/* Step 0 */}
          {state.step === 0 && (
            <div className="space-y-6 text-center pt-2">
              <h1 className="text-2xl md:text-3xl font-bold text-text-primary leading-tight">
                {t('onboardingV2.welcomeTitle', "3 daqiqada birinchi kampaniyangizni yoqamiz")}
              </h1>
              <p className="text-sm text-text-secondary">
                {t('onboardingV2.welcomeSub', '5 qisqa qadam — har biri bitta savol, katta tugmalar.')}
              </p>
              <Button className="w-full rounded-2xl py-6 text-lg font-semibold" onClick={() => go(1)}>
                {t('onboardingV2.start', 'Boshlash')}
              </Button>
            </div>
          )}

          {/* Step 1 — biznes */}
          {state.step === 1 && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-text-primary">{t('onboardingV2.whoTitle', 'Siz kimsiz?')}</h2>
              <p className="text-sm text-text-secondary">{t('onboardingV2.whoSub', 'Biznes turi — shablon va filtrlar keyinroq moslashadi.')}</p>
              <div className="grid gap-3">
                {BIZ.map((b) => (
                  <BigChoice
                    key={b.id}
                    selected={state.businessType === b.id}
                    onClick={() => {
                      setState((s) => ({ ...s, businessType: b.id }))
                      go(2)
                    }}
                  >
                    <span className="mr-2">{b.emoji}</span>
                    {b.labelUz}
                  </BigChoice>
                ))}
              </div>
            </div>
          )}

          {/* Step 2 — maqsad */}
          {state.step === 2 && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-text-primary">{t('onboardingV2.goalTitle', 'Nima sotmoqchisiz?')}</h2>
              <div className="grid gap-3">
                {GOALS.map((g) => (
                  <BigChoice
                    key={g.id}
                    selected={state.goal === g.id}
                    onClick={() => {
                      setState((s) => ({ ...s, goal: g.id }))
                      go(3)
                    }}
                  >
                    <div>
                      <div>{g.titleUz}</div>
                      <div className="text-xs font-normal text-text-tertiary mt-1">{g.subUz}</div>
                    </div>
                  </BigChoice>
                ))}
              </div>
            </div>
          )}

          {/* Step 3 — pixel */}
          {state.step === 3 && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-text-primary">{t('onboardingV2.pixelTitle', 'Meta Pixel')}</h2>
              <p className="text-sm text-text-secondary">
                {t(
                  'onboardingV2.pixelHint',
                  "Ko'pchilik hozir o'tkazadi — bu normal. Pixel siz ham boshlash mumkin, ma'lumot kamroq bo'ladi.",
                )}
              </p>
              <div className="grid gap-3">
                <BigChoice
                  selected={state.pixelMode === 'has_pixel'}
                  onClick={() => setState((s) => ({ ...s, pixelMode: 'has_pixel' }))}
                >
                  {t('onboardingV2.pixelHas', 'Pixel bor — ID kiritaman')}
                </BigChoice>
                {state.pixelMode === 'has_pixel' && (
                  <div className="rounded-xl border border-border bg-surface p-3 space-y-2">
                    <label className="text-xs text-text-tertiary">Pixel ID</label>
                    <Input
                      value={pixelInput}
                      onChange={(e) => {
                        setPixelInput(e.target.value)
                        setState((s) => ({ ...s, pixelId: e.target.value.trim() || null }))
                      }}
                      placeholder="123456789012345"
                      inputMode="numeric"
                      className="font-mono"
                    />
                    {pixelError ? <p className="text-xs text-red-500">{pixelError}</p> : null}
                  </div>
                )}
                <BigChoice
                  selected={state.pixelMode === 'help'}
                  onClick={() => setState((s) => ({ ...s, pixelMode: 'help', pixelId: null }))}
                >
                  <div>
                    <div>{t('onboardingV2.pixelHelp', "Yo'rdam — video + mutaxassis ($5)")}</div>
                    <p className="text-xs font-normal text-text-tertiary mt-1">
                      {t('onboardingV2.pixelHelpSub', 'Qisqa video (~45 s), keyin mutaxassis ulab beradi.')}
                    </p>
                  </div>
                </BigChoice>
                <BigChoice
                  selected={state.pixelMode === 'skipped'}
                  onClick={() => setState((s) => ({ ...s, pixelMode: 'skipped', pixelId: null }))}
                >
                  {t('onboardingV2.pixelSkip', "Hozir o'tkazib yuborish — keyin eslatamiz")}
                </BigChoice>
              </div>
              <Button className="w-full rounded-2xl py-5" onClick={() => go(4)} disabled={!state.pixelMode}>
                {t('onboardingV2.continue', 'Davom etish')}
              </Button>
            </div>
          )}

          {/* Step 4 — budget */}
          {state.step === 4 && (
            <div className="space-y-5">
              <h2 className="text-xl font-bold text-text-primary">{t('onboardingV2.budgetTitle', "Kuniga qancha sarflaysiz?")}</h2>
              <p className="text-2xl font-bold tabular-nums text-violet-600 dark:text-violet-400">{formatUzs(state.dailyBudgetUzs)}</p>
              <input
                type="range"
                min={50_000}
                max={500_000}
                step={10_000}
                value={state.dailyBudgetUzs}
                onChange={(e) => setState((s) => ({ ...s, dailyBudgetUzs: Number(e.target.value) }))}
                className="w-full h-3 accent-violet-600 cursor-pointer"
              />
              <div className="flex justify-between text-xs text-text-tertiary">
                <span>50 000</span>
                <span>500 000</span>
              </div>
              <p className="text-sm text-text-secondary rounded-xl bg-surface-2/80 border border-border/60 px-3 py-2">
                {t('onboardingV2.budgetReach', 'Taxminan {n} kishi ko‘radi')
                  .replace('{n}', new Intl.NumberFormat('uz-UZ').format(estimatedReach(state.dailyBudgetUzs)))}
              </p>
              <p className="text-xs text-text-tertiary">{t('onboardingV2.budgetTip', "Boshlash uchun 100 000 so'm tavsiya etiladi.")}</p>
              <Button className="w-full rounded-2xl py-5" onClick={() => go(5)}>
                {t('onboardingV2.continue', 'Davom etish')}
              </Button>
            </div>
          )}

          {/* Step 5 — tayyor */}
          {state.step === 5 && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-text-primary">{t('onboardingV2.doneTitle', 'Tayyor')}</h2>
              <ul className="space-y-3 text-sm">
                <li className="flex items-center gap-2">
                  <Check className="w-5 h-5 text-emerald-500 shrink-0" />
                  {t('onboardingV2.doneProfile', 'Profil sozlamalari saqlandi')}
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-5 h-5 text-emerald-500 shrink-0" />
                  {t('onboardingV2.doneDashboard', 'Dashboard metrikalari tanlovingizga mos')}
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-5 h-5 text-emerald-500 shrink-0" />
                  {t('onboardingV2.doneTg', 'Telegram (ixtiyoriy)')}
                </li>
              </ul>
              <div>
                <label className="text-xs text-text-tertiary block mb-1">Telegram</label>
                <Input
                  value={state.telegram.replace(/^@/, '')}
                  onChange={(e) => setState((s) => ({ ...s, telegram: e.target.value }))}
                  placeholder="username"
                  className="rounded-xl"
                />
              </div>
              <div className="rounded-xl border border-border bg-surface-2/40 p-3 text-xs text-text-secondary space-y-1">
                <div>
                  {t('onboardingV2.summaryBiz', 'Biznes')}: {state.businessType || '—'}
                </div>
                <div>
                  {t('onboardingV2.summaryGoal', 'Maqsad')}: {state.goal || '—'}
                </div>
                <div>
                  Pixel: {state.pixelMode || '—'} {state.pixelId ? `(${state.pixelId})` : ''}
                </div>
                <div>
                  {t('onboardingV2.summaryBudget', 'Kunlik')}: {formatUzs(state.dailyBudgetUzs || 100_000)}
                </div>
              </div>
              {finishError && (
                <p className="text-sm text-red-500 rounded-xl border border-red-200 bg-red-50 px-3 py-2">
                  {finishError}
                </p>
              )}
              <Button className="w-full rounded-2xl py-6 text-lg font-semibold" onClick={() => void finish()} disabled={submitting}>
                {submitting
                  ? t('onboardingV2.saving', 'Saqlanmoqda…')
                  : accessToken
                    ? t('onboardingV2.goDashboard', "Dashboard ga o'tish")
                    : t('onboardingV2.goRegister', "Ro'yxatdan o'tish")}
              </Button>
              {!accessToken && (
                <p className="text-center text-xs text-text-tertiary">
                  {t('onboardingV2.registerNote', 'Keyingi qadam — akkaunt yaratish.')}
                </p>
              )}
            </div>
          )}
        </div>
      </PublicContainer>
      <PublicFooter />
    </div>
  )
}
