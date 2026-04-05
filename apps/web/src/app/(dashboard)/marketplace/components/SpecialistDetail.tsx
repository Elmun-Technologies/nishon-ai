'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { LineChart, BarChart } from '@/components/ui/Charts'
import { TrendingUp } from 'lucide-react'

const REVENUE_DATA = [
  { date: 'Mar 29', revenue: 12000 },
  { date: 'Mar 30', revenue: 14500 },
  { date: 'Mar 31', revenue: 13200 },
  { date: 'Apr 1', revenue: 18900 },
  { date: 'Apr 2', revenue: 16800 },
  { date: 'Apr 3', revenue: 22100 },
  { date: 'Apr 4', revenue: 19500 },
]

const CAMPAIGN_STATS = [
  { name: 'Meta Ads', spend: 15000, conversions: 450, roas: 3.2 },
  { name: 'Google Ads', spend: 12000, conversions: 280, roas: 2.8 },
  { name: 'Yandex', spend: 8000, conversions: 180, roas: 3.1 },
]

export function SpecialistDetail() {
  const [timeRange, setTimeRange] = useState('7d')
  const [tab, setTab] = useState<'overview' | 'campaigns' | 'reviews'>('overview')

  return (
    <div className="min-h-screen bg-surface">
      {/* Header */}
      <div className="border-b border-border bg-surface sticky top-0 z-40">
        <div className="p-6 max-w-7xl mx-auto">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-4xl">
                👨‍💼
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">Ahmed Hassan</h1>
                <p className="text-text-tertiary mt-1">Senior Meta Specialist</p>
                <div className="flex gap-2 mt-2">
                  <Badge className="bg-green-500/20 text-green-400">✓ Verified</Badge>
                  <Badge className="bg-surface-2 text-text-secondary">4.9 ⭐ (287 reviews)</Badge>
                </div>
              </div>
            </div>
            <button className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium">
              Hire Now
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-6">
        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card className="p-6 bg-surface border-border">
            <p className="text-text-tertiary text-sm font-medium mb-2">Total Revenue</p>
            <p className="text-white text-3xl font-bold">$121,500</p>
            <p className="text-green-400 text-sm mt-2">+12.5% last 30 days</p>
          </Card>

          <Card className="p-6 bg-surface border-border">
            <p className="text-text-tertiary text-sm font-medium mb-2">Avg ROAS</p>
            <p className="text-white text-3xl font-bold">3.2x</p>
            <p className="text-green-400 text-sm mt-2">+0.3x vs industry</p>
          </Card>

          <Card className="p-6 bg-surface border-border">
            <p className="text-text-tertiary text-sm font-medium mb-2">Campaigns</p>
            <p className="text-white text-3xl font-bold">24</p>
            <p className="text-text-tertiary text-sm mt-2">18 active, 6 completed</p>
          </Card>

          <Card className="p-6 bg-surface border-border">
            <p className="text-text-tertiary text-sm font-medium mb-2">Experience</p>
            <p className="text-white text-3xl font-bold">5+</p>
            <p className="text-text-tertiary text-sm mt-2">Years in marketing</p>
          </Card>
        </div>

        {/* About Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <Card className="lg:col-span-2 p-6 bg-surface border-border">
            <h3 className="text-white font-semibold text-lg mb-4">About</h3>
            <p className="text-text-secondary leading-relaxed mb-4">
              Specialized in Meta advertising with a focus on e-commerce and performance marketing.
              Successfully managed 100+ campaigns with an average ROAS of 3.2x.
            </p>
            <div className="space-y-2">
              <p className="text-text-tertiary"><span className="font-semibold">Specialization:</span> E-commerce, DTC, SaaS</p>
              <p className="text-text-tertiary"><span className="font-semibold">Platforms:</span> Meta (Primary), Google Ads</p>
              <p className="text-text-tertiary"><span className="font-semibold">Budget Range:</span> $10k - $50k/month</p>
            </div>
          </Card>

          <Card className="p-6 bg-surface border-border">
            <h3 className="text-white font-semibold text-lg mb-4">Platforms</h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-text-secondary">📘 Meta</span>
                <Badge className="bg-green-500/20 text-green-400">Expert</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-text-secondary">🔍 Google</span>
                <Badge className="bg-blue-500/20 text-blue-400">Advanced</Badge>
              </div>
            </div>
          </Card>
        </div>

        {/* Tabs */}
        <div className="mb-6 border-b border-border flex gap-4">
          {['overview', 'campaigns', 'reviews'].map(t => (
            <button
              key={t}
              onClick={() => setTab(t as any)}
              className={`pb-4 font-medium transition-all ${
                tab === t
                  ? 'text-white border-b-2 border-blue-600'
                  : 'text-text-tertiary hover:text-white'
              }`}
            >
              {t === 'overview' ? '📊 Overview' : t === 'campaigns' ? '🎯 Campaigns' : '⭐ Reviews'}
            </button>
          ))}
        </div>

        {/* Content */}
        {tab === 'overview' && (
          <div className="space-y-6">
            {/* Time Range */}
            <div className="flex gap-2">
              {['7d', '30d', '90d', '1y'].map(range => (
                <button
                  key={range}
                  onClick={() => setTimeRange(range)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    timeRange === range
                      ? 'bg-blue-600 text-white'
                      : 'bg-surface text-text-tertiary hover:bg-surface-2'
                  }`}
                >
                  {range}
                </button>
              ))}
            </div>

            {/* Revenue Chart */}
            <Card className="p-6 bg-surface border-border">
              <h3 className="text-white font-semibold text-lg mb-6">Revenue Trend</h3>
              <div className="h-[350px] bg-surface rounded-lg p-4">
                <LineChart data={REVENUE_DATA} />
              </div>
            </Card>

            {/* Campaign Performance */}
            <Card className="p-6 bg-surface border-border">
              <h3 className="text-white font-semibold text-lg mb-6">Campaign Performance</h3>
              <div className="space-y-4">
                {CAMPAIGN_STATS.map((campaign, idx) => (
                  <div key={idx} className="bg-surface rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-white font-medium">{campaign.name}</span>
                      <span className="text-green-400 font-bold">{campaign.roas.toFixed(2)}x ROAS</span>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-text-tertiary mb-1">Spend</p>
                        <p className="text-white font-semibold">${campaign.spend.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-text-tertiary mb-1">Conversions</p>
                        <p className="text-white font-semibold">{campaign.conversions}</p>
                      </div>
                      <div>
                        <p className="text-text-tertiary mb-1">CPA</p>
                        <p className="text-white font-semibold">${(campaign.spend / campaign.conversions).toFixed(2)}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}

        {tab === 'campaigns' && (
          <Card className="p-6 bg-surface border-border">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 text-text-tertiary font-semibold">Campaign</th>
                    <th className="text-right py-3 px-4 text-text-tertiary font-semibold">Spend</th>
                    <th className="text-right py-3 px-4 text-text-tertiary font-semibold">ROAS</th>
                    <th className="text-center py-3 px-4 text-text-tertiary font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {[...Array(5)].map((_, idx) => (
                    <tr key={idx} className="border-b border-border hover:bg-surface transition-all">
                      <td className="py-3 px-4 text-white">Campaign {idx + 1}</td>
                      <td className="py-3 px-4 text-right text-text-secondary">${(5000 + idx * 1000).toLocaleString()}</td>
                      <td className="py-3 px-4 text-right text-green-400 font-bold">{(2.5 + idx * 0.2).toFixed(2)}x</td>
                      <td className="py-3 px-4 text-center">
                        <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded text-xs font-medium">Active</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {tab === 'reviews' && (
          <div className="space-y-4">
            {[...Array(3)].map((_, idx) => (
              <Card key={idx} className="p-6 bg-surface border-border">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center text-lg">
                    👤
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-white font-semibold">Client {idx + 1}</p>
                      <span className="text-yellow-400">⭐⭐⭐⭐⭐</span>
                    </div>
                    <p className="text-text-secondary mb-2">
                      Excellent work! Delivered outstanding results with a 3.5x ROAS. Highly recommended for any marketing campaigns.
                    </p>
                    <p className="text-text-tertiary text-sm">2 months ago</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
