'use client'

import Link from 'next/link'
import { ArrowLeft, Zap } from 'lucide-react'

const templates = Array.from({ length: 12 }, (_, i) => ({
  id: i + 1,
  title: `App Template ${i + 1}`,
  appType: ['Mobile Game', 'Productivity', 'Social', 'Utility'][i % 4],
}))

export default function AppsTemplatesPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Link href="/creative-hub" className="flex items-center gap-2 text-info hover:underline mb-4">
          <ArrowLeft size={18} />
          Creative Hub
        </Link>
        <h1 className="text-3xl font-bold text-text-primary mt-4">Apps</h1>
        <p className="text-text-secondary mt-2">
          Browse apps video ad templates. Click any ad to recreate it for your brand.
        </p>
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {templates.map((template) => (
          <Link
            key={template.id}
            href={`/creative-hub/templates/apps/${template.id}`}
            className="group relative aspect-square rounded-lg overflow-hidden bg-surface-2 border border-border hover:border-border-hover transition-all"
          >
            {/* Placeholder Image */}
            <div className="w-full h-full bg-gradient-to-br from-info/20 to-warning/20 flex items-center justify-center">
              <div className="text-center">
                <Zap size={32} className="text-text-tertiary mx-auto mb-2" />
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
              <p className="text-white/60 text-xs">{template.appType}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
