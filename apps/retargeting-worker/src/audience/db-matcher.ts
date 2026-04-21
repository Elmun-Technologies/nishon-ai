import type { AudienceRule } from '../db/audiences.js';
import type { BridgeEvent } from '../types/event.js';
import { matchAudience, type BuiltInAudienceName } from './builder.js';

const BUILTINS: BuiltInAudienceName[] = [
  'Warm_7d',
  'Cart_NoPurchase_3d',
  'Telegram_PriceAsk_NoPay',
  'VIP_ClickPaid_180d',
  'Telegram_Start_WebsiteOptional',
];

export function matcherForAudienceRow(row: { name: string; rule: AudienceRule }) {
  const builtinFromRule = (row.rule as { builtin?: BuiltInAudienceName }).builtin;
  const builtin: BuiltInAudienceName | null =
    builtinFromRule && BUILTINS.includes(builtinFromRule)
      ? builtinFromRule
      : BUILTINS.includes(row.name as BuiltInAudienceName)
        ? (row.name as BuiltInAudienceName)
        : null;

  return (events: BridgeEvent[], now: number) => {
    if (!builtin) return false;
    return matchAudience(builtin, events, now);
  };
}
