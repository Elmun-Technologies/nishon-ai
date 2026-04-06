'use client'

import Link from 'next/link'
import { ArrowLeft, Play } from 'lucide-react'

const templates = [
  { id: 1, title: 'Product Review', category: 'Social' },
  { id: 2, title: 'Unboxing', category: 'UGC' },
  { id: 3, title: 'Before & After', category: 'UGC' },
  { id: 4, title: 'Product Demo', category: 'Social' },
  { id: 5, title: 'Testimonial', category: 'UGC' },
  { id: 6, title: 'Lifestyle Shot', category: 'Social' },
  { id: 7, title: 'Quick Tip', category: 'UGC' },
  { id: 8, title: 'Problem & Solution', category: 'Social' },
]

export default function SocialUGCTemplatesPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Link href="/creative-hub" className="flex items-center gap-2 text-info hover:underline mb-4">
          <ArrowLeft size={18} />
          Creative Hub
        </Link>
        <h1 className="text-3xl font-bold text-text-primary mt-4">Social & UGC Ads</h1>
        <p className="text-text-secondary mt-2">
          Discover social-first and UGC-style ads made to feel native and authentic.
        </p>
      </div>

      {/* Category Filter */}
      <div className="flex gap-2 flex-wrap">
        {['All', 'Social', 'UGC'].map((cat) => (
          <button
            key={cat}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              cat === 'All'
                ? 'bg-text-primary text-surface'
                : 'bg-surface-2 text-text-secondary hover:text-text-primary'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {templates.map((template) => (
          <Link
            key={template.id}
            href={`/creative-hub/templates/social-ugc/${template.id}`}
            className="group relative aspect-square rounded-lg overflow-hidden bg-surface-2 border border-border hover:border-border-hover transition-all"
          >
            {/* Placeholder Image */}
            <div className="w-full h-full bg-gradient-to-br from-surface-2 to-surface-3 flex items-center justify-center">
              <div className="text-center">
                <Play size={32} className="text-text-tertiary mx-auto mb-2" />
                <p className="text-xs text-text-tertiary">{template.title}</p>
              </div>
            </div>

            {/* Overlay */}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
              <button className="opacity-0 group-hover:opacity-100 transition-opacity px-4 py-2 bg-text-primary text-surface rounded-lg font-medium text-sm">
                Recreate
              </button>
            </div>

            {/* Info */}
            <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/60 to-transparent">
              <p className="text-white text-sm font-medium">{template.title}</p>
              <p className="text-white/60 text-xs">{template.category}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
