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

// ─── Helpers ──────────────────────────────────────────────────────────────────

const STATUS_STYLE: Record<string, string> = {
  ACTIVE:   'text-emerald-400 bg-emerald-400/10',
  PAUSED:   'text-amber-400 bg-amber-400/10',
  DELETED:  'text-red-400 bg-red-400/10',
  ARCHIVED: 'text-[#6B7280] bg-[#F3F4F6]',
}

function MetricCell({ value, className = '' }: { value: string; className?: string }) {
  return (
    <td className={`px-3 py-2.5 text-right text-sm font-medium text-[#111827] tabular-nums ${className}`}>
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

  if (!currentWorkspace) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-[#6B7280]">Workspace tanlanmagan</p>
      </div>
    )
  }

  return (
    <div className="space-y-5 max-w-6xl">

      {/* ── Header ── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-[#111827] flex items-center gap-2">
            📊 Hisobot
          </h1>
          <p className="text-[#6B7280] text-sm mt-0.5">
            Meta Ads — Account → Kampaniya darajasida ko'rsatkichlar
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Date range selector */}
          <div className="flex items-center gap-1 bg-white border border-[#E5E7EB] rounded-xl p-1">
            {DAY_OPTIONS.map((d) => (
              <button
                key={d}
                onClick={() => setDays(d)}
                className={`
                  px-3 py-1.5 rounded-lg text-xs font-medium transition-colors
                  ${days === d
                    ? 'bg-[#111827] text-white'
                    : 'text-[#6B7280] hover:text-[#111827]'
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
            <div key={item.label} className="bg-white border border-[#E5E7EB] rounded-xl p-4">
              <p className="text-[#6B7280] text-xs mb-1">{item.label}</p>
              <p className="text-[#111827] text-lg font-bold">{item.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* ── Table ── */}
      <Card padding="none">
        {loading ? (
          <div className="space-y-px">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-12 bg-white animate-pulse" style={{ opacity: 1 - i * 0.15 }} />
            ))}
          </div>
        ) : !data || data.accounts.length === 0 ? (
          <div className="text-center py-16 px-6">
            <span className="text-4xl block mb-3">📊</span>
            <p className="text-[#111827] font-semibold mb-1">Ma'lumot yo'q</p>
            <p className="text-[#6B7280] text-sm">
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
                <tr className="border-b border-[#E5E7EB]">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-[#6B7280] uppercase tracking-wide w-full">
                    Kanal / Kampaniya
                  </th>
                  <th className="px-3 py-3 text-right text-xs font-semibold text-[#6B7280] uppercase tracking-wide whitespace-nowrap">
                    Status
                  </th>
                  <th className="px-3 py-3 text-right text-xs font-semibold text-[#6B7280] uppercase tracking-wide whitespace-nowrap">
                    Xarajat
                  </th>
                  <th className="px-3 py-3 text-right text-xs font-semibold text-[#6B7280] uppercase tracking-wide whitespace-nowrap">
                    Kliklar
                  </th>
                  <th className="px-3 py-3 text-right text-xs font-semibold text-[#6B7280] uppercase tracking-wide whitespace-nowrap">
                    Ko'rinish
                  </th>
                  <th className="px-3 py-3 text-right text-xs font-semibold text-[#6B7280] uppercase tracking-wide whitespace-nowrap">
                    CTR
                  </th>
                  <th className="px-3 py-3 text-right text-xs font-semibold text-[#6B7280] uppercase tracking-wide whitespace-nowrap">
                    CPC
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-[#1C1C27]">
                {data.accounts.map((account) => {
                  const isOpen = expanded.has(account.id)
                  return (
                    <>
                      {/* ── Account row ── */}
                      <tr
                        key={account.id}
                        className="bg-[#F9FAFB] hover:bg-white cursor-pointer transition-colors"
                        onClick={() => toggleExpand(account.id)}
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            {/* Meta icon */}
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="#1877F2">
                              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                            </svg>
                            <span className="text-[#111827] font-semibold text-sm">{account.name}</span>
                            <span className="text-[#6B7280] text-xs">{account.id}</span>
                            <span className="text-[#6B7280] text-xs ml-1">
                              {account.campaigns.length} kampaniya
                            </span>
                            {/* Expand chevron */}
                            <span className={`text-[#6B7280] ml-auto transition-transform duration-200 ${isOpen ? 'rotate-90' : ''}`}>
                              ›
                            </span>
                          </div>
                        </td>
                        <td className="px-3 py-3 text-right">
                          <span className="text-xs text-[#6B7280]">—</span>
                        </td>
                        <MetricCell value={formatCurrency(account.metrics.spend)} />
                        <MetricCell value={formatNumber(account.metrics.clicks)} />
                        <MetricCell value={formatNumber(account.metrics.impressions)} />
                        <MetricCell value={`${account.metrics.ctr.toFixed(2)}%`} className="text-[#374151]" />
                        <MetricCell value={formatCurrency(account.metrics.cpc)} />
                      </tr>

                      {/* ── Campaign rows (expandable) ── */}
                      {isOpen && account.campaigns.map((campaign) => (
                        <tr
                          key={campaign.id}
                          className="bg-white hover:bg-[#F9FAFB] transition-colors"
                        >
                          <td className="px-4 py-2.5">
                            <div className="flex items-center gap-2 pl-6">
                              {/* Indent line */}
                              <span className="w-px h-4 bg-[#F3F4F6] shrink-0" />
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="text-[#6B7280] shrink-0">
                                <path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
                              </svg>
                              <span className="text-[#374151] text-sm">{campaign.name}</span>
                              {campaign.objective && (
                                <span className="text-[10px] text-[#6B7280] bg-[#F9FAFB] border border-[#E5E7EB] px-1.5 py-0.5 rounded">
                                  {campaign.objective.replace('OUTCOME_', '')}
                                </span>
                              )}
                            </div>
                            {/* Tags row */}
                            <div className="pl-14 flex items-center gap-1.5 flex-wrap mt-1">
                              {(campaignTags[campaign.id] ?? campaign.tags ?? []).map((tag) => (
                                <span key={tag} className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-[#E5E7EB] text-[#374151] border border-[#D1D5DB]">
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
                                  className="text-[10px] px-2 py-0.5 rounded-full bg-white border border-[#111827] text-[#111827] placeholder-[#9CA3AF] outline-none w-24"
                                />
                              ) : (
                                <button
                                  onClick={() => { setEditingTagId(campaign.id); setTagInput('') }}
                                  className="text-[10px] text-[#6B7280] hover:text-[#374151] border border-dashed border-[#E5E7EB] hover:border-[#111827] px-2 py-0.5 rounded-full transition-colors"
                                >
                                  + teg
                                </button>
                              )}
                            </div>
                          </td>
                          <td className="px-3 py-2.5 text-right">
                            <span className={`text-[10px] px-2 py-0.5 rounded font-medium ${STATUS_STYLE[campaign.status] ?? 'text-[#6B7280] bg-[#F3F4F6]'}`}>
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
                              campaign.metrics.ctr >= 1 ? 'text-[#111827]' :
                              campaign.metrics.ctr > 0  ? 'text-amber-400' : 'text-[#6B7280]'
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
