'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { LineChart } from '@/components/ui/Charts'
import { Search, TrendingUp, Grid3X3, List } from 'lucide-react'

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
    avgSpend: '$15k',
    successRate: 94,
    trend: [12, 15, 14, 18, 17, 21, 19],
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
    avgSpend: '$12k',
    successRate: 91,
    trend: [10, 13, 12, 16, 15, 19, 17],
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
    avgSpend: '$18k',
    successRate: 96,
    trend: [14, 17, 16, 20, 18, 23, 21],
  },
  {
    id: 4,
    name: 'Zarina Uzbek',
    title: 'Yandex Specialist',
    avatar: '👩‍💻',
    rating: 4.6,
    reviews: 142,
    roas: 3.1,
    experience: '3+ years',
    platforms: ['yandex'],
    verified: false,
    avgSpend: '$8k',
    successRate: 88,
    trend: [9, 11, 10, 14, 13, 17, 15],
  },
]

const TRENDING_SPECIALISTS = [
  { name: 'Ahmed Hassan', trending: 'up', change: '+28.5%' },
  { name: 'Davron Karimov', trending: 'up', change: '+15.3%' },
  { name: 'Fatima Al-Rashid', trending: 'down', change: '-5.2%' },
]

export function Marketplace() {
  const [sortBy, setSortBy] = useState('rating')
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid')
  const [searchQuery, setSearchQuery] = useState('')
  const [filters, setFilters] = useState({
    minRating: 0,
    platforms: ['meta', 'google', 'yandex'],
    verified: false,
    minExperience: 0,
  })

  const filteredSpecialists = MOCK_SPECIALISTS.filter(s => {
    if (filters.verified && !s.verified) return false
    if (s.rating < filters.minRating) return false
    if (!filters.platforms.some(p => s.platforms.includes(p))) return false
    if (searchQuery && !s.name.toLowerCase().includes(searchQuery.toLowerCase())) return false
    return true
  }).sort((a, b) => {
    if (sortBy === 'rating') return b.rating - a.rating
    if (sortBy === 'roas') return b.roas - a.roas
    return b.reviews - a.reviews
  })

  return (
    <div className="min-h-screen bg-[#0F172A]">
      {/* Header */}
      <div className="border-b border-[#1E293B] bg-[#0F172A] sticky top-0 z-40">
        <div className="p-6 max-w-full">
          <h1 className="text-3xl font-bold text-white mb-4">Marketplace</h1>

          {/* Search Bar */}
          <div className="flex gap-3 mb-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 w-5 h-5 text-[#64748B]" />
              <input
                type="text"
                placeholder="Search specialists..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-[#1E293B] border border-[#334155] rounded-lg text-white placeholder-[#64748B] focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="flex min-h-[calc(100vh-180px)]">
        {/* Sidebar Filters */}
        <div className="w-72 border-r border-[#1E293B] bg-[#0F172A] p-6 overflow-y-auto">
          <h3 className="text-white font-bold text-lg mb-6">Filter By</h3>

          {/* Rating Filter */}
          <div className="mb-6">
            <p className="text-[#94A3B8] text-xs font-bold uppercase tracking-wider mb-3">Rating</p>
            <div className="space-y-2">
              {[
                { label: 'All', value: 0 },
                { label: '4.5+', value: 4.5 },
                { label: '4.0+', value: 4.0 },
                { label: '3.5+', value: 3.5 },
              ].map(r => (
                <label key={r.value} className="flex items-center gap-3 cursor-pointer group">
                  <input
                    type="radio"
                    name="rating"
                    value={r.value}
                    checked={filters.minRating === r.value}
                    onChange={() => setFilters(prev => ({ ...prev, minRating: r.value }))}
                    className="rounded-full"
                  />
                  <span className="text-sm text-[#E2E8F0] group-hover:text-white">{r.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Platform Filter */}
          <div className="mb-6">
            <p className="text-[#94A3B8] text-xs font-bold uppercase tracking-wider mb-3">Platforms</p>
            <div className="space-y-2">
              {['meta', 'google', 'yandex'].map(platform => (
                <label key={platform} className="flex items-center gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={filters.platforms.includes(platform)}
                    onChange={() => {
                      setFilters(prev => ({
                        ...prev,
                        platforms: prev.platforms.includes(platform)
                          ? prev.platforms.filter(p => p !== platform)
                          : [...prev.platforms, platform]
                      }))
                    }}
                    className="rounded"
                  />
                  <span className="text-sm text-[#E2E8F0] group-hover:text-white capitalize">
                    {platform === 'meta' && '📘'} {platform === 'google' && '🔍'} {platform === 'yandex' && '🟡'} {platform}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* ROAS Filter */}
          <div className="mb-6">
            <p className="text-[#94A3B8] text-xs font-bold uppercase tracking-wider mb-3">Min ROAS</p>
            <div className="space-y-2">
              {['2.0x+', '2.5x+', '3.0x+', '3.5x+'].map(roas => (
                <label key={roas} className="flex items-center gap-3 cursor-pointer group">
                  <input type="radio" name="roas" className="rounded-full" defaultChecked={roas === '2.5x+'} />
                  <span className="text-sm text-[#E2E8F0] group-hover:text-white">{roas}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Experience Filter */}
          <div className="mb-6">
            <p className="text-[#94A3B8] text-xs font-bold uppercase tracking-wider mb-3">Experience</p>
            <div className="space-y-2">
              {['All', '3+ years', '5+ years', '10+ years'].map(exp => (
                <label key={exp} className="flex items-center gap-3 cursor-pointer group">
                  <input type="radio" name="exp" className="rounded-full" defaultChecked={exp === 'All'} />
                  <span className="text-sm text-[#E2E8F0] group-hover:text-white">{exp}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Verified Filter */}
          <div className="mb-6">
            <p className="text-[#94A3B8] text-xs font-bold uppercase tracking-wider mb-3">Status</p>
            <label className="flex items-center gap-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={filters.verified}
                onChange={() => setFilters(prev => ({ ...prev, verified: !prev.verified }))}
                className="rounded"
              />
              <span className="text-sm text-[#E2E8F0] group-hover:text-white">Is Verified</span>
            </label>
          </div>

          {/* Average Monthly Spend */}
          <div>
            <p className="text-[#94A3B8] text-xs font-bold uppercase tracking-wider mb-3">Avg Spend</p>
            <div className="space-y-2">
              {['<$5k', '$5k-$10k', '$10k-$20k', '$20k+'].map(spend => (
                <label key={spend} className="flex items-center gap-3 cursor-pointer group">
                  <input type="checkbox" className="rounded" />
                  <span className="text-sm text-[#E2E8F0] group-hover:text-white">{spend}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-6">
          {/* Trending Section */}
          <div className="mb-8">
            <h3 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
              <TrendingUp size={20} /> Trending Specialists
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {TRENDING_SPECIALISTS.map((spec, idx) => (
                <Card key={idx} className="p-4 bg-[#1E293B] border-[#334155] hover:border-green-500 transition-all">
                  <div className="flex items-center justify-between">
                    <p className="text-white font-semibold text-sm">{spec.name}</p>
                    <span className={spec.trending === 'up' ? 'text-green-400 font-bold' : 'text-red-400 font-bold'}>
                      {spec.trending === 'up' ? '↑' : '↓'} {spec.change}
                    </span>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
            <div className="flex gap-2">
              {[
                { key: 'rating', label: '⭐ Top Rated' },
                { key: 'roas', label: '📈 Best ROAS' },
                { key: 'reviews', label: '💬 Most Reviews' },
              ].map(sort => (
                <button
                  key={sort.key}
                  onClick={() => setSortBy(sort.key)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    sortBy === sort.key
                      ? 'bg-blue-600 text-white'
                      : 'bg-[#1E293B] text-[#94A3B8] hover:bg-[#334155]'
                  }`}
                >
                  {sort.label}
                </button>
              ))}
            </div>

            {/* View Toggle */}
            <div className="flex gap-2">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded transition-all ${
                  viewMode === 'grid'
                    ? 'bg-blue-600 text-white'
                    : 'bg-[#1E293B] text-[#94A3B8] hover:bg-[#334155]'
                }`}
                title="Grid view"
              >
                <Grid3X3 size={18} />
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`p-2 rounded transition-all ${
                  viewMode === 'table'
                    ? 'bg-blue-600 text-white'
                    : 'bg-[#1E293B] text-[#94A3B8] hover:bg-[#334155]'
                }`}
                title="Table view"
              >
                <List size={18} />
              </button>
            </div>
          </div>

          {/* Grid View */}
          {viewMode === 'grid' && (
            <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
              {filteredSpecialists.map(specialist => (
                <div key={specialist.id} className="bg-[#1E293B] border border-[#334155] rounded-xl p-6 hover:border-blue-500 transition-all group">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-xl">
                        {specialist.avatar}
                      </div>
                      <div>
                        <h3 className="text-white font-semibold">{specialist.name}</h3>
                        <p className="text-[#94A3B8] text-sm">{specialist.title}</p>
                      </div>
                    </div>
                    {specialist.verified && <Badge className="bg-green-500/20 text-green-400 text-xs">✓</Badge>}
                  </div>

                  <div className="grid grid-cols-4 gap-2 mb-4">
                    <div className="bg-[#0F172A] rounded p-2 text-center">
                      <p className="text-[#64748B] text-xs">Rating</p>
                      <p className="text-white font-bold">{specialist.rating}</p>
                    </div>
                    <div className="bg-[#0F172A] rounded p-2 text-center">
                      <p className="text-[#64748B] text-xs">ROAS</p>
                      <p className="text-green-400 font-bold">{specialist.roas}x</p>
                    </div>
                    <div className="bg-[#0F172A] rounded p-2 text-center">
                      <p className="text-[#64748B] text-xs">Success</p>
                      <p className="text-white font-bold">{specialist.successRate}%</p>
                    </div>
                    <div className="bg-[#0F172A] rounded p-2 text-center">
                      <p className="text-[#64748B] text-xs">Reviews</p>
                      <p className="text-white font-bold text-sm">{specialist.reviews}</p>
                    </div>
                  </div>

                  <div className="mb-3">
                    <svg viewBox="0 0 100 30" className="w-full h-10 text-green-400">
                      <polyline points="0,25 15,15 30,18 45,8 60,12 75,5 90,10 100,8" fill="none" stroke="currentColor" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
                    </svg>
                  </div>

                  <div className="flex flex-wrap gap-2 mb-4">
                    {specialist.platforms.map(p => (
                      <Badge key={p} className="bg-[#334155] text-[#E2E8F0] text-xs uppercase">{p}</Badge>
                    ))}
                  </div>

                  <div className="flex justify-between pt-4 border-t border-[#334155]">
                    <span className="text-[#94A3B8] text-sm">Avg. {specialist.avgSpend}</span>
                    <button className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded transition-all">
                      View →
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Table View */}
          {viewMode === 'table' && (
            <Card className="p-6 bg-[#1E293B] border-[#334155]">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[#334155]">
                      <th className="text-left py-3 px-4 text-[#94A3B8] font-bold">Specialist</th>
                      <th className="text-right py-3 px-4 text-[#94A3B8] font-bold">Rating</th>
                      <th className="text-right py-3 px-4 text-[#94A3B8] font-bold">ROAS</th>
                      <th className="text-right py-3 px-4 text-[#94A3B8] font-bold">Success Rate</th>
                      <th className="text-right py-3 px-4 text-[#94A3B8] font-bold">Reviews</th>
                      <th className="text-right py-3 px-4 text-[#94A3B8] font-bold">Avg Spend</th>
                      <th className="text-center py-3 px-4 text-[#94A3B8] font-bold">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSpecialists.map(specialist => (
                      <tr key={specialist.id} className="border-b border-[#334155] hover:bg-[#0F172A] transition-all">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <span className="text-xl">{specialist.avatar}</span>
                            <div>
                              <p className="text-white font-medium">{specialist.name}</p>
                              <p className="text-[#64748B] text-xs">{specialist.title}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-right text-white font-semibold">{specialist.rating}</td>
                        <td className="py-3 px-4 text-right text-green-400 font-bold">{specialist.roas}x</td>
                        <td className="py-3 px-4 text-right text-white">{specialist.successRate}%</td>
                        <td className="py-3 px-4 text-right text-[#94A3B8]">{specialist.reviews}</td>
                        <td className="py-3 px-4 text-right text-white">{specialist.avgSpend}</td>
                        <td className="py-3 px-4 text-center">
                          <button className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded transition-all">
                            View
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          {/* No Results */}
          {filteredSpecialists.length === 0 && (
            <div className="text-center py-12">
              <p className="text-[#94A3B8] text-lg">No specialists found matching your criteria</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
