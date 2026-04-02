'use client'

import { useState } from 'react'

// ─── Types ────────────────────────────────────────────────────────────────────

interface AdCreative {
  id: string
  type: 'image' | 'video' | 'carousel'
  name: string
  preview: string
  spend: number
  roas: number
  ctr: number
  cpa: number
  usedIn: number
}

interface AdCopy {
  id: string
  text: string
  length: 'short' | 'medium' | 'long'
  spend: number
  roas: number
  ctr: number
}

type SmartFilterKey = 'age' | 'gender' | 'placement' | 'funnel' | 'country'

// ─── Mock Data ────────────────────────────────────────────────────────────────

const MOCK_CREATIVES: AdCreative[] = [
  { id: 'c1', type: 'video',    name: 'Product Demo 30s',       preview: '🎬', spend: 1240, roas: 4.2, ctr: 1.8, cpa: 12.4, usedIn: 3 },
  { id: 'c2', type: 'image',    name: 'Lifestyle Shot A',        preview: '🖼', spend: 890,  roas: 3.1, ctr: 1.2, cpa: 18.7, usedIn: 5 },
  { id: 'c3', type: 'video',    name: 'Testimonial UGC',         preview: '🎬', spend: 2100, roas: 5.8, ctr: 2.4, cpa: 9.1,  usedIn: 2 },
  { id: 'c4', type: 'carousel', name: 'Product Collection',      preview: '🎠', spend: 670,  roas: 2.8, ctr: 0.9, cpa: 22.3, usedIn: 4 },
  { id: 'c5', type: 'image',    name: 'Before & After',          preview: '🖼', spend: 1560, roas: 4.9, ctr: 1.6, cpa: 11.2, usedIn: 1 },
  { id: 'c6', type: 'video',    name: 'Explainer 15s',           preview: '🎬', spend: 430,  roas: 1.9, ctr: 0.7, cpa: 31.5, usedIn: 2 },
]

const MOCK_COPIES: AdCopy[] = [
  { id: 'cp1', text: 'Bizning mahsulotimiz bilan hayotingizni osonlashtiring. Hoziroq sinab ko\'ring!', length: 'short', spend: 1820, roas: 4.6, ctr: 1.9 },
  { id: 'cp2', text: 'Ko\'plab mijozlar allaqachon natija ko\'rishdi. Siz ham qo\'shiling...', length: 'short', spend: 1340, roas: 3.8, ctr: 1.5 },
  { id: 'cp3', text: 'Bu imkoniyatni o\'tkazib yubormang! Cheklangan vaqt taklifi...', length: 'medium', spend: 980, roas: 3.2, ctr: 1.3 },
  { id: 'cp4', text: 'Mahsulotimiz haqida ko\'proq bilib oling. Sifat kafolatlangan, natija tasdiqlangan...', length: 'long', spend: 560, roas: 2.1, ctr: 0.8 },
]

// ─── Creative Clusters Matrix ─────────────────────────────────────────────────

function CreativeClusters() {
  const [selectedMetric, setSelectedMetric] = useState<'roas' | 'ctr' | 'cpa'>('roas')
  const [minSpend, setMinSpend] = useState(0)
  const [activeSmartFilter, setActiveSmartFilter] = useState<SmartFilterKey | null>(null)

  const filteredCreatives = MOCK_CREATIVES.filter(c => c.spend >= minSpend)

  const getCellValue = (creativeId: string, copyId: string) => {
    const c = MOCK_CREATIVES.find(x => x.id === creativeId)!
    const cp = MOCK_COPIES.find(x => x.id === copyId)!
    const base = ((c.roas + cp.roas) / 2)
    const noise = (Math.sin(creativeId.charCodeAt(1) + copyId.charCodeAt(2)) + 1) * 1.2
    return parseFloat((base + noise).toFixed(2))
  }

  const isPositive = (val: number) => val >= 3.0
  const isLaunched = (cId: string, cpId: string) => parseInt(cId.slice(1)) + parseInt(cpId.slice(2)) < 6

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3">
        <div>
          <label className="text-xs text-gray-500 mr-2">Metrik:</label>
          <select
            value={selectedMetric}
            onChange={e => setSelectedMetric(e.target.value as typeof selectedMetric)}
            className="text-xs border border-gray-300 rounded-lg px-2 py-1 bg-white"
          >
            <option value="roas">ROAS</option>
            <option value="ctr">CTR</option>
            <option value="cpa">CPA</option>
          </select>
        </div>
        <div>
          <label className="text-xs text-gray-500 mr-2">Min Xarajat: ${minSpend}</label>
          <input
            type="range" min={0} max={2000} step={100}
            value={minSpend}
            onChange={e => setMinSpend(+e.target.value)}
            className="w-24 accent-indigo-600"
          />
        </div>
        <div className="flex gap-2">
          {(['age', 'gender', 'placement', 'funnel', 'country'] as SmartFilterKey[]).map(f => (
            <button
              key={f}
              onClick={() => setActiveSmartFilter(activeSmartFilter === f ? null : f)}
              className={`text-xs px-2.5 py-1 rounded-full border transition ${
                activeSmartFilter === f ? 'bg-indigo-600 text-white border-indigo-600' : 'border-gray-200 text-gray-600 hover:border-indigo-300'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Matrix */}
      <div className="overflow-auto">
        <table className="text-xs border-collapse">
          <thead>
            <tr>
              <th className="w-48 p-2 text-left text-gray-500 font-medium border-b border-r border-gray-200 bg-gray-50">
                Copy / Creative →
              </th>
              {filteredCreatives.map(c => (
                <th key={c.id} className="p-2 text-center border-b border-r border-gray-200 bg-gray-50 min-w-[90px]">
                  <div className="text-lg mb-0.5">{c.preview}</div>
                  <div className="text-[10px] font-medium text-gray-700 leading-tight">{c.name}</div>
                  <div className="text-[10px] text-gray-400">ROAS {c.roas}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {MOCK_COPIES.map(cp => (
              <tr key={cp.id}>
                <td className="p-2 border-b border-r border-gray-200 bg-gray-50">
                  <div className="text-[10px] font-medium text-gray-700 leading-tight truncate max-w-[176px]" title={cp.text}>
                    {cp.text.slice(0, 50)}...
                  </div>
                  <div className="text-[10px] text-gray-400 mt-0.5">ROAS {cp.roas} · {cp.length}</div>
                </td>
                {filteredCreatives.map(c => {
                  const val = getCellValue(c.id, cp.id)
                  const launched = isLaunched(c.id, cp.id)
                  const positive = isPositive(val)
                  return (
                    <td key={c.id} className="p-1 border-b border-r border-gray-200 text-center">
                      {launched ? (
                        <div className={`rounded-lg p-2 ${positive ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>
                          <div className="font-bold text-sm">{val}</div>
                          <div className="text-[9px]">{positive ? '✓ +ROI' : '✗ -ROI'}</div>
                        </div>
                      ) : (
                        <button className="w-full h-12 rounded-lg border-2 border-dashed border-gray-200 text-gray-400 hover:border-indigo-300 hover:text-indigo-500 transition text-lg font-bold">
                          +
                        </button>
                      )}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="text-xs text-gray-400 flex items-center gap-4">
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-emerald-100 inline-block border border-emerald-200"></span>Musbat ROI (launched)</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-red-100 inline-block border border-red-200"></span>Manfiy ROI (launched)</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded border-2 border-dashed border-gray-300 inline-block"></span>Yangi kombinatsiya qo'shish</span>
      </div>
    </div>
  )
}

// ─── Ads list view ────────────────────────────────────────────────────────────

function AdsView() {
  const [sort, setSort] = useState<'roas' | 'spend' | 'ctr'>('roas')
  const sorted = [...MOCK_CREATIVES].sort((a, b) => b[sort] - a[sort])

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-500">Saralash:</span>
        {(['roas', 'spend', 'ctr'] as const).map(s => (
          <button
            key={s}
            onClick={() => setSort(s)}
            className={`text-xs px-3 py-1 rounded-full transition ${sort === s ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
          >
            {s.toUpperCase()}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        {sorted.map(c => (
          <div key={c.id} className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-sm transition">
            <div className="text-4xl mb-3 text-center bg-gray-50 rounded-lg py-3">{c.preview}</div>
            <div className="text-sm font-semibold text-gray-900 mb-1">{c.name}</div>
            <div className="flex gap-1 mb-3 flex-wrap">
              <span className="text-[10px] px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded">{c.type}</span>
              <span className="text-[10px] px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded">{c.usedIn} ad da</span>
            </div>
            <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs">
              <div className="text-gray-500">ROAS</div><div className={`font-bold ${c.roas >= 3 ? 'text-emerald-700' : 'text-red-600'}`}>{c.roas}</div>
              <div className="text-gray-500">Xarajat</div><div className="font-medium">${c.spend}</div>
              <div className="text-gray-500">CTR</div><div className="font-medium">{c.ctr}%</div>
              <div className="text-gray-500">CPA</div><div className="font-medium">${c.cpa}</div>
            </div>
            <button className="w-full mt-3 py-1.5 text-xs border border-indigo-200 text-indigo-700 rounded-lg hover:bg-indigo-50 transition font-medium">
              Scale → Ad Setlarga qo'shish
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── New Ad Creator ───────────────────────────────────────────────────────────

function NewAdCreator() {
  const [adName, setAdName]             = useState('')
  const [primaryText, setPrimaryText]   = useState('')
  const [headline, setHeadline]         = useState('')
  const [description, setDescription]  = useState('')
  const [cta, setCta]                   = useState('SHOP_NOW')
  const [url, setUrl]                   = useState('')
  const [copies, setCopies]             = useState([''])
  const [saved, setSaved]               = useState(false)

  const addCopy = () => setCopies(prev => [...prev, ''])
  const updateCopy = (i: number, val: string) => setCopies(prev => prev.map((c, j) => j === i ? val : c))

  return (
    <div className="space-y-5 max-w-xl">
      <div>
        <label className="block text-xs font-semibold text-gray-700 mb-1">Ad nomi</label>
        <input value={adName} onChange={e => setAdName(e.target.value)} placeholder="Masalan: UGC Video - Short Copy - Apr" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-400 outline-none" />
      </div>

      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="text-xs font-semibold text-gray-700">Asosiy matn (Primary Text)</label>
          <button onClick={addCopy} className="text-xs text-indigo-600 hover:underline">+ Variant qo'shish (MTO)</button>
        </div>
        {copies.map((c, i) => (
          <div key={i} className="flex gap-2 mb-2">
            <textarea
              value={c} onChange={e => updateCopy(i, e.target.value)}
              placeholder="Reklama matni..."
              rows={2}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none focus:ring-2 focus:ring-indigo-400 outline-none"
            />
            {i > 0 && <button onClick={() => setCopies(p => p.filter((_, j) => j !== i))} className="text-gray-400 hover:text-red-500 text-lg">×</button>}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">Sarlavha (Headline)</label>
          <input value={headline} onChange={e => setHeadline(e.target.value)} placeholder="Sarlavha matni" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-400 outline-none" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">Tavsif (Description)</label>
          <input value={description} onChange={e => setDescription(e.target.value)} placeholder="Qisqacha tavsif" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-400 outline-none" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">CTA tugma</label>
          <select value={cta} onChange={e => setCta(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-indigo-400 outline-none">
            <option value="SHOP_NOW">Hozir sotib olish</option>
            <option value="LEARN_MORE">Ko'proq bilish</option>
            <option value="SIGN_UP">Ro'yxatdan o'tish</option>
            <option value="GET_QUOTE">Narx olish</option>
            <option value="CONTACT_US">Bog'lanish</option>
            <option value="BOOK_NOW">Band qilish</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">Destination URL</label>
          <input value={url} onChange={e => setUrl(e.target.value)} placeholder="https://..." className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-400 outline-none" />
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-xs text-blue-800">
        <strong>UTM teglari:</strong> ?utm_source=meta&utm_medium=paid&utm_campaign={adName || '{ad_nomi}'}
      </div>

      {saved ? (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-emerald-800 text-sm font-medium text-center">
          ✅ Ad saqlandi! "Ads" tabida ko'rishingiz mumkin.
        </div>
      ) : (
        <button
          onClick={() => setSaved(true)}
          disabled={!adName || !copies[0]}
          className="w-full py-2.5 bg-indigo-600 text-white rounded-lg font-semibold text-sm hover:bg-indigo-700 transition disabled:opacity-50"
        >
          Ad ni saqlash
        </button>
      )}
    </div>
  )
}

// ─── A/B Test Creator ─────────────────────────────────────────────────────────

function ABTestCreator() {
  const [baseAd, setBaseAd]     = useState<string | null>(null)
  const [variants, setVariants] = useState<string[]>([])

  return (
    <div className="space-y-4">
      <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 text-sm text-indigo-800">
        <strong>A/B Test qanday ishlaydi:</strong> Asosiy ad ni tanlang, uni ko'chirib, faqat kreativni o'zgartiring. Har bir variant alohida ad bo'ladi.
      </div>
      <div>
        <div className="text-sm font-semibold text-gray-700 mb-2">Asosiy ad tanlash:</div>
        <div className="grid grid-cols-3 gap-3">
          {MOCK_CREATIVES.map(c => (
            <button
              key={c.id}
              onClick={() => { setBaseAd(c.id); setVariants([]) }}
              className={`p-3 rounded-xl border text-left transition ${baseAd === c.id ? 'border-indigo-400 bg-indigo-50 ring-2 ring-indigo-200' : 'border-gray-200 hover:border-indigo-200'}`}
            >
              <div className="text-2xl mb-1">{c.preview}</div>
              <div className="text-xs font-medium text-gray-900">{c.name}</div>
              <div className="text-xs text-gray-400">ROAS {c.roas}</div>
            </button>
          ))}
        </div>
      </div>
      {baseAd && (
        <div>
          <div className="text-sm font-semibold text-gray-700 mb-2">Variant kreativlar tanlash (boshqa kreativlar bilan test):</div>
          <div className="grid grid-cols-3 gap-3">
            {MOCK_CREATIVES.filter(c => c.id !== baseAd).map(c => (
              <button
                key={c.id}
                onClick={() => setVariants(p => p.includes(c.id) ? p.filter(x => x !== c.id) : [...p, c.id])}
                className={`p-3 rounded-xl border text-left transition ${variants.includes(c.id) ? 'border-purple-400 bg-purple-50 ring-2 ring-purple-200' : 'border-gray-200 hover:border-purple-200'}`}
              >
                <div className="text-2xl mb-1">{c.preview}</div>
                <div className="text-xs font-medium text-gray-900">{c.name}</div>
                <div className="text-xs text-gray-400">ROAS {c.roas}</div>
              </button>
            ))}
          </div>
        </div>
      )}
      {variants.length > 0 && (
        <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
          <div className="text-sm font-semibold text-purple-800 mb-2">Test konfiguratsiyasi:</div>
          <div className="text-xs text-purple-700 space-y-1">
            <div>• Asosiy: {MOCK_CREATIVES.find(c => c.id === baseAd)?.name}</div>
            {variants.map(v => <div key={v}>• Variant: {MOCK_CREATIVES.find(c => c.id === v)?.name}</div>)}
            <div className="mt-2 text-purple-600">Har bir variant uchun alohida ad yaratiladi, bir xil copy bilan.</div>
          </div>
          <button className="mt-3 w-full py-2 bg-purple-600 text-white rounded-lg text-sm font-semibold hover:bg-purple-700 transition">
            🧪 A/B Test yaratish ({variants.length + 1} variant)
          </button>
        </div>
      )}
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

type TabKey = 'clusters' | 'ads' | 'new' | 'abtest' | 'posts'

const TABS: { key: TabKey; label: string }[] = [
  { key: 'clusters', label: '🎯 Creative Clusters' },
  { key: 'ads',      label: '📊 Ads' },
  { key: 'new',      label: '✏️ Yangi Ad' },
  { key: 'abtest',   label: '🧪 A/B Test' },
  { key: 'posts',    label: '📱 Posts → Ads' },
]

export default function AdLauncherPage() {
  const [activeTab, setActiveTab] = useState<TabKey>('clusters')

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Ad Launcher</h1>
        <p className="text-sm text-gray-500 mt-1">Creative Clusters orqali eng yaxshi kreativ + copy kombinatsiyalarini topib launch qiling</p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 gap-1 overflow-x-auto">
        {TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition whitespace-nowrap ${
              activeTab === tab.key ? 'border-indigo-600 text-indigo-700' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div>
        {activeTab === 'clusters' && <CreativeClusters />}
        {activeTab === 'ads'      && <AdsView />}
        {activeTab === 'new'      && <NewAdCreator />}
        {activeTab === 'abtest'   && <ABTestCreator />}
        {activeTab === 'posts'    && (
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-8 text-center text-gray-500">
            <div className="text-4xl mb-3">📱</div>
            <div className="font-semibold text-gray-700 mb-1">Instagram & Facebook Posts</div>
            <div className="text-sm">Meta akkauntingizni ulang — social proof bilan top postlarni reklamaga aylantiring</div>
            <button className="mt-4 px-5 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition">
              Meta ni ulash
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
