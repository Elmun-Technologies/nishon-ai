'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useWorkspaceStore } from '@/stores/workspace.store'
import { campaigns as campaignsApi } from '@/lib/api-client'
import { Alert } from '@/components/ui/Alert'

type Platform = 'meta' | 'google' | 'yandex'
type LaunchMode = 'self' | 'ai' | 'expert'
type MetaStep = 1 | 2 | 3 | 4 | 5
type GoogleStep = 1 | 2 | 3 | 4 | 5
type YandexStep = 1 | 2 | 3 | 4

const PLATFORMS = [
  { id: 'meta', name: '📘 Meta (Facebook/Instagram)', desc: 'Reklama qo\'yish Facebookda, Instagramda', color: 'from-blue-400 to-blue-600' },
  { id: 'google', name: '🔍 Google Ads', desc: 'Qidiruv, Display, Smart kampaniyalar', color: 'from-red-400 to-blue-500' },
  { id: 'yandex', name: '🟡 Yandex Direct', desc: 'Yandex-da qidiruv va reklama', color: 'from-yellow-400 to-orange-500' },
]

export default function LaunchPage() {
  const router = useRouter()
  const { currentWorkspace } = useWorkspaceStore()
  const [platform, setPlatform] = useState<Platform | null>(null)
  const [launchMode, setLaunchMode] = useState<LaunchMode>('self')
  const [activeTab, setActiveTab] = useState<'drafts' | 'ai_drafts' | 'templates' | 'launches'>('drafts')
  const [search, setSearch] = useState('')
  const [launchModeConfirmed, setLaunchModeConfirmed] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const handlePlatformPick = (nextPlatform: Platform) => {
    setPlatform(nextPlatform)
    setLaunchModeConfirmed(false)
    setLaunchMode('self')
  }

  const handleLaunchModeConfirm = () => {
    if (!platform) return
    if (launchMode === 'ai') {
      router.push(`/create-agent?platform=${platform}`)
      return
    }
    if (launchMode === 'expert') {
      router.push(`/service?platform=${platform}`)
      return
    }
    setLaunchModeConfirmed(true)
  }

  // Meta form state
  const [metaStep, setMetaStep] = useState<MetaStep>(1)
  const [metaData, setMetaData] = useState({
    name: '',
    objective: 'leads',
    minAge: 18,
    maxAge: 65,
    location: 'UZ',
    dailyBudget: '',
    campaignDuration: 7,
    creativeName: '',
    creativeUrl: '',
    creativeText: '',
    ctaButton: 'learn_more',
  })

  // Google form state
  const [googleStep, setGoogleStep] = useState<GoogleStep>(1)
  const [googleData, setGoogleData] = useState({
    name: '',
    campaignType: 'search',
    objective: 'leads',
    keywords: '',
    headline1: '',
    headline2: '',
    headline3: '',
    description1: '',
    description2: '',
    finalUrl: '',
    dailyBudget: '',
    biddingStrategy: 'target_cpa',
  })

  // Yandex form state
  const [yandexStep, setYandexStep] = useState<YandexStep>(1)
  const [yandexData, setYandexData] = useState({
    name: '',
    campaignType: 'search',
    keywords: '',
    negativeKeywords: '',
    headline: '',
    description: '',
    url: '',
    dailyBudget: '',
    strategy: 'average_cpc',
  })

  const handleMetaLaunch = async () => {
    setSaving(true)
    setError('')
    try {
      const campaign = await campaignsApi.create(currentWorkspace?.id ?? '', {
        name: metaData.name,
        platform: 'meta',
        objective: metaData.objective,
        dailyBudget: Number(metaData.dailyBudget),
        totalBudget: Number(metaData.dailyBudget) * metaData.campaignDuration,
      })
      router.push(`/campaigns`)
    } catch (err: any) {
      setError(err?.message || 'Kampaniya yaratishda xatolik')
    } finally {
      setSaving(false)
    }
  }

  const handleGoogleLaunch = async () => {
    setSaving(true)
    setError('')
    try {
      const campaign = await campaignsApi.create(currentWorkspace?.id ?? '', {
        name: googleData.name,
        platform: 'google',
        objective: googleData.objective,
        dailyBudget: Number(googleData.dailyBudget),
        totalBudget: Number(googleData.dailyBudget) * 30,
      })
      router.push(`/campaigns`)
    } catch (err: any) {
      setError(err?.message || 'Kampaniya yaratishda xatolik')
    } finally {
      setSaving(false)
    }
  }

  const handleYandexLaunch = async () => {
    setSaving(true)
    setError('')
    try {
      const campaign = await campaignsApi.create(currentWorkspace?.id ?? '', {
        name: yandexData.name,
        platform: 'yandex',
        objective: 'leads',
        dailyBudget: Number(yandexData.dailyBudget),
        totalBudget: Number(yandexData.dailyBudget) * 30,
      })
      router.push(`/campaigns`)
    } catch (err: any) {
      setError(err?.message || 'Kampaniya yaratishda xatolik')
    } finally {
      setSaving(false)
    }
  }

  if (!platform) {
    return (
      <div className="max-w-5xl mx-auto space-y-5 py-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-text-primary mb-1">Campaigns</h1>
            <p className="text-text-tertiary text-sm">Create and launch campaigns at scale</p>
          </div>
          <button
            onClick={() => setPlatform('meta')}
            className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold"
          >
            + New campaign
          </button>
        </div>

        <div className="flex gap-6 border-b border-border">
          {[
            { id: 'drafts', label: 'Drafts' },
            { id: 'ai_drafts', label: 'AI Drafts' },
            { id: 'templates', label: 'Templates' },
            { id: 'launches', label: 'Launches' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`pb-3 text-sm font-medium border-b-2 ${
                activeTab === tab.id ? 'border-text-primary text-text-primary' : 'border-transparent text-text-tertiary hover:text-text-primary'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search drafts..."
          className="w-full md:w-[420px] border border-border bg-surface rounded-xl px-4 py-2.5 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-border"
        />

        {/* ── Platform Selection FIRST ── */}
        <div>
          <p className="text-xs text-text-tertiary mb-3 uppercase tracking-wider font-medium">Platforma tanlang</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {PLATFORMS.map(p => (
              <button
                key={p.id}
                onClick={() => handlePlatformPick(p.id as Platform)}
                className="group relative overflow-hidden rounded-2xl border-2 border-border bg-surface p-6 text-left transition-all hover:border-violet-500/50 hover:shadow-lg"
              >
                <div className="relative space-y-3">
                  <h3 className="text-lg font-bold text-text-primary">{p.name}</h3>
                  <p className="text-sm text-text-tertiary">{p.desc}</p>
                  <div className="pt-3">
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-violet-500">
                      Tanlash →
                    </span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-dashed border-border bg-surface p-10 text-center">
          <p className="text-xl font-bold text-text-primary mb-2">Hali kampaniya qoralama yo&apos;q</p>
          <p className="text-sm text-text-tertiary mb-5">
            Avval platforma tanlang, keyin ishga tushirish usulini belgilang.
          </p>
          <div className="flex items-center justify-center gap-2 flex-wrap">
            <button onClick={() => setPlatform('meta')} className="px-4 py-2 rounded-xl bg-violet-600 text-white text-sm font-medium">+ Yangi kampaniya</button>
            <button onClick={() => setPlatform('google')} className="px-4 py-2 rounded-xl border border-border text-sm text-text-secondary hover:bg-surface-2 transition-colors">🔍 Google Ads</button>
          </div>
        </div>
      </div>
    )
  }

  // ── LAUNCH MODE SELECTION (after platform pick, before wizard) ──
  if (platform && !launchModeConfirmed) {
    const platformInfo = PLATFORMS.find(p => p.id === platform)
    return (
      <div className="max-w-3xl mx-auto space-y-6 py-6">
        <div>
          <button onClick={() => setPlatform(null)} className="text-text-tertiary hover:text-text-primary text-sm mb-3 flex items-center gap-1">
            ← Platformaga qaytish
          </button>
          <h1 className="text-2xl font-bold text-text-primary mb-1">{platformInfo?.name}</h1>
          <p className="text-text-tertiary text-sm">Launch usulini tanlang</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { id: 'self', icon: '🎯', title: "O'zim launch qilaman", desc: "Wizard orqali qo'lda sozlab ishga tushirish. To'liq nazorat sizda." },
            { id: 'ai', icon: '🤖', title: 'AI agent launch qilsin', desc: "AI draft yaratadi va avtomatik optimizatsiya qiladi. Siz faqat tasdiqlaysiz." },
            { id: 'expert', icon: '👨‍💼', title: 'Marketplace mutaxassis', desc: "Jonli ekspert natijalarini ko'ring va xizmat buyurtma bering." },
          ].map((mode) => (
            <button
              key={mode.id}
              onClick={() => setLaunchMode(mode.id as LaunchMode)}
              className={`text-left rounded-2xl border-2 p-5 transition-all ${
                launchMode === mode.id
                  ? 'border-violet-500 bg-violet-500/5'
                  : 'border-border hover:border-text-tertiary'
              }`}
            >
              <div className="text-3xl mb-3">{mode.icon}</div>
              <p className="text-sm font-bold text-text-primary mb-1">{mode.title}</p>
              <p className="text-xs text-text-tertiary leading-relaxed">{mode.desc}</p>
            </button>
          ))}
        </div>

        <button
          onClick={handleLaunchModeConfirm}
          className="w-full bg-violet-600 hover:bg-violet-700 text-white py-3.5 rounded-xl font-semibold text-sm transition-colors"
        >
          {launchMode === 'self' ? 'Wizardni boshlash →' : launchMode === 'ai' ? 'AI agentga yuborish →' : 'Ekspertga yuborish →'}
        </button>
      </div>
    )
  }

  // ── META FORM ──────────────────────────────────────────────────────────

  if (platform === 'meta') {
    return (
      <div className="max-w-2xl mx-auto space-y-6 py-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <button onClick={() => setLaunchModeConfirmed(false)} className="text-text-tertiary hover:text-text-primary text-sm mb-2 flex items-center gap-1">
              ← Orqaga
            </button>
            <h1 className="text-2xl font-bold text-text-primary">📘 Meta Kampaniyasi</h1>
            <p className="text-text-tertiary text-sm mt-1">Qadam {metaStep}/5</p>
          </div>
        </div>

        {error && <Alert variant="error">{error}</Alert>}

        {/* Progress bar */}
        <div className="bg-surface-2 rounded-full h-2">
          <div className="bg-surface h-2 rounded-full transition-all" style={{ width: `${(metaStep / 5) * 100}%` }} />
        </div>

        {/* Step 1: Objective */}
        {metaStep === 1 && (
          <div className="bg-surface border border-border rounded-2xl p-6 space-y-5">
            <div>
              <h2 className="text-lg font-bold text-text-primary mb-2">Maqsad tanlang</h2>
              <p className="text-text-tertiary text-sm">Reklama orqali nima erishmoqchisiz?</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                { value: 'leads', label: 'Lead yig\'ish', icon: '🎯' },
                { value: 'traffic', label: 'Sayt trafigi', icon: '🌐' },
                { value: 'sales', label: 'Sotuvlar', icon: '🛒' },
                { value: 'awareness', label: 'Xabardorlik', icon: '📣' },
              ].map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setMetaData(d => ({ ...d, objective: opt.value }))}
                  className={`p-4 rounded-xl border-2 transition-all text-left ${
                    metaData.objective === opt.value
                      ? 'border-border dark:border-white bg-surface-2'
                      : 'border-border hover:border-border'
                  }`}
                >
                  <span className="text-2xl block mb-1">{opt.icon}</span>
                  <span className="font-semibold text-sm text-text-primary">{opt.label}</span>
                </button>
              ))}
            </div>
            <button onClick={() => setMetaStep(2)} className="w-full bg-surface hover:bg-surface dark:hover:bg-surface-2 text-white dark:text-text-primary py-3 rounded-xl font-semibold">
              Davom etish →
            </button>
          </div>
        )}

        {/* Step 2: Audience */}
        {metaStep === 2 && (
          <div className="bg-surface border border-border rounded-2xl p-6 space-y-5">
            <div>
              <h2 className="text-lg font-bold text-text-primary mb-2">Auditoriya</h2>
              <p className="text-text-tertiary text-sm">Kim sizning reklama ko'radi?</p>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-text-tertiary mb-2">Yosh: {metaData.minAge}–{metaData.maxAge}</label>
                <div className="flex gap-2">
                  <input type="number" value={metaData.minAge} onChange={e => setMetaData(d => ({ ...d, minAge: Number(e.target.value) }))} className="w-20 border border-border rounded-lg px-3 py-2" />
                  <span className="flex items-center">–</span>
                  <input type="number" value={metaData.maxAge} onChange={e => setMetaData(d => ({ ...d, maxAge: Number(e.target.value) }))} className="w-20 border border-border rounded-lg px-3 py-2" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-text-tertiary mb-2">Joylashuv</label>
                <select value={metaData.location} onChange={e => setMetaData(d => ({ ...d, location: e.target.value }))} className="w-full border border-border rounded-lg px-4 py-2">
                  <option value="UZ">O'zbekiston</option>
                  <option value="KZ">Qozog'iston</option>
                  <option value="TJ">Tojikiston</option>
                  <option value="TM">Turkmaniston</option>
                </select>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setMetaStep(1)} className="flex-1 bg-surface-2 hover:bg-surface-2 dark:hover:bg-surface-2 text-text-primary py-3 rounded-xl font-semibold">
                ← Orqaga
              </button>
              <button onClick={() => setMetaStep(3)} className="flex-1 bg-surface hover:bg-surface dark:hover:bg-surface-2 text-white dark:text-text-primary py-3 rounded-xl font-semibold">
                Davom etish →
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Budget */}
        {metaStep === 3 && (
          <div className="bg-surface border border-border rounded-2xl p-6 space-y-5">
            <div>
              <h2 className="text-lg font-bold text-text-primary mb-2">Byudjet</h2>
              <p className="text-text-tertiary text-sm">Reklama uchun qancha pul sarflaysiz?</p>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-text-tertiary mb-2">Kunlik byudjet (USD)</label>
                <div className="flex items-center gap-2">
                  <span className="text-text-tertiary">$</span>
                  <input type="number" value={metaData.dailyBudget} onChange={e => setMetaData(d => ({ ...d, dailyBudget: e.target.value }))} placeholder="100" className="flex-1 border border-border rounded-lg px-4 py-2" />
                  <span className="text-text-tertiary text-sm">/kun</span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-text-tertiary mb-2">Kampaniya davomiyligi: {metaData.campaignDuration} kun</label>
                <input type="range" min="1" max="90" value={metaData.campaignDuration} onChange={e => setMetaData(d => ({ ...d, campaignDuration: Number(e.target.value) }))} className="w-full" />
                <p className="text-xs text-text-tertiary mt-2">Jami: ${(Number(metaData.dailyBudget) * metaData.campaignDuration || 0).toLocaleString()}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setMetaStep(2)} className="flex-1 bg-surface-2 hover:bg-surface-2 dark:hover:bg-surface-2 text-text-primary py-3 rounded-xl font-semibold">
                ← Orqaga
              </button>
              <button onClick={() => setMetaStep(4)} className="flex-1 bg-surface hover:bg-surface dark:hover:bg-surface-2 text-white dark:text-text-primary py-3 rounded-xl font-semibold">
                Davom etish →
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Creative */}
        {metaStep === 4 && (
          <div className="bg-surface border border-border rounded-2xl p-6 space-y-5">
            <div>
              <h2 className="text-lg font-bold text-text-primary mb-2">Kreativ</h2>
              <p className="text-text-tertiary text-sm">Reklama tasviri va matni</p>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-text-tertiary mb-2">Rasm/Video URL</label>
                <input type="text" value={metaData.creativeUrl} onChange={e => setMetaData(d => ({ ...d, creativeUrl: e.target.value }))} placeholder="https://..." className="w-full border border-border rounded-lg px-4 py-2" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-text-tertiary mb-2">Tekst</label>
                <textarea value={metaData.creativeText} onChange={e => setMetaData(d => ({ ...d, creativeText: e.target.value }))} placeholder="Reklama matni..." rows={3} className="w-full border border-border rounded-lg px-4 py-2" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-text-tertiary mb-2">CTA tugmasi</label>
                <select value={metaData.ctaButton} onChange={e => setMetaData(d => ({ ...d, ctaButton: e.target.value }))} className="w-full border border-border rounded-lg px-4 py-2">
                  <option value="learn_more">Batafsil</option>
                  <option value="contact_us">Bog'lanish</option>
                  <option value="shop_now">Sotib olish</option>
                  <option value="sign_up">Ro'yxatdan o'tish</option>
                </select>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setMetaStep(3)} className="flex-1 bg-surface-2 hover:bg-surface-2 dark:hover:bg-surface-2 text-text-primary py-3 rounded-xl font-semibold">
                ← Orqaga
              </button>
              <button onClick={() => setMetaStep(5)} className="flex-1 bg-surface hover:bg-surface dark:hover:bg-surface-2 text-white dark:text-text-primary py-3 rounded-xl font-semibold">
                Ko'rib chiqish →
              </button>
            </div>
          </div>
        )}

        {/* Step 5: Review */}
        {metaStep === 5 && (
          <div className="bg-surface border border-border rounded-2xl p-6 space-y-5">
            <div>
              <h2 className="text-lg font-bold text-text-primary mb-2">Ko'rib chiqing</h2>
              <p className="text-text-tertiary text-sm">Barcha ma"lumotlar to'g"rimi?</p>
            </div>
            <div className="bg-surface-2 rounded-xl p-4 space-y-3 text-sm">
              <div className="flex justify-between"><span className="text-text-tertiary">Maqsad:</span> <span className="font-semibold text-text-primary">{metaData.objective}</span></div>
              <div className="flex justify-between"><span className="text-text-tertiary">Yosh:</span> <span className="font-semibold text-text-primary">{metaData.minAge}–{metaData.maxAge}</span></div>
              <div className="flex justify-between"><span className="text-text-tertiary">Kunlik byudjet:</span> <span className="font-semibold text-text-primary">${metaData.dailyBudget}</span></div>
              <div className="flex justify-between"><span className="text-text-tertiary">Davom:</span> <span className="font-semibold text-text-primary">{metaData.campaignDuration} kun</span></div>
              <div className="flex justify-between"><span className="text-text-tertiary">Jami:</span> <span className="font-semibold text-text-primary text-base">${(Number(metaData.dailyBudget) * metaData.campaignDuration)}</span></div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setMetaStep(4)} className="flex-1 bg-surface-2 hover:bg-surface-2 dark:hover:bg-surface-2 text-text-primary py-3 rounded-xl font-semibold">
                ← Tahrir qilish
              </button>
              <button onClick={handleMetaLaunch} disabled={saving} className="flex-1 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white py-3 rounded-xl font-semibold">
                {saving ? '⏳' : '🚀'} Ishga tushirish
              </button>
            </div>
          </div>
        )}
      </div>
    )
  }

  // ── GOOGLE FORM ────────────────────────────────────────────────────────

  if (platform === 'google') {
    return (
      <div className="max-w-2xl mx-auto space-y-6 py-6">
        <div className="flex items-center justify-between">
          <div>
            <button onClick={() => setLaunchModeConfirmed(false)} className="text-text-tertiary hover:text-text-primary text-sm mb-2 flex items-center gap-1">
              ← Orqaga
            </button>
            <h1 className="text-2xl font-bold text-text-primary">🔍 Google Ads Kampaniyasi</h1>
            <p className="text-text-tertiary text-sm mt-1">Qadam {googleStep}/5</p>
          </div>
        </div>

        {error && <Alert variant="error">{error}</Alert>}

        <div className="bg-surface-2 rounded-full h-2">
          <div className="bg-surface h-2 rounded-full transition-all" style={{ width: `${(googleStep / 5) * 100}%` }} />
        </div>

        {googleStep === 1 && (
          <div className="bg-surface border border-border rounded-2xl p-6 space-y-5">
            <h2 className="text-lg font-bold text-text-primary">Kampaniya turi</h2>
            <div className="grid grid-cols-1 gap-3">
              {[
                { value: 'search', label: 'Qidiruv', desc: 'Google qidiruv natijalarida' },
                { value: 'display', label: 'Displey', desc: 'Veb-saytlar va applarida' },
                { value: 'smart', label: 'Smart', desc: 'AI avtomatik optimallashtirish' },
              ].map(opt => (
                <button key={opt.value} onClick={() => setGoogleData(d => ({ ...d, campaignType: opt.value }))} className={`p-4 rounded-xl border-2 text-left transition-all ${googleData.campaignType === opt.value ? 'border-border dark:border-white bg-surface-2' : 'border-border'}`}>
                  <div className="font-semibold text-text-primary">{opt.label}</div>
                  <div className="text-sm text-text-tertiary">{opt.desc}</div>
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <button onClick={() => setLaunchModeConfirmed(false)} className="flex-1 bg-surface-2 hover:bg-surface-2 text-text-primary py-3 rounded-xl font-semibold">
                ← Orqaga
              </button>
              <button onClick={() => setGoogleStep(2)} className="flex-1 bg-surface hover:bg-surface dark:hover:bg-surface-2 text-white dark:text-text-primary py-3 rounded-xl font-semibold">
                Davom →
              </button>
            </div>
          </div>
        )}

        {googleStep === 2 && (
          <div className="bg-surface border border-border rounded-2xl p-6 space-y-5">
            <h2 className="text-lg font-bold text-text-primary">Kalit so'zlar</h2>
            <textarea value={googleData.keywords} onChange={e => setGoogleData(d => ({ ...d, keywords: e.target.value }))} placeholder="Har bir kalit so'zni yangi qatorga yozing..." rows={4} className="w-full border border-border rounded-lg px-4 py-2" />
            <div className="flex gap-2">
              <button onClick={() => setGoogleStep(1)} className="flex-1 bg-surface-2 hover:bg-surface-2 dark:hover:bg-surface-2 text-text-primary py-3 rounded-xl font-semibold">←</button>
              <button onClick={() => setGoogleStep(3)} className="flex-1 bg-surface hover:bg-surface dark:hover:bg-surface-2 text-white dark:text-text-primary py-3 rounded-xl font-semibold">→</button>
            </div>
          </div>
        )}

        {googleStep === 3 && (
          <div className="bg-surface border border-border rounded-2xl p-6 space-y-5">
            <h2 className="text-lg font-bold text-text-primary">Reklama matni</h2>
            <div className="space-y-3">
              <input type="text" value={googleData.headline1} onChange={e => setGoogleData(d => ({ ...d, headline1: e.target.value }))} placeholder="Sarlavha 1" className="w-full border border-border rounded-lg px-4 py-2" />
              <input type="text" value={googleData.headline2} onChange={e => setGoogleData(d => ({ ...d, headline2: e.target.value }))} placeholder="Sarlavha 2" className="w-full border border-border rounded-lg px-4 py-2" />
              <input type="text" value={googleData.headline3} onChange={e => setGoogleData(d => ({ ...d, headline3: e.target.value }))} placeholder="Sarlavha 3" className="w-full border border-border rounded-lg px-4 py-2" />
              <textarea value={googleData.description1} onChange={e => setGoogleData(d => ({ ...d, description1: e.target.value }))} placeholder="Tavsif 1" rows={2} className="w-full border border-border rounded-lg px-4 py-2" />
              <textarea value={googleData.description2} onChange={e => setGoogleData(d => ({ ...d, description2: e.target.value }))} placeholder="Tavsif 2" rows={2} className="w-full border border-border rounded-lg px-4 py-2" />
            </div>
            <div className="flex gap-2">
              <button onClick={() => setGoogleStep(2)} className="flex-1 bg-surface-2 hover:bg-surface-2 dark:hover:bg-surface-2 text-text-primary py-3 rounded-xl font-semibold">←</button>
              <button onClick={() => setGoogleStep(4)} className="flex-1 bg-surface hover:bg-surface dark:hover:bg-surface-2 text-white dark:text-text-primary py-3 rounded-xl font-semibold">→</button>
            </div>
          </div>
        )}

        {googleStep === 4 && (
          <div className="bg-surface border border-border rounded-2xl p-6 space-y-5">
            <h2 className="text-lg font-bold text-text-primary">Byudjet va taklif</h2>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-semibold text-text-tertiary mb-2">Kunlik byudjet ($)</label>
                <input type="number" value={googleData.dailyBudget} onChange={e => setGoogleData(d => ({ ...d, dailyBudget: e.target.value }))} placeholder="50" className="w-full border border-border rounded-lg px-4 py-2" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-text-tertiary mb-2">Taklif strategiyasi</label>
                <select value={googleData.biddingStrategy} onChange={e => setGoogleData(d => ({ ...d, biddingStrategy: e.target.value }))} className="w-full border border-border rounded-lg px-4 py-2">
                  <option value="target_cpa">Target CPA</option>
                  <option value="maximize">Maksimal konversiyalar</option>
                  <option value="manual">Qo'lda</option>
                </select>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setGoogleStep(3)} className="flex-1 bg-surface-2 hover:bg-surface-2 dark:hover:bg-surface-2 text-text-primary py-3 rounded-xl font-semibold">←</button>
              <button onClick={() => setGoogleStep(5)} className="flex-1 bg-surface hover:bg-surface dark:hover:bg-surface-2 text-white dark:text-text-primary py-3 rounded-xl font-semibold">Ko'rib chiqing →</button>
            </div>
          </div>
        )}

        {googleStep === 5 && (
          <div className="bg-surface border border-border rounded-2xl p-6 space-y-5">
            <h2 className="text-lg font-bold text-text-primary">Ko'rib chiqing</h2>
            <div className="bg-surface-2 rounded-xl p-4 space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-text-tertiary">Turi:</span> <span className="font-semibold">{googleData.campaignType}</span></div>
              <div className="flex justify-between"><span className="text-text-tertiary">Byudjet:</span> <span className="font-semibold">${googleData.dailyBudget}/kun</span></div>
              <div className="flex justify-between"><span className="text-text-tertiary">Reklama soni:</span> <span className="font-semibold">3 sarlavha, 2 tavsif</span></div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setGoogleStep(4)} className="flex-1 bg-surface-2 hover:bg-surface-2 dark:hover:bg-surface-2 text-text-primary py-3 rounded-xl font-semibold">← Tahrir</button>
              <button onClick={handleGoogleLaunch} disabled={saving} className="flex-1 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white py-3 rounded-xl font-semibold">
                {saving ? '⏳' : '🚀'} Ishga tushirish
              </button>
            </div>
          </div>
        )}
      </div>
    )
  }

  // ── YANDEX FORM ────────────────────────────────────────────────────────

  if (platform === 'yandex') {
    return (
      <div className="max-w-2xl mx-auto space-y-6 py-6">
        <div className="flex items-center justify-between">
          <div>
            <button onClick={() => setLaunchModeConfirmed(false)} className="text-text-tertiary hover:text-text-primary text-sm mb-2">
              ← Orqaga
            </button>
            <h1 className="text-2xl font-bold text-text-primary">🟡 Yandex Direct Kampaniyasi</h1>
            <p className="text-text-tertiary text-sm mt-1">Qadam {yandexStep}/4</p>
          </div>
        </div>

        {error && <Alert variant="error">{error}</Alert>}

        <div className="bg-surface-2 rounded-full h-2">
          <div className="bg-surface h-2 rounded-full transition-all" style={{ width: `${(yandexStep / 4) * 100}%` }} />
        </div>

        {yandexStep === 1 && (
          <div className="bg-surface border border-border rounded-2xl p-6 space-y-5">
            <h2 className="text-lg font-bold text-text-primary">Kampaniya turi</h2>
            <div className="space-y-3">
              {[
                { value: 'search', label: 'Qidiruv', desc: 'Yandex qidiruv natijalarida' },
                { value: 'smart', label: 'Smart bannerlar', desc: 'Avtomatik reklama joylarida' },
              ].map(opt => (
                <button key={opt.value} onClick={() => setYandexData(d => ({ ...d, campaignType: opt.value }))} className={`p-4 rounded-xl border-2 text-left ${yandexData.campaignType === opt.value ? 'border-border dark:border-white bg-surface-2' : 'border-border'}`}>
                  <div className="font-semibold">{opt.label}</div>
                  <div className="text-sm text-text-tertiary">{opt.desc}</div>
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <button onClick={() => setLaunchModeConfirmed(false)} className="flex-1 bg-surface-2 py-3 rounded-xl font-semibold">← Orqaga</button>
              <button onClick={() => setYandexStep(2)} className="flex-1 bg-surface text-white dark:text-text-primary py-3 rounded-xl font-semibold">Davom →</button>
            </div>
          </div>
        )}

        {yandexStep === 2 && (
          <div className="bg-surface border border-border rounded-2xl p-6 space-y-5">
            <h2 className="text-lg font-bold text-text-primary">Kalit so'zlar</h2>
            <textarea value={yandexData.keywords} onChange={e => setYandexData(d => ({ ...d, keywords: e.target.value }))} placeholder="Kalit so'zlar..." rows={4} className="w-full border border-border rounded-lg px-4 py-2" />
            <textarea value={yandexData.negativeKeywords} onChange={e => setYandexData(d => ({ ...d, negativeKeywords: e.target.value }))} placeholder="Salbiy kalit so'zlar (ixtiyoriy)..." rows={2} className="w-full border border-border rounded-lg px-4 py-2" />
            <div className="flex gap-2">
              <button onClick={() => setYandexStep(1)} className="flex-1 bg-surface-2 py-3 rounded-xl">←</button>
              <button onClick={() => setYandexStep(3)} className="flex-1 bg-surface text-white dark:text-text-primary py-3 rounded-xl">→</button>
            </div>
          </div>
        )}

        {yandexStep === 3 && (
          <div className="bg-surface border border-border rounded-2xl p-6 space-y-5">
            <h2 className="text-lg font-bold text-text-primary">Reklama matni</h2>
            <input type="text" value={yandexData.headline} onChange={e => setYandexData(d => ({ ...d, headline: e.target.value }))} placeholder="Sarlavha" className="w-full border border-border rounded-lg px-4 py-2" />
            <textarea value={yandexData.description} onChange={e => setYandexData(d => ({ ...d, description: e.target.value }))} placeholder="Tavsif" rows={3} className="w-full border border-border rounded-lg px-4 py-2" />
            <input type="text" value={yandexData.url} onChange={e => setYandexData(d => ({ ...d, url: e.target.value }))} placeholder="Sayt manzili" className="w-full border border-border rounded-lg px-4 py-2" />
            <div className="flex gap-2">
              <button onClick={() => setYandexStep(2)} className="flex-1 bg-surface-2 py-3 rounded-xl">←</button>
              <button onClick={() => setYandexStep(4)} className="flex-1 bg-surface text-white dark:text-text-primary py-3 rounded-xl">Ko'rib chiqing →</button>
            </div>
          </div>
        )}

        {yandexStep === 4 && (
          <div className="bg-surface border border-border rounded-2xl p-6 space-y-5">
            <h2 className="text-lg font-bold text-text-primary">Byudjet va strategiya</h2>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-semibold text-text-tertiary mb-2">Kunlik chegaralash ($)</label>
                <input type="number" value={yandexData.dailyBudget} onChange={e => setYandexData(d => ({ ...d, dailyBudget: e.target.value }))} placeholder="50" className="w-full border border-border rounded-lg px-4 py-2" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-text-tertiary mb-2">Taklif strategiyasi</label>
                <select value={yandexData.strategy} onChange={e => setYandexData(d => ({ ...d, strategy: e.target.value }))} className="w-full border border-border rounded-lg px-4 py-2">
                  <option value="average_cpc">O'rtacha CPC</option>
                  <option value="highest_position">Eng yuqori pozitsiya</option>
                  <option value="weekly_budget">Haftada bir</option>
                </select>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setYandexStep(3)} className="flex-1 bg-surface-2 py-3 rounded-xl">← Tahrir</button>
              <button onClick={handleYandexLaunch} disabled={saving} className="flex-1 bg-emerald-600 text-white py-3 rounded-xl font-semibold">
                {saving ? '⏳' : '🚀'} Ishga tushirish
              </button>
            </div>
          </div>
        )}
      </div>
    )
  }
}
