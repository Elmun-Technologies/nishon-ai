'use client'

import { useState } from 'react'

// ─── Types ────────────────────────────────────────────────────────────────────

type InsightCategory =
  | 'placement' | 'device' | 'cbo_abo' | 'objective' | 'optimization'
  | 'bidding' | 'daytime' | 'countries' | 'age' | 'gender' | 'language'
  | 'landing_page' | 'audience_size' | 'lookalike'

// ─── Mock data helpers ────────────────────────────────────────────────────────

const fmtPct  = (v: number) => `${v.toFixed(1)}%`
const fmtUsd  = (v: number) => `$${v.toFixed(2)}`
const fmtRoas = (v: number) => `${v.toFixed(2)}x`

// ─── Insight widgets ──────────────────────────────────────────────────────────

function MetricTable({ rows, cols }: {
  rows: { label: string; values: (string | number)[] }[]
  cols: string[]
}) {
  return (
    <div className="overflow-auto rounded-xl border border-gray-200">
      <table className="w-full text-xs">
        <thead>
          <tr className="bg-gray-50 text-gray-500 font-semibold uppercase tracking-wide">
            <th className="px-4 py-2.5 text-left">{cols[0]}</th>
            {cols.slice(1).map(c => <th key={c} className="px-4 py-2.5 text-right">{c}</th>)}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {rows.map((row, i) => (
            <tr key={i} className={`${i === 0 ? 'bg-emerald-50/50' : ''} hover:bg-gray-50`}>
              <td className="px-4 py-2.5 font-medium text-gray-900">{row.label}</td>
              {row.values.map((v, j) => (
                <td key={j} className={`px-4 py-2.5 text-right font-medium ${j === 0 && i === 0 ? 'text-emerald-700' : 'text-gray-700'}`}>{v}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ─── Section components ───────────────────────────────────────────────────────

function AuctionAnalytics() {
  const [activeWidget, setActiveWidget] = useState('placement')

  const widgets: { key: string; label: string; data: { rows: { label: string; values: (string | number)[] }[], cols: string[] } }[] = [
    {
      key: 'placement', label: 'Placement & Device',
      data: {
        cols: ['Placement', 'ROAS', 'CTR', 'Xarajat'],
        rows: [
          { label: 'Instagram Feed', values: [fmtRoas(4.8), fmtPct(1.9), fmtUsd(820)] },
          { label: 'Facebook Feed', values: [fmtRoas(3.9), fmtPct(1.5), fmtUsd(610)] },
          { label: 'Instagram Stories', values: [fmtRoas(3.2), fmtPct(1.1), fmtUsd(340)] },
          { label: 'Facebook Reels', values: [fmtRoas(2.8), fmtPct(0.9), fmtUsd(220)] },
          { label: 'Audience Network', values: [fmtRoas(1.4), fmtPct(0.4), fmtUsd(90)] },
        ],
      },
    },
    {
      key: 'cbo_abo', label: 'CBO vs ABO',
      data: {
        cols: ['Tur', 'ROAS', 'CTR', 'Xarajat'],
        rows: [
          { label: 'CBO (Campaign Budget)', values: [fmtRoas(4.2), fmtPct(1.7), fmtUsd(1240)] },
          { label: 'ABO (Ad Set Budget)',   values: [fmtRoas(3.5), fmtPct(1.4), fmtUsd(870)] },
        ],
      },
    },
    {
      key: 'bidding', label: 'Bidding Methods',
      data: {
        cols: ['Bid turi', 'ROAS', 'CPA', 'Xarajat'],
        rows: [
          { label: 'Lowest Cost (auto)',  values: [fmtRoas(4.1), fmtUsd(14.2), fmtUsd(890)] },
          { label: 'Cost Cap',            values: [fmtRoas(3.7), fmtUsd(16.8), fmtUsd(640)] },
          { label: 'Bid Cap',             values: [fmtRoas(2.9), fmtUsd(21.3), fmtUsd(310)] },
        ],
      },
    },
    {
      key: 'daytime', label: 'Days & Hours',
      data: {
        cols: ['Kun / Soat', 'ROAS', 'CTR', 'Xarajat'],
        rows: [
          { label: 'Dushanba 10:00-14:00', values: [fmtRoas(5.1), fmtPct(2.2), fmtUsd(180)] },
          { label: 'Seshanba 18:00-22:00', values: [fmtRoas(4.8), fmtPct(2.0), fmtUsd(160)] },
          { label: 'Payshanba 20:00-23:00', values: [fmtRoas(4.5), fmtPct(1.8), fmtUsd(140)] },
          { label: 'Shanba 12:00-16:00',   values: [fmtRoas(1.2), fmtPct(0.5), fmtUsd(80)] },
          { label: 'Yakshanba 02:00-06:00', values: [fmtRoas(0.4), fmtPct(0.2), fmtUsd(40)] },
        ],
      },
    },
  ]

  const active = widgets.find(w => w.key === activeWidget)!

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {widgets.map(w => (
          <button
            key={w.key}
            onClick={() => setActiveWidget(w.key)}
            className={`text-xs px-3 py-1.5 rounded-full border transition ${
              activeWidget === w.key ? 'bg-indigo-600 text-white border-indigo-600' : 'border-gray-200 text-gray-600 hover:border-indigo-300'
            }`}
          >
            {w.label}
          </button>
        ))}
      </div>
      <MetricTable rows={active.data.rows} cols={active.data.cols} />
      <div className="text-xs text-gray-400">* Yashil qator — eng yuqori ROAS ko'rsatkichi</div>
    </div>
  )
}

function GeoDemo() {
  const [view, setView] = useState<'countries' | 'age' | 'gender' | 'language'>('countries')

  const data: Record<string, { rows: { label: string; values: (string|number)[] }[], cols: string[] }> = {
    countries: {
      cols: ['Mamlakat', 'ROAS', 'CTR', 'Xarajat', 'Konversiya'],
      rows: [
        { label: '🇺🇿 O\'zbekiston', values: [fmtRoas(5.2), fmtPct(2.1), fmtUsd(1200), '142'] },
        { label: '🇰🇿 Qozog\'iston',  values: [fmtRoas(4.1), fmtPct(1.7), fmtUsd(640), '82'] },
        { label: '🇷🇺 Rossiya',       values: [fmtRoas(3.4), fmtPct(1.4), fmtUsd(420), '51'] },
        { label: '🇩🇪 Germaniya',     values: [fmtRoas(2.8), fmtPct(1.1), fmtUsd(310), '38'] },
        { label: '🇺🇸 AQSh',          values: [fmtRoas(2.1), fmtPct(0.8), fmtUsd(180), '21'] },
      ],
    },
    age: {
      cols: ['Yosh guruh', 'ROAS', 'CTR', 'Xarajat', 'CPA'],
      rows: [
        { label: '25–34',  values: [fmtRoas(5.0), fmtPct(2.0), fmtUsd(920), fmtUsd(11.2)] },
        { label: '35–44',  values: [fmtRoas(4.4), fmtPct(1.7), fmtUsd(740), fmtUsd(13.8)] },
        { label: '18–24',  values: [fmtRoas(3.1), fmtPct(1.3), fmtUsd(410), fmtUsd(18.4)] },
        { label: '45–54',  values: [fmtRoas(2.7), fmtPct(1.0), fmtUsd(290), fmtUsd(22.1)] },
        { label: '55–64',  values: [fmtRoas(1.8), fmtPct(0.7), fmtUsd(160), fmtUsd(31.5)] },
      ],
    },
    gender: {
      cols: ['Jins', 'ROAS', 'CTR', 'Xarajat', 'Konversiya'],
      rows: [
        { label: '👩 Ayol', values: [fmtRoas(4.9), fmtPct(2.0), fmtUsd(1340), '162'] },
        { label: '👨 Erkak', values: [fmtRoas(3.6), fmtPct(1.4), fmtUsd(780), '88'] },
      ],
    },
    language: {
      cols: ['Til', 'ROAS', 'CTR', 'Xarajat'],
      rows: [
        { label: '🇺🇿 O\'zbek',  values: [fmtRoas(5.4), fmtPct(2.3), fmtUsd(980)] },
        { label: '🇷🇺 Rus',      values: [fmtRoas(3.8), fmtPct(1.6), fmtUsd(540)] },
        { label: '🇬🇧 Ingliz',   values: [fmtRoas(2.9), fmtPct(1.2), fmtUsd(310)] },
      ],
    },
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        {(['countries', 'age', 'gender', 'language'] as const).map(v => (
          <button key={v} onClick={() => setView(v)}
            className={`text-xs px-3 py-1.5 rounded-full border transition ${view === v ? 'bg-indigo-600 text-white border-indigo-600' : 'border-gray-200 text-gray-600 hover:border-indigo-300'}`}>
            {v === 'countries' ? '🌍 Mamlakatlar' : v === 'age' ? '👤 Yoshlar' : v === 'gender' ? '⚧ Jins' : '💬 Tillar'}
          </button>
        ))}
      </div>
      <MetricTable rows={data[view].rows} cols={data[view].cols} />
    </div>
  )
}

function TargetingInsights() {
  const [view, setView] = useState<'landing_page' | 'audience_size' | 'lookalike'>('landing_page')

  const data: Record<string, { rows: { label: string; values: (string|number)[] }[], cols: string[] }> = {
    landing_page: {
      cols: ['Landing Page', 'ROAS', 'Conv. Rate', 'Xarajat'],
      rows: [
        { label: '/checkout', values: [fmtRoas(6.2), fmtPct(4.8), fmtUsd(640)] },
        { label: '/product/top-seller', values: [fmtRoas(4.9), fmtPct(3.2), fmtUsd(890)] },
        { label: '/collection/new', values: [fmtRoas(3.4), fmtPct(2.1), fmtUsd(420)] },
        { label: '/ (homepage)', values: [fmtRoas(2.1), fmtPct(1.4), fmtUsd(310)] },
      ],
    },
    audience_size: {
      cols: ['Auditoriya hajmi', 'ROAS', 'CTR', 'Reach'],
      rows: [
        { label: '1M – 5M',   values: [fmtRoas(5.1), fmtPct(2.0), '2.4M'] },
        { label: '5M – 20M',  values: [fmtRoas(4.2), fmtPct(1.6), '8.9M'] },
        { label: '20M – 50M', values: [fmtRoas(3.4), fmtPct(1.2), '31M'] },
        { label: '50M+',      values: [fmtRoas(2.1), fmtPct(0.8), '82M'] },
      ],
    },
    lookalike: {
      cols: ['Lookalike %', 'ROAS', 'CTR', 'CPA'],
      rows: [
        { label: '1%',  values: [fmtRoas(5.8), fmtPct(2.4), fmtUsd(9.8)] },
        { label: '2%',  values: [fmtRoas(4.7), fmtPct(1.9), fmtUsd(12.1)] },
        { label: '5%',  values: [fmtRoas(3.6), fmtPct(1.5), fmtUsd(16.3)] },
        { label: '10%', values: [fmtRoas(2.4), fmtPct(1.0), fmtUsd(24.7)] },
      ],
    },
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        {(['landing_page', 'audience_size', 'lookalike'] as const).map(v => (
          <button key={v} onClick={() => setView(v)}
            className={`text-xs px-3 py-1.5 rounded-full border transition ${view === v ? 'bg-indigo-600 text-white border-indigo-600' : 'border-gray-200 text-gray-600 hover:border-indigo-300'}`}>
            {v === 'landing_page' ? '🔗 Landing Pages' : v === 'audience_size' ? '👥 Auditoriya hajmi' : '🔮 Lookalike %'}
          </button>
        ))}
      </div>
      <MetricTable rows={data[view].rows} cols={data[view].cols} />
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

type SectionKey = 'auction' | 'geo' | 'targeting'

export default function ABTestingPage() {
  const [section, setSection] = useState<SectionKey>('auction')

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">A/B Test & 360° Audit</h1>
        <p className="text-sm text-gray-500 mt-1">Placement, demografiya, auditoriya va kreativ bo'yicha chuqur tahlil</p>
      </div>

      {/* Top tips */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { icon: '🎨', title: 'Haftasiga 15+ kreativ', desc: 'Har hafta kamida 15 ta yangi kreativ test qiling. Har doim winner topiladi.' },
          { icon: '🛡️', title: 'Stop-Loss qo\'ying', desc: 'Testda byudjet isrofini oldini olish uchun automation qo\'shing.' },
          { icon: '⏰', title: 'Minimal 1 hafta', desc: 'Test kamida 1 hafta yoki avg CPA x2 xarajat to\'planguncha ishlashi kerak.' },
        ].map(tip => (
          <div key={tip.title} className="bg-white border border-gray-200 rounded-xl p-4 flex gap-3">
            <span className="text-2xl shrink-0">{tip.icon}</span>
            <div>
              <div className="text-sm font-semibold text-gray-900 mb-1">{tip.title}</div>
              <div className="text-xs text-gray-500 leading-relaxed">{tip.desc}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Section tabs */}
      <div className="flex border-b border-gray-200 gap-1">
        {([
          { key: 'auction', label: '⚡ Auction Analytics' },
          { key: 'geo',     label: '🌍 Geo & Demo Insights' },
          { key: 'targeting', label: '🎯 Targeting Insights' },
        ] as { key: SectionKey; label: string }[]).map(tab => (
          <button
            key={tab.key}
            onClick={() => setSection(tab.key)}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition ${
              section === tab.key ? 'border-indigo-600 text-indigo-700' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-5">
        {section === 'auction'   && <AuctionAnalytics />}
        {section === 'geo'       && <GeoDemo />}
        {section === 'targeting' && <TargetingInsights />}
      </div>
    </div>
  )
}
