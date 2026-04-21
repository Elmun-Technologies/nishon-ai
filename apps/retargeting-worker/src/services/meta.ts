import axios, { type AxiosInstance } from 'axios';
import type { Env } from '../config/env.js';

function client(env: Env): AxiosInstance {
  const token = env.META_ACCESS_TOKEN;
  if (!token) throw new Error('META_ACCESS_TOKEN is required for Meta calls');
  return axios.create({
    baseURL: `https://graph.facebook.com/${env.META_GRAPH_VERSION}`,
    params: { access_token: token },
    timeout: 60_000,
  });
}

export async function createCustomAudience(
  env: Env,
  name: string,
  description: string,
): Promise<string> {
  if (env.DRY_RUN) {
    console.log(`[dry-run] createCustomAudience(${name})`);
    return `dry_${name}`;
  }
  const adAccount = env.META_AD_ACCOUNT_ID;
  if (!adAccount) throw new Error('META_AD_ACCOUNT_ID missing');
  const res = await client(env).post(`/${adAccount}/customaudiences`, {
    name,
    subtype: 'CUSTOM',
    description,
    customer_file_source: 'USER_PROVIDED_ONLY',
  });
  return res.data.id as string;
}

export async function addPhoneHashesToAudience(env: Env, audienceId: string, phones: string[]): Promise<void> {
  if (phones.length === 0) return;
  if (env.DRY_RUN) {
    console.log(`[dry-run] addPhoneHashesToAudience(${audienceId}, n=${phones.length})`);
    return;
  }
  await client(env).post(`/${audienceId}/users`, {
    payload: { schema: ['PH'], data: phones.map((p) => [p]) },
  });
}

export async function addExternIdHashesToAudience(
  env: Env,
  audienceId: string,
  externIds: string[],
): Promise<void> {
  if (externIds.length === 0) return;
  if (env.DRY_RUN) {
    console.log(`[dry-run] addExternIdHashesToAudience(${audienceId}, n=${externIds.length})`);
    return;
  }
  await client(env).post(`/${audienceId}/users`, {
    payload: { schema: ['EXTERN_ID'], data: externIds.map((p) => [p]) },
  });
}

export async function getAdSetInsights(env: Env, adsetId: string) {
  if (env.DRY_RUN) {
    return {
      spend: '0',
      actions: [],
      action_values: [],
      cost_per_action_type: [],
    };
  }
  const res = await client(env).get(`/${adsetId}/insights`, {
    params: {
      fields: 'spend,actions,action_values,cost_per_action_type',
      date_preset: 'last_7d',
    },
  });
  const row = res.data?.data?.[0];
  return row ?? {};
}

export async function getCustomAudienceApproxSize(env: Env, audienceId: string) {
  if (env.DRY_RUN) return 10_000;
  const res = await client(env).get(`/${audienceId}`, {
    params: {
      fields: 'approximate_count_lower_bound,approximate_count_upper_bound',
    },
  });
  const lo = Number(res.data?.approximate_count_lower_bound ?? 0);
  const hi = Number(res.data?.approximate_count_upper_bound ?? 0);
  if (hi > 0) return Math.round((lo + hi) / 2);
  return lo;
}

export async function getAdSet(env: Env, adsetId: string) {
  if (env.DRY_RUN) {
    return { daily_budget: '100000', status: 'ACTIVE' };
  }
  const res = await client(env).get(`/${adsetId}`, {
    params: { fields: 'daily_budget,status,effective_status' },
  });
  return res.data;
}

export async function updateAdSetDailyBudget(env: Env, adsetId: string, dailyBudget: number) {
  if (env.DRY_RUN) {
    console.log(`[dry-run] updateAdSetDailyBudget(${adsetId}, ${dailyBudget})`);
    return;
  }
  await client(env).post(`/${adsetId}`, { daily_budget: String(Math.max(1, Math.floor(dailyBudget))) });
}

export async function updateAdSetStatus(env: Env, adsetId: string, status: 'PAUSED' | 'ACTIVE') {
  if (env.DRY_RUN) {
    console.log(`[dry-run] updateAdSetStatus(${adsetId}, ${status})`);
    return;
  }
  await client(env).post(`/${adsetId}`, { status });
}

export async function createLookalikeFromSource(
  env: Env,
  sourceAudienceId: string,
  ratio: number,
  name: string,
) {
  if (env.DRY_RUN) {
    console.log(`[dry-run] createLookalikeFromSource(${sourceAudienceId}, ${ratio}, ${name})`);
    return `dry_lookalike_${name}`;
  }
  const adAccount = env.META_AD_ACCOUNT_ID;
  if (!adAccount) throw new Error('META_AD_ACCOUNT_ID missing');
  const res = await client(env).post(`/${adAccount}/customaudiences`, {
    name,
    subtype: 'LOOKALIKE',
    origin_audience_id: sourceAudienceId,
    lookalike_spec: {
      type: 'similarity',
      ratio,
    },
  });
  return res.data.id as string;
}
