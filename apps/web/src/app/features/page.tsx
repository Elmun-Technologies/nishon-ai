'use client'

import Link from 'next/link'
import { ArrowLeft, ArrowRight, BarChart3, Brain, CreditCard, Crown, GitBranch, Layers3, Rocket, Search, Settings2, Shield, Sparkles, Target, Users, Wallet } from 'lucide-react'
import { PublicContainer, PublicFooter, PublicNavbar } from '@/components/public/PublicLayout'

const featureGroups = [
  {
    name: 'Campaign Execution',
    metric: '4 core flows',
    items: [
      { title: 'Launch Wizard', desc: 'Campaign objective, audience, budget va creative ni bosqichma-bosqich sozlash.', href: '/launch', icon: Rocket },
      { title: 'Campaign Manager', desc: 'Kampaniyalarni status, platforma va spend bo`yicha boshqarish.', href: '/campaigns', icon: Layers3 },
      { title: 'Audience Builder', desc: 'ARR funnel kesimida auditoriyalarni yaratish va ishga tushirish.', href: '/audiences', icon: Users },
      { title: 'Retargeting Flow', desc: 'Retargeting funnel va wizard orqali qayta jalb qilish kampaniyalari.', href: '/retargeting', icon: Target },
    ],
  },
  {
    name: 'AI and Optimization',
    metric: '6 automation modules',
    items: [
      { title: 'AI Decisions', desc: 'AI nima qaror qildi va nima sababdan qildi - to`liq log.', href: '/ai-decisions', icon: Brain },
      { title: 'Auto Optimization', desc: 'Qoidalar asosida avtomatik optimizatsiya va history.', href: '/auto-optimization', icon: Settings2 },
      { title: 'Creative Scorer', desc: 'Kreativlarni launchdan oldin AI orqali baholash.', href: '/creative-scorer', icon: Sparkles },
      { title: 'Budget Optimization', desc: 'Byudjetni platformalar bo`yicha smart taqsimlash.', href: '/budget', icon: Wallet },
      { title: 'Simulation', desc: 'Byudjet va KPI o`zgarishlari uchun oldindan prognoz.', href: '/simulation', icon: GitBranch },
      { title: 'ROI Calculator', desc: 'Scale qilishdan oldin rentabellikni hisoblash.', href: '/roi-calculator', icon: BarChart3 },
    ],
  },
  {
    name: 'Analytics and Intelligence',
    metric: '5 visibility modules',
    items: [
      { title: 'Performance', desc: 'KPI, trend va campaign-level kesimlar bilan ishlash.', href: '/performance', icon: BarChart3 },
      { title: 'Reporting', desc: 'Export-ready hisobotlar va period taqqoslash.', href: '/reporting', icon: Layers3 },
      { title: 'Competitor Intelligence', desc: 'Raqobatchilar, SWOT va bozor insightlari.', href: '/competitors', icon: Search },
      { title: 'Automation Rules', desc: 'Trigger set va qoidalar bilan avtomatik aksiyalar.', href: '/automation', icon: Settings2 },
      { title: 'Top Ads', desc: 'Eng samarali e`lonlarni tez tahlil qilish paneli.', href: '/top-ads', icon: Crown },
    ],
  },
  {
    name: 'Workspace, Team, and Finance',
    metric: '6 governance modules',
    items: [
      { title: 'Workspace Team', desc: 'Role-based access va invite flow bilan jamoa boshqaruvi.', href: '/settings/workspace/team', icon: Users },
      { title: 'Ad Accounts', desc: 'Meta ad accountlar ulash, sync va reconnect holatlari.', href: '/settings/workspace/ad-accounts', icon: Shield },
      { title: 'Products and Plans', desc: 'Obuna paketlari, order holati va usage nazorati.', href: '/settings/workspace/products', icon: Crown },
      { title: 'Payments and Invoices', desc: 'Billing profile, to`lov usullari va invoice jadvali.', href: '/settings/workspace/payments', icon: CreditCard },
      { title: 'MCP Credentials', desc: 'Agent integratsiyasi uchun MCP client id/secret boshqaruvi.', href: '/settings/workspace/mcp', icon: Settings2 },
      { title: 'Workspace Help Center', desc: 'Jamoa va workspace bo`yicha tezkor yordam markazi.', href: '/settings/workspace/help', icon: Layers3 },
    ],
  },
]

export default function FeaturesPage() {
  return (
    <main className="min-h-screen bg-surface text-text-primary">
      <PublicNavbar />

      <section className="border-b border-border bg-[#f7faf2]">
        <PublicContainer className="py-12 md:py-16">
          <Link href="/" className="inline-flex items-center gap-2 text-sm text-text-secondary hover:text-text-primary">
            <ArrowLeft className="h-4 w-4" />
            Back to landing
          </Link>
          <div className="mt-4 grid gap-8 md:grid-cols-[1.2fr_1fr] md:items-end">
            <div>
              <p className="inline-flex rounded-full border border-[#b5d98f] bg-[#ebf8d9] px-3 py-1 text-xs font-medium text-[#3f6212]">
                Product Capability Matrix
              </p>
              <h1 className="mt-4 text-4xl font-semibold leading-tight md:text-6xl">Real modules. Real routes. Real operations.</h1>
              <p className="mt-4 max-w-2xl text-lg text-text-secondary">
                Bu sahifa Performa ichidagi mavjud funksiyalarni bitta professional map ko`rinishida beradi. Har bir karta live modulga ulangan.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                ['21+', 'Mapped modules'],
                ['4', 'Core capability blocks'],
                ['100%', 'Route-linked cards'],
                ['EN/RU/UZ', 'Localization ready'],
              ].map(([value, label]) => (
                <article key={label} className="rounded-2xl border border-border bg-white p-4">
                  <p className="text-xl font-semibold">{value}</p>
                  <p className="text-sm text-text-secondary">{label}</p>
                </article>
              ))}
            </div>
          </div>
        </PublicContainer>
      </section>

      <section className="bg-surface py-12">
        <PublicContainer className="space-y-8">
          {featureGroups.map((group) => (
            <section key={group.name} className="rounded-3xl border border-border bg-white p-6 md:p-8">
              <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-2xl font-semibold md:text-3xl">{group.name}</h2>
                  <p className="mt-1 text-sm text-text-secondary">Capability cluster aligned to existing product workflows.</p>
                </div>
                <span className="rounded-full border border-[#cfe8a8] bg-[#f4f9ea] px-3 py-1 text-xs font-medium text-[#4d7c0f]">
                  {group.metric}
                </span>
              </div>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {group.items.map((item) => {
                  const Icon = item.icon
                  return (
                    <Link key={item.title} href={item.href} className="group rounded-2xl border border-border bg-[#fafcf6] p-5 transition hover:border-[#84cc16]/60 hover:bg-white">
                      <div className="mb-3 inline-flex rounded-xl border border-border bg-white p-2 text-[#65a30d]">
                        <Icon className="h-4 w-4" />
                      </div>
                      <p className="mb-2 inline-flex rounded-full border border-border px-2 py-0.5 text-[11px] text-text-tertiary">Live Module</p>
                      <h3 className="text-base font-semibold">{item.title}</h3>
                      <p className="mt-2 text-sm text-text-secondary">{item.desc}</p>
                      <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-[#65a30d]">
                        Open module
                        <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
                      </span>
                    </Link>
                  )
                })}
              </div>
            </section>
          ))}
        </PublicContainer>
      </section>

      <section className="border-t border-border bg-[#f8fbf2] py-14">
        <PublicContainer>
          <div className="grid gap-4 md:grid-cols-3">
            {[
              ['Route Validity', 'Cards point to existing routes, not mocked placeholders.'],
              ['Product Alignment', 'Modules map to real internal capabilities and workflows.'],
              ['Conversion Ready', 'Public users can inspect capabilities before sign-in.'],
            ].map(([title, desc]) => (
              <article key={title} className="rounded-2xl border border-border bg-white p-5">
                <h3 className="font-semibold">{title}</h3>
                <p className="mt-2 text-sm text-text-secondary">{desc}</p>
              </article>
            ))}
          </div>
        </PublicContainer>
      </section>

      <PublicFooter />
    </main>
  )
}
