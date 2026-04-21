import type Redis from 'ioredis';
import type { Env } from '../config/env.js';

function dayKey(ts: number): string {
  return new Date(ts).toISOString().slice(0, 10).replace(/-/g, '');
}

export async function getDeliveryCount(redis: Redis, signalKey: string, now = Date.now()): Promise<number> {
  const k = `retargeting:delivery:${dayKey(now)}:${signalKey}`;
  const v = await redis.get(k);
  return v ? Number(v) : 0;
}

export async function isOverFrequencyCap(
  redis: Redis,
  env: Env,
  signalKey: string,
  now = Date.now(),
): Promise<boolean> {
  const n = await getDeliveryCount(redis, signalKey, now);
  return n >= env.FREQUENCY_CAP_PER_DAY;
}

/** Signal bridge yoki Ads webhook `AdImpression` yuborganida chaqiring. */
export async function recordDelivery(redis: Redis, signalKey: string, now = Date.now()): Promise<void> {
  const k = `retargeting:delivery:${dayKey(now)}:${signalKey}`;
  await redis.incr(k);
  await redis.expire(k, 3 * 86_400);
}
