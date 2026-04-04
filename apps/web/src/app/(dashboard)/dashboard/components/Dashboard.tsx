'use client'

import { useState, useMemo } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { LineChart, BarChart } from '@/components/ui/Charts'

const MOCK_CAMPAIGNS = [
  { id: 1, name: 'Meta Campaign', platform: 'meta', spend: 5000, clicks: 1250, conversions: 125, roas: 3.2 },
  { id: 2, name: 'Google Ads', platform: 'google', spend: 3500, clicks: 890, conversions: 67, roas: 2.1 },
  { id: 3, name: 'Yandex Direct', platform: 'yandex', spend: 2000, clicks: 450, conversions: 36, roas: 2.8 },
]

const PERFORMANCE_DATA = [
  { date: 'Mon', spend: 1200, conversions: 32 },
  { date: 'Tue', spend: 1450, conversions: 38 },
  { date: 'Wed', spend: 1100, conversions: 29 },
  { date: 'Thu', spend: 1680, conversions: 44 },
  { date: 'Fri', spend: 1350, conversions: 37 },
  { date: 'Sat', spend: 1600, conversions: 43 },
  { date: 'Sun', spend: 1800, conversions: 48 },
]

interface FilterState {
  timeRange: string
  platform: string
}

export function Dashboard() {
  const [filters, setFilters] = useState<FilterState>({
    timeRange: '7d',
    platform: 'all',
  })

  const filteredCampaigns = useMemo(() => {
    if (filters.platform === 'all') return MOCK_CAMPAIGNS
    return MOCK_CAMPAIGNS.filter(c => c.platform === filters.platform)
  }, [filters.platform])

  const stats = useMemo(() => {
    const totalSpend = filteredCampaigns.reduce((sum, c) => sum + c.spend, 0)
    const totalConversions = filteredCampaigns.reduce((sum, c) => sum + c.conversions, 0)
    const avgRoas = filteredCampaigns.length > 0
      ? filteredCampaigns.reduce((sum, c) => sum + c.roas, 0) / filteredCampaigns.length
      : 0

    return { totalSpend, totalConversions, avgRoas }
  }, [filteredCampaigns])

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-50">Dashboard</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">Overview of your advertising performance</p>
      </div>

      {/* Time Range Filter */}
      <div className="flex gap-2">
        {['7d', '30d', '90d'].map(range => (
          <Button
            key={range}
            onClick={() => setFilters(prev => ({ ...prev, timeRange: range }))}
            variant={filters.timeRange === range ? 'primary' : 'secondary'}
            size="sm"
          >
            {range === '7d' ? '7 days' : range === '30d' ? '30 days' : '90 days'}
          </Button>
        ))}
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6">
          <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Total Spend</p>
          <p className="text-4xl font-bold text-slate-900 dark:text-slate-50 mt-2">${stats.totalSpend.toLocaleString()}</p>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-2">+12.5% vs last period</p>
        </Card>

        <Card className="p-6">
          <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Conversions</p>
          <p className="text-4xl font-bold text-slate-900 dark:text-slate-50 mt-2">{stats.totalConversions.toLocaleString()}</p>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-2">+15.2% vs last period</p>
        </Card>

        <Card className="p-6">
          <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Avg ROAS</p>
          <p className="text-4xl font-bold text-slate-900 dark:text-slate-50 mt-2">{stats.avgRoas.toFixed(2)}x</p>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-2">-2.1% vs last period</p>
        </Card>
      </div>

      {/* Performance Chart */}
      <Card className="p-6">
        <h3 className="font-semibold text-slate-900 dark:text-slate-50 mb-6">7-Day Performance</h3>
        <div className="h-[300px] bg-slate-50 dark:bg-slate-800/50 rounded-lg p-4">
          <LineChart data={PERFORMANCE_DATA} />
        </div>
      </Card>

      {/* Platform Filter and Campaign List */}
      <div className="space-y-4">
        <div>
          <h3 className="font-semibold text-slate-900 dark:text-slate-50 mb-4">Campaigns</h3>
          <div className="flex gap-2 mb-4">
            {['all', 'meta', 'google', 'yandex'].map(platform => (
              <Button
                key={platform}
                onClick={() => setFilters(prev => ({ ...prev, platform }))}
                variant={filters.platform === platform ? 'primary' : 'secondary'}
                size="sm"
              >
                {platform === 'all' ? 'All' : platform.charAt(0).toUpperCase() + platform.slice(1)}
              </Button>
            ))}
          </div>
        </div>

        {/* Campaign Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCampaigns.map(campaign => (
            <Card key={campaign.id} className="p-4">
              <p className="font-medium text-slate-900 dark:text-slate-50 mb-3">{campaign.name}</p>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-slate-500 dark:text-slate-400">
                  <span>Spend:</span>
                  <span className="font-semibold text-slate-900 dark:text-slate-50">${campaign.spend.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-slate-500 dark:text-slate-400">
                  <span>Conversions:</span>
                  <span className="font-semibold text-slate-900 dark:text-slate-50">{campaign.conversions}</span>
                </div>
                <div className="flex justify-between text-slate-500 dark:text-slate-400">
                  <span>ROAS:</span>
                  <span className="font-semibold text-green-600">{campaign.roas.toFixed(2)}x</span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
