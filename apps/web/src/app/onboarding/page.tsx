'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Check, ChevronLeft } from 'lucide-react'
import { PublicContainer, PublicFooter, PublicNavbar } from '@/components/public/PublicLayout'
import { useI18n } from '@/i18n/use-i18n'
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
      aria-pressed={selected}
      className={cn(
        'w-full rounded-2xl px-5 py-4 text-left text-base font-medium tracking-tight transition-all duration-200',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1b2e06]/30 focus-visible:ring-offset-2',
        'active:scale-[0.99]',
        selected
          ? 'bg-[#1b2e06] text-white shadow-[0_8px_24px_-12px_rgba(27,46,6,0.45)] ring-1 ring-inset ring-[#1b2e06]'
          : 'bg-white text-text-primary ring-1 ring-inset ring-[#e6efd9] hover:bg-[#fafdf5] hover:ring-[#cfe8c0] shadow-[0_1px_2px_rgba(27,46,6,0.04)]',
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
    <div className="relative isolate flex min-h-screen flex-col overflow-hidden bg-white">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[420px] bg-[radial-gradient(80%_70%_at_50%_0%,#ecfccb_0%,transparent_60%)]"
      />
      <PublicNavbar />
      <PublicContainer className="flex-1 py-10 md:py-16">
        <div className="mx-auto w-full max-w-lg">
          <div className="rounded-3xl bg-white p-6 ring-1 ring-inset ring-[#e6efd9] shadow-[0_1px_2px_rgba(27,46,6,0.04),0_24px_48px_-24px_rgba(27,46,6,0.18)] md:p-8">
            {/* Progress */}
            <div className="mb-6">
              <div
                className="mb-2 flex justify-between text-[11px] font-semibold uppercase tracking-[0.14em] text-text-tertiary"
                aria-hidden="true"
              >
                <span>
                  {t('onboardingV2.stepOf', '{n}-qadam').replace('{n}', String(state.step + 1))} / {TOTAL}
                </span>
                <span className="tabular-nums">{pct}%</span>
              </div>
              <div
                className="h-1.5 overflow-hidden rounded-full bg-[#eef3e3]"
                role="progressbar"
                aria-valuenow={pct}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={`${t('onboardingV2.stepOf', '{n}-qadam').replace('{n}', String(state.step + 1))} / ${TOTAL}`}
              >
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[#3f6212] via-[#65a30d] to-[#a3e635] transition-[width] duration-300"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>

            <div className="mb-5 flex items-center justify-between gap-2">
              {state.step > 0 ? (
                <button
                  type="button"
                  onClick={back}
                  className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-sm font-medium text-text-secondary transition-colors hover:bg-[#f4f9ea] hover:text-text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1b2e06]"
                >
                  <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                  {t('onboardingV2.back', 'Orqaga')}
                </button>
              ) : (
                <span />
              )}
              {state.step < 5 && (
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={skipAll}
                    className="text-xs text-text-tertiary underline-offset-2 hover:text-text-secondary hover:underline"
                  >
                    {t('onboardingV2.skipAll', "Hammasini o'tkazish")}
                  </button>
                  <button
                    type="button"
                    onClick={skipStep}
                    className="rounded-full px-2.5 py-1 text-sm font-medium text-[#3f6212] hover:bg-[#f4f9ea] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1b2e06]"
                  >
                    {t('onboardingV2.skip', "O'tkazib yuborish")}
                  </button>
                </div>
              )}
            </div>

          {/* Step 0 */}
          {state.step === 0 && (
            <div className="space-y-6 pt-2 text-center">
              <div className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[#1b2e06] text-[#d9f99d] shadow-[0_8px_24px_-12px_rgba(27,46,6,0.45)]">
                <span className="text-lg font-bold">A</span>
              </div>
              <h1 className="text-balance text-2xl font-medium tracking-tight text-text-primary md:text-3xl md:leading-[1.15]">
                {t('onboardingV2.welcomeTitle', "3 daqiqada birinchi kampaniyangizni yoqamiz")}
              </h1>
              <p className="text-pretty text-sm text-text-secondary md:text-base">
                {t('onboardingV2.welcomeSub', '5 qisqa qadam — har biri bitta savol, katta tugmalar.')}
              </p>
              <button
                type="button"
                onClick={() => go(1)}
                className="inline-flex h-12 w-full items-center justify-center rounded-full bg-[#1b2e06] text-base font-medium text-white shadow-[0_1px_2px_rgba(27,46,6,0.18)] transition-all duration-200 hover:bg-[#243a12] hover:shadow-[0_4px_12px_-2px_rgba(27,46,6,0.28)] active:scale-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1b2e06]"
              >
                {t('onboardingV2.start', 'Boshlash')}
              </button>
            </div>
          )}

          {/* Step 1 — biznes */}
          {state.step === 1 && (
            <div className="space-y-4">
              <h2 className="text-xl font-medium tracking-tight text-text-primary md:text-2xl">{t('onboardingV2.whoTitle', 'Siz kimsiz?')}</h2>
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
              <h2 className="text-xl font-medium tracking-tight text-text-primary md:text-2xl">{t('onboardingV2.goalTitle', 'Nima sotmoqchisiz?')}</h2>
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
              <h2 className="text-xl font-medium tracking-tight text-text-primary md:text-2xl">{t('onboardingV2.pixelTitle', 'Meta Pixel')}</h2>
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
              <button
                type="button"
                onClick={() => go(4)}
                disabled={!state.pixelMode}
                className="inline-flex h-11 w-full items-center justify-center rounded-full bg-[#1b2e06] text-sm font-medium text-white shadow-[0_1px_2px_rgba(27,46,6,0.18)] transition-all duration-200 hover:bg-[#243a12] hover:shadow-[0_4px_12px_-2px_rgba(27,46,6,0.28)] active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1b2e06]"
              >
                {t('onboardingV2.continue', 'Davom etish')}
              </button>
            </div>
          )}

          {/* Step 4 — budget */}
          {state.step === 4 && (
            <div className="space-y-5">
              <h2 className="text-xl font-medium tracking-tight text-text-primary md:text-2xl">
                {t('onboardingV2.budgetTitle', "Kuniga qancha sarflaysiz?")}
              </h2>
              <p className="text-3xl font-semibold tabular-nums tracking-tight text-[#3f6212] md:text-4xl">
                {formatUzs(state.dailyBudgetUzs)}
              </p>
              <input
                type="range"
                min={50_000}
                max={500_000}
                step={10_000}
                value={state.dailyBudgetUzs}
                onChange={(e) => setState((s) => ({ ...s, dailyBudgetUzs: Number(e.target.value) }))}
                aria-label={t('onboardingV2.budgetTitle', "Kuniga qancha sarflaysiz?")}
                className="h-2 w-full cursor-pointer accent-[#65a30d]"
              />
              <div className="flex justify-between text-xs text-text-tertiary tabular-nums">
                <span>50 000</span>
                <span>500 000</span>
              </div>
              <p className="rounded-xl bg-[#fafdf5] px-4 py-3 text-sm text-text-secondary ring-1 ring-inset ring-[#eef3e3]">
                {t('onboardingV2.budgetReach', 'Taxminan {n} kishi ko‘radi')
                  .replace('{n}', new Intl.NumberFormat('uz-UZ').format(estimatedReach(state.dailyBudgetUzs)))}
              </p>
              <p className="text-xs text-text-tertiary">{t('onboardingV2.budgetTip', "Boshlash uchun 100 000 so'm tavsiya etiladi.")}</p>
              <button
                type="button"
                onClick={() => go(5)}
                className="inline-flex h-11 w-full items-center justify-center rounded-full bg-[#1b2e06] text-sm font-medium text-white shadow-[0_1px_2px_rgba(27,46,6,0.18)] transition-all duration-200 hover:bg-[#243a12] hover:shadow-[0_4px_12px_-2px_rgba(27,46,6,0.28)] active:scale-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1b2e06]"
              >
                {t('onboardingV2.continue', 'Davom etish')}
              </button>
            </div>
          )}

          {/* Step 5 — tayyor */}
          {state.step === 5 && (
            <div className="space-y-6">
              <h2 className="text-xl font-medium tracking-tight text-text-primary md:text-2xl">
                {t('onboardingV2.doneTitle', 'Tayyor')}
              </h2>
              <ul className="space-y-2.5 text-sm text-text-secondary">
                {[
                  t('onboardingV2.doneProfile', 'Profil sozlamalari saqlandi'),
                  t('onboardingV2.doneDashboard', 'Dashboard metrikalari tanlovingizga mos'),
                  t('onboardingV2.doneTg', 'Telegram (ixtiyoriy)'),
                ].map((line) => (
                  <li key={line} className="flex items-center gap-2.5">
                    <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#ecfccb] text-[#3f6212]">
                      <Check className="h-3 w-3" aria-hidden="true" />
                    </span>
                    {line}
                  </li>
                ))}
              </ul>
              <div>
                <label className="mb-1 block text-xs text-text-tertiary">Telegram</label>
                <Input
                  value={state.telegram.replace(/^@/, '')}
                  onChange={(e) => setState((s) => ({ ...s, telegram: e.target.value }))}
                  placeholder="username"
                  className="rounded-xl"
                />
              </div>
              <dl className="space-y-1.5 rounded-xl bg-[#fafdf5] p-4 text-xs text-text-secondary ring-1 ring-inset ring-[#eef3e3]">
                {[
                  [t('onboardingV2.summaryBiz', 'Biznes'), state.businessType || '—'],
                  [t('onboardingV2.summaryGoal', 'Maqsad'), state.goal || '—'],
                  ['Pixel', `${state.pixelMode || '—'} ${state.pixelId ? `(${state.pixelId})` : ''}`.trim()],
                  [t('onboardingV2.summaryBudget', 'Kunlik'), formatUzs(state.dailyBudgetUzs || 100_000)],
                ].map(([label, value]) => (
                  <div key={label} className="flex justify-between gap-3">
                    <dt className="text-text-tertiary">{label}</dt>
                    <dd className="font-medium text-text-primary">{value}</dd>
                  </div>
                ))}
              </dl>
              {finishError && (
                <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-600 ring-1 ring-inset ring-red-200">
                  {finishError}
                </p>
              )}
              <button
                type="button"
                onClick={() => void finish()}
                disabled={submitting}
                className="inline-flex h-12 w-full items-center justify-center rounded-full bg-[#1b2e06] text-base font-medium text-white shadow-[0_1px_2px_rgba(27,46,6,0.18)] transition-all duration-200 hover:bg-[#243a12] hover:shadow-[0_4px_12px_-2px_rgba(27,46,6,0.28)] active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1b2e06]"
              >
                {submitting
                  ? t('onboardingV2.saving', 'Saqlanmoqda…')
                  : accessToken
                    ? t('onboardingV2.goDashboard', "Dashboard ga o'tish")
                    : t('onboardingV2.goRegister', "Ro'yxatdan o'tish")}
              </button>
              {!accessToken && (
                <p className="text-center text-xs text-text-tertiary">
                  {t('onboardingV2.registerNote', 'Keyingi qadam — akkaunt yaratish.')}
                </p>
              )}
            </div>
          )}
          </div>
        </div>
      </PublicContainer>
      <PublicFooter />
    </div>
  )
}
