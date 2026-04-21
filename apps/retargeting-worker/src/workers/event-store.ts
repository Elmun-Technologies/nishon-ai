import type Redis from 'ioredis';
import type { Env } from '../config/env.js';
import { parseBridgeEvent, type BridgeEvent } from '../types/event.js';

const MAX_STREAM_EVENTS = 5000;

export async function loadEventsFromRedis(redis: Redis, env: Env): Promise<BridgeEvent[]> {
  const out: BridgeEvent[] = [];
  const seen = new Set<string>();

  const streamKey = env.REDIS_EVENTS_STREAM;
  try {
    const batch = await redis.xrange(streamKey, '-', '+', 'COUNT', MAX_STREAM_EVENTS);
    for (const [, fields] of batch) {
      const raw =
        fields.find((f, i) => f === 'payload' && fields[i + 1]) !== undefined
          ? fields[fields.indexOf('payload') + 1]
          : fields[1];
      if (!raw) continue;
      let parsed: unknown;
      try {
        parsed = JSON.parse(raw);
      } catch {
        continue;
      }
      const evt = parseBridgeEvent(parsed);
      if (!evt || seen.has(evt.event_id)) continue;
      seen.add(evt.event_id);
      out.push(evt);
    }
  } catch (e) {
    console.warn('Stream read failed (stream bo‘lmasa ham davom etamiz):', (e as Error).message);
  }

  const prefix = env.REDIS_LEGACY_EVENTS_PREFIX;
  const keys = await redis.keys(`${prefix}*`);
  for (const key of keys) {
    const lines = await redis.lrange(key, 0, -1);
    for (const line of lines) {
      let parsed: unknown;
      try {
        parsed = JSON.parse(line);
      } catch {
        continue;
      }
      const evt = parseBridgeEvent(parsed);
      if (!evt || seen.has(evt.event_id)) continue;
      seen.add(evt.event_id);
      out.push(evt);
    }
  }

  return out;
}
