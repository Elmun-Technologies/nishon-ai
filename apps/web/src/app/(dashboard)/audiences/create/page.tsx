'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

/**
 * Unbuilt blank stub. Redirect to the working audiences page rather than
 * rendering an empty page for anyone who navigates here directly.
 */
export default function AudiencesCreateRedirect() {
  const router = useRouter()

  useEffect(() => {
    router.replace('/audiences')
  }, [router])

  return (
    <div className="flex min-h-[40vh] items-center justify-center text-sm text-text-secondary">
      Yo&apos;naltirilmoqda…
    </div>
  )
}
