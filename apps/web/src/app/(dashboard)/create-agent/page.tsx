'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { agents } from '@/lib/api-client'
import { Spinner } from '@/components/ui/Spinner'
import { Alert } from '@/components/ui/Alert'

const PLATFORM_OPTIONS = ['meta', 'google', 'yandex', 'tiktok', 'telegram', 'youtube']
const NICHE_OPTIONS = [
  'E-commerce', 'Fashion', 'Beauty & Cosmetics', 'Food & Beverage',
  'Real Estate', 'Education', 'B2B SaaS', 'Healthcare', 'Finance',
  'Mobile App', 'Travel', 'Electronics',
]

const AUTOPILOT_OPTIONS = [
  {
    id: 'FULL_AUTO',
    label: 'To\'liq avtomatik',
    desc: 'AI mustaqil qarorlar qabul qiladi va kampaniyalarni boshqaradi',
    badge: '🤖',
  },
  {
    id: 'ASSISTED',
    label: 'Yarim avtomatik',
    desc: 'AI tavsiyalar beradi, har bir o\'zgarish tasdiqlashni kutadi',
    badge: '🤝',
  },
]

export default function CreateAgentPage() {
  const router = useRouter()
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [createdAgent, setCreatedAgent] = useState<any>(null)

  const [form, setForm] = useState({
    displayName: '',
    title: '',
    bio: '',
    avatar: '🤖',
    avatarColor: 'from-violet-400 to-purple-600',
    monthlyRate: '',
    commissionRate: '',
    pricingModel: 'commission' as 'fixed' | 'commission' | 'hybrid',
    platforms: [] as string[],
    niches: [] as string[],
    // AI config
    autopilotMode: 'FULL_AUTO',
    minManagedBudget: '100',
    decisionFrequencyHours: '2',
    supportedPlatforms: [] as string[],
  })
  const [nicheInput, setNicheInput] = useState('')

  const AVATAR_OPTIONS = ['🤖', '⚡', '🎯', '📊', '🚀', '🧠', '💡', '🔥']
  const COLOR_OPTIONS = [
    { label: 'Violet', value: 'from-violet-400 to-purple-600' },
    { label: 'Blue', value: 'from-blue-400 to-blue-600' },
    { label: 'Green', value: 'from-emerald-400 to-green-600' },
    { label: 'Orange', value: 'from-orange-400 to-red-500' },
    { label: 'Pink', value: 'from-pink-400 to-rose-600' },
    { label: 'Teal', value: 'from-teal-400 to-cyan-600' },
  ]

  const toggleItem = (arr: string[], item: string) =>
    arr.includes(item) ? arr.filter(x => x !== item) : [...arr, item]

  const addNiche = () => {
    const v = nicheInput.trim()
    if (v && !form.niches.includes(v)) {
      setForm(f => ({ ...f, niches: [...f.niches, v] }))
      setNicheInput('')
    }
  }

  const handleCreate = async () => {
    setSaving(true)
    setError('')
    try {
      const dto = {
        agentType: 'ai' as const,
        displayName: form.displayName,
        title: form.title,
        bio: form.bio,
        avatar: form.avatar,
        avatarColor: form.avatarColor,
        monthlyRate: form.monthlyRate ? Number(form.monthlyRate) : 0,
        commissionRate: form.commissionRate ? Number(form.commissionRate) : 0,
        pricingModel: form.pricingModel,
        platforms: form.platforms,
        niches: form.niches,
        aiConfig: {
          defaultAutopilotMode: form.autopilotMode,
          supportedPlatforms: form.supportedPlatforms.length > 0 ? form.supportedPlatforms : form.platforms,
          minManagedBudget: Number(form.minManagedBudget) || 100,
          decisionFrequencyHours: Number(form.decisionFrequencyHours) || 2,
        },
      }
      const res = await agents.create(dto)
      setCreatedAgent(res.data)
      setStep(3)
    } catch (e: any) {
      setError(e?.message || 'Xatolik yuz berdi')
    } finally {
      setSaving(false)
    }
  }

  const handlePublish = async () => {
    if (!createdAgent) return
    setSaving(true)
    try {
      await agents.togglePublish(createdAgent.id)
      router.push('/portfolio')
    } catch (e: any) {
      setError(e?.message || 'Xatolik')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">

      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-slate-50">AI Agent yaratish</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
          O'zingizning AI targetolog agentingizni konfigurlang va marketplace'ga chiqaring
        </p>
      </div>

      {/* Progress */}
      <div className="flex items-center gap-2">
        {[1, 2, 3].map(s => (
          <div key={s} className="flex items-center gap-2">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
              step > s ? 'bg-emerald-500 text-white' : step === s ? 'bg-[#111827] text-white' : 'bg-[#E5E7EB] text-slate-400 dark:text-slate-500'
            }`}>
              {step > s ? '✓' : s}
            </div>
            <span className={`text-xs ${step === s ? 'text-slate-900 dark:text-slate-50 font-medium' : 'text-slate-400 dark:text-slate-500'}`}>
              {s === 1 ? 'Asosiy ma\'lumot' : s === 2 ? 'AI konfiguratsiya' : 'Nashr'}
            </span>
            {s < 3 && <div className="w-8 h-px bg-[#E5E7EB]" />}
          </div>
        ))}
      </div>

      {error && <Alert variant="error">{error}</Alert>}

      {/* ── STEP 1: Basic Info ── */}
      {step === 1 && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 space-y-5">

          {/* Avatar selector */}
          <div>
            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-3">Agent belgisi</label>
            <div className="flex gap-2 flex-wrap mb-3">
              {AVATAR_OPTIONS.map(emoji => (
                <button
                  key={emoji}
                  onClick={() => setForm(f => ({ ...f, avatar: emoji }))}
                  className={`w-10 h-10 rounded-xl text-xl flex items-center justify-center transition-all border-2 ${
                    form.avatar === emoji ? 'border-[#111827] bg-slate-100 dark:bg-slate-800' : 'border-transparent hover:border-slate-200 dark:border-slate-700'
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
            <div className="flex gap-2 flex-wrap">
              {COLOR_OPTIONS.map(c => (
                <button
                  key={c.value}
                  onClick={() => setForm(f => ({ ...f, avatarColor: c.value }))}
                  className={`w-7 h-7 rounded-full bg-gradient-to-br ${c.value} border-2 transition-all ${
                    form.avatarColor === c.value ? 'border-[#111827] scale-110' : 'border-transparent'
                  }`}
                  title={c.label}
                />
              ))}
            </div>

            {/* Preview */}
            <div className="mt-3 flex items-center gap-3">
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${form.avatarColor} flex items-center justify-center text-2xl`}>
                {form.avatar}
              </div>
              <div>
                <p className="text-sm font-medium text-slate-900 dark:text-slate-50">{form.displayName || 'Agent nomi'}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">{form.title || 'Sarlavha'}</p>
              </div>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-2">Agent nomi *</label>
            <input
              value={form.displayName}
              onChange={e => setForm(f => ({ ...f, displayName: e.target.value }))}
              placeholder="Masalan: Meta Pro AI, E-commerce Optimizer"
              className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-3 text-sm text-slate-900 dark:text-slate-50 placeholder:text-slate-400 dark:text-slate-500 focus:outline-none focus:border-[#111827]/50"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-2">Sarlavha *</label>
            <input
              value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              placeholder="Masalan: Meta & Instagram uchun AI performance agent"
              className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-3 text-sm text-slate-900 dark:text-slate-50 placeholder:text-slate-400 dark:text-slate-500 focus:outline-none focus:border-[#111827]/50"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-2">Tavsif</label>
            <textarea
              value={form.bio}
              onChange={e => setForm(f => ({ ...f, bio: e.target.value }))}
              placeholder="Bu agent nima qiladi, qanday natijalarga erishadi..."
              rows={3}
              className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-3 text-sm text-slate-900 dark:text-slate-50 placeholder:text-slate-400 dark:text-slate-500 focus:outline-none focus:border-[#111827]/50 resize-none"
            />
          </div>

          {/* Platforms */}
          <div>
            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-2">Platformalar *</label>
            <div className="flex flex-wrap gap-2">
              {PLATFORM_OPTIONS.map(p => (
                <button
                  key={p}
                  onClick={() => setForm(f => ({ ...f, platforms: toggleItem(f.platforms, p) }))}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                    form.platforms.includes(p)
                      ? 'bg-[#111827] text-white border-[#111827]'
                      : 'bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:border-slate-600'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* Niches */}
          <div>
            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-2">Niche ixtisoslashuv</label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {NICHE_OPTIONS.filter(n => !form.niches.includes(n)).slice(0, 8).map(n => (
                <button
                  key={n}
                  onClick={() => setForm(f => ({ ...f, niches: [...f.niches, n] }))}
                  className="text-[10px] px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
                >
                  + {n}
                </button>
              ))}
            </div>
            <div className="flex gap-2 mb-2">
              <input
                value={nicheInput}
                onChange={e => setNicheInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addNiche()}
                placeholder="Boshqa niche qo'shish (Enter)"
                className="flex-1 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-slate-50 placeholder:text-slate-400 dark:text-slate-500 focus:outline-none"
              />
            </div>
            {form.niches.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {form.niches.map(n => (
                  <span key={n} className="flex items-center gap-1 bg-[#111827] text-white text-xs px-2.5 py-1 rounded-lg">
                    {n}
                    <button onClick={() => setForm(f => ({ ...f, niches: f.niches.filter(x => x !== n) }))} className="opacity-60 hover:opacity-100">✕</button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Pricing */}
          <div>
            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-2">Narx modeli</label>
            <div className="grid grid-cols-3 gap-2 mb-3">
              {[
                { id: 'commission', label: 'Komissiya' },
                { id: 'fixed', label: 'Oylik' },
                { id: 'hybrid', label: 'Aralash' },
              ].map(opt => (
                <button
                  key={opt.id}
                  onClick={() => setForm(f => ({ ...f, pricingModel: opt.id as any }))}
                  className={`py-2 rounded-lg text-xs font-medium border transition-all ${
                    form.pricingModel === opt.id
                      ? 'bg-[#111827] text-white border-[#111827]'
                      : 'bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            <div className="flex gap-3">
              {(form.pricingModel === 'fixed' || form.pricingModel === 'hybrid') && (
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-slate-500 dark:text-slate-400">$</span>
                  <input
                    type="number"
                    value={form.monthlyRate}
                    onChange={e => setForm(f => ({ ...f, monthlyRate: e.target.value }))}
                    placeholder="49"
                    className="w-24 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-slate-50 focus:outline-none"
                  />
                  <span className="text-xs text-slate-500 dark:text-slate-400">/oy</span>
                </div>
              )}
              {(form.pricingModel === 'commission' || form.pricingModel === 'hybrid') && (
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    value={form.commissionRate}
                    onChange={e => setForm(f => ({ ...f, commissionRate: e.target.value }))}
                    placeholder="8"
                    className="w-20 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-slate-50 focus:outline-none"
                  />
                  <span className="text-xs text-slate-500 dark:text-slate-400">% komissiya</span>
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end">
            <button
              onClick={() => setStep(2)}
              disabled={!form.displayName || !form.title || form.platforms.length === 0}
              className="bg-[#111827] hover:bg-[#1F2937] disabled:opacity-40 text-white px-6 py-3 rounded-xl font-semibold transition-all"
            >
              Davom etish →
            </button>
          </div>
        </div>
      )}

      {/* ── STEP 2: AI Config ── */}
      {step === 2 && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 space-y-5">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-50 mb-1">AI Konfiguratsiya</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">Agent qanday ishlashini sozlang</p>
          </div>

          {/* Autopilot mode */}
          <div>
            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-3">Ish rejimi</label>
            <div className="space-y-2">
              {AUTOPILOT_OPTIONS.map(opt => (
                <button
                  key={opt.id}
                  onClick={() => setForm(f => ({ ...f, autopilotMode: opt.id }))}
                  className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                    form.autopilotMode === opt.id
                      ? 'border-[#111827] bg-slate-50 dark:bg-slate-800/50'
                      : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span>{opt.badge}</span>
                    <span className="font-semibold text-sm text-slate-900 dark:text-slate-50">{opt.label}</span>
                    {form.autopilotMode === opt.id && <span className="text-xs text-emerald-600 ml-auto">✓ Tanlangan</span>}
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{opt.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Min budget */}
          <div>
            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-2">Minimal byudjet ($/oy)</label>
            <div className="flex items-center gap-2">
              <span className="text-slate-500 dark:text-slate-400 text-sm">$</span>
              <input
                type="number"
                value={form.minManagedBudget}
                onChange={e => setForm(f => ({ ...f, minManagedBudget: e.target.value }))}
                className="w-32 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-slate-50 focus:outline-none"
              />
              <span className="text-xs text-slate-500 dark:text-slate-400">Bu summadan past byudjetlarda agent ishlamaydi</span>
            </div>
          </div>

          {/* Decision frequency */}
          <div>
            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-2">Qaror qabul qilish chastotasi</label>
            <div className="grid grid-cols-4 gap-2">
              {[1, 2, 4, 6].map(h => (
                <button
                  key={h}
                  onClick={() => setForm(f => ({ ...f, decisionFrequencyHours: String(h) }))}
                  className={`py-2 rounded-lg text-xs font-medium border transition-all ${
                    form.decisionFrequencyHours === String(h)
                      ? 'bg-[#111827] text-white border-[#111827]'
                      : 'bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  {h}h
                </button>
              ))}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5">
              Agent har {form.decisionFrequencyHours} soatda kampaniya ma'lumotlarini tahlil qiladi
            </p>
          </div>

          {/* Supported platforms (subset of form.platforms) */}
          <div>
            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-2">Qo'llab-quvvatlanadigan platformalar</label>
            <p className="text-xs text-slate-400 dark:text-slate-500 mb-2">Standart bo'yicha — barcha tanlangan platformalar</p>
            <div className="flex flex-wrap gap-2">
              {form.platforms.map(p => (
                <button
                  key={p}
                  onClick={() => setForm(f => ({
                    ...f,
                    supportedPlatforms: toggleItem(f.supportedPlatforms, p),
                  }))}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                    form.supportedPlatforms.includes(p) || form.supportedPlatforms.length === 0
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* Summary card */}
          <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl p-4">
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2">Agent xulosasi:</p>
            <div className="flex items-center gap-3 mb-2">
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${form.avatarColor} flex items-center justify-center text-xl`}>
                {form.avatar}
              </div>
              <div>
                <p className="font-semibold text-sm text-slate-900 dark:text-slate-50">{form.displayName}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">{form.title}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs text-slate-500 dark:text-slate-400">
              <span>Mode: <b className="text-slate-900 dark:text-slate-50">{form.autopilotMode === 'FULL_AUTO' ? 'To\'liq avtomatik' : 'Yarim avtomatik'}</b></span>
              <span>Minimal: <b className="text-slate-900 dark:text-slate-50">${form.minManagedBudget}/oy</b></span>
              <span>Qarorlar: <b className="text-slate-900 dark:text-slate-50">har {form.decisionFrequencyHours}h</b></span>
              <span>Narx: <b className="text-slate-900 dark:text-slate-50">
                {form.pricingModel === 'commission' ? `${form.commissionRate}% komissiya` : `$${form.monthlyRate}/oy`}
              </b></span>
            </div>
          </div>

          <div className="flex justify-between">
            <button onClick={() => setStep(1)} className="text-slate-400 dark:text-slate-500 hover:text-slate-900 dark:text-slate-50 text-sm transition-colors">
              ← Orqaga
            </button>
            <button
              onClick={handleCreate}
              disabled={saving}
              className="bg-[#111827] hover:bg-[#1F2937] disabled:opacity-40 text-white px-6 py-3 rounded-xl font-semibold transition-all flex items-center gap-2"
            >
              {saving ? <><Spinner size="sm" /> Yaratilmoqda...</> : 'Agent yaratish →'}
            </button>
          </div>
        </div>
      )}

      {/* ── STEP 3: Success ── */}
      {step === 3 && createdAgent && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-8 text-center">
          <div className="text-5xl mb-4">🎉</div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-50 mb-2">Agent yaratildi!</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">
            Agentingiz tayyor. Nashr qilish uchun moderatsiyadan o'tishi kerak.
          </p>

          <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl p-4 mb-6 flex items-center gap-3">
            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${form.avatarColor} flex items-center justify-center text-2xl`}>
              {form.avatar}
            </div>
            <div className="text-left flex-1">
              <p className="font-semibold text-sm text-slate-900 dark:text-slate-50">{createdAgent.displayName}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">{createdAgent.title}</p>
              <p className="text-xs text-amber-600 mt-0.5">⏳ Moderatsiya kutilmoqda</p>
            </div>
          </div>

          <div className="flex gap-3 justify-center">
            <button
              onClick={handlePublish}
              disabled={saving}
              className="bg-[#111827] hover:bg-[#1F2937] disabled:opacity-40 text-white px-6 py-3 rounded-xl font-semibold transition-all flex items-center gap-2"
            >
              {saving ? <><Spinner size="sm" /> ...</> : '🚀 Marketplace\'ga chiqarish'}
            </button>
            <button
              onClick={() => router.push('/my-portfolio')}
              className="bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-50 px-6 py-3 rounded-xl border border-slate-200 dark:border-slate-700 transition-all"
            >
              Keyinroq
            </button>
          </div>
        </div>
      )}

      {/* Info box */}
      {step < 3 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
          <p className="text-xs text-amber-700 font-medium mb-1">💡 Monetizatsiya</p>
          <p className="text-xs text-amber-600 leading-relaxed">
            Sizning AI agentingiz tadbirkorlarga ijaraga beriladi. Har bir to'lovdan siz <b>80%</b> olasiz,
            Performa platformasi <b>20%</b> komissiya oladi. Agent qanchalik ko'p foydalanilsa, daromad shunchalik ko'p.
          </p>
        </div>
      )}
    </div>
  )
}
