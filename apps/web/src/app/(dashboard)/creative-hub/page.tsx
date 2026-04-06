'use client'

import { Palette } from 'lucide-react'
import Link from 'next/link'

export default function CreativeHubPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-text-primary flex items-center gap-3">
          <Palette size={32} />
          Creative Hub
        </h1>
        <p className="text-text-secondary mt-2">
          Yaratuvchi kontentlar va medianing boshqarilishi
        </p>
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link href="/creative-hub/media"
          className="p-6 rounded-lg border border-border bg-surface-2 hover:bg-surface-3 transition-colors group">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-semibold text-text-primary group-hover:text-text-secondary transition-colors">
                Media
              </h3>
              <p className="text-text-secondary text-sm mt-1">
                Rasm, video va boshqa media fayllarini boshqaring
              </p>
            </div>
          </div>
        </Link>
      </div>
    </div>
  )
}
