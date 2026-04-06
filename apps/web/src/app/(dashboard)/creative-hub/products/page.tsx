'use client'

import { Package } from 'lucide-react'

export default function ProductsPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-text-primary flex items-center gap-3">
          <Package size={32} />
          Products
        </h1>
        <p className="text-text-secondary mt-2">
          Mahsulot katalogini yaratish va boshqarish
        </p>
      </div>

      {/* Empty State */}
      <div className="text-center py-12">
        <p className="text-text-tertiary">Hozircha mahsulotlar yo'q</p>
      </div>
    </div>
  )
}
