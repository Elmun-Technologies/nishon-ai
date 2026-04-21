import { z } from 'zod';

const envSchema = z.object({
  META_ACCESS_TOKEN: z.string().optional(),
  META_AD_ACCOUNT_ID: z.string().optional(),
  META_GRAPH_VERSION: z.string().default('v19.0'),
  META_RETARGET_ADSET_ID: z.string().optional(),
  REDIS_URL: z.string(),
  DATABASE_URL: z.string().optional(),
  REDIS_EVENTS_STREAM: z.string().default('retargeting:events'),
  REDIS_EVENTS_GROUP: z.string().default('retargeting-worker'),
  REDIS_EVENTS_CONSUMER: z.string().default('worker-1'),
  REDIS_LEGACY_EVENTS_PREFIX: z.string().default('events:'),
  TARGET_CPA: z.coerce.number().positive().default(20_000),
  TARGET_ROAS: z.coerce.number().positive().default(4),
  MIN_AUDIENCE_SIZE: z.coerce.number().int().positive().default(1000),
  FREQUENCY_CAP_PER_DAY: z.coerce.number().int().positive().default(2),
  DRY_RUN: z.preprocess((v) => v === 'true' || v === '1', z.boolean()).default(false),
  CPA_STRATEGY: z.enum(['decrease_budget', 'pause_adset']).default('decrease_budget'),
});

export type Env = z.infer<typeof envSchema>;

export function loadEnv(): Env {
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    console.error(parsed.error.flatten().fieldErrors);
    throw new Error('Invalid environment variables');
  }
  return parsed.data;
}
