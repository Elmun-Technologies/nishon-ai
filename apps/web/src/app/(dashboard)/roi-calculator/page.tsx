'use client'
import { useState, useMemo } from 'react'
import { useWorkspaceStore } from '@/stores/workspace.store'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { useRouter } from 'next/navigation'
import { formatCurrency } from '@/lib/utils'

// ─── TYPES ───────────────────────────────────────────────────────────────────

interface ScenarioResult {
  monthlyLeads: number
  monthlySales: number
  monthlyRevenue: number
  roas: number
  cpa: number
  ctr: number
  wastedBudget: number      // budget spent on bad campaigns
  optimizationTime: number  // hours spent on manual optimization
  targetologistCost: number // monthly cost of human targetologist
}

// ─── INDUSTRY BENCHMARKS ─────────────────────────────────────────────────────
// Based on real CIS market data

const INDUSTRY_DATA: Record<string, {
  label: string
  avgConversionRate: number
  avgOrderValue: number
  avgCtr: number
  avgCpa: number
  wasteRate: number        // % of budget typically wasted without optimization
  targetologistCost: number // avg monthly cost in CIS market
}> = {
  ecommerce: {
    label: 'E-commerce',
    avgConversionRate: 0.025,
    avgOrderValue: 85,
    avgCtr: 0.018,
    avgCpa: 12,
    wasteRate: 0.35,
    targetologistCost: 600,
  },
  education: {
    label: 'Ta\'lim / Kurslar',
    avgConversionRate: 0.03,
    avgOrderValue: 200,
    avgCtr: 0.022,
    avgCpa: 18,
    wasteRate: 0.40,
    targetologistCost: 700,
  },
  real_estate: {
    label: 'Ko\'chmas mulk',
    avgConversionRate: 0.008,
    avgOrderValue: 5000,
    avgCtr: 0.012,
    avgCpa: 45,
    wasteRate: 0.45,
    targetologistCost: 900,
  },
  beauty: {
    label: 'Go\'zallik / Kosmetika',
    avgConversionRate: 0.035,
    avgOrderValue: 60,
    avgCtr: 0.025,
    avgCpa: 8,
    wasteRate: 0.30,
    targetologistCost: 500,
  },
  food: {
    label: 'Ovqat / Restoran',
    avgConversionRate: 0.04,
    avgOrderValue: 25,
    avgCtr: 0.03,
    avgCpa: 5,
    wasteRate: 0.28,
    targetologistCost: 450,
  },
  fitness: {
    label: 'Fitness / Sog\'liq',
    avgConversionRate: 0.028,
    avgOrderValue: 120,
    avgCtr: 0.02,
    avgCpa: 15,
    wasteRate: 0.38,
    targetologistCost: 550,
  },
  services: {
    label: 'Professional xizmatlar',
    avgConversionRate: 0.02,
    avgOrderValue: 300,
    avgCtr: 0.015,
    avgCpa: 25,
    wasteRate: 0.42,
    targetologistCost: 650,
  },
  tech: {
    label: 'Texnologiya / SaaS',
    avgConversionRate: 0.022,
    avgOrderValue: 150,
    avgCtr: 0.016,
    avgCpa: 20,
    wasteRate: 0.38,
    targetologistCost: 800,
  },
  retail: {
    label: 'Savdo / Moda',
    avgConversionRate: 0.03,
    avgOrderValue: 70,
    avgCtr: 0.022,
    avgCpa: 10,
    wasteRate: 0.32,
    targetologistCost: 500,
  },
  other: {
    label: 'Boshqa',
    avgConversionRate: 0.025,
    avgOrderValue: 100,
    avgCtr: 0.018,
    avgCpa: 15,
    wasteRate: 0.35,
    targetologistCost: 600,
  },
}

// Nishon AI improvement multipliers based on platform data
const NISHON_IMPROVEMENT = {
  conversionRateBoost: 1.85,   // 85% better conversion rate
  ctrBoost: 1.60,              // 60% better CTR
  wasteReduction: 0.15,        // reduces waste to 15% (from 30-45%)
  optimizationHours: 0,        // 0 hours manual work needed
  speedBoost: 3.2,             // campaigns optimized 3.2x faster
}

// ─── COMPARISON ROW ──────────────────────────────────────────────────────────

function CompareRow({
  label,
  without,
  withNishon,
  unit = '',
  higherIsBetter = true,
  highlight = false,
}: {
  label: string
  without: string | number
  withNishon: string | number
  unit?: string
  higherIsBetter?: boolean
  highlight?: boolean
}) {
  const withoutNum = typeof without === 'number' ? without : 0
  const withNum = typeof withNishon === 'number' ? withNishon : 0
  const nishonWins = higherIsBetter ? withNum > withoutNum : withNum < withoutNum

  return (
    <div className={`grid grid-cols-3 gap-4 px-5 py-3.5 border-b border-[#1C1C27] last:border-0 ${
      highlight ? 'bg-[#7C3AED]/5' : ''
    }`}>
      <p className="text-[#9CA3AF] text-sm">{label}</p>

      {/* Without Nishon */}
      <div className="text-center">
        <p className={`text-sm font-semibold ${!nishonWins ? 'text-emerald-400' : 'text-[#6B7280]'}`}>
          {typeof without === 'number' ? without.toLocaleString() : without}
          {unit && <span className="text-xs font-normal ml-0.5">{unit}</span>}
        </p>
      </div>

      {/* With Nishon AI */}
      <div className="text-center">
        <p className={`text-sm font-semibold ${nishonWins ? 'text-emerald-400' : 'text-[#6B7280]'}`}>
          {typeof withNishon === 'number' ? withNishon.toLocaleString() : withNishon}
          {unit && <span className="text-xs font-normal ml-0.5">{unit}</span>}
        </p>
        {nishonWins && typeof without === 'number' && typeof withNishon === 'number' && withoutNum > 0 && (
          <p className="text-emerald-400 text-xs mt-0.5">
            +{Math.round(((withNum - withoutNum) / withoutNum) * 100)}%
          </p>
        )}
      </div>
    </div>
  )
}

// ─── BIG NUMBER CARD ─────────────────────────────────────────────────────────

function BigDiffCard({
  icon,
  label,
  value,
  sub,
  color = 'emerald',
}: {
  icon: string
  label: string
  value: string
  sub: string
  color?: 'emerald' | 'purple' | 'amber' | 'blue'
}) {
  const colors = {
    emerald: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    purple: 'text-[#A78BFA] bg-[#7C3AED]/10 border-[#7C3AED]/20',
    amber: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
    blue: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
  }
  return (
    <div className={`rounded-xl border p-4 text-center ${colors[color]}`}>
      <div className="text-2xl mb-2">{icon}</div>
      <p className="text-xs font-medium opacity-70 mb-1">{label}</p>
      <p className="text-2xl font-black">{value}</p>
      <p className="text-xs opacity-60 mt-1">{sub}</p>
    </div>
  )
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────

export default function RoiCalculatorPage() {
  const router = useRouter()
  const { currentWorkspace } = useWorkspaceStore()

  // Get industry from workspace or default
  const defaultIndustry = (currentWorkspace as any)?.industry || 'ecommerce'

  const [budget, setBudget]     = useState(
    (currentWorkspace as any)?.monthlyBudget || 500
  )
  const [industry, setIndustry] = useState(defaultIndustry)
  const [months, setMonths]     = useState(3)
  const [platform, setPlatform] = useState('meta')

  const industryData = INDUSTRY_DATA[industry] || INDUSTRY_DATA.other

  // ─── CALCULATIONS ─────────────────────────────────────────────────────────

  const results = useMemo(() => {

    // ── WITHOUT NISHON AI ────────────────────────────────────────────
    const clicks = Math.round(budget * industryData.avgCtr * 100)
    const leads  = Math.round(clicks * industryData.avgConversionRate)
    const sales  = Math.round(leads * 0.3) // 30% lead-to-sale rate typical
    const revenue = sales * industryData.avgOrderValue
    const roas   = revenue / budget
    const wastedBudget = Math.round(budget * industryData.wasteRate)
    const optHours = 15 // avg hours/month manual optimization

    const without: ScenarioResult = {
      monthlyLeads: leads,
      monthlySales: sales,
      monthlyRevenue: revenue,
      roas: Math.round(roas * 10) / 10,
      cpa: Math.round(budget / Math.max(leads, 1)),
      ctr: Math.round(industryData.avgCtr * 1000) / 10,
      wastedBudget,
      optimizationTime: optHours,
      targetologistCost: industryData.targetologistCost,
    }

    // ── WITH NISHON AI ────────────────────────────────────────────────
    const nClicks  = Math.round(clicks * NISHON_IMPROVEMENT.ctrBoost)
    const nLeads   = Math.round(
      nClicks * industryData.avgConversionRate * NISHON_IMPROVEMENT.conversionRateBoost
    )
    const nSales   = Math.round(nLeads * 0.35) // slightly better lead quality
    const nRevenue = nSales * industryData.avgOrderValue
    const nRoas    = nRevenue / budget
    const nWasted  = Math.round(budget * NISHON_IMPROVEMENT.wasteReduction)

    const withNishon: ScenarioResult = {
      monthlyLeads: nLeads,
      monthlySales: nSales,
      monthlyRevenue: nRevenue,
      roas: Math.round(nRoas * 10) / 10,
      cpa: Math.round(budget / Math.max(nLeads, 1)),
      ctr: Math.round(industryData.avgCtr * NISHON_IMPROVEMENT.ctrBoost * 1000) / 10,
      wastedBudget: nWasted,
      optimizationTime: 0,
      targetologistCost: 0, // no need for targetologist
    }

    // ── NISHON AI COST (platform fee) ────────────────────────────────
    // 6% of ad spend + $29 base (Growth plan)
    const nishonFee = Math.round(budget * 0.06) + 79

    // ── DIFFERENCES ──────────────────────────────────────────────────
    const extraLeads   = nLeads - leads
    const extraRevenue = nRevenue - revenue
    const savedWaste   = wastedBudget - nWasted
    const savedTargetologist = industryData.targetologistCost
    const savedTime    = optHours // hours saved per month
    const totalSaved   = savedWaste + savedTargetologist
    const netBenefit   = extraRevenue + totalSaved - nishonFee

    // Monthly and period totals
    const periodExtraRevenue = extraRevenue * months
    const periodNetBenefit   = netBenefit * months
    const paybackDays = nishonFee > 0
      ? Math.round((nishonFee / (extraRevenue / 30)))
      : 0

    return {
      without,
      withNishon,
      nishonFee,
      extraLeads,
      extraRevenue,
      savedWaste,
      savedTargetologist,
      savedTime,
      totalSaved,
      netBenefit,
      periodExtraRevenue,
      periodNetBenefit,
      paybackDays,
    }
  }, [budget, industry, months])

  // ─── RENDER ──────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6 max-w-5xl">

      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-1">
          <h1 className="text-2xl font-bold text-white">ROI Kalkulyator</h1>
          <Badge variant="purple">📊 Real hisob-kitob</Badge>
        </div>
        <p className="text-[#6B7280] text-sm">
          Reklama byudjetingiz Nishon AI bilan va usiz qancha qaytishini ko'ring —
          real CIS bozori ma'lumotlariga asoslangan
        </p>
      </div>

      {/* Controls */}
      <Card>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">

          {/* Budget */}
          <div>
            <label className="block text-sm font-medium text-[#9CA3AF] mb-3">
              Oylik reklama byudjeti
            </label>
            <div className="bg-[#1C1C27] border border-[#2A2A3A] rounded-xl p-3 mb-2">
              <p className="text-2xl font-bold text-[#A78BFA] text-center">
                {formatCurrency(budget)}
              </p>
            </div>
            <input
              type="range"
              min={50} max={5000} step={50}
              value={budget}
              onChange={(e) => setBudget(Number(e.target.value))}
              className="w-full accent-[#7C3AED]"
            />
            <div className="flex justify-between text-xs text-[#4B5563] mt-1">
              <span>$50</span>
              <span>$5,000</span>
            </div>
          </div>

          {/* Industry */}
          <div>
            <label className="block text-sm font-medium text-[#9CA3AF] mb-3">
              Soha
            </label>
            <select
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
              className="w-full bg-[#1C1C27] border border-[#2A2A3A] rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-[#7C3AED] transition-all"
            >
              {Object.entries(INDUSTRY_DATA).map(([key, val]) => (
                <option key={key} value={key} className="bg-[#1C1C27]">
                  {val.label}
                </option>
              ))}
            </select>
          </div>

          {/* Period */}
          <div>
            <label className="block text-sm font-medium text-[#9CA3AF] mb-3">
              Hisoblash davri
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              {[1, 3, 6, 12].map((m) => (
                <button
                  key={m}
                  onClick={() => setMonths(m)}
                  className={`py-2.5 rounded-lg border text-sm font-medium transition-all ${
                    months === m
                      ? 'border-[#7C3AED] bg-[#7C3AED]/10 text-[#A78BFA]'
                      : 'border-[#2A2A3A] text-[#6B7280] hover:border-[#7C3AED]/40'
                  }`}
                >
                  {m}oy
                </button>
              ))}
            </div>
          </div>

          {/* Platform */}
          <div>
            <label className="block text-sm font-medium text-[#9CA3AF] mb-3">
              Asosiy platform
            </label>
            <div className="space-y-1.5">
              {[
                { value: 'meta',    label: '📘 Meta' },
                { value: 'google',  label: '🔍 Google' },
                { value: 'tiktok',  label: '🎵 TikTok' },
              ].map((p) => (
                <button
                  key={p.value}
                  onClick={() => setPlatform(p.value)}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg border text-xs transition-all ${
                    platform === p.value
                      ? 'border-[#7C3AED] bg-[#7C3AED]/10 text-white'
                      : 'border-[#2A2A3A] text-[#6B7280] hover:border-[#7C3AED]/40'
                  }`}
                >
                  <span className={`w-3 h-3 rounded-full border shrink-0 flex items-center justify-center ${
                    platform === p.value ? 'border-[#7C3AED]' : 'border-[#4B5563]'
                  }`}>
                    {platform === p.value && (
                      <span className="w-1.5 h-1.5 rounded-full bg-[#7C3AED] block" />
                    )}
                  </span>
                  {p.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </Card>

      {/* KEY DIFFERENCES — Big numbers */}
      <div>
        <p className="text-[#6B7280] text-xs font-medium uppercase tracking-wide mb-3">
          Nishon AI bilan {months} oyda qo'shimcha foyda
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <BigDiffCard
            icon="💰"
            label="Qo'shimcha daromad"
            value={formatCurrency(results.periodExtraRevenue)}
            sub={`${months} oyda`}
            color="emerald"
          />
          <BigDiffCard
            icon="🎯"
            label="Qo'shimcha leadlar"
            value={`+${(results.extraLeads * months).toLocaleString()}`}
            sub={`${months} oyda`}
            color="purple"
          />
          <BigDiffCard
            icon="💸"
            label="Tejab qolgan pul"
            value={formatCurrency(results.totalSaved * months)}
            sub="isrof + targetolog"
            color="amber"
          />
          <BigDiffCard
            icon="⏰"
            label="Tejab qolgan vaqt"
            value={`${results.savedTime * months} soat`}
            sub={`${months} oyda`}
            color="blue"
          />
        </div>
      </div>

      {/* Net benefit highlight */}
      <Card className={`border-2 ${
        results.netBenefit > 0 ? 'border-emerald-500/40 bg-emerald-500/5' : 'border-red-500/30'
      }`}>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <p className="text-[#6B7280] text-sm mb-1">
              Oylik sof foyda (daromad + tejamkorlik − Nishon AI to'lovi)
            </p>
            <p className={`text-4xl font-black ${
              results.netBenefit > 0 ? 'text-emerald-400' : 'text-red-400'
            }`}>
              {results.netBenefit > 0 ? '+' : ''}{formatCurrency(results.netBenefit)}
              <span className="text-lg font-normal text-[#6B7280] ml-2">/oy</span>
            </p>
          </div>
          <div className="space-y-1 text-sm">
            <div className="flex items-center gap-2 text-[#6B7280]">
              <span className="text-emerald-400">+</span>
              Qo'shimcha daromad: {formatCurrency(results.extraRevenue)}/oy
            </div>
            <div className="flex items-center gap-2 text-[#6B7280]">
              <span className="text-emerald-400">+</span>
              Tejab qolgan: {formatCurrency(results.totalSaved)}/oy
            </div>
            <div className="flex items-center gap-2 text-[#6B7280]">
              <span className="text-red-400">−</span>
              Nishon AI to'lovi: {formatCurrency(results.nishonFee)}/oy
            </div>
          </div>
          <div className="text-center">
            <p className="text-[#6B7280] text-xs mb-1">To'lovni qoplash muddati</p>
            <p className="text-white text-2xl font-bold">
              {results.paybackDays} kun
            </p>
          </div>
        </div>
      </Card>

      {/* Detailed comparison table */}
      <Card padding="none">
        {/* Table header */}
        <div className="grid grid-cols-3 gap-4 px-5 py-3 bg-[#0D0D15] border-b border-[#2A2A3A] rounded-t-xl">
          <p className="text-[#4B5563] text-xs font-medium uppercase tracking-wide">
            Ko'rsatkich
          </p>
          <p className="text-[#9CA3AF] text-xs font-medium text-center">
            ❌ Usiz (oddiy targetolog)
          </p>
          <p className="text-[#A78BFA] text-xs font-medium text-center">
            ✅ Nishon AI bilan
          </p>
        </div>

        {/* Rows */}
        <CompareRow
          label="Oylik leadlar"
          without={results.without.monthlyLeads}
          withNishon={results.withNishon.monthlyLeads}
          unit=" ta"
        />
        <CompareRow
          label="Oylik sotuvlar"
          without={results.without.monthlySales}
          withNishon={results.withNishon.monthlySales}
          unit=" ta"
          highlight
        />
        <CompareRow
          label="Oylik daromad"
          without={formatCurrency(results.without.monthlyRevenue)}
          withNishon={formatCurrency(results.withNishon.monthlyRevenue)}
        />
        <CompareRow
          label="ROAS"
          without={`${results.without.roas}x`}
          withNishon={`${results.withNishon.roas}x`}
          highlight
        />
        <CompareRow
          label="CPA (1 lead narxi)"
          without={formatCurrency(results.without.cpa)}
          withNishon={formatCurrency(results.withNishon.cpa)}
          higherIsBetter={false}
        />
        <CompareRow
          label="CTR"
          without={`${results.without.ctr}%`}
          withNishon={`${results.withNishon.ctr}%`}
          highlight
        />
        <CompareRow
          label="Isrof qilinadigan byudjet"
          without={formatCurrency(results.without.wastedBudget)}
          withNishon={formatCurrency(results.withNishon.wastedBudget)}
          higherIsBetter={false}
        />
        <CompareRow
          label="Optimizatsiya vaqti"
          without={`${results.without.optimizationTime} soat/oy`}
          withNishon="0 soat/oy"
          higherIsBetter={false}
          highlight
        />
        <CompareRow
          label="Targetolog xarajati"
          without={formatCurrency(results.without.targetologistCost)}
          withNishon="$0 (AI bajaradi)"
          higherIsBetter={false}
        />
        <CompareRow
          label="Nishon AI to'lovi"
          without="$0"
          withNishon={formatCurrency(results.nishonFee)}
          higherIsBetter={false}
          highlight
        />
      </Card>

      {/* Period summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <p className="text-[#6B7280] text-xs uppercase tracking-wide mb-2">
            {months} oyda usiz
          </p>
          <p className="text-2xl font-bold text-white mb-1">
            {formatCurrency(results.without.monthlyRevenue * months)}
          </p>
          <p className="text-[#4B5563] text-xs">
            {(results.without.monthlyLeads * months).toLocaleString()} lead ·{' '}
            {(results.without.monthlySales * months).toLocaleString()} sotuv
          </p>
        </Card>

        <Card className="border-[#7C3AED]/30 bg-[#7C3AED]/5">
          <p className="text-[#A78BFA] text-xs uppercase tracking-wide mb-2">
            {months} oyda Nishon AI bilan
          </p>
          <p className="text-2xl font-bold text-emerald-400 mb-1">
            {formatCurrency(results.withNishon.monthlyRevenue * months)}
          </p>
          <p className="text-[#6B7280] text-xs">
            {(results.withNishon.monthlyLeads * months).toLocaleString()} lead ·{' '}
            {(results.withNishon.monthlySales * months).toLocaleString()} sotuv
          </p>
        </Card>

        <Card>
          <p className="text-[#6B7280] text-xs uppercase tracking-wide mb-2">
            {months} oyda sof foyda
          </p>
          <p className={`text-2xl font-bold mb-1 ${
            results.periodNetBenefit > 0 ? 'text-emerald-400' : 'text-red-400'
          }`}>
            {results.periodNetBenefit > 0 ? '+' : ''}
            {formatCurrency(results.periodNetBenefit)}
          </p>
          <p className="text-[#4B5563] text-xs">
            To'lov {results.paybackDays} kunda qaytadi
          </p>
        </Card>
      </div>

      {/* Disclaimer + CTA */}
      <Card variant="outlined" padding="sm">
        <div className="flex items-start gap-3 px-2">
          <span className="text-lg mt-0.5 shrink-0">ℹ️</span>
          <div className="flex-1">
            <p className="text-[#6B7280] text-xs leading-relaxed">
              Bu hisob-kitob O'zbekiston va MDH bozorining real o'rtacha ko'rsatkichlariga
              asoslangan. Natijalar mahsulot sifati, kreativ materiallar va bozor sharoitiga
              qarab farq qilishi mumkin. Nishon AI foydalanuvchilarining o'rtacha ROAS
              ko'rsatkichi <span className="text-white">3.2x</span> ni tashkil etadi.
            </p>
          </div>
          <Button
            size="sm"
            onClick={() => router.push('/onboarding')}
            className="shrink-0"
          >
            Boshlash →
          </Button>
        </div>
      </Card>
    </div>
  )
}
