'use client'

import { useState } from 'react'
import { X } from 'lucide-react'

interface CreateAIActorModalProps {
  isOpen: boolean
  onClose: () => void
}

export function CreateAIActorModal({ isOpen, onClose }: CreateAIActorModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    gender: 'female',
    age: 'young',
    ethnicity: 'any',
    outfit: 'casual',
    outfitDescription: '',
    scene: 'living',
    sceneDescription: '',
    additionalDetails: '',
  })

  const outfitOptions = ['Randomize', 'Casual', 'Formal', 'Sporty', 'Doctor', 'Nurse', 'Chef', 'Worker', 'Business', 'Trendy', 'Vintage']
  const sceneOptions = ['Randomize', 'Living room', 'Bedroom', 'Kitchen', 'Home office', 'Gym', 'Office', 'Clinic', 'Coffee shop', 'Outdoor park', 'Studio']

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-surface rounded-lg max-w-2xl w-full max-h-96 overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border sticky top-0 bg-surface">
          <h2 className="text-xl font-bold text-text-primary">Create AI Actor</h2>
          <button onClick={onClose} className="text-text-tertiary hover:text-text-primary">
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">Name</label>
            <input
              type="text"
              placeholder="e.g., Sarah, Alex, Jordan"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-border rounded-lg bg-surface-2 text-text-primary focus:outline-none focus:ring-2 focus:ring-info/50"
            />
          </div>

          {/* Dropdowns Row */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">Gender</label>
              <select
                value={formData.gender}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                className="w-full px-3 py-2 border border-border rounded-lg bg-surface-2 text-text-primary focus:outline-none focus:ring-2 focus:ring-info/50"
              >
                <option value="female">Female</option>
                <option value="male">Male</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">Age</label>
              <select
                value={formData.age}
                onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                className="w-full px-3 py-2 border border-border rounded-lg bg-surface-2 text-text-primary focus:outline-none focus:ring-2 focus:ring-info/50"
              >
                <option value="young">Young Adult</option>
                <option value="middle">Middle Aged</option>
                <option value="senior">Senior</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">Ethnicity</label>
              <select
                value={formData.ethnicity}
                onChange={(e) => setFormData({ ...formData, ethnicity: e.target.value })}
                className="w-full px-3 py-2 border border-border rounded-lg bg-surface-2 text-text-primary focus:outline-none focus:ring-2 focus:ring-info/50"
              >
                <option value="any">Any</option>
                <option value="east-asian">East Asian</option>
                <option value="south-asian">South Asian</option>
                <option value="african">African</option>
                <option value="caucasian">Caucasian</option>
                <option value="hispanic">Hispanic</option>
              </select>
            </div>
          </div>

          {/* Outfit */}
          <div>
            <label className="block text-sm font-medium text-text-primary mb-3">Outfit</label>
            <div className="flex gap-2 flex-wrap mb-3">
              {outfitOptions.map((outfit) => (
                <button
                  key={outfit}
                  onClick={() => setFormData({ ...formData, outfit: outfit.toLowerCase() })}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    formData.outfit === outfit.toLowerCase()
                      ? 'bg-info text-surface'
                      : 'bg-surface-2 text-text-secondary hover:text-text-primary'
                  }`}
                >
                  {outfit}
                </button>
              ))}
            </div>
            <textarea
              placeholder="Describe outfit..."
              value={formData.outfitDescription}
              onChange={(e) => setFormData({ ...formData, outfitDescription: e.target.value })}
              className="w-full px-3 py-2 border border-border rounded-lg bg-surface-2 text-text-primary placeholder-text-tertiary focus:outline-none focus:ring-2 focus:ring-info/50 resize-none text-sm"
              rows={2}
            />
          </div>

          {/* Scene / Background */}
          <div>
            <label className="block text-sm font-medium text-text-primary mb-3">Scene / Background</label>
            <div className="flex gap-2 flex-wrap mb-3">
              {sceneOptions.map((scene) => (
                <button
                  key={scene}
                  onClick={() => setFormData({ ...formData, scene: scene.toLowerCase().replace(' ', '-') })}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    formData.scene === scene.toLowerCase().replace(' ', '-')
                      ? 'bg-info text-surface'
                      : 'bg-surface-2 text-text-secondary hover:text-text-primary'
                  }`}
                >
                  {scene}
                </button>
              ))}
            </div>
            <textarea
              placeholder="Describe scene..."
              value={formData.sceneDescription}
              onChange={(e) => setFormData({ ...formData, sceneDescription: e.target.value })}
              className="w-full px-3 py-2 border border-border rounded-lg bg-surface-2 text-text-primary placeholder-text-tertiary focus:outline-none focus:ring-2 focus:ring-info/50 resize-none text-sm"
              rows={2}
            />
          </div>

          {/* Additional Details */}
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">Additional Details</label>
            <textarea
              placeholder="Hair color, distinguishing features, etc."
              value={formData.additionalDetails}
              onChange={(e) => setFormData({ ...formData, additionalDetails: e.target.value })}
              className="w-full px-3 py-2 border border-border rounded-lg bg-surface-2 text-text-primary placeholder-text-tertiary focus:outline-none focus:ring-2 focus:ring-info/50 resize-none text-sm"
              rows={2}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-border sticky bottom-0 bg-surface-2">
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-border rounded-lg text-text-primary hover:bg-surface transition-colors"
            >
              Cancel
            </button>
            <button className="px-6 py-2 bg-info text-surface rounded-lg font-medium hover:opacity-90 transition-all flex items-center gap-2">
              <span>✨</span>
              Generate AI Actor
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
