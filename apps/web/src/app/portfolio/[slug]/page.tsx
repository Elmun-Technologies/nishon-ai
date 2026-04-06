'use client'
import { useState, use, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { MOCK_TARGETOLOGISTS, formatSpend, type PortfolioTargetologist } from '@/lib/portfolio-data'
import { agents as agentsApi } from '@/lib/api-client'
import { ShaderCanvas } from '@/components/ui/animated-glassy-pricing'
import {
  BarChart3, TrendingUp, Users, Shield, Zap, Target,
  Star, CheckCircle2, ArrowRight, ChevronDown, ExternalLink,
  DollarSign, Activity, Award, Clock, MapPin, MessageCircle,
  Layers, Brain, LineChart, Rocket, Eye, Settings,
  PieChart, Globe, Lock, Gauge, Sparkles, LayoutDashboard
} from 'lucide-react'

const PLATFORM_META: Record<string, { name: string; icon: string; color: string }> = {
  meta:     { name: 'Meta Ads',      icon: '📘', color: '#1877F2' },
  google:   { name: 'Google Ads',    icon: '🔍', color: '#4285F4' },
  yandex:   { name: 'Yandex Direct', icon: '🟡', color: '#FFCC00' },
  telegram: { name: 'Telegram Ads',  icon: '✈️', color: '#2CA5E0' },
  tiktok:   { name: 'TikTok Ads',    icon: '🎵', color: '#000000' },
  youtube:  { name: 'YouTube Ads',   icon: '▶️', color: '#FF0000' },
}

function apiAgentToPortfolio(a: any, reviews: any[]): PortfolioTargetologist {
  const stats = a.cachedStats || {}
  const platforms = (a.platforms || []).map((p: string, i: number) => ({
    id: p,
    name: PLATFORM_META[p]?.name || p,
    icon: PLATFORM_META[p]?.icon || '📢',
    color: PLATFORM_META[p]?.color || '#888',
    verified: a.isVerified,
    accountsConnected: stats.activeCampaigns || 0,
  }))
  const platformColors = ['#1877F2', '#4285F4', '#FFCC00', '#2CA5E0', '#000000', '#FF0000']
  const platformSplit = platforms.length > 0
    ? platforms.map((p: any, i: number) => ({
        platform: p.name,
        percent: Math.floor(100 / platforms.length),
        color: platformColors[i % platformColors.length],
      }))
    : [{ platform: 'Meta', percent: 100, color: '#1877F2' }]
  return {
    id: a.id, slug: a.slug, name: a.displayName,
    avatar: a.avatar || a.displayName?.slice(0, 2)?.toUpperCase() || '??',
    avatarColor: a.avatarColor || 'from-emerald-500 to-teal-600',
    title: a.title || '', location: a.location || "O'zbekiston",
    bio: a.bio || '', verified: a.isVerified, proMember: a.isProMember,
    joinedAt: a.createdAt ? new Date(a.createdAt).toLocaleDateString('uz-UZ', { year: 'numeric', month: '2-digit' }) : '—',
    responseTime: a.responseTime || '24 soat ichida',
    rating: a.cachedRating || 0, reviewCount: a.cachedReviewCount || 0,
    price: { from: a.monthlyRate || 0, currency: 'USD', unit: 'oyiga' },
    platforms, stats: {
      totalSpendManaged: stats.totalSpendManaged || 0, avgROAS: stats.avgROAS || 0,
      avgCPA: stats.avgCPA || 0, avgCTR: stats.avgCTR || 0,
      totalCampaigns: stats.totalCampaigns || 0, activeCampaigns: stats.activeCampaigns || 0,
      successRate: stats.successRate || 0, bestROAS: stats.bestROAS || 0,
    },
    niches: a.niches || [], monthlyPerformance: a.monthlyPerformance || [],
    platformSplit, recentCampaigns: [],
    reviews: reviews.map(r => ({
      id: r.id, author: r.authorName, company: r.authorCompany || '',
      rating: r.rating, text: r.text,
      date: r.createdAt ? new Date(r.createdAt).toLocaleDateString('uz-UZ') : '',
      verified: r.isVerified,
    })),
  }
}

/* ── Glass Card (emerald theme) ── */
function GlassCard({ children, className = '', hover = false }: { children: React.ReactNode; className?: string; hover?: boolean }) {
  return (
    <div className={`backdrop-blur-xl bg-white/[0.03] border border-white/[0.08] rounded-2xl transition-all duration-300 ${hover ? 'hover:bg-white/[0.06] hover:border-emerald-400/20 hover:shadow-lg hover:shadow-emerald-500/5' : ''} ${className}`}>
      {children}
    </div>
  )
}

/* ── Stat Card ── */
function StatCard({ label, value, icon: Icon, accent = false }: { label: string; value: string; icon: any; accent?: boolean }) {
  return (
    <GlassCard className="p-5 group" hover>
      <div className="flex items-center gap-3 mb-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${accent ? 'bg-emerald-500/15 text-emerald-400' : 'bg-white/5 text-gray-400'} group-hover:bg-emerald-500/15 group-hover:text-emerald-400 transition-colors`}>
          <Icon size={20} />
        </div>
      </div>
      <div className="text-2xl font-bold text-white mb-1">{value}</div>
      <div className="text-[11px] uppercase tracking-wider text-gray-500 font-medium">{label}</div>
    </GlassCard>
  )
}

/* ── ROAS Bar Chart ── */
function RoasChart({ data }: { data: { month: string; roas: number; spend: number }[] }) {
  const maxRoas = Math.max(...data.map(d => d.roas), 1)
  return (
    <div className="space-y-3">
      {data.map(d => (
        <div key={d.month} className="flex items-center gap-3">
          <span className="text-gray-500 text-xs w-8 flex-shrink-0 font-medium">{d.month}</span>
          <div className="flex-1 bg-white/5 rounded-full h-7 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full flex items-center justify-end pr-3 transition-all duration-700"
              style={{ width: `${Math.max((d.roas / maxRoas) * 100, 15)}%` }}
            >
              <span className="text-white text-[11px] font-bold drop-shadow">{d.roas}x</span>
            </div>
          </div>
          <span className="text-gray-500 text-xs w-16 text-right flex-shrink-0">{formatSpend(d.spend)}</span>
        </div>
      ))}
    </div>
  )
}

/* ── Platform Donut ── */
function PlatformDonut({ data }: { data: { platform: string; percent: number; color: string }[] }) {
  let offset = 0
  const r = 40, circ = 2 * Math.PI * r
  return (
    <div className="flex items-center gap-6">
      <svg width={100} height={100} viewBox="0 0 100 100">
        {data.map((d, i) => {
          const len = (d.percent / 100) * circ
          const seg = (
            <circle key={i} cx={50} cy={50} r={r} fill="none" stroke={d.color}
              strokeWidth={14} strokeDasharray={`${len} ${circ - len}`}
              strokeDashoffset={-offset} transform="rotate(-90 50 50)" strokeLinecap="round" />
          )
          offset += len
          return seg
        })}
        <circle cx={50} cy={50} r={30} fill="#0a1a1a" fillOpacity={0.8} />
      </svg>
      <div className="space-y-2">
        {data.map(d => (
          <div key={d.platform} className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: d.color }} />
            <span className="text-gray-400 text-xs">{d.platform}</span>
            <span className="text-white text-xs font-bold ml-auto pl-4">{d.percent}%</span>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ── Review Card ── */
function ReviewCard({ r }: { r: PortfolioTargetologist['reviews'][0] }) {
  return (
    <GlassCard className="p-5" hover>
      <div className="flex items-center gap-1 mb-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star key={i} size={14} className={i < r.rating ? 'text-amber-400 fill-amber-400' : 'text-gray-600'} />
        ))}
        {r.verified && (
          <span className="ml-2 text-[10px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
            <CheckCircle2 size={10} /> Tasdiqlangan
          </span>
        )}
      </div>
      <p className="text-gray-300 text-sm leading-relaxed italic mb-4">&ldquo;{r.text}&rdquo;</p>
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-600/30 to-teal-600/30 border border-white/10 flex items-center justify-center text-xs font-bold text-emerald-300">
          {r.author.charAt(0)}
        </div>
        <div>
          <div className="text-white text-sm font-semibold">{r.author}</div>
          <div className="text-gray-500 text-xs">{r.company}</div>
        </div>
        <span className="ml-auto text-gray-500 text-xs">{r.date}</span>
      </div>
    </GlassCard>
  )
}

/* ── ALL PLATFORM FEATURES ── */
const PLATFORM_FEATURES = [
  { icon: BarChart3, title: 'Real-time Analytics', desc: 'Barcha reklama ko\'rsatkichlari real vaqtda yangilanadi. CPM, CPC, CTR, ROAS — barchasi bir joyda.' },
  { icon: Brain, title: 'AI Avtomatik Optimizatsiya', desc: 'Sun\'iy intellekt kampaniyalarni 24/7 kuzatadi va byudjetni samaraliroq taqsimlaydi.' },
  { icon: Shield, title: 'Tasdiqlangan Natijalar', desc: 'API orqali haqiqiy ad account ma\'lumotlari. Natijalar soxtalashtirib bo\'lmaydi.' },
  { icon: Target, title: 'ROAS & CPA Tracking', desc: 'Har bir kampaniyaning ROI si, CPA va konversiyalari real vaqtda kuzatiladi.' },
  { icon: Users, title: 'Mutaxassislar Marketplace', desc: 'Eng yaxshi targetologlarni toping, natijalarini ko\'ring va xizmat buyurtma bering.' },
  { icon: Zap, title: 'Tezkor Kampaniya Launch', desc: 'Meta, Google, Yandex uchun kampaniyani bir necha daqiqada sozlang va ishga tushiring.' },
  { icon: Layers, title: 'Multi-Platform Boshqaruv', desc: 'Meta, Google, Yandex, TikTok, Telegram — barcha platformalar bir paneldan.' },
  { icon: LineChart, title: 'Batafsil Hisobotlar', desc: 'Kunlik, haftalik, oylik hisobotlar. PDF va Excel export. Mijozlarga avtomatik yuborish.' },
  { icon: Rocket, title: 'Campaign Wizard', desc: 'Bosqichma-bosqich kampaniya yaratish — maqsad, auditoriya, byudjet, kreativ, launch.' },
  { icon: Eye, title: 'Raqobatchi Tahlili', desc: 'Raqobatchilarning Instagram, veb-saytini tahlil qiling. SWOT va audit hisobotlari.' },
  { icon: Sparkles, title: 'Kreativ Baholash', desc: 'AI reklama kreativini 10 parametr bo\'yicha baholaydi. CTR prognozi bilan.' },
  { icon: PieChart, title: 'Byudjet Taqsimlash', desc: 'AI platformalar o\'rtasida byudjetni optimal taqsimlaydi. ROI ga asoslangan.' },
  { icon: Globe, title: 'Landing Page Builder', desc: 'Reklama uchun maxsus landing sahifalar yarating. A/B test va konversiya tracking.' },
  { icon: Lock, title: 'Xavfsizlik & Maxfiylik', desc: 'GDPR mos. Ma\'lumotlar shifrlangan. Pul qaytarish kafolati. 24/7 qo\'llab-quvvatlash.' },
  { icon: Gauge, title: 'Auto-Optimization Engine', desc: 'AI har bir kampaniyani avtomatik yaxshilaydi — bid, auditoriya, placement sozlamalari.' },
  { icon: LayoutDashboard, title: 'Yagona Dashboard', desc: 'Barcha platformalar, kampaniyalar va natijalar — bitta intuitiv boshqaruv panelida.' },
]

const HERO_STATS = [
  { value: '60%', label: "vaqtni admin ishlar yeb yuboradi — biz buni avtomatlashtirdik" },
  { value: '43%', label: "reklamachilar yomon UX sabab platformani tark etadi" },
  { value: '3.2x', label: "o'rtacha ROAS — Performa foydalanuvchilari natijalari" },
]


/* ════════════════════════════════════════════════════════════════════════ */
/* ██ MAIN PAGE ██ */
/* ════════════════════════════════════════════════════════════════════════ */
export default function TargetologistProfilePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params)
  const router = useRouter()
  const [contactOpen, setContactOpen] = useState(false)
  const [loadedProfile, setLoadedProfile] = useState<PortfolioTargetologist | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    agentsApi.getBySlug(slug)
      .then(async (res: any) => {
        const agent = res.data
        if (agent) {
          let reviews: any[] = []
          try { const rev = await agentsApi.getReviews(agent.id); reviews = (rev.data as any) || [] } catch {}
          setLoadedProfile(apiAgentToPortfolio(agent, reviews))
        } else {
          setLoadedProfile(MOCK_TARGETOLOGISTS.find(x => x.slug === slug) || null)
        }
      })
      .catch(() => {
        setLoadedProfile(MOCK_TARGETOLOGISTS.find(x => x.slug === slug) || null)
      })
      .finally(() => setLoading(false))
  }, [slug])

  if (loading) {
    return (
      <div className="min-h-screen bg-[#030d0e] flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const t = loadedProfile
  if (!t) {
    return (
      <div className="min-h-screen bg-[#030d0e] flex items-center justify-center text-center px-6">
        <div>
          <div className="text-6xl mb-4">👤</div>
          <h2 className="text-2xl font-bold text-white mb-2">Targetolog topilmadi</h2>
          <p className="text-gray-500 mb-6">Bu profil mavjud emas yoki o&apos;chirilgan</p>
          <button onClick={() => router.push('/portfolio')} className="bg-emerald-500 text-white px-6 py-3 rounded-xl font-semibold hover:bg-emerald-600 transition-all">
            Katalogga qaytish
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#030d0e] text-white overflow-x-hidden">

      {/* ═══ ANIMATED BG ═══ */}
      <div className="fixed inset-0 z-0 opacity-20 pointer-events-none">
        <ShaderCanvas />
      </div>

      {/* ═══ TOP BAR ═══ */}
      <div className="relative z-50 border-b border-emerald-500/20 bg-[#0a1f1a] py-2">
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-center gap-6 text-xs text-gray-400">
          <span>Performa Marketplace</span>
          <span className="hidden sm:inline">·</span>
          <span className="hidden sm:inline">Tasdiqlangan natijalar · Pul qaytarish kafolati</span>
        </div>
      </div>

      {/* ═══ STICKY NAV ═══ */}
      <nav className="sticky top-0 z-50 border-b border-white/5 bg-[#030d0e]/90 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
          <button onClick={() => router.push('/portfolio')} className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors text-sm font-medium">
            ← Katalog
          </button>
          <span className="text-lg font-extrabold tracking-tight">
            Performa <span className="text-emerald-400">AI</span>
          </span>
          <div className="flex items-center gap-2">
            <button onClick={() => setContactOpen(true)}
              className="text-sm bg-emerald-500 hover:bg-emerald-400 text-[#030d0e] px-5 py-2 rounded-full font-semibold transition-all">
              Bog&apos;lanish
            </button>
            <button onClick={() => router.push('/login')}
              className="text-sm border border-white/10 text-white px-4 py-2 rounded-full font-medium hover:bg-white/5 transition-all">
              Kirish
            </button>
          </div>
        </div>
      </nav>

      {/* ═══ HERO ═══ */}
      <section className="relative z-10 pt-20 pb-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col lg:flex-row gap-12 items-start">

            {/* Left: Profile */}
            <div className="flex-1 max-w-3xl">
              <div className="flex items-center gap-5 mb-8">
                <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${t.avatarColor} flex items-center justify-center text-2xl font-black text-white shadow-2xl shadow-emerald-500/20 border border-white/10`}>
                  {t.avatar}
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">{t.name}</h1>
                    {t.verified && (
                      <span className="inline-flex items-center gap-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold px-2.5 py-1 rounded-full">
                        <CheckCircle2 size={12} /> Tasdiqlangan
                      </span>
                    )}
                    {t.proMember && (
                      <span className="bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-bold px-2.5 py-1 rounded-full">⭐ PRO</span>
                    )}
                  </div>
                  <p className="text-gray-400 text-base">{t.title}</p>
                  <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                    <span className="flex items-center gap-1"><MapPin size={12} /> {t.location}</span>
                    <span className="flex items-center gap-1"><Clock size={12} /> {t.responseTime}</span>
                    <span className="flex items-center gap-1"><Star size={12} className="text-amber-400 fill-amber-400" /> {t.rating} ({t.reviewCount})</span>
                  </div>
                </div>
              </div>

              <h2 className="text-4xl md:text-5xl font-extrabold leading-tight tracking-tight mb-6">
                Samarali reklama. <span className="text-emerald-400">Professional boshqaruv.</span>
              </h2>

              <p className="text-gray-400 text-lg leading-relaxed max-w-2xl mb-8">{t.bio || 'Reklama operatsiyasini tartib bilan boshqaradi: kampaniya yaratishdan tortib publishing, optimization va reportinggacha. Maqsad — jamoaga kamroq qo\'l mehnati, ko\'proq aniq natija.'}</p>

              <div className="flex flex-wrap gap-3 mb-8">
                <button onClick={() => setContactOpen(true)}
                  className="bg-emerald-500 hover:bg-emerald-400 text-[#030d0e] px-7 py-3.5 rounded-full font-bold text-sm transition-all flex items-center gap-2 shadow-lg shadow-emerald-500/25">
                  Xizmat buyurtma berish <ArrowRight size={16} />
                </button>
                <button onClick={() => router.push('/register')}
                  className="border border-white/15 text-white px-7 py-3.5 rounded-full font-medium text-sm hover:bg-white/5 transition-all flex items-center gap-2">
                  Platformaga kirish <ExternalLink size={14} />
                </button>
              </div>

              {/* Platform badges */}
              <div className="flex flex-wrap gap-2">
                {t.platforms.map(p => (
                  <span key={p.id}
                    className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-xl bg-white/[0.04] border border-white/[0.08] text-gray-300 font-medium">
                    {p.icon} {p.name}
                    {p.verified && <CheckCircle2 size={12} className="text-emerald-400" />}
                  </span>
                ))}
              </div>
            </div>

            {/* Right: CTA Card */}
            <GlassCard className="w-full lg:w-80 p-6 flex-shrink-0 lg:sticky lg:top-20">
              <div className="flex items-center gap-1 mb-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} size={16} className={i < Math.floor(t.rating) ? 'text-amber-400 fill-amber-400' : 'text-gray-600'} />
                ))}
                <span className="text-white font-bold ml-1">{t.rating}</span>
                <span className="text-gray-500 text-xs">({t.reviewCount} sharh)</span>
              </div>

              <div className="text-gray-500 text-xs mb-1 uppercase tracking-wider font-medium">Narxi</div>
              <div className="text-white font-extrabold text-3xl mb-1">
                ${t.price.from}
                <span className="text-gray-500 text-sm font-normal">/{t.price.unit}</span>
              </div>
              <div className="text-xs text-emerald-400 font-medium mb-5 flex items-center gap-1">
                <Activity size={12} /> Hozir faol — {t.stats.activeCampaigns} kampaniya
              </div>

              <button onClick={() => setContactOpen(true)}
                className="w-full bg-emerald-500 hover:bg-emerald-400 text-[#030d0e] text-sm font-bold py-3.5 rounded-xl transition-all mb-3 flex items-center justify-center gap-2">
                <MessageCircle size={16} /> Bog&apos;lanish
              </button>
              <button onClick={() => router.push('/register')}
                className="w-full bg-white/5 hover:bg-white/10 text-gray-300 text-sm py-3 rounded-xl border border-white/10 transition-all font-medium">
                Xizmat buyurtma berish
              </button>

              <div className="mt-5 pt-4 border-t border-white/[0.06]">
                <div className="text-[10px] uppercase tracking-widest text-gray-500 font-medium mb-2">Performa kafolati</div>
                <div className="space-y-1.5 text-xs text-gray-400">
                  <div className="flex items-center gap-2"><Shield size={12} className="text-emerald-400" /> Pul qaytarish kafolati</div>
                  <div className="flex items-center gap-2"><CheckCircle2 size={12} className="text-emerald-400" /> Tasdiqlangan natijalar</div>
                  <div className="flex items-center gap-2"><Clock size={12} className="text-emerald-400" /> 24/7 qo&apos;llab-quvvatlash</div>
                </div>
              </div>
            </GlassCard>
          </div>
        </div>
      </section>

      {/* ═══ HERO STATS ═══ */}
      <section className="relative z-10 pb-20 px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-4">
          {HERO_STATS.map((s, i) => (
            <GlassCard key={i} className="p-8 text-center">
              <div className="text-5xl md:text-6xl font-extrabold text-white mb-3 tracking-tight">{s.value}</div>
              <p className="text-gray-400 text-sm">{s.label}</p>
            </GlassCard>
          ))}
        </div>
      </section>

      {/* ═══ KEY METRICS ═══ */}
      <section className="relative z-10 py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-3">
              Natijalar <span className="text-emerald-400">raqamlarda</span>
            </h2>
            <p className="text-gray-500 text-sm max-w-lg mx-auto">Barcha ma&apos;lumotlar haqiqiy ad account lardan API orqali olingan</p>
            <div className="flex items-center justify-center gap-2 mt-4">
              <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
              <span className="text-emerald-400 text-xs font-bold uppercase tracking-widest">Live tracking</span>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard icon={TrendingUp} label="O'rtacha ROAS" value={`${t.stats.avgROAS}x`} accent />
            <StatCard icon={DollarSign} label="Jami boshqarilgan" value={formatSpend(t.stats.totalSpendManaged)} />
            <StatCard icon={Target} label="O'rtacha CPA" value={`$${t.stats.avgCPA}`} />
            <StatCard icon={Award} label="Muvaffaqiyat" value={`${t.stats.successRate}%`} accent />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
            <StatCard icon={Activity} label="Faol kampaniyalar" value={`${t.stats.activeCampaigns}`} />
            <StatCard icon={BarChart3} label="O'rtacha CTR" value={`${t.stats.avgCTR}%`} />
            <StatCard icon={Zap} label="Eng yuqori ROAS" value={`${t.stats.bestROAS}x`} accent />
            <StatCard icon={Users} label="Jami kampaniyalar" value={`${t.stats.totalCampaigns}`} />
          </div>
        </div>
      </section>

      {/* ═══ PERFORMANCE CHARTS ═══ */}
      <section className="relative z-10 py-16 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <GlassCard className="lg:col-span-2 p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-bold text-lg text-white">ROAS dinamikasi (6 oy)</h3>
                <span className="text-xs text-gray-500 bg-white/5 px-3 py-1 rounded-lg border border-white/10 font-medium">Oylik</span>
              </div>
              <RoasChart data={t.monthlyPerformance} />
            </GlassCard>

            <GlassCard className="p-6">
              <h3 className="font-bold text-lg mb-6 text-white">Platform taqsimoti</h3>
              <PlatformDonut data={t.platformSplit} />
            </GlassCard>
          </div>
        </div>
      </section>

      {/* ═══ PLATFORM FEATURES ═══ */}
      <section className="relative z-10 py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-3">
              Performa <span className="text-emerald-400">platformasi</span> imkoniyatlari
            </h2>
            <p className="text-gray-500 text-sm max-w-xl mx-auto">
              Reklama boshqaruvini to&apos;liq avtomatlashtiring. Barcha platformalar, barcha vositalar — bitta joyda.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {PLATFORM_FEATURES.map((f, i) => {
              const Icon = f.icon
              return (
                <GlassCard key={i} className="p-5" hover>
                  <div className="w-11 h-11 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-4">
                    <Icon size={22} className="text-emerald-400" />
                  </div>
                  <h3 className="font-bold text-sm text-white mb-1.5">{f.title}</h3>
                  <p className="text-gray-500 text-xs leading-relaxed">{f.desc}</p>
                </GlassCard>
              )
            })}
          </div>
        </div>
      </section>

      {/* ═══ HOW IT WORKS ═══ */}
      <section className="relative z-10 py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-3">
              Qanday <span className="text-emerald-400">ishlaydi?</span>
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { step: '01', title: 'Profil tanlang', desc: 'Marketplace dan o\'zingizga mos mutaxassisni tanlang. Natijalar, baholar, platformalar — hammasi shaffof.' },
              { step: '02', title: 'Xizmat buyurtma bering', desc: 'Mutaxassis bilan bog\'laning. Byudjet, maqsad va vaqt oraliqlarini kelishing.' },
              { step: '03', title: 'Natijani kuzating', desc: 'Real vaqtda ROAS, CPA, CTR kuzating. AI barcha kampaniyalarni optimallashtiradi.' },
            ].map((s, i) => (
              <GlassCard key={i} className="p-7 text-center" hover>
                <div className="text-5xl font-extrabold text-emerald-500/20 mb-3">{s.step}</div>
                <h3 className="font-bold text-lg text-white mb-2">{s.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{s.desc}</p>
              </GlassCard>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ RECENT CAMPAIGNS ═══ */}
      {t.recentCampaigns.length > 0 && (
        <section className="relative z-10 py-16 px-6">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-10">
              <h2 className="text-3xl font-extrabold tracking-tight mb-2">So&apos;nggi kampaniyalar</h2>
              <p className="text-gray-500 text-xs">Mijoz maxfiyligi uchun anonimlashtrilgan</p>
            </div>
            <GlassCard className="overflow-hidden">
              <div className="divide-y divide-white/[0.05]">
                {t.recentCampaigns.map(c => {
                  const statusColors: Record<string, string> = {
                    active: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
                    completed: 'bg-white/5 text-gray-400 border-white/10',
                    paused: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
                  }
                  const statusLabels: Record<string, string> = { active: 'Faol', completed: 'Tugadi', paused: 'Pauza' }
                  return (
                    <div key={c.id} className="flex items-center gap-4 py-4 px-6 hover:bg-white/[0.02] transition-colors">
                      <span className="text-xl flex-shrink-0">{PLATFORM_META[c.platform]?.icon ?? '📊'}</span>
                      <div className="flex-1 min-w-0">
                        <div className="text-white text-sm font-semibold truncate">{c.niche}</div>
                        <div className="text-gray-500 text-xs">{c.duration}</div>
                      </div>
                      <div className="text-right hidden sm:block">
                        <div className="text-white text-sm font-bold">{c.roas}x <span className="text-gray-500 font-normal">ROAS</span></div>
                        <div className="text-gray-500 text-xs">${c.spend.toLocaleString()}</div>
                      </div>
                      <span className={`text-[11px] font-bold px-3 py-1 rounded-full border flex-shrink-0 ${statusColors[c.status]}`}>
                        {statusLabels[c.status]}
                      </span>
                    </div>
                  )
                })}
              </div>
            </GlassCard>
          </div>
        </section>
      )}

      {/* ═══ REVIEWS ═══ */}
      {t.reviews.length > 0 && (
        <section className="relative z-10 py-20 px-6">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-3">
                Mijozlar <span className="text-emerald-400">fikri</span>
              </h2>
              <div className="flex items-center justify-center gap-2 mt-3">
                <div className="flex gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} size={18} className={i < Math.floor(t.rating) ? 'text-amber-400 fill-amber-400' : 'text-gray-600'} />
                  ))}
                </div>
                <span className="text-white font-bold text-lg">{t.rating}</span>
                <span className="text-gray-500 text-sm">({t.reviewCount} sharh)</span>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {t.reviews.map(r => <ReviewCard key={r.id} r={r} />)}
            </div>
          </div>
        </section>
      )}

      {/* ═══ CTA SECTION ═══ */}
      <section className="relative z-10 py-24 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <GlassCard className="px-10 py-16 bg-gradient-to-br from-emerald-500/[0.08] to-transparent border-emerald-500/10">
            <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight mb-5">
              Reklamangizni <span className="text-emerald-400">professional</span>ga ishoning
            </h2>
            <p className="text-gray-400 text-base mb-10 max-w-xl mx-auto leading-relaxed">
              {t.name} bilan hamkorlik qiling va reklama byudjetingizdan maksimal natija oling. Performa platformasi orqali barcha natijalar kafolatlanadi.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button onClick={() => setContactOpen(true)}
                className="bg-emerald-500 hover:bg-emerald-400 text-[#030d0e] px-8 py-3.5 rounded-full font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25">
                Hozir boshlash <ArrowRight size={16} />
              </button>
              <button onClick={() => router.push('/portfolio')}
                className="border border-white/10 text-white px-8 py-3.5 rounded-full font-medium text-sm hover:bg-white/5 transition-all">
                Boshqa mutaxassislar
              </button>
            </div>
          </GlassCard>
        </div>
      </section>

      {/* ═══ FOOTER ═══ */}
      <footer className="relative z-10 border-t border-white/[0.05] py-10 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-gray-500">
          <span className="font-bold text-white">Performa <span className="text-emerald-400">AI</span></span>
          <span>Barcha natijalar haqiqiy API ma&apos;lumotlari asosida tasdiqlangan</span>
          <div className="flex items-center gap-4">
            <button onClick={() => router.push('/terms')} className="hover:text-white transition-colors">Shartlar</button>
            <button onClick={() => router.push('/privacy')} className="hover:text-white transition-colors">Maxfiylik</button>
          </div>
        </div>
      </footer>

      {/* ═══ CONTACT MODAL ═══ */}
      {contactOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <div className="backdrop-blur-xl bg-[#0a1a1a]/95 border border-white/10 rounded-2xl p-8 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold text-xl text-white">{t.name} bilan bog&apos;lanish</h3>
              <button onClick={() => setContactOpen(false)} className="text-gray-500 hover:text-white text-xl transition-colors">✕</button>
            </div>
            <p className="text-gray-400 text-sm mb-6">
              Xabar yuborish uchun platformaga kiring yoki ro&apos;yxatdan o&apos;ting. Performa sizning xavfsizligingizni kafolatlaydi.
            </p>
            <div className="space-y-3">
              <button onClick={() => router.push('/login')}
                className="w-full bg-emerald-500 hover:bg-emerald-400 text-[#030d0e] font-bold py-3.5 rounded-xl transition-all flex items-center justify-center gap-2">
                <MessageCircle size={16} /> Kirish va xabar yuborish
              </button>
              <button onClick={() => router.push('/register')}
                className="w-full bg-white/5 hover:bg-white/10 text-gray-300 py-3 rounded-xl border border-white/10 transition-all font-medium">
                Ro&apos;yxatdan o&apos;tish — bepul
              </button>
            </div>
            <div className="mt-5 pt-4 border-t border-white/[0.06] flex items-center justify-center gap-4 text-xs text-gray-500">
              <span className="flex items-center gap-1"><Shield size={12} /> Xavfsiz</span>
              <span className="flex items-center gap-1"><CheckCircle2 size={12} /> Kafolatli</span>
              <span className="flex items-center gap-1"><Clock size={12} /> 24/7</span>
            </div>
          </div>
        </div>
      )}

      {/* ═══ FLOATING MOBILE CTA ═══ */}
      <div className="fixed bottom-0 left-0 right-0 z-40 lg:hidden backdrop-blur-xl bg-[#030d0e]/90 border-t border-white/[0.05] px-4 py-3">
        <div className="flex items-center gap-3 max-w-lg mx-auto">
          <div className="flex-1 min-w-0">
            <div className="font-bold text-sm text-white truncate">{t.name}</div>
            <div className="text-xs text-gray-500">${t.price.from}/{t.price.unit}</div>
          </div>
          <button onClick={() => setContactOpen(true)}
            className="bg-emerald-500 hover:bg-emerald-400 text-[#030d0e] px-5 py-2.5 rounded-xl font-bold text-sm flex-shrink-0">
            Bog&apos;lanish
          </button>
        </div>
      </div>
    </div>
  )
}
