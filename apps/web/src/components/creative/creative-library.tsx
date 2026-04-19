'use client'

import { useState } from 'react'
import { Download, Trash2, Edit2, BarChart3, Share2, Search, SlidersHorizontal, SlidersHorizontal as Tune } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Select'
import { Input } from '@/components/ui/Input'
import { Dialog } from '@/components/ui/Dialog'

interface Creative {
  id: number
  createdAt: Date
  type: string
  [key: string]: any
}

interface CreativeLibraryProps {
  creatives: Creative[]
}

export function CreativeLibrary({ creatives }: CreativeLibraryProps) {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [quickFilter, setQuickFilter] = useState<'all' | 'image' | 'video' | 'text-to-image'>('all')
  const [filterOpen, setFilterOpen] = useState(false)
  const [searchSourceOpen, setSearchSourceOpen] = useState(false)
  const [addFromLibraryOpen, setAddFromLibraryOpen] = useState(false)
  const [libraryTab, setLibraryTab] = useState<'ads' | 'brands'>('ads')
  const [adLibraryUrl, setAdLibraryUrl] = useState('')
  const [brandLibraryUrl, setBrandLibraryUrl] = useState('')
  const [saveBoard, setSaveBoard] = useState('my-favorite-ads')
  const [searchQuery, setSearchQuery] = useState('')
  const [languageSearch, setLanguageSearch] = useState('')
  const [filters, setFilters] = useState({
    industry: [] as string[],
    format: [] as string[],
    platform: [] as string[],
    language: [] as string[],
    aspectRatio: [] as string[],
    relevance: 'most-relevant',
  })
  const [industrySearch, setIndustrySearch] = useState('')
  const [searchSources, setSearchSources] = useState({
    aiSearch: true,
    adCopy: false,
    brandName: false,
    creativeTags: false,
  })

  const INDUSTRY_OPTIONS = [
    'Accessories',
    'Automotive',
    'Beauty',
    'Jewelry',
    'Shoes',
    'Clothing',
    'Electronics',
    'Sport',
  ]

  const FORMAT_OPTIONS = ['Video', 'Long Video', 'Medium Video', 'Short Video', 'Images', 'Carousel']
  const PLATFORM_OPTIONS = ['Facebook', 'Instagram']
  const LANGUAGE_OPTIONS = [
    'English', 'Russian', 'Uzbek', 'Arabic', 'Armenian', 'Azerbaijani', 'French', 'German', 'Turkish',
  ]
  const ASPECT_OPTIONS = ['Square', 'Vertical', 'Vertical (Full Portrait)', 'Landscape', 'Unknown']

  const filteredIndustryOptions = INDUSTRY_OPTIONS.filter((item) =>
    item.toLowerCase().includes(industrySearch.toLowerCase()),
  )

  const activeFilterCount =
    filters.industry.length +
    filters.format.length +
    filters.platform.length +
    filters.language.length +
    filters.aspectRatio.length

  const filteredLanguageOptions = LANGUAGE_OPTIONS.filter((item) =>
    item.toLowerCase().includes(languageSearch.toLowerCase()),
  )

  const filtered = creatives
    .filter((c) => quickFilter === 'all' || c.type === quickFilter)
    .filter((c) => {
      if (!searchQuery.trim()) return true
      const q = searchQuery.toLowerCase()
      const headline = String(c.headline ?? '').toLowerCase()
      const type = String(c.type ?? '').toLowerCase()
      return headline.includes(q) || type.includes(q)
    })
    .filter((c) => {
      if (filters.format.length === 0) return true
      const hasVideoFormat = filters.format.some((x) => x.toLowerCase().includes('video'))
      const hasImageFormat = filters.format.some((x) => x.toLowerCase().includes('image') || x === 'Carousel')
      if (hasVideoFormat && c.type === 'video') return true
      if (hasImageFormat && (c.type === 'image' || c.type === 'text-to-image')) return true
      return true
    })

  if (filtered.length === 0) {
    return (
      <div className="rounded-2xl border border-border/70 bg-white/85 p-12 text-center shadow-sm backdrop-blur-sm dark:bg-slate-900/70">
        <p className="text-body text-text-secondary">
          No creatives yet. Generate some from the tabs above!
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="rounded-2xl border border-border/70 bg-white/85 p-3 shadow-sm backdrop-blur-sm dark:bg-slate-900/70">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-tertiary" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search creatives..."
                className="w-56 pl-9"
              />
            </div>
            <div className="relative">
              <Button type="button" variant="secondary" onClick={() => setSearchSourceOpen((prev) => !prev)}>
                <Tune className="mr-2 h-4 w-4" />
                Search scope
              </Button>
              {searchSourceOpen && (
                <div className="absolute left-0 top-12 z-20 w-56 rounded-xl border border-border bg-white/95 p-2 shadow-xl backdrop-blur-sm dark:bg-slate-900/95">
                  <ScopeToggle
                    label="AI Search"
                    checked={searchSources.aiSearch}
                    onToggle={() => setSearchSources((prev) => ({ ...prev, aiSearch: !prev.aiSearch }))}
                  />
                  <ScopeToggle
                    label="Ad Copy"
                    checked={searchSources.adCopy}
                    onToggle={() => setSearchSources((prev) => ({ ...prev, adCopy: !prev.adCopy }))}
                  />
                  <ScopeToggle
                    label="Brand Name"
                    checked={searchSources.brandName}
                    onToggle={() => setSearchSources((prev) => ({ ...prev, brandName: !prev.brandName }))}
                  />
                  <ScopeToggle
                    label="Creative Tags"
                    checked={searchSources.creativeTags}
                    onToggle={() => setSearchSources((prev) => ({ ...prev, creativeTags: !prev.creativeTags }))}
                  />
                </div>
              )}
            </div>
            <Button type="button" variant="secondary" onClick={() => setFilterOpen(true)}>
              <SlidersHorizontal className="mr-2 h-4 w-4" />
              Filters
              {activeFilterCount > 0 && (
                <span className="ml-2 rounded-full bg-primary/10 px-2 py-0.5 text-label text-primary">{activeFilterCount}</span>
              )}
            </Button>
            <Select
              value={filters.relevance}
              onChange={(e) => setFilters((prev) => ({ ...prev, relevance: e.target.value }))}
              options={[
                { value: 'most-relevant', label: 'Most relevant' },
                { value: 'newest', label: 'Newest first' },
                { value: 'oldest', label: 'Oldest first' },
              ]}
              className="w-40"
            />
            <Button type="button" variant="secondary" onClick={() => setAddFromLibraryOpen(true)}>
              +
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode('grid')}
              className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                viewMode === 'grid'
                  ? 'bg-gradient-to-r from-blue-500 to-violet-500 text-white'
                  : 'bg-surface-2 text-text-secondary hover:text-text-primary'
              }`}
            >
              Grid
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                viewMode === 'list'
                  ? 'bg-gradient-to-r from-blue-500 to-violet-500 text-white'
                  : 'bg-surface-2 text-text-secondary hover:text-text-primary'
              }`}
            >
              List
            </button>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {(['all', 'image', 'video', 'text-to-image'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setQuickFilter(f)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                quickFilter === f
                  ? 'bg-gradient-to-r from-blue-500 to-violet-500 text-white'
                  : 'bg-surface-2 text-text-secondary hover:text-text-primary'
              }`}
            >
              {f === 'text-to-image' ? 'Text-to-Image' : f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Grid View */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {filtered.map((creative) => (
            <CreativeCard key={creative.id} creative={creative} />
          ))}
        </div>
      )}

      {/* List View */}
      {viewMode === 'list' && (
        <div className="overflow-hidden rounded-2xl border border-border/70 bg-white/85 shadow-sm backdrop-blur-sm dark:bg-slate-900/70">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-surface-2/70">
                <th className="px-6 py-4 text-left text-heading-sm text-text-primary">Type</th>
                <th className="px-6 py-4 text-left text-heading-sm text-text-primary">Created</th>
                <th className="px-6 py-4 text-left text-heading-sm text-text-primary">Info</th>
                <th className="px-6 py-4 text-right text-heading-sm text-text-primary">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((creative) => (
                <tr key={creative.id} className="border-b border-border/70 hover:bg-surface-2/50 transition-colors">
                  <td className="px-6 py-4">
                    <span className="rounded-full bg-violet-500/10 px-3 py-1 text-body-sm font-medium capitalize text-violet-500">
                      {creative.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-body-sm text-text-secondary">
                    {new Date(creative.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-body-sm text-text-primary">
                    {creative.headline && <span>{creative.headline}</span>}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button className="p-2 hover:bg-surface-2 rounded-lg transition-colors text-text-secondary hover:text-text-primary">
                        <Edit2 size={16} />
                      </button>
                      <button className="p-2 hover:bg-surface-2 rounded-lg transition-colors text-text-secondary hover:text-text-primary">
                        <Download size={16} />
                      </button>
                      <button className="p-2 hover:bg-surface-2 rounded-lg transition-colors text-text-secondary hover:text-text-primary">
                        <Share2 size={16} />
                      </button>
                      <button className="p-2 hover:bg-red-500/10 rounded-lg transition-colors text-text-secondary hover:text-red-500">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={filterOpen} onClose={() => setFilterOpen(false)} title="Filter" className="max-w-xl">
        <div className="space-y-4">
          <div className="rounded-xl border border-border bg-surface-2/20 p-3">
            <label className="mb-2 block text-label text-text-tertiary">Industry</label>
            <Input
              value={industrySearch}
              onChange={(e) => setIndustrySearch(e.target.value)}
              placeholder="Search"
            />
            <div className="mt-3 max-h-40 space-y-1 overflow-y-auto pr-1">
              {filteredIndustryOptions.map((item) => {
                const checked = filters.industry.includes(item)
                return (
                  <label key={item} className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-body-sm text-text-secondary hover:bg-surface-2">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() =>
                        setFilters((prev) => ({
                          ...prev,
                          industry: checked
                            ? prev.industry.filter((i) => i !== item)
                            : [...prev.industry, item],
                        }))
                      }
                    />
                    {item}
                  </label>
                )
              })}
            </div>
          </div>
          <MultiSelectPanel
            title="Format"
            items={FORMAT_OPTIONS}
            selected={filters.format}
            onToggle={(item) =>
              setFilters((prev) => ({
                ...prev,
                format: prev.format.includes(item)
                  ? prev.format.filter((x) => x !== item)
                  : [...prev.format, item],
              }))
            }
          />
          <MultiSelectPanel
            title="Platform"
            items={PLATFORM_OPTIONS}
            selected={filters.platform}
            onToggle={(item) =>
              setFilters((prev) => ({
                ...prev,
                platform: prev.platform.includes(item)
                  ? prev.platform.filter((x) => x !== item)
                  : [...prev.platform, item],
              }))
            }
          />
          <div className="rounded-xl border border-border bg-surface-2/20 p-3">
            <p className="text-label text-text-tertiary">Language</p>
            <Input
              className="mt-2"
              value={languageSearch}
              onChange={(e) => setLanguageSearch(e.target.value)}
              placeholder="Search language"
            />
            <div className="mt-2 max-h-32 space-y-1 overflow-y-auto pr-1">
              {filteredLanguageOptions.map((item) => {
                const checked = filters.language.includes(item)
                return (
                  <label key={item} className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-body-sm text-text-secondary hover:bg-surface-2">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() =>
                        setFilters((prev) => ({
                          ...prev,
                          language: checked
                            ? prev.language.filter((x) => x !== item)
                            : [...prev.language, item],
                        }))
                      }
                    />
                    {item}
                  </label>
                )
              })}
            </div>
            <p className="mt-2 text-label text-text-tertiary">
              {filters.language.length > 0 ? filters.language.join(', ') : 'Select language'}
            </p>
          </div>
          <MultiSelectPanel
            title="Aspect ratio"
            items={ASPECT_OPTIONS}
            selected={filters.aspectRatio}
            onToggle={(item) =>
              setFilters((prev) => ({
                ...prev,
                aspectRatio: prev.aspectRatio.includes(item)
                  ? prev.aspectRatio.filter((x) => x !== item)
                  : [...prev.aspectRatio, item],
              }))
            }
          />
          <div className="flex items-center justify-end gap-2 border-t border-border pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setFilters({
                  industry: [],
                  format: [],
                  platform: [],
                  language: [],
                  aspectRatio: [],
                  relevance: 'most-relevant',
                })
                setIndustrySearch('')
                setLanguageSearch('')
                setFilterOpen(false)
              }}
            >
              Cancel
            </Button>
            <Button type="button" onClick={() => setFilterOpen(false)}>
              Apply
            </Button>
          </div>
        </div>
      </Dialog>

      <Dialog
        open={addFromLibraryOpen}
        onClose={() => setAddFromLibraryOpen(false)}
        title="Add from Meta Ad Library"
        className="max-w-2xl"
      >
        <div className="space-y-4">
          <div className="flex items-center gap-2 border-b border-border pb-2">
            <button
              type="button"
              onClick={() => setLibraryTab('ads')}
              className={`px-3 py-1.5 text-sm font-medium ${
                libraryTab === 'ads' ? 'border-b-2 border-primary text-text-primary' : 'text-text-tertiary'
              }`}
            >
              Ads
            </button>
            <button
              type="button"
              onClick={() => setLibraryTab('brands')}
              className={`px-3 py-1.5 text-sm font-medium ${
                libraryTab === 'brands' ? 'border-b-2 border-primary text-text-primary' : 'text-text-tertiary'
              }`}
            >
              Brands
            </button>
          </div>
          {libraryTab === 'ads' ? (
            <div className="space-y-3">
              <p className="text-body-sm text-text-tertiary">Missing some ads? Upload and save them to a collection.</p>
              <Select
                label="Save to"
                value={saveBoard}
                options={[
                  { value: 'my-favorite-ads', label: 'My favorite ads' },
                  { value: 'fashion-board', label: 'Fashion board' },
                  { value: 'performance-board', label: 'Performance board' },
                ]}
                onChange={(e) => setSaveBoard(e.target.value)}
              />
              <Input
                label="Ad URLs (from Meta Ads library)"
                value={adLibraryUrl}
                onChange={(e) => setAdLibraryUrl(e.target.value)}
                placeholder="https://facebook.com/ads/library?id=123456"
              />
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-body-sm text-text-tertiary">Missing specific brands? Add them to your watchlist.</p>
              <Input
                label="Facebook page URLs"
                value={brandLibraryUrl}
                onChange={(e) => setBrandLibraryUrl(e.target.value)}
                placeholder="https://www.facebook.com/ads/library/view_all_page_id=123456"
              />
            </div>
          )}
          <div className="flex justify-end gap-2 border-t border-border pt-3">
            <Button type="button" variant="secondary" onClick={() => setAddFromLibraryOpen(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              disabled={libraryTab === 'ads' ? !adLibraryUrl.trim() : !brandLibraryUrl.trim()}
              onClick={() => {
                setAddFromLibraryOpen(false)
                setAdLibraryUrl('')
                setBrandLibraryUrl('')
              }}
            >
              Add
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  )
}

function ScopeToggle({
  label,
  checked,
  onToggle,
}: {
  label: string
  checked: boolean
  onToggle: () => void
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-body-sm text-text-secondary hover:bg-surface-2"
    >
      <span>{label}</span>
      <span className={`h-5 w-9 rounded-full p-0.5 transition-colors ${checked ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700'}`}>
        <span className={`block h-4 w-4 rounded-full bg-white transition-transform ${checked ? 'translate-x-4' : ''}`} />
      </span>
    </button>
  )
}

function MultiSelectPanel({
  title,
  items,
  selected,
  onToggle,
}: {
  title: string
  items: string[]
  selected: string[]
  onToggle: (item: string) => void
}) {
  return (
    <div className="rounded-xl border border-border bg-surface-2/20 p-3">
      <p className="text-label text-text-tertiary">{title}</p>
      <div className="mt-2 space-y-1">
        {items.map((item) => (
          <label key={item} className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-body-sm text-text-secondary hover:bg-surface-2">
            <input
              type="checkbox"
              checked={selected.includes(item)}
              onChange={() => onToggle(item)}
            />
            {item}
          </label>
        ))}
      </div>
      <p className="mt-2 text-label text-text-tertiary">
        {selected.length > 0 ? selected.join(', ') : `Select ${title.toLowerCase()}`}
      </p>
    </div>
  )
}

function CreativeCard({ creative }: { creative: Creative }) {
  return (
    <div className="group overflow-hidden rounded-2xl border border-border/70 bg-white/85 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lg dark:bg-slate-900/70">
      {/* Thumbnail */}
      <div className="relative aspect-square flex items-center justify-center overflow-hidden bg-gradient-to-br from-blue-500/10 to-violet-500/10">
        {creative.images?.[0] || creative.imageUrl ? (
          <img
            src={creative.images?.[0] || creative.imageUrl}
            alt="Creative"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="text-center">
            <span className="text-3xl">
              {creative.type === 'video' ? '🎬' : '🖼️'}
            </span>
          </div>
        )}

        {/* Overlay */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center gap-2">
          <button className="p-2 rounded-lg bg-white/20 text-white hover:bg-white/30 transition-colors">
            <Edit2 size={18} />
          </button>
          <button className="p-2 rounded-lg bg-white/20 text-white hover:bg-white/30 transition-colors">
            <Download size={18} />
          </button>
        </div>
      </div>

      {/* Info */}
      <div className="p-4 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-label font-medium capitalize text-violet-500">{creative.type}</span>
          <span className="text-label text-text-secondary">
            {new Date(creative.createdAt).toLocaleDateString()}
          </span>
        </div>
        {creative.headline && (
          <p className="truncate text-body-sm font-medium text-text-primary">{creative.headline}</p>
        )}
        <div className="flex gap-1 pt-2">
          <button className="flex-1 rounded-lg bg-violet-500/10 py-1 text-label font-medium text-violet-500 transition-colors hover:bg-violet-500/20">
            Use
          </button>
          <button className="rounded-lg bg-surface-2 px-2 py-1 text-text-secondary transition-colors hover:text-text-primary">
            <BarChart3 size={14} />
          </button>
        </div>
      </div>
    </div>
  )
}
