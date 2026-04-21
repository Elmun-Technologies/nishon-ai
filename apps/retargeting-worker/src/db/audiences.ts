import type pg from 'pg';
import type { Env } from '../config/env.js';
import { createCustomAudience } from '../services/meta.js';

export type Platform = 'meta' | 'google';

export type AudienceRule = Record<string, unknown>;

export async function createAudience(
  pool: pg.Pool,
  env: Env,
  input: { name: string; rule: AudienceRule; platform: Platform },
): Promise<{ id: number; meta_audience_id: string | null }> {
  let metaAudienceId: string | null = null;
  if (input.platform === 'meta') {
    metaAudienceId = await createCustomAudience(
      env,
      input.name,
      'Retargeting (signal bridge)',
    );
  }

  const res = await pool.query(
    `INSERT INTO retargeting_audiences (name, platform, rule, meta_audience_id)
     VALUES ($1, $2, $3::jsonb, $4)
     ON CONFLICT (name) DO UPDATE SET
       rule = EXCLUDED.rule,
       platform = EXCLUDED.platform,
       meta_audience_id = COALESCE(retargeting_audiences.meta_audience_id, EXCLUDED.meta_audience_id),
       updated_at = NOW()
     RETURNING id, meta_audience_id`,
    [input.name, input.platform, JSON.stringify(input.rule), metaAudienceId],
  );
  const row = res.rows[0] as { id: number; meta_audience_id: string | null };
  return { id: row.id, meta_audience_id: row.meta_audience_id };
}

export async function listAudiences(pool: pg.Pool) {
  const res = await pool.query(
    `SELECT id, name, platform, rule, meta_audience_id, creative_set_key, budget_share_pct
     FROM retargeting_audiences
     WHERE active = TRUE
     ORDER BY id ASC`,
  );
  return res.rows as Array<{
    id: number;
    name: string;
    platform: string;
    rule: AudienceRule;
    meta_audience_id: string | null;
    creative_set_key: string | null;
    budget_share_pct: string | null;
  }>;
}

export async function archiveAudience(pool: pg.Pool, audienceId: number) {
  await pool.query(`UPDATE retargeting_audiences SET active = FALSE, updated_at = NOW() WHERE id = $1`, [
    audienceId,
  ]);
}

export async function ensureMetaAudienceId(
  pool: pg.Pool,
  env: Env,
  row: { id: number; name: string; meta_audience_id: string | null },
): Promise<string | null> {
  if (row.meta_audience_id) return row.meta_audience_id;
  const id = await createCustomAudience(env, row.name, 'Retargeting auto audience');
  await pool.query(`UPDATE retargeting_audiences SET meta_audience_id = $1, updated_at = NOW() WHERE id = $2`, [
    id,
    row.id,
  ]);
  return id;
}
