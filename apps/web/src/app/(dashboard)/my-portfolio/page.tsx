'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { agents } from '@/lib/api-client'
import { Spinner } from '@/components/ui/Spinner'
import { Alert } from '@/components/ui/Alert'
import { AdAccountsConnection } from '@/components/portfolio/AdAccountsConnection'

const STEPS = [
  { id: 0, label: 'Reklama hisoblarini ulash', icon: '🔗' },
  { id: 1, label: 'Profil to\'ldirish', icon: '👤' },
  { id: 2, label: 'Ko\'rinuvchanlik', icon: '👁️' },
  { id: 3, label: 'Nashr qilish', icon: '🚀' },
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

const NICHE_SUGGESTIONS = ['E-commerce', 'Fashion', 'Beauty & Cosmetics', 'Food & Beverage', 'Real Estate', 'Education', 'B2B SaaS', 'Healthcare', 'Finance']
const PLATFORM_OPTIONS = ['meta', 'google', 'yandex', 'telegram', 'tiktok', 'youtube']

function SetupStep({ step, active, done }: { step: typeof STEPS[0]; active: boolean; done: boolean }) {
  return (
    <div className={`flex items-center gap-3 p-3 rounded-xl transition-all ${active ? 'bg-surface-2 border border-border' : done ? 'opacity-60' : 'opacity-40'}`}>
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm ${done ? 'bg-emerald-500/15 text-emerald-500' : active ? 'bg-surface-2 text-text-primary' : 'bg-surface-2 text-text-secondary'}`}>
        {done ? '✓' : step.icon}
      </div>
      <span className={`text-sm ${active ? 'text-text-primary font-medium' : 'text-text-tertiary'}`}>{step.label}</span>
    </div>
  )
}

export default function PortfolioDashboardPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [existingProfile, setExistingProfile] = useState<any>(null)
  const [activeStep, setActiveStep] = useState(0)
  const [completedSteps, setCompletedSteps] = useState<number[]>([])
  const [portfolioLive, setPortfolioLive] = useState(false)

  const [profile, setProfile] = useState({
    displayName: '',
    title: '',
    bio: '',
    location: '',
    monthlyRate: '',
    commissionRate: '',
    pricingModel: 'fixed' as 'fixed' | 'commission' | 'hybrid',
    niches: [] as string[],
    platforms: [] as string[],
  })
  const [nicheInput, setNicheInput] = useState('')
  const [visibility, setVisibility] = useState<string[]>(['roas', 'cpa', 'campaigns', 'niches'])

  // Load existing profile on mount
  useEffect(() => {
    agents.mine()
      .then(res => {
        const list = res.data as any[]
        if (list && list.length > 0) {
          const p = list[0]
          setExistingProfile(p)
          setProfile({
            displayName: p.displayName || '',
            title: p.title || '',
            bio: p.bio || '',
            location: p.location || '',
            monthlyRate: String(p.monthlyRate || ''),
            commissionRate: String(p.commissionRate || ''),
            pricingModel: p.pricingModel || 'fixed',
            niches: p.niches || [],
            platforms: p.platforms || [],
          })
          if (p.isPublished) {
            setPortfolioLive(true)
          }
          setCompletedSteps([1, 2])
        }
      })
      .catch(() => { /* no profile yet */ })
      .finally(() => setLoading(false))
  }, [])

  const completeStep = (step: number) => {
    if (!completedSteps.includes(step)) setCompletedSteps(prev => [...prev, step])
    if (step < STEPS.length) setActiveStep(step + 1)
  }

  const addNiche = () => {
    const v = nicheInput.trim()
    if (v && !profile.niches.includes(v)) {
      setProfile(p => ({ ...p, niches: [...p.niches, v] }))
      setNicheInput('')
    }
  }

  const togglePlatform = (p: string) => {
    setProfile(prev => ({
      ...prev,
      platforms: prev.platforms.includes(p) ? prev.platforms.filter(x => x !== p) : [...prev.platforms, p],
    }))
  }

  const toggleVisibility = (id: string) =>
    setVisibility(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])

  const handlePublish = async () => {
    setSaving(true)
    setError('')
    try {
      const dto = {
        agentType: 'human' as const,
        displayName: profile.displayName || profile.title,
        title: profile.title,
        bio: profile.bio,
        location: profile.location,
        monthlyRate: profile.monthlyRate ? Number(profile.monthlyRate) : 0,
        commissionRate: profile.commissionRate ? Number(profile.commissionRate) : 0,
        pricingModel: profile.pricingModel,
        niches: profile.niches,
        platforms: profile.platforms,
      }

      let savedProfile: any
      if (existingProfile) {
        // Update existing
        const res = await agents.update(existingProfile.id, dto)
        savedProfile = res.data
      } else {
        // Create new
        const res = await agents.create(dto)
        savedProfile = res.data
        setExistingProfile(savedProfile)
      }

      // Publish if not already published
      if (!savedProfile.isPublished) {
        await agents.togglePublish(savedProfile.id)
      }

      setPortfolioLive(true)
      setSuccess('Portfolio muvaffaqiyatli nashr qilindi!')
    } catch (e: any) {
      setError(e?.message || 'Xatolik yuz berdi')
    } finally {
      setSaving(false)
    }
  }

  const handleUnpublish = async () => {
    if (!existingProfile) return
    setSaving(true)
    try {
      await agents.togglePublish(existingProfile.id)
      setPortfolioLive(false)
      setSuccess('Portfolio yashirildi.')
      setTimeout(() => setSuccess(''), 3000)
    } catch (e: any) {
      setError(e?.message || 'Xatolik')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Spinner size="lg" />
      </div>
    )
  }

  if (portfolioLive && existingProfile) {
    return (
      <div className="p-8 max-w-2xl mx-auto text-center">
        <div className="text-6xl mb-4">🎉</div>
        <h2 className="text-2xl font-bold text-text-primary mb-3">Portfolio nashr qilindi!</h2>
        <p className="text-text-secondary mb-8">
          Profilingiz endi ommaviy katalogda ko'rinmoqda. Tadbirkorlar siz bilan bog'lana olishadi.
        </p>
        {success && <Alert variant="success" className="mb-4">{success}</Alert>}
        {error && <Alert variant="error" className="mb-4">{error}</Alert>}
        <div className="bg-surface-elevated border border-border rounded-xl p-4 mb-8 flex items-center gap-3">
          <span className="text-text-secondary text-sm flex-1 truncate">
            performa.ai/portfolio/{existingProfile.slug}
          </span>
          <button
            onClick={() => router.push(`/portfolio/${existingProfile.slug}`)}
            className="text-text-primary text-sm font-semibold hover:text-text-primary transition-colors"
          >
            Ko'rish →
          </button>
        </div>
        <div className="flex gap-3 justify-center">
          <button
            onClick={() => router.push('/portfolio')}
            className="bg-text-primary hover:bg-surface-2 text-white px-6 py-3 rounded-xl font-semibold transition-all"
          >
            Katalogga o'tish
          </button>
          <button
            onClick={() => { setPortfolioLive(false); setActiveStep(1) }}
            className="bg-surface-2 hover:bg-surface-2 text-text-primary px-6 py-3 rounded-xl border border-border transition-all"
          >
            Tahrirlash
          </button>
          <button
            onClick={handleUnpublish}
            disabled={saving}
            className="text-red-500 hover:text-red-500 text-sm border border-red-500/20 px-4 py-3 rounded-xl hover:bg-red-500/10 transition-all"
          >
            {saving ? '...' : 'Yashirish'}
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
          <h1 className="text-2xl font-extrabold text-text-primary">
            {existingProfile ? 'Profil tahrirlash' : 'Portfolio yaratish'}
          </h1>
          <p className="text-text-tertiary text-sm mt-1">
            Natijalaringizni ko'rsating va tadbirkorlardan buyurtma oling
          </p>
        </div>
        {existingProfile && (
          <Link
            href={`/portfolio/${existingProfile.slug}`}
            className="text-sm text-text-primary hover:text-text-primary border border-border px-4 py-2 rounded-lg transition-all"
          >
            Jamoatchilik ko'rinishi →
          </Link>
        )}
      </div>

      {error && <Alert variant="error" className="mb-4">{error}</Alert>}
      {success && <Alert variant="success" className="mb-4">{success}</Alert>}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">

        {/* ── STEPS SIDEBAR ── */}
        <div className="lg:col-span-1">
          <div className="bg-surface-elevated border border-border rounded-2xl p-4 sticky top-4">
            <p className="text-xs text-text-secondary uppercase font-bold tracking-wider mb-3 px-1">Qadamlar</p>
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
            <div className="mt-4 pt-4 border-t border-border">
              <div className="flex justify-between text-xs text-text-secondary mb-1">
                <span>Jarayon</span>
                <span>{completedSteps.length}/{STEPS.length}</span>
              </div>
              <div className="w-full bg-surface-2 rounded-full h-1.5">
                <div
                  className="bg-text-primary h-1.5 rounded-full transition-all"
                  style={{ width: `${(completedSteps.length / STEPS.length) * 100}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* ── MAIN CONTENT ── */}
        <div className="lg:col-span-3 space-y-6">


          {/* ── STEP 0: Connect Ad Accounts ── */}
          {activeStep === 0 && (
            <div className="bg-surface-elevated border border-border rounded-2xl p-6">
              <AdAccountsConnection
                onComplete={() => completeStep(0)}
              />
            </div>
          )}

          {/* ── STEP 1: Profile ── */}
          {activeStep === 1 && (
            <div className="bg-surface-elevated border border-border rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-2xl">👤</span>
                <h2 className="text-lg font-bold text-text-primary">Profilni to'ldirish</h2>
              </div>
              <p className="text-text-tertiary text-sm mb-6">
                Tadbirkorlar siz haqingizda bilib olsinlari uchun.
              </p>

              <div className="space-y-5">
                <div>
                  <label className="text-text-tertiary text-xs font-semibold uppercase tracking-wider block mb-2">To'liq ism *</label>
                  <input
                    value={profile.displayName}
                    onChange={e => setProfile(p => ({ ...p, displayName: e.target.value }))}
                    placeholder="Ism Familiya"
                    className="w-full bg-surface-2 border border-border rounded-lg px-4 py-3 text-text-primary text-sm placeholder:text-text-secondary focus:outline-none focus:border-[#111827]/50"
                  />
                </div>

                <div>
                  <label className="text-text-tertiary text-xs font-semibold uppercase tracking-wider block mb-2">Sarlavha *</label>
                  <input
                    value={profile.title}
                    onChange={e => setProfile(p => ({ ...p, title: e.target.value }))}
                    placeholder="Masalan: Senior Meta & Google Ads Specialist"
                    className="w-full bg-surface-2 border border-border rounded-lg px-4 py-3 text-text-primary text-sm placeholder:text-text-secondary focus:outline-none focus:border-[#111827]/50"
                  />
                </div>

                <div>
                  <label className="text-text-tertiary text-xs font-semibold uppercase tracking-wider block mb-2">Bio *</label>
                  <textarea
                    value={profile.bio}
                    onChange={e => setProfile(p => ({ ...p, bio: e.target.value }))}
                    placeholder="Tajribangiz, ixtisosligingiz va natijalari haqida..."
                    rows={4}
                    className="w-full bg-surface-2 border border-border rounded-lg px-4 py-3 text-text-primary text-sm placeholder:text-text-secondary focus:outline-none focus:border-[#111827]/50 resize-none"
                  />
                </div>

                <div>
                  <label className="text-text-tertiary text-xs font-semibold uppercase tracking-wider block mb-2">Shahar</label>
                  <input
                    value={profile.location}
                    onChange={e => setProfile(p => ({ ...p, location: e.target.value }))}
                    placeholder="Toshkent, O'zbekiston"
                    className="w-full bg-surface-2 border border-border rounded-lg px-4 py-3 text-text-primary text-sm placeholder:text-text-secondary focus:outline-none focus:border-[#111827]/50"
                  />
                </div>

                {/* Pricing */}
                <div>
                  <label className="text-text-tertiary text-xs font-semibold uppercase tracking-wider block mb-2">Narx modeli</label>
                  <div className="grid grid-cols-3 gap-2 mb-3">
                    {[
                      { id: 'fixed', label: 'Oylik to\'lov' },
                      { id: 'commission', label: 'Komissiya' },
                      { id: 'hybrid', label: 'Aralash' },
                    ].map(opt => (
                      <button
                        key={opt.id}
                        onClick={() => setProfile(p => ({ ...p, pricingModel: opt.id as any }))}
                        className={`py-2 rounded-lg text-xs font-medium border transition-all ${
                          profile.pricingModel === opt.id
                            ? 'bg-text-primary text-white border-[#111827]'
                            : 'bg-surface-2 text-text-secondary border-border hover:border-border'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>

                  {(profile.pricingModel === 'fixed' || profile.pricingModel === 'hybrid') && (
                    <div className="flex gap-2 items-center mb-2">
                      <span className="text-text-secondary text-sm">$</span>
                      <input
                        type="number"
                        value={profile.monthlyRate}
                        onChange={e => setProfile(p => ({ ...p, monthlyRate: e.target.value }))}
                        placeholder="500"
                        className="w-32 bg-surface-2 border border-border rounded-lg px-3 py-2 text-text-primary text-sm placeholder:text-text-secondary focus:outline-none focus:border-[#111827]/50"
                      />
                      <span className="text-text-secondary text-sm">/oy</span>
                    </div>
                  )}
                  {(profile.pricingModel === 'commission' || profile.pricingModel === 'hybrid') && (
                    <div className="flex gap-2 items-center">
                      <input
                        type="number"
                        value={profile.commissionRate}
                        onChange={e => setProfile(p => ({ ...p, commissionRate: e.target.value }))}
                        placeholder="15"
                        className="w-24 bg-surface-2 border border-border rounded-lg px-3 py-2 text-text-primary text-sm placeholder:text-text-secondary focus:outline-none focus:border-[#111827]/50"
                      />
                      <span className="text-text-secondary text-sm">% komissiya</span>
                    </div>
                  )}
                </div>

                {/* Platforms */}
                <div>
                  <label className="text-text-tertiary text-xs font-semibold uppercase tracking-wider block mb-2">Platformalar</label>
                  <div className="flex flex-wrap gap-2">
                    {PLATFORM_OPTIONS.map(p => (
                      <button
                        key={p}
                        onClick={() => togglePlatform(p)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                          profile.platforms.includes(p)
                            ? 'bg-text-primary text-white border-[#111827]'
                            : 'bg-surface-2 text-text-secondary border-border hover:border-border'
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Niches */}
                <div>
                  <label className="text-text-tertiary text-xs font-semibold uppercase tracking-wider block mb-2">Niche ixtisoslashuv</label>
                  <div className="flex gap-2 mb-3">
                    <input
                      value={nicheInput}
                      onChange={e => setNicheInput(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && addNiche()}
                      placeholder="E-commerce, Fashion... (Enter)"
                      className="flex-1 bg-surface-2 border border-border rounded-lg px-3 py-2 text-text-primary text-sm placeholder:text-text-secondary focus:outline-none focus:border-[#111827]/50"
                    />
                    <button
                      onClick={addNiche}
                      className="bg-surface-2 border border-border text-text-primary text-sm px-4 py-2 rounded-lg hover:bg-surface-2 transition-all"
                    >
                      +
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {NICHE_SUGGESTIONS.filter(n => !profile.niches.includes(n)).slice(0, 6).map(n => (
                      <button
                        key={n}
                        onClick={() => setProfile(p => ({ ...p, niches: [...p.niches, n] }))}
                        className="text-[10px] px-2 py-1 rounded bg-surface-2 text-text-secondary hover:bg-surface-2 transition-all"
                      >
                        + {n}
                      </button>
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {profile.niches.map(n => (
                      <span key={n} className="flex items-center gap-1.5 bg-surface-2 border border-border text-text-primary text-xs px-3 py-1.5 rounded-lg">
                        {n}
                        <button
                          onClick={() => setProfile(p => ({ ...p, niches: p.niches.filter(x => x !== n) }))}
                          className="text-text-secondary hover:text-text-primary"
                        >
                          ✕
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex justify-end mt-6">
                <button
                  onClick={() => completeStep(1)}
                  disabled={!profile.title || !profile.bio || !profile.displayName}
                  className="bg-text-primary hover:bg-surface-2 disabled:opacity-40 text-white px-6 py-3 rounded-xl font-semibold transition-all"
                >
                  Davom etish →
                </button>
              </div>
            </div>
          )}

          {/* ── STEP 2: Visibility ── */}
          {activeStep === 2 && (
            <div className="bg-surface-elevated border border-border rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-2xl">👁️</span>
                <h2 className="text-lg font-bold text-text-primary">Ko'rinuvchanlikni sozlash</h2>
              </div>
              <p className="text-text-tertiary text-sm mb-6">
                Qaysi ma'lumotlar ommaviy ko'rinishida bo'lishini tanlang.
              </p>

              <div className="space-y-3">
                {VISIBILITY_OPTIONS.map(opt => (
                  <label
                    key={opt.id}
                    className={`flex items-center justify-between p-4 rounded-xl border cursor-pointer transition-all ${
                      visibility.includes(opt.id)
                        ? 'bg-text-primary/5 border-border'
                        : 'bg-surface-2 border-border hover:border-border'
                    }`}
                  >
                    <span className="text-text-primary text-sm">{opt.label}</span>
                    <div
                      onClick={() => toggleVisibility(opt.id)}
                      className={`w-11 h-6 rounded-full transition-colors flex items-center px-0.5 cursor-pointer ${
                        visibility.includes(opt.id) ? 'bg-text-primary' : 'bg-surface-2'
                      }`}
                    >
                      <div className={`w-5 h-5 bg-surface-elevated rounded-full transition-transform shadow ${visibility.includes(opt.id) ? 'translate-x-5' : 'translate-x-0'}`} />
                    </div>
                  </label>
                ))}
              </div>

              <div className="flex justify-between mt-6">
                <button onClick={() => setActiveStep(1)} className="text-text-tertiary hover:text-text-primary text-sm transition-colors">
                  ← Orqaga
                </button>
                <button
                  onClick={() => completeStep(2)}
                  className="bg-text-primary hover:bg-surface-2 text-white px-6 py-3 rounded-xl font-semibold transition-all"
                >
                  Davom etish →
                </button>
              </div>
            </div>
          )}

          {/* ── STEP 3: Publish ── */}
          {activeStep === 3 && (
            <div className="bg-surface-elevated border border-border rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-2xl">🚀</span>
                <h2 className="text-lg font-bold text-text-primary">Portfolio nashr qilish</h2>
              </div>
              <p className="text-text-tertiary text-sm mb-6">
                Hamma narsa tayyor. Nashr qilingandan so'ng profilingiz katalogda ko'rinadi.
              </p>

              {/* Summary */}
              <div className="space-y-3 mb-6">
                <div className="flex items-center gap-3 p-3 bg-surface-2 border border-border rounded-xl">
                  <span className="text-xl">👤</span>
                  <div className="flex-1">
                    <div className="text-text-primary text-sm font-medium">{profile.displayName || 'Ism kiritilmagan'}</div>
                    <div className="text-text-tertiary text-xs">{profile.title || 'Sarlavha kiritilmagan'}</div>
                  </div>
                  {profile.title && profile.bio ? <span className="text-emerald-500 text-sm">✓</span> : <button onClick={() => setActiveStep(1)} className="text-text-primary text-xs">To'ldirish</button>}
                </div>

                <div className="flex items-center gap-3 p-3 bg-surface-2 border border-border rounded-xl">
                  <span className="text-xl">📢</span>
                  <div className="flex-1">
                    <div className="text-text-primary text-sm font-medium">Platformalar</div>
                    <div className="text-text-tertiary text-xs">{profile.platforms.length > 0 ? profile.platforms.join(', ') : 'Tanlanmagan'}</div>
                  </div>
                  <span className="text-emerald-500 text-sm">✓</span>
                </div>

                <div className="flex items-center gap-3 p-3 bg-surface-2 border border-border rounded-xl">
                  <span className="text-xl">💰</span>
                  <div className="flex-1">
                    <div className="text-text-primary text-sm font-medium">Narx</div>
                    <div className="text-text-tertiary text-xs">
                      {profile.pricingModel === 'commission'
                        ? `${profile.commissionRate || 0}% komissiya`
                        : profile.pricingModel === 'hybrid'
                          ? `$${profile.monthlyRate || 0}/oy + ${profile.commissionRate || 0}% komissiya`
                          : `$${profile.monthlyRate || 0}/oy`}
                    </div>
                  </div>
                  <span className="text-emerald-500 text-sm">✓</span>
                </div>

                <div className="flex items-center gap-3 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                  <span className="text-xl">⏳</span>
                  <div className="flex-1">
                    <div className="text-text-primary text-sm font-medium">Tasdiqlash</div>
                    <div className="text-amber-500 text-xs">Profil moderatsiyadan o'tgandan keyin ko'rinadi</div>
                  </div>
                </div>
              </div>

              <div className="flex justify-between">
                <button onClick={() => setActiveStep(2)} className="text-text-tertiary hover:text-text-primary text-sm transition-colors">
                  ← Orqaga
                </button>
                <button
                  onClick={handlePublish}
                  disabled={saving || !profile.title || !profile.bio}
                  className="bg-text-primary hover:bg-surface-2 disabled:opacity-40 text-white px-8 py-3 rounded-xl font-bold transition-all flex items-center gap-2"
                >
                  {saving ? <><Spinner size="sm" /> Saqlanmoqda...</> : '🚀 Nashr qilish'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
