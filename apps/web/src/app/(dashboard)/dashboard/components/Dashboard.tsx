'use client'

import { useState, useMemo } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { DateRangeFilter } from '@/components/filters/DateRangeFilter'
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
  const [customFromDate, setCustomFromDate] = useState('')
  const [customToDate, setCustomToDate] = useState('')

  const dashboardTimePresets = useMemo(
    () => [
      { id: '7d', label: '7 days' },
      { id: '30d', label: '30 days' },
      { id: '90d', label: '90 days' },
    ],
    [],
  )

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
        <h1 className="text-3xl font-bold text-text-primary">Dashboard</h1>
        <p className="text-text-tertiary mt-1">Overview of your advertising performance</p>
      </div>

      {/* Time Range Filter */}
      <DateRangeFilter
        variant="pills"
        value={filters.timeRange}
        onValueChange={(id) => setFilters((prev) => ({ ...prev, timeRange: id }))}
        presets={dashboardTimePresets}
        fromDate={customFromDate}
        toDate={customToDate}
        onFromDateChange={setCustomFromDate}
        onToDateChange={setCustomToDate}
        dateInputClassName="rounded-lg border border-border bg-surface px-3 py-1.5 text-sm text-text-primary"
      />

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6">
          <p className="text-text-tertiary text-sm font-medium">Total Spend</p>
          <p className="text-4xl font-bold text-text-primary mt-2">${stats.totalSpend.toLocaleString()}</p>
          <p className="text-xs text-text-tertiary mt-2">+12.5% vs last period</p>
        </Card>

        <Card className="p-6">
          <p className="text-text-tertiary text-sm font-medium">Conversions</p>
          <p className="text-4xl font-bold text-text-primary mt-2">{stats.totalConversions.toLocaleString()}</p>
          <p className="text-xs text-text-tertiary mt-2">+15.2% vs last period</p>
        </Card>

        <Card className="p-6">
          <p className="text-text-tertiary text-sm font-medium">Avg ROAS</p>
          <p className="text-4xl font-bold text-text-primary mt-2">{stats.avgRoas.toFixed(2)}x</p>
          <p className="text-xs text-text-tertiary mt-2">-2.1% vs last period</p>
        </Card>
      </div>

      {/* Performance Chart */}
      <Card className="p-6">
        <h3 className="font-semibold text-text-primary mb-6">7-Day Performance</h3>
        <div className="h-[300px] bg-surface-2 rounded-lg p-4">
          <LineChart data={PERFORMANCE_DATA} />
        </div>
      </Card>

      {/* Platform Filter and Campaign List */}
      <div className="space-y-4">
        <div>
          <h3 className="font-semibold text-text-primary mb-4">Campaigns</h3>
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
              <p className="font-medium text-text-primary mb-3">{campaign.name}</p>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-text-tertiary">
                  <span>Spend:</span>
                  <span className="font-semibold text-text-primary">${campaign.spend.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-text-tertiary">
                  <span>Conversions:</span>
                  <span className="font-semibold text-text-primary">{campaign.conversions}</span>
                </div>
                <div className="flex justify-between text-text-tertiary">
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
