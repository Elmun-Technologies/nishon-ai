'use client'

import { useEffect, useMemo, useState } from 'react'
import { useWorkspaceStore } from '@/stores/workspace.store'
import { meta as metaApi } from '@/lib/api-client'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { formatCurrency, formatNumber } from '@/lib/utils'

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
  metrics: CampaignMetrics
}

interface ReportAccount {
  id: string
  name: string
  campaigns: ReportCampaign[]
}

interface ReportData {
  accounts: ReportAccount[]
}

const DAY_OPTIONS = [7, 14, 30, 60, 90]

export default function PerformancePage() {
  const { currentWorkspace } = useWorkspaceStore()
  const [days, setDays] = useState(7)
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [data, setData] = useState<ReportData | null>(null)

  useEffect(() => {
    if (!currentWorkspace?.id) return
    setLoading(true)
    setError('')
    metaApi.reporting(currentWorkspace.id, days)
      .then((res) => setData(res.data as ReportData))
      .catch((e: any) => setError(e?.message ?? 'Performance yuklashda xatolik'))
      .finally(() => setLoading(false))
  }, [currentWorkspace?.id, days])

  const campaigns = useMemo(
    () => (data?.accounts ?? []).flatMap((a) => a.campaigns.map((c) => ({ ...c, accountName: a.name }))),
    [data],
  )

  const filtered = campaigns.filter((c) =>
    c.name.toLowerCase().includes(query.toLowerCase()) ||
    c.accountName.toLowerCase().includes(query.toLowerCase()),
  )

  return (
    <div className="space-y-5 max-w-6xl">
      <div>
        <h1 className="text-2xl font-bold text-[#111827]">Performance</h1>
        <p className="text-[#6B7280] text-sm">Monitor and analyze your campaign performance</p>
      </div>

      <Card>
        <div className="flex items-center gap-2 flex-wrap">
          {DAY_OPTIONS.map((d) => (
            <button
              key={d}
              onClick={() => setDays(d)}
              className={`px-3 py-1.5 rounded-lg text-xs border ${days === d ? 'bg-[#111827] text-white border-[#111827]' : 'border-[#E5E7EB] text-[#6B7280]'}`}
            >
              Last {d} days
            </button>
          ))}
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search..."
            className="ml-auto border border-[#E5E7EB] rounded-lg px-3 py-1.5 text-sm min-w-56"
          />
        </div>
      </Card>

      {error && <Card><p className="text-red-500 text-sm">{error}</p></Card>}

      <Card padding="none">
        {loading ? (
          <div className="p-8 text-sm text-[#6B7280]">Loading...</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <p className="text-2xl font-bold text-[#111827]">Start tracking your performance</p>
            <p className="text-sm text-[#6B7280]">Launch your first campaign to see real-time metrics here.</p>
            <div className="flex items-center justify-center gap-2">
              <Button onClick={() => (window.location.href = '/launch')}>Launch with AI</Button>
              <Button variant="secondary" onClick={() => (window.location.href = '/wizard')}>Create manually</Button>
            </div>
          </div>
        ) : (
          <div className="overflow-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#E5E7EB]">
                  {['Name', 'Account', 'Status', 'Spend', 'Clicks', 'CTR', 'CPC'].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-xs text-[#6B7280] uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => (
                  <tr key={c.id} className="border-b border-[#F3F4F6]">
                    <td className="px-4 py-3 text-sm text-[#111827]">{c.name}</td>
                    <td className="px-4 py-3 text-sm text-[#6B7280]">{c.accountName}</td>
                    <td className="px-4 py-3 text-sm">{c.status}</td>
                    <td className="px-4 py-3 text-sm">{formatCurrency(c.metrics.spend)}</td>
                    <td className="px-4 py-3 text-sm">{formatNumber(c.metrics.clicks)}</td>
                    <td className="px-4 py-3 text-sm">{c.metrics.ctr.toFixed(2)}%</td>
                    <td className="px-4 py-3 text-sm">{formatCurrency(c.metrics.cpc)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  )
}
