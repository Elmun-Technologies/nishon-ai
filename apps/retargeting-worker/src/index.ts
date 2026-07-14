import 'dotenv/config';
import cron from 'node-cron';
import { loadEnv } from './config/env.js';
import { createPool } from './db/pool.js';
import { evaluateRetargeting, logRetargetingMetrics } from './engine/evaluate-retargeting.js';
import { syncAudiences } from './workers/syncAudiences.js';

const env = loadEnv();
const pool = createPool(env);

/**
 * Autonomous AI Agent mode. When enabled, manual audience building is frozen —
 * the AI agent owns audience construction per funnel stage instead. Default is
 * OFF so the live worker keeps its current behavior until explicitly switched
 * over with AGENT_AUTONOMOUS_MODE=true.
 */
const AGENT_AUTONOMOUS_MODE =
  (process.env.AGENT_AUTONOMOUS_MODE ?? 'false').toLowerCase() === 'true';

console.log('🚀 Retargeting worker (UZ signal bridge) ishga tushdi');
if (AGENT_AUTONOMOUS_MODE) {
  console.log('🤖 AGENT_AUTONOMOUS_MODE=on — manual syncAudiences frozen (AI agent owns audiences)');
}

cron.schedule('*/15 * * * *', async () => {
  if (AGENT_AUTONOMOUS_MODE) return; // manual audience building frozen
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
