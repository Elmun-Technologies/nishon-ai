import Redis from 'ioredis';
import type pg from 'pg';
import type { Env } from '../config/env.js';
import { matcherForAudienceRow } from '../audience/db-matcher.js';
import type { BuiltInAudienceName } from '../audience/builder.js';
import { matchAudience } from '../audience/builder.js';
import { ensureMetaAudienceId, listAudiences } from '../db/audiences.js';
import { createCustomAudience } from '../services/meta.js';
import { addExternIdHashesToAudience, addPhoneHashesToAudience } from '../services/meta.js';
import { hashPhone, hashTelegramId } from '../services/hash.js';
import type { BridgeEvent } from '../types/event.js';
import { loadEventsFromRedis } from './event-store.js';
import { isOverFrequencyCap } from './frequency.js';

const DEFAULT_AUDIENCES: BuiltInAudienceName[] = [
  'Warm_7d',
  'Cart_NoPurchase_3d',
  'Telegram_PriceAsk_NoPay',
  'VIP_ClickPaid_180d',
  'Telegram_Start_WebsiteOptional',
];

type Target = {
  name: string;
  matcher: (events: BridgeEvent[], now: number) => boolean;
  resolveMetaId: () => Promise<string | null>;
};

function groupEvents(events: BridgeEvent[]): Map<string, BridgeEvent[]> {
  const map = new Map<string, BridgeEvent[]>();
  for (const e of events) {
    const key =
      e.signal_bridge_id ??
      (e.phone ? `ph:${e.phone}` : null) ??
      (e.telegram_id ? `tg:${e.telegram_id}` : null);
    if (!key) continue;
    const list = map.get(key) ?? [];
    list.push(e);
    map.set(key, list);
  }
  for (const [, list] of map) {
    list.sort((a, b) => a.ts - b.ts);
  }
  return map;
}

async function cachedMetaAudienceId(redis: Redis, env: Env, name: string): Promise<string> {
  const cacheKey = `retargeting:meta_audience:${name}`;
  const existing = await redis.get(cacheKey);
  if (existing) return existing;
  const id = await createCustomAudience(env, name, 'Retargeting MVP (signal bridge)');
  await redis.set(cacheKey, id);
  return id;
}

export async function buildTargets(env: Env, pool: pg.Pool | null, redis: Redis): Promise<Target[]> {
  const targets: Target[] = [];

  if (pool) {
    const rows = await listAudiences(pool);
    const metaRows = rows.filter((r) => r.platform === 'meta');
    for (const row of metaRows) {
      const matcher = matcherForAudienceRow(row);
      targets.push({
        name: row.name,
        matcher,
        resolveMetaId: async () =>
          ensureMetaAudienceId(pool, env, {
            id: row.id,
            name: row.name,
            meta_audience_id: row.meta_audience_id,
          }),
      });
    }
  }

  if (targets.length === 0) {
    for (const name of DEFAULT_AUDIENCES) {
      targets.push({
        name,
        matcher: (events, now) => matchAudience(name, events, now),
        resolveMetaId: () => cachedMetaAudienceId(redis, env, name),
      });
    }
  }

  return targets;
}

export async function syncAudiences(env: Env, pool: pg.Pool | null) {
  const redis = new Redis(env.REDIS_URL);
  try {
    const events = await loadEventsFromRedis(redis, env);
    const profiles = groupEvents(events);
    const now = Date.now();
    const targets = await buildTargets(env, pool, redis);

    for (const target of targets) {
      const ph = new Set<string>();
      const ext = new Set<string>();

      for (const [signalKey, list] of profiles) {
        if (!target.matcher(list, now)) continue;
        if (await isOverFrequencyCap(redis, env, signalKey, now)) continue;

        const last = list[list.length - 1];
        if (last.phone) ph.add(hashPhone(last.phone));
        if (last.telegram_id) ext.add(hashTelegramId(last.telegram_id));
      }

      if (ph.size === 0 && ext.size === 0) {
        console.log(`— ${target.name}: a’zo yo‘q`);
        continue;
      }

      const metaId = await target.resolveMetaId();
      if (!metaId) {
        console.warn(`${target.name}: Meta audience ID olinmadi`);
        continue;
      }

      await addPhoneHashesToAudience(env, metaId, [...ph]);
      await addExternIdHashesToAudience(env, metaId, [...ext]);
      console.log(`✅ ${target.name}: PH=${ph.size}, EXTERN=${ext.size} (hash)`);
    }
  } finally {
    redis.disconnect();
  }
}
