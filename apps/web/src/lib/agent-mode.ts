/**
 * Autonomous AI Agent mode — the central feature flag for the "Virtual AI
 * Marketing Agent" pivot.
 *
 * When enabled, the product behaves as an autonomous media buyer: the manual
 * builders (Campaign Builder, Audience Builder, Retargeting configuration) are
 * frozen in the UI and the AI agent owns launch / optimization / retargeting.
 * The dashboard greets a logged-in user with the AI Agent Setup instead of a
 * blank analytics grid.
 *
 * Nothing is deleted. Every frozen module still lives in the codebase and can
 * be restored instantly by flipping the flag:
 *
 *   NEXT_PUBLIC_AGENT_MODE=false   → full manual dashboard is back
 *
 * Default is ON, because this branch *is* the pivot. Ops can set the env var to
 * `false` on any environment that should keep the legacy manual UI.
 */
export const AGENT_MODE =
  (process.env.NEXT_PUBLIC_AGENT_MODE ?? 'true').toLowerCase() !== 'false'

/**
 * Routes owned by the autonomous agent and therefore hidden from the manual UI.
 * Grouped by the module they belong to so intent stays readable.
 *
 * Kept as base paths — matching is prefix-aware, so `/launch/preview`,
 * `/audiences/create`, `/retargeting/wizard`, etc. are all covered.
 */
export const FROZEN_ROUTES: readonly string[] = [
  // Manual "Campaign Builder" (Мастер запуска)
  '/launch',
  '/campaigns',
  '/ad-launcher',
  // Manual "Audience Builder" (Конструктор аудиторий)
  '/audiences',
  // Manual "Retargeting Configuration"
  '/retargeting',
  '/retarget',
  '/triggersets',
] as const

/** Human-readable module label per frozen base route (for the locked screen). */
export const FROZEN_ROUTE_MODULE: Record<string, string> = {
  '/launch': 'campaignBuilder',
  '/campaigns': 'campaignBuilder',
  '/ad-launcher': 'campaignBuilder',
  '/audiences': 'audienceBuilder',
  '/retargeting': 'retargeting',
  '/retarget': 'retargeting',
  '/triggersets': 'retargeting',
}

function matchesBase(pathname: string, base: string): boolean {
  if (!pathname) return false
  return pathname === base || pathname.startsWith(`${base}/`)
}

/**
 * Is this route currently frozen (owned by the AI agent)?
 * Always false when AGENT_MODE is off — so the guards become no-ops and the
 * manual UI works exactly as before.
 */
export function isRouteFrozen(pathname: string): boolean {
  if (!AGENT_MODE) return false
  return FROZEN_ROUTES.some((base) => matchesBase(pathname, base))
}

/** The module key for a frozen route, used to pick locked-screen copy. */
export function frozenModuleKey(pathname: string): string {
  const base = FROZEN_ROUTES.find((b) => matchesBase(pathname, b))
  return (base && FROZEN_ROUTE_MODULE[base]) || 'default'
}

/**
 * Filter a sidebar category's items, dropping frozen ones while AGENT_MODE is on.
 * Generic over the item shape so the Sidebar's own typing is preserved.
 */
export function filterFrozenNavItems<T extends { href: string }>(items: T[]): T[] {
  if (!AGENT_MODE) return items
  return items.filter((item) => !isRouteFrozen(item.href))
}
