'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Users2, ChevronRight } from 'lucide-react'

interface AIActor {
  id: string
  name: string
  category: string
}

const mockActors: AIActor[] = Array.from({ length: 12 }, (_, i) => ({
  id: `actor_${i + 1}`,
  name: `AI Actor ${i + 1}`,
  category: ['Male', 'Female', 'Diverse', 'Animated'][i % 4],
}))

export default function AIActorsGalleryPage() {
  const [selectedActors, setSelectedActors] = useState<string[]>([])

  const handleSelectActor = (id: string) => {
    setSelectedActors(prev =>
      prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id]
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <p className="text-sm text-info font-medium mb-2">Choose from 300+ AI actors</p>
        <h1 className="text-3xl font-bold text-text-primary">Avatar Gallery</h1>
        <p className="text-text-secondary mt-2">
          Select AI actors to feature in your ads. Each actor gets their own set of variations.
        </p>
      </div>

      {/* Category Filter */}
      <div className="flex gap-2 flex-wrap">
        {['All', 'Male', 'Female', 'Diverse', 'Animated'].map((cat) => (
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

      {/* Actors Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {mockActors.map((actor) => (
          <label
            key={actor.id}
            className={`relative rounded-lg overflow-hidden cursor-pointer transition-all border-2 group ${
              selectedActors.includes(actor.id)
                ? 'border-info'
                : 'border-border hover:border-border-hover'
            }`}
          >
            <input
              type="checkbox"
              checked={selectedActors.includes(actor.id)}
              onChange={() => handleSelectActor(actor.id)}
              className="hidden"
            />

            {/* Avatar Placeholder */}
            <div className="aspect-square bg-gradient-to-br from-info/10 to-success/10 flex items-center justify-center group-hover:bg-opacity-80 transition-colors">
              <Users2 size={48} className="text-text-tertiary" />
            </div>

            {/* Info */}
            <div className="p-3 bg-surface-2">
              <p className="font-medium text-text-primary">{actor.name}</p>
              <p className="text-xs text-text-tertiary">{actor.category}</p>
            </div>

            {/* Checkbox */}
            {selectedActors.includes(actor.id) && (
              <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-info flex items-center justify-center">
                <span className="text-white text-sm font-bold">✓</span>
              </div>
            )}
          </label>
        ))}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 pt-4">
        <Link
          href="javascript:history.back()"
          className="px-6 py-2 border border-border rounded-lg font-medium text-text-primary hover:bg-surface-2 transition-colors"
        >
          Back
        </Link>
        <button
          disabled={selectedActors.length === 0}
          className={`px-6 py-2 rounded-lg font-medium flex items-center gap-2 transition-all ${
            selectedActors.length > 0
              ? 'bg-text-primary text-surface hover:opacity-90'
              : 'bg-surface-2 text-text-tertiary cursor-not-allowed'
          }`}
        >
          {selectedActors.length > 0 ? `Add ${selectedActors.length} Actors` : 'Select Actors'}
          <ChevronRight size={18} />
        </button>
      </div>
    </div>
  )
}
