'use client'
import { useState, useMemo, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { MOCK_TARGETOLOGISTS, formatSpend, type PortfolioTargetologist } from '@/lib/portfolio-data'

const PLATFORM_META: Record<string, { name: string; icon: string; color: string }> = {
  meta:     { name: 'Meta',     icon: '📘', color: 'from-blue-100 to-blue-200' },
  google:   { name: 'Google',   icon: '🔍', color: 'from-red-100 to-red-200' },
  yandex:   { name: 'Yandex',   icon: '🟡', color: 'from-yellow-100 to-yellow-200' },
  telegram: { name: 'Telegram', icon: '✈️', color: 'from-blue-100 to-cyan-200' },
  tiktok:   { name: 'TikTok',   icon: '🎵', color: 'from-pink-100 to-rose-200' },
}

function apiAgentToPortfolio(a: any): PortfolioTargetologist {
  const stats = a.cachedStats || {}
  return {
    id: a.id,
    slug: a.slug,
    name: a.displayName,
    avatar: a.avatar || (a.agentType === 'ai' ? '🤖' : '👤'),
    avatarColor: a.avatarColor || 'from-gray-200 to-gray-300',
    title: a.title,
    location: a.location || 'O\'zbekiston',
    bio: a.bio || '',
    verified: a.isVerified,
    proMember: a.isProMember,
    joinedAt: a.createdAt,
    responseTime: a.responseTime || (a.agentType === 'ai' ? 'Darhol' : '2 soat'),
    rating: a.cachedRating || 0,
    reviewCount: a.cachedReviewCount || 0,
    price: {
      from: Number(a.monthlyRate) || 0,
      currency: 'USD',
      unit: a.pricingModel === 'commission' ? `${a.commissionRate}% komissiya` : 'oy',
    },
    platforms: (a.platforms || []).map((p: string) => ({
      id: p,
      name: PLATFORM_META[p]?.name || p,
      icon: PLATFORM_META[p]?.icon || '📢',
      color: PLATFORM_META[p]?.color || 'from-gray-100 to-gray-200',
      verified: a.isVerified,
    })),
    stats: {
      totalSpendManaged: stats.totalSpendManaged || 0,
      avgROAS: stats.avgROAS || 0,
      avgCPA: stats.avgCPA || 0,
      avgCTR: stats.avgCTR || 0,
      totalCampaigns: stats.totalCampaigns || 0,
      activeCampaigns: stats.activeCampaigns || 0,
      successRate: stats.successRate || 0,
      bestROAS: stats.bestROAS || 0,
    },
    niches: a.niches || [],
    monthlyPerformance: a.monthlyPerformance || [
      { month: 'Yan', roas: 0 }, { month: 'Feb', roas: 0 },
      { month: 'Mar', roas: 0 }, { month: 'Apr', roas: 0 },
      { month: 'May', roas: 0 }, { month: 'Jun', roas: 0 },
    ],
    platformSplit: (a.platforms || []).map((p: string, i: number) => ({
      platform: PLATFORM_META[p]?.name || p,
      percent: Math.floor(100 / (a.platforms?.length || 1)),
      color: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'][i] || '#6B7280',
    })),
    recentCampaigns: [],
    reviews: [],
    agentType: a.agentType,
  } as any
}

const ALL_NICHES = ['E-commerce', 'Fashion', 'Beauty & Cosmetics', 'Real Estate', 'B2B SaaS', 'Mobile App', 'Food & Beverage', 'Finance', 'Education', 'Healthcare']
const ALL_PLATFORMS = [
  { id: 'meta', name: 'Meta', icon: '📘' },
  { id: 'google', name: 'Google', icon: '🔍' },
  { id: 'yandex', name: 'Yandex', icon: '🟡' },
  { id: 'telegram', name: 'Telegram', icon: '✈️' },
]
const SORT_OPTIONS = [
  { value: 'roas', label: 'ROAS (yuqoridan)' },
  { value: 'spend', label: 'Boshqarilgan byudjet' },
  { value: 'campaigns', label: 'Kampaniyalar soni' },
  { value: 'rating', label: 'Reyting' },
]

function VerifiedBadge() {
  return (
    <span className="inline-flex items-center gap-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold px-2 py-0.5 rounded-full">
      ✓ TASDIQLANGAN
    </span>
  )
}

function ProBadge() {
  return (
    <span className="inline-flex items-center gap-1 bg-[#111827]/15 border border-[#D1D5DB] text-[#374151] text-[10px] font-bold px-2 py-0.5 rounded-full">
      ⭐ PRO
    </span>
  )
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-1">
      <span className="text-yellow-400 text-sm">★</span>
      <span className="text-[#111827] font-semibold text-sm">{rating.toFixed(1)}</span>
    </div>
  )
}

function RoasTrend({ data }: { data: { month: string; roas: number }[] }) {
  const max = Math.max(...data.map(d => d.roas))
  const min = Math.min(...data.map(d => d.roas))
  const h = 32
  const w = 80
  const pts = data.map((d, i) => {
    const x = (i / (data.length - 1)) * w
    const y = h - ((d.roas - min) / (max - min + 0.001)) * h
    return `${x},${y}`
  }).join(' ')
  const last = data[data.length - 1]
  const prev = data[data.length - 2]
  const up = last.roas >= prev.roas
  return (
    <div className="flex items-center gap-2">
      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
        <polyline points={pts} fill="none" stroke={up ? '#34D399' : '#F87171'} strokeWidth="1.5" strokeLinejoin="round" />
      </svg>
      <span className={`text-xs font-semibold ${up ? 'text-emerald-400' : 'text-red-400'}`}>
        {up ? '↑' : '↓'} {last.roas.toFixed(1)}x
      </span>
    </div>
  )
}

function TargetologistCard({ t }: { t: PortfolioTargetologist }) {
  return (
    <Link href={`/portfolio/${t.slug}`} className="block group">
      <div className="bg-white border border-[#E5E7EB] group-hover:border-[#D1D5DB] rounded-2xl p-6 transition-all duration-300 group-hover:shadow-[0_0_30px_rgba(124,58,237,0.1)]">

        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${t.avatarColor} flex items-center justify-center text-sm font-black text-[#111827] shadow-lg`}>
              {t.avatar}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[#111827] font-bold">{t.name}</span>
                {t.verified && <VerifiedBadge />}
                {t.proMember && <ProBadge />}
                {(t as any).agentType === 'ai' && (
                  <span className="inline-flex items-center gap-1 bg-violet-50 border border-violet-200 text-violet-600 text-[10px] font-bold px-2 py-0.5 rounded-full">
                    🤖 AI
                  </span>
                )}
              </div>
              <div className="text-[#6B7280] text-xs mt-0.5">{t.title}</div>
            </div>
          </div>
          <StarRating rating={t.rating} />
        </div>

        {/* Location + response */}
        <div className="flex items-center gap-3 mb-4 text-xs text-[#6B7280]">
          <span>📍 {t.location}</span>
          <span>⚡ {t.responseTime}</span>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-4 gap-2 mb-4">
          {[
            { label: 'ROAS', value: `${t.stats.avgROAS}x`, highlight: true },
            { label: 'CPA', value: `$${t.stats.avgCPA}` },
            { label: 'Kampaniya', value: t.stats.totalCampaigns },
            { label: 'Muvaffaqiyat', value: `${t.stats.successRate}%` },
          ].map(m => (
            <div key={m.label} className="bg-[#F9FAFB] rounded-lg p-2 text-center">
              <div className={`text-sm font-bold ${m.highlight ? 'text-[#374151]' : 'text-[#111827]'}`}>{m.value}</div>
              <div className="text-[#6B7280] text-[10px] mt-0.5">{m.label}</div>
            </div>
          ))}
        </div>

        {/* Total spend + trend */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-[#6B7280] text-xs">Jami boshqarilgan byudjet</div>
            <div className="text-[#111827] font-bold text-lg">{formatSpend(t.stats.totalSpendManaged)}</div>
          </div>
          <RoasTrend data={t.monthlyPerformance} />
        </div>

        {/* Platforms */}
        <div className="flex items-center gap-2 mb-4 flex-wrap">
          {t.platforms.map(p => (
            <span
              key={p.id}
              className={`flex items-center gap-1 text-xs px-2.5 py-1 rounded-full border ${
                p.verified
                  ? 'bg-[#F9FAFB] border-[#E5E7EB] text-[#111827]'
                  : 'bg-[#F9FAFB] border-[#E5E7EB] text-[#6B7280]'
              }`}
            >
              {p.icon} {p.name}
              {p.verified && <span className="text-emerald-400 text-[9px] font-bold">✓</span>}
            </span>
          ))}
        </div>

        {/* Niches */}
        <div className="flex flex-wrap gap-1.5 mb-5">
          {t.niches.slice(0, 3).map(n => (
            <span key={n} className="text-[10px] bg-[#F9FAFB] text-[#9CA3AF] px-2 py-0.5 rounded-md border border-[#E5E7EB]">
              {n}
            </span>
          ))}
          {t.niches.length > 3 && (
            <span className="text-[10px] text-[#6B7280] px-2 py-0.5">+{t.niches.length - 3}</span>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-[#E5E7EB]">
          <div>
            <span className="text-[#6B7280] text-xs">Narxi: </span>
            <span className="text-[#111827] font-semibold text-sm">${t.price.from}</span>
            <span className="text-[#6B7280] text-xs">/{t.price.unit}</span>
          </div>
          <span className="text-[#374151] text-sm font-semibold group-hover:text-[#374151] transition-colors">
            Profil ko'rish →
          </span>
        </div>
      </div>
    </Link>
  )
}

export default function PortfolioPage() {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([])
  const [selectedNiches, setSelectedNiches] = useState<string[]>([])
  const [sortBy, setSortBy] = useState('roas')
  const [verifiedOnly, setVerifiedOnly] = useState(false)
  const [minROAS, setMinROAS] = useState(0)
  const [agentTypeFilter, setAgentTypeFilter] = useState<'all' | 'ai' | 'human'>('all')
  const [allAgents, setAllAgents] = useState<PortfolioTargetologist[]>(MOCK_TARGETOLOGISTS)

  useEffect(() => {
    const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
    fetch(`${apiBase}/agents?limit=50`)
      .then(r => r.json())
      .then(data => {
        if (data?.agents?.length) {
          setAllAgents(data.agents.map(apiAgentToPortfolio))
        }
      })
      .catch(() => { /* keep mock data */ })
  }, [])

  const togglePlatform = (id: string) =>
    setSelectedPlatforms(prev => prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id])

  const toggleNiche = (n: string) =>
    setSelectedNiches(prev => prev.includes(n) ? prev.filter(x => x !== n) : [...prev, n])

  const filtered = useMemo(() => {
    let list = [...allAgents]
    if (agentTypeFilter !== 'all') {
      list = list.filter(t => (t as any).agentType === agentTypeFilter)
    }

    if (search) {
      const q = search.toLowerCase()
      list = list.filter(t =>
        t.name.toLowerCase().includes(q) ||
        t.title.toLowerCase().includes(q) ||
        t.niches.some(n => n.toLowerCase().includes(q))
      )
    }
    if (verifiedOnly) list = list.filter(t => t.verified)
    if (selectedPlatforms.length)
      list = list.filter(t => selectedPlatforms.some(p => t.platforms.some(pl => pl.id === p)))
    if (selectedNiches.length)
      list = list.filter(t => selectedNiches.some(n => t.niches.includes(n)))
    if (minROAS > 0) list = list.filter(t => t.stats.avgROAS >= minROAS)

    list.sort((a, b) => {
      if (sortBy === 'roas') return b.stats.avgROAS - a.stats.avgROAS
      if (sortBy === 'spend') return b.stats.totalSpendManaged - a.stats.totalSpendManaged
      if (sortBy === 'campaigns') return b.stats.totalCampaigns - a.stats.totalCampaigns
      if (sortBy === 'rating') return b.rating - a.rating
      return 0
    })
    return list
  }, [search, verifiedOnly, selectedPlatforms, selectedNiches, sortBy, minROAS])

  // aggregate totals
  const totals = useMemo(() => ({
    targetologists: allAgents.length,
    spendManaged: allAgents.reduce((s, t) => s + (t.stats?.totalSpendManaged || 0), 0),
    avgROAS: allAgents.length ? (allAgents.reduce((s, t) => s + (t.stats?.avgROAS || 0), 0) / allAgents.length).toFixed(1) : '0',
    campaigns: allAgents.reduce((s, t) => s + (t.stats?.totalCampaigns || 0), 0),
  }), [allAgents])

  return (
    <div className="min-h-screen bg-[#F9FAFB] text-[#111827]">

      {/* ── NAV ── */}
      <nav className="sticky top-0 z-50 border-b border-[#E5E7EB] bg-[#F9FAFB]/90 backdrop-blur-lg">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <button onClick={() => router.push('/')} className="text-xl font-extrabold">
            Nishon <span className="text-[#374151]">AI</span>
          </button>
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/portfolio/setup')}
              className="text-sm text-[#9CA3AF] hover:text-[#111827] transition-colors px-4 py-2 border border-[#E5E7EB] rounded-lg"
            >
              Targetolog bo'lish →
            </button>
            <button
              onClick={() => router.push('/login')}
              className="text-sm bg-[#111827] hover:bg-[#1F2937] text-white px-5 py-2.5 rounded-lg font-semibold transition-all"
            >
              Kirish
            </button>
          </div>
        </div>
      </nav>

      {/* ── HERO ── */}
      <div className="relative py-16 px-6 text-center border-b border-[#E5E7EB] overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-[#7C3AED]/5 to-transparent pointer-events-none" />
        <div className="relative max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-[#F3F4F6] border border-[#D1D5DB] rounded-full px-4 py-1.5 mb-5">
            <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
            <span className="text-[#374151] text-xs font-bold uppercase tracking-widest">Live Portfolio Tracking</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-[#111827] mb-4">
            Tasdiqlangan targetologlar
          </h1>
          <p className="text-[#9CA3AF] text-lg max-w-xl mx-auto mb-8">
            Haqiqiy kampaniya natijalari bilan. Real-time statistika. myfxbook uslubida — lekin reklama uchun.
          </p>

          {/* aggregate stats */}
          <div className="inline-grid grid-cols-4 gap-px bg-[#F3F4F6] rounded-2xl overflow-hidden border border-[#E5E7EB]">
            {[
              { v: totals.targetologists, l: 'Targetolog' },
              { v: formatSpend(totals.spendManaged), l: 'Boshqarilgan' },
              { v: `${totals.avgROAS}x`, l: "O'rtacha ROAS" },
              { v: totals.campaigns, l: 'Kampaniyalar' },
            ].map(s => (
              <div key={s.l} className="bg-white px-6 py-4 text-center">
                <div className="text-2xl font-extrabold text-[#111827]">{s.v}</div>
                <div className="text-[#6B7280] text-xs mt-0.5">{s.l}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-10">
        <div className="flex gap-8">

          {/* ── SIDEBAR FILTERS ── */}
          <aside className="hidden lg:block w-64 flex-shrink-0 space-y-6">

            {/* Search */}
            <div>
              <label className="text-[#9CA3AF] text-xs font-semibold uppercase tracking-wider block mb-2">Qidirish</label>
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Ism yoki niche..."
                className="w-full bg-white border border-[#E5E7EB] rounded-lg px-3 py-2.5 text-sm text-[#111827] placeholder:text-[#6B7280] focus:outline-none focus:border-[#111827]/50"
              />
            </div>

            {/* Verified only */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setVerifiedOnly(!verifiedOnly)}
                className={`w-10 h-5 rounded-full transition-colors ${verifiedOnly ? 'bg-[#111827]' : 'bg-[#F3F4F6]'}`}
              >
                <div className={`w-4 h-4 rounded-full bg-white mx-0.5 transition-transform ${verifiedOnly ? 'translate-x-5' : 'translate-x-0'}`} />
              </button>
              <span className="text-sm text-[#111827]">Faqat tasdiqlangan</span>
            </div>

            {/* Platforms */}
            <div>
              <label className="text-[#9CA3AF] text-xs font-semibold uppercase tracking-wider block mb-3">Platformalar</label>
              <div className="space-y-2">
                {ALL_PLATFORMS.map(p => (
                  <button
                    key={p.id}
                    onClick={() => togglePlatform(p.id)}
                    className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all ${
                      selectedPlatforms.includes(p.id)
                        ? 'bg-[#111827]/15 border border-[#111827]/40 text-[#111827]'
                        : 'bg-white border border-[#E5E7EB] text-[#9CA3AF] hover:border-[#E5E7EB]'
                    }`}
                  >
                    <span>{p.icon}</span>
                    <span>{p.name}</span>
                    {selectedPlatforms.includes(p.id) && <span className="ml-auto text-[#374151] font-bold">✓</span>}
                  </button>
                ))}
              </div>
            </div>

            {/* Min ROAS */}
            <div>
              <label className="text-[#9CA3AF] text-xs font-semibold uppercase tracking-wider block mb-2">
                Min ROAS: <span className="text-[#111827]">{minROAS > 0 ? `${minROAS}x` : 'Hammasi'}</span>
              </label>
              <input
                type="range" min={0} max={6} step={0.5}
                value={minROAS}
                onChange={e => setMinROAS(Number(e.target.value))}
                className="w-full accent-[#7C3AED]"
              />
              <div className="flex justify-between text-[10px] text-[#6B7280] mt-1">
                <span>0x</span><span>3x</span><span>6x+</span>
              </div>
            </div>

            {/* Niches */}
            <div>
              <label className="text-[#9CA3AF] text-xs font-semibold uppercase tracking-wider block mb-3">Niche</label>
              <div className="flex flex-wrap gap-1.5">
                {ALL_NICHES.map(n => (
                  <button
                    key={n}
                    onClick={() => toggleNiche(n)}
                    className={`text-xs px-2.5 py-1 rounded-full border transition-all ${
                      selectedNiches.includes(n)
                        ? 'bg-[#E5E7EB] border-[#111827]/50 text-[#111827]'
                        : 'bg-white border-[#E5E7EB] text-[#9CA3AF] hover:border-[#E5E7EB]'
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>

            {/* Reset */}
            {(selectedPlatforms.length > 0 || selectedNiches.length > 0 || verifiedOnly || minROAS > 0 || search) && (
              <button
                onClick={() => { setSelectedPlatforms([]); setSelectedNiches([]); setVerifiedOnly(false); setMinROAS(0); setSearch('') }}
                className="w-full text-sm text-[#EF4444] hover:text-red-300 border border-[#EF4444]/20 hover:border-[#EF4444]/40 py-2 rounded-lg transition-all"
              >
                Filtrlarni tozalash
              </button>
            )}
          </aside>

          {/* ── MAIN LIST ── */}
          <div className="flex-1 min-w-0">

            {/* Agent type tabs */}
            <div className="flex gap-2 mb-5">
              {[
                { key: 'all', label: 'Hammasi' },
                { key: 'ai', label: '🤖 AI Agentlar' },
                { key: 'human', label: '👤 Jonli Targetologlar' },
              ].map(t => (
                <button
                  key={t.key}
                  onClick={() => setAgentTypeFilter(t.key as any)}
                  className={`px-4 py-2 text-sm font-medium rounded-xl transition-all ${
                    agentTypeFilter === t.key
                      ? 'bg-[#111827] text-white'
                      : 'bg-white border border-[#E5E7EB] text-[#6B7280] hover:text-[#111827]'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* Sort + count */}
            <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
              <p className="text-[#9CA3AF] text-sm">
                <span className="text-[#111827] font-semibold">{filtered.length}</span>{' '}
                {agentTypeFilter === 'ai' ? 'AI agent' : agentTypeFilter === 'human' ? 'targetolog' : 'natija'} topildi
              </p>
              <div className="flex items-center gap-2">
                <span className="text-xs text-[#6B7280]">Saralash:</span>
                <select
                  value={sortBy}
                  onChange={e => setSortBy(e.target.value)}
                  className="bg-white border border-[#E5E7EB] text-[#111827] text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-[#111827]/50"
                >
                  {SORT_OPTIONS.map(o => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {filtered.length === 0 ? (
              <div className="text-center py-24">
                <div className="text-5xl mb-4">🔍</div>
                <p className="text-[#9CA3AF]">Hech qanday targetolog topilmadi</p>
                <button
                  onClick={() => { setSelectedPlatforms([]); setSelectedNiches([]); setVerifiedOnly(false); setMinROAS(0); setSearch('') }}
                  className="mt-4 text-[#374151] hover:text-[#374151] text-sm"
                >
                  Filtrlarni tozalash
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
                {filtered.map(t => (
                  <TargetologistCard key={t.id} t={t} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── CTA for targetologists ── */}
      <div className="border-t border-[#E5E7EB] py-16 px-6 text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl font-extrabold text-[#111827] mb-4">Targetolmisiz?</h2>
          <p className="text-[#9CA3AF] mb-8">
            Nishon AI ga qo'shiling — natijalaringizni real-time da ko'rsating va ko'proq mijoz toping.
          </p>
          <button
            onClick={() => router.push('/register')}
            className="bg-[#111827] hover:bg-[#1F2937] text-white font-bold px-10 py-4 rounded-xl shadow-[0_0_30px_rgba(124,58,237,0.3)] hover:shadow-[0_0_50px_rgba(124,58,237,0.5)] transition-all"
          >
            Portfolio yaratish — bepul →
          </button>
        </div>
      </div>
    </div>
  )
}
