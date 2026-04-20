'use client'

import { useState, useRef, useCallback } from 'react'
import {
  BarChart3,
  Film,
  ImageIcon,
  Layers,
  LayoutGrid,
  Loader2,
  MousePointer2,
  Palette,
  Smartphone,
  Sparkles,
  Target,
  Type,
  Wand2,
  X,
} from 'lucide-react'
import { useWorkspaceStore } from '@/stores/workspace.store'
import { useI18n } from '@/i18n/use-i18n'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Alert } from '@/components/ui/Alert'
import { Badge } from '@/components/ui/Badge'
import { Spinner } from '@/components/ui/Spinner'
import apiClient from '@/lib/api-client'
import { cn } from '@/lib/utils'

// ─── TYPES ───────────────────────────────────────────────────────────────────

interface ScoreParameter {
  name: string
  score: number
  status: 'good' | 'medium' | 'bad'
  feedback: string
  tip: string
}

interface CreativeScore {
  overallScore: number
  grade: 'A' | 'B' | 'C' | 'D' | 'F'
  verdict: 'ready' | 'needs_work' | 'not_ready'
  verdictText: string
  parameters: ScoreParameter[]
  topStrengths: string[]
  topIssues: string[]
  improvements: string[]
  platformFit: Record<string, number>
  estimatedCtr: string
  abTestSuggestion: string
}

type GradeKey = 'A' | 'B' | 'C' | 'D' | 'F'

/** SVG ring + surface styles aligned with AdSpectr brand (no raw “blue panel”). */
const GRADE_STYLES: Record<
  GradeKey,
  {
    ring: string
    labelKey: string
    labelFb: string
    surface: string
    text: string
    border: string
  }
> = {
  A: {
    ring: '#7aab4d',
    labelKey: 'creativeScorer.gradeA',
    labelFb: 'Excellent',
    surface: 'bg-success/10 border-success/25 text-success dark:bg-success/15 dark:border-success/30',
    text: 'text-success dark:text-brand-lime',
    border: 'border-success/30 dark:border-success/25',
  },
  B: {
    ring: '#93c75b',
    labelKey: 'creativeScorer.gradeB',
    labelFb: 'Good',
    surface: 'bg-brand-mid/12 border-brand-mid/30 text-brand-ink dark:bg-brand-lime/10 dark:border-brand-lime/35 dark:text-brand-lime',
    text: 'text-brand-mid dark:text-brand-lime',
    border: 'border-brand-mid/35 dark:border-brand-lime/30',
  },
  C: {
    ring: '#d97706',
    labelKey: 'creativeScorer.gradeC',
    labelFb: 'Average',
    surface: 'bg-amber-500/10 border-amber-500/25 text-amber-800 dark:bg-amber-500/15 dark:border-amber-400/30 dark:text-amber-200',
    text: 'text-amber-700 dark:text-amber-200',
    border: 'border-amber-400/35 dark:border-amber-500/30',
  },
  D: {
    ring: '#ea580c',
    labelKey: 'creativeScorer.gradeD',
    labelFb: 'Weak',
    surface: 'bg-orange-500/10 border-orange-500/25 text-orange-900 dark:bg-orange-500/12 dark:border-orange-400/30 dark:text-orange-200',
    text: 'text-orange-800 dark:text-orange-200',
    border: 'border-orange-400/35 dark:border-orange-500/25',
  },
  F: {
    ring: '#dc2626',
    labelKey: 'creativeScorer.gradeF',
    labelFb: 'Not usable',
    surface: 'bg-red-500/10 border-red-500/25 text-red-800 dark:bg-red-500/12 dark:border-red-400/30 dark:text-red-200',
    text: 'text-red-700 dark:text-red-200',
    border: 'border-red-400/35 dark:border-red-500/25',
  },
}

const PARAM_ICON: Record<string, React.ComponentType<{ className?: string }>> = {
  'Hook kuchi': Target,
  'Vizual sifat': Palette,
  "Matn o'qilishi": Type,
  'CTA aniqligi': MousePointer2,
  'Rang psixologiyasi': Palette,
  'Brend izchilligi': Layers,
  'Auditoriya mosligi': Target,
  'Raqobat farqi': BarChart3,
  'Mobil optimizatsiya': Smartphone,
  'Platform talablari': LayoutGrid,
}

const PLATFORMS = [
  { value: 'meta', labelKey: 'creativeScorer.platformMeta', labelFb: 'Meta (Facebook / Instagram)' },
  { value: 'tiktok', labelKey: 'creativeScorer.platformTiktok', labelFb: 'TikTok' },
  { value: 'google', labelKey: 'creativeScorer.platformGoogle', labelFb: 'Google Display' },
  { value: 'youtube', labelKey: 'creativeScorer.platformYoutube', labelFb: 'YouTube' },
  { value: 'telegram', labelKey: 'creativeScorer.platformTelegram', labelFb: 'Telegram' },
] as const

const CREATIVE_TYPES = [
  { value: 'image', labelKey: 'creativeScorer.typeImage', labelFb: 'Image / banner', icon: ImageIcon },
  { value: 'video', labelKey: 'creativeScorer.typeVideo', labelFb: 'Video thumbnail', icon: Film },
  { value: 'carousel', labelKey: 'creativeScorer.typeCarousel', labelFb: 'Carousel first slide', icon: Layers },
  { value: 'story', labelKey: 'creativeScorer.typeStory', labelFb: 'Story / Reels cover', icon: Smartphone },
] as const

function ScoreBar({ score, max = 10 }: { score: number; max?: number }) {
  const pct = (score / max) * 100
  const bar =
    pct >= 70
      ? 'bg-gradient-to-r from-brand-mid to-brand-lime'
      : pct >= 40
        ? 'bg-amber-500 dark:bg-amber-400'
        : 'bg-red-500 dark:bg-red-400'
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-2 dark:bg-brand-ink/50">
        <div className={cn('h-full rounded-full transition-all duration-700', bar)} style={{ width: `${pct}%` }} />
      </div>
      <span className="w-9 text-right font-mono text-xs text-text-tertiary">
        {score}/{max}
      </span>
    </div>
  )
}

function StatusDot({ status }: { status: 'good' | 'medium' | 'bad' }) {
  return (
    <div
      className={cn(
        'mt-1.5 h-2 w-2 shrink-0 rounded-full',
        status === 'good' && 'bg-brand-mid dark:bg-brand-lime',
        status === 'medium' && 'bg-amber-500',
        status === 'bad' && 'bg-red-500',
      )}
    />
  )
}

function CircularScore({ score, grade }: { score: number; grade: GradeKey }) {
  const cfg = GRADE_STYLES[grade]
  const circumference = 2 * Math.PI * 45
  const dashOffset = circumference - (score / 100) * circumference

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width="120" height="120" viewBox="0 0 120 120" className="drop-shadow-sm">
        <circle cx="60" cy="60" r="45" fill="none" stroke="var(--c-border)" strokeWidth="8" />
        <circle
          cx="60"
          cy="60"
          r="45"
          fill="none"
          stroke={cfg.ring}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          transform="rotate(-90 60 60)"
          style={{ transition: 'stroke-dashoffset 1s ease' }}
        />
      </svg>
      <div className="absolute text-center">
        <p className={cn('text-3xl font-black', cfg.text)}>{score}</p>
        <p className={cn('text-xs font-bold', cfg.text)}>{grade}</p>
      </div>
    </div>
  )
}

const DEMO_SCORE: CreativeScore = {
  overallScore: 72,
  grade: 'B',
  verdict: 'needs_work',
  verdictText:
    "Kreativ yaxshi bazaga ega, ammo hook kuchi va CTA aniqligi yaxshilanishi lozim. Platform talablariga asosan kichik o'zgarishlar bilan reklamaga tayyor bo'ladi.",
  parameters: [
    {
      name: 'Hook kuchi',
      score: 6,
      status: 'medium',
      feedback: "Birinchi 3 soniyada diqqatni tortish o'rtacha darajada",
      tip: "Kuchli savol yoki ajablanarli statistika bilan boshlang",
    },
    { name: 'Vizual sifat', score: 8, status: 'good', feedback: 'Rasm aniqligi va kompozitsiya juda yaxshi', tip: '' },
    { name: "Matn o'qilishi", score: 7, status: 'good', feedback: 'Shrift o\'lchami va kontrast maqbul', tip: '' },
    {
      name: 'CTA aniqligi',
      score: 5,
      status: 'medium',
      feedback: "Harakatga chaqiruv unchalik aniq emas",
      tip: "'Hozir buyurtma bering' yoki 'Bepul sinab ko'ring' kabi aniq CTA qo'shing",
    },
    { name: 'Rang psixologiyasi', score: 8, status: 'good', feedback: 'Ranglar brend bilan uyg\'un va ishonch uyg\'otadi', tip: '' },
    { name: 'Brend izchilligi', score: 9, status: 'good', feedback: "Logo va korporativ uslub to'g'ri ishlatilgan", tip: '' },
    { name: 'Auditoriya mosligi', score: 7, status: 'good', feedback: 'Target auditoriyaga mos vizual til', tip: '' },
    {
      name: 'Raqobat farqi',
      score: 6,
      status: 'medium',
      feedback: "Raqobatchilardan farq qiluvchi element kam",
      tip: "Noyob USP ni vizual ko'rsating",
    },
    { name: 'Mobil optimizatsiya', score: 8, status: 'good', feedback: "Mobil ekranda yaxshi ko'rinadi", tip: '' },
    {
      name: 'Platform talablari',
      score: 4,
      status: 'bad',
      feedback: "Story formatida matn xavfsiz zonadan chiqib ketgan",
      tip: "Matnni pastki va yuqori 15% dan uzoqlashtirib joylashtiring",
    },
  ],
  topStrengths: ['Vizual sifat yuqori', 'Brend izchilligi mukammal', 'Mobil optimizatsiya yaxshi'],
  topIssues: ["CTA aniq emas", 'Hook kuchi zaif', "Platform talablariga to'liq mos emas"],
  improvements: [
    "CTA ni aniqlashtiring: 'Hozir buyurtma bering' kabi to'g'ridan-to'g'ri chaqiruv qo'shing",
    "Story formatida matnni xavfsiz zonaga olib keling (15% qoida)",
    "Birinchi 3 soniyaga kuchli hook qo'shing — savol yoki hayratlanarli fakt",
  ],
  platformFit: { meta: 78, tiktok: 55, google: 82, youtube: 60, telegram: 88 },
  estimatedCtr: '1.4–2.1%',
  abTestSuggestion:
    "Joriy kreativni hook kuchsiz versiya deb olib, CTA va Hook o'zgartirilgan B varianti bilan A/B test o'tkazing. 3 kun test muddati tavsiya etiladi.",
}

function platformBarColor(score: number): string {
  if (score >= 70) return 'from-brand-mid to-brand-lime'
  if (score >= 50) return 'from-amber-500 to-amber-400'
  return 'from-red-500 to-red-400'
}

const PLATFORM_SHORT: Record<string, { key: string; fb: string }> = {
  meta: { key: 'creativeScorer.platformMetaShort', fb: 'Meta' },
  google: { key: 'creativeScorer.platformGoogleShort', fb: 'Google' },
  tiktok: { key: 'creativeScorer.platformTiktokShort', fb: 'TikTok' },
  youtube: { key: 'creativeScorer.platformYoutubeShort', fb: 'YouTube' },
  telegram: { key: 'creativeScorer.platformTelegramShort', fb: 'Telegram' },
}

export default function CreativeScorerPage() {
  const { t } = useI18n()
  const { currentWorkspace } = useWorkspaceStore()

  const fileInputRef = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [platform, setPlatform] = useState('meta')
  const [creativeType, setCreativeType] = useState('image')
  const [goal, setGoal] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState<CreativeScore | null>(DEMO_SCORE)
  const [isDragging, setIsDragging] = useState(false)

  function handleFileSelect(selectedFile: File) {
    if (!selectedFile) return

    const maxSize = 10 * 1024 * 1024
    if (selectedFile.size > maxSize) {
      setError(t('creativeScorer.maxSizeError', 'File size must be less than 10MB'))
      return
    }

    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'video/mp4']
    if (!allowed.includes(selectedFile.type)) {
      setError(t('creativeScorer.fileTypeError', 'Only JPG, PNG, WebP, GIF, or MP4 files are supported'))
      return
    }

    setFile(selectedFile)
    setError('')
    setResult(null)

    const url = URL.createObjectURL(selectedFile)
    setPreview(url)

    if (selectedFile.type.startsWith('video/')) {
      setCreativeType('video')
    }
  }

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const dropped = e.dataTransfer.files[0]
    if (dropped) handleFileSelect(dropped)
  }, [])

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const onDragLeave = useCallback(() => {
    setIsDragging(false)
  }, [])

  async function handleScore() {
    if (!file) {
      setError(t('creativeScorer.uploadRequired', 'Please upload a file'))
      return
    }
    if (!goal) {
      setError(t('creativeScorer.goalRequired', 'Please enter your campaign goal'))
      return
    }

    setLoading(true)
    setError('')
    setResult(null)

    try {
      const base64 = await fileToBase64(file)

      const res = await apiClient.post('/ai-agent/score-creative', {
        imageBase64: base64,
        mimeType: file.type,
        platform,
        creativeType,
        goal,
        workspaceContext: {
          name: currentWorkspace?.name,
          industry: (currentWorkspace as { industry?: string })?.industry,
          targetAudience: (currentWorkspace as { targetAudience?: string })?.targetAudience,
          aiStrategy: currentWorkspace?.aiStrategy,
        },
      })

      setResult(res.data as CreativeScore)
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } }
      setError(e.response?.data?.message || t('creativeScorer.scoreFailed', 'Creative scoring failed'))
    } finally {
      setLoading(false)
    }
  }

  function fileToBase64(f: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => {
        const r = reader.result as string
        resolve(r.split(',')[1] || '')
      }
      reader.onerror = reject
      reader.readAsDataURL(f)
    })
  }

  function handleReset() {
    setFile(null)
    setPreview(null)
    setResult(null)
    setError('')
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const selectCls = (on: boolean) =>
    cn(
      'flex w-full items-center gap-2.5 rounded-xl border px-3 py-2.5 text-left text-sm transition-all',
      on
        ? 'border-brand-mid/45 bg-brand-mid/10 text-text-primary shadow-sm dark:border-brand-lime/40 dark:bg-brand-lime/10 dark:text-brand-lime'
        : 'border-border/80 text-text-secondary hover:border-brand-mid/25 hover:bg-surface-2 dark:hover:bg-brand-ink/30',
    )

  const chipCls = (on: boolean) =>
    cn(
      'rounded-xl border px-3 py-2 text-left text-xs font-medium transition-all',
      on
        ? 'border-brand-mid/45 bg-brand-mid/10 text-text-primary dark:border-brand-lime/40 dark:bg-brand-lime/10'
        : 'border-border/80 text-text-secondary hover:border-brand-mid/25 hover:bg-surface-2',
    )

  return (
    <div className="mx-auto max-w-6xl space-y-8 pb-12 pt-1">
      <section
        className={cn(
          'relative overflow-hidden rounded-3xl border border-border/80 bg-gradient-to-br px-5 py-6 shadow-sm md:px-8 md:py-8',
          'from-white via-surface to-surface-2/90',
          'dark:from-[#1a2d0d] dark:via-brand-ink dark:to-[#152508]',
        )}
      >
        <div className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-brand-lime/15 blur-3xl dark:bg-brand-lime/10" />
        <div className="relative flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
          <div className="flex min-w-0 items-start gap-4">
            <div
              className={cn(
                'flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl shadow-md ring-1',
                'bg-gradient-to-br from-brand-mid to-brand-lime ring-brand-ink/10',
              )}
            >
              <Wand2 className="h-7 w-7 text-brand-ink" aria-hidden />
            </div>
            <div className="min-w-0">
              <p className="text-caption font-semibold uppercase tracking-wider text-brand-mid dark:text-brand-lime">
                {t('creativeScorer.heroEyebrow', 'Creative quality')}
              </p>
              <h1 className="mt-1 text-2xl font-bold tracking-tight text-text-primary md:text-3xl">
                {t('navigation.creativeScorer', 'Creative Scorer')}
              </h1>
              <p className="mt-2 max-w-2xl text-body-sm text-text-secondary md:text-body">
                {t('creativeScorer.subtitle', 'Upload your ad creative and get AI scoring across 10 quality dimensions')}
              </p>
            </div>
          </div>
          <Badge
            variant="secondary"
            className="shrink-0 border-brand-mid/30 bg-brand-mid/10 text-brand-ink dark:border-brand-lime/30 dark:bg-brand-lime/10 dark:text-brand-lime"
          >
            <Sparkles className="mr-1 inline h-3.5 w-3.5" aria-hidden />
            {t('creativeScorer.aiScoring', 'AI scoring')}
          </Badge>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* LEFT — input */}
        <div className="space-y-5 lg:col-span-5">
          <Card padding="none" className="overflow-hidden border-border/80 shadow-md dark:border-brand-mid/15">
            <div
              onDrop={onDrop}
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              onClick={() => !file && fileInputRef.current?.click()}
              className={cn(
                'relative flex min-h-[220px] cursor-pointer items-center justify-center rounded-2xl border-2 border-dashed transition-all duration-200 md:min-h-[260px]',
                isDragging && 'border-brand-mid/60 bg-brand-mid/5 dark:border-brand-lime/50 dark:bg-brand-lime/5',
                !isDragging &&
                  !file &&
                  'border-border/80 hover:border-brand-mid/40 hover:bg-surface-2/80 dark:hover:bg-brand-ink/25',
                file && 'cursor-default border-border/60',
              )}
            >
              {preview ? (
                <div className="relative h-full w-full overflow-hidden rounded-xl">
                  {file?.type.startsWith('video/') ? (
                    <video src={preview} className="max-h-64 w-full object-contain" muted playsInline />
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={preview} alt="" className="max-h-64 w-full object-contain" />
                  )}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleReset()
                    }}
                    className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-lg bg-brand-ink/80 px-2 py-1 text-xs font-medium text-brand-lime backdrop-blur-sm transition-colors hover:bg-brand-ink"
                  >
                    <X className="h-3.5 w-3.5" aria-hidden />
                    {t('creativeScorer.removeFile', 'Remove')}
                  </button>
                  <div className="absolute bottom-2 left-2 rounded-lg bg-brand-ink/75 px-2 py-1 text-xs text-brand-lime backdrop-blur-sm">
                    {file?.name} · {((file?.size ?? 0) / 1024).toFixed(0)} KB
                  </div>
                </div>
              ) : (
                <div className="px-6 py-10 text-center">
                  <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-mid/15 text-brand-mid dark:bg-brand-lime/15 dark:text-brand-lime">
                    <ImageIcon className="h-7 w-7" aria-hidden />
                  </div>
                  <p className="text-sm font-semibold text-text-primary">
                    {isDragging ? t('creativeScorer.uploadDrop', 'Drop file here') : t('creativeScorer.uploadTap', 'Upload image or video')}
                  </p>
                  <p className="mx-auto mt-1 max-w-xs text-xs text-text-tertiary">
                    {t('creativeScorer.uploadHint', 'Drag and drop or click · JPG, PNG, WebP, MP4 · Max 10 MB')}
                  </p>
                  <span className="mt-4 inline-flex items-center rounded-xl border border-brand-mid/30 bg-brand-mid/10 px-4 py-2 text-xs font-semibold text-brand-ink dark:border-brand-lime/35 dark:bg-brand-lime/10 dark:text-brand-lime">
                    {t('creativeScorer.selectFile', 'Choose file')}
                  </span>
                </div>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,video/mp4"
              onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
              className="hidden"
            />
          </Card>

          <Card className="border-border/80 shadow-md dark:border-brand-mid/15">
            <div className="space-y-5">
              <div>
                <label className="mb-2 block text-caption font-semibold uppercase tracking-wide text-text-tertiary">
                  {t('creativeScorer.platform', 'Platform')}
                </label>
                <div className="grid grid-cols-1 gap-1.5">
                  {PLATFORMS.map((p) => (
                    <button key={p.value} type="button" onClick={() => setPlatform(p.value)} className={selectCls(platform === p.value)}>
                      <span
                        className={cn(
                          'flex h-4 w-4 shrink-0 items-center justify-center rounded-full border',
                          platform === p.value ? 'border-brand-mid dark:border-brand-lime' : 'border-border',
                        )}
                      >
                        {platform === p.value && (
                          <span className="block h-2 w-2 rounded-full bg-brand-mid dark:bg-brand-lime" />
                        )}
                      </span>
                      {t(p.labelKey, p.labelFb)}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="mb-2 block text-caption font-semibold uppercase tracking-wide text-text-tertiary">
                  {t('creativeScorer.creativeType', 'Creative type')}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {CREATIVE_TYPES.map((ct) => {
                    const Icon = ct.icon
                    return (
                      <button key={ct.value} type="button" onClick={() => setCreativeType(ct.value)} className={chipCls(creativeType === ct.value)}>
                        <Icon className="h-4 w-4 shrink-0 text-brand-mid dark:text-brand-lime" aria-hidden />
                        <span className="leading-snug">{t(ct.labelKey, ct.value)}</span>
                      </button>
                    )
                  })}
                </div>
              </div>

              <div>
                <label className="mb-2 block text-caption font-semibold uppercase tracking-wide text-text-tertiary">
                  {t('creativeScorer.goalLabel', 'Campaign goal')} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={goal}
                  onChange={(e) => setGoal(e.target.value)}
                  placeholder={t('creativeScorer.goalPlaceholder', 'e.g. sell phones, webinar sign-ups…')}
                  className="w-full rounded-xl border border-border/90 bg-surface-2/80 px-4 py-3 text-sm text-text-primary placeholder:text-text-tertiary focus:border-brand-mid/50 focus:outline-none focus:ring-2 focus:ring-brand-mid/20 dark:bg-brand-ink/40"
                />
              </div>

              {error ? <Alert variant="error">{error}</Alert> : null}

              <Button fullWidth size="lg" loading={loading} onClick={handleScore} disabled={!file}>
                {loading ? t('creativeScorer.ctaScoring', 'Scoring…') : t('creativeScorer.ctaScore', 'Score creative')}
              </Button>
            </div>
          </Card>
        </div>

        {/* RIGHT — results */}
        <div className="space-y-5 lg:col-span-7">
          {!result && !loading && (
            <Card className="border-border/80 shadow-md dark:border-brand-mid/15">
              <div className="py-12 text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-mid/12 text-brand-mid dark:bg-brand-lime/12 dark:text-brand-lime">
                  <BarChart3 className="h-8 w-8" aria-hidden />
                </div>
                <p className="font-semibold text-text-primary">{t('creativeScorer.emptyTitle', 'We score your creative')}</p>
                <p className="mx-auto mt-2 max-w-md text-sm text-text-secondary">{t('creativeScorer.emptyBody', '')}</p>
                <ul className="mx-auto mt-6 max-w-sm space-y-2 text-left text-xs text-text-tertiary">
                  {Object.keys(PARAM_ICON).map((name) => {
                    const Icon = PARAM_ICON[name] ?? Sparkles
                    return (
                      <li key={name} className="flex items-center gap-2">
                        <Icon className="h-3.5 w-3.5 shrink-0 text-brand-mid dark:text-brand-lime" aria-hidden />
                        {name}
                      </li>
                    )
                  })}
                </ul>
              </div>
            </Card>
          )}

          {loading && (
            <Card className="border-border/80 shadow-md dark:border-brand-mid/15">
              <div className="py-14 text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-brand-mid/25 bg-brand-mid/10 dark:border-brand-lime/30 dark:bg-brand-lime/10">
                  <Spinner size="lg" />
                </div>
                <p className="font-semibold text-text-primary">{t('creativeScorer.loadingTitle', 'Analyzing creative…')}</p>
                <p className="mt-1 text-sm text-text-secondary">{t('creativeScorer.loadingSub', '')}</p>
                <div className="mx-auto mt-6 max-w-sm space-y-1.5 text-left text-xs text-text-tertiary">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <p key={i} className="flex items-center gap-2">
                      <Loader2 className="h-3 w-3 shrink-0 animate-spin text-brand-mid dark:text-brand-lime" aria-hidden />
                      {t(`creativeScorer.loadStep${i}`, '')}
                    </p>
                  ))}
                </div>
              </div>
            </Card>
          )}

          {result && !loading && (
            <div className="space-y-5">
              <Card
                className={cn(
                  'border-2 shadow-md dark:bg-surface-elevated/90',
                  GRADE_STYLES[result.grade].border,
                  'bg-surface dark:border-brand-mid/20',
                )}
              >
                <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
                  <CircularScore score={result.overallScore} grade={result.grade} />
                  <div className="min-w-0 flex-1 text-center sm:text-left">
                    <div
                      className={cn(
                        'mb-2 inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold',
                        GRADE_STYLES[result.grade].surface,
                      )}
                    >
                      {result.verdict === 'ready'
                        ? t('creativeScorer.verdictReady', 'Ready to run')
                        : result.verdict === 'needs_work'
                          ? t('creativeScorer.verdictNeeds', 'Needs improvement')
                          : t('creativeScorer.verdictNot', 'Not ready')}
                    </div>
                    <p className={cn('text-base font-semibold', GRADE_STYLES[result.grade].text)}>
                      {t(GRADE_STYLES[result.grade].labelKey, GRADE_STYLES[result.grade].labelFb)}
                    </p>
                    <p className="mt-2 text-sm leading-relaxed text-text-secondary">{result.verdictText}</p>
                    <p className="mt-3 text-xs text-text-tertiary">
                      {t('creativeScorer.estCtr', 'Est. CTR')}:{' '}
                      <span className="font-semibold text-text-primary">{result.estimatedCtr}</span>
                    </p>
                  </div>
                </div>
                {!file && (
                  <div className="mt-5 border-t border-border/70 pt-5 dark:border-brand-mid/15">
                    <Alert variant="info" className="border-amber-500/25 bg-amber-500/10 text-amber-950 dark:border-amber-400/25 dark:bg-amber-500/10 dark:text-amber-100">
                      {t('creativeScorer.demoBanner', '')}
                    </Alert>
                  </div>
                )}
              </Card>

              {Object.keys(result.platformFit).length > 0 && (
                <Card className="border-border/80 shadow-md dark:border-brand-mid/15">
                  <p className="mb-4 text-caption font-bold uppercase tracking-wider text-text-tertiary">
                    {t('creativeScorer.platformFit', 'Platform fit')}
                  </p>
                  <div className="space-y-3">
                    {Object.entries(result.platformFit).map(([p, score]) => (
                      <div key={p}>
                        <div className="mb-1 flex justify-between text-xs">
                          <span className="text-text-secondary">
                            {PLATFORM_SHORT[p] ? t(PLATFORM_SHORT[p].key, PLATFORM_SHORT[p].fb) : p}
                          </span>
                          <span
                            className={cn(
                              'font-semibold',
                              score >= 70 && 'text-brand-mid dark:text-brand-lime',
                              score >= 50 && score < 70 && 'text-amber-600 dark:text-amber-300',
                              score < 50 && 'text-red-600 dark:text-red-400',
                            )}
                          >
                            {score}%
                          </span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-surface-2 dark:bg-brand-ink/50">
                          <div
                            className={cn('h-full rounded-full bg-gradient-to-r transition-all duration-700', platformBarColor(score))}
                            style={{ width: `${score}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              <Card padding="none" className="overflow-hidden border-border/80 shadow-md dark:border-brand-mid/15">
                <div className="border-b border-border/80 bg-surface-2/50 px-5 py-3 dark:border-brand-mid/15 dark:bg-brand-ink/30">
                  <p className="text-sm font-semibold text-text-primary">{t('creativeScorer.parametersTitle', '10-dimension breakdown')}</p>
                </div>
                <div className="divide-y divide-border/80 dark:divide-brand-mid/15">
                  {result.parameters.map((param, i) => {
                    const Icon = PARAM_ICON[param.name] ?? Sparkles
                    return (
                      <div key={i} className="px-5 py-4">
                        <div className="flex items-start gap-3">
                          <StatusDot status={param.status} />
                          <div className="min-w-0 flex-1">
                            <div className="mb-1.5 flex items-center justify-between gap-2">
                              <p className="flex items-center gap-2 text-xs font-semibold text-text-primary">
                                <Icon className="h-3.5 w-3.5 shrink-0 text-brand-mid dark:text-brand-lime" aria-hidden />
                                {param.name}
                              </p>
                            </div>
                            <ScoreBar score={param.score} />
                            <p className="mt-2 text-xs leading-relaxed text-text-secondary">{param.feedback}</p>
                            {param.status !== 'good' && param.tip ? (
                              <p className="mt-1.5 flex items-start gap-1.5 text-xs text-brand-mid dark:text-brand-lime">
                                <span className="shrink-0 font-bold">→</span>
                                {param.tip}
                              </p>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </Card>

              {result.improvements.length > 0 && (
                <Card className="border-amber-500/30 bg-amber-500/5 shadow-md dark:border-amber-400/25 dark:bg-amber-500/10">
                  <p className="mb-3 text-sm font-semibold text-amber-900 dark:text-amber-200">
                    {t('creativeScorer.improvementsTitle', 'Priority fixes')}
                  </p>
                  <div className="space-y-2">
                    {result.improvements.map((imp, idx) => (
                      <div key={idx} className="flex items-start gap-2.5 text-sm text-text-secondary">
                        <span className="shrink-0 font-bold text-amber-600 dark:text-amber-300">{idx + 1}.</span>
                        <p>{imp}</p>
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              {result.abTestSuggestion ? (
                <Card variant="outlined" className="border-brand-mid/25 dark:border-brand-lime/20">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-mid/15 text-brand-mid dark:bg-brand-lime/15 dark:text-brand-lime">
                      <Sparkles className="h-5 w-5" aria-hidden />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-text-primary">{t('creativeScorer.abTestTitle', 'A/B test suggestion')}</p>
                      <p className="mt-1 text-sm leading-relaxed text-text-secondary">{result.abTestSuggestion}</p>
                    </div>
                  </div>
                </Card>
              ) : null}

              <Button variant="secondary" fullWidth onClick={handleReset} className="rounded-2xl border-brand-mid/20">
                {t('creativeScorer.newScore', 'Score another creative')}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
