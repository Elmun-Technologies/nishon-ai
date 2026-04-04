'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Progress } from '@/components/ui/Progress'
import { LineChart, BarChart, PieChart } from '@/components/ui/Charts'
import { useCampaigns } from '@/hooks/useCampaigns'
import { Info } from 'lucide-react'

const PLATFORM_COLORS: Record<string, { bg: string; accent: string; border: string; icon: string; glow: string }> = {
  meta:   { bg: 'from-blue-500/5 via-slate-800 to-blue-600/5', accent: 'text-blue-400', border: 'border-blue-500/30 hover:border-blue-400/60', icon: '📘', glow: 'hover:shadow-lg hover:shadow-blue-500/20' },
  google: { bg: 'from-red-500/5 via-slate-800 to-blue-500/5', accent: 'text-red-400', border: 'border-red-500/30 hover:border-red-400/60', icon: '🔍', glow: 'hover:shadow-lg hover:shadow-red-500/20' },
  yandex: { bg: 'from-amber-500/5 via-slate-800 to-orange-500/5', accent: 'text-amber-400', border: 'border-amber-500/30 hover:border-amber-400/60', icon: '🟡', glow: 'hover:shadow-lg hover:shadow-amber-500/20' },
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
      <div className="space-y-8">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-3xl font-bold bg-gradient-to-r from-slate-200 to-slate-100 bg-clip-text text-transparent">Dashboard</h2>
          <div className="flex gap-2">
            {['7d', '30d', '90d'].map(range => (
              <Button key={range} variant="secondary" size="sm">
                {range}
              </Button>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6 animate-pulse">
              <div className="h-4 bg-slate-700 rounded w-1/2 mb-3"></div>
              <div className="h-10 bg-slate-700 rounded w-3/4"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <h2 className="text-3xl font-bold bg-gradient-to-r from-slate-200 to-slate-100 bg-clip-text text-transparent">Dashboard</h2>
        <div className="border border-red-500/50 bg-red-500/10 rounded-xl p-6">
          <p className="text-red-300">Error loading dashboard data: {error}</p>
          <Button onClick={() => window.location.reload()} className="mt-4">
            Retry
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-slate-200 to-slate-100 bg-clip-text text-transparent mb-1">Dashboard</h2>
          <p className="text-sm text-slate-400">Track your advertising performance in real-time</p>
        </div>
        <div className="flex gap-2">
          {['7d', '30d', '90d'].map(range => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 ${
                timeRange === range
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg shadow-cyan-500/30'
                  : 'bg-slate-800/50 border border-slate-700 text-slate-300 hover:border-slate-600 hover:bg-slate-800'
              }`}
            >
              {range}
            </button>
          ))}
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Spend', value: `$${totalSpend.toLocaleString()}`, change: '+12.5%', color: 'from-cyan-500/20 to-blue-500/20', accentColor: 'text-cyan-400', icon: '💰' },
          { label: 'Total Clicks', value: totalClicks.toLocaleString(), change: '+8.2%', color: 'from-purple-500/20 to-pink-500/20', accentColor: 'text-purple-400', icon: '🎯' },
          { label: 'Conversions', value: totalConversions.toLocaleString(), change: '+15.7%', color: 'from-emerald-500/20 to-teal-500/20', accentColor: 'text-emerald-400', icon: '✨' },
          { label: 'Average ROAS', value: `${avgROAS.toFixed(2)}x`, change: '+3.1%', color: 'from-orange-500/20 to-red-500/20', accentColor: 'text-orange-400', icon: '📈' },
        ].map((metric, i) => (
          <div
            key={i}
            className={`group bg-gradient-to-br ${metric.color} border border-slate-700/50 rounded-xl p-6 transition-all duration-300 hover:border-slate-600/80 hover:shadow-xl hover:shadow-slate-700/30 cursor-pointer`}
          >
            <div className="flex items-start justify-between mb-3">
              <span className="text-3xl">{metric.icon}</span>
              <Info className="w-4 h-4 text-slate-500 group-hover:text-slate-400 transition-colors" />
            </div>
            <p className="text-slate-400 text-sm font-medium mb-2">{metric.label}</p>
            <p className={`text-3xl font-bold ${metric.accentColor} mb-3`}>{metric.value}</p>
            <div className="flex items-center gap-1">
              <span className="text-emerald-400 text-sm">↗</span>
              <span className="text-emerald-400 text-sm font-semibold">{metric.change} vs last period</span>
            </div>
          </div>
        ))}
      </div>

      {/* Per-Platform Tracking */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {Object.entries(PLATFORM_COLORS).map(([platform, colors]) => {
          const stats = platformStats[platform]
          if (!stats) return null
          return (
            <div
              key={platform}
              className={`group bg-gradient-to-br ${colors.bg} border ${colors.border} rounded-xl p-6 transition-all duration-300 ${colors.glow}`}
            >
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <span className="text-4xl">{colors.icon}</span>
                  <span className={`text-xs font-bold ${colors.accent} uppercase tracking-wider`}>{stats.campaigns} campaigns</span>
                </div>

                <div className="space-y-1">
                  <p className="text-slate-400 text-xs font-medium uppercase tracking-wider">Total Spend</p>
                  <p className={`text-2xl font-bold ${colors.accent}`}>${stats.spend.toLocaleString()}</p>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div className="space-y-1">
                    <p className="text-slate-500 text-xs font-medium">Clicks</p>
                    <p className="text-lg font-semibold text-slate-100">{stats.clicks.toLocaleString()}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-slate-500 text-xs font-medium">Conversions</p>
                    <p className="text-lg font-semibold text-slate-100">{stats.conversions.toLocaleString()}</p>
                  </div>
                </div>

                <div className="h-1 bg-gradient-to-r from-slate-700 to-transparent rounded-full mt-3 group-hover:from-slate-600 transition-colors"></div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Performance Chart */}
      <div className="border border-slate-700/50 bg-gradient-to-br from-slate-800/30 to-slate-900/30 rounded-xl p-6 hover:border-slate-600/80 transition-all duration-300 hover:shadow-xl hover:shadow-slate-700/20">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl font-bold text-slate-100">Performance Over Time</h3>
            <p className="text-sm text-slate-400 mt-1">Track your spending, clicks, and conversions</p>
          </div>
          <span className="text-2xl">📊</span>
        </div>
        <LineChart
          data={performanceData}
          xKey="date"
          yKeys={['spend', 'clicks', 'conversions']}
          colors={['#06B6D4', '#8B5CF6', '#10B981']}
        />
      </div>

      {/* Recent Campaigns */}
      <div className="border border-slate-700/50 bg-gradient-to-br from-slate-800/30 to-slate-900/30 rounded-xl p-6 hover:border-slate-600/80 transition-all duration-300 hover:shadow-xl hover:shadow-slate-700/20">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl font-bold text-slate-100">Recent Campaigns</h3>
            <p className="text-sm text-slate-400 mt-1">Your top performing campaigns</p>
          </div>
          <span className="text-2xl">🎯</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700/50">
                <th className="text-left text-slate-400 pb-4 font-semibold uppercase text-xs tracking-wider">Campaign</th>
                <th className="text-left text-slate-400 pb-4 font-semibold uppercase text-xs tracking-wider">Platform</th>
                <th className="text-left text-slate-400 pb-4 font-semibold uppercase text-xs tracking-wider">Spend</th>
                <th className="text-left text-slate-400 pb-4 font-semibold uppercase text-xs tracking-wider">Clicks</th>
                <th className="text-left text-slate-400 pb-4 font-semibold uppercase text-xs tracking-wider">Conversions</th>
                <th className="text-left text-slate-400 pb-4 font-semibold uppercase text-xs tracking-wider">ROAS</th>
              </tr>
            </thead>
            <tbody>
              {campaigns?.slice(0, 5).map(campaign => (
                <tr key={campaign.id} className="border-b border-slate-700/30 hover:bg-slate-800/50 transition-colors duration-200">
                  <td className="py-4 text-slate-200 font-medium">{campaign.name}</td>
                  <td className="py-4">
                    <span className="inline-block px-3 py-1 rounded-lg bg-slate-700/50 text-slate-300 text-xs font-semibold uppercase tracking-wider">
                      {campaign.platform.toUpperCase()}
                    </span>
                  </td>
                  <td className="py-4 text-slate-200">${(campaign.totalSpend || 0).toLocaleString()}</td>
                  <td className="py-4 text-slate-200">{(campaign.totalClicks || 0).toLocaleString()}</td>
                  <td className="py-4 text-slate-200">{(campaign.totalConversions || 0).toLocaleString()}</td>
                  <td className="py-4 text-emerald-400 font-bold">{((campaign.totalConversions || 0) / (campaign.totalSpend || 1)).toFixed(2)}x</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}