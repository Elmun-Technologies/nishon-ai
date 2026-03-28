'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { formatSpend } from '@/lib/portfolio-data'

const STEPS = [
  { id: 1, label: 'Ad account ulash', icon: '🔗', done: false },
  { id: 2, label: 'Profil to\'ldirish', icon: '👤', done: false },
  { id: 3, label: 'Ko\'rinuvchanlik sozlash', icon: '👁️', done: false },
  { id: 4, label: 'Tasdiqlash kutish', icon: '✓', done: false },
]

const CONNECTED_PLATFORMS = [
  { id: 'meta', name: 'Meta Ads', icon: '📘', color: '#1877F2', status: 'connected', accountsCount: 0, spend: 0 },
  { id: 'google', name: 'Google Ads', icon: '🔍', color: '#4285F4', status: 'disconnected', accountsCount: 0, spend: 0 },
  { id: 'yandex', name: 'Yandex Direct', icon: '🟡', color: '#FFCC00', status: 'disconnected', accountsCount: 0, spend: 0 },
  { id: 'telegram', name: 'Telegram Ads', icon: '✈️', color: '#2CA5E0', status: 'disconnected', accountsCount: 0, spend: 0 },
]

const VISIBILITY_OPTIONS = [
  { id: 'roas', label: 'ROAS ko\'rsatkichi' },
  { id: 'cpa', label: 'CPA ko\'rsatkichi' },
  { id: 'spend', label: 'Sarflangan byudjet' },
  { id: 'campaigns', label: 'Kampaniyalar soni' },
  { id: 'niches', label: 'Niche ixtisoslashuv' },
  { id: 'monthly', label: 'Oylik dinamika grafigi' },
  { id: 'recent', label: 'So\'nggi kampaniyalar (anonimlashtrilgan)' },
]

function SetupStep({ step, active, done }: { step: typeof STEPS[0]; active: boolean; done: boolean }) {
  return (
    <div className={`flex items-center gap-3 p-3 rounded-xl transition-all ${active ? 'bg-[#7C3AED]/10 border border-[#7C3AED]/30' : done ? 'opacity-60' : 'opacity-40'}`}>
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm ${done ? 'bg-emerald-500/20 text-emerald-400' : active ? 'bg-[#7C3AED]/20 text-[#A78BFA]' : 'bg-[#1C1C27] text-[#6B7280]'}`}>
        {done ? '✓' : step.icon}
      </div>
      <span className={`text-sm ${active ? 'text-white font-medium' : 'text-[#9CA3AF]'}`}>{step.label}</span>
    </div>
  )
}

export default function PortfolioDashboardPage() {
  const router = useRouter()
  const [activeStep, setActiveStep] = useState(1)
  const [completedSteps, setCompletedSteps] = useState<number[]>([])
  const [platforms, setPlatforms] = useState(CONNECTED_PLATFORMS)
  const [visibility, setVisibility] = useState<string[]>(['roas', 'cpa', 'campaigns', 'niches'])
  const [profile, setProfile] = useState({
    title: '',
    bio: '',
    price: '',
    niches: [] as string[],
    isPublic: false,
  })
  const [nicheInput, setNicheInput] = useState('')
  const [connectingPlatform, setConnectingPlatform] = useState<string | null>(null)
  const [portfolioLive, setPortfolioLive] = useState(false)

  const allDone = completedSteps.length >= 3

  const completeStep = (step: number) => {
    if (!completedSteps.includes(step)) setCompletedSteps(prev => [...prev, step])
    if (step < 4) setActiveStep(step + 1)
  }

  const handleConnectPlatform = async (id: string) => {
    setConnectingPlatform(id)
    // Simulate OAuth flow
    await new Promise(r => setTimeout(r, 1500))
    setPlatforms(prev => prev.map(p =>
      p.id === id ? { ...p, status: 'connected', accountsCount: Math.floor(Math.random() * 5) + 1 } : p
    ))
    setConnectingPlatform(null)
  }

  const toggleVisibility = (id: string) =>
    setVisibility(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])

  const addNiche = () => {
    const v = nicheInput.trim()
    if (v && !profile.niches.includes(v)) {
      setProfile(p => ({ ...p, niches: [...p.niches, v] }))
      setNicheInput('')
    }
  }

  const handlePublish = async () => {
    setPortfolioLive(true)
  }

  if (portfolioLive) {
    return (
      <div className="p-8 max-w-2xl mx-auto text-center">
        <div className="text-6xl mb-4">🎉</div>
        <h2 className="text-2xl font-bold text-white mb-3">Portfolio nashr qilindi!</h2>
        <p className="text-[#9CA3AF] mb-8">
          Profilingiz endi ommaviy katalogda ko'rinmoqda. Tadbirkorlar siz bilan bog'lana olishadi.
        </p>
        <div className="bg-[#13131A] border border-[#2A2A3A] rounded-xl p-4 mb-8 flex items-center gap-3">
          <span className="text-[#6B7280] text-sm flex-1 truncate">nishon.ai/portfolio/your-name</span>
          <button
            onClick={() => router.push('/portfolio')}
            className="text-[#7C3AED] text-sm font-semibold hover:text-[#A78BFA] transition-colors"
          >
            Ko'rish →
          </button>
        </div>
        <div className="flex gap-3 justify-center">
          <button
            onClick={() => router.push('/portfolio')}
            className="bg-[#7C3AED] hover:bg-[#6D28D9] text-white px-6 py-3 rounded-xl font-semibold transition-all"
          >
            Katalogga o'tish
          </button>
          <button
            onClick={() => setPortfolioLive(false)}
            className="bg-[#1C1C27] hover:bg-[#2A2A3A] text-white px-6 py-3 rounded-xl border border-[#2A2A3A] transition-all"
          >
            Sozlamalar
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-extrabold text-white">Portfolio boshqaruv</h1>
          <p className="text-[#9CA3AF] text-sm mt-1">
            Natijalaringizni tasdiqlang va tadbirkorlarga ko'rsating
          </p>
        </div>
        {allDone && (
          <Link
            href="/portfolio"
            className="text-sm text-[#7C3AED] hover:text-[#A78BFA] border border-[#7C3AED]/30 px-4 py-2 rounded-lg transition-all"
          >
            Jamoatchilik ko'rinishi →
          </Link>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">

        {/* ── STEPS SIDEBAR ── */}
        <div className="lg:col-span-1">
          <div className="bg-[#13131A] border border-[#2A2A3A] rounded-2xl p-4 sticky top-4">
            <p className="text-xs text-[#6B7280] uppercase font-bold tracking-wider mb-3 px-1">Qadamlar</p>
            <div className="space-y-1">
              {STEPS.map(step => (
                <button key={step.id} onClick={() => setActiveStep(step.id)} className="w-full text-left">
                  <SetupStep
                    step={step}
                    active={activeStep === step.id}
                    done={completedSteps.includes(step.id)}
                  />
                </button>
              ))}
            </div>
            {/* progress */}
            <div className="mt-4 pt-4 border-t border-[#2A2A3A]">
              <div className="flex justify-between text-xs text-[#6B7280] mb-1">
                <span>Jarayon</span>
                <span>{completedSteps.length}/{STEPS.length}</span>
              </div>
              <div className="w-full bg-[#1C1C27] rounded-full h-1.5">
                <div
                  className="bg-[#7C3AED] h-1.5 rounded-full transition-all"
                  style={{ width: `${(completedSteps.length / STEPS.length) * 100}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* ── MAIN CONTENT ── */}
        <div className="lg:col-span-3 space-y-6">

          {/* ── STEP 1: Connect platforms ── */}
          {activeStep === 1 && (
            <div className="bg-[#13131A] border border-[#2A2A3A] rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-2xl">🔗</span>
                <h2 className="text-lg font-bold text-white">Ad accountlarini ulash</h2>
              </div>
              <p className="text-[#9CA3AF] text-sm mb-6">
                Kamida bitta platformani ulang. Haqiqiy kampaniya natijalari avtomatik tortib olinadi va tasdiqlangan holda ko'rsatiladi.
              </p>

              <div className="space-y-3">
                {platforms.map(p => (
                  <div
                    key={p.id}
                    className={`flex items-center justify-between p-4 rounded-xl border transition-all ${
                      p.status === 'connected'
                        ? 'bg-emerald-500/5 border-emerald-500/20'
                        : 'bg-[#0D0D14] border-[#2A2A3A]'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{p.icon}</span>
                      <div>
                        <div className="text-white font-medium text-sm">{p.name}</div>
                        {p.status === 'connected' ? (
                          <div className="text-emerald-400 text-xs">✓ Ulangan · {p.accountsCount} ta account</div>
                        ) : (
                          <div className="text-[#6B7280] text-xs">Ulanmagan</div>
                        )}
                      </div>
                    </div>

                    {p.status === 'connected' ? (
                      <button
                        onClick={() => setPlatforms(prev => prev.map(x => x.id === p.id ? { ...x, status: 'disconnected', accountsCount: 0 } : x))}
                        className="text-xs text-[#EF4444] hover:text-red-300 border border-[#EF4444]/20 px-3 py-1.5 rounded-lg transition-all"
                      >
                        Uzish
                      </button>
                    ) : (
                      <button
                        onClick={() => handleConnectPlatform(p.id)}
                        disabled={connectingPlatform === p.id}
                        className="text-sm text-white bg-[#1C1C27] hover:bg-[#2A2A3A] border border-[#2A2A3A] px-4 py-2 rounded-lg transition-all disabled:opacity-50 flex items-center gap-2"
                      >
                        {connectingPlatform === p.id ? (
                          <><span className="w-3 h-3 border border-white/30 border-t-white rounded-full animate-spin" /> Ulanmoqda...</>
                        ) : (
                          'Ulash'
                        )}
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <div className="mt-4 p-4 bg-[#0D0D14] border border-[#2A2A3A] rounded-xl">
                <div className="flex items-start gap-2">
                  <span className="text-[#7C3AED] mt-0.5">ℹ</span>
                  <p className="text-[#9CA3AF] text-xs leading-relaxed">
                    Faqat o'qish huquqi so'raladi. Nishon AI hech qachon kampaniyalaringizni o'zgartirmaydi yoki to'xtatmaydi.
                    Ma'lumotlar 24 soatda bir marta yangilanadi.
                  </p>
                </div>
              </div>

              <div className="flex justify-end mt-6">
                <button
                  onClick={() => completeStep(1)}
                  disabled={!platforms.some(p => p.status === 'connected')}
                  className="bg-[#7C3AED] hover:bg-[#6D28D9] disabled:opacity-40 text-white px-6 py-3 rounded-xl font-semibold transition-all"
                >
                  Davom etish →
                </button>
              </div>
            </div>
          )}

          {/* ── STEP 2: Profile ── */}
          {activeStep === 2 && (
            <div className="bg-[#13131A] border border-[#2A2A3A] rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-2xl">👤</span>
                <h2 className="text-lg font-bold text-white">Profilni to'ldirish</h2>
              </div>
              <p className="text-[#9CA3AF] text-sm mb-6">
                Tadbirkorlar siz haqingizda bilib olsinlari uchun.
              </p>

              <div className="space-y-5">
                <div>
                  <label className="text-[#9CA3AF] text-xs font-semibold uppercase tracking-wider block mb-2">Sarlavha *</label>
                  <input
                    value={profile.title}
                    onChange={e => setProfile(p => ({ ...p, title: e.target.value }))}
                    placeholder="Masalan: Senior Meta & Google Ads Specialist"
                    className="w-full bg-[#0D0D14] border border-[#2A2A3A] rounded-lg px-4 py-3 text-white text-sm placeholder:text-[#6B7280] focus:outline-none focus:border-[#7C3AED]/50"
                  />
                </div>

                <div>
                  <label className="text-[#9CA3AF] text-xs font-semibold uppercase tracking-wider block mb-2">Bio *</label>
                  <textarea
                    value={profile.bio}
                    onChange={e => setProfile(p => ({ ...p, bio: e.target.value }))}
                    placeholder="Tajribangiz, ixtisosligingiz va natijalari haqida..."
                    rows={4}
                    className="w-full bg-[#0D0D14] border border-[#2A2A3A] rounded-lg px-4 py-3 text-white text-sm placeholder:text-[#6B7280] focus:outline-none focus:border-[#7C3AED]/50 resize-none"
                  />
                </div>

                <div>
                  <label className="text-[#9CA3AF] text-xs font-semibold uppercase tracking-wider block mb-2">Narx (oyiga, USD)</label>
                  <div className="flex gap-2 items-center">
                    <span className="text-[#6B7280]">$</span>
                    <input
                      type="number"
                      value={profile.price}
                      onChange={e => setProfile(p => ({ ...p, price: e.target.value }))}
                      placeholder="500"
                      className="w-40 bg-[#0D0D14] border border-[#2A2A3A] rounded-lg px-4 py-3 text-white text-sm placeholder:text-[#6B7280] focus:outline-none focus:border-[#7C3AED]/50"
                    />
                    <span className="text-[#6B7280] text-sm">dan boshlab</span>
                  </div>
                </div>

                <div>
                  <label className="text-[#9CA3AF] text-xs font-semibold uppercase tracking-wider block mb-2">Niche ixtisoslashuv</label>
                  <div className="flex gap-2 mb-3">
                    <input
                      value={nicheInput}
                      onChange={e => setNicheInput(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && addNiche()}
                      placeholder="E-commerce, Fashion... (Enter)"
                      className="flex-1 bg-[#0D0D14] border border-[#2A2A3A] rounded-lg px-3 py-2 text-white text-sm placeholder:text-[#6B7280] focus:outline-none focus:border-[#7C3AED]/50"
                    />
                    <button
                      onClick={addNiche}
                      className="bg-[#1C1C27] border border-[#2A2A3A] text-white text-sm px-4 py-2 rounded-lg hover:bg-[#2A2A3A] transition-all"
                    >
                      Qo'shish
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {profile.niches.map(n => (
                      <span key={n} className="flex items-center gap-1.5 bg-[#1C1C27] border border-[#2A2A3A] text-white text-xs px-3 py-1.5 rounded-lg">
                        {n}
                        <button
                          onClick={() => setProfile(p => ({ ...p, niches: p.niches.filter(x => x !== n) }))}
                          className="text-[#6B7280] hover:text-white"
                        >
                          ✕
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex justify-between mt-6">
                <button onClick={() => setActiveStep(1)} className="text-[#9CA3AF] hover:text-white text-sm transition-colors">
                  ← Orqaga
                </button>
                <button
                  onClick={() => completeStep(2)}
                  disabled={!profile.title || !profile.bio}
                  className="bg-[#7C3AED] hover:bg-[#6D28D9] disabled:opacity-40 text-white px-6 py-3 rounded-xl font-semibold transition-all"
                >
                  Davom etish →
                </button>
              </div>
            </div>
          )}

          {/* ── STEP 3: Visibility ── */}
          {activeStep === 3 && (
            <div className="bg-[#13131A] border border-[#2A2A3A] rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-2xl">👁️</span>
                <h2 className="text-lg font-bold text-white">Ko'rinuvchanlikni sozlash</h2>
              </div>
              <p className="text-[#9CA3AF] text-sm mb-6">
                Qaysi ma'lumotlar ommaviy ko'rinishida bo'lishini tanlang.
              </p>

              <div className="space-y-3">
                {VISIBILITY_OPTIONS.map(opt => (
                  <label
                    key={opt.id}
                    className={`flex items-center justify-between p-4 rounded-xl border cursor-pointer transition-all ${
                      visibility.includes(opt.id)
                        ? 'bg-[#7C3AED]/5 border-[#7C3AED]/30'
                        : 'bg-[#0D0D14] border-[#2A2A3A] hover:border-[#3A3A4A]'
                    }`}
                  >
                    <span className="text-white text-sm">{opt.label}</span>
                    <div
                      onClick={() => toggleVisibility(opt.id)}
                      className={`w-11 h-6 rounded-full transition-colors flex items-center px-0.5 cursor-pointer ${
                        visibility.includes(opt.id) ? 'bg-[#7C3AED]' : 'bg-[#2A2A3A]'
                      }`}
                    >
                      <div className={`w-5 h-5 bg-white rounded-full transition-transform ${visibility.includes(opt.id) ? 'translate-x-5' : 'translate-x-0'}`} />
                    </div>
                  </label>
                ))}
              </div>

              {/* Preview */}
              <div className="mt-6 p-4 bg-[#0D0D14] border border-[#2A2A3A] rounded-xl">
                <p className="text-[#9CA3AF] text-xs mb-2">Ko'rinadigan ma'lumotlar:</p>
                <div className="flex flex-wrap gap-1.5">
                  {visibility.map(v => (
                    <span key={v} className="text-[10px] bg-[#7C3AED]/10 border border-[#7C3AED]/20 text-[#A78BFA] px-2.5 py-1 rounded-full">
                      {VISIBILITY_OPTIONS.find(o => o.id === v)?.label}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex justify-between mt-6">
                <button onClick={() => setActiveStep(2)} className="text-[#9CA3AF] hover:text-white text-sm transition-colors">
                  ← Orqaga
                </button>
                <button
                  onClick={() => completeStep(3)}
                  className="bg-[#7C3AED] hover:bg-[#6D28D9] text-white px-6 py-3 rounded-xl font-semibold transition-all"
                >
                  Davom etish →
                </button>
              </div>
            </div>
          )}

          {/* ── STEP 4: Publish ── */}
          {activeStep === 4 && (
            <div className="bg-[#13131A] border border-[#2A2A3A] rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-2xl">🚀</span>
                <h2 className="text-lg font-bold text-white">Portfolio nashr qilish</h2>
              </div>
              <p className="text-[#9CA3AF] text-sm mb-6">
                Hamma narsa tayyor. Nashr qilingandan so'ng profilingiz katalogda ko'rinadi.
              </p>

              {/* Summary */}
              <div className="space-y-3 mb-6">
                <div className="flex items-center gap-3 p-3 bg-[#0D0D14] border border-[#2A2A3A] rounded-xl">
                  <span className="text-xl">🔗</span>
                  <div className="flex-1">
                    <div className="text-white text-sm font-medium">Ulangan platformalar</div>
                    <div className="text-[#9CA3AF] text-xs">
                      {platforms.filter(p => p.status === 'connected').map(p => p.name).join(', ') || 'Hech qaysi'}
                    </div>
                  </div>
                  {platforms.some(p => p.status === 'connected') ? (
                    <span className="text-emerald-400 text-sm">✓</span>
                  ) : (
                    <span className="text-[#EF4444] text-sm">✗</span>
                  )}
                </div>

                <div className="flex items-center gap-3 p-3 bg-[#0D0D14] border border-[#2A2A3A] rounded-xl">
                  <span className="text-xl">👤</span>
                  <div className="flex-1">
                    <div className="text-white text-sm font-medium">Profil</div>
                    <div className="text-[#9CA3AF] text-xs">{profile.title || 'To\'ldirilmagan'}</div>
                  </div>
                  {profile.title && profile.bio ? (
                    <span className="text-emerald-400 text-sm">✓</span>
                  ) : (
                    <button onClick={() => setActiveStep(2)} className="text-[#7C3AED] text-xs">To'ldirish</button>
                  )}
                </div>

                <div className="flex items-center gap-3 p-3 bg-[#0D0D14] border border-[#2A2A3A] rounded-xl">
                  <span className="text-xl">👁️</span>
                  <div className="flex-1">
                    <div className="text-white text-sm font-medium">Ko'rinuvchanlik</div>
                    <div className="text-[#9CA3AF] text-xs">{visibility.length} ta ma'lumot ko'rinadi</div>
                  </div>
                  <span className="text-emerald-400 text-sm">✓</span>
                </div>
              </div>

              {/* Public URL preview */}
              <div className="p-4 bg-[#0D0D14] border border-[#7C3AED]/20 rounded-xl mb-6">
                <p className="text-xs text-[#6B7280] mb-1">Portfolio URL:</p>
                <p className="text-white font-mono text-sm">nishon.ai/portfolio/your-username</p>
              </div>

              <div className="flex justify-between">
                <button onClick={() => setActiveStep(3)} className="text-[#9CA3AF] hover:text-white text-sm transition-colors">
                  ← Orqaga
                </button>
                <button
                  onClick={handlePublish}
                  disabled={!platforms.some(p => p.status === 'connected') || !profile.title}
                  className="bg-[#7C3AED] hover:bg-[#6D28D9] disabled:opacity-40 text-white px-8 py-3 rounded-xl font-bold shadow-[0_0_20px_rgba(124,58,237,0.3)] transition-all"
                >
                  🚀 Nashr qilish
                </button>
              </div>
            </div>
          )}

          {/* ── LIVE TRACKING STATS (shown when at least 1 platform connected) ── */}
          {platforms.some(p => p.status === 'connected') && (
            <div className="bg-[#13131A] border border-[#2A2A3A] rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-5">
                <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                <h3 className="text-white font-bold">Live Ma'lumotlar</h3>
                <span className="text-xs text-[#6B7280] ml-auto">Oxirgi sync: hozirgina</span>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { label: "Faol kampaniyalar", value: "—", icon: "🎯" },
                  { label: "Bu oylik sarflangan", value: "—", icon: "💰" },
                  { label: "O'rtacha ROAS", value: "—", icon: "📈" },
                  { label: "Aktiv accountlar", value: platforms.filter(p => p.status === 'connected').reduce((s, p) => s + p.accountsCount, 0), icon: "🔗" },
                ].map(s => (
                  <div key={s.label} className="bg-[#0D0D14] border border-[#2A2A3A] rounded-xl p-3 text-center">
                    <div className="text-2xl mb-1">{s.icon}</div>
                    <div className="text-white font-bold text-lg">{s.value}</div>
                    <div className="text-[#6B7280] text-xs mt-0.5 leading-tight">{s.label}</div>
                  </div>
                ))}
              </div>

              <p className="text-[#6B7280] text-xs mt-4 text-center">
                Haqiqiy statistika accountlar to'liq ulanganidan so'ng 24 soat ichida ko'rinadi
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
