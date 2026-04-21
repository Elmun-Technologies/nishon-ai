import type { BridgeEvent } from '../types/event.js';

export type BuiltInAudienceName =
  | 'Warm_7d'
  | 'Cart_NoPurchase_3d'
  | 'Telegram_PriceAsk_NoPay'
  | 'VIP_ClickPaid_180d'
  | 'Telegram_Start_WebsiteOptional';

const MS_DAY = 86_400_000;

function hasPurchaseSince(events: BridgeEvent[], sinceTs: number, now: number): boolean {
  return events.some(
    (e) => e.event === 'Purchase' && e.ts >= sinceTs && e.ts <= now,
  );
}

function hasPurchaseInLastDays(events: BridgeEvent[], days: number, now: number): boolean {
  const since = now - days * MS_DAY;
  return hasPurchaseSince(events, since, now);
}

function newestTsForEvent(events: BridgeEvent[], name: string): number | null {
  const hits = events.filter((e) => e.event === name).map((e) => e.ts);
  if (hits.length === 0) return null;
  return Math.max(...hits);
}

export function matchAudience(name: BuiltInAudienceName, events: BridgeEvent[], now = Date.now()): boolean {
  switch (name) {
    case 'Warm_7d': {
      const viewed = events.some(
        (e) =>
          (e.event === 'ViewContent' || e.event === 'PageView') &&
          now - e.ts <= 7 * MS_DAY &&
          (e.action_source === 'website' || e.action_source === 'chat' || e.action_source === undefined),
      );
      return viewed && !hasPurchaseInLastDays(events, 7, now);
    }
    case 'Cart_NoPurchase_3d': {
      const cartTs = newestTsForEvent(events, 'AddToCart');
      if (cartTs === null) return false;
      if (now - cartTs > 3 * MS_DAY) return false;
      return !events.some((e) => e.event === 'Purchase' && e.ts >= cartTs);
    }
    case 'Telegram_PriceAsk_NoPay': {
      const asked = events.some(
        (e) =>
          e.event === 'telegram_price_ask' ||
          (e.metadata && (e.metadata as { intent?: string }).intent === 'price_ask'),
      );
      return asked && !hasPurchaseInLastDays(events, 14, now);
    }
    case 'VIP_ClickPaid_180d': {
      return events.some(
        (e) =>
          (e.event === 'ClickPayment' || e.event === 'InitiateCheckout') &&
          now - e.ts <= 180 * MS_DAY,
      );
    }
    case 'Telegram_Start_WebsiteOptional': {
      const started = events.some(
        (e) =>
          (e.event === 'ConversationStarted' || e.event === 'TelegramStart') &&
          e.action_source === 'chat',
      );
      return started && !hasPurchaseInLastDays(events, 30, now);
    }
    default:
      return false;
  }
}

export function daysSinceFirstSignal(events: BridgeEvent[], now = Date.now()): number {
  if (events.length === 0) return 0;
  const first = Math.min(...events.map((e) => e.ts));
  return Math.max(0, Math.floor((now - first) / MS_DAY));
}
