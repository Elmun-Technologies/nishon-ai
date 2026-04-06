'use client'

import { Palette } from 'lucide-react'

export default function BrandKitPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-text-primary flex items-center gap-3">
          <Palette size={32} />
          Brand Kit
        </h1>
        <p className="text-text-secondary mt-2">
          Brandingizni boshqarish va ranglarni belgilash
        </p>
      </div>

      {/* Empty State */}
      <div className="text-center py-12">
        <p className="text-text-tertiary">Hozircha Brand Kit yo'q</p>
      </div>
    </div>
  )
}
