'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useI18n } from '@/i18n/use-i18n'

const ticker = ['Summit 26 · Stockholm', 'Wednesday April 15, 2026', 'Request Your Ticket Now']

const capabilities = [
  {
    title: 'Campaign Management',
    desc: 'Kampaniyani yaratish, auditoriya segmentatsiyasi, budget pacing va publishingni bitta panelda boshqaring.',
    bullets: ['1-click launch', 'Smart budget split', 'Audience layering'],
  },
  {
    title: 'Creative Management',
    desc: 'AI copy, banner variantlar, approval jarayoni va A/B testlar bir joyda, jamoa bilan real-time hamkorlikda.',
    bullets: ['AI ad copy', 'Creative approval flow', 'Auto A/B rotation'],
  },
  {
    title: 'Reporting & Analytics',
    desc: 'ROAS, CPA, CTR, CAC, LTV kabi KPIlarni live kuzating va kampaniya darajasida chuqur breakdown oling.',
    bullets: ['Unified dashboard', 'Hourly anomaly alerts', 'Attribution snapshots'],
  },
  {
    title: 'Finance & Control',
    desc: 'Byudjet limitlari, spend guardrail, access control va workflow approval bilan xavfsiz o‘sishni ta’minlang.',
    bullets: ['Budget guardrails', 'Role-based permissions', 'Approval gates'],
  },
]

const stats = [
  { value: '60%', text: 'sales vaqtini admin ishlar yeb yuboradi' },
  { value: '43%', text: 'reklamachilar yomon UX sabab drop qiladi' },
  { value: '50%', text: 'global ad spend Big Techga ketadi' },
]

const suites = [
  'Publisher Suite',
  'Advertiser Suite',
  'Solution Services',
  'For Developers',
]

const reviews = [
  {
    quote:
      '“Performa bilan launch muddati haftalardan kunlarga tushdi. Sotuv jamoamiz kampaniya setup o‘rniga strategiyaga vaqt ajratmoqda.”',
    name: 'Dilshod R.',
    role: 'Head of Growth, Retail Group',
  },
  {
    quote:
      '“Biz 4 ta platformani alohida boshqarardik. Endi barchasi bir panelda, har tong actionable insight olamiz.”',
    name: 'Saida K.',
    role: 'Marketing Director, Auto Brand',
  },
  {
    quote:
      '“Approval, finance va analytics bir tizimga tushgani uchun agentlik-client ishlashi ancha tezlashdi.”',
    name: 'Akmal T.',
    role: 'COO, Digital Agency',
  },
]

const funnelStages = [
  {
    name: 'Acquisition Prospecting',
    pct: 60,
    audience: "Brendingizni hali bilmaydigan yangi auditoriya",
    tactic: 'Keng target + creative test + broad/lookalike sinovlari',
    color: 'from-cyan-300 to-cyan-500',
  },
  {
    name: 'Acquisition Re-Engagement',
    pct: 20,
    audience: "Kontentga tegilgan, lekin saytga kirmagan auditoriya",
    tactic: 'Engager/Video viewers retarget va click-driving creatives',
    color: 'from-pink-400 to-pink-500',
  },
  {
    name: 'Retargeting',
    pct: 15,
    audience: 'Saytga kirgan, lekin xarid qilmagan issiq auditoriya',
    tactic: 'Pixel event asosida DPA/offer reminder va urgency xabarlari',
    color: 'from-blue-400 to-blue-500',
  },
  {
    name: 'Retention',
    pct: 5,
    audience: 'Oldin xarid qilgan mavjud mijozlar',
    tactic: 'Cross-sell, upsell, qayta xarid triggerlari va LTV optimizatsiya',
    color: 'from-indigo-300 to-indigo-500',
  },
]

const funnelMetrics = [
  {
    stage: 'Prospecting',
    spendShare: '58.4%',
    roas: '4.9',
    cpa: '$22.8',
    ctr: '0.92%',
    trend: '+12%',
  },
  {
    stage: 'Re-Engagement',
    spendShare: '18.9%',
    roas: '6.1',
    cpa: '$17.3',
    ctr: '1.18%',
    trend: '+8%',
  },
  {
    stage: 'Retargeting',
    spendShare: '16.2%',
    roas: '8.4',
    cpa: '$12.1',
    ctr: '1.44%',
    trend: '+15%',
  },
  {
    stage: 'Retention',
    spendShare: '6.5%',
    roas: '10.7',
    cpa: '$9.2',
    ctr: '1.91%',
    trend: '+6%',
  },
]

const workspaceTabs = [
  {
    tab: 'Ad accounts',
    points: [
      'Meta/Google akkauntlarini ulash yoki uzish',
      'Reconnect (reauthenticate) va status nazorati',
      'Page, Pixel va default audience exclusion sozlamalari',
    ],
  },
  {
    tab: 'Products & Usage',
    points: [
      'Obuna paketi va usage limitini kuzatish',
      'Add-on larni yoqish/o‘chirish',
      'Plan o‘zgartirish va ad account bundle boshqaruvi',
    ],
  },
  {
    tab: 'Payments',
    points: [
      'Billing history va invoice yuklab olish',
      'Bir nechta payment method ulash',
      'Billing information (kompaniya rekvizitlari) tahrirlash',
    ],
  },
  {
    tab: 'User Profile',
    points: [
      'User ID, email va telefonni ko‘rish',
      'Aloqa ma’lumotlarini yangilash',
      'Team access uchun profil boshqaruvi',
    ],
  },
  {
    tab: 'Team Members',
    points: [
      'Jamoa a’zolarini taklif qilish',
      'Workspace bo‘yicha role va ruxsatlarni taqsimlash',
      'Agentlik uchun bir nechta workspace ochish',
    ],
  },
]

const launchFlow = [
  {
    step: '1. Create New Ad',
    what: 'Creatives menyusidan Ad Launcher → Create New Ad',
    details: [
      'Identity, format, page va ad copy bir oynada sozlanadi',
      'Ad preview real-time ko‘rinadi',
      'Save qilib keyingi audience bosqichiga o‘tiladi',
    ],
  },
  {
    step: '2. Audience Launcher',
    what: 'ARR bosqichlari bo‘yicha audience preset tanlash',
    details: [
      'Acquisition / Re-Engagement / Retargeting / Retention filterlari',
      'Bir vaqtning o‘zida bir nechta audience tanlab launch qilish',
      'Audience kesimida ad biriktirish va save changes',
    ],
  },
  {
    step: '3. Campaign Setup',
    what: 'Campaign objective, budget type, naming structure',
    details: [
      'Split by funnel stage yoki single campaign tanlovi',
      'ABO/CBO tanlash (default tavsiya: ABO)',
      'Location, age, gender, device va placementlarni audience kesimida sozlash',
    ],
  },
  {
    step: '4. Summary & Launch',
    what: 'Final tekshiruv va nashr',
    details: [
      'Launch time: now / midnight / schedule',
      'Ad set naming template va yakuniy review',
      'Launch bosilgach kampaniyalar Meta’ga yuboriladi',
    ],
  },
]

const teamFlow = [
  'Workspace yaratish (onboarding yoki workspace switcher orqali)',
  'Invite Team Member modalida email(lar) kiritish (ko‘p email uchun Enter)',
  'Pending invite holatini kuzatish va kerak bo‘lsa invitation link nusxalash',
  'Qabul qilingandan keyin ad account access (checkbox + Add Now) berish',
  '3-dot menyudan rolni yangilash: Advertiser → Admin',
  'Zarur bo‘lsa workspace removal jarayoni (active subscription bo‘lsa schedule)',
]

const permissionMatrix = [
  {
    role: 'Owner',
    rights: [
      'Workspace va subscription ustidan to‘liq nazorat',
      'Ad account ulash/uzish, billing va team management',
      'Admin/Advertiser rollarni tayinlash va workspace o‘chirish',
    ],
  },
  {
    role: 'Admin',
    rights: [
      'Ownerga yaqin operatsion huquqlar (team, billing docs, settings)',
      'Owner subscriptioniga ulangan akkauntlar doirasida ishlaydi',
      'Strategik/operatsion boshqaruvda ownerga yordam beradi',
    ],
  },
  {
    role: 'Advertiser',
    rights: [
      'Faqat tayinlangan ad accountlarga kirish',
      'O‘z subscriptioni shart emas (owner planidan foydalanadi)',
      'Kampaniya boshqaruvi bor, lekin workspace-level boshqaruv cheklangan',
    ],
  },
]

function CapabilityCard({
  title,
  desc,
  bullets,
}: {
  title: string
  desc: string
  bullets: string[]
}) {
  const [open, setOpen] = useState(false)

  return (
    <article className="rounded-3xl border border-white/10 bg-surface-elevated/[0.03] p-6 backdrop-blur-sm transition hover:border-emerald-400/40 hover:bg-surface-elevated/[0.06]">
      <h3 className="text-2xl font-semibold text-white">{title}</h3>
      <p className="mt-3 text-sm leading-relaxed text-text-tertiary">{desc}</p>

      <ul className="mt-4 space-y-2 text-sm text-text-secondary">
        {bullets.map((item) => (
          <li key={item} className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            {item}
          </li>
        ))}
      </ul>

      <button
        onClick={() => setOpen((prev) => !prev)}
        className="mt-6 inline-flex items-center rounded-full border border-white/20 px-4 py-2 text-sm text-white hover:border-emerald-400/60"
      >
        {open ? 'Yopish' : 'Batafsil ko‘rish'}
      </button>

      {open && (
        <div className="mt-4 rounded-2xl border border-emerald-400/20 bg-emerald-400/5 p-4 text-sm text-text-secondary">
          Bu bo‘limda jamoangiz workflow, approval va natijalarni tartib bilan yuritadi. Har bir imkoniyat platforma kesimida alohida nazorat qilinadi.
        </div>
      )}
    </article>
  )
}

export default function SellerLandingPage() {
  const router = useRouter()
  const { t } = useI18n()

  return (
    <div className="min-h-screen bg-[#031314] text-white">
      <div className="border-b border-emerald-500/30/20 bg-[#123436] py-2">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-8 px-6 text-sm text-emerald-50/90">
          {ticker.map((item, idx) => (
            <span key={`${item}-${idx}`}>{item}</span>
          ))}
        </div>
      </div>

      <nav className="sticky top-0 z-50 border-b border-white/10 bg-[#071c1e]/95 backdrop-blur-xl">
        <div className="mx-auto flex h-24 max-w-7xl items-center justify-between px-6">
          <button onClick={() => router.push('/')} className="text-4xl font-black tracking-tight">
            Performa <span className="text-emerald-400">AI</span>
          </button>

          <div className="hidden rounded-full border border-white/15 bg-surface-elevated/[0.03] px-8 py-3 md:flex md:items-center md:gap-8 text-lg text-text-secondary">
            <a href="#hero" className="hover:text-emerald-300">Home</a>
            <a href="#capabilities" className="hover:text-emerald-300">Solutions</a>
            <a href="#funnel" className="hover:text-emerald-300">ARR Funnel</a>
            <a href="#workspace-settings" className="hover:text-emerald-300">Workspace</a>
            <a href="#meta-launch-flow" className="hover:text-emerald-300">Meta Launch</a>
            <a href="#team-workflow" className="hover:text-emerald-300">Team</a>
            <a href="#reviews" className="hover:text-emerald-300">Clients</a>
            <a href="#contact" className="hover:text-emerald-300">About</a>
          </div>

          <button
            onClick={() => router.push('/register')}
            className="rounded-full border border-emerald-500/30/60 bg-emerald-500/20 px-7 py-3 text-lg font-medium text-white transition hover:bg-emerald-500/35"
          >
            Contact Us ↗
          </button>
        </div>
      </nav>

      <section id="hero" className="relative overflow-hidden px-6 pb-32 pt-24">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_70%_10%,rgba(52,211,153,0.4),transparent_38%),radial-gradient(circle_at_20%_40%,rgba(16,185,129,0.2),transparent_42%)]" />
        <div className="pointer-events-none absolute -left-40 top-20 h-80 w-80 rounded-full bg-emerald-500/10 blur-3xl" />
        <div className="pointer-events-none absolute -right-40 bottom-20 h-80 w-80 rounded-full bg-cyan-500/10 blur-3xl" />

        <div className="relative mx-auto max-w-7xl">
          <div className="mb-8 inline-flex rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-sm text-emerald-300">
            {t(‘landing.hero.badge’)}
          </div>

          <h1 className="max-w-5xl text-6xl font-bold leading-tight md:text-8xl">
            {t(‘landing.hero.title1’)} <span className="bg-gradient-to-r from-emerald-300 to-cyan-300 bg-clip-text text-transparent">{t(‘landing.hero.title2’)}</span> {t(‘landing.hero.title3’)}
          </h1>
          <p className="mt-8 max-w-3xl text-xl leading-relaxed text-text-secondary">
            {t(‘landing.hero.subtitle’)}
          </p>

          <div className="mt-12 flex flex-wrap gap-3">
            <button
              onClick={() => router.push(‘/register’)}
              className="group rounded-full bg-gradient-to-r from-emerald-500 to-cyan-500 px-8 py-4 text-lg font-semibold text-white shadow-lg shadow-emerald-500/25 transition hover:shadow-xl hover:shadow-emerald-500/40"
            >
              {t(‘landing.hero.buttonStart’)}
            </button>
            <button
              onClick={() => router.push(‘/marketplace’)}
              className="rounded-full border border-emerald-500/40 bg-emerald-500/10 px-8 py-4 text-lg font-semibold text-emerald-200 transition hover:border-emerald-500/60 hover:bg-emerald-500/20"
            >
              {t(‘landing.hero.buttonMarketplace’)}
            </button>
            <button
              onClick={() => router.push(‘/leaderboard’)}
              className="rounded-full border border-cyan-500/40 bg-cyan-500/10 px-8 py-4 text-lg font-semibold text-cyan-200 transition hover:border-cyan-500/60 hover:bg-cyan-500/20"
            >
              {t(‘landing.hero.buttonLeaderboard’)}
            </button>
            <button
              onClick={() => router.push(‘/login’)}
              className="rounded-full border border-white/20 bg-surface-elevated/10 px-8 py-4 text-lg text-white transition hover:bg-surface-elevated/20"
            >
              {t(‘landing.hero.buttonDemo’)}
            </button>
          </div>

          <div className="mt-16 pt-8 border-t border-white/10">
            <p className="text-sm uppercase tracking-widest text-text-tertiary">Trusted by</p>
            <div className="mt-6 flex flex-wrap items-center gap-8 text-text-secondary">
              <div className="text-center">
                <div className="text-3xl font-bold text-emerald-300">500+</div>
                <div className="text-sm">{t(‘landing.hero.trust.marketers’)}</div>
              </div>
              <div className="h-10 w-px bg-white/10" />
              <div className="text-center">
                <div className="text-3xl font-bold text-emerald-300">$2B+</div>
                <div className="text-sm">{t(‘landing.hero.trust.budget’)}</div>
              </div>
              <div className="h-10 w-px bg-white/10" />
              <div className="text-center">
                <div className="text-3xl font-bold text-emerald-300">4.8★</div>
                <div className="text-sm">{t(‘landing.hero.trust.rating’)}</div>
              </div>
              <div className="h-10 w-px bg-white/10" />
              <div className="text-center">
                <div className="text-3xl font-bold text-emerald-300">50%+</div>
                <div className="text-sm">{t(‘landing.hero.trust.growth’)}</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="px-6 pb-20">
        <div className="mx-auto grid max-w-7xl gap-6 md:grid-cols-3">
          {stats.map((s) => (
            <div key={s.value} className="rounded-3xl border border-white/10 bg-black/25 p-8 text-center backdrop-blur-sm">
              <div className="text-7xl font-semibold text-white">{s.value}</div>
              <p className="mt-4 text-2xl leading-tight text-text-secondary">{s.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="capabilities" className="px-6 pb-20">
        <div className="mx-auto max-w-7xl">
          <div className="text-center mb-16">
            <p className="text-sm uppercase tracking-[0.24em] text-emerald-300">Features</p>
            <h2 className="mt-3 text-5xl font-bold md:text-6xl">
              {t(‘landing.capabilities.title’)}
            </h2>
            <p className="mt-6 max-w-3xl mx-auto text-xl text-text-secondary">
              {t(‘landing.capabilities.subtitle’)}
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {capabilities.map((item) => (
              <CapabilityCard key={item.title} {...item} />
            ))}
          </div>

          {/* Key Benefits */}
          <div className="mt-20 rounded-3xl border border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 to-cyan-500/10 p-12">
            <h3 className="text-3xl font-bold mb-10">Results</h3>
            <div className="grid gap-8 md:grid-cols-3">
              {[
                { icon: ‘⚡’, key: ‘speed’, titleKey: ‘benefits.speed’, descKey: ‘benefits.speedDesc’ },
                { icon: ‘📈’, key: ‘roas’, titleKey: ‘benefits.roas’, descKey: ‘benefits.roasDesc’ },
                { icon: ‘👥’, key: ‘productivity’, titleKey: ‘benefits.productivity’, descKey: ‘benefits.productivityDesc’ },
                { icon: ‘💰’, key: ‘budget’, titleKey: ‘benefits.budget’, descKey: ‘benefits.budgetDesc’ },
                { icon: ‘🎯’, key: ‘accuracy’, titleKey: ‘benefits.accuracy’, descKey: ‘benefits.accuracyDesc’ },
                { icon: ‘📊’, key: ‘insights’, titleKey: ‘benefits.insights’, descKey: ‘benefits.insightsDesc’ },
              ].map((benefit) => (
                <div key={benefit.key} className="text-center">
                  <div className="text-5xl mb-3">{benefit.icon}</div>
                  <h4 className="text-xl font-semibold text-white">{t(`landing.capabilities.${benefit.titleKey}`)}</h4>
                  <p className="text-text-tertiary mt-2">{t(`landing.capabilities.${benefit.descKey}`)}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="funnel" className="px-6 pb-20">
        <div className="mx-auto max-w-7xl rounded-[2rem] border border-white/10 bg-[#050d22] p-8 md:p-12">
          <p className="text-sm uppercase tracking-[0.24em] text-cyan-300">ARR framework</p>
          <h2 className="mt-3 text-4xl font-semibold md:text-5xl">{t(‘landing.funnel.title’)}</h2>
          <p className="mt-4 max-w-4xl text-lg text-text-tertiary">
            {t(‘landing.funnel.subtitle’)}
          </p>

          <div className="mt-10 space-y-4">
            {funnelStages.map((stage) => (
              <div key={stage.name} className="relative overflow-hidden rounded-3xl border border-white/15 bg-[#1b2140] px-6 py-6">
                <div
                  className={`pointer-events-none absolute inset-y-0 left-1/2 -translate-x-1/2 bg-gradient-to-b ${stage.color} opacity-85`}
                  style={{ width: `${Math.max(stage.pct * 1.6, 8)}%`, clipPath: 'polygon(20% 0%, 80% 0%, 65% 100%, 35% 100%)' }}
                />
                <div className="relative z-10 grid gap-3 md:grid-cols-[1.6fr_auto_1.6fr] md:items-center">
                  <div>
                    <h3 className="text-3xl font-medium">{stage.name}</h3>
                    <p className="mt-1 text-text-tertiary">{stage.tactic}</p>
                  </div>
                  <div className="text-6xl font-semibold text-cyan-300">{stage.pct}%</div>
                  <div className="text-right text-xl text-text-secondary">{stage.audience}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-10 overflow-hidden rounded-3xl border border-white/10">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-surface-elevated/[0.04] text-text-secondary">
                <tr>
                  <th className="px-5 py-4">Stage</th>
                  <th className="px-5 py-4">% Spend</th>
                  <th className="px-5 py-4">ROAS</th>
                  <th className="px-5 py-4">CPA</th>
                  <th className="px-5 py-4">CTR</th>
                  <th className="px-5 py-4">Trend (7d)</th>
                </tr>
              </thead>
              <tbody>
                {funnelMetrics.map((row) => (
                  <tr key={row.stage} className="border-t border-white/10 text-text-tertiary">
                    <td className="px-5 py-4 font-medium text-white">{row.stage}</td>
                    <td className="px-5 py-4">{row.spendShare}</td>
                    <td className="px-5 py-4">{row.roas}</td>
                    <td className="px-5 py-4">{row.cpa}</td>
                    <td className="px-5 py-4">{row.ctr}</td>
                    <td className="px-5 py-4 text-emerald-300">{row.trend}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section id="workspace-settings" className="px-6 pb-20">
        <div className="mx-auto max-w-7xl rounded-[2rem] border border-white/10 bg-[#090b23] p-8 md:p-12">
          <p className="text-sm uppercase tracking-[0.24em] text-violet-300">Workspace settings</p>
          <h2 className="mt-3 text-4xl font-semibold md:text-5xl">Professional-grade kampaniya boshqaruvni Performa ga moslashtirdik</h2>
          <p className="mt-4 max-w-4xl text-lg text-text-tertiary">
            Profil menyusidan Workspace Settings’ga kirib, ad account, obuna, billing, user profile va team members
            bo‘limlarini bir joydan boshqarish mumkin. Productionda bu bo‘limlar real API bilan ishlaydi.
          </p>

          <div className="mt-8 grid gap-4 md:grid-cols-5">
            {workspaceTabs.map((item, index) => (
              <article
                key={item.tab}
                className={`rounded-2xl border p-5 ${
                  index === 0 ? 'border-violet-300/60 bg-violet-400/10' : 'border-white/10 bg-surface-elevated/[0.02]'
                }`}
              >
                <h3 className="text-xl font-semibold text-white">{item.tab}</h3>
                <ul className="mt-3 space-y-2 text-sm text-text-tertiary">
                  {item.points.map((point) => (
                    <li key={point} className="flex gap-2">
                      <span className="mt-1 h-1.5 w-1.5 rounded-full bg-violet-300" />
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="meta-launch-flow" className="px-6 pb-20">
        <div className="mx-auto max-w-7xl rounded-[2rem] border border-white/10 bg-[#0a1520] p-8 md:p-12">
          <p className="text-sm uppercase tracking-[0.24em] text-sky-300">Meta campaign launch</p>
          <h2 className="mt-3 text-4xl font-semibold md:text-5xl">Optimized kampaniya launch flow — Performa roadmap</h2>
          <p className="mt-4 max-w-4xl text-lg text-text-tertiary">
            Siz yuborgan “Create New Ad → Audience Launcher → Setup → Summary” oqimini bizning platformaga moslab
            bosqichma-bosqich berdik. Hozir landingda feature map, keyingi bosqichda real interface/pages.
          </p>

          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {launchFlow.map((item) => (
              <article key={item.step} className="rounded-2xl border border-white/10 bg-surface-elevated/[0.02] p-6">
                <h3 className="text-2xl font-semibold text-white">{item.step}</h3>
                <p className="mt-2 text-base text-sky-200">{item.what}</p>
                <ul className="mt-4 space-y-2 text-sm text-text-tertiary">
                  {item.details.map((detail) => (
                    <li key={detail} className="flex items-start gap-2">
                      <span className="mt-1 h-1.5 w-1.5 rounded-full bg-sky-300" />
                      <span>{detail}</span>
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="team-workflow" className="px-6 pb-20">
        <div className="mx-auto max-w-7xl rounded-[2rem] border border-white/10 bg-[#12102a] p-8 md:p-12">
          <p className="text-sm uppercase tracking-[0.24em] text-fuchsia-300">Team members workflow</p>
          <h2 className="mt-3 text-4xl font-semibold md:text-5xl">Professional team management workflow — Performa’s way</h2>
          <p className="mt-4 max-w-4xl text-lg text-text-tertiary">
            Create workspace, invite, accept invite, role berish, ad-account access taqsimlash va removal jarayonini
            Performa roadmapiga kiritdik. Bu bo‘lim agency va multi-account ishlash uchun asosiy blok.
          </p>

          <div className="mt-8 grid gap-4 md:grid-cols-2">
            <article className="rounded-2xl border border-white/10 bg-surface-elevated/[0.02] p-6">
              <h3 className="text-2xl font-semibold text-white">End-to-end team flow</h3>
              <ol className="mt-4 space-y-3 text-sm text-text-tertiary">
                {teamFlow.map((item, index) => (
                  <li key={item} className="flex gap-3">
                    <span className="mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-fuchsia-400/20 text-xs text-fuchsia-300">
                      {index + 1}
                    </span>
                    <span>{item}</span>
                  </li>
                ))}
              </ol>
            </article>

            <article className="rounded-2xl border border-white/10 bg-surface-elevated/[0.02] p-6">
              <h3 className="text-2xl font-semibold text-white">Permissions matrix</h3>
              <div className="mt-4 space-y-3">
                {permissionMatrix.map((item) => (
                  <div key={item.role} className="rounded-xl border border-white/10 bg-black/20 p-4">
                    <p className="text-lg font-semibold text-fuchsia-200">{item.role}</p>
                    <ul className="mt-2 space-y-1 text-sm text-text-tertiary">
                      {item.rights.map((right) => (
                        <li key={right}>• {right}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </article>
          </div>
        </div>
      </section>

      <section className="px-6 pb-20">
        <div className="mx-auto grid max-w-7xl gap-0 overflow-hidden rounded-[2rem] border border-white/10 md:grid-cols-2">
          <div className="bg-surface-2 p-10 text-text-primary md:p-16">
            <p className="text-sm uppercase tracking-[0.2em] text-text-tertiary">Our story</p>
            <h3 className="mt-4 text-4xl font-semibold leading-tight text-text-primary md:text-5xl">
              Case Study Highlight
            </h3>
            <p className="mt-6 text-xl leading-relaxed text-text-secondary">
              Mijozimiz kampaniya setup vaqtini 4 baravar qisqartirdi, approval jarayonini avtomatlashtirdi va
              marketing jamoasi strategik ishga qaytdi. Bu landingda aynan shu biznes qiymatini ochiq ko‘rsatdik.
            </p>
            <button className="mt-8 rounded-full bg-emerald-600 px-7 py-3 text-lg font-medium text-white hover:bg-emerald-500">
              Read more ↗
            </button>
          </div>
          <div className="flex items-end bg-[linear-gradient(140deg,#0f172a,#052e2b,#111827)] p-10 md:p-16">
            <p className="max-w-lg text-4xl font-medium leading-tight text-white">
              “How teams reduce ops load and focus on performance growth with Performa.”
            </p>
          </div>
        </div>
      </section>

      <section id="reviews" className="px-6 pb-24">
        <div className="mx-auto max-w-7xl rounded-[2rem] border border-white/10 bg-[#02191a] p-10">
          <h2 className="text-center text-5xl font-semibold md:text-6xl">
            Reviews from our <span className="text-emerald-300">clients</span>
          </h2>
          <p className="mx-auto mt-5 max-w-4xl text-center text-xl text-text-tertiary">
            Mijoz feedbacklari loyihaning amaliy qiymatini ko‘rsatadi: tezroq ish, yaxshiroq nazorat va barqaror o‘sish.
          </p>

          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {reviews.map((review) => (
              <article key={review.name} className="rounded-3xl border border-white/10 bg-surface-elevated/[0.03] p-7">
                <p className="text-2xl leading-relaxed text-text-secondary">{review.quote}</p>
                <div className="mt-10 border-t border-white/10 pt-5">
                  <p className="text-lg font-semibold text-white">{review.name}</p>
                  <p className="text-sm text-text-tertiary">{review.role}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="contact" className="border-t border-white/10 px-6 py-16">
        <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-10 md:flex-row md:items-center">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-emerald-300">For publishers</p>
            <h3 className="mt-3 text-4xl font-semibold">Hammasi bitta platformada</h3>
            <ul className="mt-5 grid gap-2 text-lg text-text-tertiary sm:grid-cols-2">
              {suites.map((suite) => (
                <li key={suite}>• {suite}</li>
              ))}
            </ul>
          </div>

          <div className="w-full max-w-xl rounded-3xl border border-white/10 bg-surface-elevated/[0.03] p-7">
            <h4 className="text-4xl font-semibold">Newsletter</h4>
            <p className="mt-3 text-lg text-text-tertiary">Performa yangiliklari, case study va amaliy guide’larni oling.</p>
            <button className="mt-6 rounded-full border border-white/25 px-6 py-3 text-lg hover:border-emerald-500/30/70">
              Sign Up ↗
            </button>
          </div>
        </div>
      </section>
    </div>
  )
}
