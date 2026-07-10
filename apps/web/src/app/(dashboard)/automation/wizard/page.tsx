'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

/**
 * The old step-based "create rule" wizard here was a non-functional mock (no
 * save). The real, working rule builder lives at /triggersets, so this route
 * now just redirects there — no dead-end flow reachable by direct URL.
 */
export default function AutomationWizardRedirect() {
  const router = useRouter()

  useEffect(() => {
    router.replace('/triggersets')
  }, [router])

  return (
    <div className="flex min-h-[40vh] items-center justify-center text-sm text-text-secondary">
      Yo&apos;naltirilmoqda…
    </div>
  )
}
