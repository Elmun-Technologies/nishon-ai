'use client'
import { useState, useRef, useCallback } from 'react'
import { useWorkspaceStore } from '@/stores/workspace.store'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Alert } from '@/components/ui/Alert'
import { Badge } from '@/components/ui/Badge'
import { Spinner } from '@/components/ui/Spinner'
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

const GRADE_CONFIG = {
  A: { color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', label: 'Mukammal' },
  B: { color: 'text-blue-400',    bg: 'bg-blue-500/10',    border: 'border-blue-500/30',    label: 'Yaxshi' },
  C: { color: 'text-amber-400',   bg: 'bg-amber-500/10',   border: 'border-amber-500/30',   label: 'O\'rtacha' },
  D: { color: 'text-orange-400',  bg: 'bg-orange-500/10',  border: 'border-orange-500/30',  label: 'Zaif' },
  F: { color: 'text-red-400',     bg: 'bg-red-500/10',     border: 'border-red-500/30',     label: 'Yaroqsiz' },
}

// ─── SCORE BAR ────────────────────────────────────────────────────────────────

function ScoreBar({ score, max = 10 }: { score: number; max?: number }) {
  const pct = (score / max) * 100
  const color =
    pct >= 70 ? '#10B981' :
    pct >= 40 ? '#F59E0B' : '#EF4444'
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
      <span className="text-xs font-mono text-slate-400 dark:text-slate-500 w-8 text-right">
        {score}/{max}
      </span>
    </div>
  )
}

// ─── STATUS ICON ─────────────────────────────────────────────────────────────

function StatusDot({ status }: { status: 'good' | 'medium' | 'bad' }) {
  return (
    <div className={`w-2 h-2 rounded-full shrink-0 mt-1.5 ${
      status === 'good' ? 'bg-emerald-400' :
      status === 'medium' ? 'bg-amber-400' : 'bg-red-400'
    }`} />
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
        {/* Background circle */}
        <circle cx="60" cy="60" r="45" fill="none" stroke="#E5E7EB" strokeWidth="8"/>
        {/* Score arc */}
        <circle
          cx="60" cy="60" r="45"
          fill="none"
          stroke={
            score >= 70 ? '#10B981' :
            score >= 50 ? '#F59E0B' : '#EF4444'
          }
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
      setError('Fayl hajmi 10MB dan oshmasligi kerak')
      return
    }

    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'video/mp4']
    if (!allowed.includes(selectedFile.type)) {
      setError('Faqat JPG, PNG, WebP, GIF yoki MP4 formatlar qabul qilinadi')
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
    if (!file) { setError('Iltimos, fayl yuklang'); return }
    if (!goal) { setError('Reklama maqsadini kiriting'); return }

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
      setError(err.response?.data?.message || 'Baholashda xatolik yuz berdi')
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

      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-1">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">Creative Scorer</h1>
          <Badge variant="purple">🎨 AI Baholash</Badge>
        </div>
        <p className="text-slate-500 dark:text-slate-400 text-sm">
          Reklama kreativingizni yuklang — AI 10 parametr bo'yicha baholab,
          reklamaga tayyor yoki yo'qligini aytadi
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

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
                  ? 'border-slate-900 dark:border-slate-100 bg-slate-100 dark:bg-slate-800 cursor-copy'
                  : file
                  ? 'border-slate-200 dark:border-slate-700 cursor-default'
                  : 'border-slate-200 dark:border-slate-700 hover:border-slate-900 dark:border-slate-100/50 hover:bg-slate-50 dark:bg-slate-900/50 cursor-pointer'
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
                    className="absolute top-2 right-2 bg-black/60 text-slate-900 dark:text-slate-50 text-xs px-2 py-1 rounded-lg hover:bg-black/80 transition-colors"
                  >
                    ✕ O'chirish
                  </button>
                  {/* File info */}
                  <div className="absolute bottom-2 left-2 bg-black/60 text-slate-900 dark:text-slate-50 text-xs px-2 py-1 rounded-lg">
                    {file?.name} · {((file?.size ?? 0) / 1024).toFixed(0)}KB
                  </div>
                </div>
              ) : (
                <div className="text-center p-8">
                  <div className="text-5xl mb-3">
                    {isDragging ? '📂' : '🖼'}
                  </div>
                  <p className="text-slate-900 dark:text-slate-50 font-medium text-sm mb-1">
                    {isDragging
                      ? 'Faylni bu yerga tashlang'
                      : 'Rasm yoki video yuklang'}
                  </p>
                  <p className="text-slate-500 dark:text-slate-400 text-xs mb-3">
                    Suring yoki bosing · JPG, PNG, WebP, MP4 · Max 10MB
                  </p>
                  <div className="inline-flex items-center gap-2 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-1.5">
                    <span className="text-slate-700 dark:text-slate-300 text-xs">Fayl tanlash</span>
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
                <label className="block text-sm font-medium text-slate-400 dark:text-slate-500 mb-2">
                  Platform
                </label>
                <div className="grid grid-cols-1 gap-1.5">
                  {PLATFORMS.map((p) => (
                    <button
                      key={p.value}
                      onClick={() => setPlatform(p.value)}
                      className={`
                        flex items-center gap-2.5 px-3 py-2.5 rounded-xl border text-sm transition-all text-left
                        ${platform === p.value
                          ? 'border-slate-900 dark:border-slate-100 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-50'
                          : 'border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:border-slate-300 dark:border-slate-600'
                        }
                      `}
                    >
                      <span className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                        platform === p.value ? 'border-slate-900 dark:border-slate-100' : 'border-slate-600 dark:border-slate-500'
                      }`}>
                        {platform === p.value && (
                          <span className="w-2 h-2 rounded-full bg-slate-900 dark:bg-slate-100 block" />
                        )}
                      </span>
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Creative type */}
              <div>
                <label className="block text-sm font-medium text-slate-400 dark:text-slate-500 mb-2">
                  Kreativ turi
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {CREATIVE_TYPES.map((ct) => (
                    <button
                      key={ct.value}
                      onClick={() => setCreativeType(ct.value)}
                      className={`
                        px-3 py-2 rounded-lg border text-xs font-medium transition-all
                        ${creativeType === ct.value
                          ? 'border-slate-900 dark:border-slate-100 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                          : 'border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:border-slate-300 dark:border-slate-600'
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
                <label className="block text-sm font-medium text-slate-400 dark:text-slate-500 mb-2">
                  Reklama maqsadi <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={goal}
                  onChange={(e) => setGoal(e.target.value)}
                  placeholder="Masalan: telefon sotish, kurs ro'yxatdan o'tkazish..."
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-900 dark:text-slate-50 placeholder:text-slate-500 dark:text-slate-400 focus:outline-none focus:border-slate-900 dark:border-slate-100 transition-all text-sm"
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
                <p className="text-slate-900 dark:text-slate-50 font-medium mb-2">
                  Kreativingizni baholaymiz
                </p>
                <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed max-w-xs mx-auto mb-6">
                  Rasm yoki video yuklang, platform tanlang va AI 10 parametr
                  bo'yicha baholab beradi
                </p>
                <div className="space-y-1.5 text-left max-w-xs mx-auto">
                  {Object.entries(PARAMETER_ICONS).map(([name, icon]) => (
                    <div key={name} className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
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
                <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 flex items-center justify-center mx-auto mb-4">
                  <Spinner size="lg" />
                </div>
                <p className="text-slate-900 dark:text-slate-50 font-medium mb-1">
                  Kreativ tahlil qilinmoqda...
                </p>
                <p className="text-slate-500 dark:text-slate-400 text-sm mb-4">
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
                    <p key={i} className="text-slate-500 dark:text-slate-400 text-xs">{msg}</p>
                  ))}
                </div>
              </div>
            </Card>
          )}

          {/* Results */}
          {result && !loading && (
            <div className="space-y-4">

              {/* Overall score */}
              <Card className={`border-2 ${GRADE_CONFIG[result.grade].border}`}>
                <div className="flex items-center gap-5">
                  <CircularScore score={result.overallScore} grade={result.grade} />
                  <div className="flex-1">
                    <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border mb-2 ${GRADE_CONFIG[result.grade].bg} ${GRADE_CONFIG[result.grade].border} ${GRADE_CONFIG[result.grade].color}`}>
                      {result.verdict === 'ready' ? '✅ Reklamaga tayyor' :
                       result.verdict === 'needs_work' ? '⚠️ Yaxshilash kerak' :
                       '❌ Reklamaga tayyor emas'}
                    </div>
                    <p className="text-slate-900 dark:text-slate-50 text-sm font-medium mb-1">
                      {GRADE_CONFIG[result.grade].label}
                    </p>
                    <p className="text-slate-400 dark:text-slate-500 text-xs leading-relaxed">
                      {result.verdictText}
                    </p>
                    <div className="flex items-center gap-3 mt-2">
                      <span className="text-xs text-slate-500 dark:text-slate-400">
                        Est. CTR: <span className="text-slate-700 dark:text-slate-300 font-medium">{result.estimatedCtr}</span>
                      </span>
                    </div>
                  </div>
                </div>
                {!file && (
                  <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700">
                    <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                      📌 Demo natija ko'rsatilmoqda — chap tarafdan o'z kreativingizni yuklang
                    </p>
                  </div>
                )}
              </Card>

              {/* Platform fit */}
              {Object.keys(result.platformFit).length > 0 && (
                <Card>
                  <p className="text-slate-500 dark:text-slate-400 text-xs font-medium uppercase tracking-wide mb-3">
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
                            <span className="text-slate-400 dark:text-slate-500">{labels[p] || p}</span>
                            <span className={`font-medium ${score >= 70 ? 'text-emerald-400' : score >= 50 ? 'text-amber-400' : 'text-red-400'}`}>
                              {score}%
                            </span>
                          </div>
                          <div className="h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all duration-700"
                              style={{
                                width: `${score}%`,
                                backgroundColor: score >= 70 ? '#10B981' : score >= 50 ? '#F59E0B' : '#EF4444',
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
                <div className="px-5 py-3 border-b border-slate-200 dark:border-slate-700">
                  <p className="text-slate-900 dark:text-slate-50 font-semibold text-sm">10 Parametr Tahlili</p>
                </div>
                <div className="divide-y divide-slate-200 dark:divide-slate-700">
                  {result.parameters.map((param, i) => (
                    <div key={i} className="px-5 py-3">
                      <div className="flex items-start gap-3">
                        <StatusDot status={param.status} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1.5">
                            <p className="text-slate-900 dark:text-slate-50 text-xs font-medium">
                              {PARAMETER_ICONS[param.name] || '•'} {param.name}
                            </p>
                          </div>
                          <ScoreBar score={param.score} />
                          <p className="text-slate-500 dark:text-slate-400 text-xs mt-1.5 leading-relaxed">
                            {param.feedback}
                          </p>
                          {param.status !== 'good' && (
                            <p className="text-slate-700 dark:text-slate-300 text-xs mt-1 flex items-start gap-1">
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
                <Card className="border-amber-500/30 bg-amber-500/5">
                  <p className="text-amber-400 font-semibold text-sm mb-3">
                    ⚡ Darhol o'zgartirish kerak
                  </p>
                  <div className="space-y-2">
                    {result.improvements.map((imp, i) => (
                      <div key={i} className="flex items-start gap-2.5 text-sm">
                        <span className="text-amber-400 font-bold shrink-0">{i + 1}.</span>
                        <p className="text-slate-700 dark:text-slate-300">{imp}</p>
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
                      <p className="text-slate-900 dark:text-slate-50 text-sm font-medium mb-1">A/B Test tavsiyasi</p>
                      <p className="text-slate-400 dark:text-slate-500 text-sm leading-relaxed">
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