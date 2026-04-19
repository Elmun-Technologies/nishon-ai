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
import { PublicCard, PublicContainer, PublicFooter, PublicNavbar, PublicSectionHeader } from '@/components/public/PublicLayout'

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
      <PublicNavbar />

      <section className="border-b border-border bg-surface">
        <PublicContainer className="py-10">
          <Link href="/" className="inline-flex items-center gap-2 text-sm text-text-secondary hover:text-text-primary">
            <ArrowLeft className="h-4 w-4" />
            Back to landing
          </Link>
          <PublicSectionHeader
            eyebrow="Feature Architecture"
            title="Bizda mavjud real featurelar xaritasi"
            description="Har bir kartadagi link platformadagi mavjud sahifaga olib boradi. Bu orqali product capability va frontend UX holatini to‘g‘ridan-to‘g‘ri tekshirish mumkin."
          />
        </PublicContainer>
      </section>

      <section className="py-10">
        <PublicContainer>
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
                      className="group rounded-xl border border-border bg-surface p-5 transition hover:border-primary/40 hover:bg-surface-2"
                    >
                      <div className="mb-3 inline-flex rounded-lg border border-border p-2 text-primary">
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="mb-2 inline-flex rounded-full border border-border px-2 py-0.5 text-[11px] text-text-tertiary">
                        Live Module
                      </div>
                      <h3 className="text-heading font-semibold">{item.title}</h3>
                      <p className="mt-2 text-body-sm text-text-secondary">{item.desc}</p>
                      <div className="mt-4 inline-flex items-center gap-1 text-sm text-primary">
                        Open module
                        <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
                      </div>
                    </Link>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
        </PublicContainer>
      </section>

      <section className="border-t border-border bg-surface py-12">
        <PublicContainer>
          <div className="grid gap-4 md:grid-cols-3">
            <PublicCard className="bg-surface-2">
              <h3 className="font-semibold">Route Validity</h3>
              <p className="mt-2 text-sm text-text-secondary">Cards point to existing routes, not mocked placeholders.</p>
            </PublicCard>
            <PublicCard className="bg-surface-2">
              <h3 className="font-semibold">Product Alignment</h3>
              <p className="mt-2 text-sm text-text-secondary">Modules map to real internal capabilities and workflows.</p>
            </PublicCard>
            <PublicCard className="bg-surface-2">
              <h3 className="font-semibold">Conversion Ready</h3>
              <p className="mt-2 text-sm text-text-secondary">Public users can inspect capabilities before sign-in.</p>
            </PublicCard>
          </div>
        </PublicContainer>
      </section>

      <PublicFooter />
    </main>
  )
}
