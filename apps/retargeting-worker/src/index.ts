import 'dotenv/config';
import cron from 'node-cron';
import { loadEnv } from './config/env.js';
import { createPool } from './db/pool.js';
import { evaluateRetargeting, logRetargetingMetrics } from './engine/evaluate-retargeting.js';
import { syncAudiences } from './workers/syncAudiences.js';

const env = loadEnv();
const pool = createPool(env);

console.log('🚀 Retargeting worker (UZ signal bridge) ishga tushdi');

cron.schedule('*/15 * * * *', async () => {
  console.log('⏱ syncAudiences...');
  try {
    await syncAudiences(env, pool);
  } catch (e) {
    console.error('syncAudiences xato:', e);
  }
});

cron.schedule('0 * * * *', async () => {
  try {
    await logRetargetingMetrics(env);
  } catch (e) {
    console.error('logRetargetingMetrics xato:', e);
  }
});

cron.schedule('0 4 * * 1', async () => {
  console.log('📅 Haftalik autopilot: evaluateRetargeting (dushanba 04:00)...');
  try {
    await evaluateRetargeting(env, pool);
  } catch (e) {
    console.error('evaluateRetargeting xato:', e);
  }
});
