'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

/**
 * This route previously exposed an internal build blueprint (planned ad
 * networks, ETL/warehouse internals, billing stack, team roles, a build order)
 * as if it were shipped platform capability. It isn't linked from the app and
 * shouldn't be user-facing, so it redirects to the real docs.
 */
export default function PlatformArchitectureRedirect() {
  const router = useRouter()

  useEffect(() => {
    router.replace('/docs')
  }, [router])

  return (
    <div className="flex min-h-[40vh] items-center justify-center text-sm text-text-secondary">
      Yo&apos;naltirilmoqda…
    </div>
  )
}
