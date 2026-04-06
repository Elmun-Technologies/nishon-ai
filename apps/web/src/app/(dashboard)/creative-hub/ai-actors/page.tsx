'use client'

import { Users2 } from 'lucide-react'

export default function AIActorsPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-text-primary flex items-center gap-3">
          <Users2 size={32} />
          AI Actors
        </h1>
        <p className="text-text-secondary mt-2">
          Suniy actor va vokal artistlarini yaratish va boshqarish
        </p>
      </div>

      {/* Empty State */}
      <div className="text-center py-12">
        <p className="text-text-tertiary">Hozircha AI Actors yo'q</p>
      </div>
    </div>
  )
}
