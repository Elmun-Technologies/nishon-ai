'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowRight, ChevronLeft } from 'lucide-react'
import { Input } from '@/components/ui'
import { useWorkspaceStore } from '@/stores/workspace.store'
import { getAccessToken } from '@/lib/auth-storage'
import type { ChannelKey } from '@/lib/pre-auth-onboarding'
import { AllocationCards, AllocationOverview } from './_components/AllocationCards'
import { BudgetInput } from './_components/BudgetInput'
import { BotMessage, TypingIndicator, UserReply } from './_components/ChatBubble'
import { ChatShell, MessageGroup } from './_components/ChatShell'
import { ChoiceCard, QuickReplies } from './_components/QuickReplies'
import {
  allocateBudget,
  formatUzs,
  formatUzsFull,
} from './_lib/budget-allocator'
import {
  clearState,
  finalizeForLoggedIn,
  finalizeForRegister,
  loadState,
  saveState,
} from './_lib/persistence'
import {
  CHANNEL_LABELS,
  CJM_LABELS,
  DEFAULT_STATE,
  STAGE_IDS,
  VERTICAL_LABELS,
  type BusinessVertical,
  type CjmStage,
  type ConversationalOnboardingState,
  type CustomerAge,
  type GeoRegion,
} from './_lib/types'

export default function OnboardingPage() {
  const router = useRouter()
  const accessToken = useWorkspaceStore((s) => s.accessToken)
  const setCurrentWorkspace = useWorkspaceStore((s) => s.setCurrentWorkspace)

  const [state, setState] = useState<ConversationalOnboardingState>(DEFAULT_STATE)
  const [hydrated, setHydrated] = useState(false)
  const [showTyping, setShowTyping] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [finishError, setFinishError] = useState('')

  useEffect(() => {
    setState(loadState())
    setHydrated(true)
  }, [])

  useEffect(() => {
    if (hydrated) saveState(state)
  }, [state, hydrated])

  const totalStages = STAGE_IDS.length
  const progressPercent = (state.stage / (totalStages - 1)) * 100

  const setStage = useCallback((next: number) => {
    setShowTyping(true)
    setTimeout(() => {
      setShowTyping(false)
      setState((s) => ({ ...s, stage: Math.max(0, Math.min(totalStages - 1, next)) }))
    }, 350)
  }, [totalStages])

  const back = useCallback(() => {
    if (state.stage > 0) setState((s) => ({ ...s, stage: s.stage - 1 }))
  }, [state.stage])

  const handleVerticalPick = (v: BusinessVertical) => {
    setState((s) => ({ ...s, vertical: v }))
    setStage(3)
  }

  const handleCjmPick = (c: CjmStage) => {
    setState((s) => ({ ...s, cjm: c }))
    setStage(4)
  }

  const toggleGeo = (g: GeoRegion) => {
    setState((s) => ({
      ...s,
      geos: s.geos.includes(g) ? s.geos.filter((x) => x !== g) : [...s.geos, g],
    }))
  }

  const toggleAge = (a: CustomerAge) => {
    setState((s) => ({
      ...s,
      ageRanges: s.ageRanges.includes(a)
        ? s.ageRanges.filter((x) => x !== a)
        : [...s.ageRanges, a],
    }))
  }

  const toggleTouchpoint = (t: ChannelKey) => {
    setState((s) => ({
      ...s,
      touchpoints: s.touchpoints.includes(t)
        ? s.touchpoints.filter((x) => x !== t)
        : [...s.touchpoints, t],
    }))
  }

  /** Computed budget allocation (recomputes when inputs change). */
  const allocationResult = useMemo(() => {
    if (!state.cjm || !state.vertical) return null
    return allocateBudget({
      cjm: state.cjm,
      vertical: state.vertical,
      touchpoints: state.touchpoints,
      monthlyBudgetUzs: state.monthlyBudgetUzs,
    })
  }, [state.cjm, state.vertical, state.touchpoints, state.monthlyBudgetUzs])

  const handleFinish = useCallback(async () => {
    setSubmitting(true)
    setFinishError('')

    // Lock in the AI allocation if user hasn't customized it.
    if (allocationResult) {
      setState((s) => ({ ...s, allocation: allocationResult.percent, allocationApproved: true }))
    }

    const ready = { ...state, allocation: allocationResult?.percent ?? {}, allocationApproved: true }

    try {
      if (accessToken) {
        const headers: Record<string, string> = { 'Content-Type': 'application/json' }
        const tok = getAccessToken()
        if (tok) headers.Authorization = `Bearer ${tok}`
        const res = await fetch('/api/onboarding/complete', {
          method: 'POST',
          headers,
          credentials: 'include',
          body: JSON.stringify({
            businessType: mapVerticalToBusinessType(ready.vertical || 'other'),
            goal: mapCjmToGoal(ready.cjm || 'conversion'),
            pixelId: null,
            pixelMode: 'skipped',
            dailyBudget: Math.round(ready.monthlyBudgetUzs / 30),
            telegram: ready.telegram,
            // Rich strategy so the Ad Launcher can prefill AI-suggested defaults.
            cjm: ready.cjm || undefined,
            vertical: ready.vertical || undefined,
            geos: ready.geos,
            ageRanges: ready.ageRanges,
            monthlyBudgetUzs: ready.monthlyBudgetUzs,
            allocation: ready.allocation,
          }),
        })
        if (res.ok) {
          const data = (await res.json().catch(() => ({}))) as { workspace?: any }
          if (data.workspace) setCurrentWorkspace(data.workspace)
        }
        finalizeForLoggedIn()
        router.push('/dashboard')
      } else {
        finalizeForRegister(ready)
        router.push('/register')
      }
    } catch (e: unknown) {
      setFinishError(
        e instanceof Error ? e.message : "Xatolik yuz berdi. Qayta urinib ko'ring.",
      )
      setSubmitting(false)
    }
  }, [accessToken, allocationResult, router, setCurrentWorkspace, state])

  if (!hydrated) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-text-secondary">
        Yuklanmoqda…
      </div>
    )
  }

  return (
    <div className="relative isolate min-h-screen bg-white pb-6">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[420px] bg-[radial-gradient(80%_70%_at_50%_0%,#ecfccb_0%,transparent_60%)]"
      />
      <header className="flex items-center justify-between px-4 py-3 md:px-6">
        <button
          type="button"
          onClick={() => {
            if (confirm("Onboarding'ni qaytadan boshlamoqchimisiz?")) {
              clearState()
              setState(DEFAULT_STATE)
            }
          }}
          className="text-xs text-text-tertiary underline-offset-2 hover:text-text-secondary hover:underline"
        >
          Qaytadan boshlash
        </button>
        {state.stage > 0 && (
          <button
            type="button"
            onClick={back}
            className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-sm font-medium text-text-secondary transition-colors hover:bg-[#f4f9ea] hover:text-text-primary"
          >
            <ChevronLeft className="h-4 w-4" aria-hidden />
            Orqaga
          </button>
        )}
      </header>

      <ChatShell progressPercent={progressPercent}>
        {/* Stage 0: Greeting */}
        {state.stage >= 0 && (
          <MessageGroup>
            <BotMessage>
              <p className="font-semibold">Salom! 👋</p>
              <p className="mt-1">
                Men Nishon AI — sizning reklama maslahatchingiz. Bir necha savolda sizga
                eng to'g'ri reklama strategiyasini tuzib beraman:
              </p>
              <ul className="mt-2 ml-4 list-disc text-sm text-text-secondary">
                <li>Maqsadingizni aniqlaymiz (CJM)</li>
                <li>Mijozlaringizni topamiz</li>
                <li>Byudjetni kanallar bo'yicha taqsimlaymiz</li>
              </ul>
            </BotMessage>
            {state.stage === 0 && (
              <div className="pl-10">
                <button
                  type="button"
                  onClick={() => setStage(1)}
                  className="inline-flex items-center gap-2 rounded-full bg-[#1b2e06] px-5 py-3 text-sm font-semibold text-white shadow-[0_8px_24px_-12px_rgba(27,46,6,0.5)] transition-all hover:bg-[#243a12] active:scale-[0.98]"
                >
                  Boshlash
                  <ArrowRight className="h-4 w-4" aria-hidden />
                </button>
              </div>
            )}
          </MessageGroup>
        )}

        {/* Stage 1: Business Name */}
        {state.stage >= 1 && (
          <MessageGroup>
            <BotMessage>
              Birinchi savol — <strong>biznesingiz nomi</strong> qanday? (Ixtiyoriy)
            </BotMessage>
            {state.businessName && state.stage > 1 && (
              <UserReply>{state.businessName}</UserReply>
            )}
            {state.stage === 1 && (
              <div className="pl-10 pt-1">
                <Input
                  value={state.businessName}
                  onChange={(e) => setState((s) => ({ ...s, businessName: e.target.value }))}
                  placeholder="Masalan: Asaxiy Shop, English Tutor, Cafe Bismi…"
                  className="rounded-2xl"
                />
                <div className="mt-3 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setStage(2)}
                    className="rounded-full bg-[#1b2e06] px-5 py-2.5 text-sm font-semibold text-white shadow-[0_8px_24px_-12px_rgba(27,46,6,0.5)] transition-all hover:bg-[#243a12] active:scale-[0.98]"
                  >
                    Davom etish
                  </button>
                  <button
                    type="button"
                    onClick={() => setStage(2)}
                    className="rounded-full px-4 py-2.5 text-sm text-text-tertiary hover:text-text-secondary"
                  >
                    O'tkazib yuborish
                  </button>
                </div>
              </div>
            )}
          </MessageGroup>
        )}

        {/* Stage 2: Business Vertical */}
        {state.stage >= 2 && (
          <MessageGroup>
            <BotMessage>Biznesingiz qaysi yo'nalishda?</BotMessage>
            {state.vertical && state.stage > 2 && (
              <UserReply>
                {VERTICAL_LABELS[state.vertical].emoji}{' '}
                {VERTICAL_LABELS[state.vertical].title}
              </UserReply>
            )}
            {state.stage === 2 && (
              <div className="space-y-2 pl-10 pt-1">
                {(Object.keys(VERTICAL_LABELS) as BusinessVertical[]).map((v) => (
                  <ChoiceCard
                    key={v}
                    option={{
                      id: v,
                      label: VERTICAL_LABELS[v].title,
                      emoji: VERTICAL_LABELS[v].emoji,
                    }}
                    selected={state.vertical === v}
                    onClick={() => handleVerticalPick(v)}
                  />
                ))}
              </div>
            )}
          </MessageGroup>
        )}

        {/* Stage 3: CJM Goal */}
        {state.stage >= 3 && (
          <MessageGroup>
            <BotMessage>
              <p>
                Reklamadan <strong>asosiy maqsadingiz</strong> nima?
              </p>
              <p className="mt-1 text-xs text-text-tertiary">
                Bu CJM bosqichi — mijoz yo'lining qaysi qismini optimizatsiya qilamiz
              </p>
            </BotMessage>
            {state.cjm && state.stage > 3 && (
              <UserReply>
                {CJM_LABELS[state.cjm].emoji} {CJM_LABELS[state.cjm].title}
              </UserReply>
            )}
            {state.stage === 3 && (
              <div className="space-y-2 pl-10 pt-1">
                {(Object.keys(CJM_LABELS) as CjmStage[]).map((c) => (
                  <ChoiceCard
                    key={c}
                    option={{
                      id: c,
                      label: CJM_LABELS[c].title,
                      emoji: CJM_LABELS[c].emoji,
                      description: CJM_LABELS[c].desc,
                    }}
                    selected={state.cjm === c}
                    onClick={() => handleCjmPick(c)}
                  />
                ))}
              </div>
            )}
          </MessageGroup>
        )}

        {/* Stage 4: Geo + Age */}
        {state.stage >= 4 && (
          <MessageGroup>
            <BotMessage>
              Mijozlaringiz <strong>qayerda</strong> va <strong>qanday yoshda</strong>?
            </BotMessage>
            {state.stage > 4 && (
              <UserReply>
                {state.geos.join(', ')}
                {state.ageRanges.length > 0 ? ` · ${state.ageRanges.join(', ')}` : ''}
              </UserReply>
            )}
            {state.stage === 4 && (
              <div className="space-y-4 pl-10 pt-1">
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-text-tertiary">
                    📍 Geografiya (bir nechta tanlash mumkin)
                  </p>
                  <QuickReplies
                    options={[
                      { id: 'UZ', label: 'O\'zbekiston' },
                      { id: 'KZ', label: 'Qozog\'iston' },
                      { id: 'RU', label: 'Rossiya' },
                      { id: 'KG', label: "Qirg'iziston" },
                      { id: 'TJ', label: 'Tojikiston' },
                      { id: 'OTHER', label: 'Boshqa' },
                    ]}
                    selected={state.geos}
                    onSelect={toggleGeo}
                    multi
                  />
                </div>
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-text-tertiary">
                    🎂 Yosh oraliqlari
                  </p>
                  <QuickReplies
                    options={[
                      { id: '18-24', label: '18–24' },
                      { id: '25-34', label: '25–34' },
                      { id: '35-44', label: '35–44' },
                      { id: '45-54', label: '45–54' },
                      { id: '55+', label: '55+' },
                    ]}
                    selected={state.ageRanges}
                    onSelect={toggleAge}
                    multi
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setStage(5)}
                  disabled={state.geos.length === 0}
                  className="rounded-full bg-[#1b2e06] px-5 py-2.5 text-sm font-semibold text-white shadow-[0_8px_24px_-12px_rgba(27,46,6,0.5)] transition-all hover:bg-[#243a12] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Davom etish
                </button>
              </div>
            )}
          </MessageGroup>
        )}

        {/* Stage 5: Touchpoints */}
        {state.stage >= 5 && (
          <MessageGroup>
            <BotMessage>
              <p>Mijozlaringiz vaqtini <strong>qayerda</strong> o'tkazadi?</p>
              <p className="mt-1 text-xs text-text-tertiary">
                Bilmasangiz o'tkazib yuboring — AI o'zi tahlil qiladi
              </p>
            </BotMessage>
            {state.stage > 5 && state.touchpoints.length > 0 && (
              <UserReply>
                {state.touchpoints.map((t) => CHANNEL_LABELS[t].title).join(', ')}
              </UserReply>
            )}
            {state.stage > 5 && state.touchpoints.length === 0 && (
              <UserReply>O'tkazib yuborildi (AI tanlasin)</UserReply>
            )}
            {state.stage === 5 && (
              <div className="space-y-3 pl-10 pt-1">
                <QuickReplies
                  options={(Object.keys(CHANNEL_LABELS) as ChannelKey[]).map((k) => ({
                    id: k,
                    label: CHANNEL_LABELS[k].title,
                    emoji: CHANNEL_LABELS[k].emoji,
                  }))}
                  selected={state.touchpoints}
                  onSelect={toggleTouchpoint}
                  multi
                />
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setStage(6)}
                    className="rounded-full bg-[#1b2e06] px-5 py-2.5 text-sm font-semibold text-white shadow-[0_8px_24px_-12px_rgba(27,46,6,0.5)] transition-all hover:bg-[#243a12] active:scale-[0.98]"
                  >
                    Davom etish
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setState((s) => ({ ...s, touchpoints: [] }))
                      setStage(6)
                    }}
                    className="rounded-full px-4 py-2.5 text-sm text-text-tertiary hover:text-text-secondary"
                  >
                    O'tkazib yuborish
                  </button>
                </div>
              </div>
            )}
          </MessageGroup>
        )}

        {/* Stage 6: Budget */}
        {state.stage >= 6 && (
          <MessageGroup>
            <BotMessage>
              Endi eng asosiy — <strong>oylik reklama byudjetingiz</strong> qancha?
            </BotMessage>
            {state.stage > 6 && (
              <UserReply>{formatUzs(state.monthlyBudgetUzs)}/oy</UserReply>
            )}
            {state.stage === 6 && (
              <div className="space-y-3 pl-10 pt-1">
                <BudgetInput
                  valueUzs={state.monthlyBudgetUzs}
                  onChange={(n) => setState((s) => ({ ...s, monthlyBudgetUzs: n }))}
                  estimatedReach={
                    allocationResult ? allocationResult.totalReach : Math.round(state.monthlyBudgetUzs / 15)
                  }
                />
                <button
                  type="button"
                  onClick={() => setStage(7)}
                  className="rounded-full bg-[#1b2e06] px-5 py-2.5 text-sm font-semibold text-white shadow-[0_8px_24px_-12px_rgba(27,46,6,0.5)] transition-all hover:bg-[#243a12] active:scale-[0.98]"
                >
                  Taqsimlashni ko'rsatish
                </button>
              </div>
            )}
          </MessageGroup>
        )}

        {/* Stage 7: AI Allocation — the magic step */}
        {state.stage >= 7 && allocationResult && (
          <MessageGroup>
            <BotMessage>
              <p>
                Ajoyib! Sizning <strong>{formatUzsFull(state.monthlyBudgetUzs)}</strong>{' '}
                oylik byudjetingizni{' '}
                <strong>{state.cjm ? CJM_LABELS[state.cjm].title.toLowerCase() : ''}</strong>{' '}
                maqsadi uchun shunday taqsimlash tavsiya etiladi:
              </p>
            </BotMessage>
            {state.stage === 7 && (
              <div className="space-y-4 pl-10 pt-1">
                <div className="rounded-2xl bg-white p-4 ring-1 ring-inset ring-[#e6efd9] shadow-[0_1px_3px_rgba(27,46,6,0.05)]">
                  <AllocationOverview result={allocationResult} />
                </div>
                {state.cjm && (
                  <AllocationCards result={allocationResult} cjm={state.cjm} />
                )}
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setStage(8)}
                    className="rounded-full bg-[#1b2e06] px-5 py-3 text-sm font-semibold text-white shadow-[0_8px_24px_-12px_rgba(27,46,6,0.5)] transition-all hover:bg-[#243a12] active:scale-[0.98]"
                  >
                    Roziman, davom
                  </button>
                  <button
                    type="button"
                    onClick={() => setStage(6)}
                    className="rounded-full px-4 py-3 text-sm text-text-tertiary hover:text-text-secondary"
                  >
                    Byudjet'ni o'zgartirish
                  </button>
                </div>
              </div>
            )}
            {state.stage > 7 && (
              <UserReply>Roziman ✓</UserReply>
            )}
          </MessageGroup>
        )}

        {/* Stage 8: Connect / Finish */}
        {state.stage >= 8 && allocationResult && (
          <MessageGroup>
            <BotMessage>
              <p>Tayyor! Quyidagilar saqlandi:</p>
              <ul className="mt-2 space-y-1 text-sm">
                <li>✓ Biznes profili</li>
                <li>✓ Maqsad: {state.cjm ? CJM_LABELS[state.cjm].title : ''}</li>
                <li>✓ Oylik byudjet: {formatUzsFull(state.monthlyBudgetUzs)}</li>
                <li>✓ Kanal taqsimoti tayyor</li>
              </ul>
              <p className="mt-2 text-xs text-text-tertiary">
                Dashboard'da reklama hisoblaringizni ulashingiz mumkin (Meta, Google, va h.k.)
              </p>
            </BotMessage>
            <div className="space-y-3 pl-10 pt-1">
              <div className="rounded-2xl bg-white p-4 ring-1 ring-inset ring-[#e6efd9]">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-text-tertiary">
                  Telegram bildirishnomalari (ixtiyoriy)
                </p>
                <Input
                  value={state.telegram.replace(/^@/, '')}
                  onChange={(e) => setState((s) => ({ ...s, telegram: e.target.value }))}
                  placeholder="username"
                  className="rounded-xl"
                />
              </div>
              {finishError && (
                <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-600 ring-1 ring-inset ring-red-200">
                  {finishError}
                </p>
              )}
              <button
                type="button"
                onClick={() => void handleFinish()}
                disabled={submitting}
                className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-[#1b2e06] text-base font-semibold text-white shadow-[0_8px_24px_-12px_rgba(27,46,6,0.5)] transition-all hover:bg-[#243a12] active:scale-[0.98] disabled:opacity-50"
              >
                {submitting
                  ? 'Saqlanmoqda…'
                  : accessToken
                    ? 'Dashboard ga o\'tish'
                    : "Ro'yxatdan o'tish"}
                <ArrowRight className="h-4 w-4" aria-hidden />
              </button>
            </div>
          </MessageGroup>
        )}

        {showTyping && <TypingIndicator />}
      </ChatShell>
    </div>
  )
}

function mapVerticalToBusinessType(v: BusinessVertical | ''): string {
  switch (v) {
    case 'ecommerce':
      return 'shop'
    case 'local':
      return 'restaurant'
    case 'education':
      return 'course'
    case 'service':
      return 'service'
    case 'realestate':
      return 'service'
    default:
      return 'other'
  }
}

function mapCjmToGoal(c: CjmStage | ''): string {
  switch (c) {
    case 'awareness':
      return 'awareness'
    case 'consideration':
      return 'leads'
    case 'conversion':
    case 'retention':
      return 'sales'
    default:
      return 'sales'
  }
}
