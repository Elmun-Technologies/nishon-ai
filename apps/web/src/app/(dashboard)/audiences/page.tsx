'use client'

import { useMemo, useState } from 'react'

type FunnelStage = 'acquisition' | 'reengagement' | 'retargeting' | 'retention'

type AudienceCard = {
  id: string
  name: string
  description: string
  stage: FunnelStage
  tags: string[]
  ai?: boolean
}

const STAGES: Array<{ id: FunnelStage; label: string }> = [
  { id: 'acquisition', label: 'Acquisition Prospecting' },
  { id: 'reengagement', label: 'Acquisition Re-Engagement' },
  { id: 'retargeting', label: 'Retargeting' },
  { id: 'retention', label: 'Retention' },
]

const AUDIENCES: AudienceCard[] = [
  { id: 'super-lookalike', name: 'Super lookalike', description: 'Top-performing audience lookalikes combination.', stage: 'acquisition', tags: ['Lookalike', 'Prospecting'], ai: true },
  { id: 'video-addicts-lal', name: 'Video Addicts lookalike', description: 'Lookalike from users who watched 95% videos.', stage: 'acquisition', tags: ['Video', 'Lookalike'] },
  { id: 'ios-high-intent', name: 'High-intent iOS users', description: 'Lookalike of high-intent iOS visitors/customers.', stage: 'acquisition', tags: ['iOS', 'High Intent'], ai: true },
  { id: 'android-high-intent', name: 'High-intent Android users', description: 'Lookalike of high-intent Android visitors/customers.', stage: 'acquisition', tags: ['Android', 'High Intent'] },
  { id: 'top-url', name: 'Top-URL purchaser lookalike', description: 'Lookalike of users who visited high-value URLs and purchased.', stage: 'acquisition', tags: ['Top URL', 'Purchasers'] },
  { id: 'deep-browser', name: 'Deep browsers lookalike', description: 'Lookalike of users spending 8+ minutes on site.', stage: 'acquisition', tags: ['Behavioral', 'Lookalike'] },
  { id: 'social-engagers', name: 'Social media engagers', description: 'Instagram/Facebook engagers, page visitors and fans.', stage: 'reengagement', tags: ['Social', 'Engagers'] },
  { id: 'video-addicts', name: 'Video Addicts', description: 'Users who watched 95% of one of your videos.', stage: 'reengagement', tags: ['Video', 'Warm'] },
  { id: 'ad-watchers', name: 'Ad viewers (3 sec)', description: 'Users who watched 3+ seconds of your video ads.', stage: 'reengagement', tags: ['Video Ads', 'Warm'] },
  { id: 'all-visitors-30', name: 'All visitors (last 30 days)', description: 'Everyone who visited website in last 30 days.', stage: 'retargeting', tags: ['Visitors', '30d'] },
  { id: 'high-intent-30', name: 'High-intent visitors (last 30 days)', description: 'Visitors showing high buying intent in last 30 days.', stage: 'retargeting', tags: ['High Intent', '30d'] },
  { id: 'custom-recency', name: 'Custom recency visitors', description: 'Build 0-3 and 3-30 day recency audiences.', stage: 'retargeting', tags: ['Recency', 'Custom'] },
  { id: 'multi-visits', name: 'Multiple visits', description: 'Users with at least 3 visits in last 30 days.', stage: 'retargeting', tags: ['Frequency', 'Visitors'] },
  { id: 'basic-retention', name: 'Basic retention (180 days)', description: 'Customers who purchased in previous 180 days.', stage: 'retention', tags: ['Customers', '180d'] },
  { id: 'fresh-customers', name: 'Fresh customers (10 days)', description: 'Recent customers from last 10 days.', stage: 'retention', tags: ['Customers', '10d'] },
  { id: 'reactivation', name: 'Reactivation (60-180 days)', description: 'Past customers from 60-180 days for reactivation.', stage: 'retention', tags: ['Reactivation', '60-180d'] },
]

const PREBUILT_LIBRARY: Record<string, string[]> = {
  'Acquisition prospecting': [
    'Infrequent/Occasional/Frequent silver-gold-platinum customer lookalikes',
    'Low/medium/high AOV visitors with low/high intent (infrequent/occasional/frequent)',
    'Category-specific purchaser lookalikes',
    'Category-specific low/high-intent visitor lookalikes',
    'Facebook/Instagram fans lookalike',
    'Video casuals/enthusiasts/addicts lookalike',
    '10-sec ad watcher lookalike',
    'Website lead lookalike',
    'Super lookalike',
    'High-intent Android/iOS users',
    'Top-URL low/high-intent visitor lookalike',
    'Top-URL purchaser lookalike',
    'Interest targeting & audience mixes',
    'Broad targeting',
    'Deep browsers / medium-length browsers lookalike',
    'Top-event lookalike',
  ],
  'Acquisition re-engagement': [
    'Video casuals / enthusiasts / addicts',
    'Ad watchers (3+ sec)',
    'Instagram/Facebook fans',
    'Collection & Instant Experience ad engagers',
  ],
  Retargeting: [
    'All visitors last 30 days',
    'High-intent visitors last 30 days',
    'All visitors 30-180 days',
    'High-intent visitors 30-180 days',
    'All / high-intent custom recency visitors',
    'Multiple visits (3+ in last 30d)',
    'Deep browsers / medium-length browsers',
    'Category-specific medium/high intent',
    'Top URL low/high-intent visitors',
    'Website leads',
    'Top events',
  ],
  Retention: [
    'Basic retention (180 days)',
    'Fresh customers (10 days)',
    'Custom recency purchasers',
    'Reactivation (60-180 days)',
    'Top-URL purchasers',
    'Category-specific purchasers',
  ],
}

const FULL_FUNNEL_RECOMMENDATIONS: Array<{
  title: string
  intro?: string
  points: string[]
}> = [
  {
    title: 'Strategic caveat (important)',
    intro:
      '76 ta audience mavjud bo‘lsa ham, hammasini birdan launch qilmang. Bu “menu strategy”: bosqichma-bosqich test qiling, budgetni tarqatib yubormang.',
    points: [
      'Har funnel bosqichida 2-4 ta eng kuchli audience bilan boshlang.',
      'Winner topilgach keyingi audience’larni qo‘shib boring.',
      'Budget va frequency nazorat qilinmasa tezda ad fatigue paydo bo‘ladi.',
    ],
  },
  {
    title: 'Acquisition prospecting — what usually wins',
    intro: 'Winning audience har doim 2 omilga bog‘liq: Quality + Quantity.',
    points: [
      'Lookalike of Video Addicts (95% watchers).',
      'Agar 95% yetarli bo‘lmasa: Video Enthusiasts (75%) yoki Video Casuals (50%).',
      'Super lookalike (top-performing audience kombinatsiyasi).',
      'Niche prospecting from top URLs (eng muhim sahifalar visitorlari).',
      'Interest targeting & audience mixes (studio’da tayyorlangan interest setlar).',
      'Broad targeting (pixel data kuchli accountlar uchun).',
    ],
  },
  {
    title: 'Acquisition re-engagement',
    points: [
      'Video Addicts / Enthusiasts / Casuals.',
      'Social Media Engagers (FB/IG page/ad engagement).',
      'Ad Viewers (kamida 3 soniya video ko‘rganlar).',
    ],
  },
  {
    title: 'Retargeting best practice',
    intro:
      '72 soat “hot window”: user saytingizga kirgandan keyin 1-3 marta/kun ko‘rsatish odatda eng yaxshi natija beradi.',
    points: [
      'Custom recency visitors 0-3 days (aggressive retargeting).',
      'Custom recency visitors 3-30 days (frequencyni pasaytirib).',
      '30-180 day cohort’larni alohida campaign/ad setlarda tekshirish.',
    ],
  },
  {
    title: 'Retention strategy',
    points: [
      'Basic retention (180 days) — recurring purchase businesslar uchun start nuqta.',
      'Fresh customers (10 days) — upsell/cross-sell.',
      'Reactivation (60-180 days) — qayta faollashtirish.',
    ],
  },
]

const ERFM_EXPLAINER = [
  'eRFM = engagement + recency + frequency + monetary value modeli.',
  'Order value segmentlari: Silver/Low, Gold/Medium, Platinum/High.',
  'Frequency segmentlari: Infrequent/Low, Occasional/Medium, Frequent/High.',
  'AI ushbu segmentlarni Meta pixel signaliga uzatib lookalike sifatini oshiradi.',
]

const TARGET_NETWORKS = [
  'Meta / Facebook',
  'Google Ads',
  'Yandex Direct',
  'TikTok Ads',
  'LinkedIn Ads',
  'Snapchat Ads',
  'X Ads',
  'Pinterest Ads',
  'DV360',
  'va boshqa tarmoqlar',
]

const IMPLEMENTATION_CHECKLIST: Array<{ module: string; items: string[] }> = [
  { module: 'Core', items: ['login/register', 'org/workspace/team', 'RBAC', 'billing', 'audit logs'] },
  {
    module: 'Integrations',
    items: ['Meta Ads', 'Google Ads', 'Yandex Direct', 'TikTok Ads', 'LinkedIn Ads', 'Snapchat Ads', 'Pinterest Ads', 'X Ads', 'GA4', 'Shopify/CRM'],
  },
  {
    module: 'Sync engine',
    items: ['OAuth', 'token refresh', 'scheduled/incremental sync', 'backfill', 'webhooks', 'retry/error monitoring'],
  },
  {
    module: 'Reporting + Metrics',
    items: ['overview dashboard', 'drill-down reports', 'custom reports', 'exports', 'scheduled reports', 'ROAS/CPA/CTR/CPM/CPC/LTV/funnel metrics'],
  },
  {
    module: 'Automation + AI',
    items: ['rules', 'budget/bid changes', 'alerts', 'recommendations', 'anomaly detection', 'forecasting', 'AI analyst chat'],
  },
]

export default function AudiencesPage() {
  const [activeStage, setActiveStage] = useState<FunnelStage>('acquisition')
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState<string[]>([])
  const [splitByFunnel, setSplitByFunnel] = useState(true)
  const [budgetType, setBudgetType] = useState<'CBO' | 'ABO'>('CBO')
  const [objective, setObjective] = useState('Sales')

  const filtered = useMemo(() => {
    return AUDIENCES.filter((a) => {
      const byStage = a.stage === activeStage
      const byQuery =
        query.trim() === '' ||
        a.name.toLowerCase().includes(query.toLowerCase()) ||
        a.description.toLowerCase().includes(query.toLowerCase())
      return byStage && byQuery
    })
  }, [activeStage, query])

  const toggleAudience = (id: string) => {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  }

  return (
    <div className="min-h-full rounded-2xl border border-[#1E1B4B] bg-[#08071A] text-slate-200 overflow-hidden">
      <div className="border-b border-[#1F1B4D] px-5 py-4 flex items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold">Audience Launcher</h2>
          <p className="text-xs text-slate-400 mt-1">
            Performa full-funnel targeting strategy — Madgicx workflow adapted for our platform.
          </p>
        </div>
        <button className="px-4 py-2 rounded-lg bg-[#8B80F9] text-slate-900 text-sm font-semibold disabled:opacity-40" disabled={selected.length === 0}>
          Next
        </button>
      </div>

      <div className="p-5 space-y-6">
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search for audience..."
              className="w-full md:max-w-sm rounded-lg border border-[#2C285A] bg-[#0D0B22] px-3 py-2 text-sm outline-none focus:border-[#8B80F9]"
            />
            <span className="text-xs px-2 py-1 rounded-full bg-[#151236] border border-[#2C285A]">{selected.length} selected</span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-2">
            {STAGES.map((stage) => (
              <button
                key={stage.id}
                onClick={() => setActiveStage(stage.id)}
                className={`text-left px-3 py-2 rounded-lg text-sm border ${
                  stage.id === activeStage
                    ? 'bg-[#221B5A] border-[#8B80F9] text-white'
                    : 'bg-[#0D0B22] border-[#2C285A] text-[#A1A1AA]'
                }`}
              >
                {stage.label}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {filtered.map((audience) => {
              const active = selected.includes(audience.id)
              return (
                <button
                  key={audience.id}
                  onClick={() => toggleAudience(audience.id)}
                  className={`text-left rounded-xl border p-4 transition ${
                    active ? 'border-[#8B80F9] bg-[#14113A]' : 'border-[#2C285A] bg-[#0A0820] hover:border-[#4C478F]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-medium text-sm">{audience.name}</p>
                    <span className={`w-4 h-4 rounded border ${active ? 'bg-[#8B80F9] border-[#8B80F9]' : 'border-slate-500'}`} />
                  </div>
                  <p className="text-xs text-[#A1A1AA] mt-2">{audience.description}</p>
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {audience.tags.map((tag) => (
                      <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full bg-[#1D1A45] text-[#93C5FD]">
                        {tag}
                      </span>
                    ))}
                    {audience.ai && <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#2A1C55] text-[#C4B5FD]">AI</span>}
                  </div>
                </button>
              )
            })}
          </div>
        </section>

        <section className="rounded-xl border border-[#2C285A] bg-[#0A0820]">
          <div className="px-4 py-3 border-b border-[#1F1B4D] flex items-center justify-between">
            <p className="font-medium">Campaign Set Up</p>
            <span className="text-xs text-slate-400">Step 1 of 4</span>
          </div>
          <div className="p-4 space-y-4">
            <div className="inline-flex rounded-lg border border-[#2C285A] overflow-hidden">
              <button
                onClick={() => setSplitByFunnel(true)}
                className={`px-3 py-2 text-xs ${splitByFunnel ? 'bg-[#221B5A] text-white' : 'bg-[#0D0B22] text-[#A1A1AA]'}`}
              >
                Split campaigns per funnel stage
              </button>
              <button
                onClick={() => setSplitByFunnel(false)}
                className={`px-3 py-2 text-xs ${!splitByFunnel ? 'bg-[#221B5A] text-white' : 'bg-[#0D0B22] text-[#A1A1AA]'}`}
              >
                Launch all ad sets to one campaign
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <input
                className="md:col-span-2 rounded-lg border border-[#2C285A] bg-[#0D0B22] px-3 py-2 text-sm"
                defaultValue="Performa - Acquisition Prospecting - Master Campaign"
              />
              <select
                className="rounded-lg border border-[#2C285A] bg-[#0D0B22] px-3 py-2 text-sm"
                value={objective}
                onChange={(e) => setObjective(e.target.value)}
              >
                <option>Sales</option>
                <option>Leads</option>
                <option>Traffic</option>
                <option>Engagement</option>
                <option>Awareness</option>
              </select>
              <div className="inline-flex rounded-lg border border-[#2C285A] overflow-hidden h-fit">
                <button onClick={() => setBudgetType('CBO')} className={`px-3 py-2 text-xs ${budgetType === 'CBO' ? 'bg-[#221B5A] text-white' : 'bg-[#0D0B22] text-[#A1A1AA]'}`}>CBO</button>
                <button onClick={() => setBudgetType('ABO')} className={`px-3 py-2 text-xs ${budgetType === 'ABO' ? 'bg-[#221B5A] text-white' : 'bg-[#0D0B22] text-[#A1A1AA]'}`}>ABO</button>
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-xl border border-[#2C285A] bg-[#0A0820] p-4 space-y-4">
          <div className="flex items-center justify-between">
            <p className="font-medium">Select the Ad Creatives</p>
            <button className="px-3 py-1.5 rounded-lg bg-[#8B80F9] text-slate-900 text-xs font-semibold">Save Changes</button>
          </div>
          <div className="rounded-lg border border-[#2C285A] p-3">
            <p className="text-xs text-slate-400 mb-2">Your selected audiences</p>
            <div className="flex flex-wrap gap-2">
              {selected.length === 0 ? (
                <span className="text-xs text-slate-500">No audience selected yet.</span>
              ) : (
                selected.map((id) => {
                  const item = AUDIENCES.find((a) => a.id === id)
                  return (
                    <span key={id} className="text-xs px-2 py-1 rounded bg-[#17143D] border border-[#2C285A]">
                      {item?.name}
                    </span>
                  )
                })
              )}
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-3">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="rounded-lg border border-[#2C285A] bg-[#0D0B22] p-2">
                <div className="aspect-[4/5] rounded bg-[#16133B] mb-2" />
                <p className="text-xs text-slate-300">Creative #{n}</p>
                <p className="text-[11px] text-slate-400 mt-1">ROAS, CTR, thumb-stop va spend metrikalari bo‘yicha saralash.</p>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-xl border border-[#2C285A] bg-[#0A0820] p-4 space-y-4">
          <div className="flex items-center justify-between">
            <p className="font-medium">Set Up the Audiences</p>
            <button className="px-3 py-1.5 rounded-lg bg-[#8B80F9] text-slate-900 text-xs font-semibold">Save Changes</button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="rounded-lg border border-[#2C285A] p-3 space-y-3">
              <p className="text-sm font-medium">Choose Locations</p>
              <select className="w-full rounded-lg border border-[#2C285A] bg-[#0D0B22] px-3 py-2 text-sm">
                <option>Worldwide</option>
                <option>Uzbekistan</option>
                <option>Kazakhstan</option>
                <option>Custom selection</option>
              </select>
              <p className="text-xs text-slate-400">Language, geo va exclusionlarni alohida saqlash mumkin.</p>
            </div>
            <div className="rounded-lg border border-[#2C285A] p-3 space-y-3">
              <p className="text-sm font-medium">Recency</p>
              <select className="w-full rounded-lg border border-[#2C285A] bg-[#0D0B22] px-3 py-2 text-sm">
                <option>0-180 days</option>
                <option>0-3 days</option>
                <option>3-30 days</option>
                <option>30-180 days</option>
              </select>
              <p className="text-xs text-slate-400">0-3 kun “hot window”, 3-30 kun esa pastroq frequency bilan.</p>
            </div>
            <div className="rounded-lg border border-[#2C285A] p-3 space-y-3">
              <p className="text-sm font-medium">Lookalike percentage</p>
              <input type="range" min={1} max={20} defaultValue={5} className="w-full" />
              <p className="text-xs text-slate-400">Tavsiya: 0-5% dan boshlang, keyin scale qiling.</p>
            </div>
            <div className="rounded-lg border border-[#2C285A] p-3 space-y-3">
              <p className="text-sm font-medium">Conversion + Budget</p>
              <select className="w-full rounded-lg border border-[#2C285A] bg-[#0D0B22] px-3 py-2 text-sm">
                <option>Purchase</option>
                <option>Add to Cart</option>
                <option>Lead</option>
              </select>
              <input className="w-full rounded-lg border border-[#2C285A] bg-[#0D0B22] px-3 py-2 text-sm" defaultValue="USD 10 / day" />
            </div>
          </div>
        </section>

        <section className="rounded-xl border border-[#2C285A] bg-[#0A0820] p-4 space-y-4">
          <div className="flex items-center justify-between">
            <p className="font-medium">Summary & Launch</p>
            <button className="px-4 py-2 rounded-lg bg-[#8B80F9] text-slate-900 text-sm font-semibold">Launch</button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            <div className="rounded-lg border border-[#2C285A] p-3">
              <p className="text-slate-400 text-xs mb-1">When to launch</p>
              <p>Launch now yoki schedule (midnight / custom time).</p>
            </div>
            <div className="rounded-lg border border-[#2C285A] p-3">
              <p className="text-slate-400 text-xs mb-1">Naming structure</p>
              <p>Account label + Audience + Placement + Age + Gender + Location.</p>
            </div>
          </div>
        </section>

        <section className="rounded-xl border border-[#2C285A] bg-[#0A0820] p-4">
          <h3 className="text-base font-semibold mb-3">Target multi-network scope</h3>
          <div className="flex flex-wrap gap-2 mb-4">
            {TARGET_NETWORKS.map((network) => (
              <span key={network} className="text-xs px-2.5 py-1 rounded-full bg-[#17143D] border border-[#2C285A] text-[#C7D2FE]">
                {network}
              </span>
            ))}
          </div>

          <h3 className="text-base font-semibold mb-3">Winning audiences playbook (to‘liq)</h3>
          <p className="text-sm text-[#C7CAD1] mb-3">
            Asosiy prinsip: 76 ta preset bor, lekin hammasini birdan ishga tushirmang. Restaurant menyusi kabi — eng kuchli kombinatsiyalarni bosqichma-bosqich test qiling.
          </p>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {Object.entries(PREBUILT_LIBRARY).map(([title, items]) => (
              <div key={title} className="rounded-lg border border-[#2C285A] p-3">
                <p className="font-medium text-sm mb-2">{title}</p>
                <ul className="space-y-1.5 list-disc list-inside text-xs text-[#A1A1AA]">
                  {items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="mt-4 rounded-lg border border-[#2C285A] p-3">
            <p className="text-sm font-medium mb-2">Madgicx vs Ads Manager (nima uchun bu section kerak)</p>
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-[#A1A1AA]">
              <li>• Performa’da preset audiences va exclusionlar oldindan beriladi.</li>
              <li>• AI lookalike segmentlar bilan sifat + hajm balansini yaxshilaydi.</li>
              <li>• Funnel stage’larni kampaniyalarga alohida ajratish osonlashadi.</li>
              <li>• Creative picker performance ma’lumotlari bilan ishlaydi.</li>
            </ul>
          </div>

          <div className="mt-4 rounded-lg border border-[#2C285A] p-3">
            <p className="text-sm font-medium mb-2">eRFM model (detal)</p>
            <ul className="space-y-1.5 list-disc list-inside text-xs text-[#A1A1AA]">
              {ERFM_EXPLAINER.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>

          <div className="mt-4 space-y-3">
            {FULL_FUNNEL_RECOMMENDATIONS.map((section) => (
              <div key={section.title} className="rounded-lg border border-[#2C285A] p-3">
                <p className="text-sm font-medium">{section.title}</p>
                {section.intro && <p className="text-xs text-[#C7CAD1] mt-1">{section.intro}</p>}
                <ul className="mt-2 space-y-1.5 list-disc list-inside text-xs text-[#A1A1AA]">
                  {section.points.map((point) => (
                    <li key={point}>{point}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="mt-4 rounded-lg border border-[#2C285A] p-3">
            <p className="text-sm font-medium mb-3">Platform implementation checklist (kerakli qismlar)</p>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              {IMPLEMENTATION_CHECKLIST.map((group) => (
                <div key={group.module} className="rounded-lg border border-[#2C285A] p-3">
                  <p className="text-sm font-medium mb-2">{group.module}</p>
                  <ul className="space-y-1 list-disc list-inside text-xs text-[#A1A1AA]">
                    {group.items.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
