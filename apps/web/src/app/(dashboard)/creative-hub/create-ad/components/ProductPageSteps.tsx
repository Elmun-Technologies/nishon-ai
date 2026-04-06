'use client'

import Link from 'next/link'
import { AlertCircle, CheckCircle } from 'lucide-react'

type StepId = 'input' | 'configure' | 'preview' | 'launch'
type StepStatus = 'pending' | 'in_progress' | 'completed'

interface ProductPageInputProps {
  productUrl: string
  onProductUrlChange: (url: string) => void
  onNext: () => void
}

export function ProductPageInput({
  productUrl,
  onProductUrlChange,
  onNext,
}: ProductPageInputProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-text-primary mb-2">Share your product link</h2>
        <p className="text-text-secondary">
          Paste a product URL to analyze, or pick from your existing products.
        </p>
      </div>

      {/* Import from URL */}
      <div className="space-y-4">
        <div className="p-4 rounded-lg border border-border bg-surface-2">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-lg bg-info/10 flex items-center justify-center">
              <span className="text-info font-bold">∞</span>
            </div>
            <h3 className="font-semibold text-text-primary">Import from URL</h3>
          </div>
          <p className="text-sm text-text-secondary mb-4">
            Analyze a product URL, or pick from your existing products.
          </p>

          <input
            type="url"
            placeholder="https://yourbrand.com/product"
            value={productUrl}
            onChange={(e) => onProductUrlChange(e.target.value)}
            className="w-full px-3 py-2 border border-border rounded-lg bg-surface text-text-primary placeholder-text-tertiary focus:outline-none focus:ring-2 focus:ring-info/50 mb-3"
          />

          <button className="w-full px-4 py-2 bg-info text-surface rounded-lg font-medium hover:opacity-90 transition-opacity">
            Analyze
          </button>
        </div>
      </div>

      {/* Divider */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-border" />
        <span className="text-xs font-medium text-text-tertiary uppercase">OR</span>
        <div className="flex-1 h-px bg-border" />
      </div>

      {/* Choose Saved Product */}
      <div className="space-y-4">
        <div className="p-4 rounded-lg border border-border bg-surface-2">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-lg bg-success/10 flex items-center justify-center">
              <CheckCircle size={18} className="text-success" />
            </div>
            <h3 className="font-semibold text-text-primary">Choose a saved product</h3>
          </div>
          <p className="text-sm text-text-secondary">
            Pick a product you've already set up with images and selling points.
          </p>

          <div className="mt-4 p-4 border border-dashed border-border rounded-lg text-center">
            <p className="text-sm text-text-tertiary">
              No products yet. Import one from a URL above.
            </p>
          </div>
        </div>
      </div>

      {/* Continue Button */}
      <div className="flex gap-3 pt-4">
        <Link
          href="/creative-hub/create-ad"
          className="px-6 py-2 border border-border rounded-lg font-medium text-text-primary hover:bg-surface-2 transition-colors"
        >
          Back
        </Link>
        <button
          onClick={onNext}
          disabled={!productUrl}
          className={`px-6 py-2 rounded-lg font-medium transition-all ${
            productUrl
              ? 'bg-text-primary text-surface hover:opacity-90'
              : 'bg-surface-2 text-text-tertiary cursor-not-allowed'
          }`}
        >
          Next Step
        </button>
      </div>
    </div>
  )
}

interface ProductPageConfigureProps {
  onNext: () => void
  onBack: () => void
}

export function ProductPageConfigure({ onNext, onBack }: ProductPageConfigureProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-text-primary mb-2">Product Page</h2>
        <p className="text-text-secondary">
          Paste a product or landing page URL. We'll extract everything and create ads.
        </p>
      </div>

      {/* Instructions Form */}
      <div className="p-6 rounded-lg border border-border bg-surface-2 space-y-4">
        <h3 className="font-semibold text-text-primary">Instructions</h3>

        <div>
          <label className="block text-sm font-medium text-text-primary mb-2">Brand</label>
          <input
            type="text"
            placeholder="Performa AI"
            defaultValue="Performa AI"
            className="w-full px-3 py-2 border border-border rounded-lg bg-surface text-text-primary placeholder-text-tertiary focus:outline-none focus:ring-2 focus:ring-info/50"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-text-primary mb-2">Category</label>
          <input
            type="text"
            placeholder="Marketing Technology"
            defaultValue="Marketing Technology"
            className="w-full px-3 py-2 border border-border rounded-lg bg-surface text-text-primary placeholder-text-tertiary focus:outline-none focus:ring-2 focus:ring-info/50"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-text-primary mb-2">Description</label>
          <textarea
            placeholder="Describe what your product does..."
            rows={3}
            className="w-full px-3 py-2 border border-border rounded-lg bg-surface text-text-primary placeholder-text-tertiary focus:outline-none focus:ring-2 focus:ring-info/50 resize-none"
          />
        </div>
      </div>

      {/* Aspect Ratios */}
      <div className="p-6 rounded-lg border border-border bg-surface-2 space-y-4">
        <h3 className="font-semibold text-text-primary">Aspect Ratios</h3>
        <div className="grid grid-cols-3 gap-3">
          {[
            { ratio: '1:1', name: 'Square (Feed)', active: true },
            { ratio: '4:5', name: 'Portrait (Feed)' },
            { ratio: '9:16', name: 'Vertical (Stories/Reels)' },
          ].map((item) => (
            <button
              key={item.ratio}
              className={`p-4 rounded-lg border-2 transition-all text-center ${
                item.active
                  ? 'border-info bg-info/10'
                  : 'border-border hover:border-border-hover'
              }`}
            >
              <div className="font-semibold text-text-primary text-sm">{item.ratio}</div>
              <div className="text-xs text-text-secondary mt-1">{item.name}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Variations */}
      <div className="p-6 rounded-lg border border-border bg-surface-2 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-text-primary">Variations</h3>
          <span className="text-lg font-bold text-info">3</span>
        </div>
        <input
          type="range"
          min="1"
          max="10"
          defaultValue="3"
          className="w-full h-2 bg-surface rounded-lg accent-info"
        />
      </div>

      {/* Brand Kit */}
      <div className="p-6 rounded-lg border border-border bg-surface-2 space-y-4">
        <h3 className="font-semibold text-text-primary">Brand Kit</h3>
        <div className="p-4 border border-dashed border-border rounded-lg">
          <p className="text-sm text-text-tertiary">
            No brand kits found. <button className="text-info hover:underline">Create a new brand kit →</button>
          </p>
        </div>
      </div>

      {/* Continue Button */}
      <div className="flex gap-3 pt-4">
        <button
          onClick={onBack}
          className="px-6 py-2 border border-border rounded-lg font-medium text-text-primary hover:bg-surface-2 transition-colors"
        >
          Back
        </button>
        <button
          onClick={onNext}
          className="px-6 py-2 bg-text-primary text-surface rounded-lg font-medium hover:opacity-90 transition-all"
        >
          Next Step
        </button>
      </div>
    </div>
  )
}
