'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  ImagePlus,
  Rocket,
  Sparkles,
  X,
} from 'lucide-react'
import { aiAgent, launchOrchestrator, platforms, reve } from '@/lib/api-client'
import { useWorkspaceStore } from '@/stores/workspace.store'
import { FocusGroupTester } from '@/components/creative/FocusGroupTester'
import { cn } from '@/lib/utils'

type Proposal = {
  name: string
  objective: string
  countries: string[]
  ageMin: number
  ageMax: number
  dailyBudgetUsd: number
  headline: string
  primaryText: string
  cta: string
  rationale: string
}

const OBJECTIVES = [
  'awareness',
  'traffic',
  'engagement',
  'leads',
  'app_promotion',
  'sales',
]
const CTAS = ['LEARN_MORE', 'SHOP_NOW', 'SIGN_UP', 'CONTACT_US', 'GET_OFFER']

/** Strip the `data:...;base64,` prefix — the API wants raw base64. */
function fileToBase64(file: File): Promise<{ base64: string; mimeType: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = String(reader.result || '')
      const comma = result.indexOf(',')
      resolve({
        base64: comma >= 0 ? result.slice(comma + 1) : result,
        mimeType: file.type || 'image/jpeg',
      })
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

/**
 * Chat-first launch — the "No-Dashboard" path (Vaqt). The owner describes the
 * campaign in one sentence (+ optional product photo); the agent proposes a full
 * Meta plan seeded from onboarding. Everything stays editable (Ishonch), and the
 * confirm goes through the SAME real launch-orchestrator as the full wizard — no
 * fake launches.
 */
export default function ChatLaunchPage() {
  const { currentWorkspace } = useWorkspaceStore()
  const fileRef = useRef<HTMLInputElement>(null)

  const [brief, setBrief] = useState('')
  const [image, setImage] = useState<{ base64: string; mimeType: string; preview: string } | null>(
    null,
  )
  const [planning, setPlanning] = useState(false)
  const [planError, setPlanError] = useState('')
  const [proposal, setProposal] = useState<Proposal | null>(null)

  const [pages, setPages] = useState<Array<{ id: string; name: string }>>([])
  const [pageId, setPageId] = useState('')
  const [linkUrl, setLinkUrl] = useState('')

  // Reve-generated ad image → becomes the Meta creative picture (link_data.picture).
  const [adImageUrl, setAdImageUrl] = useState('')
  const [genLoading, setGenLoading] = useState(false)
  const [genError, setGenError] = useState('')

  const [launching, setLaunching] = useState(false)
  const [launchError, setLaunchError] = useState('')
  const [launchedId, setLaunchedId] = useState<string | null>(null)

  useEffect(() => {
    if (!currentWorkspace?.id) return
    let cancelled = false
    platforms
      .getMetaPages(currentWorkspace.id)
      .then((res) => {
        if (cancelled) return
        const list = (res.data ?? []).map((p) => ({ id: p.id, name: p.name }))
        setPages(list)
        if (list.length > 0) setPageId((prev) => prev || list[0].id)
      })
      .catch(() => {
        /* No Meta connected yet — the plan still works, ad stays empty. */
      })
    return () => {
      cancelled = true
    }
  }, [currentWorkspace?.id])

  const pickImage = async (file?: File | null) => {
    if (!file) return
    const { base64, mimeType } = await fileToBase64(file)
    setImage({ base64, mimeType, preview: URL.createObjectURL(file) })
  }

  const runPlan = async () => {
    if (brief.trim().length < 3) return
    setPlanning(true)
    setPlanError('')
    setLaunchedId(null)
    setLaunchError('')
    try {
      const res = await aiAgent.planCampaign({
        workspaceId: currentWorkspace?.id ?? '',
        brief: brief.trim(),
        imageBase64: image?.base64,
        mimeType: image?.mimeType,
      })
      setProposal(res.data)
    } catch (err: any) {
      const status = err?.response?.status
      setPlanError(
        status === 503
          ? 'AI hali sozlanmagan — administrator serverda kalitni qo\'shsin.'
          : err?.response?.data?.message ||
              err?.message ||
              'Reja tuzilmadi. Qayta urinib ko\'ring.',
      )
    } finally {
      setPlanning(false)
    }
  }

  const setField = <K extends keyof Proposal>(key: K, value: Proposal[K]) =>
    setProposal((p) => (p ? { ...p, [key]: value } : p))

  /**
   * Generate an ad image with Reve and use it as the Meta creative picture.
   * The returned fal.ai URL is public, so it flows straight into the launch as
   * `creative.imageUrl` (no upload). Honest 503 when FAL_KEY is unset.
   */
  const generateAdImage = async () => {
    if (!proposal) return
    setGenLoading(true)
    setGenError('')
    try {
      const prompt = [proposal.headline, proposal.primaryText, brief]
        .map((s) => s?.trim())
        .filter(Boolean)
        .join('. ')
        .slice(0, 500)
      const res = await reve.generateImageAd({
        prompt: prompt || 'Product advertisement, clean studio background',
        aspectRatio: '1:1',
        numImages: 1,
      })
      const url = res.data.images?.[0]
      if (!url) {
        setGenError('Rasm qaytmadi — qayta urinib ko\'ring.')
        return
      }
      setAdImageUrl(url)
    } catch (err: any) {
      const status = err?.response?.status
      setGenError(
        status === 503
          ? 'Rasm generatsiyasi sozlanmagan (FAL_KEY yo\'q) — matnli reklama bilan davom etishingiz mumkin.'
          : err?.response?.data?.message ||
              err?.message ||
              'Rasm yaratilmadi. Qayta urinib ko\'ring.',
      )
    } finally {
      setGenLoading(false)
    }
  }

  const confirmLaunch = async () => {
    if (!proposal || !currentWorkspace?.id) return
    // Pre-submit guards — mirror the backend normaliser so the user gets an
    // immediate, clear message instead of a late, opaque Meta rejection.
    if (proposal.countries.length === 0) {
      setLaunchError('Kamida bitta davlat tanlang.')
      return
    }
    if (proposal.ageMin >= proposal.ageMax) {
      setLaunchError('Yosh (min) yosh (max) dan kichik bo\'lishi kerak.')
      return
    }
    setLaunching(true)
    setLaunchError('')
    setLaunchedId(null)
    try {
      const creative =
        pageId && linkUrl.trim()
          ? {
              pageId,
              message: proposal.primaryText || proposal.headline,
              linkUrl: linkUrl.trim(),
              headline: proposal.headline || undefined,
              callToActionType: proposal.cta as any,
              imageUrl: adImageUrl || undefined,
            }
          : undefined

      const draft = await launchOrchestrator.draft({
        workspaceId: currentWorkspace.id,
        platform: 'meta',
        objective: proposal.objective,
        budgetType: 'CBO',
        dailyBudget: proposal.dailyBudgetUsd,
        audiences: [
          {
            name: proposal.name || 'Asosiy auditoriya',
            funnelStage: 'acquisition_prospecting',
          },
        ],
        targeting: {
          countries: proposal.countries,
          ageMin: proposal.ageMin,
          ageMax: proposal.ageMax,
        },
        creative,
      })
      const jobId = draft.data.id
      const validated = await launchOrchestrator.validate(jobId)
      if (validated.data.status === 'failed') {
        setLaunchError(validated.data.error || 'Reja tekshiruvdan o\'tmadi.')
        return
      }
      const launched = await launchOrchestrator.launch(jobId)
      if (launched.data.status === 'failed') {
        setLaunchError(launched.data.error || 'Ishga tushirishda xato.')
        return
      }
      const campaignId =
        (launched.data.payload?.launchResult as any)?.campaignId ?? launched.data.id
      setLaunchedId(String(campaignId))
    } catch (err: any) {
      setLaunchError(
        err?.response?.data?.message ||
          err?.message ||
          'Ishga tushirishda xato. Qayta urinib ko\'ring.',
      )
    } finally {
      setLaunching(false)
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-bold text-text-primary">
            <Sparkles className="h-5 w-5 text-brand-mid dark:text-brand-lime" aria-hidden />
            Suhbat orqali ishga tushirish
          </h1>
          <p className="mt-1 text-sm text-text-secondary">
            Bir jumlada tasvirlab bering — AI to&apos;liq Meta rejasini tayyorlaydi. Hammasi
            tahrirlanadi, tasdiqlaganingizda haqiqiy kampaniya ishga tushadi.
          </p>
        </div>
        <Link
          href="/launch"
          className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs font-medium text-text-secondary transition-colors hover:bg-surface-2/60"
        >
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
          To&apos;liq sehrgar
        </Link>
      </div>

      {/* ── Brief input ─────────────────────────────────────────────── */}
      <div className="rounded-2xl border border-border/70 bg-surface p-5 shadow-sm dark:bg-surface-elevated/70">
        <textarea
          value={brief}
          onChange={(e) => setBrief(e.target.value)}
          placeholder="Masalan: Toshkentda qishki krossovka sotaman, kuniga $10, 18-35 yosh, xaridni ko'paytirish kerak."
          rows={3}
          className="w-full resize-none rounded-xl border border-border bg-surface-2/60 px-3 py-2.5 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-brand-mid/25"
        />

        <div className="mt-3 flex flex-wrap items-center gap-3">
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => pickImage(e.target.files?.[0])}
          />
          {image ? (
            <div className="flex items-center gap-2 rounded-lg border border-border bg-surface-2/40 px-2 py-1.5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={image.preview} alt="" className="h-8 w-8 rounded object-cover" />
              <span className="text-xs text-text-secondary">Mahsulot rasmi</span>
              <button
                type="button"
                onClick={() => setImage(null)}
                className="text-text-tertiary hover:text-rose-500"
                aria-label="Rasmni olib tashlash"
              >
                <X className="h-3.5 w-3.5" aria-hidden />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs font-medium text-text-secondary transition-colors hover:bg-surface-2/60"
            >
              <ImagePlus className="h-3.5 w-3.5" aria-hidden />
              Rasm (ixtiyoriy)
            </button>
          )}

          <button
            type="button"
            onClick={runPlan}
            disabled={planning || brief.trim().length < 3}
            className="ml-auto inline-flex items-center gap-2 rounded-xl bg-brand-ink px-4 py-2.5 text-sm font-semibold text-brand-lime disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Sparkles className={cn('h-4 w-4', planning && 'animate-pulse')} aria-hidden />
            {planning ? 'Reja tuzilmoqda…' : 'Reja tuz'}
          </button>
        </div>

        {planError && (
          <p className="mt-3 rounded-xl border border-amber-400/40 bg-amber-400/10 p-3 text-sm text-amber-700 dark:text-amber-300">
            {planError}
          </p>
        )}
      </div>

      {/* ── Editable proposal ───────────────────────────────────────── */}
      {proposal && (
        <div className="space-y-5 rounded-2xl border border-border/70 bg-surface p-5 shadow-sm dark:bg-surface-elevated/70">
          <div className="flex items-start gap-2">
            <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-brand-mid dark:text-brand-lime" aria-hidden />
            <p className="text-sm text-text-secondary">{proposal.rationale}</p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-1.5 text-sm">
              <span className="font-medium text-text-secondary">Kampaniya nomi</span>
              <input
                value={proposal.name}
                onChange={(e) => setField('name', e.target.value)}
                className="w-full rounded-lg border border-border bg-surface-2/60 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-mid/25"
              />
            </label>
            <label className="space-y-1.5 text-sm">
              <span className="font-medium text-text-secondary">Maqsad</span>
              <select
                value={proposal.objective}
                onChange={(e) => setField('objective', e.target.value)}
                className="w-full rounded-lg border border-border bg-surface-2/60 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-mid/25"
              >
                {OBJECTIVES.map((o) => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-1.5 text-sm">
              <span className="font-medium text-text-secondary">Davlatlar (ISO-2, vergul bilan)</span>
              <input
                value={proposal.countries.join(', ')}
                onChange={(e) =>
                  setField(
                    'countries',
                    e.target.value
                      .split(',')
                      .map((c) => c.trim().toUpperCase())
                      .filter(Boolean),
                  )
                }
                className="w-full rounded-lg border border-border bg-surface-2/60 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-mid/25"
              />
            </label>
            <label className="space-y-1.5 text-sm">
              <span className="font-medium text-text-secondary">Kunlik byudjet ($)</span>
              <input
                type="number"
                min={1}
                value={proposal.dailyBudgetUsd}
                onChange={(e) =>
                  setField('dailyBudgetUsd', Math.max(1, Number(e.target.value) || 1))
                }
                className="w-full rounded-lg border border-border bg-surface-2/60 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-mid/25"
              />
            </label>
            <label className="space-y-1.5 text-sm">
              <span className="font-medium text-text-secondary">Yosh (min)</span>
              <input
                type="number"
                min={13}
                max={65}
                value={proposal.ageMin}
                onChange={(e) => setField('ageMin', Number(e.target.value) || 18)}
                className="w-full rounded-lg border border-border bg-surface-2/60 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-mid/25"
              />
            </label>
            <label className="space-y-1.5 text-sm">
              <span className="font-medium text-text-secondary">Yosh (max)</span>
              <input
                type="number"
                min={13}
                max={65}
                value={proposal.ageMax}
                onChange={(e) => setField('ageMax', Number(e.target.value) || 45)}
                className="w-full rounded-lg border border-border bg-surface-2/60 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-mid/25"
              />
            </label>
          </div>

          <label className="block space-y-1.5 text-sm">
            <span className="font-medium text-text-secondary">Sarlavha</span>
            <input
              value={proposal.headline}
              onChange={(e) => setField('headline', e.target.value)}
              className="w-full rounded-lg border border-border bg-surface-2/60 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-mid/25"
            />
          </label>
          <label className="block space-y-1.5 text-sm">
            <span className="font-medium text-text-secondary">Reklama matni</span>
            <textarea
              value={proposal.primaryText}
              onChange={(e) => setField('primaryText', e.target.value)}
              rows={3}
              className="w-full resize-none rounded-lg border border-border bg-surface-2/60 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-mid/25"
            />
          </label>
          <label className="block space-y-1.5 text-sm sm:max-w-xs">
            <span className="font-medium text-text-secondary">CTA tugmasi</span>
            <select
              value={proposal.cta}
              onChange={(e) => setField('cta', e.target.value)}
              className="w-full rounded-lg border border-border bg-surface-2/60 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-mid/25"
            >
              {CTAS.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>

          {/* Creative attachment — needs a Page + link to produce a real ad */}
          <div className="rounded-xl border border-border/70 bg-surface-2/30 p-4">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-text-tertiary">
              Reklama kreatividi (ixtiyoriy)
            </p>
            {pages.length === 0 ? (
              <div className="flex items-start gap-2 text-xs text-text-secondary">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" aria-hidden />
                <span>
                  Facebook Page topilmadi — kampaniya va ad-set yaratiladi, lekin reklama bo&apos;sh
                  bo&apos;ladi.{' '}
                  <Link href="/settings/meta" className="font-semibold underline">
                    Meta&apos;ni ulash
                  </Link>
                </span>
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="space-y-1.5 text-sm">
                  <span className="font-medium text-text-secondary">Facebook Page</span>
                  <select
                    value={pageId}
                    onChange={(e) => setPageId(e.target.value)}
                    className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-mid/25"
                  >
                    {pages.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="space-y-1.5 text-sm">
                  <span className="font-medium text-text-secondary">Havola (URL)</span>
                  <input
                    value={linkUrl}
                    onChange={(e) => setLinkUrl(e.target.value)}
                    placeholder="https://"
                    className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-mid/25"
                  />
                </label>
              </div>
            )}

            {/* AI ad image (Reve) → becomes the Meta creative picture */}
            <div className="mt-3 border-t border-border/60 pt-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-xs font-medium text-text-secondary">Reklama rasmi</p>
                <button
                  type="button"
                  onClick={generateAdImage}
                  disabled={genLoading}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-brand-mid/30 bg-brand-mid/[0.06] px-2.5 py-1.5 text-xs font-semibold text-brand-mid transition-colors hover:bg-brand-mid/12 disabled:cursor-not-allowed disabled:opacity-60 dark:border-brand-lime/30 dark:bg-brand-lime/[0.06] dark:text-brand-lime"
                >
                  <Sparkles className={cn('h-3.5 w-3.5', genLoading && 'animate-pulse')} aria-hidden />
                  {genLoading
                    ? 'Chizilmoqda…'
                    : adImageUrl
                      ? 'Boshqa rasm'
                      : 'AI rasm yaratib bersin'}
                </button>
              </div>
              {adImageUrl && (
                <div className="mt-2 flex items-start gap-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={adImageUrl}
                    alt="Reklama rasmi"
                    className="h-20 w-20 rounded-lg border border-border object-cover"
                  />
                  <div className="min-w-0 flex-1 text-xs text-text-secondary">
                    <p className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                      <CheckCircle2 className="h-3.5 w-3.5" aria-hidden />
                      Rasm reklamaga biriktiriladi
                    </p>
                    <button
                      type="button"
                      onClick={() => setAdImageUrl('')}
                      className="mt-1 text-text-tertiary hover:text-rose-500"
                    >
                      Olib tashlash
                    </button>
                  </div>
                </div>
              )}
              {genError && <p className="mt-2 text-xs text-amber-600 dark:text-amber-400">{genError}</p>}
            </div>
          </div>

          {/* Pre-test the proposed copy before spending (Phase 1 tie-in) */}
          {proposal.primaryText.trim().length > 0 && (
            <FocusGroupTester
              defaultHeadline={proposal.headline}
              defaultBody={proposal.primaryText}
            />
          )}

          {launchError && (
            <p className="rounded-xl border border-rose-400/40 bg-rose-400/10 p-3 text-sm text-rose-700 dark:text-rose-300">
              {launchError}
            </p>
          )}

          {launchedId ? (
            <div className="flex items-center gap-2 rounded-xl border border-emerald-400/40 bg-emerald-400/10 p-4 text-sm text-emerald-700 dark:text-emerald-300">
              <CheckCircle2 className="h-5 w-5 shrink-0" aria-hidden />
              <span>
                Kampaniya ishga tushdi! ID: <span className="font-mono">{launchedId}</span> —{' '}
                <Link href="/campaigns" className="font-semibold underline">
                  Kampaniyalarni ko&apos;rish
                </Link>
              </span>
            </div>
          ) : (
            <button
              type="button"
              onClick={confirmLaunch}
              disabled={launching}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand-ink px-4 py-3 text-sm font-semibold text-brand-lime disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Rocket className={cn('h-4 w-4', launching && 'animate-pulse')} aria-hidden />
              {launching ? 'Ishga tushirilmoqda…' : 'Tasdiqlash va ishga tushirish'}
            </button>
          )}
        </div>
      )}
    </div>
  )
}
