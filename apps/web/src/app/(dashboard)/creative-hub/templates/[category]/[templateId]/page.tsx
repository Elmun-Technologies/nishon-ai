'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Copy, Download, Share2 } from 'lucide-react'

interface TemplateEditorPageProps {
  params: { category: string; templateId: string }
}

export default function TemplateEditorPage({ params }: TemplateEditorPageProps) {
  const [customizations, setCustomizations] = useState({
    headline: 'Your Headline Here',
    description: 'Your product description',
    cta: 'Learn More',
    color: '#6366F1',
  })

  const getCategoryName = (cat: string) => {
    const names: Record<string, string> = {
      'social-ugc': 'Social & UGC',
      'image-ads': 'Image Ads',
      'tech-electronics': 'Tech & Electronics',
      'health': 'Health',
      'apps': 'Apps',
      'fashion-beauty': 'Fashion & Beauty',
      'ecommerce': 'E-Commerce',
      'finance': 'Finance & Crypto',
    }
    return names[cat] || cat
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Link
          href={`/creative-hub/templates/${params.category}`}
          className="flex items-center gap-2 text-info hover:underline mb-4"
        >
          <ArrowLeft size={18} />
          Back to {getCategoryName(params.category)}
        </Link>
        <h1 className="text-3xl font-bold text-text-primary mt-4">
          Edit Template #{params.templateId}
        </h1>
        <p className="text-text-secondary mt-2">
          Customize this template with your brand information
        </p>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Preview Section */}
        <div className="col-span-2">
          <div className="p-6 rounded-lg border border-border bg-surface-2">
            <h3 className="font-semibold text-text-primary mb-4">Preview</h3>

            {/* Template Preview */}
            <div
              className="w-full aspect-square rounded-lg flex items-center justify-center text-white font-semibold text-center p-8"
              style={{
                background: `linear-gradient(135deg, ${customizations.color} 0%, ${customizations.color}cc 100%)`,
              }}
            >
              <div className="space-y-4">
                <h2 className="text-4xl font-bold">{customizations.headline}</h2>
                <p className="text-lg opacity-90">{customizations.description}</p>
                <button className="mt-4 px-6 py-2 bg-white text-black rounded-lg font-semibold hover:opacity-90">
                  {customizations.cta}
                </button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-3 gap-3 mt-6">
              <button className="flex items-center justify-center gap-2 px-4 py-2 border border-border rounded-lg hover:bg-surface-3 transition-colors text-text-primary font-medium">
                <Copy size={18} />
                Duplicate
              </button>
              <button className="flex items-center justify-center gap-2 px-4 py-2 border border-border rounded-lg hover:bg-surface-3 transition-colors text-text-primary font-medium">
                <Download size={18} />
                Download
              </button>
              <button className="flex items-center justify-center gap-2 px-4 py-2 border border-border rounded-lg hover:bg-surface-3 transition-colors text-text-primary font-medium">
                <Share2 size={18} />
                Share
              </button>
            </div>
          </div>
        </div>

        {/* Customization Panel */}
        <div className="space-y-4">
          <div className="p-6 rounded-lg border border-border bg-surface-2 space-y-4">
            <h3 className="font-semibold text-text-primary">Customize</h3>

            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                Headline
              </label>
              <input
                type="text"
                value={customizations.headline}
                onChange={(e) => setCustomizations({ ...customizations, headline: e.target.value })}
                className="w-full px-3 py-2 border border-border rounded-lg bg-surface text-text-primary focus:outline-none focus:ring-2 focus:ring-info/50"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                Description
              </label>
              <textarea
                value={customizations.description}
                onChange={(e) => setCustomizations({ ...customizations, description: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-border rounded-lg bg-surface text-text-primary focus:outline-none focus:ring-2 focus:ring-info/50 resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                CTA Button Text
              </label>
              <input
                type="text"
                value={customizations.cta}
                onChange={(e) => setCustomizations({ ...customizations, cta: e.target.value })}
                className="w-full px-3 py-2 border border-border rounded-lg bg-surface text-text-primary focus:outline-none focus:ring-2 focus:ring-info/50"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                Primary Color
              </label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={customizations.color}
                  onChange={(e) => setCustomizations({ ...customizations, color: e.target.value })}
                  className="w-12 h-10 rounded-lg cursor-pointer border border-border"
                />
                <input
                  type="text"
                  value={customizations.color}
                  onChange={(e) => setCustomizations({ ...customizations, color: e.target.value })}
                  className="flex-1 px-3 py-2 border border-border rounded-lg bg-surface text-text-primary focus:outline-none focus:ring-2 focus:ring-info/50 text-sm"
                  placeholder="#6366F1"
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2">
            <button className="w-full px-4 py-2 bg-text-primary text-surface rounded-lg font-medium hover:opacity-90 transition-all">
              Use This Template
            </button>
            <Link
              href="/creative-hub/create-ad/product-page"
              className="block text-center px-4 py-2 border border-border rounded-lg text-text-primary font-medium hover:bg-surface-2 transition-colors"
            >
              Continue with Wizard
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
