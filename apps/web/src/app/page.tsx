'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

function cn(...classes: (string | false | undefined)[]) {
  return classes.filter(Boolean).join(' ')
}

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
      '“Nishon AI bilan launch muddati haftalardan kunlarga tushdi. Sotuv jamoamiz kampaniya setup o‘rniga strategiyaga vaqt ajratmoqda.”',
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
    <article className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-sm transition hover:border-emerald-400/40 hover:bg-white/[0.06]">
      <h3 className="text-2xl font-semibold text-white">{title}</h3>
      <p className="mt-3 text-sm leading-relaxed text-slate-300">{desc}</p>

      <ul className="mt-4 space-y-2 text-sm text-slate-200">
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
        <div className="mt-4 rounded-2xl border border-emerald-400/20 bg-emerald-400/5 p-4 text-sm text-slate-200">
          Bu bo‘limda jamoangiz workflow, approval va natijalarni tartib bilan yuritadi. Har bir imkoniyat platforma kesimida alohida nazorat qilinadi.
        </div>
      )}
    </article>
  )
}

export default function SellerLandingPage() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-[#031314] text-white">
      <div className="border-b border-emerald-300/20 bg-[#123436] py-2">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-8 px-6 text-sm text-emerald-50/90">
          {ticker.map((item, idx) => (
            <span key={`${item}-${idx}`}>{item}</span>
          ))}
        </div>
      </div>

      <nav className="sticky top-0 z-50 border-b border-white/10 bg-[#071c1e]/95 backdrop-blur-xl">
        <div className="mx-auto flex h-24 max-w-7xl items-center justify-between px-6">
          <button onClick={() => router.push('/')} className="text-4xl font-black tracking-tight">
            Nishon <span className="text-emerald-400">AI</span>
          </button>

          <div className="hidden rounded-full border border-white/15 bg-white/[0.03] px-8 py-3 md:flex md:items-center md:gap-8 text-lg text-slate-200">
            <a href="#hero" className="hover:text-emerald-300">Home</a>
            <a href="#capabilities" className="hover:text-emerald-300">Solutions</a>
            <a href="#reviews" className="hover:text-emerald-300">Clients</a>
            <a href="#contact" className="hover:text-emerald-300">About</a>
          </div>

          <button
            onClick={() => router.push('/register')}
            className="rounded-full border border-emerald-300/60 bg-emerald-500/20 px-7 py-3 text-lg font-medium text-white transition hover:bg-emerald-500/35"
          >
            Contact Us ↗
          </button>
        </div>
      </nav>

      <section id="hero" className="relative overflow-hidden px-6 pb-20 pt-16">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_70%_10%,rgba(52,211,153,0.25),transparent_38%),radial-gradient(circle_at_20%_40%,rgba(16,185,129,0.12),transparent_42%)]" />
        <div className="relative mx-auto max-w-7xl">
          <h1 className="max-w-5xl text-5xl font-semibold leading-tight md:text-7xl">
            Built for efficiency. <span className="text-emerald-300">Designed for control.</span>
          </h1>
          <p className="mt-6 max-w-4xl text-xl text-slate-200">
            Nishon AI reklama operatsiyasini tartib bilan boshqaradi: kampaniya yaratishdan tortib publishing,
            optimization va reportinggacha. Maqsad — jamoaga kamroq qo‘l mehnati, ko‘proq aniq natija.
          </p>

          <div className="mt-10 flex flex-wrap gap-4">
            <button
              onClick={() => router.push('/register')}
              className="rounded-full bg-emerald-500 px-8 py-4 text-lg font-semibold text-white transition hover:bg-emerald-400"
            >
              Explore the Platform ↗
            </button>
            <button
              onClick={() => router.push('/login')}
              className="rounded-full border border-white/20 bg-white/10 px-8 py-4 text-lg text-white transition hover:bg-white/20"
            >
              Book a demo ⊕
            </button>
          </div>
        </div>
      </section>

      <section className="px-6 pb-20">
        <div className="mx-auto grid max-w-7xl gap-6 md:grid-cols-3">
          {stats.map((s) => (
            <div key={s.value} className="rounded-3xl border border-white/10 bg-black/25 p-8 text-center backdrop-blur-sm">
              <div className="text-7xl font-semibold text-white">{s.value}</div>
              <p className="mt-4 text-2xl leading-tight text-slate-200">{s.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="capabilities" className="px-6 pb-20">
        <div className="mx-auto max-w-7xl rounded-[2rem] border border-white/10 bg-white/[0.02] p-8 md:p-12">
          <p className="text-sm uppercase tracking-[0.24em] text-emerald-300">Core capabilities</p>
          <h2 className="mt-3 text-4xl font-semibold md:text-5xl">Loyihaning imkoniyatlari aniq va tartibli</h2>
          <p className="mt-4 max-w-4xl text-lg text-slate-300">
            Har bir modul sotuvchi jamoa uchun alohida qiymat beradi: operatsion tezlik, nazorat, hamkorlik va
            rentabellik. Pastdagi kartalarda nima berishini oddiy tilda ko‘rasiz.
          </p>

          <div className="mt-10 grid gap-5 md:grid-cols-2">
            {capabilities.map((item) => (
              <CapabilityCard key={item.title} {...item} />
            ))}
          </div>
        </div>
      </section>

      <section className="px-6 pb-20">
        <div className="mx-auto grid max-w-7xl gap-0 overflow-hidden rounded-[2rem] border border-white/10 md:grid-cols-2">
          <div className="bg-slate-100 p-10 text-slate-800 md:p-16">
            <p className="text-sm uppercase tracking-[0.2em] text-slate-500">Our story</p>
            <h3 className="mt-4 text-4xl font-semibold leading-tight text-slate-900 md:text-5xl">
              Case Study Highlight
            </h3>
            <p className="mt-6 text-xl leading-relaxed text-slate-700">
              Mijozimiz kampaniya setup vaqtini 4 baravar qisqartirdi, approval jarayonini avtomatlashtirdi va
              marketing jamoasi strategik ishga qaytdi. Bu landingda aynan shu biznes qiymatini ochiq ko‘rsatdik.
            </p>
            <button className="mt-8 rounded-full bg-emerald-600 px-7 py-3 text-lg font-medium text-white hover:bg-emerald-500">
              Read more ↗
            </button>
          </div>
          <div className="flex items-end bg-[linear-gradient(140deg,#0f172a,#052e2b,#111827)] p-10 md:p-16">
            <p className="max-w-lg text-4xl font-medium leading-tight text-white">
              “How teams reduce ops load and focus on performance growth with Nishon AI.”
            </p>
          </div>
        </div>
      </section>

      <section id="reviews" className="px-6 pb-24">
        <div className="mx-auto max-w-7xl rounded-[2rem] border border-white/10 bg-[#02191a] p-10">
          <h2 className="text-center text-5xl font-semibold md:text-6xl">
            Reviews from our <span className="text-emerald-300">clients</span>
          </h2>
          <p className="mx-auto mt-5 max-w-4xl text-center text-xl text-slate-300">
            Mijoz feedbacklari loyihaning amaliy qiymatini ko‘rsatadi: tezroq ish, yaxshiroq nazorat va barqaror o‘sish.
          </p>

          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {reviews.map((review) => (
              <article key={review.name} className="rounded-3xl border border-white/10 bg-white/[0.03] p-7">
                <p className="text-2xl leading-relaxed text-slate-200">{review.quote}</p>
                <div className="mt-10 border-t border-white/10 pt-5">
                  <p className="text-lg font-semibold text-white">{review.name}</p>
                  <p className="text-sm text-slate-400">{review.role}</p>
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
            <ul className="mt-5 grid gap-2 text-lg text-slate-300 sm:grid-cols-2">
              {suites.map((suite) => (
                <li key={suite}>• {suite}</li>
              ))}
            </ul>
          </div>

          <div className="w-full max-w-xl rounded-3xl border border-white/10 bg-white/[0.03] p-7">
            <h4 className="text-4xl font-semibold">Newsletter</h4>
            <p className="mt-3 text-lg text-slate-300">Nishon AI yangiliklari, case study va amaliy guide’larni oling.</p>
            <button className="mt-6 rounded-full border border-white/25 px-6 py-3 text-lg hover:border-emerald-300/70">
              Sign Up ↗
            </button>
          </div>
        </div>
      </section>
    </div>
  )
}
