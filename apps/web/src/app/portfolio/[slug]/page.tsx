'use client'
import { useState, use, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { MOCK_TARGETOLOGISTS, formatSpend, type PortfolioTargetologist } from '@/lib/portfolio-data'
import { agents as agentsApi } from '@/lib/api-client'
import { ShaderCanvas } from '@/components/ui/animated-glassy-pricing'
import {
  BarChart3, TrendingUp, Users, Shield, Zap, Target,
  Star, CheckCircle2, ArrowRight, ChevronDown, ExternalLink,
  DollarSign, Activity, Award, Clock, MapPin, MessageCircle
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
    avatarColor: a.avatarColor || 'from-[#7C3AED] to-[#5B21B6]',
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

/* ── Glassy Card ── */
function GlassCard({ children, className = '', hover = false }: { children: React.ReactNode; className?: string; hover?: boolean }) {
  return (
    <div className={`backdrop-blur-[14px] bg-gradient-to-br from-white/80 to-white/40 border border-white/30 rounded-2xl shadow-xl transition-all duration-300 ${hover ? 'hover:scale-[1.02] hover:shadow-2xl hover:border-cyan-300/30' : ''} ${className}`}>
      {children}
    </div>
  )
}

/* ── Stat Pill ── */
function StatPill({ icon: Icon, label, value, accent = false }: { icon: any; label: string; value: string; accent?: boolean }) {
  return (
    <GlassCard className="px-5 py-4 flex items-center gap-3">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${accent ? 'bg-cyan-400/20 text-cyan-600' : 'bg-surface-2/80 text-text-secondary'}`}>
        <Icon size={20} />
      </div>
      <div>
        <div className="text-[11px] uppercase tracking-wider text-text-tertiary font-medium">{label}</div>
        <div className="text-xl font-bold text-text-primary">{value}</div>
      </div>
    </GlassCard>
  )
}

/* ── ROAS Bar Chart ── */
function RoasChart({ data }: { data: { month: string; roas: number; spend: number }[] }) {
  const maxRoas = Math.max(...data.map(d => d.roas))
  return (
    <div className="space-y-3">
      {data.map(d => (
        <div key={d.month} className="flex items-center gap-3">
          <span className="text-text-tertiary text-xs w-8 flex-shrink-0 font-medium">{d.month}</span>
          <div className="flex-1 bg-surface-2/60 rounded-full h-7 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full flex items-center justify-end pr-3 transition-all duration-700"
              style={{ width: `${(d.roas / maxRoas) * 100}%` }}
            >
              <span className="text-white text-[11px] font-bold drop-shadow">{d.roas}x</span>
            </div>
          </div>
          <span className="text-text-tertiary text-xs w-16 text-right flex-shrink-0">{formatSpend(d.spend)}</span>
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
        <circle cx={50} cy={50} r={30} fill="white" fillOpacity={0.7} />
      </svg>
      <div className="space-y-2">
        {data.map(d => (
          <div key={d.platform} className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: d.color }} />
            <span className="text-text-tertiary text-xs">{d.platform}</span>
            <span className="text-text-primary text-xs font-bold ml-auto pl-4">{d.percent}%</span>
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
          <Star key={i} size={14} className={i < r.rating ? 'text-amber-400 fill-amber-400' : 'text-text-secondary'} />
        ))}
        {r.verified && (
          <span className="ml-2 text-[10px] text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
            <CheckCircle2 size={10} /> Tasdiqlangan
          </span>
        )}
      </div>
      <p className="text-text-secondary text-sm leading-relaxed italic mb-4">&ldquo;{r.text}&rdquo;</p>
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center text-xs font-bold text-text-secondary">
          {r.author.charAt(0)}
        </div>
        <div>
          <div className="text-text-primary text-sm font-semibold">{r.author}</div>
          <div className="text-text-tertiary text-xs">{r.company}</div>
        </div>
        <span className="ml-auto text-text-tertiary text-xs">{r.date}</span>
      </div>
    </GlassCard>
  )
}

/* ── PLATFORM FEATURES ── */
const PLATFORM_FEATURES = [
  { icon: BarChart3, title: 'Real-time Analytics', desc: 'Barcha ko\'rsatkichlar real vaqtda yangilanadi' },
  { icon: Shield, title: 'Tasdiqlangan Natijalar', desc: 'API orqali haqiqiy ad account ma\'lumotlari' },
  { icon: Target, title: 'AI Optimizatsiya', desc: 'AI kampaniyalarni avtomatik optimallashtiradi' },
  { icon: TrendingUp, title: 'ROAS Tracking', desc: 'Har bir kampaniyaning ROI si kuzatiladi' },
  { icon: Users, title: 'Marketplace', desc: 'Eng yaxshi mutaxassislarni toping va yollang' },
  { icon: Zap, title: 'Tezkor Natija', desc: 'O\'rtacha 2 hafta ichida birinchi natijalar' },
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
  const [activeSection, setActiveSection] = useState('hero')
  const statsRef = useRef<HTMLDivElement>(null)

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
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const t = loadedProfile
  if (!t) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center text-center px-6">
        <div>
          <div className="text-6xl mb-4">👤</div>
          <h2 className="text-2xl font-bold text-text-primary mb-2">Targetolog topilmadi</h2>
          <p className="text-text-tertiary mb-6">Bu profil mavjud emas yoki o&apos;chirilgan</p>
          <button onClick={() => router.push('/portfolio')} className="bg-surface text-white px-6 py-3 rounded-xl font-semibold hover:bg-surface transition-all">
            Katalogga qaytish
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white text-text-primary overflow-x-hidden">

      {/* ═══ ANIMATED BG ═══ */}
      <div className="fixed inset-0 z-0 opacity-30 pointer-events-none">
        <ShaderCanvas />
      </div>

      {/* ═══ STICKY NAV ═══ */}
      <nav className="sticky top-0 z-50 backdrop-blur-xl bg-white/70 border-b border-border/50">
        <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between">
          <button onClick={() => router.push('/portfolio')} className="flex items-center gap-2 text-text-tertiary hover:text-text-primary transition-colors text-sm font-medium">
            ← Katalog
          </button>
          <span className="text-lg font-extrabold tracking-tight">
            Performa <span className="bg-clip-text text-transparent bg-gradient-to-r from-cyan-500 to-blue-500">AI</span>
          </span>
          <div className="flex items-center gap-2">
            <button onClick={() => setContactOpen(true)}
              className="text-sm bg-gradient-to-r from-cyan-400 to-blue-500 text-white px-5 py-2 rounded-xl font-semibold shadow-lg shadow-cyan-400/20 hover:shadow-cyan-400/40 transition-all">
              Bog&apos;lanish
            </button>
            <button onClick={() => router.push('/login')}
              className="text-sm bg-surface text-white px-4 py-2 rounded-xl font-semibold hover:bg-surface transition-all">
              Kirish
            </button>
          </div>
        </div>
      </nav>

      {/* ═══ HERO SECTION ═══ */}
      <section className="relative z-10 pt-16 pb-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col lg:flex-row gap-10 items-start">

            {/* Left: Profile Info */}
            <div className="flex-1">
              <div className="flex items-center gap-5 mb-6">
                <div className={`w-24 h-24 rounded-3xl bg-gradient-to-br ${t.avatarColor} flex items-center justify-center text-3xl font-black text-white shadow-2xl`}>
                  {t.avatar}
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">{t.name}</h1>
                    {t.verified && (
                      <span className="inline-flex items-center gap-1 bg-emerald-50 border border-emerald-200 text-emerald-600 text-xs font-bold px-2.5 py-1 rounded-full">
                        <CheckCircle2 size={12} /> Tasdiqlangan
                      </span>
                    )}
                    {t.proMember && (
                      <span className="bg-gradient-to-r from-amber-100 to-amber-50 border border-amber-200 text-amber-700 text-xs font-bold px-2.5 py-1 rounded-full">⭐ PRO</span>
                    )}
                  </div>
                  <p className="text-text-tertiary text-base">{t.title}</p>
                  <div className="flex items-center gap-4 mt-2 text-xs text-text-tertiary">
                    <span className="flex items-center gap-1"><MapPin size={12} /> {t.location}</span>
                    <span className="flex items-center gap-1"><Clock size={12} /> {t.responseTime}</span>
                    <span className="flex items-center gap-1"><Star size={12} className="text-amber-400 fill-amber-400" /> {t.rating} ({t.reviewCount})</span>
                  </div>
                </div>
              </div>

              <p className="text-text-secondary text-base leading-relaxed max-w-2xl mb-6">{t.bio}</p>

              {/* Platform badges */}
              <div className="flex flex-wrap gap-2 mb-6">
                {t.platforms.map(p => (
                  <span key={p.id}
                    className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-xl bg-white/60 backdrop-blur border border-border/50 text-text-secondary font-medium shadow-sm">
                    {p.icon} {p.name}
                    {p.verified && <CheckCircle2 size={12} className="text-emerald-500" />}
                    <span className="text-text-tertiary">({p.accountsConnected})</span>
                  </span>
                ))}
              </div>

              {/* Niche tags */}
              <div className="flex flex-wrap gap-2">
                {t.niches.map(n => (
                  <span key={n} className="text-xs bg-cyan-50 text-cyan-700 border border-cyan-200 px-3 py-1.5 rounded-lg font-medium">
                    {n}
                  </span>
                ))}
              </div>
            </div>

            {/* Right: CTA Card */}
            <GlassCard className="w-full lg:w-72 p-6 flex-shrink-0">
              <div className="flex items-center gap-1 mb-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} size={16} className={i < Math.floor(t.rating) ? 'text-amber-400 fill-amber-400' : 'text-text-secondary'} />
                ))}
                <span className="text-text-primary font-bold ml-1">{t.rating}</span>
                <span className="text-text-tertiary text-xs">({t.reviewCount} sharh)</span>
              </div>

              <div className="text-text-tertiary text-xs mb-1 uppercase tracking-wider font-medium">Narxi</div>
              <div className="text-text-primary font-extrabold text-3xl mb-1">
                ${t.price.from}
                <span className="text-text-tertiary text-sm font-normal">/{t.price.unit}</span>
              </div>
              <div className="text-xs text-emerald-500 font-medium mb-5 flex items-center gap-1">
                <Activity size={12} /> Hozir faol — {t.stats.activeCampaigns} kampaniya
              </div>

              <button onClick={() => setContactOpen(true)}
                className="w-full bg-gradient-to-r from-cyan-400 to-blue-500 text-white text-sm font-bold py-3.5 rounded-xl shadow-lg shadow-cyan-400/25 hover:shadow-cyan-400/50 transition-all mb-3 flex items-center justify-center gap-2">
                <MessageCircle size={16} /> Bog&apos;lanish
              </button>
              <button onClick={() => router.push('/register')}
                className="w-full bg-surface-2 hover:bg-surface-2 text-text-secondary text-sm py-3 rounded-xl border border-border transition-all font-medium">
                Xizmat buyurtma berish
              </button>

              <div className="mt-5 pt-4 border-t border-border/50">
                <div className="text-[10px] uppercase tracking-widest text-text-tertiary font-medium mb-2">Performa kafolati</div>
                <div className="space-y-1.5 text-xs text-text-tertiary">
                  <div className="flex items-center gap-2"><Shield size={12} className="text-cyan-500" /> Pul qaytarish kafolati</div>
                  <div className="flex items-center gap-2"><CheckCircle2 size={12} className="text-cyan-500" /> Tasdiqlangan natijalar</div>
                  <div className="flex items-center gap-2"><Clock size={12} className="text-cyan-500" /> 24/7 qo&apos;llab-quvvatlash</div>
                </div>
              </div>
            </GlassCard>
          </div>
        </div>
      </section>

      {/* ═══ KEY METRICS ═══ */}
      <section ref={statsRef} className="relative z-10 py-16 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-extrabold tracking-tight mb-2">
              Natijalar <span className="bg-clip-text text-transparent bg-gradient-to-r from-cyan-500 to-blue-500">raqamlarda</span>
            </h2>
            <p className="text-text-tertiary text-sm">Barcha ma&apos;lumotlar haqiqiy ad account lardan olingan</p>
            <div className="flex items-center justify-center gap-2 mt-3">
              <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
              <span className="text-emerald-500 text-xs font-bold uppercase tracking-widest">Live tracking</span>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatPill icon={TrendingUp} label="O'rtacha ROAS" value={`${t.stats.avgROAS}x`} accent />
            <StatPill icon={DollarSign} label="Jami boshqarilgan" value={formatSpend(t.stats.totalSpendManaged)} />
            <StatPill icon={Target} label="O'rtacha CPA" value={`$${t.stats.avgCPA}`} />
            <StatPill icon={Award} label="Muvaffaqiyat" value={`${t.stats.successRate}%`} accent />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
            <StatPill icon={Activity} label="Faol kampaniyalar" value={`${t.stats.activeCampaigns}`} />
            <StatPill icon={BarChart3} label="O'rtacha CTR" value={`${t.stats.avgCTR}%`} />
            <StatPill icon={Zap} label="Eng yuqori ROAS" value={`${t.stats.bestROAS}x`} accent />
            <StatPill icon={Users} label="Jami kampaniyalar" value={`${t.stats.totalCampaigns}`} />
          </div>
        </div>
      </section>

      {/* ═══ PERFORMANCE CHARTS ═══ */}
      <section className="relative z-10 py-16 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* ROAS Chart */}
            <GlassCard className="lg:col-span-2 p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-bold text-lg">ROAS dinamikasi (6 oy)</h3>
                <span className="text-xs text-text-tertiary bg-surface-2 px-3 py-1 rounded-lg border border-border font-medium">Oylik</span>
              </div>
              <RoasChart data={t.monthlyPerformance} />
            </GlassCard>

            {/* Platform Split */}
            <GlassCard className="p-6">
              <h3 className="font-bold text-lg mb-6">Platform taqsimoti</h3>
              <PlatformDonut data={t.platformSplit} />
            </GlassCard>
          </div>
        </div>
      </section>

      {/* ═══ PLATFORM FEATURES ═══ */}
      <section className="relative z-10 py-16 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-extrabold tracking-tight mb-2">
              Performa <span className="bg-clip-text text-transparent bg-gradient-to-r from-cyan-500 to-blue-500">platformasi</span> imkoniyatlari
            </h2>
            <p className="text-text-tertiary text-sm max-w-lg mx-auto">
              Barcha natijalar tasdiqlangan — haqiqiy API ma&apos;lumotlari asosida
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {PLATFORM_FEATURES.map((f, i) => {
              const Icon = f.icon
              return (
                <GlassCard key={i} className="p-6" hover>
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-400/20 to-blue-500/20 flex items-center justify-center mb-4">
                    <Icon size={24} className="text-cyan-600" />
                  </div>
                  <h3 className="font-bold text-base mb-1">{f.title}</h3>
                  <p className="text-text-tertiary text-sm">{f.desc}</p>
                </GlassCard>
              )
            })}
          </div>
        </div>
      </section>

      {/* ═══ RECENT CAMPAIGNS ═══ */}
      {t.recentCampaigns.length > 0 && (
        <section className="relative z-10 py-16 px-6">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-10">
              <h2 className="text-3xl font-extrabold tracking-tight mb-2">So&apos;nggi kampaniyalar</h2>
              <p className="text-text-tertiary text-xs">Mijoz maxfiyligi uchun anonimlashtrilgan</p>
            </div>

            <GlassCard className="overflow-hidden">
              <div className="divide-y divide-border">
                {t.recentCampaigns.map(c => {
                  const statusColors: Record<string, string> = {
                    active: 'bg-emerald-50 text-emerald-600 border-emerald-200',
                    completed: 'bg-surface-2 text-text-tertiary border-border',
                    paused: 'bg-amber-50 text-amber-600 border-amber-200',
                  }
                  const statusLabels: Record<string, string> = { active: 'Faol', completed: 'Tugadi', paused: 'Pauza' }
                  return (
                    <div key={c.id} className="flex items-center gap-4 py-4 px-6 hover:bg-white/60 transition-colors">
                      <span className="text-xl flex-shrink-0">{PLATFORM_META[c.platform]?.icon ?? '📊'}</span>
                      <div className="flex-1 min-w-0">
                        <div className="text-text-primary text-sm font-semibold truncate">{c.niche}</div>
                        <div className="text-text-tertiary text-xs">{c.duration}</div>
                      </div>
                      <div className="text-right hidden sm:block">
                        <div className="text-text-primary text-sm font-bold">{c.roas}x <span className="text-text-tertiary font-normal">ROAS</span></div>
                        <div className="text-text-tertiary text-xs">${c.spend.toLocaleString()}</div>
                      </div>
                      <div className="text-right hidden md:block">
                        <div className="text-text-primary text-sm font-medium">${c.cpa}</div>
                        <div className="text-text-tertiary text-xs">CPA</div>
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
        <section className="relative z-10 py-16 px-6">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-10">
              <h2 className="text-3xl font-extrabold tracking-tight mb-2">
                Mijozlar <span className="bg-clip-text text-transparent bg-gradient-to-r from-cyan-500 to-blue-500">fikri</span>
              </h2>
              <div className="flex items-center justify-center gap-2 mt-3">
                <div className="flex gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} size={18} className={i < Math.floor(t.rating) ? 'text-amber-400 fill-amber-400' : 'text-text-secondary'} />
                  ))}
                </div>
                <span className="text-text-primary font-bold text-lg">{t.rating}</span>
                <span className="text-text-tertiary text-sm">({t.reviewCount} sharh)</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {t.reviews.map(r => <ReviewCard key={r.id} r={r} />)}
            </div>
          </div>
        </section>
      )}

      {/* ═══ CTA SECTION ═══ */}
      <section className="relative z-10 py-20 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <GlassCard className="px-10 py-14">
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-4">
              Reklamangizni <span className="bg-clip-text text-transparent bg-gradient-to-r from-cyan-500 to-blue-500">professional</span>ga ishoning
            </h2>
            <p className="text-text-tertiary text-base mb-8 max-w-lg mx-auto">
              {t.name} bilan hamkorlik qiling va reklama byudjetingizdan maksimal natija oling. Performa platformasi orqali barcha natijalar kafolatlanadi.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button onClick={() => setContactOpen(true)}
                className="bg-gradient-to-r from-cyan-400 to-blue-500 text-white px-8 py-3.5 rounded-xl font-bold shadow-lg shadow-cyan-400/25 hover:shadow-cyan-400/50 transition-all flex items-center justify-center gap-2">
                Hozir boshlash <ArrowRight size={16} />
              </button>
              <button onClick={() => router.push('/portfolio')}
                className="bg-white border border-border text-text-secondary px-8 py-3.5 rounded-xl font-medium hover:bg-surface-2 transition-all">
                Boshqa mutaxassislar
              </button>
            </div>
          </GlassCard>
        </div>
      </section>

      {/* ═══ FOOTER ═══ */}
      <footer className="relative z-10 border-t border-gray-100 py-8 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-text-tertiary">
          <span className="font-bold text-text-primary">Performa <span className="bg-clip-text text-transparent bg-gradient-to-r from-cyan-500 to-blue-500">AI</span></span>
          <span>Barcha natijalar haqiqiy API ma&apos;lumotlari asosida tasdiqlangan</span>
          <div className="flex items-center gap-4">
            <button onClick={() => router.push('/terms')} className="hover:text-text-primary transition-colors">Shartlar</button>
            <button onClick={() => router.push('/privacy')} className="hover:text-text-primary transition-colors">Maxfiylik</button>
          </div>
        </div>
      </footer>

      {/* ═══ CONTACT MODAL ═══ */}
      {contactOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <GlassCard className="p-8 w-full max-w-md bg-white/90">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold text-xl">{t.name} bilan bog&apos;lanish</h3>
              <button onClick={() => setContactOpen(false)} className="text-text-tertiary hover:text-text-primary text-xl transition-colors">✕</button>
            </div>
            <p className="text-text-tertiary text-sm mb-6">
              Xabar yuborish uchun platformaga kiring yoki ro&apos;yxatdan o&apos;ting. Performa sizning xavfsizligingizni kafolatlaydi.
            </p>
            <div className="space-y-3">
              <button onClick={() => router.push('/login')}
                className="w-full bg-gradient-to-r from-cyan-400 to-blue-500 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-cyan-400/20 transition-all flex items-center justify-center gap-2">
                <MessageCircle size={16} /> Kirish va xabar yuborish
              </button>
              <button onClick={() => router.push('/register')}
                className="w-full bg-surface-2 hover:bg-surface-2 text-text-secondary py-3 rounded-xl border border-border transition-all font-medium">
                Ro&apos;yxatdan o&apos;tish — bepul
              </button>
            </div>
            <div className="mt-5 pt-4 border-t border-gray-100 flex items-center justify-center gap-4 text-xs text-text-tertiary">
              <span className="flex items-center gap-1"><Shield size={12} /> Xavfsiz</span>
              <span className="flex items-center gap-1"><CheckCircle2 size={12} /> Kafolatli</span>
              <span className="flex items-center gap-1"><Clock size={12} /> 24/7</span>
            </div>
          </GlassCard>
        </div>
      )}

      {/* ═══ FLOATING MOBILE CTA ═══ */}
      <div className="fixed bottom-0 left-0 right-0 z-40 lg:hidden backdrop-blur-xl bg-white/80 border-t border-border/50 px-4 py-3">
        <div className="flex items-center gap-3 max-w-lg mx-auto">
          <div className="flex-1 min-w-0">
            <div className="font-bold text-sm truncate">{t.name}</div>
            <div className="text-xs text-text-tertiary">${t.price.from}/{t.price.unit}</div>
          </div>
          <button onClick={() => setContactOpen(true)}
            className="bg-gradient-to-r from-cyan-400 to-blue-500 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-lg shadow-cyan-400/20 flex-shrink-0">
            Bog&apos;lanish
          </button>
        </div>
      </div>
    </div>
  )
}
