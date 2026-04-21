import { Suspense } from 'react'
import { LoginClient } from './LoginClient'

/**
 * `LoginClient` calls `useSearchParams()` to honor `?next=`.
 * In Next 14, that hook MUST be wrapped in a `<Suspense>` boundary, otherwise
 * static prerendering bails out and the deployed page serves the
 * `__next_error__` HTML (visible to users as "Application error: a client-side exception").
 *
 * We also force-dynamic so this page is always rendered on demand and never
 * prerendered into a broken HTML during build.
 */
export const dynamic = 'force-dynamic'

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginClient />
    </Suspense>
  )
}
