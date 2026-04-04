'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { LineChart } from '@/components/ui/Charts'
import { TrendingUp, TrendingDown, Star } from 'lucide-react'

const MOCK_SPECIALISTS = [
  {
    id: 1,
    name: 'Ahmed Hassan',
    title: 'Senior Meta Specialist',
    avatar: '👨‍💼',
    rating: 4.9,
    reviews: 287,
    roas: 3.2,
    experience: '5+ years',
    platforms: ['meta', 'google'],
    verified: true,
    avgSpend: '$15k/month',
    successRate: 94,
  },
  {
    id: 2,
    name: 'Fatima Al-Rashid',
    title: 'Google Ads Expert',
    avatar: '👩‍💼',
    rating: 4.8,
    reviews: 156,
    roas: 2.8,
    experience: '4+ years',
    platforms: ['google', 'yandex'],
    verified: true,
    avgSpend: '$12k/month',
    successRate: 91,
  },
  {
    id: 3,
    name: 'Davron Karimov',
    title: 'Performance Marketing',
    avatar: '👨‍💻',
    rating: 4.7,
    reviews: 203,
    roas: 3.5,
    experience: '6+ years',
    platforms: ['meta', 'google', 'yandex'],
    verified: true,
    avgSpend: '$18k/month',
    successRate: 96,
  },
]

const PERFORMANCE_DATA = [
  { date: 'Jan 1', revenue: 12000 },
  { date: 'Jan 8', revenue: 15500 },
  { date: 'Jan 15', revenue: 14200 },
  { date: 'Jan 22', revenue: 18900 },
  { date: 'Jan 29', revenue: 17600 },
  { date: 'Feb 5', revenue: 21300 },
  { date: 'Feb 12', revenue: 19800 },
]

export function Marketplace() {
  const [sortBy, setSortBy] = useState('rating')
  const [timeRange, setTimeRange] = useState('7d')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  const sortedSpecialists = [...MOCK_SPECIALISTS].sort((a, b) => {
    if (sortBy === 'rating') return b.rating - a.rating
    if (sortBy === 'roas') return b.roas - a.roas
    return b.reviews - a.reviews
  })

  return (
    <div className="min-h-screen bg-[#0F172A]">
      {/* Header */}
      <div className="border-b border-[#1E293B] bg-[#0F172A] sticky top-0 z-40">
        <div className="p-6 max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold text-white mb-2">Marketplace</h1>
          <p className="text-[#94A3B8]">Discover top-performing advertising specialists</p>
        </div>
      </div>

      <div className="flex min-h-[calc(100vh-100px)]">
        {/* Sidebar Filters */}
        <div className="w-64 border-r border-[#1E293B] bg-[#0F172A] p-6 overflow-y-auto">
          <h3 className="text-white font-semibold mb-4">Filter By</h3>

          {/* Rating Filter */}
          <div className="mb-6">
            <p className="text-[#94A3B8] text-xs font-semibold uppercase mb-3">Rating</p>
            <div className="space-y-2">
              {[4.5, 4.0, 3.5].map(rating => (
                <label key={rating} className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" className="rounded" defaultChecked={rating === 4.5} />
                  <span className="text-sm text-[#E2E8F0]">{rating}+ ⭐</span>
                </label>
              ))}
            </div>
          </div>

          {/* Platform Filter */}
          <div className="mb-6">
            <p className="text-[#94A3B8] text-xs font-semibold uppercase mb-3">Platforms</p>
            <div className="space-y-2">
              {['Meta', 'Google', 'Yandex'].map(platform => (
                <label key={platform} className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" className="rounded" defaultChecked />
                  <span className="text-sm text-[#E2E8F0]">{platform}</span>
                </label>
              ))}
            </div>
          </div>

          {/* ROAS Filter */}
          <div className="mb-6">
            <p className="text-[#94A3B8] text-xs font-semibold uppercase mb-3">Min ROAS</p>
            <div className="space-y-2">
              {['2.0x+', '2.5x+', '3.0x+'].map(roas => (
                <label key={roas} className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="roas" className="rounded-full" defaultChecked={roas === '2.5x+'} />
                  <span className="text-sm text-[#E2E8F0]">{roas}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Experience Filter */}
          <div>
            <p className="text-[#94A3B8] text-xs font-semibold uppercase mb-3">Experience</p>
            <div className="space-y-2">
              {['3+ years', '5+ years', '10+ years'].map(exp => (
                <label key={exp} className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" className="rounded" />
                  <span className="text-sm text-[#E2E8F0]">{exp}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-6">
          {/* Controls */}
          <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
            <div className="flex gap-2">
              {['rating', 'roas', 'reviews'].map(sort => (
                <button
                  key={sort}
                  onClick={() => setSortBy(sort)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    sortBy === sort
                      ? 'bg-blue-600 text-white'
                      : 'bg-[#1E293B] text-[#94A3B8] hover:bg-[#334155]'
                  }`}
                >
                  {sort === 'rating' ? '⭐ Top Rated' : sort === 'roas' ? '📈 Best ROAS' : '💬 Most Reviews'}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              {['7d', '30d', '90d'].map(range => (
                <button
                  key={range}
                  onClick={() => setTimeRange(range)}
                  className={`px-3 py-1 rounded text-xs font-medium transition-all ${
                    timeRange === range
                      ? 'bg-blue-600 text-white'
                      : 'bg-[#1E293B] text-[#94A3B8]'
                  }`}
                >
                  {range}
                </button>
              ))}
            </div>
          </div>

          {/* Specialists Grid */}
          <div className={`grid gap-4 ${viewMode === 'grid' ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1'}`}>
            {sortedSpecialists.map(specialist => (
              <div
                key={specialist.id}
                className="bg-[#1E293B] border border-[#334155] rounded-xl p-6 hover:border-blue-500 transition-all cursor-pointer group"
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-xl">
                      {specialist.avatar}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-white font-semibold text-lg">{specialist.name}</h3>
                      <p className="text-[#94A3B8] text-sm">{specialist.title}</p>
                    </div>
                  </div>
                  {specialist.verified && <Badge className="bg-green-500/20 text-green-400">✓ Verified</Badge>}
                </div>

                {/* Metrics */}
                <div className="grid grid-cols-4 gap-3 mb-4">
                  <div className="bg-[#0F172A] rounded-lg p-3 text-center">
                    <p className="text-[#94A3B8] text-xs font-medium mb-1">Rating</p>
                    <p className="text-white font-bold text-lg">{specialist.rating}</p>
                    <p className="text-[#64748B] text-xs">({specialist.reviews})</p>
                  </div>
                  <div className="bg-[#0F172A] rounded-lg p-3 text-center">
                    <p className="text-[#94A3B8] text-xs font-medium mb-1">ROAS</p>
                    <p className="text-green-400 font-bold text-lg">{specialist.roas}x</p>
                    <TrendingUp size={14} className="mx-auto text-green-400" />
                  </div>
                  <div className="bg-[#0F172A] rounded-lg p-3 text-center">
                    <p className="text-[#94A3B8] text-xs font-medium mb-1">Success</p>
                    <p className="text-white font-bold text-lg">{specialist.successRate}%</p>
                  </div>
                  <div className="bg-[#0F172A] rounded-lg p-3 text-center">
                    <p className="text-[#94A3B8] text-xs font-medium mb-1">Exp.</p>
                    <p className="text-white font-bold text-sm">{specialist.experience}</p>
                  </div>
                </div>

                {/* Platforms */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {specialist.platforms.map(platform => (
                    <Badge key={platform} className="bg-[#334155] text-[#E2E8F0] uppercase text-xs">
                      {platform === 'meta' && '📘'} {platform === 'google' && '🔍'} {platform === 'yandex' && '🟡'} {platform}
                    </Badge>
                  ))}
                </div>

                {/* Footer */}
                <div className="flex justify-between items-center pt-4 border-t border-[#334155]">
                  <span className="text-[#94A3B8] text-sm">Avg. {specialist.avgSpend}</span>
                  <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium text-sm transition-all">
                    View Profile →
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
