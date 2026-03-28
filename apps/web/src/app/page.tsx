'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

/* ─── tiny helpers ─────────────────────────────────────────────────────── */
function cn(...classes: (string | false | undefined)[]) {
  return classes.filter(Boolean).join(' ')
}

/* ─── data ──────────────────────────────────────────────────────────────── */
const STATS = [
  { value: '3.2×', label: 'O\'rtacha ROAS o\'sishi' },
  { value: '−42%', label: 'CPA kamaytirish' },
  { value: '24/7', label: 'Avtomatik monitoring' },
  { value: '4 min', label: 'Kampaniya yaratish vaqti' },
]

const PLATFORMS = [
  { name: 'Meta Ads', icon: '📘', color: '#1877F2', desc: 'Facebook · Instagram · Reels' },
  { name: 'Google Ads', icon: '🔍', color: '#4285F4', desc: 'Search · Display · YouTube' },
  { name: 'Yandex Direct', icon: '🟡', color: '#FFCC00', desc: 'Search · RSY · Smart Banner' },
  { name: 'Telegram Ads', icon: '✈️', color: '#2CA5E0', desc: 'Sponsored · Channel Boost' },
]

const STEPS = [
  {
    num: '01',
    title: 'Mahsulotingizni kiriting',
    desc: 'Mahsulot nomi, URL va maqsad auditoriyangizni tasvirlab bering. AI qolganini o\'zi tahlil qiladi.',
    icon: '🛍️',
  },
  {
    num: '02',
    title: 'AI kampaniya yaratadi',
    desc: 'Kalit so\'zlar, targetlar, ijodiy matnlar, UTM parametrlar — barchasini AI 4 daqiqada tayyorlaydi.',
    icon: '🤖',
  },
  {
    num: '03',
    title: 'Tasdiqlang va kuzating',
    desc: 'Siz faqat oxirgi qaror qabul qilasiz. AI esa 24/7 optimallashtiradi, hisobot beradi.',
    icon: '✅',
  },
]

const FEATURES = [
  { icon: '🧠', title: 'Avtonom AI Agent', desc: 'Bid, byudjet, ijodiy kontent va auditoriyani o\'zi boshqaradi. Har 2 soatda optimallashtirish.' },
  { icon: '⚡', title: '4 daqiqada tayyor', desc: 'Platforma tanlashdan nashr qilishgacha — to\'liq 6 bosqichli wizard. Hech qanday texnik bilim kerak emas.' },
  { icon: '🎯', title: 'Multi-platform', desc: 'Meta, Google, Yandex, Telegram — bir joydan boshqaring. Har bir platforma uchun alohida strategiya.' },
  { icon: '📊', title: 'Real-time hisobot', desc: 'Barcha platformalar bo\'yicha birlashtirilgan dashboard. ROAS, CPA, CTR — bir ko\'rinishda.' },
  { icon: '🔁', title: 'Kreativ rotatsiya', desc: 'Past ko\'rsatkichli reklamalar avtomatik almashtiriladi. A/B test — doim ishlaydi.' },
  { icon: '🛡️', title: 'Byudjet himoyasi', desc: 'Anomaliya aniqlash: g\'ayritabiiy sarflanish, bot trafik — avtomatik to\'xtatiladi.' },
  { icon: '📍', title: 'Geo & Vaqt targeting', desc: 'Shahar, radius, soat jadval, ob-havo — bid korreksiyalar 7 tur bo\'yicha.' },
  { icon: '💬', title: 'AI Maslahatchisi', desc: 'Istalgan vaqt chatga savol bering. AI kampaniyangiz tarixini biladi va maslahat beradi.' },
]

const PLANS = [
  {
    name: 'Starter',
    price: '49',
    currency: 'USD',
    period: 'oyiga',
    desc: 'Kichik biznes va freylanschilar uchun',
    highlight: false,
    features: [
      '2 ta platforma',
      '3 ta faol kampaniya',
      'AI kreativ generatsiya',
      'Kunlik hisobot',
      'Email qo\'llab-quvvatlash',
    ],
    cta: 'Boshlash',
  },
  {
    name: 'Growth',
    price: '149',
    currency: 'USD',
    period: 'oyiga',
    desc: 'O\'sib borayotgan e-commerce uchun',
    highlight: true,
    badge: 'Eng mashhur',
    features: [
      'Barcha 4 ta platforma',
      'Cheklanmagan kampaniyalar',
      'Avtonom AI rejimi',
      'Real-time dashboard',
      'A/B test avtomatik',
      'Priority qo\'llab-quvvatlash',
      'API kirish',
    ],
    cta: 'Growth boshlash →',
  },
  {
    name: 'Agency',
    price: '399',
    currency: 'USD',
    period: 'oyiga',
    desc: 'Agentliklar va katta brendlar uchun',
    highlight: false,
    features: [
      'Cheklanmagan hamma narsa',
      'White-label dashboard',
      'Dedicated AI model',
      'Custom integratsiyalar',
      'SLA kafolat',
      'Shaxsiy menejer',
      'Onboarding training',
    ],
    cta: 'Bog\'lanish',
  },
]

const TESTIMONIALS = [
  {
    text: '"Nishon AI targetologimizni almashtirdi. Birinchi oyda ROAS 2.8x o\'sdi, biz esa kampaniyaga bir soat ham sarflamadik."',
    name: 'Jasur Toshmatov',
    role: 'CEO, TechShop Uzbekistan',
    avatar: 'JT',
  },
  {
    text: '"Google va Meta kampaniyalarini bir joydan boshqarish — bu hayot o\'zgartirdi. Har oy 40+ soat tejayapman."',
    name: 'Nilufar Karimova',
    role: 'Marketing Director, Moda.uz',
    avatar: 'NK',
  },
  {
    text: '"CPA 38% kamaydi. AI har kecha byudjetni qayta taqsimlaydi — ertalab faqat natijalarni ko\'raman."',
    name: 'Bobur Eshmatov',
    role: 'Founder, AutoParts24',
    avatar: 'BE',
  },
]

const FAQS = [
  {
    q: 'AI kampaniyani to\'liq o\'zi boshqaradimi?',
    a: 'Ha, avtonom rejimda AI bid, byudjet, kreativ rotatsiya va auditoriyani o\'zi boshqaradi. Siz faqat nashr qilishdan oldin tasdiqlaysiz.'
  },
  {
    q: 'Qanday platformalar qo\'llab-quvvatlanadi?',
    a: 'Meta Ads (Facebook/Instagram), Google Ads, Yandex Direct va Telegram Ads. Barcha 4 ta platforma bir dashboarddan.'
  },
  {
    q: 'Mavjud kampaniyalarni ko\'chirish mumkinmi?',
    a: 'Ha, import funksiyasi bor. Meta va Google\'dan mavjud kampaniyalarni import qilib, AI bilan optimallashtirishni davom ettirasiz.'
  },
  {
    q: 'Byudjet minimal nechadan?',
    a: 'Minimal platforma byudjeti yo\'q — siz belgilagan summa bilan ishlaydi. Nishon AI o\'z narxi oylik obuna.'
  },
  {
    q: 'AI noto\'g\'ri qaror qilsa-chi?',
    a: 'Har bir katta o\'zgarish (byudjet +20% dan ko\'p) siz tasdiqlashingizni kutadi. Byudjet himoyasi anomaliyalarni avtomatik to\'xtatadi.'
  },
]

/* ─── FAQ item ──────────────────────────────────────────────────────────── */
function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border-b border-[#E5E7EB]">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between py-5 text-left"
      >
        <span className="text-[#111827] font-medium">{q}</span>
        <span className={cn('text-[#374151] text-xl transition-transform', open && 'rotate-45')}>+</span>
      </button>
      {open && (
        <p className="text-[#9CA3AF] text-sm leading-relaxed pb-5">{a}</p>
      )}
    </div>
  )
}

/* ─── main ──────────────────────────────────────────────────────────────── */
export default function SellerLandingPage() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-[#F9FAFB] text-[#111827] selection:bg-[#111827]/30">

      {/* ── NAV ─────────────────────────────────────────────────────────── */}
      <nav className="fixed top-0 inset-x-0 z-50 border-b border-[#E5E7EB]/80 bg-[#F9FAFB]/80 backdrop-blur-lg">
        <div className="max-w-7xl mx-auto px-6 h-18 flex items-center justify-between py-4">
          <div className="flex items-center gap-2">
            <span className="text-2xl font-extrabold tracking-tight">
              Nishon <span className="text-[#374151]">AI</span>
            </span>
            <span className="hidden md:inline-flex ml-3 text-xs font-semibold text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 px-2 py-0.5 rounded-full">
              BETA
            </span>
          </div>

          <div className="hidden md:flex items-center gap-8 text-sm text-[#9CA3AF]">
            <a href="#features" className="hover:text-[#111827] transition-colors">Imkoniyatlar</a>
            <a href="#how" className="hover:text-[#111827] transition-colors">Qanday ishlaydi</a>
            <a href="#pricing" className="hover:text-[#111827] transition-colors">Narxlar</a>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/login')}
              className="hidden sm:block text-sm text-[#9CA3AF] hover:text-[#111827] transition-colors px-4 py-2"
            >
              Kirish
            </button>
            <button
              onClick={() => router.push('/register')}
              className="bg-[#111827] hover:bg-[#1F2937] text-white text-sm font-semibold px-5 py-2.5 rounded-lg shadow-[0_4px_14px_rgba(124,58,237,0.4)] hover:shadow-[0_6px_20px_rgba(124,58,237,0.5)] transition-all"
            >
              Bepul boshlash →
            </button>
          </div>
        </div>
      </nav>

      {/* ── HERO ────────────────────────────────────────────────────────── */}
      <section className="relative pt-36 pb-28 px-6 overflow-hidden">
        {/* bg glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[500px] bg-[#F3F4F6] blur-[140px] rounded-full pointer-events-none" />
        <div className="absolute top-32 left-1/4 w-64 h-64 bg-[#A855F7]/8 blur-[100px] rounded-full pointer-events-none" />

        <div className="relative max-w-5xl mx-auto text-center">
          {/* pill badge */}
          <div className="inline-flex items-center gap-2 bg-[#F3F4F6] border border-[#111827]/25 rounded-full px-5 py-2 mb-8">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[#374151] text-sm font-semibold tracking-widest uppercase">
              AI Autonomous Mode · ACTIVE
            </span>
          </div>

          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight leading-[1.08] mb-6">
            Reklamangizni boshqaring.
            <br />
            <span className="bg-gradient-to-r from-[#7C3AED] via-[#A78BFA] to-[#C084FC] bg-clip-text text-transparent">
              Natijangiz o'ssin.
            </span>
          </h1>

          <p className="text-[#9CA3AF] text-xl md:text-2xl max-w-3xl mx-auto leading-relaxed mb-10">
            Nishon AI — Meta, Google, Yandex va Telegram reklamalarini <strong className="text-[#111827]">avtomatik</strong> boshqaradigan
            sun'iy intellekt. Targetolog kerak emas.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <button
              onClick={() => router.push('/register')}
              className="w-full sm:w-auto bg-[#111827] hover:bg-[#1F2937] text-white text-lg font-semibold px-10 py-4 rounded-xl shadow-[0_0_30px_rgba(124,58,237,0.4)] hover:shadow-[0_0_45px_rgba(124,58,237,0.6)] transition-all duration-300"
            >
              Bepul sinash — 14 kun →
            </button>
            <button
              onClick={() => router.push('/login')}
              className="w-full sm:w-auto bg-[#F9FAFB] hover:bg-[#F3F4F6] text-[#111827] text-lg font-semibold px-10 py-4 rounded-xl border border-[#E5E7EB] hover:border-[#D1D5DB] transition-all"
            >
              Demo ko'rish
            </button>
          </div>

          {/* trust line */}
          <p className="text-[#6B7280] text-sm">
            Kredit karta talab qilinmaydi · O'rnatish kerak emas · 4 daqiqada ishga tushadi
          </p>
        </div>

        {/* ── STATS BAR ───────────────────────────────────────────────── */}
        <div className="relative max-w-4xl mx-auto mt-20 grid grid-cols-2 md:grid-cols-4 gap-px bg-[#F3F4F6] rounded-2xl overflow-hidden border border-[#E5E7EB]">
          {STATS.map((s) => (
            <div key={s.label} className="bg-white px-6 py-6 text-center">
              <div className="text-3xl md:text-4xl font-extrabold text-[#111827] mb-1">{s.value}</div>
              <div className="text-[#6B7280] text-sm leading-snug">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── PLATFORMS ───────────────────────────────────────────────────── */}
      <section className="py-20 px-6 border-y border-[#E5E7EB]">
        <div className="max-w-5xl mx-auto">
          <p className="text-center text-[#6B7280] text-sm font-semibold uppercase tracking-widest mb-10">
            Qo'llab-quvvatlanadigan platformalar
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {PLATFORMS.map((p) => (
              <div
                key={p.name}
                className="bg-white border border-[#E5E7EB] hover:border-[#D1D5DB] rounded-xl p-5 text-center transition-all duration-300 group"
              >
                <div className="text-4xl mb-3">{p.icon}</div>
                <div className="text-[#111827] font-semibold text-sm mb-1">{p.name}</div>
                <div className="text-[#6B7280] text-xs">{p.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ────────────────────────────────────────────────── */}
      <section id="how" className="py-28 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-[#374151] text-sm font-bold uppercase tracking-widest mb-3">Qanday ishlaydi</p>
            <h2 className="text-4xl md:text-5xl font-extrabold text-[#111827]">
              3 qadam — kampaniya tayyor
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {STEPS.map((step, i) => (
              <div key={step.num} className="relative">
                {i < STEPS.length - 1 && (
                  <div className="hidden md:block absolute top-8 left-full w-full h-px bg-gradient-to-r from-[#7C3AED]/40 to-transparent -translate-x-1/2 z-0" />
                )}
                <div className="relative bg-white border border-[#E5E7EB] hover:border-[#D1D5DB] rounded-2xl p-7 transition-all duration-300">
                  <div className="flex items-center gap-3 mb-5">
                    <span className="text-3xl">{step.icon}</span>
                    <span className="text-[#374151] text-xs font-black uppercase tracking-widest">{step.num}</span>
                  </div>
                  <h3 className="text-[#111827] font-bold text-lg mb-3">{step.title}</h3>
                  <p className="text-[#9CA3AF] text-sm leading-relaxed">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ────────────────────────────────────────────────────── */}
      <section id="features" className="py-28 px-6 bg-[#F9FAFB]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-[#374151] text-sm font-bold uppercase tracking-widest mb-3">Imkoniyatlar</p>
            <h2 className="text-4xl md:text-5xl font-extrabold text-[#111827]">
              Reklamani boshqarishning <br className="hidden md:block" />
              <span className="text-[#374151]">yangi darajasi</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="bg-white border border-[#E5E7EB] hover:border-[#D1D5DB] rounded-2xl p-6 transition-all duration-300 group hover:bg-[#16162A]"
              >
                <div className="text-3xl mb-4">{f.icon}</div>
                <h3 className="text-[#111827] font-semibold mb-2">{f.title}</h3>
                <p className="text-[#6B7280] text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRICING ─────────────────────────────────────────────────────── */}
      <section id="pricing" className="py-28 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-[#374151] text-sm font-bold uppercase tracking-widest mb-3">Narxlar</p>
            <h2 className="text-4xl md:text-5xl font-extrabold text-[#111827]">
              Biznesingizga mos tarif
            </h2>
            <p className="text-[#9CA3AF] mt-4">14 kunlik bepul sinash. Keyin to'laysiz.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {PLANS.map((plan) => (
              <div
                key={plan.name}
                className={cn(
                  'relative rounded-2xl p-7 border transition-all duration-300',
                  plan.highlight
                    ? 'bg-gradient-to-b from-[#1C1028] to-[#13131A] border-[#111827]/50 shadow-[0_0_40px_rgba(124,58,237,0.2)]'
                    : 'bg-white border-[#E5E7EB] hover:border-[#D1D5DB]'
                )}
              >
                {plan.badge && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-[#111827] text-white text-xs font-bold px-4 py-1 rounded-full">
                    {plan.badge}
                  </div>
                )}

                <div className="mb-6">
                  <h3 className="text-[#111827] font-bold text-xl mb-1">{plan.name}</h3>
                  <p className="text-[#6B7280] text-sm mb-4">{plan.desc}</p>
                  <div className="flex items-end gap-1">
                    <span className="text-[#111827] font-extrabold text-4xl">${plan.price}</span>
                    <span className="text-[#6B7280] text-sm mb-1">/{plan.period}</span>
                  </div>
                </div>

                <ul className="space-y-3 mb-8">
                  {plan.features.map((feat) => (
                    <li key={feat} className="flex items-center gap-3 text-sm">
                      <span className="text-emerald-400 font-bold">✓</span>
                      <span className="text-[#374151]">{feat}</span>
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => router.push('/register')}
                  className={cn(
                    'w-full py-3 rounded-xl font-semibold text-sm transition-all',
                    plan.highlight
                      ? 'bg-[#111827] hover:bg-[#1F2937] text-white shadow-[0_4px_14px_rgba(124,58,237,0.4)]'
                      : 'bg-[#F9FAFB] hover:bg-[#F3F4F6] text-[#111827] border border-[#E5E7EB]'
                  )}
                >
                  {plan.cta}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ────────────────────────────────────────────────── */}
      <section className="py-28 px-6 bg-[#F9FAFB]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-[#374151] text-sm font-bold uppercase tracking-widest mb-3">Mijozlar fikri</p>
            <h2 className="text-4xl md:text-5xl font-extrabold text-[#111827]">
              Ular allaqachon o'sishmoqda
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t) => (
              <div
                key={t.name}
                className="bg-white border border-[#E5E7EB] rounded-2xl p-7 hover:border-[#D1D5DB] transition-all duration-300"
              >
                {/* stars */}
                <div className="flex gap-1 mb-5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <span key={i} className="text-yellow-400 text-sm">★</span>
                  ))}
                </div>
                <p className="text-[#374151] text-sm leading-relaxed italic mb-6">{t.text}</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#7C3AED] to-[#5B21B6] flex items-center justify-center text-xs font-black text-[#111827]">
                    {t.avatar}
                  </div>
                  <div>
                    <div className="text-[#111827] font-semibold text-sm">{t.name}</div>
                    <div className="text-[#6B7280] text-xs">{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ─────────────────────────────────────────────────────────── */}
      <section className="py-28 px-6">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-[#374151] text-sm font-bold uppercase tracking-widest mb-3">Savollar</p>
            <h2 className="text-4xl font-extrabold text-[#111827]">Ko'p so'raladigan savollar</h2>
          </div>
          <div className="space-y-0">
            {FAQS.map((faq) => (
              <FaqItem key={faq.q} q={faq.q} a={faq.a} />
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA BANNER ──────────────────────────────────────────────────── */}
      <section className="py-28 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#1C1028] via-[#16162A] to-[#0D0D14] border border-[#D1D5DB] p-12 md:p-16 text-center">
            {/* glow */}
            <div className="absolute inset-0 bg-[#111827]/5 blur-[80px] rounded-full" />
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#A855F7]/10 blur-[120px] rounded-full" />

            <div className="relative">
              <div className="text-5xl mb-6">🚀</div>
              <h2 className="text-4xl md:text-5xl font-extrabold text-[#111827] mb-5">
                Bugun boshlang.
                <br />
                <span className="text-[#374151]">14 kun bepul.</span>
              </h2>
              <p className="text-[#9CA3AF] text-lg mb-10 max-w-xl mx-auto">
                4 daqiqada kampaniyangizni yarating. Kredit karta talab qilinmaydi.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <button
                  onClick={() => router.push('/register')}
                  className="w-full sm:w-auto bg-[#111827] hover:bg-[#1F2937] text-white text-lg font-bold px-12 py-4 rounded-xl shadow-[0_0_40px_rgba(124,58,237,0.4)] hover:shadow-[0_0_60px_rgba(124,58,237,0.6)] transition-all duration-300"
                >
                  Bepul sinash →
                </button>
                <button
                  onClick={() => router.push('/login')}
                  className="w-full sm:w-auto text-[#374151] hover:text-[#111827] text-base font-semibold px-8 py-4 rounded-xl border border-[#D1D5DB] hover:border-[#111827]/60 transition-all"
                >
                  Demo ko'rish
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ──────────────────────────────────────────────────────── */}
      <footer className="border-t border-[#E5E7EB] py-12 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <span className="text-xl font-extrabold">
              Nishon <span className="text-[#374151]">AI</span>
            </span>
            <span className="text-[#6B7280] text-sm ml-2">© 2025</span>
          </div>

          <div className="flex items-center gap-6 text-sm text-[#6B7280]">
            <a href="/privacy" className="hover:text-[#111827] transition-colors">Maxfiylik siyosati</a>
            <a href="/terms" className="hover:text-[#111827] transition-colors">Foydalanish shartlari</a>
            <a href="mailto:hello@nishon.ai" className="hover:text-[#111827] transition-colors">Aloqa</a>
          </div>

          <div className="flex items-center gap-3">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[#6B7280] text-sm">Barcha tizimlar ishlayapti</span>
          </div>
        </div>
      </footer>

    </div>
  )
}
