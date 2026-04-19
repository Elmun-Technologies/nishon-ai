'use client'
import { useState, useRef, useCallback } from 'react'
import { useWorkspaceStore } from '@/stores/workspace.store'
import { useI18n } from '@/i18n/use-i18n'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Alert } from '@/components/ui/Alert'
import { Badge } from '@/components/ui/Badge'
import { Spinner } from '@/components/ui/Spinner'
import { PageHeader } from '@/components/ui'
import apiClient from '@/lib/api-client'

// ─── TYPES ───────────────────────────────────────────────────────────────────

interface ScoreParameter {
  name: string
  score: number          // 0-10
  status: 'good' | 'medium' | 'bad'
  feedback: string       // specific feedback in Uzbek
  tip: string            // how to improve
}

interface CreativeScore {
  overallScore: number   // 0-100
  grade: 'A' | 'B' | 'C' | 'D' | 'F'
  verdict: 'ready' | 'needs_work' | 'not_ready'
  verdictText: string
  parameters: ScoreParameter[]
  topStrengths: string[]
  topIssues: string[]
  improvements: string[]
  platformFit: Record<string, number>  // e.g. { meta: 85, tiktok: 60 }
  estimatedCtr: string   // e.g. "1.2-1.8%"
  abTestSuggestion: string
}

// ─── SCORE PARAMETERS DEFINITION ─────────────────────────────────────────────

const PARAMETER_ICONS: Record<string, string> = {
  'Hook kuchi':           '🎣',
  'Vizual sifat':         '🎨',
  'Matn o\'qilishi':      '📝',
  'CTA aniqligi':         '👆',
  'Rang psixologiyasi':   '🎨',
  'Brend izchilligi':     '🏷️',
  'Auditoriya mosligi':   '🎯',
  'Raqobat farqi':        '⚔️',
  'Mobil optimizatsiya':  '📱',
  'Platform talablari':   '✅',
}

const PLATFORMS = [
  { value: 'meta',     label: '📘 Meta (Facebook/Instagram)' },
  { value: 'tiktok',   label: '🎵 TikTok' },
  { value: 'google',   label: '🔍 Google Display' },
  { value: 'youtube',  label: '▶️ YouTube' },
  { value: 'telegram', label: '✈️ Telegram' },
]

const CREATIVE_TYPES = [
  { value: 'image',    label: '🖼 Rasm / Banner' },
  { value: 'video',    label: '🎬 Video thumbnail' },
  { value: 'carousel', label: '🗂 Carousel birinchi slayd' },
  { value: 'story',    label: '📱 Story / Reels cover' },
]

// ─── GRADE CONFIG ────────────────────────────────────────────────────────────

/* Real chroma — app Tailwind "blue/emerald" map to brand green, so use explicit values for readable grades */
const GRADE_CONFIG = {
  A: {
    color: 'text-[#065f46] dark:text-[#6ee7b7]',
    bg: 'bg-[#ecfdf5] dark:bg-[#064e3b]/45',
    border: 'border-[#6ee7b7] dark:border-[#34d399]/45',
    ring: '#10b981',
    label: 'Mukammal',
  },
  B: {
    color: 'text-[#1e40af] dark:text-[#93c5fd]',
    bg: 'bg-[#eff6ff] dark:bg-[#172554]/55',
    border: 'border-[#93c5fd] dark:border-[#3b82f6]/45',
    ring: '#2563eb',
    label: 'Yaxshi',
  },
  C: {
    color: 'text-[#b45309] dark:text-[#fcd34d]',
    bg: 'bg-[#fffbeb] dark:bg-[#422006]/50',
    border: 'border-[#fcd34d] dark:border-[#f59e0b]/45',
    ring: '#d97706',
    label: "O'rtacha",
  },
  D: {
    color: 'text-[#c2410c] dark:text-[#fdba74]',
    bg: 'bg-[#fff7ed] dark:bg-[#431407]/45',
    border: 'border-[#fdba74] dark:border-[#fb923c]/45',
    ring: '#ea580c',
    label: 'Zaif',
  },
  F: {
    color: 'text-[#b91c1c] dark:text-[#fca5a5]',
    bg: 'bg-[#fef2f2] dark:bg-[#450a0a]/45',
    border: 'border-[#fca5a5] dark:border-[#f87171]/45',
    ring: '#dc2626',
    label: 'Yaroqsiz',
  },
}

// ─── SCORE BAR ────────────────────────────────────────────────────────────────

function ScoreBar({ score, max = 10 }: { score: number; max?: number }) {
  const pct = (score / max) * 100
  const color = pct >= 70 ? '#059669' : pct >= 40 ? '#d97706' : '#dc2626'
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-surface-2 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
      <span className="text-xs font-mono text-text-tertiary w-8 text-right">
        {score}/{max}
      </span>
    </div>
  )
}

// ─── STATUS ICON ─────────────────────────────────────────────────────────────

function StatusDot({ status }: { status: 'good' | 'medium' | 'bad' }) {
  return (
    <div
      className="mt-1.5 h-2 w-2 shrink-0 rounded-full"
      style={{
        backgroundColor: status === 'good' ? '#059669' : status === 'medium' ? '#d97706' : '#dc2626',
      }}
    />
  )
}

// ─── CIRCULAR SCORE ──────────────────────────────────────────────────────────

function CircularScore({ score, grade }: { score: number; grade: keyof typeof GRADE_CONFIG }) {
  const cfg = GRADE_CONFIG[grade]
  const circumference = 2 * Math.PI * 45
  const dashOffset = circumference - (score / 100) * circumference

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width="120" height="120" viewBox="0 0 120 120">
        {/* Background — follows theme border (light/dark) */}
        <circle cx="60" cy="60" r="45" fill="none" stroke="var(--c-border)" strokeWidth="8" />
        {/* Arc color matches letter grade (not remapped brand green) */}
        <circle
          cx="60" cy="60" r="45"
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
        <p className={`text-3xl font-black ${cfg.color}`}>{score}</p>
        <p className={`text-xs font-bold ${cfg.color}`}>{grade}</p>
      </div>
    </div>
  )
}

// ─── DEMO SCORE ───────────────────────────────────────────────────────────────

const DEMO_SCORE: CreativeScore = {
  overallScore: 72,
  grade: 'B',
  verdict: 'needs_work',
  verdictText: "Kreativ yaxshi bazaga ega, ammo hook kuchi va CTA aniqligi yaxshilanishi lozim. Platform talablariga asosan kichik o'zgarishlar bilan reklamaga tayyor bo'ladi.",
  parameters: [
    { name: 'Hook kuchi',          score: 6, status: 'medium', feedback: "Birinchi 3 soniyada diqqatni tortish o'rtacha darajada", tip: "Kuchli savol yoki ajablanarli statistika bilan boshlang" },
    { name: 'Vizual sifat',        score: 8, status: 'good',   feedback: "Rasm aniqligi va kompozitsiya juda yaxshi", tip: "" },
    { name: "Matn o'qilishi",      score: 7, status: 'good',   feedback: "Shrift o'lchami va kontrast maqbul", tip: "" },
    { name: 'CTA aniqligi',        score: 5, status: 'medium', feedback: "Harakatga chaqiruv unchalik aniq emas", tip: "'Hozir buyurtma bering' yoki 'Bepul sinab ko'ring' kabi aniq CTA qo'shing" },
    { name: 'Rang psixologiyasi',  score: 8, status: 'good',   feedback: "Ranglar brend bilan uyg'un va ishonch uyg'otadi", tip: "" },
    { name: 'Brend izchilligi',    score: 9, status: 'good',   feedback: "Logo va korporativ uslub to'g'ri ishlatilgan", tip: "" },
    { name: 'Auditoriya mosligi',  score: 7, status: 'good',   feedback: "Target auditoriyaga mos vizual til", tip: "" },
    { name: 'Raqobat farqi',       score: 6, status: 'medium', feedback: "Raqobatchilardan farq qiluvchi element kam", tip: "Noyob USP ni vizual ko'rsating" },
    { name: 'Mobil optimizatsiya', score: 8, status: 'good',   feedback: "Mobil ekranda yaxshi ko'rinadi", tip: "" },
    { name: 'Platform talablari',  score: 4, status: 'bad',    feedback: "Story formatida matn xavfsiz zonadan chiqib ketgan", tip: "Matnni pastki va yuqori 15% dan uzoqlashtirib joylashtiring" },
  ],
  topStrengths: ['Vizual sifat yuqori', 'Brend izchilligi mukammal', 'Mobil optimizatsiya yaxshi'],
  topIssues: ["CTA aniq emas", 'Hook kuchi zaif', 'Platform talablariga to\'liq mos emas'],
  improvements: [
    "CTA ni aniqlashtiring: 'Hozir buyurtma bering' kabi to'g'ridan-to'g'ri chaqiruv qo'shing",
    "Story formatida matnni xavfsiz zonaga olib keling (15% qoida)",
    "Birinchi 3 soniyaga kuchli hook qo'shing — savol yoki hayratlanarli fakt",
  ],
  platformFit: { meta: 78, tiktok: 55, google: 82, youtube: 60, telegram: 88 },
  estimatedCtr: '1.4–2.1%',
  abTestSuggestion: "Joriy kreativni hook kuchsiz versiya deb olib, CTA va Hook o'zgartirilgan B varianti bilan A/B test o'tkazing. 3 kun test muddati tavsiya etiladi.",
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────

export default function CreativeScorerPage() {
  const { t } = useI18n()
  const { currentWorkspace } = useWorkspaceStore()

  const fileInputRef = useRef<HTMLInputElement>(null)
  const [file, setFile]               = useState<File | null>(null)
  const [preview, setPreview]         = useState<string | null>(null)
  const [platform, setPlatform]       = useState('meta')
  const [creativeType, setCreativeType] = useState('image')
  const [goal, setGoal]               = useState('')
  const [loading, setLoading]         = useState(false)
  const [error, setError]             = useState('')
  const [result, setResult]           = useState<CreativeScore | null>(DEMO_SCORE)
  const [isDragging, setIsDragging]   = useState(false)

  // ─── FILE HANDLING ───────────────────────────────────────────────────────

  function handleFileSelect(selectedFile: File) {
    if (!selectedFile) return

    const maxSize = 10 * 1024 * 1024 // 10MB
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

    // Create preview URL
    const url = URL.createObjectURL(selectedFile)
    setPreview(url)

    // Auto-detect creative type
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

  // ─── SCORE FUNCTION ──────────────────────────────────────────────────────

  async function handleScore() {
    if (!file) { setError(t('creativeScorer.uploadRequired', 'Please upload a file')); return }
    if (!goal) { setError(t('creativeScorer.goalRequired', 'Please enter your campaign goal')); return }

    setLoading(true)
    setError('')
    setResult(null)

    try {
      // Convert file to base64 for API
      const base64 = await fileToBase64(file)

      const res = await apiClient.post('/ai-agent/score-creative', {
        imageBase64: base64,
        mimeType: file.type,
        platform,
        creativeType,
        goal,
        workspaceContext: {
          name: currentWorkspace?.name,
          industry: (currentWorkspace as any)?.industry,
          targetAudience: (currentWorkspace as any)?.targetAudience,
          aiStrategy: currentWorkspace?.aiStrategy,
        },
      })

      setResult(res.data)
    } catch (err: any) {
      setError(err.response?.data?.message || t('creativeScorer.scoreFailed', 'Creative scoring failed'))
    } finally {
      setLoading(false)
    }
  }

  function fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => {
        const result = reader.result as string
        // Remove data URL prefix, keep only base64
        resolve(result.split(',')[1])
      }
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }

  function handleReset() {
    setFile(null)
    setPreview(null)
    setResult(null)
    setError('')
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  // ─── RENDER ──────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6 max-w-4xl">
      <PageHeader
        title={t('navigation.creativeScorer', 'Creative Scorer')}
        subtitle={t('creativeScorer.subtitle', 'Upload your ad creative and get AI scoring across 10 quality dimensions')}
        actions={
          <Badge variant="secondary" className="border-border bg-surface text-text-secondary">
            🎨 {t('creativeScorer.aiScoring', 'AI scoring')}
          </Badge>
        }
      />

      <div className="grid grid-cols-1 gap-6 rounded-2xl border border-border bg-surface p-4 shadow-sm lg:grid-cols-2 lg:p-6 dark:bg-surface-elevated">

        {/* LEFT: Upload + Settings */}
        <div className="space-y-4">

          {/* File upload zone */}
          <Card padding="none">
            <div
              onDrop={onDrop}
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              onClick={() => !file && fileInputRef.current?.click()}
              className={`
                relative rounded-xl border-2 border-dashed transition-all duration-200
                min-h-[240px] flex items-center justify-center
                ${isDragging
                  ? 'border-border bg-surface-2 cursor-copy'
                  : file
                  ? 'border-border cursor-default'
                  : 'border-border hover:border-border/50 hover:bg-surface-2 cursor-pointer'
                }
              `}
            >
              {preview ? (
                <div className="w-full h-full relative rounded-xl overflow-hidden">
                  {file?.type.startsWith('video/') ? (
                    <video
                      src={preview}
                      className="w-full h-full object-cover rounded-xl max-h-60"
                      controls={false}
                      muted
                    />
                  ) : (
                    <img
                      src={preview}
                      alt="Creative preview"
                      className="w-full object-contain rounded-xl max-h-60"
                    />
                  )}
                  {/* Replace button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleReset()
                    }}
                    className="absolute top-2 right-2 bg-black/60 text-text-primary text-xs px-2 py-1 rounded-lg hover:bg-black/80 transition-colors"
                  >
                    ✕ O'chirish
                  </button>
                  {/* File info */}
                  <div className="absolute bottom-2 left-2 bg-black/60 text-text-primary text-xs px-2 py-1 rounded-lg">
                    {file?.name} · {((file?.size ?? 0) / 1024).toFixed(0)}KB
                  </div>
                </div>
              ) : (
                <div className="text-center p-8">
                  <div className="text-5xl mb-3">
                    {isDragging ? '📂' : '🖼'}
                  </div>
                  <p className="text-text-primary font-medium text-sm mb-1">
                    {isDragging
                      ? 'Faylni bu yerga tashlang'
                      : 'Rasm yoki video yuklang'}
                  </p>
                  <p className="text-text-tertiary text-xs mb-3">
                    Suring yoki bosing · JPG, PNG, WebP, MP4 · Max 10MB
                  </p>
                  <div className="inline-flex items-center gap-2 bg-surface-2 border border-border rounded-lg px-3 py-1.5">
                    <span className="text-text-secondary text-xs">Fayl tanlash</span>
                  </div>
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

          {/* Settings */}
          <Card>
            <div className="space-y-4">

              {/* Platform */}
              <div>
                <label className="block text-sm font-medium text-text-tertiary mb-2">
                  Platform
                </label>
                <div className="grid grid-cols-1 gap-1.5">
                  {PLATFORMS.map((p) => (
                    <button
                      key={p.value}
                      onClick={() => setPlatform(p.value)}
                      className={`
                        flex items-center gap-2.5 rounded-xl border px-3 py-2.5 text-left text-sm transition-all
                        ${
                          platform === p.value
                            ? 'border-[#2563eb]/35 bg-[#eff6ff] text-text-primary dark:border-[#60a5fa]/40 dark:bg-[#172554]/40'
                            : 'border-border text-text-tertiary hover:border-[#93c5fd]/40 hover:bg-surface-2'
                        }
                      `}
                    >
                      <span
                        className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${
                          platform === p.value ? 'border-[#2563eb] dark:border-[#60a5fa]' : 'border-border'
                        }`}
                      >
                        {platform === p.value && (
                          <span className="block h-2 w-2 rounded-full bg-[#2563eb] dark:bg-[#60a5fa]" />
                        )}
                      </span>
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Creative type */}
              <div>
                <label className="block text-sm font-medium text-text-tertiary mb-2">
                  Kreativ turi
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {CREATIVE_TYPES.map((ct) => (
                    <button
                      key={ct.value}
                      onClick={() => setCreativeType(ct.value)}
                      className={`
                        rounded-lg border px-3 py-2 text-xs font-medium transition-all
                        ${
                          creativeType === ct.value
                            ? 'border-[#2563eb]/35 bg-[#eff6ff] text-text-primary dark:border-[#60a5fa]/40 dark:bg-[#172554]/40'
                            : 'border-border text-text-tertiary hover:border-[#93c5fd]/40 hover:bg-surface-2'
                        }
                      `}
                    >
                      {ct.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Goal */}
              <div>
                <label className="block text-sm font-medium text-text-tertiary mb-2">
                  Reklama maqsadi <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={goal}
                  onChange={(e) => setGoal(e.target.value)}
                  placeholder="Masalan: telefon sotish, kurs ro'yxatdan o'tkazish..."
                  className="w-full bg-surface-2 border border-border rounded-xl px-4 py-3 text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-border transition-all text-sm"
                />
              </div>

              {error && <Alert variant="error">{error}</Alert>}

              <Button
                fullWidth
                size="lg"
                loading={loading}
                onClick={handleScore}
                disabled={!file}
              >
                {loading ? 'Baholanmoqda...' : '🎯 Kreativni baholash'}
              </Button>
            </div>
          </Card>
        </div>

        {/* RIGHT: Results */}
        <div className="space-y-4">

          {/* Empty state */}
          {!result && !loading && (
            <Card>
              <div className="py-12 text-center">
                <div className="text-5xl mb-4">🎨</div>
                <p className="text-text-primary font-medium mb-2">
                  Kreativingizni baholaymiz
                </p>
                <p className="text-text-tertiary text-sm leading-relaxed max-w-xs mx-auto mb-6">
                  Rasm yoki video yuklang, platform tanlang va AI 10 parametr
                  bo'yicha baholab beradi
                </p>
                <div className="space-y-1.5 text-left max-w-xs mx-auto">
                  {Object.entries(PARAMETER_ICONS).map(([name, icon]) => (
                    <div key={name} className="flex items-center gap-2 text-xs text-text-tertiary">
                      <span>{icon}</span> {name}
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          )}

          {/* Loading */}
          {loading && (
            <Card>
              <div className="py-12 text-center">
                <div className="w-16 h-16 rounded-2xl bg-surface-2 border border-border flex items-center justify-center mx-auto mb-4">
                  <Spinner size="lg" />
                </div>
                <p className="text-text-primary font-medium mb-1">
                  Kreativ tahlil qilinmoqda...
                </p>
                <p className="text-text-tertiary text-sm mb-4">
                  GPT-4o Vision 10 parametrni tekshirmoqda
                </p>
                <div className="space-y-1.5 max-w-xs mx-auto">
                  {[
                    'Vizual sifat tekshirilmoqda...',
                    'Hook kuchi baholanmoqda...',
                    'Matn va CTA analizlanmoqda...',
                    'Platform talablari solishtirilmoqda...',
                    'Natija tayyorlanmoqda...',
                  ].map((msg, i) => (
                    <p key={i} className="text-text-tertiary text-xs">{msg}</p>
                  ))}
                </div>
              </div>
            </Card>
          )}

          {/* Results */}
          {result && !loading && (
            <div className="space-y-4">

              {/* Overall score */}
              <Card className={`border-2 bg-surface shadow-sm dark:bg-surface-elevated ${GRADE_CONFIG[result.grade].border}`}>
                <div className="flex items-center gap-5">
                  <CircularScore score={result.overallScore} grade={result.grade} />
                  <div className="flex-1">
                    <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border mb-2 ${GRADE_CONFIG[result.grade].bg} ${GRADE_CONFIG[result.grade].border} ${GRADE_CONFIG[result.grade].color}`}>
                      {result.verdict === 'ready' ? '✅ Reklamaga tayyor' :
                       result.verdict === 'needs_work' ? '⚠️ Yaxshilash kerak' :
                       '❌ Reklamaga tayyor emas'}
                    </div>
                    <p className="text-text-primary text-sm font-medium mb-1">
                      {GRADE_CONFIG[result.grade].label}
                    </p>
                    <p className="text-text-tertiary text-xs leading-relaxed">
                      {result.verdictText}
                    </p>
                    <div className="flex items-center gap-3 mt-2">
                      <span className="text-xs text-text-tertiary">
                        Est. CTR: <span className="text-text-secondary font-medium">{result.estimatedCtr}</span>
                      </span>
                    </div>
                  </div>
                </div>
                {!file && (
                  <div className="mt-3 pt-3 border-t border-border">
                    <p className="rounded-lg border border-[#fcd34d] bg-[#fffbeb] px-3 py-2 text-xs text-[#92400e] dark:border-[#b45309]/50 dark:bg-[#422006]/50 dark:text-[#fde68a]">
                      📌 Demo natija ko'rsatilmoqda — chap tarafdan o'z kreativingizni yuklang
                    </p>
                  </div>
                )}
              </Card>

              {/* Platform fit */}
              {Object.keys(result.platformFit).length > 0 && (
                <Card>
                  <p className="text-text-tertiary text-xs font-medium uppercase tracking-wide mb-3">
                    Platform mosligi
                  </p>
                  <div className="space-y-2">
                    {Object.entries(result.platformFit).map(([p, score]) => {
                      const labels: Record<string, string> = {
                        meta: '📘 Meta', google: '🔍 Google',
                        tiktok: '🎵 TikTok', youtube: '▶️ YouTube', telegram: '✈️ Telegram',
                      }
                      return (
                        <div key={p}>
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-text-tertiary">{labels[p] || p}</span>
                            <span
                              className="font-medium"
                              style={{
                                color: score >= 70 ? '#1d4ed8' : score >= 50 ? '#b45309' : '#b91c1c',
                              }}
                            >
                              {score}%
                            </span>
                          </div>
                          <div className="h-1.5 overflow-hidden rounded-full bg-surface-2 dark:bg-surface-2/80">
                            <div
                              className="h-full rounded-full transition-all duration-700"
                              style={{
                                width: `${score}%`,
                                backgroundColor: score >= 70 ? '#2563eb' : score >= 50 ? '#d97706' : '#dc2626',
                              }}
                            />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </Card>
              )}

              {/* 10 Parameters */}
              <Card padding="none">
                <div className="px-5 py-3 border-b border-border">
                  <p className="text-text-primary font-semibold text-sm">10 Parametr Tahlili</p>
                </div>
                <div className="divide-y divide-border dark:divide-border">
                  {result.parameters.map((param, i) => (
                    <div key={i} className="px-5 py-3">
                      <div className="flex items-start gap-3">
                        <StatusDot status={param.status} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1.5">
                            <p className="text-text-primary text-xs font-medium">
                              {PARAMETER_ICONS[param.name] || '•'} {param.name}
                            </p>
                          </div>
                          <ScoreBar score={param.score} />
                          <p className="text-text-tertiary text-xs mt-1.5 leading-relaxed">
                            {param.feedback}
                          </p>
                          {param.status !== 'good' && (
                            <p className="text-text-secondary text-xs mt-1 flex items-start gap-1">
                              <span className="shrink-0">→</span>
                              {param.tip}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Improvements */}
              {result.improvements.length > 0 && (
                <Card className="border border-[#fcd34d] bg-[#fffbeb] dark:border-[#b45309]/40 dark:bg-[#422006]/35">
                  <p className="mb-3 text-sm font-semibold text-[#b45309] dark:text-[#fcd34d]">
                    ⚡ Darhol o'zgartirish kerak
                  </p>
                  <div className="space-y-2">
                    {result.improvements.map((imp, i) => (
                      <div key={i} className="flex items-start gap-2.5 text-sm">
                        <span className="shrink-0 font-bold text-[#d97706] dark:text-[#fcd34d]">{i + 1}.</span>
                        <p className="text-text-secondary">{imp}</p>
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              {/* A/B test suggestion */}
              {result.abTestSuggestion && (
                <Card variant="outlined">
                  <div className="flex items-start gap-3">
                    <span className="text-xl shrink-0">🔬</span>
                    <div>
                      <p className="text-text-primary text-sm font-medium mb-1">A/B Test tavsiyasi</p>
                      <p className="text-text-tertiary text-sm leading-relaxed">
                        {result.abTestSuggestion}
                      </p>
                    </div>
                  </div>
                </Card>
              )}

              {/* Score another */}
              <Button
                variant="secondary"
                fullWidth
                onClick={handleReset}
              >
                + Yangi kreativ baholash
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}