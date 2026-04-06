'use client'

import { Palette } from 'lucide-react'

export default function CreativeHub() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 rounded-lg bg-surface-2">
            <Palette size={24} className="text-text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-text-primary">Creative Hub</h1>
            <p className="text-text-secondary text-sm">
              Yaratuvchi kontentlar va media boshqarish
            </p>
          </div>
        </div>
      </div>

      {/* Content will be added based on screenshots */}
      <div className="text-center py-12">
        <p className="text-text-tertiary">Yangilanishni kuting...</p>
      </div>
    </div>
  )
}
