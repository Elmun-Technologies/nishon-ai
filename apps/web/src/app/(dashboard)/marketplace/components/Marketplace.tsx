'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Badge } from '@/components/ui/Badge'
import { Search, TrendingUp, Grid3X3, List, CheckCircle2, Loader2 } from 'lucide-react'
import { useSpecialistSearch } from '@/hooks/useSpecialistSearch'

const PLATFORM_ICONS: Record<string, string> = { meta: '📘', google: '🔍', yandex: '🟡', tiktok: '🎵' }

export function Marketplace() {
  const [sortBy, setSortBy] = useState<'rating' | 'roas' | 'trending'>('rating')
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid')
  const [searchQuery, setSearchQuery] = useState('')
  const [filters, setFilters] = useState({
    minRating: 0,
    platforms: [] as string[],
    verified: false,
  })

  // Debounce search input — avoids API call on every keystroke
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const handleSearch = (value: string) => {
    setSearchQuery(value)
    clearTimeout((handleSearch as any)._timer)
    ;(handleSearch as any)._timer = setTimeout(() => setDebouncedQuery(value), 400)
  }

  const { specialists, loading, error, total } = useSpecialistSearch(
    {
      query: debouncedQuery || undefined,
      platforms: filters.platforms.length ? filters.platforms : undefined,
      minRating: filters.minRating || undefined,
    },
    { sortBy, pageSize: 20 },
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
            onChange={e => handleSearch(e.target.value)}
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
              {['meta', 'google', 'yandex', 'tiktok'].map(platform => (
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
        </div>

        {/* Main Content */}
        <div className="flex-1 min-w-0">

          {/* Sort + View controls */}
          <div className="flex items-center justify-between mb-5 gap-3">
            <div className="flex items-center gap-2">
              <span className="text-text-tertiary text-xs">{total} ta specialist</span>
              <div className="flex gap-2">
                {[{ key: 'rating' as const, label: '⭐ Top Rated' }, { key: 'roas' as const, label: '📈 ROAS' }, { key: 'trending' as const, label: '🔥 Trending' }].map(s => (
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

          {/* Loading */}
          {loading && (
            <div className="flex items-center justify-center py-20 text-text-tertiary gap-2">
              <Loader2 size={18} className="animate-spin" />
              <span className="text-sm">Yuklanmoqda...</span>
            </div>
          )}

          {/* Error */}
          {error && !loading && (
            <div className="rounded-xl p-6 text-center" style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)' }}>
              <p className="text-text-secondary text-sm">Mutaxassislarni yuklashda xatolik yuz berdi</p>
              <p className="text-text-tertiary text-xs mt-1">{error.message}</p>
            </div>
          )}

          {/* Empty */}
          {!loading && !error && specialists.length === 0 && (
            <div className="rounded-xl p-12 text-center" style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)' }}>
              <p className="text-text-secondary text-sm">No specialists found</p>
              <p className="text-text-tertiary text-xs mt-1">Try changing the filters</p>
            </div>
          )}

          {/* Grid View */}
          {!loading && !error && viewMode === 'grid' && (
            <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
              {specialists.map(s => (
                <div key={s.id} className="rounded-xl p-5 transition-all hover:shadow-md"
                  style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)' }}>
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-xl flex items-center justify-center text-xl"
                        style={{ background: s.avatarColor || 'var(--c-surface-2)' }}>
                        {s.avatar || '👤'}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <h3 className="text-text-primary font-semibold text-sm">{s.displayName}</h3>
                          {s.isVerified && <CheckCircle2 size={13} className="text-success" />}
                        </div>
                        <p className="text-text-secondary text-xs">{s.title}</p>
                      </div>
                    </div>
                    {s.isFeatured && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                        style={{ background: 'var(--c-accent-subtle)', color: 'var(--c-accent)' }}>
                        ⭐ Featured
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-4 gap-2 mb-4">
                    {[
                      { label: 'Rating', value: s.rating ? s.rating.toFixed(1) : '—' },
                      { label: 'ROAS', value: s.stats?.avgROAS ? `${s.stats.avgROAS.toFixed(1)}x` : '—', green: true },
                      { label: 'Success', value: s.stats?.successRate ? `${s.stats.successRate}%` : '—' },
                      { label: 'Reviews', value: String(s.reviewCount ?? 0) },
                    ].map(m => (
                      <div key={m.label} className="rounded-lg p-2 text-center"
                        style={{ background: 'var(--c-surface-2)' }}>
                        <p className="text-text-tertiary text-[10px] mb-0.5">{m.label}</p>
                        <p className={`font-bold text-sm ${m.green ? 'text-success' : 'text-text-primary'}`}>{m.value}</p>
                      </div>
                    ))}
                  </div>

                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {s.niches?.slice(0, 4).map(p => (
                      <span key={p} className="text-[11px] px-2 py-0.5 rounded-full font-medium"
                        style={{ background: 'var(--c-surface-2)', border: '1px solid var(--c-border)', color: 'var(--c-text-secondary)' }}>
                        {PLATFORM_ICONS[p] ?? '📌'} {p}
                      </span>
                    ))}
                  </div>

                  <div className="flex items-center justify-between pt-3"
                    style={{ borderTop: '1px solid var(--c-border)' }}>
                    <span className="text-text-tertiary text-xs">
                      {s.monthlyRate ? `$${s.monthlyRate.toLocaleString()}/oy` : 'Narx kelishiladi'}
                    </span>
                    <Link href={`/marketplace/${s.slug}`}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium transition-opacity hover:opacity-80"
                      style={{ background: 'var(--c-text-primary)', color: 'var(--c-surface)' }}>
                      Profil →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Table View */}
          {!loading && !error && viewMode === 'table' && (
            <div className="rounded-xl overflow-hidden"
              style={{ border: '1px solid var(--c-border)' }}>
              <table className="w-full text-sm">
                <thead style={{ background: 'var(--c-surface-2)' }}>
                  <tr>
                    {['Specialist', 'Rating', 'ROAS', 'Success', 'Reviews', 'Price'].map(h => (
                      <th key={h} className="py-2.5 px-4 text-text-tertiary font-medium text-xs text-left last:text-center">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {specialists.map((s, i) => (
                    <tr key={s.id} style={{ borderTop: i > 0 ? '1px solid var(--c-border)' : 'none' }}
                      className="hover:opacity-80 transition-opacity">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{s.avatar || '👤'}</span>
                          <div>
                            <p className="text-text-primary font-medium text-sm">{s.displayName}</p>
                            <p className="text-text-tertiary text-xs">{s.title}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-text-primary font-medium">⭐ {s.rating?.toFixed(1) ?? '—'}</td>
                      <td className="py-3 px-4 text-success font-bold">{s.stats?.avgROAS ? `${s.stats.avgROAS.toFixed(1)}x` : '—'}</td>
                      <td className="py-3 px-4 text-text-primary">{s.stats?.successRate ? `${s.stats.successRate}%` : '—'}</td>
                      <td className="py-3 px-4 text-text-secondary">{s.reviewCount ?? 0}</td>
                      <td className="py-3 px-4 text-text-secondary">{s.monthlyRate ? `$${s.monthlyRate.toLocaleString()}` : '—'}</td>
                      <td className="py-3 px-4 text-center">
                        <Link href={`/marketplace/${s.slug}`}
                          className="px-3 py-1 rounded-lg text-xs font-medium transition-opacity hover:opacity-80"
                          style={{ background: 'var(--c-text-primary)', color: 'var(--c-surface)' }}>
                          Profil
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
