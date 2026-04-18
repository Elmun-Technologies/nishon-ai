'use client'

import Link from 'next/link'
import {
  ArrowLeft,
  ArrowRight,
  BarChart3,
  Brain,
  CreditCard,
  Crown,
  GitBranch,
  Layers3,
  Rocket,
  Search,
  Settings2,
  Shield,
  Sparkles,
  Target,
  Users,
  Wallet,
} from 'lucide-react'

const featureGroups = [
  {
    name: 'Campaign Execution',
    items: [
      { title: 'Launch Wizard', desc: 'Campaign objective, audience, budget va creative ni bosqichma-bosqich sozlash.', href: '/launch', icon: Rocket },
      { title: 'Campaign Manager', desc: 'Kampaniyalarni status, platforma va spend bo‘yicha boshqarish.', href: '/campaigns', icon: Layers3 },
      { title: 'Audience Builder', desc: 'ARR funnel kesimida auditoriyalarni yaratish va ishga tushirish.', href: '/audiences', icon: Users },
      { title: 'Retargeting Flow', desc: 'Retargeting funnel va wizard orqali qayta jalb qilish kampaniyalari.', href: '/retargeting', icon: Target },
    ],
  },
  {
    name: 'AI and Optimization',
    items: [
      { title: 'AI Decisions', desc: 'AI nima qaror qildi, nima sababdan qildi — to‘liq log.', href: '/ai-decisions', icon: Brain },
      { title: 'Auto Optimization', desc: 'Qoidalar asosida avtomatik optimizatsiya va history.', href: '/auto-optimization', icon: Settings2 },
      { title: 'Creative Scorer', desc: 'Kreativlarni launchdan oldin AI orqali baholash.', href: '/creative-scorer', icon: Sparkles },
      { title: 'Budget Optimization', desc: 'Byudjetni platformalar bo‘yicha smart taqsimlash.', href: '/budget', icon: Wallet },
      { title: 'Simulation', desc: 'Byudjet va KPI o‘zgarishlari uchun oldindan prognoz.', href: '/simulation', icon: GitBranch },
      { title: 'ROI Calculator', desc: 'Scale qilishdan oldin rentabellikni hisoblash.', href: '/roi-calculator', icon: BarChart3 },
    ],
  },
  {
    name: 'Analytics and Intelligence',
    items: [
      { title: 'Performance', desc: 'KPI, trend va campaign-level kesimlar bilan ishlash.', href: '/performance', icon: BarChart3 },
      { title: 'Reporting', desc: 'Export-ready hisobotlar va period taqqoslash.', href: '/reporting', icon: Layers3 },
      { title: 'Competitor Intelligence', desc: 'Raqobatchilar, SWOT va bozor insightlari.', href: '/competitors', icon: Search },
      { title: 'Automation Rules', desc: 'Trigger set va qoidalar bilan avtomatik aksiyalar.', href: '/automation', icon: Settings2 },
      { title: 'Top Ads', desc: 'Eng samarali e’lonlarni tez tahlil qilish paneli.', href: '/top-ads', icon: Crown },
    ],
  },
  {
    name: 'Workspace, Team, and Finance',
    items: [
      { title: 'Workspace Team', desc: 'Role-based access va invite flow bilan jamoa boshqaruvi.', href: '/settings/workspace/team', icon: Users },
      { title: 'Ad Accounts', desc: 'Meta ad accountlar ulash, sync va reconnect holatlari.', href: '/settings/workspace/ad-accounts', icon: Shield },
      { title: 'Products and Plans', desc: 'Obuna paketlari, order holati va usage nazorati.', href: '/settings/workspace/products', icon: Crown },
      { title: 'Payments and Invoices', desc: 'Billing profile, to‘lov usullari va invoice jadvali.', href: '/settings/workspace/payments', icon: CreditCard },
      { title: 'MCP Credentials', desc: 'Agent integratsiyasi uchun MCP client id/secret boshqaruvi.', href: '/settings/workspace/mcp', icon: Settings2 },
      { title: 'Workspace Help Center', desc: 'Jamoa va workspace bo‘yicha tezkor yordam markazi.', href: '/settings/workspace/help', icon: Layers3 },
    ],
  },
  {
    name: 'Commercial and Market Layer',
    items: [
      { title: 'Marketplace', desc: 'Mutaxassislarni topish va profile bo‘yicha taqqoslash.', href: '/marketplace', icon: Search },
      { title: 'Leaderboard', desc: 'Performance reytinglari va eng yaxshi ijrochilar ro‘yxati.', href: '/leaderboard', icon: Crown },
      { title: 'My Portfolio', desc: 'Mutaxassislik profilingizni boshqarish va ko‘rinish berish.', href: '/my-portfolio', icon: Users },
    ],
  },
]

export default function FeaturesPage() {
  return (
    <main className="min-h-screen bg-surface-2 text-text-primary">
      <section className="border-b border-border bg-surface">
        <div className="mx-auto w-full max-w-7xl px-4 py-10 md:px-6">
          <Link href="/" className="inline-flex items-center gap-2 text-sm text-text-secondary hover:text-text-primary">
            <ArrowLeft className="h-4 w-4" />
            Back to landing
          </Link>
          <p className="mt-4 text-sm font-medium text-primary">Feature Architecture</p>
          <h1 className="mt-1 text-3xl font-semibold md:text-4xl">Bizda mavjud real featurelar xaritasi</h1>
          <p className="mt-3 max-w-3xl text-body text-text-secondary">
            Har bir kartadagi link platformadagi mavjud sahifaga olib boradi. Bu orqali product capability va frontend
            UX holatini to‘g‘ridan-to‘g‘ri tekshirish mumkin.
          </p>
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-4 py-10 md:px-6">
        <div className="space-y-8">
          {featureGroups.map((group) => (
            <div key={group.name}>
              <h2 className="mb-4 text-xl font-semibold">{group.name}</h2>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {group.items.map((item) => {
                  const Icon = item.icon
                  return (
                    <Link
                      key={item.title}
                      href={item.href}
                      className="rounded-xl border border-border bg-surface p-5 transition hover:border-primary/40 hover:bg-surface-2"
                    >
                      <div className="mb-3 inline-flex rounded-lg border border-border p-2 text-primary">
                        <Icon className="h-4 w-4" />
                      </div>
                      <h3 className="text-heading font-semibold">{item.title}</h3>
                      <p className="mt-2 text-body-sm text-text-secondary">{item.desc}</p>
                      <div className="mt-4 inline-flex items-center gap-1 text-sm text-primary">
                        Open module
                        <ArrowRight className="h-4 w-4" />
                      </div>
                    </Link>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  )
}
