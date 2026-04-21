/**
 * Deep link `t.me/bot?start=TOKEN` — token → chat_id (MVP server xotira).
 * Production: DB.
 */

const TTL_MS = 30 * 60 * 1000
const pending = new Map<string, number>()
const linked = new Map<string, { chatId: string; linkedAt: number }>()

function rnd() {
  return Math.random().toString(36).slice(2, 12)
}

export function createTelegramLinkToken(): string {
  const token = `lnk_${Date.now()}_${rnd()}`
  pending.set(token, Date.now())
  prune()
  return token
}

export function isPendingToken(token: string): boolean {
  prune()
  const t = pending.get(token)
  if (!t) return false
  if (Date.now() - t > TTL_MS) {
    pending.delete(token)
    return false
  }
  return true
}

export function completeTelegramLink(token: string, chatId: string): boolean {
  if (!isPendingToken(token)) return false
  pending.delete(token)
  linked.set(token, { chatId, linkedAt: Date.now() })
  return true
}

export function getTelegramLinkResult(token: string): { chatId: string } | null {
  prune()
  const row = linked.get(token)
  if (!row) return null
  if (Date.now() - row.linkedAt > TTL_MS) {
    linked.delete(token)
    return null
  }
  return { chatId: row.chatId }
}

export function takeTelegramLinkResult(token: string): { chatId: string } | null {
  const r = getTelegramLinkResult(token)
  if (r) linked.delete(token)
  return r
}

function prune() {
  const now = Date.now()
  for (const [k, t] of pending) {
    if (now - t > TTL_MS) pending.delete(k)
  }
  for (const [k, v] of linked) {
    if (now - v.linkedAt > TTL_MS) linked.delete(k)
  }
}
