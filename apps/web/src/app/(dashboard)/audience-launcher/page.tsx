'use client'

import { useState } from 'react'

// ─── Pre-built Audience Data ──────────────────────────────────────────────────

type FunnelStage = 'prospecting' | 'reengagement' | 'retargeting' | 'retention'

interface Audience {
  id: string
  name: string
  description: string
  stage: FunnelStage
  type: 'lookalike' | 'custom' | 'interest' | 'broad' | 'retargeting' | 'retention'
  recommended?: boolean
  excludes?: string[]
}

const AUDIENCES: Audience[] = [
  // ── Acquisition Prospecting ──────────────────────────────────────────────
  { id: 'p1',  stage: 'prospecting', type: 'lookalike', recommended: true,  name: 'Video Addicts Lookalike', description: '95% video tomosha qilganlarning lookalike auditoriyasi' },
  { id: 'p2',  stage: 'prospecting', type: 'lookalike', recommended: true,  name: 'Super Lookalike', description: 'Top performing auditoriyalar kombinatsiyasidan kuchli lookalike' },
  { id: 'p3',  stage: 'prospecting', type: 'lookalike', recommended: true,  name: 'Top URL Visitors Lookalike', description: 'Muhim sahifalaringizga kirganlarning lookalike auditoriyasi' },
  { id: 'p4',  stage: 'prospecting', type: 'lookalike',                     name: 'Video Enthusiasts Lookalike', description: '75% video tomosha qilganlarning lookalike auditoriyasi' },
  { id: 'p5',  stage: 'prospecting', type: 'lookalike',                     name: 'Video Casuals Lookalike', description: '50% video tomosha qilganlarning lookalike auditoriyasi' },
  { id: 'p6',  stage: 'prospecting', type: 'lookalike',                     name: 'Instagram/Facebook Fans Lookalike', description: 'Sahifangizga muloqot qilganlarning lookalike auditoriyasi' },
  { id: 'p7',  stage: 'prospecting', type: 'lookalike',                     name: '10-sec Ad Watcher Lookalike', description: '10 soniyadan ko\'proq video reklamani ko\'rganlarning lookalike' },
  { id: 'p8',  stage: 'prospecting', type: 'lookalike',                     name: 'Website Lead Lookalike', description: 'Forma to\'ldirgan yoki newsletter obuna bo\'lganlarning lookalike' },
  { id: 'p9',  stage: 'prospecting', type: 'lookalike',                     name: 'Deep Browsers Lookalike', description: 'Saytda 8+ daqiqa o\'tkazganlarning lookalike auditoriyasi' },
  { id: 'p10', stage: 'prospecting', type: 'lookalike',                     name: 'Medium Browsers Lookalike', description: 'Saytda 3+ daqiqa o\'tkazganlarning lookalike auditoriyasi' },
  { id: 'p11', stage: 'prospecting', type: 'lookalike',                     name: 'Top Event Lookalike', description: 'Siz belgilagan maxsus event bajarganlarning lookalike' },
  { id: 'p12', stage: 'prospecting', type: 'lookalike',                     name: 'Infrequent Silver Customers Lookalike', description: 'Kam xarid qiluvchi past qiymatli mijozlar lookalike (eRFM)' },
  { id: 'p13', stage: 'prospecting', type: 'lookalike',                     name: 'Infrequent Gold Customers Lookalike', description: 'Kam xarid qiluvchi o\'rta qiymatli mijozlar lookalike (eRFM)' },
  { id: 'p14', stage: 'prospecting', type: 'lookalike',                     name: 'Infrequent Platinum Customers Lookalike', description: 'Kam xarid qiluvchi yuqori qiymatli mijozlar lookalike (eRFM)' },
  { id: 'p15', stage: 'prospecting', type: 'lookalike',                     name: 'Occasional Silver Customers Lookalike', description: 'Ba\'zan xarid qiluvchi past qiymatli mijozlar lookalike (eRFM)' },
  { id: 'p16', stage: 'prospecting', type: 'lookalike',                     name: 'Occasional Gold Customers Lookalike', description: 'Ba\'zan xarid qiluvchi o\'rta qiymatli mijozlar lookalike (eRFM)' },
  { id: 'p17', stage: 'prospecting', type: 'lookalike',                     name: 'Occasional Platinum Customers Lookalike', description: 'Ba\'zan xarid qiluvchi yuqori qiymatli mijozlar lookalike (eRFM)' },
  { id: 'p18', stage: 'prospecting', type: 'lookalike',                     name: 'Frequent Silver Customers Lookalike', description: 'Tez-tez xarid qiluvchi past qiymatli mijozlar lookalike (eRFM)' },
  { id: 'p19', stage: 'prospecting', type: 'lookalike',                     name: 'Frequent Gold Customers Lookalike', description: 'Tez-tez xarid qiluvchi o\'rta qiymatli mijozlar lookalike (eRFM)' },
  { id: 'p20', stage: 'prospecting', type: 'lookalike',                     name: 'Frequent Platinum Customers Lookalike', description: 'Tez-tez xarid qiluvchi yuqori qiymatli mijozlar lookalike (eRFM)' },
  { id: 'p21', stage: 'prospecting', type: 'lookalike',                     name: 'High-Intent Android Users Lookalike', description: 'Android qurilmasida yuqori niyat ko\'rsatganlarning lookalike' },
  { id: 'p22', stage: 'prospecting', type: 'lookalike',                     name: 'High-Intent iOS Users Lookalike', description: 'iOS qurilmasida yuqori niyat ko\'rsatganlarning lookalike' },
  { id: 'p23', stage: 'prospecting', type: 'lookalike',                     name: 'Infrequent Low-AOV Low-Intent Visitors Lookalike', description: 'Past chastotali, past AOV, past niyatli sayt tashrifulari lookalike' },
  { id: 'p24', stage: 'prospecting', type: 'lookalike',                     name: 'Infrequent High-AOV High-Intent Visitors Lookalike', description: 'Past chastotali, yuqori AOV, yuqori niyatli sayt tashrifulari lookalike' },
  { id: 'p25', stage: 'prospecting', type: 'lookalike',                     name: 'Occasional Low-AOV High-Intent Visitors Lookalike', description: 'O\'rta chastotali, past AOV, yuqori niyatli tashrifulari lookalike' },
  { id: 'p26', stage: 'prospecting', type: 'lookalike',                     name: 'Frequent High-AOV High-Intent Visitors Lookalike', description: 'Yuqori chastotali, yuqori AOV, yuqori niyatli tashrifulari lookalike' },
  { id: 'p27', stage: 'prospecting', type: 'lookalike',                     name: 'Category-Specific Purchaser Lookalike', description: 'Muayyan mahsulot kategoriyasidan xarid qilganlarning lookalike' },
  { id: 'p28', stage: 'prospecting', type: 'lookalike',                     name: 'Category-Specific High-Intent Visitor Lookalike', description: 'Muayyan kategoriyada yuqori niyat ko\'rsatgan tashrifulari lookalike' },
  { id: 'p29', stage: 'prospecting', type: 'lookalike',                     name: 'Top URL Purchaser Lookalike', description: 'Muhim URL lardan xarid qilganlarning lookalike auditoriyasi' },
  { id: 'p30', stage: 'prospecting', type: 'interest',  recommended: true,  name: 'Interest Targeting & Audience Mixes', description: 'Audience Studio\'da yaratilgan qiziqish va aralash auditoriyalar' },
  { id: 'p31', stage: 'prospecting', type: 'broad',     recommended: true,  name: 'Broad Targeting', description: 'Meta algoritmiga kim ko\'rishini hal qilishiga ruxsat berish' },

  // ── Acquisition Re-engagement ────────────────────────────────────────────
  { id: 'r1', stage: 'reengagement', type: 'custom', recommended: true,  name: 'Video Addicts (95%)', description: 'Kamida bitta videoning 95% ini ko\'rgan odamlar' },
  { id: 'r2', stage: 'reengagement', type: 'custom', recommended: true,  name: 'Social Media Engagers', description: 'Instagram yoki Facebook sahifangizga muloqot qilganlar' },
  { id: 'r3', stage: 'reengagement', type: 'custom', recommended: true,  name: 'Ad Watchers (3 sec)', description: 'Video reklamangizni kamida 3 soniya ko\'rgan odamlar' },
  { id: 'r4', stage: 'reengagement', type: 'custom',                    name: 'Video Enthusiasts (75%)', description: 'Kamida bitta videoning 75% ini ko\'rgan odamlar' },
  { id: 'r5', stage: 'reengagement', type: 'custom',                    name: 'Video Casuals (50%)', description: 'Kamida bitta videoning 50% ini ko\'rgan odamlar' },
  { id: 'r6', stage: 'reengagement', type: 'custom',                    name: 'Instagram Fans', description: 'Instagram sahifangizga muloqot qilgan odamlar' },
  { id: 'r7', stage: 'reengagement', type: 'custom',                    name: 'Facebook Fans', description: 'Facebook sahifangizga muloqot qilgan odamlar' },
  { id: 'r8', stage: 'reengagement', type: 'custom',                    name: 'Collection Ad Engagers', description: 'Collection yoki Instant Experience reklamangizga muloqot qilganlar' },

  // ── Retargeting ──────────────────────────────────────────────────────────
  { id: 't1',  stage: 'retargeting', type: 'retargeting', recommended: true,  name: 'All Visitors Last 30 Days', description: 'So\'nggi 30 kunda saytingizga tashrif buyurgan barcha odamlar' },
  { id: 't2',  stage: 'retargeting', type: 'retargeting', recommended: true,  name: 'High-Intent Visitors Last 30 Days', description: 'So\'nggi 30 kunda yuqori xarid niyati ko\'rsatgan sayt tashrifulari' },
  { id: 't3',  stage: 'retargeting', type: 'retargeting', recommended: true,  name: 'Custom Recency Visitors (0-3 Days)', description: 'So\'nggi 0-3 kunda saytga kirgan issiq auditoriya' },
  { id: 't4',  stage: 'retargeting', type: 'retargeting',                    name: 'Custom Recency Visitors (3-30 Days)', description: 'So\'nggi 3-30 kunda saytga kirgan auditoriya' },
  { id: 't5',  stage: 'retargeting', type: 'retargeting',                    name: 'All Visitors 30-180 Days', description: '30-180 kun oldin saytingizga kirgan barcha odamlar' },
  { id: 't6',  stage: 'retargeting', type: 'retargeting',                    name: 'High-Intent Visitors 30-180 Days', description: '30-180 kun oldin yuqori xarid niyati ko\'rsatgan tashrifulari' },
  { id: 't7',  stage: 'retargeting', type: 'retargeting',                    name: 'Multiple Visits (3+)', description: 'So\'nggi 30 kunda saytni kamida 3 marta tashrif buyurganlar' },
  { id: 't8',  stage: 'retargeting', type: 'retargeting',                    name: 'Deep Browsers (8+ min)', description: 'Saytda 8+ daqiqa o\'tkazgan odamlar' },
  { id: 't9',  stage: 'retargeting', type: 'retargeting',                    name: 'Medium Browsers (3+ min)', description: 'Saytda 3+ daqiqa o\'tkazgan odamlar' },
  { id: 't10', stage: 'retargeting', type: 'retargeting',                    name: 'Category-Specific High-Intent', description: 'Muayyan kategoriyada yuqori niyat ko\'rsatgan odamlar' },
  { id: 't11', stage: 'retargeting', type: 'retargeting',                    name: 'Top URL Low-Intent Visitors', description: 'Muhim URL larga kirib past niyat ko\'rsatgan odamlar' },
  { id: 't12', stage: 'retargeting', type: 'retargeting',                    name: 'Top URL High-Intent Visitors', description: 'Muhim URL larga kirib yuqori niyat ko\'rsatgan odamlar' },
  { id: 't13', stage: 'retargeting', type: 'retargeting',                    name: 'Website Leads', description: 'Forma to\'ldirgan yoki newsletter obuna bo\'lgan odamlar' },
  { id: 't14', stage: 'retargeting', type: 'retargeting',                    name: 'Top Events', description: 'Siz belgilagan maxsus eventni bajargan (yoki bajarmagan) odamlar' },

  // ── Retention ────────────────────────────────────────────────────────────
  { id: 'ret1', stage: 'retention', type: 'retention', recommended: true,  name: 'Basic Retention (180 Days)', description: 'So\'nggi 180 kunda xarid qilgan barcha odamlar' },
  { id: 'ret2', stage: 'retention', type: 'retention', recommended: true,  name: 'Fresh Customers (10 Days)', description: 'So\'nggi 10 kunda xarid qilgan yangi mijozlar' },
  { id: 'ret3', stage: 'retention', type: 'retention',                    name: 'Custom Recency Purchasers', description: 'Siz tanlagan vaqt ichida xarid qilganlar' },
  { id: 'ret4', stage: 'retention', type: 'retention',                    name: 'Reactivation (60-180 Days)', description: '60-180 kun oldin xarid qilgan, qayta jalb qilish kerak bo\'lgan mijozlar' },
  { id: 'ret5', stage: 'retention', type: 'retention',                    name: 'Top URL Purchasers', description: 'Muhim URL lardan xarid qilgan odamlar' },
  { id: 'ret6', stage: 'retention', type: 'retention',                    name: 'Category-Specific Purchasers', description: 'Muayyan kategoriyadan xarid qilgan odamlar' },
]

const STAGES: { key: FunnelStage; label: string; color: string; bg: string; border: string; desc: string; spend: string }[] = [
  { key: 'prospecting',  label: 'Acquisition Prospecting',    color: 'text-cyan-700',   bg: 'bg-cyan-50',   border: 'border-cyan-200', desc: 'Brendingizni hali bilmaydigan yangi auditoriya',              spend: '60%' },
  { key: 'reengagement', label: 'Acquisition Re-Engagement',  color: 'text-pink-700',   bg: 'bg-pink-50',   border: 'border-pink-200', desc: 'Kontentga tegilgan, lekin saytga kirmagan auditoriya',        spend: '20%' },
  { key: 'retargeting',  label: 'Retargeting',                color: 'text-blue-700',   bg: 'bg-blue-50',   border: 'border-blue-200', desc: 'Saytga kirgan, lekin xarid qilmagan issiq auditoriya',        spend: '15%' },
  { key: 'retention',    label: 'Retention',                  color: 'text-indigo-700', bg: 'bg-indigo-50', border: 'border-indigo-200', desc: 'Oldin xarid qilgan mavjud mijozlar',                        spend: '5%' },
]

type LaunchStep = 1 | 2 | 3

export default function AudienceLauncherPage() {
  const [activeStage, setActiveStage] = useState<FunnelStage>('prospecting')
  const [selected, setSelected]       = useState<Set<string>>(new Set())
  const [step, setStep]               = useState<LaunchStep>(1)
  const [campaignMode, setCampaignMode] = useState<'split' | 'single'>('split')
  const [campaignName, setCampaignName] = useState('')
  const [objective, setObjective]     = useState('OUTCOME_SALES')
  const [budgetType, setBudgetType]   = useState<'CBO' | 'ABO'>('CBO')
  const [launched, setLaunched]       = useState(false)

  const stageAudiences = AUDIENCES.filter(a => a.stage === activeStage)
  const selectedList   = AUDIENCES.filter(a => selected.has(a.id))

  const toggle = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const typeIcon = (type: Audience['type']) => {
    switch (type) {
      case 'lookalike': return '🔮'
      case 'custom':    return '👥'
      case 'interest':  return '🎯'
      case 'broad':     return '🌐'
      case 'retargeting': return '🔄'
      case 'retention': return '💎'
    }
  }

  if (launched) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center gap-6">
        <div className="text-6xl">🚀</div>
        <h2 className="text-2xl font-bold text-gray-900">Auditoriyalar muvaffaqiyatli launched!</h2>
        <p className="text-gray-500 max-w-md">
          {selectedList.length} ta auditoriya Meta Ads Manager da ad set sifatida yaratildi va kampaniyangizga qo'shildi.
        </p>
        <div className="flex gap-3">
          <button
            onClick={() => { setLaunched(false); setSelected(new Set()); setStep(1) }}
            className="px-5 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition"
          >
            Yangi auditoriyalar qo'shish
          </button>
          <button
            onClick={() => window.location.href = '/campaigns'}
            className="px-5 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition"
          >
            Kampaniyalarga o'tish
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Audience Launcher</h1>
          <p className="text-sm text-gray-500 mt-1">76 ta tayyor auditoriya bilan to'liq funnel strategiyasini bir necha klik bilan ishga tushiring</p>
        </div>
        {selected.size > 0 && (
          <button
            onClick={() => setStep(2)}
            className="px-5 py-2.5 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition flex items-center gap-2"
          >
            <span>{selected.size} auditoriya tanlandi</span>
            <span>→ Davom etish</span>
          </button>
        )}
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-2">
        {(['1. Auditoriyalar', '2. Kampaniya', '3. Launch'] as const).map((label, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${
              step === i + 1 ? 'bg-indigo-600 text-white' : step > i + 1 ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'
            }`}>
              {step > i + 1 ? '✓' : i + 1} {label}
            </div>
            {i < 2 && <span className="text-gray-300">›</span>}
          </div>
        ))}
      </div>

      {/* Step 1: Select audiences */}
      {step === 1 && (
        <div className="space-y-5">
          {/* Funnel stage info */}
          <div className="grid grid-cols-4 gap-3">
            {STAGES.map(s => (
              <button
                key={s.key}
                onClick={() => setActiveStage(s.key)}
                className={`p-3 rounded-xl border text-left transition ${
                  activeStage === s.key ? `${s.bg} ${s.border} border-2` : 'bg-white border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className={`text-xs font-bold mb-1 ${activeStage === s.key ? s.color : 'text-gray-700'}`}>{s.label}</div>
                <div className="text-xs text-gray-500 mb-2 leading-tight">{s.desc}</div>
                <div className={`text-xs font-semibold ${activeStage === s.key ? s.color : 'text-gray-400'}`}>Budget: {s.spend}</div>
              </button>
            ))}
          </div>

          {/* Exclusion notice */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-sm text-amber-800 flex items-start gap-2">
            <span className="mt-0.5">⚡</span>
            <span>
              <strong>Exclusions avtomatik o'rnatilgan:</strong> Acquisition auditoriyalar retargeting va retention larni chiqaradi. Retargeting auditoriyalar retention ni chiqaradi.
            </span>
          </div>

          {/* Audience cards */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-900">
                {STAGES.find(s => s.key === activeStage)?.label} auditoriyalari
                <span className="ml-2 text-sm font-normal text-gray-400">({stageAudiences.length} ta)</span>
              </h3>
              <div className="flex gap-2">
                <button
                  onClick={() => stageAudiences.filter(a => a.recommended).forEach(a => toggle(a.id))}
                  className="text-xs px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100 transition font-medium"
                >
                  ✨ Tavsiya etilganlarni tanlash
                </button>
                <button
                  onClick={() => stageAudiences.forEach(a => setSelected(p => { const n = new Set(p); n.add(a.id); return n }))}
                  className="text-xs px-3 py-1.5 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition"
                >
                  Barchasini tanlash
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {stageAudiences.map(audience => (
                <button
                  key={audience.id}
                  onClick={() => toggle(audience.id)}
                  className={`text-left p-4 rounded-xl border transition ${
                    selected.has(audience.id)
                      ? 'border-indigo-400 bg-indigo-50 ring-2 ring-indigo-200'
                      : 'border-gray-200 bg-white hover:border-indigo-200 hover:bg-indigo-50/30'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-base">{typeIcon(audience.type)}</span>
                        <span className="text-sm font-semibold text-gray-900 leading-tight">{audience.name}</span>
                        {audience.recommended && (
                          <span className="text-[10px] px-1.5 py-0.5 bg-emerald-100 text-emerald-700 rounded-full font-bold shrink-0">PRO</span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 leading-relaxed">{audience.description}</p>
                    </div>
                    <div className={`w-5 h-5 rounded-full border-2 shrink-0 mt-0.5 flex items-center justify-center transition ${
                      selected.has(audience.id) ? 'bg-indigo-600 border-indigo-600' : 'border-gray-300'
                    }`}>
                      {selected.has(audience.id) && <span className="text-white text-xs">✓</span>}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Step 2: Campaign Setup */}
      {step === 2 && (
        <div className="space-y-5 max-w-2xl">
          <h2 className="font-semibold text-gray-900 text-lg">Kampaniya sozlamalari</h2>

          {/* Selected audiences summary */}
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
            <div className="text-sm font-semibold text-gray-700 mb-2">Tanlangan auditoriyalar ({selectedList.length})</div>
            <div className="flex flex-wrap gap-2">
              {selectedList.map(a => (
                <span key={a.id} className="text-xs px-2.5 py-1 bg-white border border-gray-200 rounded-full text-gray-700">
                  {typeIcon(a.type)} {a.name}
                </span>
              ))}
            </div>
          </div>

          {/* Campaign mode */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Kampaniya turi</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setCampaignMode('split')}
                className={`p-4 rounded-xl border text-left transition ${campaignMode === 'split' ? 'border-indigo-400 bg-indigo-50 ring-2 ring-indigo-200' : 'border-gray-200 bg-white hover:border-indigo-200'}`}
              >
                <div className="font-semibold text-sm text-gray-900 mb-1">Funnel bo'yicha ajratish</div>
                <div className="text-xs text-gray-500">Har bir funnel bosqichi uchun alohida kampaniya</div>
              </button>
              <button
                onClick={() => setCampaignMode('single')}
                className={`p-4 rounded-xl border text-left transition ${campaignMode === 'single' ? 'border-indigo-400 bg-indigo-50 ring-2 ring-indigo-200' : 'border-gray-200 bg-white hover:border-indigo-200'}`}
              >
                <div className="font-semibold text-sm text-gray-900 mb-1">Bitta kampaniyaga</div>
                <div className="text-xs text-gray-500">Barcha ad setlarni bitta kampaniyaga qo'shish</div>
              </button>
            </div>
          </div>

          {/* Campaign name */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Kampaniya nomi</label>
            <input
              value={campaignName}
              onChange={e => setCampaignName(e.target.value)}
              placeholder="Masalan: Nishon - Prospecting - Apr 2026"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </div>

          {/* Objective */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Kampaniya maqsadi</label>
            <select
              value={objective}
              onChange={e => setObjective(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white"
            >
              <option value="OUTCOME_SALES">Sotuv (OUTCOME_SALES)</option>
              <option value="OUTCOME_LEADS">Lead (OUTCOME_LEADS)</option>
              <option value="OUTCOME_TRAFFIC">Trafik (OUTCOME_TRAFFIC)</option>
              <option value="OUTCOME_AWARENESS">Taniqlilik (OUTCOME_AWARENESS)</option>
              <option value="OUTCOME_ENGAGEMENT">Muloqot (OUTCOME_ENGAGEMENT)</option>
            </select>
          </div>

          {/* Budget optimization */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Byudjet optimizatsiyasi</label>
            <div className="grid grid-cols-2 gap-3">
              {(['CBO', 'ABO'] as const).map(b => (
                <button
                  key={b}
                  onClick={() => setBudgetType(b)}
                  className={`p-3 rounded-xl border text-left transition ${budgetType === b ? 'border-indigo-400 bg-indigo-50' : 'border-gray-200 bg-white hover:border-indigo-200'}`}
                >
                  <div className="font-semibold text-sm text-gray-900">{b}</div>
                  <div className="text-xs text-gray-500">{b === 'CBO' ? 'Kampaniya darajasida byudjet' : 'Ad set darajasida byudjet'}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button onClick={() => setStep(1)} className="px-5 py-2.5 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition">
              ← Orqaga
            </button>
            <button
              onClick={() => setStep(3)}
              disabled={!campaignName.trim()}
              className="px-5 py-2.5 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Davom etish →
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Launch summary */}
      {step === 3 && (
        <div className="space-y-5 max-w-2xl">
          <h2 className="font-semibold text-gray-900 text-lg">Launch xulosasi</h2>

          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="px-5 py-4 bg-gray-50 border-b border-gray-200">
              <div className="text-sm font-semibold text-gray-700">Kampaniya: {campaignName}</div>
              <div className="text-xs text-gray-500 mt-0.5">{objective} · {budgetType} · {campaignMode === 'split' ? 'Funnel bo\'yicha ajratilgan' : 'Bitta kampaniya'}</div>
            </div>
            <div className="divide-y divide-gray-100">
              {selectedList.map((a, i) => (
                <div key={a.id} className="px-5 py-3 flex items-center gap-3">
                  <span className="text-gray-400 text-xs w-5 text-right">{i + 1}</span>
                  <span className="text-base">{typeIcon(a.type)}</span>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-900">{a.name}</div>
                    <div className="text-xs text-gray-500">{STAGES.find(s => s.key === a.stage)?.label}</div>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    a.stage === 'prospecting' ? 'bg-cyan-50 text-cyan-700' :
                    a.stage === 'reengagement' ? 'bg-pink-50 text-pink-700' :
                    a.stage === 'retargeting' ? 'bg-blue-50 text-blue-700' : 'bg-indigo-50 text-indigo-700'
                  }`}>
                    Ad Set {i + 1}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-5 py-4 text-sm text-emerald-800">
            <div className="font-semibold mb-1">✅ Tayyor!</div>
            <div>{selectedList.length} ta ad set yaratiladi. Exclusionlar avtomatik o'rnatilgan. Launch tugmasini bosing.</div>
          </div>

          <div className="flex gap-3">
            <button onClick={() => setStep(2)} className="px-5 py-2.5 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition">
              ← Orqaga
            </button>
            <button
              onClick={() => setLaunched(true)}
              className="px-8 py-2.5 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition flex items-center gap-2"
            >
              🚀 Launch
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
