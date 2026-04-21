import type { BridgeEvent } from '../types/event.js';

/**
 * Barcha kanallarda bir xil `signal_bridge_id` saqlanadi — Meta/Telegram/Web
 * bir foydalanuvchini birlashtiradi (cookie 40% ishlamasa ham).
 */
export function resolveCrossPlatformKey(event: BridgeEvent): string | null {
  if (event.signal_bridge_id) return event.signal_bridge_id;
  if (event.phone) return `ph:${event.phone}`;
  if (event.telegram_id) return `tg:${event.telegram_id}`;
  return null;
}

export function telegramAbandonedCartCopy(productHint?: string): string {
  const hint = productHint ? ` (${productHint})` : '';
  return `Kechagi krossovkangiz${hint} savatda qoldi — tugallash uchun qaytadan bog‘laning.`;
}
