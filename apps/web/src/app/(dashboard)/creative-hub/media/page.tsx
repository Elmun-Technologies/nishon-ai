'use client'

import { Upload } from 'lucide-react'

export default function CreativeHubMediaPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-text-primary">Media</h1>
        <p className="text-text-secondary mt-2">
          Loyihangiz uchun media fayllarini boshqaring
        </p>
      </div>

      {/* Upload Area */}
      <div className="border-2 border-dashed border-border rounded-lg p-12 text-center bg-surface-2 hover:bg-surface-3 transition-colors">
        <Upload size={40} className="text-text-tertiary mx-auto mb-4" />
        <h3 className="text-text-primary font-semibold mb-1">
          Medialarni yuklang
        </h3>
        <p className="text-text-secondary text-sm">
          Rasm va videolarini bu yerga torting yoki bosing
        </p>
      </div>

      {/* Empty State */}
      <div className="text-center py-12">
        <p className="text-text-tertiary">Hozircha media fayllar yo\'q</p>
      </div>
    </div>
  )
}
