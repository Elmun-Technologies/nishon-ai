‘use client’

import { useState } from ‘react’
import { useRouter } from ‘next/navigation’

const ticker = [‘Summit 26 · Stockholm’, ‘Wednesday April 15, 2026’, ‘Request Your Ticket Now’]

const capabilities = [
  {
    title: ‘Campaign Management’,
    desc: ‘Create, manage, and optimize campaigns across multiple platforms from a single unified dashboard with real-time control.’,
    bullets: [‘1-click launch’, ‘Smart budget split’, ‘Audience layering’],
  },
  {
    title: ‘Creative Management’,
    desc: ‘Generate AI-powered ad copy and creative variants with built-in approval workflows and automatic A/B testing across channels.’,
    bullets: [‘AI ad copy’, ‘Creative approval flow’, ‘Auto A/B rotation’],
  },
  {
    title: ‘Reporting & Analytics’,
    desc: ‘Track key performance indicators like ROAS, CPA, and CTR with real-time analytics and deep performance insights.’,
    bullets: [‘Unified dashboard’, ‘Hourly anomaly alerts’, ‘Attribution snapshots’],
  },
  {
    title: ‘Finance & Control’,
    desc: ‘Manage budgets, set spending limits, enforce approval workflows, and control access with role-based permissions.’,
    bullets: [‘Budget guardrails’, ‘Role-based permissions’, ‘Approval gates’],
  },
]

const stats = [
  { value: ‘60%’, text: ‘of sales time spent on ad admin work’ },
  { value: ‘43%’, text: ‘of marketers churn due to poor UX’ },
  { value: ‘50%’, text: ‘of global ad spend goes to Big Tech’ },
]

const suites = [
  ‘Publisher Suite’,
  ‘Advertiser Suite’,
  ‘Solution Services’,
  ‘For Developers’,
]

const reviews = [
  {
    quote:
      ‘”Performa reduced our campaign launch time from weeks to days. Our sales team now focuses on strategy instead of setup.”’,
    name: ‘Michael Johnson’,
    role: ‘Head of Growth, Retail Group’,
  },
  {
    quote:
      ‘”We used to manage 4 platforms separately. Now everything is in one place with actionable insights every morning.”’,
    name: ‘Sarah Williams’,
    role: ‘Marketing Director, Auto Brand’,
  },
  {
    quote:
      ‘”Approval, finance, and analytics in one system made agency-client collaboration significantly faster.”’,
    name: ‘David Chen’,
    role: ‘COO, Digital Agency’,
  },
]

const funnelStages = [
  {
    name: ‘Acquisition Prospecting’,
    pct: 60,
    audience: ‘New users unfamiliar with your brand’,
    tactic: ‘Broad targeting + creative testing + lookalike audiences’,
    color: ‘from-cyan-300 to-cyan-500’,
  },
  {
    name: ‘Acquisition Re-Engagement’,
    pct: 20,
    audience: ‘Users who engaged with content but didn\’t visit website’,
    tactic: ‘Retarget engaged users with click-driving creatives’,
    color: ‘from-pink-400 to-pink-500’,
  },
  {
    name: ‘Retargeting’,
    pct: 15,
    audience: ‘Warm audience that visited but didn\’t convert’,
    tactic: ‘Dynamic product ads with special offers and urgency messaging’,
    color: ‘from-blue-400 to-blue-500’,
  },
  {
    name: ‘Retention’,
    pct: 5,
    audience: ‘Existing customers from previous purchases’,
    tactic: ‘Cross-sell, upsell, and loyalty programs for repeat purchases’,
    color: ‘from-indigo-300 to-indigo-500’,
  },
]

const funnelMetrics = [
  {
    stage: ‘Prospecting’,
    spendShare: ‘58.4%’,
    roas: ‘4.9’,
    cpa: ‘$22.8’,
    ctr: ‘0.92%’,
    trend: ‘+12%’,
  },
  {
    stage: ‘Re-Engagement’,
    spendShare: ‘18.9%’,
    roas: ‘6.1’,
    cpa: ‘$17.3’,
    ctr: ‘1.18%’,
    trend: ‘+8%’,
  },
  {
    stage: ‘Retargeting’,
    spendShare: ‘16.2%’,
    roas: ‘8.4’,
    cpa: ‘$12.1’,
    ctr: ‘1.44%’,
    trend: ‘+15%’,
  },
  {
    stage: ‘Retention’,
    spendShare: ‘6.5%’,
    roas: ‘10.7’,
    cpa: ‘$9.2’,
    ctr: ‘1.91%’,
    trend: ‘+6%’,
  },
]

const workspaceTabs = [
  {
    tab: ‘Ad accounts’,
    points: [
      ‘Connect and manage Meta and Google ad accounts’,
      ‘Reconnect accounts and monitor status in real-time’,
      ‘Configure pages, pixels, and audience exclusion rules’,
    ],
  },
  {
    tab: ‘Products & Usage’,
    points: [
      ‘Track your subscription plan and usage limits’,
      ‘Enable or disable add-on features’,
      ‘Change plans and manage ad account bundles’,
    ],
  },
  {
    tab: ‘Payments’,
    points: [
      ‘View billing history and download invoices’,
      ‘Add multiple payment methods’,
      ‘Update billing information and company details’,
    ],
  },
  {
    tab: ‘User Profile’,
    points: [
      ‘View your user ID, email, and phone number’,
      ‘Update contact information’,
      ‘Manage profile settings for team access’,
    ],
  },
  {
    tab: ‘Team Members’,
    points: [
      ‘Invite team members to your workspace’,
      ‘Assign roles and permissions by workspace’,
      ‘Set up multiple workspaces for agencies’,
    ],
  },
]

const launchFlow = [
  {
    step: ‘1. Create New Ad’,
    what: ‘Access Ad Launcher and create a new ad’,
    details: [
      ‘Set identity, format, page, and ad copy in one interface’,
      ‘Preview ads in real-time across all platforms’,
      ‘Save and proceed to audience targeting’,
    ],
  },
  {
    step: ‘2. Audience Launcher’,
    what: ‘Select audience presets by funnel stage’,
    details: [
      ‘Choose from Acquisition, Re-Engagement, Retargeting, or Retention’,
      ‘Launch same ad to multiple audiences simultaneously’,
      ‘Assign different budgets per audience segment’,
    ],
  },
  {
    step: ‘3. Campaign Setup’,
    what: ‘Configure campaign settings and targeting’,
    details: [
      ‘Choose to split by funnel stage or run as single campaign’,
      ‘Select ABO or CBO bidding strategy’,
      ‘Set location, age, gender, device, and placement targeting’,
    ],
  },
  {
    step: ‘4. Summary & Launch’,
    what: ‘Review and publish your campaign’,
    details: [
      ‘Choose launch time: immediate, midnight, or schedule’,
      ‘Review ad set names and final configuration’,
      ‘Launch and campaigns go live on Meta and Google’,
    ],
  },
]

const teamFlow = [
  ‘Create workspace during onboarding or from workspace switcher’,
  ‘Send team member invitations via email (comma-separated for multiple)’,
  ‘Monitor pending invites and resend invitation links as needed’,
  ‘After acceptance, grant ad account access via checkboxes’,
  ‘Update member roles from 3-dot menu (Advertiser → Admin)’,
  ‘Remove team members with optional scheduled workspace deletion’,
]

const permissionMatrix = [
  {
    role: ‘Owner’,
    rights: [
      ‘Full control over workspace and subscription’,
      ‘Connect/disconnect ad accounts, manage billing and team’,
      ‘Assign Admin/Advertiser roles and delete workspaces’,
    ],
  },
  {
    role: ‘Admin’,
    rights: [
      ‘Operational control similar to Owner (team, billing, settings)’,
      ‘Works within Owner\’s subscription and ad accounts’,
      ‘Assists Owner with strategic and operational management’,
    ],
  },
  {
    role: ‘Advertiser’,
    rights: [
      ‘Access only assigned ad accounts’,
      ‘No separate subscription required (uses Owner\’s plan)’,
      ‘Can manage campaigns but with limited workspace control’,
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
        {open ? ‘Hide Details’ : ‘Learn More’}
      </button>

      {open && (
        <div className="mt-4 rounded-2xl border border-emerald-400/20 bg-emerald-400/5 p-4 text-sm text-text-secondary">
          Your team can manage workflows, approvals, and results systematically. Each feature provides platform-wide control and consistency.
        </div>
      )}
    </article>
  )
}

export default function SellerLandingPage() {
  const router = useRouter()

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
            ✨ Built on Madgicx — For Pro Marketers
          </div>

          <h1 className="max-w-5xl text-6xl font-bold leading-tight md:text-8xl">
            Manage ads <span className="bg-gradient-to-r from-emerald-300 to-cyan-300 bg-clip-text text-transparent">faster</span> and smarter.
          </h1>
          <p className="mt-8 max-w-3xl text-xl leading-relaxed text-text-secondary">
            Performa is a marketer&apos;s platform that manages 4 advertising platforms (Meta, Google, TikTok, Yandex) from one place, with automation and AI. Speed up campaign setup 4x, increase ROAS by 50%.
          </p>

          <div className="mt-12 flex flex-wrap gap-3">
            <button
              onClick={() => router.push(‘/register’)}
              className="group rounded-full bg-gradient-to-r from-emerald-500 to-cyan-500 px-8 py-4 text-lg font-semibold text-white shadow-lg shadow-emerald-500/25 transition hover:shadow-xl hover:shadow-emerald-500/40"
            >
              Get Started — Try for Free ↗
            </button>
            <button
              onClick={() => router.push(‘/marketplace’)}
              className="rounded-full border border-emerald-500/40 bg-emerald-500/10 px-8 py-4 text-lg font-semibold text-emerald-200 transition hover:border-emerald-500/60 hover:bg-emerald-500/20"
            >
              Find a Marketer or Agency
            </button>
            <button
              onClick={() => router.push(‘/leaderboard’)}
              className="rounded-full border border-cyan-500/40 bg-cyan-500/10 px-8 py-4 text-lg font-semibold text-cyan-200 transition hover:border-cyan-500/60 hover:bg-cyan-500/20"
            >
              🏆 View Top Performers
            </button>
            <button
              onClick={() => router.push(‘/login’)}
              className="rounded-full border border-white/20 bg-surface-elevated/10 px-8 py-4 text-lg text-white transition hover:bg-surface-elevated/20"
            >
              Request Demo ⊕
            </button>
          </div>

          <div className="mt-16 pt-8 border-t border-white/10">
            <p className="text-sm uppercase tracking-widest text-text-tertiary">Trusted by</p>
            <div className="mt-6 flex flex-wrap items-center gap-8 text-text-secondary">
              <div className="text-center">
                <div className="text-3xl font-bold text-emerald-300">500+</div>
                <div className="text-sm">Active Marketers</div>
              </div>
              <div className="h-10 w-px bg-white/10" />
              <div className="text-center">
                <div className="text-3xl font-bold text-emerald-300">$2B+</div>
                <div className="text-sm">Managed Budget</div>
              </div>
              <div className="h-10 w-px bg-white/10" />
              <div className="text-center">
                <div className="text-3xl font-bold text-emerald-300">4.8★</div>
                <div className="text-sm">Average Rating</div>
              </div>
              <div className="h-10 w-px bg-white/10" />
              <div className="text-center">
                <div className="text-3xl font-bold text-emerald-300">50%+</div>
                <div className="text-sm">Average ROAS Growth</div>
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
              Everything a marketer needs in one platform
            </h2>
            <p className="mt-6 max-w-3xl mx-auto text-xl text-text-secondary">
              Campaign Management, Creative Control, Analytics, Finance &amp; Governance. Each feature brings unique value to your marketing team.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {capabilities.map((item) => (
              <CapabilityCard key={item.title} {...item} />
            ))}
          </div>

          <div className="mt-20 rounded-3xl border border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 to-cyan-500/10 p-12">
            <h3 className="text-3xl font-bold mb-10">Results</h3>
            <div className="grid gap-8 md:grid-cols-3">
              {[
                { icon: ‘⚡’, title: ‘Setup 75% faster’, desc: ‘From 4 days to 1 hour’ },
                { icon: ‘📈’, title: ‘ROAS 50% higher’, desc: ‘With automation and smart budget split’ },
                { icon: ‘👥’, title: ‘Team productivity 3x’, desc: ‘No admin work, just strategy’ },
                { icon: ‘💰’, title: ‘Budget need 30% less’, desc: ‘With smart allocation’ },
                { icon: ‘🎯’, title: ‘Campaign accuracy 90%+’, desc: ‘AI-powered, fewer mistakes’ },
                { icon: ‘📊’, title: ‘Real-time insights’, desc: ‘Fresh data every 30 minutes’ },
              ].map((benefit) => (
                <div key={benefit.title} className="text-center">
                  <div className="text-5xl mb-3">{benefit.icon}</div>
                  <h4 className="text-xl font-semibold text-white">{benefit.title}</h4>
                  <p className="text-text-tertiary mt-2">{benefit.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="funnel" className="px-6 pb-20">
        <div className="mx-auto max-w-7xl rounded-[2rem] border border-white/10 bg-[#050d22] p-8 md:p-12">
          <p className="text-sm uppercase tracking-[0.24em] text-cyan-300">ARR framework</p>
          <h2 className="mt-3 text-4xl font-semibold md:text-5xl">Budget allocation across the funnel</h2>
          <p className="mt-4 max-w-4xl text-lg text-text-tertiary">
            We adapted the Madgicx-style funnel model for our platform to optimize budget allocation across acquisition, re-engagement, retargeting, and retention stages.
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
          <h2 className="mt-3 text-4xl font-semibold md:text-5xl">Professional-grade campaign management adapted for Performa</h2>
          <p className="mt-4 max-w-4xl text-lg text-text-tertiary">
            Access Workspace Settings from your profile menu to manage ad accounts, subscriptions, billing, user profile, and team members in one place. These sections integrate with real APIs in production.
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

      <section id=”meta-launch-flow” className=”px-6 pb-20”>
        <div className=”mx-auto max-w-7xl rounded-[2rem] border border-white/10 bg-[#0a1520] p-8 md:p-12”>
          <p className=”text-sm uppercase tracking-[0.24em] text-sky-300”>Meta campaign launch</p>
          <h2 className=”mt-3 text-4xl font-semibold md:text-5xl”>Optimized campaign launch flow — Performa roadmap</h2>
          <p className=”mt-4 max-w-4xl text-lg text-text-tertiary”>
            We adapted the &quot;Create New Ad → Audience Launcher → Setup → Summary&quot; flow into our platform. This section shows the feature map; next phase includes the real interface and pages.
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
          <h2 className="mt-3 text-4xl font-semibold md:text-5xl">Professional team management workflow — Performa&apos;s way</h2>
          <p className="mt-4 max-w-4xl text-lg text-text-tertiary">
            We included workspace creation, invitations, role assignment, ad account access distribution, and member removal in Performa&apos;s roadmap. This is essential for agencies and multi-account management.
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

      <section className=”px-6 pb-20”>
        <div className=”mx-auto grid max-w-7xl gap-0 overflow-hidden rounded-[2rem] border border-white/10 md:grid-cols-2”>
          <div className=”bg-surface-2 p-10 text-text-primary md:p-16”>
            <p className=”text-sm uppercase tracking-[0.2em] text-text-tertiary”>Our story</p>
            <h3 className=”mt-4 text-4xl font-semibold leading-tight text-text-primary md:text-5xl”>
              Case Study Highlight
            </h3>
            <p className=”mt-6 text-xl leading-relaxed text-text-secondary”>
              Our customers reduced campaign setup time by 4x, automated approval processes, and got their marketing teams back to strategy. This landing page showcases that exact business value.
            </p>
            <button className=”mt-8 rounded-full bg-emerald-600 px-7 py-3 text-lg font-medium text-white hover:bg-emerald-500”>
              Read more ↗
            </button>
          </div>
          <div className=”flex items-end bg-[linear-gradient(140deg,#0f172a,#052e2b,#111827)] p-10 md:p-16”>
            <p className=”max-w-lg text-4xl font-medium leading-tight text-white”>
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
            Customer feedback demonstrates Performa&apos;s real value: faster workflows, better control, and consistent growth across campaigns.
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
            <h3 className="mt-3 text-4xl font-semibold">Everything on one platform</h3>
            <ul className="mt-5 grid gap-2 text-lg text-text-tertiary sm:grid-cols-2">
              {suites.map((suite) => (
                <li key={suite}>• {suite}</li>
              ))}
            </ul>
          </div>

          <div className="w-full max-w-xl rounded-3xl border border-white/10 bg-surface-elevated/[0.03] p-7">
            <h4 className="text-4xl font-semibold">Newsletter</h4>
            <p className="mt-3 text-lg text-text-tertiary">Get Performa updates, case studies, and practical guides delivered to your inbox.</p>
            <button className="mt-6 rounded-full border border-white/25 px-6 py-3 text-lg hover:border-emerald-500/60">
              Sign Up ↗
            </button>
          </div>
        </div>
      </section>
    </div>
  )
}
