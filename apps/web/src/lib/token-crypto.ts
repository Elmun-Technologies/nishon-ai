import { createCipheriv, createDecipheriv, randomBytes } from 'crypto'

const ALGO = 'aes-256-gcm'

function getKey(): Buffer {
  const raw = process.env.ENCRYPTION_KEY ?? ''
  // Accept 32-char ASCII key or 64-char hex-encoded 32-byte key
  if (raw.length === 64) return Buffer.from(raw, 'hex')
  if (raw.length === 32) return Buffer.from(raw, 'utf8')
  // Fallback: zero key (dev only — tokens stored unencrypted won't decrypt in prod)
  return Buffer.alloc(32, 0)
}

/** Encrypts a plaintext token string. Returns "ivHex:dataHex:tagHex". */
export function encryptToken(token: string): string {
  const key = getKey()
  const iv = randomBytes(12)
  const cipher = createCipheriv(ALGO, key, iv)
  const encrypted = Buffer.concat([cipher.update(token, 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()
  return `${iv.toString('hex')}:${encrypted.toString('hex')}:${tag.toString('hex')}`
}

/** Decrypts a token encrypted with encryptToken. Returns plaintext. */
export function decryptToken(stored: string): string {
  const parts = stored.split(':')
  if (parts.length !== 3) {
    // Stored as plaintext (dev fallback or legacy) — return as-is
    return stored
  }
  const [ivHex, dataHex, tagHex] = parts
  const key = getKey()
  const iv = Buffer.from(ivHex, 'hex')
  const data = Buffer.from(dataHex, 'hex')
  const tag = Buffer.from(tagHex, 'hex')
  const decipher = createDecipheriv(ALGO, key, iv)
  decipher.setAuthTag(tag)
  return Buffer.concat([decipher.update(data), decipher.final()]).toString('utf8')
}
