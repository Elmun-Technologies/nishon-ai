/**
 * Inclusive calendar day count between ISO date strings (YYYY-MM-DD).
 * Returns null if inputs are missing, invalid, or end is before start.
 */
export function daysBetweenInclusive(
  from: string,
  to: string,
  maxDays = 365,
): number | null {
  if (!from || !to) return null
  const fromTime = new Date(from).getTime()
  const toTime = new Date(to).getTime()
  if (Number.isNaN(fromTime) || Number.isNaN(toTime) || toTime < fromTime) return null
  const diff = Math.floor((toTime - fromTime) / 86_400_000) + 1
  return Math.min(Math.max(diff, 1), maxDays)
}
