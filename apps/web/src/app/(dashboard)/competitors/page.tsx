'use client'

import { useState } from 'react'
import { Search, TrendingUp, AlertCircle, CheckCircle2, BarChart3, Share2 } from 'lucide-react'
import { useWorkspaceStore } from '@/stores/workspace.store'
import { Card } from '@/components/ui/card'
import { apiClient } from '@/lib/api-client'

export const dynamic = 'force-dynamic'

const COMPARISON_DATA = {
  yourBrand: {
    name: 'Sizning Branding',
    score: 59,
    color: 'emerald',
    highlights: [
      'Yaxshi kontentga izohlar',
      'Tez javob berish',
      'Authentic o\'z fotosuratlar',
    ],
  },
  competitor: {
    name: 'Raqobatchi',
    score: 71,
    color: 'red',
    highlights: [
      'Katta follower bazasi',
      'Paid ads strategiyasi',
      'Professional photography',
    ],
  },
}

const AUDIT_CATEGORIES = [
  {
    title: 'Instagram Identity',
    score: 65,
    status: 'good',
    description: 'Bio, profil rasm, username',
  },
  {
    title: 'Statistics',
    score: 58,
    status: 'fair',
    description: 'Engagement rate, follower o\'sishi',
  },
  {
    title: 'SMM Strategy',
    score: 52,
    status: 'fair',
    description: 'Post frequency, hashtag usage',
  },
  {
    title: 'Paid Advertising',
    score: 71,
    status: 'good',
    description: 'Ads budget, kampaniya types',
  },
  {
    title: 'Response Speed',
    score: 45,
    status: 'poor',
    description: 'DM javob vaqti, comment response',
  },
  {
    title: 'Website',
    score: 68,
    status: 'good',
    description: 'Mobile-friendly, conversion optimized',
  },
]

const MOCK_RESULT: CompetitorAnalysis = {
  competitor: {
    name: 'Texnomart',
    instagram: '@texnomart_uz',
    website: 'texnomart.uz',
    overallSummary: "Texnomart O'zbekistondagi yirik elektronika do'konlar zanjiri. Kuchli brend taniqliligiga ega, lekin raqamli marketing strategiyasida bir nechta zaif tomonlari bor.",
    estimatedAdSpend: '$3,000–5,000/oy',
  },
  categories: [
    {
      id: 1, icon: '📸', title: 'Instagram identikasi', description: 'Profil, bio, vizual, CTA, business account',
      yourScore: 65, competitorScore: 78,
      subParams: [
        { name: 'Profil nomlanishi', yourStatus: 'good', competitorStatus: 'good', yourNote: 'Brend nomiga mos, oson topiladi', competitorNote: 'Keng auditoriyaga tanish nom' },
        { name: 'Bio va positioning', yourStatus: 'medium', competitorStatus: 'good', yourNote: 'Bio mavjud lekin foyda unchalik aniq emas', competitorNote: 'Aniq positioning va kontakt mavjud' },
        { name: "Vizual uyg'unlik", yourStatus: 'good', competitorStatus: 'medium', yourNote: "Ranglar va uslub bir xil", competitorNote: 'Vizual har xil, izchillik yo\'q' },
        { name: 'CTA aniqligi', yourStatus: 'bad', competitorStatus: 'good', yourNote: "Harakatga chaqiruv yo'q", competitorNote: 'Har postda aniq CTA bor' },
        { name: 'Business account', yourStatus: 'good', competitorStatus: 'good', yourNote: 'Barcha funksiyalar yoqilgan', competitorNote: 'Barcha funksiyalar yoqilgan' },
        { name: 'Raqobatchilar tahlili', yourStatus: 'bad', competitorStatus: 'medium', yourNote: "Tahlil o'tkazilmagan", competitorNote: 'Qisman kuzatiladi' },
      ],
    },
    {
      id: 2, icon: '📊', title: 'Statistika', description: 'Engagement, oxvat, kontent samaradorligi',
      yourScore: 58, competitorScore: 71,
      subParams: [
        { name: 'Obunachilar sifati', yourStatus: 'good', competitorStatus: 'medium', yourNote: 'Real auditoriya, bot kam', competitorNote: 'Bot shubhali akkauntlar bor' },
        { name: 'Engagement darajasi', yourStatus: 'medium', competitorStatus: 'good', yourNote: 'Engagement 2.1% — normadan past', competitorNote: 'Engagement 4.3% — yaxshi' },
        { name: 'Oxvat tendensiyasi', yourStatus: 'medium', competitorStatus: 'good', yourNote: "Oxvat barqaror lekin o'smayapti", competitorNote: "Oxvat oyiga 12% o'sib bormoqda" },
        { name: 'Kontent samaradorligi', yourStatus: 'bad', competitorStatus: 'medium', yourNote: "Top postlar aniqlanmagan, tahlil yo'q", competitorNote: 'Samarali formatlar takrorlanadi' },
        { name: 'Post vaqtlari', yourStatus: 'bad', competitorStatus: 'good', yourNote: "Vaqt rejasi yo'q", competitorNote: 'Optimal vaqtlarda post qilinadi' },
        { name: "Story ko'rishlar", yourStatus: 'medium', competitorStatus: 'good', yourNote: "O'rtacha 15% view rate", competitorNote: '28% story view rate' },
      ],
    },
    {
      id: 3, icon: '📅', title: 'SMM tizimi', description: 'Reels, carousel, story intizomi',
      yourScore: 45, competitorScore: 80,
      subParams: [
        { name: 'Reels muntazamligi', yourStatus: 'bad', competitorStatus: 'good', yourNote: 'Haftada 0-1 Reels', competitorNote: 'Haftada 4-5 Reels' },
        { name: 'Carousel format', yourStatus: 'medium', competitorStatus: 'good', yourNote: 'Oyda 2-3 carousel', competitorNote: 'Haftada 3+ carousel' },
        { name: 'Story intizomi', yourStatus: 'bad', competitorStatus: 'good', yourNote: "Kunlik story yo'q", competitorNote: 'Kunda 5-7 story' },
        { name: 'Kontent struktura', yourStatus: 'bad', competitorStatus: 'medium', yourNote: "Rejalashtirilmagan, tartibsiz", competitorNote: 'Haftalik reja bor' },
        { name: 'Post tayyorlash', yourStatus: 'medium', competitorStatus: 'good', yourNote: 'Kontent bor, chiqish qiyin', competitorNote: 'Kontent ishlab chiqarish tizimi bor' },
        { name: 'Hashtag strategiyasi', yourStatus: 'medium', competitorStatus: 'good', yourNote: 'Umumiy hashtaglar ishlatiladi', competitorNote: 'Lokal va niche hashtaglar' },
      ],
    },
    {
      id: 4, icon: '🎯', title: 'Target reklama', description: 'Active reklamalar, kampaniya logikasi',
      yourScore: 55, competitorScore: 68,
      subParams: [
        { name: 'Active reklamalar', yourStatus: 'medium', competitorStatus: 'good', yourNote: '1 aktiv kampaniya', competitorNote: '5-7 aktiv kampaniya' },
        { name: 'Targeting sifati', yourStatus: 'medium', competitorStatus: 'good', yourNote: 'Keng targeting, kam aniqlik', competitorNote: 'Segmentlashtirilgan auditoriyalar' },
        { name: 'Kampaniya logikasi', yourStatus: 'bad', competitorStatus: 'medium', yourNote: "Funnel yo'q", competitorNote: 'Qisman funnel bor' },
        { name: 'Pixel tracking', yourStatus: 'bad', competitorStatus: 'good', yourNote: "Pixel o'rnatilmagan", competitorNote: 'Pixel va conversion events sozlangan' },
        { name: 'Creative materials', yourStatus: 'medium', competitorStatus: 'good', yourNote: "Rasm sifati o'rtacha", competitorNote: 'Professional video va rasmlar' },
        { name: 'Retargeting', yourStatus: 'bad', competitorStatus: 'medium', yourNote: "Retargeting yo'q", competitorNote: 'Asosiy retargeting bor' },
      ],
    },
    {
      id: 5, icon: '⚡', title: 'Javob tezligi', description: 'Direct, comment javoblar, monitoring',
      yourScore: 72, competitorScore: 60,
      subParams: [
        { name: 'Direct javob vaqti', yourStatus: 'good', competitorStatus: 'medium', yourNote: '15-20 daqiqada javob', competitorNote: '1-2 soatda javob' },
        { name: 'Comment javob', yourStatus: 'good', competitorStatus: 'medium', yourNote: '90% commentlarga javob', competitorNote: '60% commentlarga javob' },
        { name: 'Telegram monitoring', yourStatus: 'good', competitorStatus: 'bad', yourNote: 'Tezkor javob tizimi bor', competitorNote: "Telegram kanal bor lekin javob yo'q" },
        { name: 'Facebook monitoring', yourStatus: 'medium', competitorStatus: 'good', yourNote: 'Kech javob', competitorNote: 'Tez javob tizimi' },
        { name: 'YouTube & TikTok', yourStatus: 'bad', competitorStatus: 'medium', yourNote: "Kuzatilmaydi", competitorNote: 'Qisman monitoring' },
        { name: 'Javob standartlari', yourStatus: 'medium', competitorStatus: 'good', yourNote: "Skript yo'q", competitorNote: 'Skript va standartlar bor' },
      ],
    },
  ],
  overallScore: { you: 59, competitor: 71 },
  overallWinner: 'competitor',
  topStrengths: [
    "Javob tezligi va mijozlar bilan muloqotda ustunlik",
    'Vizual uygunlik va brend izchilligi',
    "Real auditoriya — bot kam, sifatli obunachilar",
  ],
  topWeaknesses: [
    "SMM tizimi yo'q — Reels va Story muntazam chiqmaydi",
    "Meta Pixel o'rnatilmagan, konversiyalar kuzatilmaydi",
    "Haftalik kontent reja yo'q, tartibsiz postlar",
    "Funnel reklamalar yo'q, faqat 1 kampaniya aktiv",
  ],
  urgentFixes: [
    "Meta Pixel'ni zudlik bilan o'rnating — har bir reklama puli isrof bo'lmoqda",
    "Haftalik kontent rejasi tuzing: 3 Reels + 2 Carousel + kunlik Story",
    "CTA qo'shing: har bir postda 'DM yuboring', 'Saytga o'ting' kabi aniq chaqiruv",
    "Retargeting kampaniya yarating — saytga kelgan foydalanuvchilarni qayta targetlang",
    "Instagram Bio'ni yangilang: nima sotasiz + asosiy foyda + kontakt",
  ],
  annualStrategy: {
    q1: "Asosiy bazani mustahkamlash: Meta Pixel o'rnatish, kontent kalendarini yaratish, SMM tizimini joriy etish. Maqsad: engagement 3.5%ga yetkazish.",
    q2: "O'sish fazasi: Haftalik Reels seriyasi, A/B test reklamalar, retargeting kampaniyalar. Maqsad: oxvat 2x oshirish.",
    q3: "Kengayish: TikTok va YouTube kanalini ochish, influencer hamkorliklar, Ramazon va yozgi aksiyalar.",
    q4: "Yil oxiri kampaniyalar: Yangi yil, chegirma sezoni, mijozlar sadoqat dasturi. Maqsad: yillik ROI 3.5x.",
    keyActions: [
      "Meta Pixel o'rnatish va barcha conversion eventlarni sozlash",
      "Oylik kontent kalendarini yaratish va jamoaga taqsimlash",
      "Lookalike + Retargeting funnel reklamalarini ishga tushirish",
      "Haftada 3-4 Reels chiqarish uchun video studio sozlash",
      "Competitor monitoring dashboardi yaratish",
    ],
    budgetAdvice: "Hozirgi byudjetning 60%ini Meta/Instagram reklamalariga, 25%ini Google Ads, 15%ini kontent ishlab chiqarishga yo'naltiring. Eng kam $1,500/oy zarur samarali natija uchun.",
  },
}

export default function CompetitorsPage() {
  const { currentWorkspace } = useWorkspaceStore()

  const [form, setForm] = useState({
    name: '',
    instagram: '',
    website: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState<CompetitorAnalysis | null>(MOCK_RESULT)
  const [openCategory, setOpenCategory] = useState<number | null>(null)
  const [activeTab, setActiveTab] = useState<'audit' | 'strategy'>('audit')

  function update(field: string, value: string) {
    setForm((p) => ({ ...p, [field]: value }))
  }

  function validate(): string | null {
    if (!form.name.trim()) return 'Raqobatchi nomini kiriting'
    if (!form.instagram.trim() && !form.website.trim())
      return 'Kamida bitta havola kiriting (Instagram yoki sayt)'
    return null
  }

  async function handleAnalyze() {
    const err = validate()
    if (err) {
      setError(err)
      return
    }
    setError('')
    setLoading(true)
    setResult(null)

    try {
      const res = await apiClient.post('/ai-agent/competitor-analysis', {
        workspaceId: currentWorkspace?.id,
        competitor: form,
        businessContext: {
          name: currentWorkspace?.name,
          industry: (currentWorkspace as any)?.industry,
          productDescription: (currentWorkspace as any)?.productDescription,
          targetLocation: (currentWorkspace as any)?.targetLocation,
          monthlyBudget: (currentWorkspace as any)?.monthlyBudget,
          goal: (currentWorkspace as any)?.goal,
          aiStrategy: currentWorkspace?.aiStrategy,
        },
      })
      setResult(res.data)
      setActiveTab('audit')
      setOpenCategory(null)
    } catch (e: any) {
      setError(e.response?.data?.message || 'Tahlil amalga oshirilmadi')
    } finally {
      setLoading(false)
    }
  }

  const computed = useMemo(() => {
    if (!result) return null
    const totalYourGood =
      result.categories.reduce(
        (acc, cat) =>
          acc + cat.subParams.filter((s) => s.yourStatus === 'good').length,
        0,
      ) ?? 0
    const totalCompGood =
      result.categories.reduce(
        (acc, cat) =>
          acc + cat.subParams.filter((s) => s.competitorStatus === 'good').length,
        0,
      ) ?? 0
    return { totalYourGood, totalCompGood }
  }, [result])

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <div className="flex items-center gap-3 mb-1">
          <h1 className="text-2xl font-bold text-text-primary">Raqobatchi Tahlili</h1>
          <Badge variant="purple">🔥 Audit</Badge>
        </div>
        <p className="text-text-tertiary text-sm">
          12 ta audit kategoriyasi bo'yicha siz va raqobatchi solishtiriladi
        </p>
      </div>

      <Card>
        <div className="flex items-center gap-2 mb-5">
          <span className="text-xl">⚔️</span>
          <h2 className="font-semibold text-text-primary">Raqobatchi ma'lumotlari</h2>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-tertiary mb-2">
              Raqobatchi nomi <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => update('name', e.target.value)}
              placeholder="Masalan: Texnomart, MediaPark, ..."
              className="w-full bg-surface-2 border border-border rounded-xl px-4 py-3 text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-border transition-all"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-tertiary mb-2">
                Instagram <span className="text-red-400">*</span>
                <span className="text-text-tertiary font-normal ml-1">
                  (@username yoki URL)
                </span>
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-lg">
                  📸
                </span>
                <input
                  type="text"
                  value={form.instagram}
                  onChange={(e) => update('instagram', e.target.value)}
                  placeholder="@texnomart_uz"
                  className="w-full bg-surface-2 border border-border rounded-xl pl-10 pr-4 py-3 text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-border transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-text-tertiary mb-2">
                Veb-sayt <span className="text-red-400">*</span>
                <span className="text-text-tertiary font-normal ml-1">(URL)</span>
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-lg">
                  🌐
                </span>
                <input
                  type="text"
                  value={form.website}
                  onChange={(e) => update('website', e.target.value)}
                  placeholder="https://texnomart.uz"
                  className="w-full bg-surface-2 border border-border rounded-xl pl-10 pr-4 py-3 text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-border transition-all"
                />
              </div>
            </div>
          </div>

          {error && <Alert variant="error">{error}</Alert>}

          <Button fullWidth size="lg" loading={loading} onClick={handleAnalyze}>
            {loading ? "Tahlil qilinmoqda (AI 12 bo'lim)..." : "🔍 Yangi tahlilni boshlash"}
          </Button>
        </div>
      </Card>

      {loading && (
        <Card>
          <div className="py-10 text-center">
            <div className="w-16 h-16 rounded-2xl bg-surface-2 border border-border flex items-center justify-center mx-auto mb-4">
              <Spinner size="lg" />
            </div>
            <h3 className="text-text-primary font-semibold mb-1">
              Tahlil qilinmoqda...
            </h3>
            <p className="text-text-tertiary text-sm mb-5">
              12 bo'lim, 72 parametr tekshiriladi
            </p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-w-sm mx-auto">
              {AUDIT_CATEGORIES.map((cat) => (
                <div key={cat.id} className="flex items-center gap-2 text-xs text-text-tertiary">
                  <span>{cat.icon}</span> {cat.title}
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}

      {result && !loading && (
        <div className="space-y-5">
          {result === MOCK_RESULT && (
            <div className="flex items-center gap-3 bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-3">
              <span className="text-amber-500 text-lg shrink-0">💡</span>
              <p className="text-amber-500 text-sm">
                <span className="font-medium">Demo natija</span> — Texnomart bilan solishtirish ko'rsatilmoqda. Haqiqiy tahlil uchun raqobatchi ma'lumotlarini yuqorida kiriting.
              </p>
            </div>
          )}
          <Card
            className={`border-2 ${
              result.overallWinner === 'you'
                ? 'border-emerald-500/40'
                : result.overallWinner === 'competitor'
                  ? 'border-red-500/30'
                  : 'border-border'
            }`}
          >
            <div className="flex flex-col md:flex-row items-center gap-6 p-4">
              <div className="flex-1 text-center md:text-left">
                <p className="text-4xl mb-2">
                  {result.overallWinner === 'you'
                    ? '🏆'
                    : result.overallWinner === 'competitor'
                      ? '😤'
                      : '🤝'}
                </p>
                <h2
                  className={`text-xl font-bold ${
                    result.overallWinner === 'you'
                      ? 'text-emerald-400'
                      : result.overallWinner === 'competitor'
                        ? 'text-red-400'
                        : 'text-text-secondary'
                  }`}
                >
                  {result.overallWinner === 'you'
                    ? 'Siz oldindasiz!'
                    : result.overallWinner === 'competitor'
                      ? `${result.competitor.name} sizdan oldinda`
                      : 'Teng darajada'}
                </h2>
                <p className="text-text-tertiary text-sm mt-1">
                  72 parametr bo'yicha siz {computed?.totalYourGood ?? 0}, raqobatchi {computed?.totalCompGood ?? 0} ta “good” segmentga ega
                </p>
              </div>

              <div className="flex items-center gap-4 shrink-0">
                <ScoreCircle
                  score={result.overallScore.you}
                  label={currentWorkspace?.name ?? 'Siz'}
                  color="green"
                />
                <div className="text-text-tertiary font-bold text-xl">vs</div>
                <ScoreCircle
                  score={result.overallScore.competitor}
                  label={result.competitor.name}
                  color="red"
                />
              </div>
            </div>
          </Card>

          <div className="grid grid-cols-2 gap-4">
            <Card>
              <p className="text-emerald-400 font-semibold text-sm mb-3">
                ✅ Sizning ustunliklaringiz
              </p>
              <ul className="space-y-1.5">
                {result.topStrengths.map((s, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-text-secondary">
                    <span className="text-emerald-400 shrink-0">✓</span> {s}
                  </li>
                ))}
              </ul>
            </Card>
            <Card>
              <p className="text-red-400 font-semibold text-sm mb-3">
                ⚠️ Orqada qolgan joylaringiz
              </p>
              <ul className="space-y-1.5">
                {result.topWeaknesses.map((w, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-text-secondary">
                    <span className="text-red-400 shrink-0">!</span> {w}
                  </li>
                ))}
              </ul>
            </Card>
          </div>

          <Card className="border-amber-500/30 bg-amber-500/5">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xl">⚡</span>
              <h3 className="font-semibold text-amber-400">
                Darhol hal qilish kerak (Top 5)
              </h3>
            </div>
            <div className="space-y-2">
              {result.urgentFixes.map((fix, i) => (
                <div
                  key={i}
                  className="flex items-start gap-3 bg-amber-500/5 border border-amber-500/15 rounded-lg px-3 py-2.5"
                >
                  <span className="text-amber-400 font-bold text-sm shrink-0 mt-0.5">
                    {i + 1}
                  </span>
                  <p className="text-text-secondary text-sm">{fix}</p>
                </div>
              ))}
            </div>
          </Card>

          <div className="flex gap-1 bg-surface border border-border rounded-xl p-1 w-fit">
            {[
              { key: 'audit', label: "📋 12 bo'lim tahlili" },
              { key: 'strategy', label: '📅 Yillik strategiya' },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`
                  px-5 py-2 rounded-lg text-sm font-medium transition-all duration-200
                  ${
                    activeTab === tab.key
                      ? 'bg-surface text-white'
                      : 'text-text-tertiary hover:text-text-primary hover:bg-surface-2'
                  }
                `}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {activeTab === 'audit' && (
            <div className="space-y-3">
              {result.categories.map((cat) => {
                const isOpen = openCategory === cat.id
                const yourGood = cat.subParams.filter((s) => s.yourStatus === 'good').length
                const compGood = cat.subParams.filter((s) => s.competitorStatus === 'good').length
                const catWinner = yourGood > compGood ? 'you' : yourGood < compGood ? 'comp' : 'tie'

                return (
                  <Card key={cat.id} padding="none">
                    <button
                      onClick={() => setOpenCategory(isOpen ? null : cat.id)}
                      className="w-full flex items-center gap-4 px-5 py-4 text-left"
                    >
                      <span className="text-2xl shrink-0">{cat.icon}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-text-tertiary text-xs font-medium">{cat.id}.</span>
                          <h3 className="font-semibold text-text-primary text-sm">{cat.title}</h3>
                          {catWinner === 'you' && (
                            <Badge variant="success" size="sm">Siz oldinda</Badge>
                          )}
                          {catWinner === 'comp' && (
                            <Badge variant="danger" size="sm">Orqadasiz</Badge>
                          )}
                        </div>
                        <p className="text-text-tertiary text-xs">{cat.description}</p>
                      </div>

                      <div className="flex items-center gap-4 shrink-0">
                        <div className="text-center">
                          <span className="text-emerald-400 font-bold text-base block">
                            {yourGood}/{cat.subParams.length}
                          </span>
                          <span className="text-text-tertiary text-xs">Siz</span>
                        </div>
                        <div className="text-center">
                          <span className="text-red-400 font-bold text-base block">
                            {compGood}/{cat.subParams.length}
                          </span>
                          <span className="text-text-tertiary text-xs">Raqobatchi</span>
                        </div>
                      </div>
                    </button>

                    {isOpen && (
                      <div className="border-t border-border">
                        <div className="grid grid-cols-[1fr_1fr_1fr] gap-0 px-5 py-2.5 bg-surface-2 border-b border-border">
                          <p className="text-text-tertiary text-xs font-medium uppercase tracking-wide">Parametr</p>
                          <p className="text-emerald-400 text-xs font-medium pl-3">Siz</p>
                          <p className="text-red-400 text-xs font-medium pl-3">{result.competitor.name}</p>
                        </div>

                        {cat.subParams.map((sub, i) => (
                          <div
                            key={i}
                            className={`
                              grid grid-cols-[1fr_1fr_1fr] gap-0 px-5 py-3.5
                              border-b border-border last:border-0
                              ${i % 2 === 0 ? '' : 'bg-surface-2/40'}
                            `}
                          >
                            <div className="pr-4">
                              <p className="text-text-tertiary text-xs leading-relaxed">{sub.name}</p>
                            </div>

                            <div className="pl-3 pr-4 flex items-start gap-2">
                              <StatusIcon status={sub.yourStatus} size="sm" />
                              <p className="text-xs text-text-secondary leading-relaxed">{sub.yourNote}</p>
                            </div>

                            <div className="pl-3 flex items-start gap-2">
                              <StatusIcon status={sub.competitorStatus} size="sm" />
                              <p className="text-xs text-text-secondary leading-relaxed">{sub.competitorNote}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </Card>
                )
              })}
            </div>
          )}

          {activeTab === 'strategy' && (
            <div className="space-y-4">
              <Card>
                <div className="flex items-center gap-2 mb-5">
                  <span className="text-lg">📅</span>
                  <h2 className="font-semibold text-text-primary">Yillik Marketing Strategiyasi</h2>
                  <Badge variant="purple" size="sm">Auditga asoslangan</Badge>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { key: 'q1', months: 'Yanvar – Mart', icon: '❄️', text: result.annualStrategy.q1, color: 'border-blue-500/30 bg-blue-500/5', tc: 'text-blue-400' },
                    { key: 'q2', months: 'Aprel – Iyun', icon: '🌸', text: result.annualStrategy.q2, color: 'border-emerald-500/30 bg-emerald-500/5', tc: 'text-emerald-400' },
                    { key: 'q3', months: 'Iyul – Sentabr', icon: '☀️', text: result.annualStrategy.q3, color: 'border-amber-500/30 bg-amber-500/5', tc: 'text-amber-400' },
                    { key: 'q4', months: 'Oktabr – Dekabr', icon: '🎄', text: result.annualStrategy.q4, color: 'border-red-500/30 bg-red-500/5', tc: 'text-red-400' },
                  ].map((q) => (
                    <div key={q.key} className={`border rounded-xl p-4 ${q.color}`}>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xl">{q.icon}</span>
                        <span className={`font-bold text-lg ${q.tc}`}>{q.key.toUpperCase()}</span>
                        <span className="text-text-tertiary text-xs">{q.months}</span>
                      </div>
                      <p className="text-text-secondary text-sm leading-relaxed">{q.text}</p>
                    </div>
                  ))}
                </div>
              </Card>

              <Card>
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-lg">🎯</span>
                  <h3 className="font-semibold text-text-primary">Asosiy harakatlar</h3>
                </div>
                <div className="space-y-2">
                  {result.annualStrategy.keyActions.map((action, i) => (
                    <div key={i} className="flex items-start gap-3 bg-surface-2 rounded-xl px-4 py-3">
                      <div className="w-6 h-6 rounded-lg bg-surface-2 flex items-center justify-center shrink-0">
                        <span className="text-text-secondary text-xs font-bold">{i + 1}</span>
                      </div>
                      <p className="text-text-secondary text-sm leading-relaxed">{action}</p>
                    </div>
                  ))}
                </div>
              </Card>

              <Card>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-lg">💰</span>
                  <h3 className="font-semibold text-text-primary">Byudjet tavsiyasi</h3>
                </div>
                <p className="text-text-secondary text-sm leading-relaxed">
                  {result.annualStrategy.budgetAdvice}
                </p>
              </Card>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

