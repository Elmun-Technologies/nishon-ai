'use client'

import { useEffect, useMemo, useState } from 'react'
import { useWorkspaceStore } from '@/stores/workspace.store'
import { meta as metaApi } from '@/lib/api-client'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { formatCurrency, formatNumber } from '@/lib/utils'

interface TopAd {
  campaignId: string
  name: string
  status: string
  spend: number
  clicks: number
  impressions: number
  ctr: number
}

export default function TopAdsPage() {
  const { currentWorkspace } = useWorkspaceStore()
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [rows, setRows] = useState<TopAd[]>([])

  useEffect(() => {
    if (!currentWorkspace?.id) return
    setLoading(true)
    setError('')
    metaApi.topAds(currentWorkspace.id, 20)
      .then((res) => setRows((res.data as TopAd[]) ?? []))
      .catch((e: any) => setError(e?.message ?? 'Top ads yuklashda xatolik'))
      .finally(() => setLoading(false))
  }, [currentWorkspace?.id])

  const filtered = useMemo(
    () => rows.filter((r) => r.name.toLowerCase().includes(query.toLowerCase())),
    [rows, query],
  )

  return (
    <div className="space-y-5 max-w-6xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">Top Ads</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm">See your top performing ads and campaigns by CTR</p>
        </div>
        <Button variant="secondary" onClick={() => (window.location.href = '/campaigns')}>View Campaigns</Button>
      </div>

      <Card>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search landing pages..."
          className="w-full md:w-[420px] border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm"
        />
      </Card>

      {error && <Card><p className="text-sm text-red-500">{error}</p></Card>}

      <Card padding="none">
        {loading ? (
          <div className="p-8 text-sm text-slate-500 dark:text-slate-400">Loading...</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <p className="text-2xl font-bold text-slate-900 dark:text-slate-50">No landing page data found</p>
            <p className="text-sm text-slate-500 dark:text-slate-400">Launch campaigns with landing pages to see your performance data here.</p>
            <Button onClick={() => (window.location.href = '/campaigns')}>View Campaigns</Button>
          </div>
        ) : (
          <div className="overflow-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700">
                  {['Campaign', 'Status', 'Spend', 'Clicks', 'Impressions', 'CTR'].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-xs text-slate-500 dark:text-slate-400 uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => (
                  <tr key={r.campaignId} className="border-b border-[#F3F4F6]">
                    <td className="px-4 py-3 text-sm text-slate-900 dark:text-slate-50">{r.name}</td>
                    <td className="px-4 py-3 text-sm text-slate-500 dark:text-slate-400">{r.status}</td>
                    <td className="px-4 py-3 text-sm">{formatCurrency(r.spend)}</td>
                    <td className="px-4 py-3 text-sm">{formatNumber(r.clicks)}</td>
                    <td className="px-4 py-3 text-sm">{formatNumber(r.impressions)}</td>
                    <td className="px-4 py-3 text-sm font-semibold">{r.ctr.toFixed(2)}%</td>
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
