'use client'

import { Sparkles, ArrowRight } from 'lucide-react'
import Link from 'next/link'

const categories = [
  {
    id: 'social-ugc',
    title: 'Social & UGC Ads',
    description: 'Discover social-first and UGC-style ads made to feel native and authentic.',
    icon: '✨',
  },
  {
    id: 'image-ads',
    title: 'Image Ads',
    description: 'Browse high-impact image ad templates and recreate them for your brand in seconds.',
    icon: '🖼️',
  },
  {
    id: 'tech-electronics',
    title: 'Tech & Electronics',
    description: 'Browse tech & electronics video ad templates. Click any ad to recreate it for your brand.',
    icon: '⚙️',
  },
  {
    id: 'health',
    title: 'Health',
    description: 'Browse health video ad templates. Click any ad to recreate it for your brand.',
    icon: '💪',
  },
  {
    id: 'apps',
    title: 'Apps',
    description: 'Browse apps video ad templates. Click any ad to recreate it for your brand.',
    icon: '📱',
  },
  {
    id: 'fashion',
    title: 'Fashion & Beauty',
    description: 'Explore fashion and beauty ad templates designed for maximum engagement.',
    icon: '👗',
  },
  {
    id: 'ecommerce',
    title: 'E-Commerce',
    description: 'Shop-ready ad templates to boost your product sales.',
    icon: '🛍️',
  },
  {
    id: 'finance',
    title: 'Finance & Crypto',
    description: 'Professional financial service ad templates.',
    icon: '💰',
  },
]

export default function CreativeHubPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-text-primary">Creative Hub</h1>
        <p className="text-text-secondary mt-2">
          Yaratuvchi kontentlar va medianing boshqarilishi
        </p>
      </div>

      {/* Create & Launch Ads Section */}
      <Link href="/creative-hub/create-ad" className="block rounded-lg border border-border bg-surface-2 p-8 hover:bg-surface-3 transition-colors group">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <Sparkles size={24} className="text-text-primary" />
              <h2 className="text-2xl font-bold text-text-primary">Create & Launch Ads</h2>
            </div>
            <p className="text-text-secondary">
              Pick a style, generate creatives with AI, and launch them as ads to find your next winner.
            </p>
            <div className="mt-4 inline-flex px-6 py-2 bg-text-primary text-surface rounded-lg font-medium group-hover:opacity-90 transition-opacity items-center gap-2">
              Boshlash
              <ArrowRight size={18} />
            </div>
          </div>
        </div>
      </Link>

      {/* Categories Grid */}
      <div className="space-y-6">
        {categories.map((category) => {
          const categoryPaths: Record<string, string> = {
            'social-ugc': '/creative-hub/templates/social-ugc',
            'image-ads': '/creative-hub/templates/image-ads',
            'tech-electronics': '/creative-hub/templates/tech-electronics',
            'health': '/creative-hub/templates/health',
            'apps': '/creative-hub/templates/apps',
            'fashion': '/creative-hub/templates/fashion-beauty',
            'ecommerce': '/creative-hub/templates/ecommerce',
            'finance': '/creative-hub/templates/finance',
          }

          return (
            <div key={category.id} className="space-y-3">
              {/* Section Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{category.icon}</span>
                  <div>
                    <h3 className="font-semibold text-text-primary">{category.title}</h3>
                    <p className="text-sm text-text-secondary">{category.description}</p>
                  </div>
                </div>
                <Link
                  href={categoryPaths[category.id] || '#'}
                  className="text-info font-medium hover:underline flex items-center gap-1 whitespace-nowrap"
                >
                  See all <ArrowRight size={16} />
                </Link>
              </div>

              {/* Placeholder Cards Grid */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                {[...Array(6)].map((_, i) => (
                  <Link
                    key={i}
                    href={`${categoryPaths[category.id] || '#'}/${i + 1}`}
                    className="aspect-video rounded-lg bg-surface-2 border border-border hover:border-border-hover transition-colors cursor-pointer group"
                  >
                    <div className="w-full h-full flex items-center justify-center group-hover:bg-surface-3 transition-colors rounded-lg">
                      <span className="text-text-tertiary text-sm">Template {i + 1}</span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
