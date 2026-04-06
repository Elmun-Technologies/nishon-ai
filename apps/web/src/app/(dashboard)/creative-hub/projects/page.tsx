'use client'

import { Folder } from 'lucide-react'

export default function ProjectsPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-text-primary flex items-center gap-3">
          <Folder size={32} />
          Projects
        </h1>
        <p className="text-text-secondary mt-2">
          Yaratuvchi proyektlarini yaratish va boshqarish
        </p>
      </div>

      {/* Empty State */}
      <div className="text-center py-12">
        <p className="text-text-tertiary">Hozircha proyektlar yo'q</p>
      </div>
    </div>
  )
}
