import pg from 'pg';
import type { Env } from '../config/env.js';

export function createPool(env: Env): pg.Pool | null {
  if (!env.DATABASE_URL) return null;
  return new pg.Pool({ connectionString: env.DATABASE_URL, max: 5 });
}
