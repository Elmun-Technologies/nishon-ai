'use client'

import { useState } from 'react'
import { Download, Trash2, Edit2, BarChart3, Share2 } from 'lucide-react'

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
  const [filter, setFilter] = useState<'all' | 'image' | 'video' | 'text-to-image'>('all')

  const filtered = creatives.filter((c) => filter === 'all' || c.type === filter)

  if (filtered.length === 0) {
    return (
      <div className="rounded-xl border border-white/10 bg-surface-2 p-12 text-center">
        <p className="text-text-secondary">
          No creatives yet. Generate some from the tabs above!
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          {(['all', 'image', 'video', 'text-to-image'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === f
                  ? 'bg-purple-500 text-white'
                  : 'bg-surface-3 text-text-secondary hover:text-white'
              }`}
            >
              {f === 'text-to-image' ? 'Text-to-Image' : f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setViewMode('grid')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              viewMode === 'grid'
                ? 'bg-purple-500 text-white'
                : 'bg-surface-3 text-text-secondary hover:text-white'
            }`}
          >
            Grid
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              viewMode === 'list'
                ? 'bg-purple-500 text-white'
                : 'bg-surface-3 text-text-secondary hover:text-white'
            }`}
          >
            List
          </button>
        </div>
      </div>

      {/* Grid View */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-4 gap-6">
          {filtered.map((creative) => (
            <CreativeCard key={creative.id} creative={creative} />
          ))}
        </div>
      )}

      {/* List View */}
      {viewMode === 'list' && (
        <div className="rounded-xl border border-white/10 bg-surface-2 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10 bg-surface-3">
                <th className="px-6 py-4 text-left font-semibold text-white">Type</th>
                <th className="px-6 py-4 text-left font-semibold text-white">Created</th>
                <th className="px-6 py-4 text-left font-semibold text-white">Info</th>
                <th className="px-6 py-4 text-right font-semibold text-white">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((creative) => (
                <tr key={creative.id} className="border-b border-white/10 hover:bg-surface-3/50 transition-colors">
                  <td className="px-6 py-4">
                    <span className="px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 text-sm font-medium capitalize">
                      {creative.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-text-secondary">
                    {new Date(creative.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-white">
                    {creative.headline && <span>{creative.headline}</span>}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button className="p-2 hover:bg-surface-4 rounded-lg transition-colors text-text-secondary hover:text-white">
                        <Edit2 size={16} />
                      </button>
                      <button className="p-2 hover:bg-surface-4 rounded-lg transition-colors text-text-secondary hover:text-white">
                        <Download size={16} />
                      </button>
                      <button className="p-2 hover:bg-surface-4 rounded-lg transition-colors text-text-secondary hover:text-white">
                        <Share2 size={16} />
                      </button>
                      <button className="p-2 hover:bg-red-500/20 rounded-lg transition-colors text-text-secondary hover:text-red-400">
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
    </div>
  )
}

function CreativeCard({ creative }: { creative: Creative }) {
  return (
    <div className="rounded-xl border border-white/10 bg-surface-2 overflow-hidden hover:border-purple-500/50 transition-all group">
      {/* Thumbnail */}
      <div className="relative aspect-square bg-gradient-to-br from-purple-500/10 to-pink-500/10 flex items-center justify-center overflow-hidden">
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
          <span className="text-xs font-medium text-purple-400 capitalize">{creative.type}</span>
          <span className="text-xs text-text-secondary">
            {new Date(creative.createdAt).toLocaleDateString()}
          </span>
        </div>
        {creative.headline && (
          <p className="text-sm text-white font-medium truncate">{creative.headline}</p>
        )}
        <div className="flex gap-1 pt-2">
          <button className="flex-1 py-1 rounded-lg bg-purple-500/20 text-purple-300 text-xs font-medium hover:bg-purple-500/30 transition-colors">
            Use
          </button>
          <button className="py-1 px-2 rounded-lg bg-surface-3 text-text-secondary hover:text-white transition-colors">
            <BarChart3 size={14} />
          </button>
        </div>
      </div>
    </div>
  )
}
