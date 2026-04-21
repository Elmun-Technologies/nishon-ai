import crypto from 'node:crypto';

/** E.164 uchun O‘zbekiston raqamlari (998…). */
export function normalizeUzPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.startsWith('998')) return digits;
  if (digits.startsWith('9') && digits.length === 9) return `998${digits}`;
  return digits;
}

/** Meta fayl auditoriyasi uchun PH — ishlab chiqarishda Meta normalizatsiya qoidalariga moslang. */
export function hashPhone(phone: string): string {
  const norm = normalizeUzPhone(phone);
  return crypto.createHash('sha256').update(norm).digest('hex');
}

export function hashTelegramId(telegramId: string): string {
  const id = telegramId.replace(/\D/g, '');
  return crypto.createHash('sha256').update(`tg:${id}`).digest('hex');
}
