import * as crypto from "node:crypto";

/** O‘zbekiston raqami — Meta PH hash uchun (ishlab chiqarishda Meta normalizatsiyasiga moslang). */
export function normalizePhoneDigitsForHash(phoneDigits: string): string {
  const d = phoneDigits.replace(/\D/g, "");
  if (d.startsWith("998")) return d;
  if (d.startsWith("9") && d.length === 9) return `998${d}`;
  return d;
}

export function hashPhoneSha256ForMeta(phoneDigits: string): string {
  const n = normalizePhoneDigitsForHash(phoneDigits);
  return crypto.createHash("sha256").update(n).digest("hex");
}
