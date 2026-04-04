'use client'

import { useEffect, useState, useCallback } from 'react'
import { useWorkspaceStore } from '@/stores/workspace.store'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Alert } from '@/components/ui/Alert'
import { meta as metaApi } from '@/lib/api-client'
import { formatCurrency, formatNumber } from '@/lib/utils'

// ─── Types ────────────────────────────────────────────────────────────────────

interface CampaignMetrics {
  spend: number
  clicks: number
  impressions: number
  ctr: number
  cpc: number
}

interface ReportCampaign {
  id: string
  name: string
  status: string
  objective: string | null
  tags?: string[]
  metrics: CampaignMetrics
}

interface ReportAccount {
  id: string
  name: string
  currency: string
  timezone: string | null
  metrics: CampaignMetrics
  campaigns: ReportCampaign[]
}

interface ReportData {
  workspaceId: string
  days: number
  accounts: ReportAccount[]
}

interface AccountGradeBreakdown {
  wastedSpend: number
  qualityScore: number
  impressionShare: number
  accountActivity: number
}

interface AccountGradeResult {
  overall: number
  level: 'Foundational' | 'Intermediate' | 'Advanced' | 'Elite'
  breakdown: AccountGradeBreakdown
  recommendations: string[]
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const STATUS_STYLE: Record<string, string> = {
  ACTIVE:   'text-emerald-400 bg-emerald-400/10',
  PAUSED:   'text-amber-400 bg-amber-400/10',
  DELETED:  'text-red-400 bg-red-400/10',
  ARCHIVED: 'text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800',
}

function MetricCell({ value, className = '' }: { value: string; className?: string }) {
  return (
    <td className={`px-3 py-2.5 text-right text-sm font-medium text-slate-900 dark:text-slate-50 tabular-nums ${className}`}>
      {value}
    </td>
  )
}

function downloadCSV(csv: string, filename: string) {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

const DAY_OPTIONS = [7, 14, 30, 60, 90]

const AVAILABLE_METRICS = [
  { id: 'roas',        label: 'ROAS',           icon: '💰', value: '2.4x',     trend: '+0.3x',  positive: true  },
  { id: 'cpa',         label: 'CPA',             icon: '🎯', value: '$18.50',   trend: '-$2.1',  positive: true  },
  { id: 'ctr',         label: 'CTR',             icon: '📊', value: '2.14%',    trend: '+0.4%',  positive: true  },
  { id: 'frequency',   label: 'Chastota',        icon: '🔁', value: '3.2x',     trend: '+0.8x',  positive: false },
  { id: 'cpm',         label: 'CPM',             icon: '👁️', value: '$8.40',    trend: '-$1.2',  positive: true  },
  { id: 'reach',       label: 'Reach',           icon: '📡', value: '12,400',   trend: '+2,100', positive: true  },
  { id: 'leads',       label: 'Lidlar',          icon: '🙋', value: '84',       trend: '+12',    positive: true  },
  { id: 'conv_rate',   label: 'Konversiya %',    icon: '✅', value: '4.8%',     trend: '+0.6%',  positive: true  },
]

const GRADE_LEVELS = [
  { min: 85, label: 'Elite', color: 'text-emerald-500', badge: 'bg-emerald-50 border-emerald-200 text-emerald-700' },
  { min: 70, label: 'Advanced', color: 'text-lime-500', badge: 'bg-lime-50 border-lime-200 text-lime-700' },
  { min: 50, label: 'Intermediate', color: 'text-amber-500', badge: 'bg-amber-50 border-amber-200 text-amber-700' },
  { min: 0, label: 'Foundational', color: 'text-rose-500', badge: 'bg-rose-50 border-rose-200 text-rose-700' },
] as const

function clamp(value: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, value))
}

function computeAccountGrade(account: ReportAccount): AccountGradeResult {
  const totalCampaigns = account.campaigns.length
  const activeCampaigns = account.campaigns.filter((c) => c.status === 'ACTIVE').length
  const activeRatio = totalCampaigns > 0 ? activeCampaigns / totalCampaigns : 0

  const ctrScore = clamp(account.metrics.ctr * 25)
  const cpcScore = clamp(100 - account.metrics.cpc * 12)
  const wastedSpend = clamp((ctrScore * 0.55) + (cpcScore * 0.45))

  const qualityScore = clamp((ctrScore * 0.7) + (activeRatio * 100 * 0.3))

  const impressionVolumeScore = clamp(Math.log10(account.metrics.impressions + 1) * 20)
  const impressionShare = clamp((account.metrics.ctr * 20 * 0.6) + (impressionVolumeScore * 0.4))

  const activityFromCount = clamp(totalCampaigns * 14)
  const activityFromClicks = clamp(Math.log10(account.metrics.clicks + 1) * 35)
  const accountActivity = clamp((activeRatio * 100 * 0.45) + (activityFromCount * 0.3) + (activityFromClicks * 0.25))

  const overall = Math.round(
    wastedSpend * 0.2 +
    qualityScore * 0.35 +
    impressionShare * 0.2 +
    accountActivity * 0.25,
  )

  const level = GRADE_LEVELS.find((g) => overall >= g.min)?.label ?? 'Foundational'
  const recommendations: string[] = []

  if (qualityScore < 55) recommendations.push('CTR ni oshirish uchun ad copy va creative A/B testlarni ko‘paytiring.')
  if (wastedSpend < 55) recommendations.push('Past CTR yoki yuqori CPC kampaniyalarda negative audience/placement tozalash qiling.')
  if (impressionShare < 55) recommendations.push('Byudjet va bid strategiyasini ko‘rib chiqing, yetarli impression olishga fokus qiling.')
  if (accountActivity < 55) recommendations.push('Haftalik optimizatsiya routine kiriting: pause, scale, audience refresh.')
  if (recommendations.length === 0) recommendations.push('Akkount holati yaxshi: eng kuchli kampaniyalarni scale qilishni davom ettiring.')

  return {
    overall,
    level,
    breakdown: {
      wastedSpend: Math.round(wastedSpend),
      qualityScore: Math.round(qualityScore),
      impressionShare: Math.round(impressionShare),
      accountActivity: Math.round(accountActivity),
    },
    recommendations,
  }
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ReportingPage() {
  const { currentWorkspace } = useWorkspaceStore()
  const [data, setData] = useState<ReportData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [days, setDays] = useState(30)
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const [exporting, setExporting] = useState(false)
  // Tags: map of campaignId → current tags
  const [campaignTags, setCampaignTags] = useState<Record<string, string[]>>({})
  const [editingTagId, setEditingTagId] = useState<string | null>(null)
  const [tagInput, setTagInput] = useState('')
  // Custom metrics panel
  const [activeMetrics, setActiveMetrics] = useState<string[]>(['roas', 'cpa', 'ctr', 'frequency'])
  const [showSimulation, setShowSimulation] = useState(false)
  const [simBudget, setSimBudget] = useState(1500)

  const load = useCallback(() => {
    if (!currentWorkspace?.id) return
    setLoading(true)
    setError('')
    metaApi.reporting(currentWorkspace.id, days)
      .then((res) => {
        const d = res.data as ReportData
        setData(d)
        // Auto-expand first account
        if (d.accounts.length > 0) {
          setExpanded(new Set([d.accounts[0].id]))
        }
      })
      .catch(() => setError('Hisobotni yuklashda xatolik. Meta Ads ulanganligini tekshiring.'))
      .finally(() => setLoading(false))
  }, [currentWorkspace?.id, days])

  useEffect(() => { load() }, [load])

  async function handleExport() {
    if (!currentWorkspace?.id) return
    setExporting(true)
    try {
      const res = await metaApi.exportReporting(currentWorkspace.id, days)
      const { csv, filename } = res.data as { csv: string; filename: string }
      downloadCSV(csv, filename)
    } catch {
      setError('CSV eksportda xatolik')
    } finally {
      setExporting(false)
    }
  }

  async function saveTag(campaignId: string, newTag: string) {
    if (!currentWorkspace?.id || !newTag.trim()) return
    const current = campaignTags[campaignId] ?? []
    if (current.includes(newTag.trim())) return
    const next = [...current, newTag.trim()]
    setCampaignTags((prev) => ({ ...prev, [campaignId]: next }))
    setTagInput('')
    try {
      await metaApi.setTags(campaignId, currentWorkspace.id, next)
    } catch {
      // revert
      setCampaignTags((prev) => ({ ...prev, [campaignId]: current }))
    }
  }

  async function removeTag(campaignId: string, tag: string) {
    if (!currentWorkspace?.id) return
    const current = campaignTags[campaignId] ?? []
    const next = current.filter((t) => t !== tag)
    setCampaignTags((prev) => ({ ...prev, [campaignId]: next }))
    try {
      await metaApi.setTags(campaignId, currentWorkspace.id, next)
    } catch {
      setCampaignTags((prev) => ({ ...prev, [campaignId]: current }))
    }
  }

  function toggleExpand(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  // Roll up totals across all accounts
  const totals = data?.accounts.reduce(
    (acc, a) => ({
      spend:       acc.spend + a.metrics.spend,
      clicks:      acc.clicks + a.metrics.clicks,
      impressions: acc.impressions + a.metrics.impressions,
    }),
    { spend: 0, clicks: 0, impressions: 0 },
  )

  const accountGrades = new Map(
    (data?.accounts ?? []).map((account) => [account.id, computeAccountGrade(account)]),
  )

  if (!currentWorkspace) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-slate-500 dark:text-slate-400">Workspace tanlanmagan</p>
      </div>
    )
  }

  return (
    <div className="space-y-5 max-w-6xl">

      {/* ── Header ── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-50 flex items-center gap-2">
            📊 Hisobot
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">
            Meta Ads — Account → Kampaniya darajasida ko'rsatkichlar
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Date range selector */}
          <div className="flex items-center gap-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-1">
            {DAY_OPTIONS.map((d) => (
              <button
                key={d}
                onClick={() => setDays(d)}
                className={`
                  px-3 py-1.5 rounded-lg text-xs font-medium transition-colors
                  ${days === d
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:text-slate-50'
                  }
                `}
              >
                {d}k
              </button>
            ))}
          </div>

          <Button
            variant="secondary"
            size="sm"
            onClick={handleExport}
            loading={exporting}
          >
            ↓ CSV Export
          </Button>
        </div>
      </div>

      {error && <Alert variant="error">{error}</Alert>}

      {/* ── Summary cards ── */}
      {totals && !loading && (
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Jami Xarajat', value: formatCurrency(totals.spend) },
            { label: 'Jami Kliklar', value: formatNumber(totals.clicks) },
            { label: 'Jami Ko\'rinishlar', value: formatNumber(totals.impressions) },
          ].map((item) => (
            <div key={item.label} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-4">
              <p className="text-slate-500 dark:text-slate-400 text-xs mb-1">{item.label}</p>
              <p className="text-slate-900 dark:text-slate-50 text-lg font-bold">{item.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* ── Custom Metrics Panel ── */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-50 flex items-center gap-2">
            📌 Mening Ko'rsatkichlarim
            <span className="text-xs text-slate-400 dark:text-slate-500 font-normal">— keraklisini tanlang</span>
          </h2>
          <div className="flex gap-1 flex-wrap justify-end">
            {AVAILABLE_METRICS.map((m) => (
              <button
                key={m.id}
                onClick={() => setActiveMetrics((prev) =>
                  prev.includes(m.id) ? prev.filter((x) => x !== m.id) : [...prev, m.id]
                )}
                className={`text-xs px-2.5 py-1 rounded-full border transition-all ${
                  activeMetrics.includes(m.id)
                    ? 'bg-slate-900 text-white border-slate-900'
                    : 'bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:border-slate-600'
                }`}
              >
                {m.icon} {m.label}
              </button>
            ))}
          </div>
        </div>

        {activeMetrics.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {AVAILABLE_METRICS.filter((m) => activeMetrics.includes(m.id)).map((m) => (
              <div key={m.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-4 relative group">
                <button
                  onClick={() => setActiveMetrics((prev) => prev.filter((x) => x !== m.id))}
                  className="absolute top-2 right-2 text-slate-300 hover:text-slate-400 dark:text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity text-xs leading-none"
                >
                  ×
                </button>
                <p className="text-slate-500 dark:text-slate-400 text-xs mb-1">{m.icon} {m.label}</p>
                <p className="text-slate-900 dark:text-slate-50 text-xl font-bold">{m.value}</p>
                <p className={`text-xs mt-0.5 ${m.positive ? 'text-emerald-500' : 'text-red-400'}`}>
                  {m.trend} vs oldingi davr
                </p>
              </div>
            ))}
          </div>
        ) : (
          <div className="border border-dashed border-slate-200 dark:border-slate-700 rounded-xl p-6 text-center">
            <p className="text-slate-400 dark:text-slate-500 text-sm">Yuqoridan ko'rsatkichlarni tanlang</p>
          </div>
        )}
      </div>

      {/* ── Budget Simulation ── */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
        <button
          onClick={() => setShowSimulation(!showSimulation)}
          className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-slate-50 dark:bg-slate-800/50 transition-colors"
        >
          <div className="flex items-center gap-2">
            <span>🔮</span>
            <span className="text-slate-900 dark:text-slate-50 font-medium text-sm">Byudjet Simulyatsiyasi</span>
            <span className="text-xs text-slate-400 dark:text-slate-500">— byudjet o'zgartirsa nima bo'ladi?</span>
          </div>
          <span className={`text-slate-500 dark:text-slate-400 text-sm transition-transform duration-200 ${showSimulation ? 'rotate-180' : ''}`}>▾</span>
        </button>

        {showSimulation && (
          <div className="px-5 pb-5 border-t border-slate-200 dark:border-slate-700">
            <div className="pt-4 space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm text-slate-700 dark:text-slate-300 font-medium">Oylik byudjet</label>
                  <span className="text-slate-900 dark:text-slate-50 font-bold text-lg">${simBudget.toLocaleString()}</span>
                </div>
                <input
                  type="range"
                  min={500}
                  max={10000}
                  step={100}
                  value={simBudget}
                  onChange={(e) => setSimBudget(parseInt(e.target.value))}
                  className="w-full accent-slate-900"
                />
                <div className="flex justify-between text-xs text-slate-400 dark:text-slate-500 mt-1">
                  <span>$500</span><span>$10,000</span>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: 'Pessimistik', mult: 0.65, color: 'text-red-500', bg: 'bg-red-50 border-red-100' },
                  { label: 'Realistik',   mult: 1.0,  color: 'text-slate-700 dark:text-slate-300', bg: 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700' },
                  { label: 'Optimistik',  mult: 1.35, color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-100' },
                ].map((s) => (
                  <div key={s.label} className={`border rounded-xl p-3 ${s.bg}`}>
                    <p className="text-slate-500 dark:text-slate-400 text-xs mb-2">{s.label}</p>
                    <p className={`text-lg font-bold ${s.color}`}>{Math.round(simBudget / 18.5 * s.mult)} lid</p>
                    <p className="text-slate-400 dark:text-slate-500 text-xs">ROAS: {(2.4 * s.mult).toFixed(1)}x</p>
                    <p className="text-slate-400 dark:text-slate-500 text-xs">CPA: ${(18.5 / s.mult).toFixed(0)}</p>
                  </div>
                ))}
              </div>
              <p className="text-slate-400 dark:text-slate-500 text-xs">* Hisoblash joriy kampaniyalar ko'rsatkichlariga asoslangan</p>
            </div>
          </div>
        )}
      </div>

      {/* ── Table ── */}
      <Card padding="none">
        {loading ? (
          <div className="space-y-px">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-12 bg-white dark:bg-slate-900 animate-pulse" style={{ opacity: 1 - i * 0.15 }} />
            ))}
          </div>
        ) : !data || data.accounts.length === 0 ? (
          <div className="text-center py-16 px-6">
            <span className="text-4xl block mb-3">📊</span>
            <p className="text-slate-900 dark:text-slate-50 font-semibold mb-1">Ma'lumot yo'q</p>
            <p className="text-slate-500 dark:text-slate-400 text-sm">
              Meta Ads ulanmagan yoki bu davr uchun ma'lumot mavjud emas.
            </p>
            <Button
              variant="secondary"
              size="sm"
              className="mt-4"
              onClick={() => window.location.href = '/settings/meta'}
            >
              Meta Ads ulash →
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              {/* Table header */}
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide w-full">
                    Kanal / Kampaniya
                  </th>
                  <th className="px-3 py-3 text-right text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide whitespace-nowrap">
                    Status
                  </th>
                  <th className="px-3 py-3 text-right text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide whitespace-nowrap">
                    Xarajat
                  </th>
                  <th className="px-3 py-3 text-right text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide whitespace-nowrap">
                    Kliklar
                  </th>
                  <th className="px-3 py-3 text-right text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide whitespace-nowrap">
                    Ko'rinish
                  </th>
                  <th className="px-3 py-3 text-right text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide whitespace-nowrap">
                    CTR
                  </th>
                  <th className="px-3 py-3 text-right text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide whitespace-nowrap">
                    CPC
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-[#1C1C27]">
                {data.accounts.map((account) => {
                  const isOpen = expanded.has(account.id)
                  const grade = accountGrades.get(account.id)!
                  const levelStyle = GRADE_LEVELS.find((g) => g.label === grade.level) ?? GRADE_LEVELS[3]
                  return (
                    <>
                      {/* ── Account row ── */}
                      <tr
                        key={account.id}
                        className="bg-slate-50 dark:bg-slate-800/50 hover:bg-white dark:bg-slate-900 cursor-pointer transition-colors"
                        onClick={() => toggleExpand(account.id)}
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            {/* Meta icon */}
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="#1877F2">
                              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                            </svg>
                            <span className="text-slate-900 dark:text-slate-50 font-semibold text-sm">{account.name}</span>
                            <span className="text-slate-500 dark:text-slate-400 text-xs">{account.id}</span>
                            <span className="text-slate-500 dark:text-slate-400 text-xs ml-1">
                              {account.campaigns.length} kampaniya
                            </span>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full border ml-2 ${levelStyle.badge}`}>
                              {grade.overall}/100 • {grade.level}
                            </span>
                            {/* Expand chevron */}
                            <span className={`text-slate-500 dark:text-slate-400 ml-auto transition-transform duration-200 ${isOpen ? 'rotate-90' : ''}`}>
                              ›
                            </span>
                          </div>
                        </td>
                        <td className="px-3 py-3 text-right">
                          <span className="text-xs text-slate-500 dark:text-slate-400">—</span>
                        </td>
                        <MetricCell value={formatCurrency(account.metrics.spend)} />
                        <MetricCell value={formatNumber(account.metrics.clicks)} />
                        <MetricCell value={formatNumber(account.metrics.impressions)} />
                        <MetricCell value={`${account.metrics.ctr.toFixed(2)}%`} className="text-slate-700 dark:text-slate-300" />
                        <MetricCell value={formatCurrency(account.metrics.cpc)} />
                      </tr>

                      {/* ── Account grading detail ── */}
                      {isOpen && (
                        <tr className="bg-slate-50 dark:bg-slate-800/50">
                          <td colSpan={7} className="px-4 py-3 border-b border-slate-100">
                            <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-4">
                              <div className="flex items-center justify-between gap-3 flex-wrap mb-3">
                                <div>
                                  <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide">Account Grading</p>
                                  <p className="text-sm text-slate-900 dark:text-slate-50 font-semibold">Har bir account bo‘yicha 4 ta asosiy signal</p>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className={`text-xs px-2 py-1 rounded-full border ${levelStyle.badge}`}>{grade.level}</span>
                                  <span className={`text-xl font-black ${levelStyle.color}`}>{grade.overall}</span>
                                </div>
                              </div>

                              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-3">
                                {[
                                  { key: 'Wasted Spend', value: grade.breakdown.wastedSpend },
                                  { key: 'Quality Score', value: grade.breakdown.qualityScore },
                                  { key: 'Impression Share', value: grade.breakdown.impressionShare },
                                  { key: 'Account Activity', value: grade.breakdown.accountActivity },
                                ].map((item) => (
                                  <div key={item.key} className="rounded-lg border border-slate-200 dark:border-slate-700 p-2.5">
                                    <p className="text-[11px] text-slate-500 dark:text-slate-400">{item.key}</p>
                                    <p className="text-base font-bold text-slate-900 dark:text-slate-50">{item.value}/100</p>
                                    <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 mt-2 overflow-hidden">
                                      <div
                                        className={`h-full rounded-full ${
                                          item.value >= 70 ? 'bg-emerald-400' : item.value >= 50 ? 'bg-amber-400' : 'bg-rose-400'
                                        }`}
                                        style={{ width: `${item.value}%` }}
                                      />
                                    </div>
                                  </div>
                                ))}
                              </div>

                              <div className="rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-100 p-3">
                                <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Tavsiya:</p>
                                <ul className="space-y-1">
                                  {grade.recommendations.map((tip) => (
                                    <li key={tip} className="text-xs text-slate-500 dark:text-slate-400">• {tip}</li>
                                  ))}
                                </ul>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}

                      {/* ── Campaign rows (expandable) ── */}
                      {isOpen && account.campaigns.map((campaign) => (
                        <tr
                          key={campaign.id}
                          className="bg-white dark:bg-slate-900 hover:bg-slate-50 dark:bg-slate-800/50 transition-colors"
                        >
                          <td className="px-4 py-2.5">
                            <div className="flex items-center gap-2 pl-6">
                              {/* Indent line */}
                              <span className="w-px h-4 bg-slate-100 dark:bg-slate-800 shrink-0" />
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="text-slate-500 dark:text-slate-400 shrink-0">
                                <path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
                              </svg>
                              <span className="text-slate-700 dark:text-slate-300 text-sm">{campaign.name}</span>
                              {campaign.objective && (
                                <span className="text-[10px] text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 px-1.5 py-0.5 rounded">
                                  {campaign.objective.replace('OUTCOME_', '')}
                                </span>
                              )}
                            </div>
                            {/* Tags row */}
                            <div className="pl-14 flex items-center gap-1.5 flex-wrap mt-1">
                              {(campaignTags[campaign.id] ?? campaign.tags ?? []).map((tag) => (
                                <span key={tag} className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-600">
                                  {tag}
                                  <button onClick={() => removeTag(campaign.id, tag)} className="hover:text-red-400 leading-none">×</button>
                                </span>
                              ))}
                              {editingTagId === campaign.id ? (
                                <input
                                  autoFocus
                                  value={tagInput}
                                  onChange={(e) => setTagInput(e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') saveTag(campaign.id, tagInput)
                                    if (e.key === 'Escape') setEditingTagId(null)
                                  }}
                                  onBlur={() => setEditingTagId(null)}
                                  placeholder="teg nomi..."
                                  className="text-[10px] px-2 py-0.5 rounded-full bg-white dark:bg-slate-900 border border-slate-900 text-slate-900 dark:text-slate-50 placeholder-slate-400 outline-none w-24"
                                />
                              ) : (
                                <button
                                  onClick={() => { setEditingTagId(campaign.id); setTagInput('') }}
                                  className="text-[10px] text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:text-slate-300 border border-dashed border-slate-200 dark:border-slate-700 hover:border-slate-900 px-2 py-0.5 rounded-full transition-colors"
                                >
                                  + teg
                                </button>
                              )}
                            </div>
                          </td>
                          <td className="px-3 py-2.5 text-right">
                            <span className={`text-[10px] px-2 py-0.5 rounded font-medium ${STATUS_STYLE[campaign.status] ?? 'text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800'}`}>
                              {campaign.status}
                            </span>
                          </td>
                          <MetricCell value={formatCurrency(campaign.metrics.spend)} />
                          <MetricCell value={formatNumber(campaign.metrics.clicks)} />
                          <MetricCell value={formatNumber(campaign.metrics.impressions)} />
                          <MetricCell
                            value={`${campaign.metrics.ctr.toFixed(2)}%`}
                            className={
                              campaign.metrics.ctr >= 2 ? 'text-emerald-400' :
                              campaign.metrics.ctr >= 1 ? 'text-slate-900 dark:text-slate-50' :
                              campaign.metrics.ctr > 0  ? 'text-amber-400' : 'text-slate-500 dark:text-slate-400'
                            }
                          />
                          <MetricCell value={campaign.metrics.cpc > 0 ? formatCurrency(campaign.metrics.cpc) : '—'} />
                        </tr>
                      ))}
                    </>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  )
}
