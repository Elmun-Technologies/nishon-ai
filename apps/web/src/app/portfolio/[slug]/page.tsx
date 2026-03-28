'use client'
import { useState, use } from 'react'
import { useRouter } from 'next/navigation'
import { MOCK_TARGETOLOGISTS, formatSpend, type PortfolioTargetologist } from '@/lib/portfolio-data'

/* ── helpers ── */
function StatCard({ label, value, sub, accent }: { label: string; value: string | number; sub?: string; accent?: boolean }) {
  return (
    <div className="bg-white border border-[#E5E7EB] rounded-xl p-4">
      <div className="text-[#6B7280] text-xs mb-1">{label}</div>
      <div className={`text-2xl font-extrabold ${accent ? 'text-[#374151]' : 'text-[#111827]'}`}>{value}</div>
      {sub && <div className="text-[#6B7280] text-xs mt-0.5">{sub}</div>}
    </div>
  )
}

function VerifiedBadge() {
  return (
    <span className="inline-flex items-center gap-1 bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-xs font-bold px-2.5 py-1 rounded-full">
      ✓ Tasdiqlangan
    </span>
  )
}

/* ── ROAS bar chart ── */
function RoasChart({ data }: { data: { month: string; roas: number; spend: number }[] }) {
  const maxRoas = Math.max(...data.map(d => d.roas))
  return (
    <div className="space-y-3">
      {data.map(d => (
        <div key={d.month} className="flex items-center gap-3">
          <span className="text-[#9CA3AF] text-xs w-8 flex-shrink-0">{d.month}</span>
          <div className="flex-1 bg-[#F9FAFB] rounded-full h-6 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#7C3AED] to-[#A855F7] rounded-full flex items-center justify-end pr-2 transition-all duration-500"
              style={{ width: `${(d.roas / maxRoas) * 100}%` }}
            >
              <span className="text-[#111827] text-[10px] font-bold">{d.roas}x</span>
            </div>
          </div>
          <span className="text-[#6B7280] text-xs w-16 text-right flex-shrink-0">{formatSpend(d.spend)}</span>
        </div>
      ))}
    </div>
  )
}

/* ── platform donut (simple CSS) ── */
function PlatformSplit({ data }: { data: { platform: string; percent: number; color: string }[] }) {
  let offset = 0
  const r = 40
  const circ = 2 * Math.PI * r
  return (
    <div className="flex items-center gap-6">
      <svg width={100} height={100} viewBox="0 0 100 100">
        {data.map((d, i) => {
          const len = (d.percent / 100) * circ
          const seg = (
            <circle
              key={i}
              cx={50} cy={50} r={r}
              fill="none"
              stroke={d.color}
              strokeWidth={16}
              strokeDasharray={`${len} ${circ - len}`}
              strokeDashoffset={-offset}
              transform="rotate(-90 50 50)"
            />
          )
          offset += len
          return seg
        })}
        <circle cx={50} cy={50} r={28} fill="#0D0D14" />
      </svg>
      <div className="space-y-2">
        {data.map(d => (
          <div key={d.platform} className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: d.color }} />
            <span className="text-[#9CA3AF] text-xs">{d.platform}</span>
            <span className="text-[#111827] text-xs font-bold ml-auto pl-4">{d.percent}%</span>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ── campaign row ── */
function CampaignRow({ c }: { c: PortfolioTargetologist['recentCampaigns'][0] }) {
  const PLATFORM_ICONS: Record<string, string> = { meta: '📘', google: '🔍', yandex: '🟡', telegram: '✈️' }
  const statusColors: Record<string, string> = {
    active: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    completed: 'bg-[#F9FAFB] text-[#9CA3AF] border-[#E5E7EB]',
    paused: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  }
  const statusLabels: Record<string, string> = { active: '🟢 Faol', completed: '✓ Tugadi', paused: '⏸ Pauza' }
  return (
    <div className="flex items-center gap-4 py-3.5 border-b border-[#E5E7EB] last:border-0 hover:bg-[#F9FAFB]/40 rounded-lg px-2 transition-colors">
      <span className="text-xl flex-shrink-0">{PLATFORM_ICONS[c.platform] ?? '📊'}</span>
      <div className="flex-1 min-w-0">
        <div className="text-[#111827] text-sm font-medium truncate">{c.niche}</div>
        <div className="text-[#6B7280] text-xs">{c.duration}</div>
      </div>
      <div className="text-right">
        <div className="text-[#111827] text-sm font-bold">{c.roas}x ROAS</div>
        <div className="text-[#6B7280] text-xs">${c.spend.toLocaleString()} sarflandi</div>
      </div>
      <div className="text-right hidden sm:block">
        <div className="text-[#111827] text-sm">${c.cpa}</div>
        <div className="text-[#6B7280] text-xs">CPA</div>
      </div>
      <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border flex-shrink-0 ${statusColors[c.status]}`}>
        {statusLabels[c.status]}
      </span>
    </div>
  )
}

/* ── review card ── */
function ReviewCard({ r }: { r: PortfolioTargetologist['reviews'][0] }) {
  return (
    <div className="bg-white border border-[#E5E7EB] rounded-xl p-5">
      <div className="flex items-center gap-1 mb-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <span key={i} className={i < r.rating ? 'text-yellow-400' : 'text-[#2A2A3A]'}>★</span>
        ))}
        {r.verified && (
          <span className="ml-2 text-[10px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full font-bold">
            ✓ Tasdiqlangan
          </span>
        )}
      </div>
      <p className="text-[#374151] text-sm leading-relaxed italic mb-4">"{r.text}"</p>
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-[#F3F4F6] flex items-center justify-center text-xs font-bold text-[#111827]">
          {r.author.charAt(0)}
        </div>
        <div>
          <div className="text-[#111827] text-sm font-semibold">{r.author}</div>
          <div className="text-[#6B7280] text-xs">{r.company}</div>
        </div>
        <span className="ml-auto text-[#6B7280] text-xs">{r.date}</span>
      </div>
    </div>
  )
}

/* ── main ── */
export default function TargetologistProfilePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params)
  const router = useRouter()
  const [tab, setTab] = useState<'overview' | 'campaigns' | 'reviews'>('overview')
  const [contactOpen, setContactOpen] = useState(false)

  const t = MOCK_TARGETOLOGISTS.find(x => x.slug === slug)

  if (!t) {
    return (
      <div className="min-h-screen bg-[#F9FAFB] flex items-center justify-center text-center px-6">
        <div>
          <div className="text-6xl mb-4">👤</div>
          <h2 className="text-2xl font-bold text-[#111827] mb-2">Targetolog topilmadi</h2>
          <p className="text-[#9CA3AF] mb-6">Bu profil mavjud emas yoki o'chirilgan</p>
          <button onClick={() => router.push('/portfolio')} className="bg-[#111827] text-white px-6 py-3 rounded-lg font-semibold">
            Katalogga qaytish
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F9FAFB] text-[#111827]">

      {/* ── NAV ── */}
      <nav className="sticky top-0 z-50 border-b border-[#E5E7EB] bg-[#F9FAFB]/90 backdrop-blur-lg">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <button onClick={() => router.push('/portfolio')} className="flex items-center gap-2 text-[#9CA3AF] hover:text-[#111827] transition-colors text-sm">
            ← Katalog
          </button>
          <span className="text-lg font-extrabold">
            Nishon <span className="text-[#374151]">AI</span>
          </span>
          <button
            onClick={() => router.push('/login')}
            className="text-sm bg-[#111827] hover:bg-[#1F2937] text-white px-4 py-2 rounded-lg font-semibold transition-all"
          >
            Kirish
          </button>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-6 py-10">

        {/* ── PROFILE HEADER ── */}
        <div className="bg-white border border-[#E5E7EB] rounded-2xl p-8 mb-8">
          <div className="flex flex-col md:flex-row gap-6 items-start">

            {/* Avatar */}
            <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${t.avatarColor} flex items-center justify-center text-2xl font-black text-[#111827] shadow-xl flex-shrink-0`}>
              {t.avatar}
            </div>

            {/* Info */}
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <h1 className="text-2xl font-extrabold text-[#111827]">{t.name}</h1>
                {t.verified && <VerifiedBadge />}
                {t.proMember && (
                  <span className="bg-[#111827]/15 border border-[#D1D5DB] text-[#374151] text-xs font-bold px-2.5 py-1 rounded-full">⭐ PRO</span>
                )}
              </div>
              <p className="text-[#9CA3AF] text-sm mb-1">{t.title}</p>
              <p className="text-[#6B7280] text-xs mb-4">📍 {t.location} &nbsp;·&nbsp; A'zo bo'lgan: {t.joinedAt} &nbsp;·&nbsp; ⚡ {t.responseTime}</p>
              <p className="text-[#374151] text-sm leading-relaxed max-w-2xl">{t.bio}</p>

              {/* platform tags */}
              <div className="flex flex-wrap gap-2 mt-4">
                {t.platforms.map(p => (
                  <span
                    key={p.id}
                    className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border ${
                      p.verified
                        ? 'bg-[#F9FAFB] border-[#E5E7EB] text-[#111827]'
                        : 'bg-[#F9FAFB] border-[#E5E7EB] text-[#6B7280]'
                    }`}
                  >
                    {p.icon} {p.name}
                    {p.verified && <span className="text-emerald-400 font-bold">✓</span>}
                    <span className="text-[#6B7280]">({p.accountsConnected})</span>
                  </span>
                ))}
              </div>
            </div>

            {/* CTA card */}
            <div className="bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl p-5 w-full md:w-56 flex-shrink-0">
              <div className="flex items-center gap-1 mb-3">
                <span className="text-yellow-400 text-sm">★</span>
                <span className="text-[#111827] font-bold">{t.rating}</span>
                <span className="text-[#6B7280] text-xs">({t.reviewCount} sharh)</span>
              </div>
              <div className="text-[#6B7280] text-xs mb-1">Narxi:</div>
              <div className="text-[#111827] font-extrabold text-xl mb-4">
                ${t.price.from}
                <span className="text-[#6B7280] text-sm font-normal">/{t.price.unit}</span>
              </div>
              <button
                onClick={() => setContactOpen(true)}
                className="w-full bg-[#111827] hover:bg-[#1F2937] text-white text-sm font-bold py-3 rounded-xl shadow-[0_0_20px_rgba(124,58,237,0.3)] hover:shadow-[0_0_30px_rgba(124,58,237,0.5)] transition-all mb-2"
              >
                Bog'lanish
              </button>
              <button
                onClick={() => router.push('/login')}
                className="w-full bg-[#F9FAFB] hover:bg-[#F3F4F6] text-[#9CA3AF] text-sm py-2.5 rounded-xl border border-[#E5E7EB] transition-all"
              >
                Xizmat buyurtma
              </button>
            </div>
          </div>
        </div>

        {/* ── KEY METRICS (myfxbook style) ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3 mb-8">
          <div className="col-span-2 bg-gradient-to-br from-white to-[#F9FAFB] border border-[#D1D5DB] rounded-xl p-4">
            <div className="text-[#9CA3AF] text-xs mb-1">O'rtacha ROAS</div>
            <div className="text-3xl font-extrabold text-[#374151]">{t.stats.avgROAS}x</div>
            <div className="text-xs text-emerald-400 mt-1">En yaxshi: {t.stats.bestROAS}x</div>
          </div>
          <div className="col-span-2 bg-white border border-[#E5E7EB] rounded-xl p-4">
            <div className="text-[#9CA3AF] text-xs mb-1">O'rtacha CPA</div>
            <div className="text-3xl font-extrabold text-[#111827]">${t.stats.avgCPA}</div>
            <div className="text-xs text-[#6B7280] mt-1">O'rtacha CTR: {t.stats.avgCTR}%</div>
          </div>
          <div className="col-span-2 bg-white border border-[#E5E7EB] rounded-xl p-4">
            <div className="text-[#9CA3AF] text-xs mb-1">Jami boshqarilgan</div>
            <div className="text-3xl font-extrabold text-[#111827]">{formatSpend(t.stats.totalSpendManaged)}</div>
            <div className="text-xs text-[#6B7280] mt-1">Faol: {t.stats.activeCampaigns} kampaniya</div>
          </div>
          <div className="col-span-2 bg-white border border-[#E5E7EB] rounded-xl p-4">
            <div className="text-[#9CA3AF] text-xs mb-1">Muvaffaqiyat darajasi</div>
            <div className="text-3xl font-extrabold text-emerald-400">{t.stats.successRate}%</div>
            <div className="text-xs text-[#6B7280] mt-1">Jami: {t.stats.totalCampaigns} ta kampaniya</div>
          </div>
        </div>

        {/* ── LIVE indicator ── */}
        <div className="flex items-center gap-2 mb-6">
          <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
          <span className="text-emerald-400 text-xs font-bold uppercase tracking-widest">Live tracking — real vaqtda yangilanadi</span>
          <span className="text-[#6B7280] text-xs ml-2">Oxirgi yangilanish: 5 daqiqa oldin</span>
        </div>

        {/* ── TABS ── */}
        <div className="flex gap-1 bg-white border border-[#E5E7EB] rounded-xl p-1 mb-8 w-fit">
          {(['overview', 'campaigns', 'reviews'] as const).map(t2 => (
            <button
              key={t2}
              onClick={() => setTab(t2)}
              className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                tab === t2
                  ? 'bg-[#111827] text-white shadow'
                  : 'text-[#9CA3AF] hover:text-[#111827]'
              }`}
            >
              {t2 === 'overview' ? '📊 Ko\'rinish' : t2 === 'campaigns' ? '🎯 Kampaniyalar' : '⭐ Sharhlar'}
            </button>
          ))}
        </div>

        {/* ── OVERVIEW TAB ── */}
        {tab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* ROAS chart */}
            <div className="lg:col-span-2 bg-white border border-[#E5E7EB] rounded-2xl p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-[#111827] font-bold">ROAS dinamikasi (6 oy)</h3>
                <span className="text-xs text-[#6B7280] bg-[#F9FAFB] px-3 py-1 rounded-lg border border-[#E5E7EB]">Oylik</span>
              </div>
              <RoasChart data={t.monthlyPerformance} />
            </div>

            {/* Platform split */}
            <div className="bg-white border border-[#E5E7EB] rounded-2xl p-6">
              <h3 className="text-[#111827] font-bold mb-6">Platform taqsimoti</h3>
              <PlatformSplit data={t.platformSplit} />

              <div className="mt-6 pt-5 border-t border-[#E5E7EB]">
                <h4 className="text-[#9CA3AF] text-xs font-semibold uppercase tracking-wider mb-3">Niche ixtisoslashuv</h4>
                <div className="flex flex-wrap gap-2">
                  {t.niches.map(n => (
                    <span key={n} className="text-xs bg-[#F9FAFB] border border-[#E5E7EB] text-[#374151] px-2.5 py-1 rounded-lg">
                      {n}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Summary stats */}
            <div className="lg:col-span-3 grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard label="Faol kampaniyalar" value={t.stats.activeCampaigns} sub="hozirda ishlaydi" />
              <StatCard label="O'rtacha CTR" value={`${t.stats.avgCTR}%`} sub="barcha platformalar" accent />
              <StatCard label="Eng yuqori ROAS" value={`${t.stats.bestROAS}x`} sub="bir kampaniyada" />
              <StatCard label="Sharh soni" value={t.reviewCount} sub={`${t.rating}★ o'rtacha`} />
            </div>
          </div>
        )}

        {/* ── CAMPAIGNS TAB ── */}
        {tab === 'campaigns' && (
          <div className="bg-white border border-[#E5E7EB] rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[#111827] font-bold">So'nggi kampaniyalar</h3>
              <span className="text-xs text-[#6B7280] bg-[#F9FAFB] border border-[#E5E7EB] px-3 py-1 rounded-lg">
                Mijoz maxfiyligi uchun anonimlashtrilgan
              </span>
            </div>
            <div>
              {t.recentCampaigns.map(c => (
                <CampaignRow key={c.id} c={c} />
              ))}
            </div>

            {/* aggregate row */}
            <div className="mt-6 pt-4 border-t border-[#E5E7EB] grid grid-cols-3 gap-4">
              <div className="bg-[#F9FAFB] rounded-xl p-3 text-center">
                <div className="text-[#111827] font-bold text-lg">
                  {(t.recentCampaigns.reduce((s, c) => s + c.roas, 0) / t.recentCampaigns.length).toFixed(1)}x
                </div>
                <div className="text-[#6B7280] text-xs">O'rtacha ROAS</div>
              </div>
              <div className="bg-[#F9FAFB] rounded-xl p-3 text-center">
                <div className="text-[#111827] font-bold text-lg">
                  {formatSpend(t.recentCampaigns.reduce((s, c) => s + c.spend, 0))}
                </div>
                <div className="text-[#6B7280] text-xs">Jami sarflangan</div>
              </div>
              <div className="bg-[#F9FAFB] rounded-xl p-3 text-center">
                <div className="text-emerald-400 font-bold text-lg">
                  {t.recentCampaigns.filter(c => c.status === 'active').length} ta
                </div>
                <div className="text-[#6B7280] text-xs">Hozir faol</div>
              </div>
            </div>
          </div>
        )}

        {/* ── REVIEWS TAB ── */}
        {tab === 'reviews' && (
          <div>
            <div className="flex items-center gap-6 bg-white border border-[#E5E7EB] rounded-2xl p-6 mb-6">
              <div className="text-center">
                <div className="text-5xl font-extrabold text-[#111827]">{t.rating}</div>
                <div className="flex gap-0.5 justify-center my-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <span key={i} className={i < Math.floor(t.rating) ? 'text-yellow-400' : 'text-[#2A2A3A]'}>★</span>
                  ))}
                </div>
                <div className="text-[#6B7280] text-xs">{t.reviewCount} sharh</div>
              </div>
              <div className="flex-1">
                {[5, 4, 3, 2, 1].map(star => {
                  const count = t.reviews.filter(r => r.rating === star).length
                  const pct = t.reviews.length ? (count / t.reviews.length) * 100 : 0
                  return (
                    <div key={star} className="flex items-center gap-2 mb-1">
                      <span className="text-[#6B7280] text-xs w-4">{star}</span>
                      <span className="text-yellow-400 text-xs">★</span>
                      <div className="flex-1 bg-[#F9FAFB] rounded-full h-2">
                        <div className="h-2 bg-yellow-400 rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-[#6B7280] text-xs w-4 text-right">{count}</span>
                    </div>
                  )
                })}
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {t.reviews.map(r => (
                <ReviewCard key={r.id} r={r} />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── CONTACT MODAL ── */}
      {contactOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <div className="bg-white border border-[#E5E7EB] rounded-2xl p-8 w-full max-w-md">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-[#111827] font-bold text-xl">{t.name} bilan bog'lanish</h3>
              <button onClick={() => setContactOpen(false)} className="text-[#6B7280] hover:text-[#111827] text-xl">✕</button>
            </div>
            <p className="text-[#9CA3AF] text-sm mb-6">
              Xabar yuborish uchun platformaga kiring yoki ro'yxatdan o'ting.
            </p>
            <div className="space-y-3">
              <button
                onClick={() => router.push('/login')}
                className="w-full bg-[#111827] hover:bg-[#1F2937] text-white font-bold py-3 rounded-xl transition-all"
              >
                Kirish va xabar yuborish
              </button>
              <button
                onClick={() => router.push('/register')}
                className="w-full bg-[#F9FAFB] hover:bg-[#F3F4F6] text-[#111827] py-3 rounded-xl border border-[#E5E7EB] transition-all"
              >
                Ro'yxatdan o'tish — bepul
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
