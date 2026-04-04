'use client'

import { useMemo, useState } from 'react'

type DocTab = 'getting-started' | 'guides' | 'integrations' | 'troubleshooting' | 'billing' | 'changelog' | 'support'

interface DocSection {
  id: string
  title: string
  body: string
  steps?: string[]
}

const TOP_TABS: { id: DocTab; label: string }[] = [
  { id: 'getting-started', label: 'Getting Started' },
  { id: 'guides', label: 'Guides' },
  { id: 'integrations', label: 'Integrations' },
  { id: 'troubleshooting', label: 'Troubleshooting' },
  { id: 'billing', label: 'Billing' },
  { id: 'changelog', label: 'Changelog' },
  { id: 'support', label: 'Support' },
]

const DOCS: Record<DocTab, { heading: string; intro: string; sections: DocSection[] }> = {
  'getting-started': {
    heading: 'Platformadan 100% foydalanish yo‘riqnomasi',
    intro: 'Bu sahifa orqali foydalanuvchi Create, Launch, Insights, AI va Integrations bo‘limlarini to‘liq o‘rganadi.',
    sections: [
      {
        id: 'workflow',
        title: 'How Performa Works',
        body: 'Platforma 2 asosiy oqimga bo‘linadi: Create (creative tayyorlash) va Launch (kampaniyani ishga tushirish).',
        steps: [
          'Workspace va platform accountni ulang (Meta/Google).',
          'Launch usulini tanlang: Manual, AI Agent yoki Marketplace Expert.',
          'Wizard orqali Campaign → Ad Sets → Ads → Review bosqichlarini tugating.',
          'Insights bo‘limida Performance, Top Ads va AI qarorlarni kuzating.',
        ],
      },
      {
        id: 'first-campaign',
        title: 'Create Your First Campaign',
        body: 'Birinchi kampaniyada minimal majburiy fieldlar: Ad account, objective, budget, pixel/conversion event, creative.',
      },
      {
        id: 'setup-checklist',
        title: 'Setup Checklist',
        body: 'Publishdan oldin tekshiruv: tracking, pixel, landing page, CTA, audience, budget limits va compliance.',
      },
    ],
  },
  guides: {
    heading: 'Guides',
    intro: 'Har bir vazifa uchun amaliy yo‘l-yo‘riq: creative, targeting, bidding, audit.',
    sections: [
      { id: 'creative-guide', title: 'Creative Guide', body: 'Headline, primary text, CTA va visual format bo‘yicha best-practice.' },
      { id: 'targeting-guide', title: 'Targeting Guide', body: 'Broad vs layered audience, exclusions, lookalike va remarketing ishlatish.' },
      { id: 'grading-guide', title: 'Account Grading Guide', body: 'Wasted Spend, Quality Score, Impression Share, Activity score’ni qanday oshirish.' },
    ],
  },
  integrations: {
    heading: 'Integrations',
    intro: 'Meta ulash, campaign import, attribution va workspace mapping bo‘yicha hujjatlar.',
    sections: [
      { id: 'meta-connect', title: 'How to Connect Meta', body: 'Settings → Meta orqali OAuth ulab, ad accountlarni sync qiling.' },
      { id: 'campaign-import', title: 'Import Existing Campaigns', body: 'Import campaign tugmasi orqali tarixiy campaignlarni olib kiring.' },
      { id: 'attribution', title: 'Attribution Setup', body: 'Click/view window va first-party attribution provider ulash tartibi.' },
    ],
  },
  troubleshooting: {
    heading: 'Troubleshooting',
    intro: 'Eng ko‘p uchraydigan xatolar va ularning aniq yechimlari.',
    sections: [
      { id: 'sync-failed', title: 'Sync Failed', body: 'Token eskirgan bo‘lishi mumkin — Reconnect qiling va qayta sync bosing.' },
      { id: 'publish-errors', title: 'Publish Errors', body: 'Conversion event/objective mosligini tekshiring, required fieldlarni to‘ldiring.' },
      { id: 'no-data', title: 'No Performance Data', body: 'Campaign spend borligini, date-range va workspace tanlangani to‘g‘ri ekanini tekshiring.' },
    ],
  },
  billing: {
    heading: 'Billing',
    intro: 'Tariflar, limitlar, qo‘shimcha account narxlari va invoicelar.',
    sections: [
      { id: 'plans', title: 'Plans & Limits', body: 'Plan bo‘yicha workspace, ad account va AI usage limitlari.' },
      { id: 'upgrade', title: 'Upgrade Guide', body: 'Upgrade bosqichlari va qanday qilib limitni oshirish.' },
    ],
  },
  changelog: {
    heading: 'Changelog',
    intro: 'Platformadagi so‘nggi yangilanishlar va qo‘shilgan feature’lar.',
    sections: [
      { id: 'latest', title: 'Latest Updates', body: 'Launch modes, live grading, AI creative scoring, Performance va Top Ads sahifalari.' },
    ],
  },
  support: {
    heading: 'Support',
    intro: 'Yordam olish uchun aloqa va eskalatsiya kanallari.',
    sections: [
      { id: 'contact', title: 'Contact Support', body: 'Issue tafsilotlari, workspace ID va screenshot bilan supportga yozing.' },
      { id: 'sla', title: 'Response SLA', body: 'Critical xatolar ustuvor ko‘riladi; odatiy savollar navbat asosida javoblanadi.' },
    ],
  },
}

export default function DocsPage() {
  const [tab, setTab] = useState<DocTab>('getting-started')
  const [query, setQuery] = useState('')

  const current = DOCS[tab]
  const filteredSections = useMemo(
    () => current.sections.filter((s) =>
      s.title.toLowerCase().includes(query.toLowerCase()) ||
      s.body.toLowerCase().includes(query.toLowerCase()),
    ),
    [current.sections, query],
  )

  return (
    <div className="max-w-7xl mx-auto space-y-5">
      <div className="bg-white border border-[#E5E7EB] rounded-2xl p-4">
        <div className="flex items-center gap-3 mb-3">
          <h1 className="text-2xl font-bold text-[#111827]">📚 Documentation</h1>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search..."
            className="ml-auto border border-[#E5E7EB] rounded-xl px-3 py-2 text-sm min-w-64"
          />
        </div>
        <div className="flex gap-4 flex-wrap border-b border-[#F3F4F6] pb-2">
          {TOP_TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`text-sm font-medium pb-1 border-b-2 ${
                tab === t.id ? 'text-[#4F46E5] border-[#4F46E5]' : 'text-[#6B7280] border-transparent'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr_220px] gap-4">
        <div className="bg-white border border-[#E5E7EB] rounded-xl p-4 h-fit">
          <p className="text-sm font-semibold text-[#111827] mb-2">Bo‘limlar</p>
          <div className="space-y-1">
            {current.sections.map((s) => (
              <a key={s.id} href={`#${s.id}`} className="block text-sm text-[#4F46E5] hover:underline">
                {s.title}
              </a>
            ))}
          </div>
        </div>

        <div className="bg-white border border-[#E5E7EB] rounded-xl p-6 space-y-6">
          <div>
            <p className="text-sm text-[#4F46E5] font-semibold mb-1">{TOP_TABS.find((t) => t.id === tab)?.label}</p>
            <h2 className="text-4xl font-bold text-[#111827]">{current.heading}</h2>
            <p className="text-[#4B5563] mt-3">{current.intro}</p>
          </div>

          {filteredSections.map((section) => (
            <section id={section.id} key={section.id} className="border border-[#E5E7EB] rounded-xl p-4">
              <h3 className="text-2xl font-semibold text-[#111827] mb-2">{section.title}</h3>
              <p className="text-[#4B5563]">{section.body}</p>
              {section.steps && (
                <ol className="mt-3 space-y-1 list-decimal list-inside text-sm text-[#374151]">
                  {section.steps.map((step) => <li key={step}>{step}</li>)}
                </ol>
              )}
            </section>
          ))}
        </div>

        <div className="bg-white border border-[#E5E7EB] rounded-xl p-4 h-fit">
          <p className="text-sm font-semibold text-[#111827] mb-2">On this page</p>
          <div className="space-y-1">
            {filteredSections.map((s) => (
              <a key={s.id} href={`#${s.id}`} className="block text-sm text-[#6B7280] hover:text-[#111827]">
                {s.title}
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
