/**
 * Normalizes API errors from `apiRequest` (fetch wrapper) or raw network errors for UI copy.
 */
export function getApiErrorMessage(err: unknown, fallback: string): string {
  const o = err && typeof err === 'object' ? (err as Record<string, unknown>) : null

  const response = o?.response
  const data =
    response && typeof response === 'object' && response !== null && 'data' in response
      ? (response as { data: unknown }).data
      : null

  if (data && typeof data === 'object' && data !== null && 'message' in data) {
    const msg = (data as { message: unknown }).message
    if (Array.isArray(msg)) {
      const parts = msg.filter((m): m is string => typeof m === 'string' && m.trim().length > 0)
      if (parts.length) return parts.join(' ')
    }
    if (typeof msg === 'string' && msg.trim()) return msg.trim()
  }

  if (o && typeof o.message === 'string' && o.message.trim()) return o.message.trim()
  if (err instanceof Error && err.message.trim()) return err.message.trim()
  return fallback
}
