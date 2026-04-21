import { z } from 'zod';

/** Signal bridge payload — event_id majburiy (dedupe + CAPI). */
export const bridgeEventSchema = z.object({
  event_id: z.string().min(1),
  event: z.string().min(1),
  ts: z.number().int().positive(),
  signal_bridge_id: z.string().min(1).optional(),
  phone: z.string().optional(),
  telegram_id: z.string().optional(),
  /** website | chat | other — O‘zbekistonda saytsiz do‘konlar uchun chat */
  action_source: z.enum(['website', 'chat', 'app', 'phone_call', 'other']).optional(),
  metadata: z.record(z.unknown()).optional(),
});

export type BridgeEvent = z.infer<typeof bridgeEventSchema>;

export function parseBridgeEvent(raw: unknown): BridgeEvent | null {
  const r = bridgeEventSchema.safeParse(raw);
  return r.success ? r.data : null;
}
