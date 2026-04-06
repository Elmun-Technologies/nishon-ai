'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowRight, Globe, Upload, Eye } from 'lucide-react'

type CreationMethod = 'product-page' | 'upload-clone' | 'competitor' | null

const methods = [
  {
    id: 'product-page',
    title: 'Product Page',
    description: 'Paste a product or landing page URL. We\'ll extract everything and create ads.',
    icon: Globe,
  },
  {
    id: 'upload-clone',
    title: 'Upload & Clone',
    description: 'Upload a reference image and we\'ll recreate the style for your brand.',
    icon: Upload,
  },
  {
    id: 'competitor',
    title: 'Competitor Clone',
    description: 'Clone competitor ads that are working and make them yours.',
    icon: Eye,
  },
]

export default function CreateAdWizardPage() {
  const [selected, setSelected] = useState<CreationMethod>(null)

  const handleMethodSelect = (method: CreationMethod) => {
    setSelected(method)
  }

  const handleContinue = () => {
    if (!selected) return

    const methodPaths: Record<string, string> = {
      'product-page': '/creative-hub/create-ad/product-page',
      'upload-clone': '/creative-hub/create-ad/upload-clone',
      'competitor': '/creative-hub/create-ad/competitor',
    }

    // In a real app, we'd use router.push here
    window.location.href = methodPaths[selected]
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <Link href="/creative-hub" className="text-info font-medium hover:underline mb-4 inline-flex items-center gap-1">
          ← Creative Hub
        </Link>
        <h1 className="text-3xl font-bold text-text-primary mt-4">Create & Launch Ads</h1>
        <p className="text-text-secondary mt-2">
          Pick a style, generate creatives with AI, and launch them as ads to find your next winner.
        </p>
      </div>

      {/* Method Selection */}
      <div className="space-y-4 mb-8">
        <h2 className="font-semibold text-text-primary">Choose a creation method to get started.</h2>
        <p className="text-text-secondary text-sm">
          Each method guides you through generating the perfect ad creative.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {methods.map((method) => {
            const Icon = method.icon
            const isSelected = selected === method.id

            return (
              <button
                key={method.id}
                onClick={() => handleMethodSelect(method.id as CreationMethod)}
                className={`p-6 rounded-lg border-2 transition-all text-left ${
                  isSelected
                    ? 'border-info bg-surface-2'
                    : 'border-border bg-surface hover:border-border-hover'
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-lg ${isSelected ? 'bg-info/10' : 'bg-surface-2'}`}>
                    <Icon size={24} className={isSelected ? 'text-info' : 'text-text-secondary'} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-text-primary">{method.title}</h3>
                    <p className="text-sm text-text-secondary mt-1">{method.description}</p>
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <Link
          href="/creative-hub"
          className="px-6 py-2 border border-border rounded-lg font-medium text-text-primary hover:bg-surface-2 transition-colors"
        >
          Cancel
        </Link>
        <button
          onClick={handleContinue}
          disabled={!selected}
          className={`px-6 py-2 rounded-lg font-medium flex items-center gap-2 transition-all ${
            selected
              ? 'bg-text-primary text-surface hover:opacity-90 cursor-pointer'
              : 'bg-surface-2 text-text-tertiary cursor-not-allowed'
          }`}
        >
          Continue
          <ArrowRight size={18} />
        </button>
      </div>
    </div>
  )
}
