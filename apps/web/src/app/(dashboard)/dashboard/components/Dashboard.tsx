'use client'

import { useState, useMemo } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { LineChart, BarChart, PieChart } from '@/components/ui/Charts'
import { TrendingUp, TrendingDown, Target, Zap, Eye, Activity } from 'lucide-react'

const PLATFORM_COLORS: Record<string, { bg: string; accent: string; icon: string; border: string }> = {
  meta: { bg: 'from-blue-500/10 to-blue-600/10', accent: 'text-blue-500', icon: '📘', border: 'border-blue-500/20' },
  google: { bg: 'from-red-500/10 to-blue-500/10', accent: 'text-red-500', icon: '🔍', border: 'border-red-500/20' },
  yandex: { bg: 'from-yellow-500/10 to-orange-500/10', accent: 'text-yellow-600', icon: '🟡', border: 'border-yellow-500/20' },
}

// Mock kampaniya ma'lumotlari
const MOCK_CAMPAIGNS = [
  { id: 1, name: 'Meta - E-commerce Summer', platform: 'meta', status: 'active', spend: 5000, clicks: 1250, conversions: 125, roas: 3.2 },
  { id: 2, name: 'Google Ads - Brand Awareness', platform: 'google', status: 'active', spend: 3500, clicks: 890, conversions: 67, roas: 2.1 },
  { id: 3, name: 'Yandex Direct - Traffic', platform: 'yandex', status: 'paused', spend: 2000, clicks: 450, conversions: 36, roas: 2.8 },
  { id: 4, name: 'Meta - Video Campaign', platform: 'meta', status: 'active', spend: 4200, clicks: 1100, conversions: 110, roas: 3.5 },
]

const PERFORMANCE_DATA = [
  { date: 'Jan 1', spend: 1200, clicks: 320, conversions: 32, impressions: 15000 },
  { date: 'Jan 2', spend: 1450, clicks: 385, conversions: 38, impressions: 18200 },
  { date: 'Jan 3', spend: 1100, clicks: 290, conversions: 29, impressions: 14500 },
  { date: 'Jan 4', spend: 1680, clicks: 445, conversions: 44, impressions: 21000 },
  { date: 'Jan 5', spend: 1350, clicks: 365, conversions: 37, impressions: 17800 },
  { date: 'Jan 6', spend: 1600, clicks: 425, conversions: 43, impressions: 20200 },
  { date: 'Jan 7', spend: 1800, clicks: 480, conversions: 48, impressions: 22500 },
]

interface FilterState {
  platforms: string[]
  status: string
  dateRange: string
  minROAS: number
}

export function Dashboard() {
  const [filters, setFilters] = useState<FilterState>({
    platforms: ['meta', 'google', 'yandex'],
    status: 'all',
    dateRange: '7d',
    minROAS: 0,
  })

  // Filter kampaniyalar
  const filteredCampaigns = useMemo(() => {
    return MOCK_CAMPAIGNS.filter(campaign => {
      if (!filters.platforms.includes(campaign.platform)) return false
      if (filters.status !== 'all' && campaign.status !== filters.status) return false
      if (campaign.roas < filters.minROAS) return false
      return true
    })
  }, [filters])

  // Statistikalar hisoblash
  const stats = useMemo(() => {
    const campaigns = filteredCampaigns
    const totalSpend = campaigns.reduce((sum, c) => sum + c.spend, 0)
    const totalClicks = campaigns.reduce((sum, c) => sum + c.clicks, 0)
    const totalConversions = campaigns.reduce((sum, c) => sum + c.conversions, 0)
    const avgROAS = campaigns.length > 0 ? campaigns.reduce((sum, c) => sum + c.roas, 0) / campaigns.length : 0
    const cpc = totalClicks > 0 ? totalSpend / totalClicks : 0
    const cpa = totalConversions > 0 ? totalSpend / totalConversions : 0
    const ctr = totalConversions > 0 ? (totalClicks / totalConversions) : 0

    return { totalSpend, totalClicks, totalConversions, avgROAS, cpc, cpa, ctr }
  }, [filteredCampaigns])

  // Platform statistikalar
  const platformStats = useMemo(() => {
    return Object.entries(
      filteredCampaigns.reduce((acc, campaign) => {
        const platform = campaign.platform
        if (!acc[platform]) {
          acc[platform] = { spend: 0, clicks: 0, conversions: 0, count: 0 }
        }
        acc[platform].spend += campaign.spend
        acc[platform].clicks += campaign.clicks
        acc[platform].conversions += campaign.conversions
        acc[platform].count += 1
        return acc
      }, {} as Record<string, any>)
    )
  }, [filteredCampaigns])

  const togglePlatform = (platform: string) => {
    setFilters(prev => ({
      ...prev,
      platforms: prev.platforms.includes(platform)
        ? prev.platforms.filter(p => p !== platform)
        : [...prev.platforms, platform]
    }))
  }

  return (
    <div className="space-y-6">
      {/* Header va Title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#111827]">📊 Dashboard</h1>
          <p className="text-[#6B7280] text-sm mt-1">Reklama kampaniyalaringizning real-time analitikasi</p>
        </div>
      </div>

      {/* FILTER PANEL */}
      <Card className="p-6 border border-[#E5E7EB] bg-white">
        <div className="space-y-4">
          <h3 className="font-semibold text-[#111827] flex items-center gap-2">
            🔍 Filtrlar
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {/* Platform Filter */}
            <div>
              <label className="block text-xs font-semibold text-[#6B7280] mb-2 uppercase">Platformalar</label>
              <div className="space-y-2">
                {['meta', 'google', 'yandex'].map(platform => (
                  <label key={platform} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={filters.platforms.includes(platform)}
                      onChange={() => togglePlatform(platform)}
                      className="rounded border-[#D1D5DB]"
                    />
                    <span className="text-sm text-[#111827]">
                      {PLATFORM_COLORS[platform].icon} {platform.charAt(0).toUpperCase() + platform.slice(1)}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Status Filter */}
            <div>
              <label className="block text-xs font-semibold text-[#6B7280] mb-2 uppercase">Status</label>
              <select
                value={filters.status}
                onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                className="w-full px-3 py-2 border border-[#D1D5DB] rounded-lg text-sm text-[#111827]"
              >
                <option value="all">Hammasi</option>
                <option value="active">🟢 Faol</option>
                <option value="paused">⏸️ To'xtatilgan</option>
              </select>
            </div>

            {/* Date Range Filter */}
            <div>
              <label className="block text-xs font-semibold text-[#6B7280] mb-2 uppercase">Vaqt</label>
              <select
                value={filters.dateRange}
                onChange={(e) => setFilters(prev => ({ ...prev, dateRange: e.target.value }))}
                className="w-full px-3 py-2 border border-[#D1D5DB] rounded-lg text-sm text-[#111827]"
              >
                <option value="7d">🗓️ 7 kun</option>
                <option value="30d">📅 30 kun</option>
                <option value="90d">📆 90 kun</option>
              </select>
            </div>

            {/* Min ROAS Filter */}
            <div>
              <label className="block text-xs font-semibold text-[#6B7280] mb-2 uppercase">Min ROAS</label>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min="0"
                  max="5"
                  step="0.5"
                  value={filters.minROAS}
                  onChange={(e) => setFilters(prev => ({ ...prev, minROAS: parseFloat(e.target.value) }))}
                  className="flex-1"
                />
                <span className="text-sm font-semibold text-[#111827] w-12">{filters.minROAS.toFixed(1)}x</span>
              </div>
            </div>

            {/* Reset Button */}
            <div className="flex items-end">
              <Button
                onClick={() => setFilters({ platforms: ['meta', 'google', 'yandex'], status: 'all', dateRange: '7d', minROAS: 0 })}
                className="w-full"
                variant="secondary"
              >
                🔄 Reset
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* KEY METRICS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Spend */}
        <Card className="p-6 border border-[#E5E7EB] hover:border-blue-200 transition-all">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-[#6B7280] text-sm font-medium">💰 Umumiy Sarfa</p>
              <p className="text-3xl font-bold text-[#111827] mt-2">${stats.totalSpend.toLocaleString()}</p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center text-lg">💵</div>
          </div>
          <div className="flex items-center gap-1 text-xs text-[#6B7280]">
            <TrendingUp size={14} /> <span>+12.5% o'qiga nisbatan</span>
          </div>
        </Card>

        {/* Total Clicks */}
        <Card className="p-6 border border-[#E5E7EB] hover:border-green-200 transition-all">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-[#6B7280] text-sm font-medium">👆 Jami Kliklar</p>
              <p className="text-3xl font-bold text-[#111827] mt-2">{stats.totalClicks.toLocaleString()}</p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center text-lg">🖱️</div>
          </div>
          <div className="flex items-center gap-1 text-xs text-[#6B7280]">
            <TrendingUp size={14} /> <span>+8.3% o'qiga nisbatan</span>
          </div>
        </Card>

        {/* Total Conversions */}
        <Card className="p-6 border border-[#E5E7EB] hover:border-purple-200 transition-all">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-[#6B7280] text-sm font-medium">✅ Konversiyalar</p>
              <p className="text-3xl font-bold text-[#111827] mt-2">{stats.totalConversions.toLocaleString()}</p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-purple-100 flex items-center justify-center text-lg">✨</div>
          </div>
          <div className="flex items-center gap-1 text-xs text-[#6B7280]">
            <TrendingUp size={14} /> <span>+15.2% o'qiga nisbatan</span>
          </div>
        </Card>

        {/* Average ROAS */}
        <Card className="p-6 border border-[#E5E7EB] hover:border-orange-200 transition-all">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-[#6B7280] text-sm font-medium">📈 O'rtacha ROAS</p>
              <p className="text-3xl font-bold text-[#111827] mt-2">{stats.avgROAS.toFixed(2)}x</p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-orange-100 flex items-center justify-center text-lg">📊</div>
          </div>
          <div className="flex items-center gap-1 text-xs text-[#6B7280]">
            <TrendingDown size={14} /> <span>-2.1% o'qiga nisbatan</span>
          </div>
        </Card>
      </div>

      {/* SECONDARY METRICS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* CPC */}
        <Card className="p-5 border border-[#E5E7EB]">
          <p className="text-[#6B7280] text-xs font-semibold uppercase mb-2">💸 Klik uchun Narx (CPC)</p>
          <p className="text-2xl font-bold text-[#111827]">${stats.cpc.toFixed(2)}</p>
          <p className="text-xs text-[#9CA3AF] mt-2">O'rtacha</p>
        </Card>

        {/* CPA */}
        <Card className="p-5 border border-[#E5E7EB]">
          <p className="text-[#6B7280] text-xs font-semibold uppercase mb-2">🎯 Akvisitsiya Narxi (CPA)</p>
          <p className="text-2xl font-bold text-[#111827]">${stats.cpa.toFixed(2)}</p>
          <p className="text-xs text-[#9CA3AF] mt-2">O'rtacha</p>
        </Card>

        {/* CTR */}
        <Card className="p-5 border border-[#E5E7EB]">
          <p className="text-[#6B7280] text-xs font-semibold uppercase mb-2">📊 Konversiya Darajasi</p>
          <p className="text-2xl font-bold text-[#111827]">{(stats.ctr * 100).toFixed(2)}%</p>
          <p className="text-xs text-[#9CA3AF] mt-2">O'rtacha</p>
        </Card>
      </div>

      {/* CHARTS SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Performance Trend */}
        <Card className="p-6 border border-[#E5E7EB]">
          <h3 className="font-semibold text-[#111827] mb-4 flex items-center gap-2">
            <TrendingUp size={18} /> 7-kunlik Tendensiya
          </h3>
          <div className="h-[300px] bg-[#F9FAFB] rounded-lg p-4">
            <LineChart data={PERFORMANCE_DATA} />
          </div>
        </Card>

        {/* Platform Breakdown */}
        <Card className="p-6 border border-[#E5E7EB]">
          <h3 className="font-semibold text-[#111827] mb-4 flex items-center gap-2">
            🔹 Platformalar bo'yicha Taqsimot
          </h3>
          <div className="space-y-4">
            {platformStats.map(([platform, stats]) => (
              <div key={platform} className={`p-4 rounded-lg border-l-4 ${PLATFORM_COLORS[platform as string].border}`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-[#111827]">
                    {PLATFORM_COLORS[platform as string].icon} {platform.toUpperCase()}
                  </span>
                  <Badge>{stats.count} kampanya</Badge>
                </div>
                <div className="grid grid-cols-3 gap-3 text-sm">
                  <div>
                    <p className="text-[#6B7280]">Sarfa</p>
                    <p className="font-semibold text-[#111827]">${stats.spend.toLocaleString()}</p>
                  </div>
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
            ))}
          </div>
        </Card>
      </div>

      {/* CAMPAIGNS TABLE */}
      <Card className="p-6 border border-[#E5E7EB]">
        <h3 className="font-semibold text-[#111827] mb-4 flex items-center gap-2">
          📋 Aktiv Kampaniyalar ({filteredCampaigns.length})
        </h3>

        {filteredCampaigns.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-[#6B7280]">Filtrga mos kampaniya topilmadi</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#E5E7EB]">
                  <th className="text-left py-3 px-4 text-[#6B7280] font-semibold">Kampanya Nomi</th>
                  <th className="text-left py-3 px-4 text-[#6B7280] font-semibold">Platform</th>
                  <th className="text-right py-3 px-4 text-[#6B7280] font-semibold">Sarfa</th>
                  <th className="text-right py-3 px-4 text-[#6B7280] font-semibold">Kliklar</th>
                  <th className="text-right py-3 px-4 text-[#6B7280] font-semibold">Konversiya</th>
                  <th className="text-right py-3 px-4 text-[#6B7280] font-semibold">ROAS</th>
                  <th className="text-center py-3 px-4 text-[#6B7280] font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredCampaigns.map(campaign => (
                  <tr key={campaign.id} className="border-b border-[#F3F4F6] hover:bg-[#F9FAFB] transition-all">
                    <td className="py-3 px-4 font-medium text-[#111827]">{campaign.name}</td>
                    <td className="py-3 px-4">
                      <Badge>{PLATFORM_COLORS[campaign.platform].icon} {campaign.platform}</Badge>
                    </td>
                    <td className="py-3 px-4 text-right font-semibold text-[#111827]">${campaign.spend.toLocaleString()}</td>
                    <td className="py-3 px-4 text-right text-[#6B7280]">{campaign.clicks.toLocaleString()}</td>
                    <td className="py-3 px-4 text-right text-[#6B7280]">{campaign.conversions.toLocaleString()}</td>
                    <td className="py-3 px-4 text-right font-bold text-green-600">{campaign.roas.toFixed(2)}x</td>
                    <td className="py-3 px-4 text-center">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        campaign.status === 'active'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}>
                        {campaign.status === 'active' ? '🟢 Faol' : '⏸️ To\'xtatilgan'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* INSIGHTS SECTION */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Top Recommendations */}
        <Card className="p-6 border border-[#E5E7EB] bg-gradient-to-br from-blue-50 to-blue-100/50">
          <h3 className="font-semibold text-[#111827] mb-4 flex items-center gap-2">
            💡 Tavsiyalar
          </h3>
          <ul className="space-y-3">
            <li className="flex items-start gap-3">
              <span className="text-xl mt-1">✨</span>
              <div>
                <p className="font-medium text-[#111827]">Google kampanyasini ko'paytirib ko'ring</p>
                <p className="text-xs text-[#6B7280] mt-1">Google ROAS 2.1x bo'lib, Meta-ga nisbatan pastroq</p>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-xl">🎯</span>
              <div>
                <p className="font-medium text-[#111827]">Yandex kampanyasini faollashtiring</p>
                <p className="text-xs text-[#6B7280] mt-1">Pauzada bo'lgan kampanya ROAS 2.8x o'lchamida potentsialga ega</p>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-xl">📈</span>
              <div>
                <p className="font-medium text-[#111827]">Budget optimizatsiyasi</p>
                <p className="text-xs text-[#6B7280] mt-1">Top 2 kampaniyaga 20% ko'proq byudjet belgilang</p>
              </div>
            </li>
          </ul>
        </Card>

        {/* Performance Summary */}
        <Card className="p-6 border border-[#E5E7EB] bg-gradient-to-br from-green-50 to-emerald-100/50">
          <h3 className="font-semibold text-[#111827] mb-4 flex items-center gap-2">
            ✅ Xulosa
          </h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-[#6B7280] font-medium">Kampanya Sog'ligi</span>
                <span className="text-lg font-bold text-green-600">92%</span>
              </div>
              <div className="w-full bg-[#E5E7EB] rounded-full h-2">
                <div className="bg-green-500 h-2 rounded-full" style={{width: '92%'}}></div>
              </div>
            </div>
            <div>
              <p className="text-sm text-[#6B7280] mb-2">📊 <strong>4 aktiv kampanya</strong> - Umumiy sarfa: ${stats.totalSpend.toLocaleString()}</p>
              <p className="text-sm text-[#6B7280]">🎯 <strong>O'rtacha ROAS:</strong> {stats.avgROAS.toFixed(2)}x - Yaxshi natija!</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
