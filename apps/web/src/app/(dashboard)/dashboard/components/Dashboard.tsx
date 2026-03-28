'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Progress } from '@/components/ui/Progress'
import { LineChart, BarChart, PieChart } from '@/components/ui/Charts'
import { useCampaigns } from '@/hooks/useCampaigns'

export function Dashboard() {
  const { campaigns, loading, error } = useCampaigns()
  const [timeRange, setTimeRange] = useState('7d')

  const totalSpend = campaigns?.reduce((sum, campaign) => sum + (campaign.totalSpend || 0), 0) || 0
  const totalClicks = campaigns?.reduce((sum, campaign) => sum + (campaign.totalClicks || 0), 0) || 0
  const totalConversions = campaigns?.reduce((sum, campaign) => sum + (campaign.totalConversions || 0), 0) || 0
  const avgROAS = totalSpend > 0 ? (totalConversions / totalSpend) : 0

  const platformData = campaigns?.reduce((acc, campaign) => {
    campaign.platforms?.forEach((platform: string) => {
      acc[platform] = (acc[platform] || 0) + 1
    })
    return acc
  }, {} as Record<string, number>) || {}

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
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card padding="lg">
          <div className="space-y-2">
            <p className="text-sm text-[#6B7280]">Total Spend</p>
            <p className="text-2xl font-bold text-[#111827]">${totalSpend.toLocaleString()}</p>
            <div className="flex items-center gap-2">
              <Badge variant="success">+12.5%</Badge>
              <span className="text-sm text-[#6B7280]">vs last period</span>
            </div>
          </div>
        </Card>

        <Card padding="lg">
          <div className="space-y-2">
            <p className="text-sm text-[#6B7280]">Total Clicks</p>
            <p className="text-2xl font-bold text-[#111827]">{totalClicks.toLocaleString()}</p>
            <div className="flex items-center gap-2">
              <Badge variant="success">+8.2%</Badge>
              <span className="text-sm text-[#6B7280]">vs last period</span>
            </div>
          </div>
        </Card>

        <Card padding="lg">
          <div className="space-y-2">
            <p className="text-sm text-[#6B7280]">Total Conversions</p>
            <p className="text-2xl font-bold text-[#111827]">{totalConversions.toLocaleString()}</p>
            <div className="flex items-center gap-2">
              <Badge variant="success">+15.7%</Badge>
              <span className="text-sm text-[#6B7280]">vs last period</span>
            </div>
          </div>
        </Card>

        <Card padding="lg">
          <div className="space-y-2">
            <p className="text-sm text-[#6B7280]">Average ROAS</p>
            <p className="text-2xl font-bold text-[#111827]">{avgROAS.toFixed(2)}x</p>
            <div className="flex items-center gap-2">
              <Badge variant="warning">+3.1%</Badge>
              <span className="text-sm text-[#6B7280]">vs last period</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Performance Over Time */}
        <Card padding="lg">
          <h3 className="text-lg font-semibold text-[#111827] mb-4">Performance Over Time</h3>
          <LineChart
            data={performanceData}
            xKey="date"
            yKeys={['spend', 'clicks', 'conversions']}
            colors={['#7C3AED', '#4285F4', '#FFCC00']}
          />
        </Card>

        {/* Platform Distribution */}
        <Card padding="lg">
          <h3 className="text-lg font-semibold text-[#111827] mb-4">Platform Distribution</h3>
          <div className="space-y-4">
            {(() => {
              const pd = platformData as Record<string, number>
              const total = Object.values(pd).reduce((a: number, b: number) => a + b, 0) || 1
              return Object.entries(pd).map(([platform, count]: [string, number]) => (
                <div key={platform} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${
                      platform === 'meta' ? 'bg-[#1877F2]' :
                      platform === 'google' ? 'bg-[#4285F4]' :
                      platform === 'yandex' ? 'bg-[#FFCC00]' :
                      'bg-[#2CA5E0]'
                    }`}></div>
                    <span className="text-[#111827] capitalize">{platform}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-[#111827] font-medium">{count}</span>
                    <Progress value={(count / total) * 100} />
                  </div>
                </div>
              ))
            })()}
          </div>
        </Card>
      </div>

      {/* Campaign Performance */}
      <Card padding="lg">
        <h3 className="text-lg font-semibold text-[#111827] mb-4">Campaign Performance</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#E5E7EB]">
                <th className="text-left text-[#6B7280] pb-2">Campaign</th>
                <th className="text-left text-[#6B7280] pb-2">Platform</th>
                <th className="text-left text-[#6B7280] pb-2">Spend</th>
                <th className="text-left text-[#6B7280] pb-2">Clicks</th>
                <th className="text-left text-[#6B7280] pb-2">Conversions</th>
                <th className="text-left text-[#6B7280] pb-2">ROAS</th>
                <th className="text-left text-[#6B7280] pb-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {campaigns?.map(campaign => (
                <tr key={campaign.id} className="border-b border-[#E5E7EB]">
                  <td className="py-3">
                    <div className="text-[#111827] font-medium">{campaign.name}</div>
                    <div className="text-sm text-[#6B7280]">{campaign.objective}</div>
                  </td>
                  <td className="py-3">
                    <div className="flex gap-1">
                      {campaign.platforms?.map((platform: string) => (
                        <Badge key={platform} variant="secondary" size="sm">
                          {platform}
                        </Badge>
                      ))}
                    </div>
                  </td>
                  <td className="py-3 text-[#111827]">${(campaign.totalSpend || 0).toLocaleString()}</td>
                  <td className="py-3 text-[#111827]">{(campaign.totalClicks || 0).toLocaleString()}</td>
                  <td className="py-3 text-[#111827]">{(campaign.totalConversions || 0).toLocaleString()}</td>
                  <td className="py-3 text-[#111827]">{((campaign.totalConversions || 0) / (campaign.totalSpend || 1)).toFixed(2)}x</td>
                  <td className="py-3">
                    <Badge 
                      variant={campaign.status === 'active' ? 'success' : 
                             campaign.status === 'paused' ? 'warning' : 'error'}
                    >
                      {campaign.status}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Recommendations */}
      <Card padding="lg">
        <h3 className="text-lg font-semibold text-[#111827] mb-4">AI Recommendations</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="border border-[#E5E7EB] rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <Badge variant="success">Budget Optimization</Badge>
              <Badge variant="success">95% confidence</Badge>
            </div>
            <p className="text-[#111827]">Increase Meta budget by 20% during weekdays for better ROAS</p>
          </div>
          
          <div className="border border-[#E5E7EB] rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <Badge variant="warning">Creative Refresh</Badge>
              <Badge variant="warning">78% confidence</Badge>
            </div>
            <p className="text-[#111827]">Update creative assets for campaigns older than 30 days</p>
          </div>
          
          <div className="border border-[#E5E7EB] rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <Badge variant="info">Audience Expansion</Badge>
              <Badge variant="success">82% confidence</Badge>
            </div>
            <p className="text-[#111827]">Expand audience targeting to include lookalike audiences</p>
          </div>
        </div>
      </Card>
    </div>
  )
}