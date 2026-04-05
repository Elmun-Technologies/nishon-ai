'use client'

import { useState } from 'react'
import { Badge } from '@/components/ui/Badge'
import { Search, TrendingUp, Grid3X3, List, CheckCircle2 } from 'lucide-react'

const MOCK_SPECIALISTS = [
  { id: 1, name: 'Ahmed Hassan', title: 'Senior Meta Specialist', avatar: '👨‍💼', rating: 4.9, reviews: 287, roas: 3.2, experience: '5+ years', platforms: ['meta', 'google'], verified: true, avgSpend: '$15k', successRate: 94 },
  { id: 2, name: 'Fatima Al-Rashid', title: 'Google Ads Expert', avatar: '👩‍💼', rating: 4.8, reviews: 156, roas: 2.8, experience: '4+ years', platforms: ['google', 'yandex'], verified: true, avgSpend: '$12k', successRate: 91 },
  { id: 3, name: 'Davron Karimov', title: 'Performance Marketing', avatar: '👨‍💻', rating: 4.7, reviews: 203, roas: 3.5, experience: '6+ years', platforms: ['meta', 'google', 'yandex'], verified: true, avgSpend: '$18k', successRate: 96 },
  { id: 4, name: 'Zarina Uzbek', title: 'Yandex Specialist', avatar: '👩‍💻', rating: 4.6, reviews: 142, roas: 3.1, experience: '3+ years', platforms: ['yandex'], verified: false, avgSpend: '$8k', successRate: 88 },
]

const TRENDING = [
  { name: 'Ahmed Hassan', up: true, change: '+28.5%' },
  { name: 'Davron Karimov', up: true, change: '+15.3%' },
  { name: 'Fatima Al-Rashid', up: false, change: '-5.2%' },
]

const PLATFORM_ICONS: Record<string, string> = { meta: '📘', google: '🔍', yandex: '🟡' }

export function Marketplace() {
  const [sortBy, setSortBy] = useState('rating')
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid')
  const [searchQuery, setSearchQuery] = useState('')
  const [filters, setFilters] = useState({
    minRating: 0,
    platforms: ['meta', 'google', 'yandex'],
    verified: false,
  })

  const filtered = MOCK_SPECIALISTS.filter(s => {
    if (filters.verified && !s.verified) return false
    if (s.rating < filters.minRating) return false
    if (!filters.platforms.some(p => s.platforms.includes(p))) return false
    if (searchQuery && !s.name.toLowerCase().includes(searchQuery.toLowerCase())) return false
    return true
  }).sort((a, b) =>
    sortBy === 'rating' ? b.rating - a.rating :
    sortBy === 'roas'   ? b.roas - a.roas : b.reviews - a.reviews
  )

  const filterLabelClass = "text-text-tertiary text-xs font-semibold uppercase tracking-wider mb-2"
  const filterItemClass = "flex items-center gap-2.5 cursor-pointer group text-sm text-text-secondary hover:text-text-primary"

  return (
    <div className="flex flex-col min-h-full" style={{ color: 'var(--c-text-primary)' }}>

      {/* Search */}
      <div className="mb-6">
        <div className="relative max-w-lg">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
          <input
            type="text"
            placeholder="Specialist qidirish..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 text-sm rounded-lg focus:outline-none focus:ring-2 transition-colors"
            style={{
              background: 'var(--c-surface)',
              border: '1px solid var(--c-border)',
              color: 'var(--c-text-primary)',
            }}
          />
        </div>
      </div>

      <div className="flex gap-6 min-h-0">

        {/* Sidebar Filters */}
        <div className="w-56 shrink-0 space-y-5">
          {/* Rating */}
          <div>
            <p className={filterLabelClass}>Rating</p>
            <div className="space-y-1.5">
              {[{ label: 'Barchasi', value: 0 }, { label: '4.5+', value: 4.5 }, { label: '4.0+', value: 4.0 }, { label: '3.5+', value: 3.5 }].map(r => (
                <label key={r.value} className={filterItemClass}>
                  <input type="radio" name="rating" checked={filters.minRating === r.value}
                    onChange={() => setFilters(p => ({ ...p, minRating: r.value }))} />
                  {r.label}
                </label>
              ))}
            </div>
          </div>

          {/* Platforms */}
          <div>
            <p className={filterLabelClass}>Platformalar</p>
            <div className="space-y-1.5">
              {['meta', 'google', 'yandex'].map(platform => (
                <label key={platform} className={filterItemClass}>
                  <input type="checkbox" checked={filters.platforms.includes(platform)}
                    onChange={() => setFilters(p => ({
                      ...p,
                      platforms: p.platforms.includes(platform)
                        ? p.platforms.filter(x => x !== platform)
                        : [...p.platforms, platform]
                    }))} />
                  {PLATFORM_ICONS[platform]} {platform.charAt(0).toUpperCase() + platform.slice(1)}
                </label>
              ))}
            </div>
          </div>

          {/* Verified */}
          <div>
            <p className={filterLabelClass}>Status</p>
            <label className={filterItemClass}>
              <input type="checkbox" checked={filters.verified}
                onChange={() => setFilters(p => ({ ...p, verified: !p.verified }))} />
              Tasdiqlangan
            </label>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 min-w-0">

          {/* Trending */}
          <div className="mb-6">
            <h3 className="text-text-primary font-semibold text-sm mb-3 flex items-center gap-1.5">
              <TrendingUp size={15} /> Trending
            </h3>
            <div className="grid grid-cols-3 gap-3">
              {TRENDING.map(s => (
                <div key={s.name} className="rounded-lg px-3 py-2.5 flex items-center justify-between"
                  style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)' }}>
                  <p className="text-text-primary text-xs font-medium truncate">{s.name}</p>
                  <span className={`text-xs font-bold ml-2 shrink-0 ${s.up ? 'text-success' : 'text-error'}`}>
                    {s.up ? '↑' : '↓'} {s.change}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Sort + View controls */}
          <div className="flex items-center justify-between mb-5 gap-3">
            <div className="flex gap-2">
              {[{ key: 'rating', label: '⭐ Top Rated' }, { key: 'roas', label: '📈 ROAS' }, { key: 'reviews', label: '💬 Reviews' }].map(s => (
                <button key={s.key} onClick={() => setSortBy(s.key)}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                  style={{
                    background: sortBy === s.key ? 'var(--c-text-primary)' : 'var(--c-surface)',
                    color: sortBy === s.key ? 'var(--c-surface)' : 'var(--c-text-secondary)',
                    border: '1px solid var(--c-border)',
                  }}>
                  {s.label}
                </button>
              ))}
            </div>
            <div className="flex gap-1.5">
              {[{ mode: 'grid' as const, Icon: Grid3X3 }, { mode: 'table' as const, Icon: List }].map(({ mode, Icon }) => (
                <button key={mode} onClick={() => setViewMode(mode)}
                  className="p-2 rounded-lg transition-colors"
                  style={{
                    background: viewMode === mode ? 'var(--c-text-primary)' : 'var(--c-surface)',
                    color: viewMode === mode ? 'var(--c-surface)' : 'var(--c-text-secondary)',
                    border: '1px solid var(--c-border)',
                  }}>
                  <Icon size={15} />
                </button>
              ))}
            </div>
          </div>

          {/* Grid View */}
          {viewMode === 'grid' && (
            <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
              {filtered.map(s => (
                <div key={s.id} className="rounded-xl p-5 transition-all hover:shadow-md"
                  style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)' }}>
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-xl flex items-center justify-center text-xl"
                        style={{ background: 'var(--c-surface-2)' }}>
                        {s.avatar}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <h3 className="text-text-primary font-semibold text-sm">{s.name}</h3>
                          {s.verified && <CheckCircle2 size={13} className="text-success" />}
                        </div>
                        <p className="text-text-secondary text-xs">{s.title}</p>
                      </div>
                    </div>
                    <span className="text-text-secondary text-xs">{s.experience}</span>
                  </div>

                  <div className="grid grid-cols-4 gap-2 mb-4">
                    {[
                      { label: 'Rating', value: String(s.rating) },
                      { label: 'ROAS', value: `${s.roas}x`, green: true },
                      { label: 'Success', value: `${s.successRate}%` },
                      { label: 'Reviews', value: String(s.reviews) },
                    ].map(m => (
                      <div key={m.label} className="rounded-lg p-2 text-center"
                        style={{ background: 'var(--c-surface-2)' }}>
                        <p className="text-text-tertiary text-[10px] mb-0.5">{m.label}</p>
                        <p className={`font-bold text-sm ${m.green ? 'text-success' : 'text-text-primary'}`}>{m.value}</p>
                      </div>
                    ))}
                  </div>

                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {s.platforms.map(p => (
                      <span key={p} className="text-[11px] px-2 py-0.5 rounded-full font-medium"
                        style={{ background: 'var(--c-surface-2)', border: '1px solid var(--c-border)', color: 'var(--c-text-secondary)' }}>
                        {PLATFORM_ICONS[p]} {p}
                      </span>
                    ))}
                  </div>

                  <div className="flex items-center justify-between pt-3"
                    style={{ borderTop: '1px solid var(--c-border)' }}>
                    <span className="text-text-tertiary text-xs">Avg. {s.avgSpend}/oy</span>
                    <button className="px-3 py-1.5 rounded-lg text-xs font-medium transition-opacity hover:opacity-80"
                      style={{ background: 'var(--c-text-primary)', color: 'var(--c-surface)' }}>
                      Profil →
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Table View */}
          {viewMode === 'table' && (
            <div className="rounded-xl overflow-hidden"
              style={{ border: '1px solid var(--c-border)' }}>
              <table className="w-full text-sm">
                <thead style={{ background: 'var(--c-surface-2)' }}>
                  <tr>
                    {['Mutaxassis', 'Rating', 'ROAS', 'Muvaffaqiyat', 'Reviews', 'Sarflash', ''].map(h => (
                      <th key={h} className="py-2.5 px-4 text-text-tertiary font-medium text-xs text-left last:text-center">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((s, i) => (
                    <tr key={s.id} style={{ borderTop: i > 0 ? '1px solid var(--c-border)' : 'none' }}
                      className="hover:opacity-80 transition-opacity">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{s.avatar}</span>
                          <div>
                            <p className="text-text-primary font-medium text-sm">{s.name}</p>
                            <p className="text-text-tertiary text-xs">{s.title}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-text-primary font-medium">⭐ {s.rating}</td>
                      <td className="py-3 px-4 text-success font-bold">{s.roas}x</td>
                      <td className="py-3 px-4 text-text-primary">{s.successRate}%</td>
                      <td className="py-3 px-4 text-text-secondary">{s.reviews}</td>
                      <td className="py-3 px-4 text-text-secondary">{s.avgSpend}</td>
                      <td className="py-3 px-4 text-center">
                        <button className="px-3 py-1 rounded-lg text-xs font-medium transition-opacity hover:opacity-80"
                          style={{ background: 'var(--c-text-primary)', color: 'var(--c-surface)' }}>
                          Profil
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {filtered.length === 0 && (
            <div className="text-center py-16">
              <p className="text-text-tertiary text-sm">Hech qanday mutaxassis topilmadi</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
