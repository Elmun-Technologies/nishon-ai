'use client'

import Link from 'next/link'

export default function CompetitorClonePage() {
  return (
    <div className="space-y-6">
      <div>
        <Link href="/creative-hub/create-ad" className="text-info font-medium hover:underline mb-4 inline-flex items-center gap-1">
          ← Back to Create Ad
        </Link>
        <h1 className="text-3xl font-bold text-text-primary mt-4">Competitor Clone</h1>
        <p className="text-text-secondary mt-2">
          Clone competitor ads that are working and make them yours.
        </p>
      </div>

      <div className="text-center py-12">
        <p className="text-text-tertiary">Competitor Clone wizard coming soon...</p>
      </div>
    </div>
  )
}
