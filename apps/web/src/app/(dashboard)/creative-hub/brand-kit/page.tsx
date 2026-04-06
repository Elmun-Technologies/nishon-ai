'use client'

import { useState } from 'react'
import { Palette, Plus, Users, AlertCircle } from 'lucide-react'

interface BrandProfile {
  id: string
  name: string
  created: string
}

export default function BrandKitPage() {
  const [brandInfo, setBrandInfo] = useState({
    problem: '',
    differentiation: '',
    outcome: '',
  })

  const [brandProfiles, setBrandProfiles] = useState<BrandProfile[]>([])

  const handleInputChange = (field: string, value: string) => {
    setBrandInfo((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-text-primary flex items-center gap-3 mb-2">
          <Palette size={32} />
          Brand Kit
        </h1>
        <p className="text-text-secondary">
          Brandingizni boshqarish va ranglarni belgilash
        </p>
      </div>

      {/* Main Form */}
      <div className="space-y-6">
        {/* Problem Section */}
        <div className="p-6 rounded-lg border border-border bg-surface-2">
          <label className="block text-sm font-medium text-text-primary mb-3">
            What problem does your product/service solve?
          </label>
          <textarea
            placeholder="e.g., Marketers waste ad budget because they can't see which touchpoints drive revenue..."
            value={brandInfo.problem}
            onChange={(e) => handleInputChange('problem', e.target.value)}
            rows={4}
            className="w-full px-4 py-3 border border-border rounded-lg bg-surface text-text-primary placeholder-text-tertiary focus:outline-none focus:ring-2 focus:ring-info/50 resize-none"
          />
        </div>

        {/* Differentiation Section */}
        <div className="p-6 rounded-lg border border-border bg-surface-2">
          <label className="block text-sm font-medium text-text-primary mb-3">
            What makes you different from competitors?
          </label>
          <textarea
            placeholder="e.g., AI-powered multi-touch attribution with server-side tracking and automatic data sync..."
            value={brandInfo.differentiation}
            onChange={(e) => handleInputChange('differentiation', e.target.value)}
            rows={4}
            className="w-full px-4 py-3 border border-border rounded-lg bg-surface text-text-primary placeholder-text-tertiary focus:outline-none focus:ring-2 focus:ring-info/50 resize-none"
          />
        </div>

        {/* Outcome Section */}
        <div className="p-6 rounded-lg border border-border bg-surface-2">
          <label className="block text-sm font-medium text-text-primary mb-3">
            What's the #1 result or outcome your customers get?
          </label>
          <textarea
            placeholder="e.g., Most users identify 20-40% of wasted spend in their first month..."
            value={brandInfo.outcome}
            onChange={(e) => handleInputChange('outcome', e.target.value)}
            rows={4}
            className="w-full px-4 py-3 border border-border rounded-lg bg-surface text-text-primary placeholder-text-tertiary focus:outline-none focus:ring-2 focus:ring-info/50 resize-none"
          />
        </div>

        {/* Save Button */}
        <div className="flex gap-3">
          <button className="px-6 py-2 border border-border rounded-lg text-text-primary font-medium hover:bg-surface-2 transition-colors">
            Cancel
          </button>
          <button className="px-6 py-2 bg-text-primary text-surface rounded-lg font-medium hover:opacity-90 transition-all">
            Save Brand Info
          </button>
        </div>
      </div>

      {/* Buyer Profiles Section */}
      <div className="mt-12">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Users size={24} className="text-info" />
            <h2 className="text-2xl font-bold text-text-primary">Buyer Profiles</h2>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-info text-surface rounded-lg font-medium hover:opacity-90 transition-all text-sm">
            <Plus size={18} />
            Create Profile
          </button>
        </div>

        {/* Empty State */}
        {brandProfiles.length === 0 ? (
          <div className="rounded-lg border border-border bg-surface-2 p-12 text-center">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 rounded-full bg-surface flex items-center justify-center">
                <Users size={32} className="text-text-tertiary" />
              </div>
            </div>
            <h3 className="text-text-primary font-semibold mb-2">No buyer profiles yet</h3>
            <p className="text-text-secondary text-sm max-w-md mx-auto mb-4">
              Save your brand kit first, then generate buyer profiles.
            </p>
            <button className="inline-flex items-center gap-2 px-4 py-2 bg-info text-surface rounded-lg font-medium hover:opacity-90 transition-all">
              <Plus size={18} />
              Create Buyer Profile
            </button>
          </div>
        ) : (
          <div className="grid gap-4">
            {brandProfiles.map((profile) => (
              <div key={profile.id} className="p-6 rounded-lg border border-border bg-surface-2">
                <h3 className="text-lg font-semibold text-text-primary">{profile.name}</h3>
                <p className="text-sm text-text-tertiary mt-1">Created on {profile.created}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
