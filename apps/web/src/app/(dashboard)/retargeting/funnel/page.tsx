'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

/**
 * The funnel-detail view was never built (blank stub). Redirect to the working
 * retargeting feature at /retarget rather than showing an empty page.
 */
export default function RetargetingFunnelRedirect() {
  const router = useRouter()

  useEffect(() => {
    router.replace('/retarget')
  }, [router])

  return (
    <div className="flex min-h-[40vh] items-center justify-center text-sm text-text-secondary">
      Yo&apos;naltirilmoqda…
    </div>
  )
}
