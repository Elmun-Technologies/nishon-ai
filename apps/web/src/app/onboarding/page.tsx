'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Alert } from '@/components/ui/Alert'
import { Spinner } from '@/components/ui/Spinner'
import { workspaces, aiAgent } from '@/lib/api-client'
import apiClient from '@/lib/api-client'
import { useWorkspaceStore } from '@/stores/workspace.store'

// ─── TYPES ────────────────────────────────────────────────────────────────────

interface FormData {
  // Step 1 — Business basics
  businessName: string
  industry: string
  businessAge: string
  targetLocation: string[]
  monthlyRevenue: string

  // Step 2 — Product details
  productCategory: string
  priceRange: { min: number; max: number }
  productStrengths: string[]
  deliveryType: string

  // Step 3 — Target audience
  ageGroups: string[]
  genders: string[]
  interests: string[]
  audienceIncome: string
  platforms: string[]

  // Step 4 — Goals & Budget
  primaryGoal: string
  secondaryGoals: string[]
  monthlyBudget: number
  previousAdExperience: string
  kpiPriority: string

  // Step 5 — Competition
  hasCompetitors: boolean
  competitorNames: string
  uniqueAdvantage: string[]
  marketPosition: string
}

interface VideoScript {
  scriptNumber: number
  hook: string        // 0-3 seconds — must stop the scroll
  body: string        // 4-25 seconds — main message
  cta: string         // last 5 seconds — clear action
  duration: string    // e.g. "30 soniya"
  format: string      // e.g. "Vertical 9:16 (Reels/Stories)"
}

interface BannerCopy {
  variant: number
  headline: string      // max 40 chars
  primaryText: string   // main ad text
  description: string   // short description
  ctaButton: string     // e.g. "Hozir xarid qiling"
}

interface GoogleAd {
  headlines: string[]   // 15 headlines, max 30 chars each
  descriptions: string[] // 4 descriptions, max 90 chars each
}

interface TikTokScript {
  scriptNumber: number
  style: string     // e.g. "UGC — shaxsiy guvohlik"
  hook: string      // first 3 seconds — CRITICAL
  body: string      // 4-30 seconds
  cta: string       // last 3 seconds
  hashtags: string[]
}

interface PlatformScripts {
  meta?: {
    videoScripts: VideoScript[]
    bannerCopies: BannerCopy[]
  }
  google?: GoogleAd
  tiktok?: { scripts: TikTokScript[] }
  youtube?: { hook: string; body: string; cta: string }
  telegram?: { posts: string[] }
}

interface ScriptResult {
  generatedAt: Date
  businessName: string
  platforms: PlatformScripts
  generalTips: string[]
}

// ─── STEP CONFIG ──────────────────────────────────────────────────────────────

const STEPS = [
  {
    id: 1,
    title: 'Biznes haqida',
    subtitle: 'Asosiy ma\'lumotlar',
    icon: '🏢',
    en: 'Business Info',
  },
  {
    id: 2,
    title: 'Mahsulot / Xizmat',
    subtitle: 'Nima sotasiz?',
    icon: '📦',
    en: 'Product Details',
  },
  {
    id: 3,
    title: 'Maqsadli auditoriya',
    subtitle: 'Kimga sotasiz?',
    icon: '🎯',
    en: 'Target Audience',
  },
  {
    id: 4,
    title: 'Maqsad va Byudjet',
    subtitle: 'Reklama parametrlari',
    icon: '💰',
    en: 'Goals & Budget',
  },
  {
    id: 5,
    title: 'Raqobat tahlili',
    subtitle: 'Bozordagi o\'rningiz',
    icon: '⚔️',
    en: 'Competition',
  },
  {
    id: 6,
    title: 'AI Tahlil',
    subtitle: 'Strategiya generatsiya qilinmoqda...',
    icon: '🤖',
    en: 'AI Analysis',
  },
  {
    id: 7,
    title: 'Tayyor!',
    subtitle: 'AI agentingiz faollashtirildi',
    icon: '🚀',
    en: 'Ready!',
  },
]

const INDUSTRIES = [
  { value: 'ecommerce', icon: '🛒', label: 'E-commerce' },
  { value: 'education', icon: '📚', label: 'Ta\'lim / Kurslar' },
  { value: 'real_estate', icon: '🏠', label: 'Ko\'chmas mulk' },
  { value: 'beauty', icon: '💄', label: 'Go\'zallik / Kosmetika' },
  { value: 'food', icon: '🍕', label: 'Ovqat / Restoran' },
  { value: 'fitness', icon: '💪', label: 'Fitness / Sog\'liq' },
  { value: 'services', icon: '⚙️', label: 'Professional xizmatlar' },
  { value: 'tech', icon: '💻', label: 'Texnologiya / SaaS' },
  { value: 'retail', icon: '👗', label: 'Savdo / Moda' },
  { value: 'auto', icon: '🚗', label: 'Avtomobil' },
  { value: 'travel', icon: '✈️', label: 'Sayohat / Turizm' },
  { value: 'other', icon: '📋', label: 'Boshqa' },
]

const LOCATIONS = [
  { value: 'tashkent', label: '🏙️ Toshkent shahri' },
  { value: 'uzbekistan', label: '🇺🇿 O\'zbekiston (barcha viloyatlar)' },
  { value: 'kazakhstan', label: '🇰🇿 Qozog\'iston' },
  { value: 'ukraine', label: '🇺🇦 Ukraina' },
  { value: 'georgia', label: '🇬🇪 Gruziya' },
  { value: 'russia', label: '🇷🇺 Rossiya' },
  { value: 'cis', label: '🌍 MDH (barcha mamlakatlar)' },
  { value: 'global', label: '🌐 Global' },
]

const REVENUE_RANGES = [
  { value: 'pre_revenue', label: 'Hali daromad yo\'q (start-up)' },
  { value: 'under_1k', label: '$1,000 gacha / oy' },
  { value: '1k_5k', label: '$1,000 – $5,000 / oy' },
  { value: '5k_20k', label: '$5,000 – $20,000 / oy' },
  { value: '20k_plus', label: '$20,000+ / oy' },
]

const PRODUCT_CATEGORIES = [
  { value: 'physical', icon: '📦', label: 'Jismoniy mahsulot' },
  { value: 'digital', icon: '💾', label: 'Raqamli mahsulot' },
  { value: 'service', icon: '🤝', label: 'Xizmat' },
  { value: 'subscription', icon: '🔄', label: 'Obuna / Membership' },
  { value: 'course', icon: '🎓', label: 'Kurs / Ta\'lim' },
  { value: 'software', icon: '⚡', label: 'Dasturiy ta\'minot' },
]

const PRODUCT_STRENGTHS = [
  '💰 Eng arzon narx',
  '⭐ Yuqori sifat',
  '⚡ Tez yetkazib berish',
  '🎁 Keng assortiment',
  '🔒 Kafolat / Ishonch',
  '🌿 Ekologik / Tabiiy',
  '🏆 Brend nufuzi',
  '🛠️ Maxsus buyurtma',
  '💡 Innovatsion yechim',
  '🤝 Yaxshi xizmat',
]

const DELIVERY_TYPES = [
  { value: 'delivery', label: '🚚 Yetkazib berish' },
  { value: 'pickup', label: '🏪 Olib ketish' },
  { value: 'online', label: '💻 Onlayn (raqamli)' },
  { value: 'offline', label: '📍 Ofisda / Do\'konda' },
  { value: 'both', label: '🔄 Ikkalasi ham' },
]

const AGE_GROUPS = [
  { value: '13-17', label: '13–17' },
  { value: '18-24', label: '18–24' },
  { value: '25-34', label: '25–34' },
  { value: '35-44', label: '35–44' },
  { value: '45-54', label: '45–54' },
  { value: '55+', label: '55+' },
]

const INTERESTS = [
  '🏋️ Sport va fitness',
  '👗 Moda va uslub',
  '💄 Go\'zallik va parvarish',
  '🍕 Oziq-ovqat va restoran',
  '✈️ Sayohat',
  '💻 Texnologiya',
  '📚 Ta\'lim',
  '🏠 Uy-joy va dizayn',
  '💰 Investitsiya va moliya',
  '🎮 O\'yinlar',
  '🚗 Avtomobil',
  '👶 Oila va bolalar',
  '🎵 Musiqa va ko\'ngilochar',
  '📸 Fotografiya',
  '🌿 Sog\'lom turmush',
]

const AD_PLATFORMS = [
  { value: 'meta', icon: '📘', label: 'Facebook / Instagram' },
  { value: 'google', icon: '🔍', label: 'Google Ads' },
  { value: 'tiktok', icon: '🎵', label: 'TikTok' },
  { value: 'youtube', icon: '▶️', label: 'YouTube' },
  { value: 'telegram', icon: '✈️', label: 'Telegram' },
]

const GOALS = [
  { value: 'leads', icon: '🎯', label: 'Lead yig\'ish', desc: 'Telefon, email, so\'rov' },
  { value: 'sales', icon: '🛒', label: 'Savdoni oshirish', desc: 'To\'g\'ridan-to\'g\'ri xarid' },
  { value: 'awareness', icon: '📢', label: 'Brendni targ\'ib qilish', desc: 'Ko\'proq odamga tanish bo\'lish' },
  { value: 'traffic', icon: '🌐', label: 'Sayt trafigi', desc: 'Veb-saytga tashrif' },
  { value: 'app', icon: '📱', label: 'Ilova yuklab olish', desc: 'Mobil ilova' },
]

const SECONDARY_GOALS = [
  '📞 Qo\'ng\'iroqlar soni oshsin',
  '💬 Messenjerlarda so\'rovlar',
  '⭐ Brend obro\'si oshsin',
  '🔄 Qayta xaridorlar',
  '📧 Email ro\'yxat to\'ldirish',
  '🎁 Aksiya / Taklif tarqatish',
]

const KPI_PRIORITIES = [
  { value: 'cpa', label: '💰 CPA — Eng arzon lead/xarid' },
  { value: 'roas', label: '📈 ROAS — Eng yuqori daromad' },
  { value: 'reach', label: '👥 Qamrov — Ko\'proq odamga yetish' },
  { value: 'ctr', label: '👆 CTR — Ko\'proq klik olish' },
]

const UNIQUE_ADVANTAGES = [
  '🏷️ Raqobatdan arzonroq',
  '⭐ Sifat kafolati',
  '🚀 Tez yetkazib berish',
  '🎁 Sovg\'a / Bonus',
  '📞 24/7 qo\'llab-quvvatlash',
  '🔄 Qaytarish kafolati',
  '🌟 Eksklyuziv mahsulot',
  '🏆 Bozordagi yetakchi',
]

const MARKET_POSITIONS = [
  { value: 'leader', label: '🏆 Bozor yetakchisi' },
  { value: 'challenger', label: '⚔️ Raqobatchi (2-3 o\'rin)' },
  { value: 'niche', label: '🎯 Niche o\'yinchi' },
  { value: 'new', label: '🌱 Yangi kiruvchi' },
]

const BUDGET_PRESETS = [100, 200, 300, 500, 750, 1000, 1500, 2000, 3000, 5000]

// ─── HELPER COMPONENTS ────────────────────────────────────────────────────────

function OptionCard({
  selected,
  onClick,
  icon,
  label,
  desc,
}: {
  selected: boolean
  onClick: () => void
  icon?: string
  label: string
  desc?: string
}) {
  return (
    <button
      onClick={onClick}
      type="button"
      className={`
        text-left p-4 rounded-xl border transition-all duration-200 w-full
        ${selected
          ? 'border-[#111827] bg-[#F3F4F6] ring-1 ring-[#111827]/30'
          : 'border-[#E5E7EB] hover:border-[#D1D5DB] hover:bg-[#F9FAFB]'
        }
      `}
    >
      {icon && <span className="text-xl mb-2 block">{icon}</span>}
      <p
        className={`font-medium text-sm ${
          selected ? 'text-[#111827]' : 'text-[#9CA3AF]'
        }`}
      >
        {label}
      </p>
      {desc && <p className="text-[#6B7280] text-xs mt-1">{desc}</p>}
    </button>
  )
}

function TagSelector({
  options,
  selected,
  onToggle,
  max,
}: {
  options: string[]
  selected: string[]
  onToggle: (v: string) => void
  max?: number
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => {
        const isSelected = selected.includes(opt)
        const isDisabled =
          !isSelected && max !== undefined && selected.length >= max
        return (
          <button
            key={opt}
            type="button"
            disabled={isDisabled}
            onClick={() => onToggle(opt)}
            className={`
              text-sm px-3 py-1.5 rounded-lg border transition-all duration-200
              ${
                isSelected
                  ? 'border-[#111827] bg-[#F3F4F6] text-[#374151] font-medium'
                  : isDisabled
                    ? 'border-[#E5E7EB] text-[#3A3A4A] cursor-not-allowed'
                    : 'border-[#E5E7EB] text-[#6B7280] hover:border-[#D1D5DB] hover:text-[#111827]'
              }
            `}
          >
            {opt}
          </button>
        )
      })}
    </div>
  )
}

// ─── MAIN COMPONENT ──────────────────────────────────────────────────────────

const DEFAULT_FORM: FormData = {
  businessName: '',
  industry: '',
  businessAge: '',
  targetLocation: [],
  monthlyRevenue: '',
  productCategory: '',
  priceRange: { min: 10, max: 200 },
  productStrengths: [],
  deliveryType: '',
  ageGroups: [],
  genders: [],
  interests: [],
  audienceIncome: '',
  platforms: [],
  primaryGoal: '',
  secondaryGoals: [],
  monthlyBudget: 300,
  previousAdExperience: '',
  kpiPriority: '',
  hasCompetitors: true,
  competitorNames: '',
  uniqueAdvantage: [],
  marketPosition: '',
}

export default function OnboardingPage() {
  const router = useRouter()
  const { setCurrentWorkspace } = useWorkspaceStore()

  const [step, setStep] = useState(1)
  const [form, setForm] = useState<FormData>(DEFAULT_FORM)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [strategy, setStrategy] = useState<any>(null)
  const [analysisStep, setAnalysisStep] = useState(0)

  const [scripts, setScripts] = useState<ScriptResult | null>(null)
  const [scriptLoading, setScriptLoading] = useState(false)
  const [activeScriptTab, setActiveScriptTab] = useState('meta')
  const [scriptError, setScriptError] = useState('')
  // Track created workspaceId so user can skip to dashboard if strategy fails
  const [createdWorkspaceId, setCreatedWorkspaceId] = useState<string | null>(null)

  function update<K extends keyof FormData>(field: K, value: FormData[K]) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  function toggleArray(field: keyof FormData, value: string) {
    const arr = form[field] as string[]
    const next = arr.includes(value)
      ? arr.filter((v) => v !== value)
      : [...arr, value]
    update(field as any, next as any)
  }

  // ─── VALIDATION ────────────────────────────────────────────────────────────

  function validateStep(): string | null {
    if (step === 1) {
      if (!form.businessName.trim() || form.businessName.trim().length < 2)
        return 'Biznes nomini kiriting (kamida 2 belgi)'
      if (!form.industry) return 'Soha tanlang'
      if (form.targetLocation.length === 0)
        return 'Kamida bitta hududni tanlang'
      if (!form.monthlyRevenue)
        return 'Oylik daromad darajasini belgilang'
    }
    if (step === 2) {
      if (!form.productCategory)
        return 'Mahsulot / xizmat turini tanlang'
      if (form.productStrengths.length === 0)
        return 'Kamida bitta ustunlik tanlang'
      if (!form.deliveryType) return 'Yetkazib berish turini tanlang'
    }
    if (step === 3) {
      if (form.ageGroups.length === 0)
        return 'Maqsadli yosh guruhini tanlang'
      if (form.interests.length < 2)
        return 'Kamida 2 ta qiziqish tanlang'
      if (form.platforms.length === 0)
        return 'Kamida bitta reklama platformasini tanlang'
    }
    if (step === 4) {
      if (!form.primaryGoal) return 'Asosiy maqsadni tanlang'
      if (!form.kpiPriority) return 'KPI ustuvorligini belgilang'
      if (form.monthlyBudget < 50) return 'Minimal byudjet $50'
    }
    if (step === 5) {
      if (form.uniqueAdvantage.length === 0)
        return 'Kamida bitta ustunligingizni belgilang'
      if (!form.marketPosition)
        return 'Bozordagi o\'rningizni belgilang'
    }
    return null
  }

  // ─── NAVIGATION ────────────────────────────────────────────────────────────

  async function handleNext() {
    setError('')
    const err = validateStep()
    if (err) {
      setError(err)
      return
    }

    if (step === 5) {
      await handleGenerate()
    } else {
      setStep((s) => s + 1)
    }
  }

  function handleBack() {
    setError('')
    if (step > 1 && step < 6) setStep((s) => s - 1)
  }

  // ─── AI GENERATION ────────────────────────────────────────────────────────

  async function generateScripts(
    workspaceId: string,
    strategyData: any,
    formData: typeof form
  ) {
    setScriptLoading(true)
    setScriptError('')

    try {
      const res = await apiClient.post(
        `/ai-agent/generate-scripts/${workspaceId}`,
        {
          platforms: formData.platforms,
          businessName: formData.businessName,
          industry: formData.industry,
          productDescription: (formData as any).productDescription,
          targetAudience: (formData as any).targetAudience,
          goal: formData.primaryGoal || 'leads',
          monthlyBudget: formData.monthlyBudget,
          targetLocation: formData.targetLocation,
          productStrengths: formData.productStrengths,
          uniqueAdvantage: formData.uniqueAdvantage,
          strategy: strategyData,
        }
      )
      setScripts(res.data)
      setActiveScriptTab(formData.platforms[0] || 'meta')
    } catch (err: any) {
      setScriptError('Skriptlar yaratishda xatolik. Siz keyinroq qayta urining.')
      console.error('Script generation error:', err)
    } finally {
      setScriptLoading(false)
    }
  }

  async function handleGenerate() {
    setLoading(true)
    setStep(6)
    setAnalysisStep(0)

    const ANALYSIS_STEPS = [
      'Biznes profilingiz tahlil qilinmoqda...',
      'Raqobat landshafti o\'rganilmoqda...',
      'Maqsadli auditoriya segmentatsiyasi...',
      'Platform strategiyasi ishlab chiqilmoqda...',
      'Byudjet taqsimoti hisoblanmoqda...',
      'KPI prognozlari tuzilmoqda...',
      'Kreativ ko\'rsatmalar yaratilmoqda...',
      'Strategiya yakunlanmoqda...',
    ]

    const interval = setInterval(() => {
      setAnalysisStep((prev) =>
        prev < ANALYSIS_STEPS.length - 1 ? prev + 1 : prev
      )
    }, 1800)

    try {
      const productDescription = [
        `Mahsulot turi: ${form.productCategory}`,
        `Narx diapazoni: $${form.priceRange.min} – $${form.priceRange.max}`,
        `Asosiy ustunliklar: ${form.productStrengths.join(', ')}`,
        `Yetkazib berish: ${form.deliveryType}`,
      ].join('. ')

      const targetAudience = [
        `Yosh: ${form.ageGroups.join(', ')}`,
        `Jins: ${form.genders.length > 0 ? form.genders.join(', ') : 'Hammasi'}`,
        `Qiziqishlar: ${form.interests.join(', ')}`,
        `Daromad darajasi: ${form.audienceIncome || 'O\'rtacha'}`,
        `Afzal platformalar: ${form.platforms.join(', ')}`,
      ].join('. ')

      const wsRes = await workspaces.create({
        name: form.businessName.trim(),
        industry: form.industry,
        productDescription,
        targetAudience,
        monthlyBudget: form.monthlyBudget,
        goal: form.primaryGoal || 'leads',
      })

      const workspaceId = wsRes.data.id
      setCreatedWorkspaceId(workspaceId)
      const stratRes = await aiAgent.generateStrategy(workspaceId)
      const generated = stratRes.data

      setStrategy(generated)
      setCurrentWorkspace({ ...wsRes.data, aiStrategy: generated })
      clearInterval(interval)
      await new Promise((r) => setTimeout(r, 600))
      setStep(7)

      generateScripts(
        workspaceId,
        generated,
        { ...(form as any), productDescription, targetAudience } as any
      )

    } catch (err: any) {
      clearInterval(interval)
      const rawMsg: string = err?.response?.data?.message || err?.message || ''
      // Strip HTML from error message (e.g. WAF block pages)
      const isHtml = rawMsg.includes('<!doctype') || rawMsg.includes('<html') || rawMsg.includes('aliyun_waf')
      const cleanMsg = isHtml
        ? 'AI provayder vaqtincha mavjud emas. Bir necha daqiqadan keyin qayta urinib ko\'ring.'
        : rawMsg || 'Server javob bermadi. Bir necha soniyadan keyin qayta urinib ko\'ring.'
      const msg = Array.isArray(cleanMsg) ? (cleanMsg as string[]).join(', ') : cleanMsg
      // Also clean Agent Router error prefix for display
      const displayMsg = msg.replace(/^Agent Router error \[.*?\].*?attempt=\d+:\s*/, '')
      setError(displayMsg)
      setStep(5)
    } finally {
      setLoading(false)
    }
  }

  // ─── RENDER ───────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-[#F9FAFB] flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Logo */}
        <div className="text-center mb-5">
          <h1 className="text-xl font-bold text-[#111827]">
            Nishon <span className="text-[#374151]">AI</span>
          </h1>
        </div>

        {/* Progress bar */}
        <div className="mb-6">
          <div className="flex gap-1 mb-2">
            {STEPS.map((s) => (
              <div
                key={s.id}
                className={`flex-1 h-1.5 rounded-full transition-all duration-500 ${
                  s.id <= step ? 'bg-[#111827]' : 'bg-[#F3F4F6]'
                }`}
              />
            ))}
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-[#374151] font-medium">
              {step <= 5 ? `${step}/5 qadam` : step === 6 ? 'Tahlil...' : 'Tayyor!'}
            </span>
            <span className="text-[#6B7280]">{STEPS[step - 1]?.title}</span>
          </div>
        </div>

        {/* Card */}
        <div className="bg-white border border-[#E5E7EB] rounded-2xl overflow-hidden">
          {/* Header */}
          <div className="px-7 pt-7 pb-5 border-b border-[#E5E7EB]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#F3F4F6] border border-[#D1D5DB] flex items-center justify-center text-xl">
                {STEPS[step - 1]?.icon}
              </div>
              <div>
                <h2 className="text-xl font-bold text-[#111827]">{STEPS[step - 1]?.title}</h2>
                <p className="text-[#6B7280] text-sm">{STEPS[step - 1]?.subtitle}</p>
              </div>
            </div>
          </div>

          {/* Body */}
          <div className="px-7 py-6 space-y-6">
            {/* ══ STEP 1: Business basics ══ */}
            {step === 1 && (
              <>
                {/* Business name */}
                <div>
                  <label className="block text-sm font-medium text-[#9CA3AF] mb-2">
                    Biznes / brend nomi
                  </label>
                  <input
                    type="text"
                    value={form.businessName}
                    onChange={(e) => update('businessName', e.target.value)}
                    placeholder="Masalan: TechShop Uzbekistan"
                    className="w-full bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl px-4 py-3 text-[#111827] placeholder:text-[#6B7280] focus:outline-none focus:border-[#111827] focus:ring-1 focus:ring-[#111827]/20 transition-all"
                  />
                </div>

                {/* Industry grid */}
                <div>
                  <label className="block text-sm font-medium text-[#9CA3AF] mb-3">
                    Soha
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {INDUSTRIES.map((ind) => (
                      <OptionCard
                        key={ind.value}
                        selected={form.industry === ind.value}
                        onClick={() => update('industry', ind.value)}
                        icon={ind.icon}
                        label={ind.label}
                      />
                    ))}
                  </div>
                </div>

                {/* Business age */}
                <div>
                  <label className="block text-sm font-medium text-[#9CA3AF] mb-3">
                    Biznes yoshi
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { value: 'new', label: '🌱 Yangi (< 6 oy)' },
                      { value: '1year', label: '📈 1 yilgacha' },
                      { value: '3year', label: '💼 1–3 yil' },
                      { value: 'mature', label: '🏆 3+ yil' },
                    ].map((opt) => (
                      <OptionCard
                        key={opt.value}
                        selected={form.businessAge === opt.value}
                        onClick={() => update('businessAge', opt.value)}
                        label={opt.label}
                      />
                    ))}
                  </div>
                </div>

                {/* Target locations */}
                <div>
                  <label className="block text-sm font-medium text-[#9CA3AF] mb-3">
                    Maqsadli hudud{' '}
                    <span className="text-[#6B7280] font-normal">
                      (bir nechta tanlash mumkin)
                    </span>
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {LOCATIONS.map((loc) => {
                      const selected = form.targetLocation.includes(loc.value)
                      return (
                        <button
                          key={loc.value}
                          type="button"
                          onClick={() => toggleArray('targetLocation', loc.value)}
                          className={`
                            flex items-center gap-2.5 px-4 py-2.5 rounded-xl border text-sm transition-all
                            ${
                              selected
                                ? 'border-[#111827] bg-[#F3F4F6] text-[#111827] font-medium'
                                : 'border-[#E5E7EB] text-[#9CA3AF] hover:border-[#D1D5DB]'
                            }
                          `}
                        >
                          <span
                            className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                              selected
                                ? 'bg-[#111827] border-[#111827]'
                                : 'border-[#4B5563]'
                            }`}
                          >
                            {selected && <span className="text-[#111827] text-xs">✓</span>}
                          </span>
                          {loc.label}
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Monthly revenue */}
                <div>
                  <label className="block text-sm font-medium text-[#9CA3AF] mb-3">
                    Hozirgi oylik daromad
                  </label>
                  <div className="space-y-2">
                    {REVENUE_RANGES.map((r) => (
                      <button
                        key={r.value}
                        type="button"
                        onClick={() => update('monthlyRevenue', r.value)}
                        className={`
                          w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-sm transition-all text-left
                          ${
                            form.monthlyRevenue === r.value
                              ? 'border-[#111827] bg-[#F3F4F6] text-[#111827]'
                              : 'border-[#E5E7EB] text-[#9CA3AF] hover:border-[#D1D5DB]'
                          }
                        `}
                      >
                        <span
                          className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                            form.monthlyRevenue === r.value
                              ? 'border-[#111827]'
                              : 'border-[#4B5563]'
                          }`}
                        >
                          {form.monthlyRevenue === r.value && (
                            <span className="w-2 h-2 rounded-full bg-[#111827] block" />
                          )}
                        </span>
                        {r.label}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* ══ STEP 2: Product details ══ */}
            {step === 2 && (
              <>
                {/* Product category */}
                <div>
                  <label className="block text-sm font-medium text-[#9CA3AF] mb-3">
                    Mahsulot / Xizmat turi
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {PRODUCT_CATEGORIES.map((cat) => (
                      <OptionCard
                        key={cat.value}
                        selected={form.productCategory === cat.value}
                        onClick={() => update('productCategory', cat.value)}
                        icon={cat.icon}
                        label={cat.label}
                      />
                    ))}
                  </div>
                </div>

                {/* Price range */}
                <div>
                  <label className="block text-sm font-medium text-[#9CA3AF] mb-3">
                    Narx diapazoni
                  </label>
                  <div className="bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl p-4">
                    <div className="flex items-center justify-between mb-4">
                      <div className="text-center">
                        <p className="text-[#6B7280] text-xs mb-1">Minimal</p>
                        <p className="text-[#111827] font-bold text-lg">${form.priceRange.min}</p>
                      </div>
                      <div className="text-[#6B7280] text-sm">—</div>
                      <div className="text-center">
                        <p className="text-[#6B7280] text-xs mb-1">Maksimal</p>
                        <p className="text-[#374151] font-bold text-lg">${form.priceRange.max}</p>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <label className="text-xs text-[#6B7280] block mb-1">
                          Minimal narx: ${form.priceRange.min}
                        </label>
                        <input
                          type="range"
                          min={1}
                          max={5000}
                          step={5}
                          value={form.priceRange.min}
                          onChange={(e) =>
                            update('priceRange', {
                              ...form.priceRange,
                              min: Number(e.target.value),
                            })
                          }
                          className="w-full accent-[#7C3AED]"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-[#6B7280] block mb-1">
                          Maksimal narx: ${form.priceRange.max}
                        </label>
                        <input
                          type="range"
                          min={1}
                          max={10000}
                          step={10}
                          value={form.priceRange.max}
                          onChange={(e) =>
                            update('priceRange', {
                              ...form.priceRange,
                              max: Number(e.target.value),
                            })
                          }
                          className="w-full accent-[#7C3AED]"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Product strengths */}
                <div>
                  <label className="block text-sm font-medium text-[#9CA3AF] mb-1">
                    Asosiy ustunliklar
                    <span className="text-[#6B7280] font-normal ml-2">(bir nechta tanlang)</span>
                  </label>
                  <p className="text-[#6B7280] text-xs mb-3">
                    Reklama matni ana shu ustunliklarga asoslanadi
                  </p>
                  <TagSelector
                    options={PRODUCT_STRENGTHS}
                    selected={form.productStrengths}
                    onToggle={(v) => toggleArray('productStrengths', v)}
                  />
                </div>

                {/* Delivery type */}
                <div>
                  <label className="block text-sm font-medium text-[#9CA3AF] mb-3">
                    Yetkazib berish usuli
                  </label>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {DELIVERY_TYPES.map((d) => (
                      <OptionCard
                        key={d.value}
                        selected={form.deliveryType === d.value}
                        onClick={() => update('deliveryType', d.value)}
                        label={d.label}
                      />
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* ══ STEP 3: Target audience ══ */}
            {step === 3 && (
              <>
                {/* Age groups */}
                <div>
                  <label className="block text-sm font-medium text-[#9CA3AF] mb-3">
                    Maqsadli yosh guruhlar
                    <span className="text-[#6B7280] font-normal ml-2">(bir nechta tanlang)</span>
                  </label>
                  <div className="flex gap-2 flex-wrap">
                    {AGE_GROUPS.map((ag) => {
                      const sel = form.ageGroups.includes(ag.value)
                      return (
                        <button
                          key={ag.value}
                          type="button"
                          onClick={() => toggleArray('ageGroups', ag.value)}
                          className={`
                            px-5 py-2.5 rounded-xl border font-medium text-sm transition-all
                            ${
                              sel
                                ? 'border-[#111827] bg-[#F3F4F6] text-[#374151]'
                                : 'border-[#E5E7EB] text-[#6B7280] hover:border-[#D1D5DB]'
                            }
                          `}
                        >
                          {ag.label}
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Gender */}
                <div>
                  <label className="block text-sm font-medium text-[#9CA3AF] mb-3">
                    Jins
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { value: 'male', label: '👨 Erkaklar' },
                      { value: 'female', label: '👩 Ayollar' },
                      { value: 'all', label: '👥 Hammasi' },
                    ].map((g) => (
                      <OptionCard
                        key={g.value}
                        selected={form.genders.includes(g.value)}
                        onClick={() => {
                          if (g.value === 'all') {
                            update('genders', ['all'])
                          } else {
                            const without = form.genders.filter(
                              (v) => v !== 'all' && v !== g.value
                            )
                            update('genders', [...without, g.value])
                          }
                        }}
                        label={g.label}
                      />
                    ))}
                  </div>
                </div>

                {/* Audience income */}
                <div>
                  <label className="block text-sm font-medium text-[#9CA3AF] mb-3">
                    Auditoriya daromad darajasi
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { value: 'low', label: '💵 Past (< $200/oy)' },
                      { value: 'mid', label: '💰 O\'rtacha ($200–800/oy)' },
                      { value: 'high', label: '💎 Yuqori ($800–2000/oy)' },
                      { value: 'vip', label: '👑 Premium ($2000+/oy)' },
                    ].map((inc) => (
                      <OptionCard
                        key={inc.value}
                        selected={form.audienceIncome === inc.value}
                        onClick={() => update('audienceIncome', inc.value)}
                        label={inc.label}
                      />
                    ))}
                  </div>
                </div>

                {/* Interests */}
                <div>
                  <label className="block text-sm font-medium text-[#9CA3AF] mb-1">
                    Qiziqishlar
                    <span className="text-[#6B7280] font-normal ml-2">(kamida 2 ta)</span>
                  </label>
                  <p className="text-[#6B7280] text-xs mb-3">
                    Meta va TikTok mana shu qiziqishlar bo'yicha targetlaydi
                  </p>
                  <TagSelector
                    options={INTERESTS}
                    selected={form.interests}
                    onToggle={(v) => toggleArray('interests', v)}
                  />
                </div>

                {/* Preferred platforms */}
                <div>
                  <label className="block text-sm font-medium text-[#9CA3AF] mb-3">
                    Auditoriyangiz qaysi platformada ko'p?
                  </label>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {AD_PLATFORMS.map((p) => (
                      <button
                        key={p.value}
                        type="button"
                        onClick={() => toggleArray('platforms', p.value)}
                        className={`
                          flex items-center gap-2.5 px-4 py-3 rounded-xl border text-sm transition-all
                          ${
                            form.platforms.includes(p.value)
                              ? 'border-[#111827] bg-[#F3F4F6] text-[#111827] font-medium'
                              : 'border-[#E5E7EB] text-[#9CA3AF] hover:border-[#D1D5DB]'
                          }
                        `}
                      >
                        <span className="text-base">{p.icon}</span>
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* ══ STEP 4: Goals & Budget ══ */}
            {step === 4 && (
              <>
                {/* Primary goal */}
                <div>
                  <label className="block text-sm font-medium text-[#9CA3AF] mb-3">
                    Asosiy reklama maqsadi
                  </label>
                  <div className="grid grid-cols-1 gap-2">
                    {GOALS.map((g) => (
                      <OptionCard
                        key={g.value}
                        selected={form.primaryGoal === g.value}
                        onClick={() => update('primaryGoal', g.value)}
                        icon={g.icon}
                        label={g.label}
                        desc={g.desc}
                      />
                    ))}
                  </div>
                </div>

                {/* Secondary goals */}
                <div>
                  <label className="block text-sm font-medium text-[#9CA3AF] mb-1">
                    Qo'shimcha maqsadlar
                    <span className="text-[#6B7280] font-normal ml-2">(ixtiyoriy)</span>
                  </label>
                  <TagSelector
                    options={SECONDARY_GOALS}
                    selected={form.secondaryGoals}
                    onToggle={(v) => toggleArray('secondaryGoals', v)}
                    max={3}
                  />
                </div>

                {/* KPI priority */}
                <div>
                  <label className="block text-sm font-medium text-[#9CA3AF] mb-3">
                    Eng muhim KPI (asosiy ko'rsatkich)
                  </label>
                  <div className="space-y-2">
                    {KPI_PRIORITIES.map((kpi) => (
                      <button
                        key={kpi.value}
                        type="button"
                        onClick={() => update('kpiPriority', kpi.value)}
                        className={`
                          w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-sm transition-all text-left
                          ${
                            form.kpiPriority === kpi.value
                              ? 'border-[#111827] bg-[#F3F4F6] text-[#111827]'
                              : 'border-[#E5E7EB] text-[#9CA3AF] hover:border-[#D1D5DB]'
                          }
                        `}
                      >
                        <span
                          className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                            form.kpiPriority === kpi.value
                              ? 'border-[#111827]'
                              : 'border-[#4B5563]'
                          }`}
                        >
                          {form.kpiPriority === kpi.value && (
                            <span className="w-2 h-2 rounded-full bg-[#111827] block" />
                          )}
                        </span>
                        {kpi.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Previous experience */}
                <div>
                  <label className="block text-sm font-medium text-[#9CA3AF] mb-3">
                    Avvalgi reklama tajribangiz
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { value: 'none', label: '🌱 Hech qachon bermagan' },
                      { value: 'basic', label: '📱 Ozgina tajriba bor' },
                      { value: 'medium', label: '📊 Muntazam beraman' },
                      { value: 'expert', label: '🏆 Tajribali' },
                    ].map((exp) => (
                      <OptionCard
                        key={exp.value}
                        selected={form.previousAdExperience === exp.value}
                        onClick={() => update('previousAdExperience', exp.value)}
                        label={exp.label}
                      />
                    ))}
                  </div>
                </div>

                {/* Budget */}
                <div>
                  <label className="block text-sm font-medium text-[#9CA3AF] mb-3">
                    Oylik reklama byudjeti
                  </label>
                  <div className="bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl p-4 mb-3">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[#6B7280] text-sm">Byudjet</span>
                      <span className="text-2xl font-bold text-[#374151]">
                        ${form.monthlyBudget.toLocaleString()}
                        <span className="text-sm font-normal text-[#6B7280]">/oy</span>
                      </span>
                    </div>
                    <input
                      type="range"
                      min={50}
                      max={10000}
                      step={50}
                      value={form.monthlyBudget}
                      onChange={(e) => update('monthlyBudget', Number(e.target.value))}
                      className="w-full accent-[#7C3AED]"
                    />
                    <div className="flex justify-between text-xs text-[#6B7280] mt-1">
                      <span>$50</span>
                      <span>$10,000</span>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {BUDGET_PRESETS.map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => update('monthlyBudget', p)}
                        className={`
                          text-xs px-3 py-1.5 rounded-lg border transition-all
                          ${
                            form.monthlyBudget === p
                              ? 'border-[#111827] bg-[#F3F4F6] text-[#374151]'
                              : 'border-[#E5E7EB] text-[#6B7280] hover:border-[#D1D5DB]'
                          }
                        `}
                      >
                        ${p >= 1000 ? `${p / 1000}K` : p}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* ══ STEP 5: Competition ══ */}
            {step === 5 && (
              <>
                {/* Has competitors */}
                <div>
                  <label className="block text-sm font-medium text-[#9CA3AF] mb-3">
                    Sizning bozoringizda raqobatchilar bormi?
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <OptionCard
                      selected={form.hasCompetitors === true}
                      onClick={() => update('hasCompetitors', true)}
                      icon="⚔️"
                      label="Ha, raqobatchilar bor"
                    />
                    <OptionCard
                      selected={form.hasCompetitors === false}
                      onClick={() => update('hasCompetitors', false)}
                      icon="🌟"
                      label="Yo'q, noyob mahsulot"
                    />
                  </div>
                </div>

                {/* Competitor names */}
                {form.hasCompetitors && (
                  <div>
                    <label className="block text-sm font-medium text-[#9CA3AF] mb-2">
                      Asosiy raqobatchilar
                      <span className="text-[#6B7280] font-normal ml-2">
                        (ixtiyoriy, vergul bilan)
                      </span>
                    </label>
                    <input
                      type="text"
                      value={form.competitorNames}
                      onChange={(e) => update('competitorNames', e.target.value)}
                      placeholder="Masalan: Texnomart, Mediapark, Eldorado"
                      className="w-full bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl px-4 py-3 text-[#111827] placeholder:text-[#6B7280] focus:outline-none focus:border-[#111827] transition-all"
                    />
                    <p className="text-[#6B7280] text-xs mt-2">
                      💡 AI ularning reklamalarini tahlil qilib, sizga ustunlik topadi
                    </p>
                  </div>
                )}

                {/* Unique advantages */}
                <div>
                  <label className="block text-sm font-medium text-[#9CA3AF] mb-1">
                    Sizning asosiy ustunliklaringiz
                  </label>
                  <p className="text-[#6B7280] text-xs mb-3">
                    Reklama xabari ana shu ustunliklarga quriladi
                  </p>
                  <TagSelector
                    options={UNIQUE_ADVANTAGES}
                    selected={form.uniqueAdvantage}
                    onToggle={(v) => toggleArray('uniqueAdvantage', v)}
                  />
                </div>

                {/* Market position */}
                <div>
                  <label className="block text-sm font-medium text-[#9CA3AF] mb-3">
                    Bozordagi o'rningiz
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {MARKET_POSITIONS.map((mp) => (
                      <OptionCard
                        key={mp.value}
                        selected={form.marketPosition === mp.value}
                        onClick={() => update('marketPosition', mp.value)}
                        label={mp.label}
                      />
                    ))}
                  </div>
                </div>

                {/* Summary preview */}
                <div className="bg-[#111827]/5 border border-[#111827]/15 rounded-xl p-4">
                  <p className="text-[#374151] text-xs font-medium mb-2">
                    📋 Ma'lumotlar xulosasi (AI ga yuboriladigan):
                  </p>
                  <div className="space-y-1 text-xs text-[#6B7280]">
                    <p>🏢 <span className="text-[#111827]">{form.businessName}</span> — {form.industry}</p>
                    <p>📍 {form.targetLocation.join(', ')}</p>
                    <p>💰 Byudjet: <span className="text-[#111827]">${form.monthlyBudget}/oy</span></p>
                    <p>🎯 Maqsad: <span className="text-[#111827]">{form.primaryGoal}</span></p>
                    <p>👥 Yosh: {form.ageGroups.join(', ')}</p>
                    <p>📢 Platformalar: {form.platforms.join(', ')}</p>
                  </div>
                </div>
              </>
            )}

            {/* ══ STEP 6: AI Analysis ══ */}
            {step === 6 && (
              <div className="py-6 text-center">
                <div className="w-20 h-20 rounded-2xl bg-[#F3F4F6] border border-[#D1D5DB] flex items-center justify-center mx-auto mb-5">
                  <Spinner size="lg" />
                </div>
                <h3 className="text-lg font-semibold text-[#111827] mb-2">
                  Strategiya tayyorlanmoqda...
                </h3>
                <p className="text-[#6B7280] text-sm mb-6 max-w-xs mx-auto">
                  Nishon AI sizning ma'lumotlaringizni tahlil qilib,
                  shaxsiy reklama strategiyasini yaratmoqda.
                </p>
                <div className="max-w-xs mx-auto space-y-2.5 text-left">
                  {[
                    'Biznes profilingiz tahlil qilinmoqda',
                    'Raqobat landshafti o\'rganilmoqda',
                    'Maqsadli auditoriya segmentatsiyasi',
                    'Platform strategiyasi ishlab chiqilmoqda',
                    'Byudjet taqsimoti hisoblanmoqda',
                    'KPI prognozlari tuzilmoqda',
                    'Kreativ ko\'rsatmalar yaratilmoqda',
                    'Strategiya yakunlanmoqda',
                  ].map((msg, i) => (
                    <div
                      key={i}
                      className={`flex items-center gap-3 transition-all duration-300 ${
                        i <= analysisStep ? 'opacity-100' : 'opacity-25'
                      }`}
                    >
                      <div
                        className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 transition-all ${
                          i < analysisStep
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : i === analysisStep
                              ? 'bg-[#E5E7EB] border border-[#111827]/50'
                              : 'bg-[#F3F4F6]'
                        }`}
                      >
                        {i < analysisStep ? (
                          <span className="text-xs">✓</span>
                        ) : i === analysisStep ? (
                          <span className="w-2 h-2 rounded-full bg-[#111827] animate-pulse block" />
                        ) : null}
                      </div>
                      <p className={`text-sm ${i <= analysisStep ? 'text-[#111827]' : 'text-[#6B7280]'}`}>
                        {msg}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ══ STEP 7: Strategy revealed ══ */}
            {step === 7 && strategy && (
              <div className="space-y-5">

                {/* Strategy success header */}
                <div className="flex items-center gap-3 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                  <span className="text-2xl">🎉</span>
                  <div>
                    <p className="text-emerald-400 font-semibold text-sm">
                      Strategiya va skriptlar tayyor!
                    </p>
                    <p className="text-[#6B7280] text-xs mt-0.5">
                      AI agentingiz faollashtirildi — reklama uchun hamma narsa tayyor
                    </p>
                  </div>
                </div>

                {/* Strategy summary */}
                <div className="bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl p-4">
                  <p className="text-[#6B7280] text-xs font-medium uppercase tracking-wide mb-2">
                    AI Strategiya xulosasi
                  </p>
                  <p className="text-[#9CA3AF] text-sm leading-relaxed">
                    {strategy.summary}
                  </p>
                </div>

                {/* KPI grid */}
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { icon: '🎯', label: 'Est. Oylik Leadlar', value: strategy.monthlyForecast?.estimatedLeads ?? '—', color: 'text-[#111827]' },
                    { icon: '📈', label: 'Est. ROAS', value: strategy.monthlyForecast?.estimatedRoas ? `${Number(strategy.monthlyForecast.estimatedRoas).toFixed(1)}x` : '—', color: 'text-emerald-400' },
                    { icon: '💰', label: 'Est. CPA', value: strategy.monthlyForecast?.estimatedCpa ? `$${Number(strategy.monthlyForecast.estimatedCpa).toFixed(0)}` : '—', color: 'text-[#111827]' },
                    { icon: '📊', label: 'Ishonch darajasi', value: strategy.monthlyForecast?.confidence ?? '—', color: 'text-[#374151]' },
                  ].map(({ icon, label, value, color }) => (
                    <div key={label} className="bg-white border border-[#E5E7EB] rounded-xl p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm">{icon}</span>
                        <p className="text-[#6B7280] text-xs">{label}</p>
                      </div>
                      <p className={`text-lg font-bold ${color}`}>{value}</p>
                    </div>
                  ))}
                </div>

                {/* ══ BUDGET DISTRIBUTION ══ */}
                {strategy.channelBreakdown && strategy.channelBreakdown.length > 0 && (
                  <div className="border-t border-[#E5E7EB] pt-5">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xl">💰</span>
                      <h3 className="font-semibold text-[#111827]">Byudjet taqsimoti</h3>
                      <span className="bg-[#F3F4F6] text-[#374151] text-xs px-2 py-0.5 rounded-full border border-[#D1D5DB]">
                        ${form.monthlyBudget.toLocaleString()}/oy
                      </span>
                    </div>
                    <p className="text-[#6B7280] text-xs mb-4">
                      AI sizning biznesingiz va auditoriyangizdan kelib chiqib byudjetni quyidagicha taqsimlashni tavsiya qiladi
                    </p>
                    <div className="space-y-3">
                      {strategy.channelBreakdown.map((ch: any, idx: number) => {
                        const isPrimary = ch.priority === 'primary'
                        const isSecondary = ch.priority === 'secondary'
                        return (
                          <div
                            key={idx}
                            className={`rounded-xl border p-3.5 ${
                              isPrimary
                                ? 'bg-[#F0FDF4] border-emerald-200'
                                : isSecondary
                                  ? 'bg-[#F9FAFB] border-[#E5E7EB]'
                                  : 'bg-white border-[#F3F4F6]'
                            }`}
                          >
                            {/* Channel header */}
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <span className="text-lg">{ch.emoji || '📊'}</span>
                                <span className="font-semibold text-[#111827] text-sm">
                                  {ch.channelName}
                                </span>
                                {isPrimary && (
                                  <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200">
                                    Asosiy
                                  </span>
                                )}
                              </div>
                              <div className="text-right">
                                <span className="text-[#111827] font-bold text-sm">
                                  ${(ch.monthlyAmount || Math.round(form.monthlyBudget * ch.percentage / 100)).toLocaleString()}
                                </span>
                                <span className="text-[#6B7280] text-xs ml-1">/ oy</span>
                              </div>
                            </div>

                            {/* Progress bar */}
                            <div className="h-1.5 bg-[#E5E7EB] rounded-full mb-2 overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all duration-700 ${
                                  isPrimary ? 'bg-emerald-500' : 'bg-[#6B7280]'
                                }`}
                                style={{ width: `${ch.percentage}%` }}
                              />
                            </div>

                            <div className="flex items-center justify-between mb-2">
                              <p className="text-[#6B7280] text-xs leading-relaxed flex-1 pr-4">
                                {ch.rationale}
                              </p>
                              <span className={`text-xs font-semibold shrink-0 ${isPrimary ? 'text-emerald-600' : 'text-[#374151]'}`}>
                                {ch.percentage}%
                              </span>
                            </div>

                            {/* Tactics & expected result */}
                            {ch.tactics && ch.tactics.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-1">
                                {ch.tactics.slice(0, 3).map((t: string, ti: number) => (
                                  <span
                                    key={ti}
                                    className="text-[10px] px-2 py-0.5 rounded-full bg-white border border-[#E5E7EB] text-[#6B7280]"
                                  >
                                    {t}
                                  </span>
                                ))}
                              </div>
                            )}
                            {ch.expectedResult && (
                              <p className="text-[10px] text-[#9CA3AF] mt-1.5">
                                📈 {ch.expectedResult}
                              </p>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* SCRIPTS SECTION */}
                <div className="border-t border-[#E5E7EB] pt-5">
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-xl">📝</span>
                    <h3 className="font-semibold text-[#111827]">Tayyor Reklama Skriptlari</h3>
                    <span className="bg-[#F3F4F6] text-[#374151] text-xs px-2 py-0.5 rounded-full border border-[#D1D5DB]">
                      AI tomonidan yozilgan
                    </span>
                  </div>

                  {/* Script loading */}
                  {scriptLoading && (
                    <div className="bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl p-6 text-center">
                      <div className="flex items-center justify-center gap-3 mb-3">
                        <div className="w-5 h-5 border-2 border-[#111827] border-t-transparent rounded-full animate-spin" />
                        <p className="text-[#111827] text-sm font-medium">Skriptlar yozilmoqda...</p>
                      </div>
                      <p className="text-[#6B7280] text-xs">
                        AI strategiya asosida har bir platform uchun skript tayyorlamoqda.
                        Bu 15–20 soniya davom etadi.
                      </p>
                      <div className="flex flex-wrap gap-2 justify-center mt-3">
                        {form.platforms.map((p) => (
                          <span key={p} className="text-xs text-[#6B7280] bg-white px-2 py-1 rounded-lg border border-[#E5E7EB]">
                            {p === 'meta' ? '📘 Meta' : p === 'google' ? '🔍 Google' :
                             p === 'tiktok' ? '🎵 TikTok' : p === 'youtube' ? '▶️ YouTube' :
                             p === 'telegram' ? '✈️ Telegram' : p} ✍️
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Script error */}
                  {scriptError && !scriptLoading && (
                    <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 text-sm text-amber-400">
                      ⚠ {scriptError}
                    </div>
                  )}

                  {/* Scripts loaded */}
                  {scripts && !scriptLoading && (
                    <div className="space-y-4">

                      {/* Platform tabs */}
                      <div className="flex flex-wrap gap-1.5">
                        {form.platforms.map((platform) => {
                          const labels: Record<string, string> = {
                            meta: '📘 Meta', google: '🔍 Google',
                            tiktok: '🎵 TikTok', youtube: '▶️ YouTube',
                            telegram: '✈️ Telegram',
                          }
                          return (
                            <button
                              key={platform}
                              onClick={() => setActiveScriptTab(platform)}
                              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
                                activeScriptTab === platform
                                  ? 'bg-[#111827] text-white'
                                  : 'bg-[#F9FAFB] text-[#6B7280] border border-[#E5E7EB] hover:text-[#111827]'
                              }`}
                            >
                              {labels[platform] || platform}
                            </button>
                          )
                        })}
                      </div>

                      {/* META SCRIPTS */}
                      {activeScriptTab === 'meta' && scripts.platforms.meta && (
                        <div className="space-y-4">

                          {/* Video scripts */}
                          <div>
                            <p className="text-[#9CA3AF] text-xs font-medium uppercase tracking-wide mb-3">
                              🎬 Video Skriptlar (3 ta variant — Reels / Stories)
                            </p>
                            <div className="space-y-3">
                              {scripts.platforms.meta.videoScripts.map((vs) => (
                                <div key={vs.scriptNumber} className="bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl p-4">
                                  <div className="flex items-center justify-between mb-3">
                                    <span className="text-[#374151] text-xs font-semibold">
                                      Script #{vs.scriptNumber}
                                    </span>
                                    <div className="flex gap-2">
                                      <span className="text-xs text-[#6B7280] bg-[#F9FAFB] px-2 py-0.5 rounded">{vs.duration}</span>
                                      <span className="text-xs text-[#6B7280] bg-[#F9FAFB] px-2 py-0.5 rounded">{vs.format}</span>
                                    </div>
                                  </div>
                                  <div className="space-y-2.5">
                                    <div>
                                      <span className="text-red-400 text-xs font-medium block mb-1">
                                        🎣 Hook (0–3 soniya) — Diqqatni tortish
                                      </span>
                                      <p className="text-[#111827] text-sm bg-red-500/5 border border-red-500/10 rounded-lg px-3 py-2">
                                        {vs.hook}
                                      </p>
                                    </div>
                                    <div>
                                      <span className="text-amber-400 text-xs font-medium block mb-1">
                                        📢 Asosiy xabar (4–25 soniya)
                                      </span>
                                      <p className="text-[#374151] text-sm bg-[#F9FAFB] rounded-lg px-3 py-2 leading-relaxed">
                                        {vs.body}
                                      </p>
                                    </div>
                                    <div>
                                      <span className="text-emerald-400 text-xs font-medium block mb-1">
                                        ✅ CTA (oxirgi 5 soniya)
                                      </span>
                                      <p className="text-[#111827] text-sm bg-emerald-500/5 border border-emerald-500/10 rounded-lg px-3 py-2">
                                        {vs.cta}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Banner copies */}
                          <div>
                            <p className="text-[#9CA3AF] text-xs font-medium uppercase tracking-wide mb-3">
                              🖼 Banner Ad Copy (7 ta variant)
                            </p>
                            <div className="space-y-2">
                              {scripts.platforms.meta.bannerCopies.map((bc) => (
                                <div key={bc.variant} className="bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl p-3">
                                  <div className="flex items-start justify-between gap-3">
                                    <div className="flex-1 space-y-1">
                                      <p className="text-[#111827] text-sm font-semibold">{bc.headline}</p>
                                      <p className="text-[#9CA3AF] text-xs">{bc.primaryText}</p>
                                      <p className="text-[#6B7280] text-xs">{bc.description}</p>
                                    </div>
                                    <span className="bg-[#F3F4F6] text-[#374151] text-xs px-2 py-1 rounded-lg border border-[#D1D5DB] shrink-0 whitespace-nowrap">
                                      {bc.ctaButton}
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* GOOGLE SCRIPTS */}
                      {activeScriptTab === 'google' && scripts.platforms.google && (
                        <div className="space-y-4">
                          <div>
                            <p className="text-[#9CA3AF] text-xs font-medium uppercase tracking-wide mb-3">
                              📰 Responsive Search Ad — Headlines (15 ta)
                            </p>
                            <div className="grid grid-cols-1 gap-2">
                              {scripts.platforms.google.headlines.map((h, i) => (
                                <div key={i} className="flex items-center gap-3 bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg px-3 py-2">
                                  <span className="text-[#6B7280] text-xs w-5 shrink-0">{i + 1}.</span>
                                  <p className="text-[#111827] text-sm">{h}</p>
                                  <span className="text-[#6B7280] text-xs ml-auto shrink-0">
                                    {h.length}/30
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                          <div>
                            <p className="text-[#9CA3AF] text-xs font-medium uppercase tracking-wide mb-3">
                              📝 Descriptions (4 ta)
                            </p>
                            <div className="space-y-2">
                              {scripts.platforms.google.descriptions.map((d, i) => (
                                <div key={i} className="bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg px-3 py-2.5">
                                  <div className="flex items-start justify-between gap-2">
                                    <p className="text-[#374151] text-sm">{d}</p>
                                    <span className="text-[#6B7280] text-xs shrink-0">{d.length}/90</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* TIKTOK SCRIPTS */}
                      {activeScriptTab === 'tiktok' && scripts.platforms.tiktok && (
                        <div className="space-y-3">
                          <p className="text-[#9CA3AF] text-xs font-medium uppercase tracking-wide mb-3">
                            🎵 TikTok UGC Skriptlar (3 ta variant)
                          </p>
                          {scripts.platforms.tiktok.scripts.map((ts) => (
                            <div key={ts.scriptNumber} className="bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl p-4">
                              <div className="flex items-center gap-2 mb-3">
                                <span className="text-[#374151] text-xs font-semibold">Script #{ts.scriptNumber}</span>
                                <span className="text-xs text-[#6B7280] bg-[#F9FAFB] px-2 py-0.5 rounded">{ts.style}</span>
                              </div>
                              <div className="space-y-2.5">
                                <div>
                                  <span className="text-red-400 text-xs font-medium block mb-1">
                                    🎣 Hook (0–3 soniya) — ENG MUHIM!
                                  </span>
                                  <p className="text-[#111827] text-sm bg-red-500/5 border border-red-500/10 rounded-lg px-3 py-2">
                                    {ts.hook}
                                  </p>
                                </div>
                                <div>
                                  <span className="text-amber-400 text-xs font-medium block mb-1">Body (4–30 soniya)</span>
                                  <p className="text-[#374151] text-sm bg-[#F9FAFB] rounded-lg px-3 py-2 leading-relaxed">
                                    {ts.body}
                                  </p>
                                </div>
                                <div>
                                  <span className="text-emerald-400 text-xs font-medium block mb-1">CTA (oxirgi 3 soniya)</span>
                                  <p className="text-[#111827] text-sm bg-emerald-500/5 border border-emerald-500/10 rounded-lg px-3 py-2">
                                    {ts.cta}
                                  </p>
                                </div>
                                {ts.hashtags.length > 0 && (
                                  <div className="flex flex-wrap gap-1.5 pt-1">
                                    {ts.hashtags.map((tag) => (
                                      <span key={tag} className="text-xs text-[#374151] bg-[#111827]/5 px-2 py-0.5 rounded">
                                        {tag}
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* YOUTUBE */}
                      {activeScriptTab === 'youtube' && scripts.platforms.youtube && (
                        <div className="space-y-3">
                          <p className="text-[#9CA3AF] text-xs font-medium uppercase tracking-wide mb-3">
                            ▶️ YouTube Skippable Ad Script
                          </p>
                          <div className="bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl p-4 space-y-3">
                            <div>
                              <span className="text-red-400 text-xs font-medium block mb-1">🎣 Hook (0–5 soniya) — Skip qilishdan oldin</span>
                              <p className="text-[#111827] text-sm bg-red-500/5 border border-red-500/10 rounded-lg px-3 py-2">
                                {scripts.platforms.youtube.hook}
                              </p>
                            </div>
                            <div>
                              <span className="text-amber-400 text-xs font-medium block mb-1">Body (6–30 soniya)</span>
                              <p className="text-[#374151] text-sm bg-[#F9FAFB] rounded-lg px-3 py-2 leading-relaxed">
                                {scripts.platforms.youtube.body}
                              </p>
                            </div>
                            <div>
                              <span className="text-emerald-400 text-xs font-medium block mb-1">CTA (oxirgi 5 soniya)</span>
                              <p className="text-[#111827] text-sm bg-emerald-500/5 border border-emerald-500/10 rounded-lg px-3 py-2">
                                {scripts.platforms.youtube.cta}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* TELEGRAM */}
                      {activeScriptTab === 'telegram' && scripts.platforms.telegram && (
                        <div className="space-y-3">
                          <p className="text-[#9CA3AF] text-xs font-medium uppercase tracking-wide mb-3">
                            ✈️ Telegram Post Ads (3 ta variant)
                          </p>
                          {scripts.platforms.telegram.posts.map((post, i) => (
                            <div key={i} className="bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl p-4">
                              <span className="text-[#374151] text-xs font-medium block mb-2">Post #{i + 1}</span>
                              <p className="text-[#374151] text-sm leading-relaxed whitespace-pre-line">
                                {post}
                              </p>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* General tips */}
                      {scripts.generalTips && scripts.generalTips.length > 0 && (
                        <div className="bg-[#111827]/5 border border-[#111827]/15 rounded-xl p-4">
                          <p className="text-[#374151] text-xs font-medium mb-2">💡 Kreativ tavsiyalar</p>
                          <ul className="space-y-1">
                            {scripts.generalTips.map((tip, i) => (
                              <li key={i} className="text-[#6B7280] text-xs flex gap-2">
                                <span className="text-[#374151]">•</span> {tip}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="space-y-2">
                <Alert variant="error">{error}</Alert>
                {createdWorkspaceId && (
                  <p className="text-xs text-[#6B7280] text-center">
                    Workspace yaratildi. Dashboard'ga o'tib keyinroq strategiya yaratishingiz mumkin.
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Footer buttons */}
          {step !== 6 && (
            <div className="px-7 py-5 border-t border-[#E5E7EB] flex gap-3">
              {step > 1 && step < 7 && (
                <Button
                  variant="secondary"
                  onClick={handleBack}
                  className="flex-1"
                >
                  ← Orqaga
                </Button>
              )}

              {step === 7 ? (
                <Button
                  fullWidth
                  size="lg"
                  onClick={() => router.push('/dashboard')}
                >
                  Dashboardni ochish →
                </Button>
              ) : (
                <div className="flex gap-2 flex-1">
                  {/* Show "Go to Dashboard" if workspace was created but strategy failed */}
                  {error && createdWorkspaceId && step === 5 && (
                    <Button
                      variant="secondary"
                      size="lg"
                      onClick={() => router.push('/dashboard')}
                      className="flex-1"
                    >
                      Dashboard →
                    </Button>
                  )}
                  <Button
                    fullWidth={step === 1 || !(error && createdWorkspaceId && step === 5)}
                    size="lg"
                    onClick={handleNext}
                    loading={loading}
                    className={step > 1 ? 'flex-1' : ''}
                  >
                    {step === 5 ? '🤖 Strategiya yaratish →' : 'Davom etish →'}
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

