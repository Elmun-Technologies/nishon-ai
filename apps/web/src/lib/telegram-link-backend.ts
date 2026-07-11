/**
 * Cross-instance bridge for the Telegram digest linking flow. The in-memory
 * `telegram-link-store` works only when the /start webhook and the status poll
 * hit the same serverless instance; on Vercel they usually don't. These helpers
 * mirror the token→chat_id handshake into the backend (Redis) so the link
 * survives across instances. All calls are best-effort — failures fall back to
 * the in-memory store, so single-instance deployments never regress.
 */

function apiBase(): string {
  return (
    process.env.NEXT_PUBLIC_API_BASE_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    (process.env.NODE_ENV === 'production'
      ? 'https://adspectr-api.onrender.com'
      : 'http://localhost:3001')
  )
}

function secretQuery(): string {
  const s = process.env.TELEGRAM_WEBHOOK_SECRET
  return s ? `&secret=${encodeURIComponent(s)}` : ''
}

/** Record token → chat_id in the backend (called from the /start webhook). */
export async function backendCompleteLink(token: string, chatId: string): Promise<void> {
  try {
    await fetch(`${apiBase()}/api/telegram/link/complete?_=1${secretQuery()}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, chatId }),
    })
  } catch {
    /* best-effort — the in-memory store still holds the link on this instance */
  }
}

/** Read the chat_id linked to a token from the backend (returns null if none). */
export async function backendLinkStatus(token: string): Promise<string | null> {
  try {
    const res = await fetch(
      `${apiBase()}/api/telegram/link/status?token=${encodeURIComponent(token)}${secretQuery()}`,
      { cache: 'no-store' },
    )
    if (!res.ok) return null
    const json = (await res.json()) as { status?: string; chatId?: string }
    return json.status === 'linked' && json.chatId ? json.chatId : null
  } catch {
    return null
  }
}
