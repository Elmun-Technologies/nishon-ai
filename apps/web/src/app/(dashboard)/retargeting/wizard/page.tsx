'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

/**
 * The retargeting wizard was never built (blank stub). The working retargeting
 * feature lives at /retarget, so this route redirects there instead of showing
 * an empty page to anyone who clicks "New campaign".
 */
export default function RetargetingWizardRedirect() {
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
