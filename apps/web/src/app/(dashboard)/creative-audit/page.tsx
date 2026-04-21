'use client'

import { useCallback, useState } from 'react'
import { Loader2, Stethoscope, Upload } from 'lucide-react'
import { PageHeader } from '@/components/ui/PageHeader'
import { Alert } from '@/components/ui/Alert'
import { CreativeAuditScorecard } from '@/components/creative-audit/Scorecard'
import type { AuditOnboardingContext, CreativeAuditResult, HumanAuditOverrides } from '@/lib/creative-audit/types'
import type { IntendedPlacement } from '@/lib/creative-audit/types'
import { cn } from '@/lib/utils'

type Step = 'upload' | 'scan' | 'score'

function readImageDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      URL.revokeObjectURL(url)
      resolve({ width: img.naturalWidth, height: img.naturalHeight })
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Rasm ochilmadi'))
    }
    img.src = url
  })
}

export default function CreativeAuditPage() {
  const [step, setStep] = useState<Step>('upload')
  const [file, setFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [dims, setDims] = useState({ width: 1080, height: 1080 })
  const [brandHex, setBrandHex] = useState('#0A7A3E')
  const [ageMin, setAgeMin] = useState('18')
  const [ageMax, setAgeMax] = useState('24')
  const [placement, setPlacement] = useState<IntendedPlacement>('feed_square')
  const [historicalRoas, setHistoricalRoas] = useState('')
  const [ignoreCta, setIgnoreCta] = useState(false)
  const [ignoreText, setIgnoreText] = useState(false)
  const [result, setResult] = useState<CreativeAuditResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const resetUpload = useCallback(() => {
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setFile(null)
    setPreviewUrl(null)
    setResult(null)
    setStep('upload')
    setError(null)
  }, [previewUrl])

  const onPickFile = async (f: File | null) => {
    setError(null)
    if (!f) return
    if (!f.type.startsWith('image/')) {
      setError('Faqat rasm fayli (JPEG, PNG, WebP).')
      return
    }
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    const url = URL.createObjectURL(f)
    setFile(f)
    setPreviewUrl(url)
    try {
      const d = await readImageDimensions(f)
      setDims(d)
    } catch {
      setDims({ width: 1080, height: 1080 })
    }
  }

  const runAnalyze = async () => {
    if (!file) return
    setLoading(true)
    setError(null)
    setStep('scan')
    try {
      const onboarding: AuditOnboardingContext = {
        brandPrimaryHex: brandHex.trim() || undefined,
        audienceAgeMin: Number(ageMin) || undefined,
        audienceAgeMax: Number(ageMax) || undefined,
        intendedPlacement: placement,
        historicalRoasSimilar: historicalRoas.trim() ? Number(historicalRoas) : undefined,
      }
      const overrides: HumanAuditOverrides = {
        ignoreMissingCta: ignoreCta,
        ignoreTextRatio: ignoreText,
      }

      const fd = new FormData()
      fd.set('file', file)
      fd.set('width', String(dims.width))
      fd.set('height', String(dims.height))
      fd.set('onboarding', JSON.stringify(onboarding))
      fd.set('overrides', JSON.stringify(overrides))

      const res = await fetch('/api/creative-audit/analyze', {
        method: 'POST',
        body: fd,
      })
      const json = (await res.json()) as { ok?: boolean; message?: string } & Partial<CreativeAuditResult>
      if (!res.ok || !json.ok) {
        throw new Error(json.message || 'Tahlil xatosi')
      }
      const { ok: _ok, message: _m, visionRaw: _v, ...rest } = json as Record<string, unknown>
      setResult(rest as CreativeAuditResult)
      setStep('score')
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Xato')
      setStep('upload')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-6xl space-y-8 p-6">
      <PageHeader
        title={
          <span className="inline-flex items-center gap-2">
            <Stethoscope className="h-7 w-7 text-brand-mid dark:text-brand-lime" aria-hidden />
            Creative Audit Pro
          </span>
        }
        subtitle="Eski kreativni yuklang — ~30 soniyada diagnoz, keyin Creative Hub orqali davolang. 7 ta kriteriya, vaznli ball, hybrid override."
      />

      <div className="flex flex-wrap gap-2 text-xs font-medium text-text-tertiary">
        {(['Yuklash', 'AI Scan', 'Scorecard', 'Fix'] as const).map((label, i) => (
          <span
            key={label}
            className={cn(
              'rounded-full border px-3 py-1',
              (step === 'upload' && i === 0) ||
                (step === 'scan' && i <= 1) ||
                (step === 'score' && i <= 3)
                ? 'border-brand-mid/50 bg-brand-mid/10 text-brand-ink dark:border-brand-lime/40 dark:bg-brand-lime/10 dark:text-brand-lime'
                : 'border-border',
            )}
          >
            {i + 1}. {label}
          </span>
        ))}
      </div>

      {error ? <Alert variant="error">{error}</Alert> : null}

      {step === 'upload' || step === 'scan' ? (
        <div className="grid gap-8 lg:grid-cols-[1fr_280px]">
          <div
            className={cn(
              'relative flex min-h-[280px] flex-col items-center justify-center rounded-3xl border-2 border-dashed border-border bg-surface-1 p-8',
              previewUrl && 'border-solid border-brand-mid/30',
              step === 'scan' && 'opacity-90',
            )}
          >
            {step === 'scan' ? (
              <div className="absolute inset-0 z-10 flex flex-col items-center justify-center rounded-3xl bg-surface/80 backdrop-blur-sm">
                <Loader2 className="h-10 w-10 animate-spin text-brand-mid dark:text-brand-lime" aria-hidden />
                <p className="mt-3 text-sm font-medium text-text-primary">AI Scan…</p>
                <p className="text-xs text-text-tertiary">Vision + 7 kriteriya</p>
              </div>
            ) : null}
            {previewUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={previewUrl} alt="" className="max-h-72 max-w-full rounded-2xl object-contain shadow-md" />
            ) : (
              <div className="text-center text-text-secondary">
                <Upload className="mx-auto mb-3 h-12 w-12 opacity-40" aria-hidden />
                <p className="font-medium text-text-primary">Kreativni torting yoki tanlang</p>
                <p className="mt-1 text-sm">JPEG / PNG / WebP</p>
              </div>
            )}
            <label
              className={cn(
                'mt-6 cursor-pointer rounded-xl bg-brand-ink px-5 py-2.5 text-sm font-semibold text-brand-lime hover:opacity-95',
                step === 'scan' && 'pointer-events-none opacity-40',
              )}
            >
              Fayl tanlash
              <input
                type="file"
                accept="image/*"
                className="hidden"
                disabled={step === 'scan'}
                onChange={(e) => void onPickFile(e.target.files?.[0] ?? null)}
              />
            </label>
            {file ? (
              <p className="mt-3 font-mono text-xs text-text-tertiary">
                {dims.width}×{dims.height}px · {(file.size / 1024).toFixed(0)} KB
              </p>
            ) : null}
          </div>

          <div className="space-y-4 rounded-2xl border border-border bg-surface-1 p-5">
            <p className="text-sm font-semibold text-text-primary">Onboarding (ixtiyoriy)</p>
            <label className="block text-xs text-text-secondary">
              Brend primary (hex)
              <input
                className="mt-1 w-full rounded-lg border border-border bg-white px-2 py-2 font-mono text-sm dark:bg-slate-950"
                value={brandHex}
                onChange={(e) => setBrandHex(e.target.value)}
              />
            </label>
            <div className="grid grid-cols-2 gap-2">
              <label className="block text-xs text-text-secondary">
                Yosh min
                <input
                  className="mt-1 w-full rounded-lg border border-border bg-white px-2 py-2 text-sm dark:bg-slate-950"
                  value={ageMin}
                  onChange={(e) => setAgeMin(e.target.value)}
                />
              </label>
              <label className="block text-xs text-text-secondary">
                Yosh max
                <input
                  className="mt-1 w-full rounded-lg border border-border bg-white px-2 py-2 text-sm dark:bg-slate-950"
                  value={ageMax}
                  onChange={(e) => setAgeMax(e.target.value)}
                />
              </label>
            </div>
            <label className="block text-xs text-text-secondary">
              Joylashuv
              <select
                className="mt-1 w-full rounded-lg border border-border bg-white px-2 py-2 text-sm dark:bg-slate-950"
                value={placement}
                onChange={(e) => setPlacement(e.target.value as IntendedPlacement)}
              >
                <option value="feed_square">Feed 1:1</option>
                <option value="feed_portrait">Feed 4:5</option>
                <option value="story">Story 9:16</option>
                <option value="link_preview">Link 1200×628</option>
                <option value="unknown">Nomaʼlum</option>
              </select>
            </label>
            <label className="block text-xs text-text-secondary">
              O‘xshash kreativlar ROAS (stub)
              <input
                className="mt-1 w-full rounded-lg border border-border bg-white px-2 py-2 text-sm dark:bg-slate-950"
                placeholder="masalan 2.4"
                value={historicalRoas}
                onChange={(e) => setHistoricalRoas(e.target.value)}
              />
            </label>
            <div className="space-y-2 border-t border-border pt-3 text-sm text-text-secondary">
              <p className="text-xs font-semibold text-text-primary">Hybrid override</p>
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={ignoreCta} onChange={(e) => setIgnoreCta(e.target.checked)} />
                CTA yo‘q — brand awareness
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={ignoreText} onChange={(e) => setIgnoreText(e.target.checked)} />
                Matn % qoidasini e’tiborsiz qoldirish
              </label>
            </div>
            <button
              type="button"
              disabled={!file || loading || step === 'scan'}
              onClick={() => void runAnalyze()}
              className={cn(
                'mt-2 flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold text-brand-ink',
                'bg-gradient-to-r from-brand-mid to-brand-lime disabled:opacity-50',
              )}
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
              AI Scan (30s atrofida)
            </button>
          </div>
        </div>
      ) : null}

      {step === 'score' && result ? (
        <CreativeAuditScorecard result={result} previewUrl={previewUrl} onReupload={resetUpload} />
      ) : null}
    </div>
  )
}
