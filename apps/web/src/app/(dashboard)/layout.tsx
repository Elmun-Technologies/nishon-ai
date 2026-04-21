import { DashboardLayoutClient } from './DashboardLayoutClient'

/** Client dashboard pages must not be statically prerendered (hooks + shell). */
export const dynamic = 'force-dynamic'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <DashboardLayoutClient>{children}</DashboardLayoutClient>
}
