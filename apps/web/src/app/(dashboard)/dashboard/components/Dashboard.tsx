'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Progress } from '@/components/ui/Progress'
import { LineChart, BarChart, PieChart } from '@/components/ui/Charts'
import { useCampaigns } from '@/hooks/useCampaigns'

const PLATFORM_COLORS: Record<string, { bg: string; accent: string; icon: string }> = {
  meta:   { bg: 'from-blue-500/10 to-blue-600/10', accent: 'text-blue-500', icon: '📘' },
  google: { bg: 'from-red-500/10 to-blue-500/10', accent: 'text-red-500', icon: '🔍' },
  yandex: { bg: 'from-yellow-500/10 to-orange-500/10', accent: 'text-yellow-600', icon: '🟡' },
}

export function Dashboard() {
  const { campaigns, loading, error } = useCampaigns()
  const [timeRange, setTimeRange] = useState('7d')

  const totalSpend = campaigns?.reduce((sum, campaign) => sum + (campaign.totalSpend || 0), 0) || 0
  const totalClicks = campaigns?.reduce((sum, campaign) => sum + (campaign.totalClicks || 0), 0) || 0
  const totalConversions = campaigns?.reduce((sum, campaign) => sum + (campaign.totalConversions || 0), 0) || 0
  const avgROAS = totalSpend > 0 ? (totalConversions / totalSpend) : 0

  // Per-platform breakdown
  const platformStats = (campaigns || []).reduce((acc, campaign) => {
    const platform = campaign.platform as string
    if (!acc[platform]) {
      acc[platform] = { campaigns: 0, spend: 0, clicks: 0, conversions: 0 }
    }
    acc[platform].campaigns += 1
    acc[platform].spend += campaign.totalSpend || 0
    acc[platform].clicks += campaign.totalClicks || 0
    acc[platform].conversions += campaign.totalConversions || 0
    return acc
  }, {} as Record<string, any>)

  const performanceData = [
    { date: '2024-01-01', spend: 1000, clicks: 150, conversions: 15 },
    { date: '2024-01-02', spend: 1200, clicks: 180, conversions: 18 },
    { date: '2024-01-03', spend: 900, clicks: 135, conversions: 13 },
    { date: '2024-01-04', spend: 1500, clicks: 225, conversions: 22 },
    { date: '2024-01-05', spend: 1100, clicks: 165, conversions: 16 },
    { date: '2024-01-06', spend: 1300, clicks: 195, conversions: 19 },
    { date: '2024-01-07', spend: 1400, clicks: 210, conversions: 21 },
  ]

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-[#111827]">Dashboard</h2>
          <div className="flex gap-2">
            {['7d', '30d', '90d'].map(range => (
              <Button key={range} variant="secondary" size="sm">
                {range}
              </Button>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => (
            <Card key={i} padding="lg">
              <div className="animate-pulse">
                <div className="h-4 bg-[#3A3A4A] rounded w-1/2 mb-2"></div>
                <div className="h-8 bg-[#3A3A4A] rounded w-3/4"></div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <h2 className="text-xl font-semibold text-[#111827]">Dashboard</h2>
        <Card padding="lg">
          <p className="text-red-400">Error loading dashboard data: {error}</p>
          <Button onClick={() => window.location.reload()} className="mt-4">
            Retry
          </Button>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-[#111827]">Dashboard</h2>
        <div className="flex gap-2">
          {['7d', '30d', '90d'].map(range => (
            <Button
              key={range}
              variant={timeRange === range ? "primary" : "secondary"}
              size="sm"
              onClick={() => setTimeRange(range)}
            >
              {range}
            </Button>
          ))}
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card padding="lg">
          <div className="space-y-2">
            <p className="text-sm text-[#6B7280]">Total Spend</p>
            <p className="text-2xl font-bold text-[#111827]">${totalSpend.toLocaleString()}</p>
            <Badge variant="success">+12.5% vs last period</Badge>
          </div>
        </Card>

        <Card padding="lg">
          <div className="space-y-2">
            <p className="text-sm text-[#6B7280]">Total Clicks</p>
            <p className="text-2xl font-bold text-[#111827]">{totalClicks.toLocaleString()}</p>
            <Badge variant="success">+8.2% vs last period</Badge>
          </div>
        </Card>

        <Card padding="lg">
          <div className="space-y-2">
            <p className="text-sm text-[#6B7280]">Conversions</p>
            <p className="text-2xl font-bold text-[#111827]">{totalConversions.toLocaleString()}</p>
            <Badge variant="success">+15.7% vs last period</Badge>
          </div>
        </Card>

        <Card padding="lg">
          <div className="space-y-2">
            <p className="text-sm text-[#6B7280]">Average ROAS</p>
            <p className="text-2xl font-bold text-[#111827]">{avgROAS.toFixed(2)}x</p>
            <Badge variant="warning">+3.1% vs last period</Badge>
          </div>
        </Card>
      </div>

      {/* Per-Platform Tracking */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {Object.entries(PLATFORM_COLORS).map(([platform, colors]) => {
          const stats = platformStats[platform]
          if (!stats) return null
          return (
            <Card key={platform} padding="lg" className={`bg-gradient-to-br ${colors.bg} border-l-4`} style={{ borderLeftColor: colors.accent }}>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-2xl">{colors.icon}</span>
                  <span className="text-xs font-semibold text-[#6B7280] uppercase">{stats.campaigns} kampaniya</span>
                </div>
                <div>
                  <p className="text-[#6B7280] text-xs">Sarflandi</p>
                  <p className="text-lg font-bold text-[#111827]">${stats.spend.toLocaleString()}</p>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <p className="text-[#6B7280]">Kliklar</p>
                    <p className="font-semibold text-[#111827]">{stats.clicks.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-[#6B7280]">Konversiya</p>
                    <p className="font-semibold text-[#111827]">{stats.conversions.toLocaleString()}</p>
                  </div>
                </div>
              </div>
            </Card>
          )
        })}
      </div>

      {/* Performance Chart */}
      <Card padding="lg">
        <h3 className="text-lg font-semibold text-[#111827] mb-4">Performance Over Time</h3>
        <LineChart
          data={performanceData}
          xKey="date"
          yKeys={['spend', 'clicks', 'conversions']}
          colors={['#7C3AED', '#4285F4', '#FFCC00']}
        />
      </Card>

      {/* Recent Campaigns */}
      <Card padding="lg">
        <h3 className="text-lg font-semibold text-[#111827] mb-4">Recent Campaigns</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#E5E7EB]">
                <th className="text-left text-[#6B7280] pb-3 font-semibold">Campaign</th>
                <th className="text-left text-[#6B7280] pb-3 font-semibold">Platform</th>
                <th className="text-left text-[#6B7280] pb-3 font-semibold">Spend</th>
                <th className="text-left text-[#6B7280] pb-3 font-semibold">Clicks</th>
                <th className="text-left text-[#6B7280] pb-3 font-semibold">Conv</th>
                <th className="text-left text-[#6B7280] pb-3 font-semibold">ROAS</th>
              </tr>
            </thead>
            <tbody>
              {campaigns?.slice(0, 5).map(campaign => (
                <tr key={campaign.id} className="border-b border-[#E5E7EB] hover:bg-[#F9FAFB]">
                  <td className="py-3 text-[#111827] font-medium">{campaign.name}</td>
                  <td className="py-3"><Badge variant="secondary" size="sm">{campaign.platform.toUpperCase()}</Badge></td>
                  <td className="py-3 text-[#111827]">${(campaign.totalSpend || 0).toLocaleString()}</td>
                  <td className="py-3 text-[#111827]">{(campaign.totalClicks || 0).toLocaleString()}</td>
                  <td className="py-3 text-[#111827]">{(campaign.totalConversions || 0).toLocaleString()}</td>
                  <td className="py-3 text-[#111827] font-semibold">{((campaign.totalConversions || 0) / (campaign.totalSpend || 1)).toFixed(2)}x</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}