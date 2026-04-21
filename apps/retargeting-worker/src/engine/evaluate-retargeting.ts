import type pg from 'pg';
import type { Env } from '../config/env.js';
import { archiveAudience, listAudiences } from '../db/audiences.js';
import {
  createLookalikeFromSource,
  getAdSet,
  getAdSetInsights,
  getCustomAudienceApproxSize,
  updateAdSetDailyBudget,
  updateAdSetStatus,
} from '../services/meta.js';

function pickPurchaseCount(actions: Array<{ action_type: string; value: string }> | undefined): number {
  if (!actions) return 0;
  const hit = actions.find((a) =>
    ['purchase', 'omni_purchase', 'offsite_conversion.fb_pixel_custom', 'onsite_conversion.purchase'].includes(
      a.action_type,
    ),
  );
  return hit ? Number(hit.value) : 0;
}

function pickPurchaseValue(
  actionValues: Array<{ action_type: string; value: string }> | undefined,
): number {
  if (!actionValues) return 0;
  const hit = actionValues.find((a) =>
    ['purchase', 'omni_purchase', 'offsite_conversion.fb_pixel_custom', 'onsite_conversion.purchase'].includes(
      a.action_type,
    ),
  );
  return hit ? Number(hit.value) : 0;
}

export async function logRetargetingMetrics(env: Env) {
  const adsetId = env.META_RETARGET_ADSET_ID;
  if (!adsetId) return;
  const insights = await getAdSetInsights(env, adsetId);
  const spend = Number.parseFloat(String(insights.spend ?? '0'));
  const purchases = pickPurchaseCount(insights.actions);
  const purchaseValue = pickPurchaseValue(insights.action_values);
  const cpa = purchases > 0 ? spend / purchases : Number.POSITIVE_INFINITY;
  const roas = spend > 0 ? purchaseValue / spend : 0;
  console.log(
    `📊 Soatlik ko‘rinish: CPA≈${Number.isFinite(cpa) ? Math.round(cpa) : '∞'} | ROAS≈${roas.toFixed(2)} | xarajat=${spend.toFixed(
      2,
    )}`,
  );
}

/**
 * Haftalik autopilot: CPA → byudjet, ROAS → lookalike, kichik auditoriya → arxiv.
 * CPA > target uchun `CPA_STRATEGY`: decrease_budget | pause_adset.
 */
export async function evaluateRetargeting(env: Env, pool: pg.Pool | null) {
  const adsetId = env.META_RETARGET_ADSET_ID;
  if (!adsetId) {
    console.log('META_RETARGET_ADSET_ID yo‘q — autopilot o‘tkazib yuborildi');
    return;
  }

  const insights = await getAdSetInsights(env, adsetId);
  const spend = Number.parseFloat(String(insights.spend ?? '0'));
  const purchases = pickPurchaseCount(insights.actions);
  const purchaseValue = pickPurchaseValue(insights.action_values);
  const cpa = purchases > 0 ? spend / purchases : Number.POSITIVE_INFINITY;
  const roas = spend > 0 ? purchaseValue / spend : 0;

  console.log(
    `📈 CPA≈${Number.isFinite(cpa) ? Math.round(cpa) : '∞'} | ROAS≈${roas.toFixed(2)} | xarajat=${spend.toFixed(2)}`,
  );

  if (Number.isFinite(cpa) && cpa > env.TARGET_CPA) {
    if (env.CPA_STRATEGY === 'pause_adset') {
      await updateAdSetStatus(env, adsetId, 'PAUSED');
      console.log('⏸ CPA yuqori — adset pauza.');
    } else {
      const adset = await getAdSet(env, adsetId);
      const daily = Number.parseInt(String(adset.daily_budget ?? '0'), 10);
      if (daily > 0) {
        await updateAdSetDailyBudget(env, adsetId, Math.floor(daily * 0.8));
        console.log('📉 CPA yuqori — kunlik byudjet 20% kamaytirildi.');
      }
    }
  }

  if (roas > env.TARGET_ROAS && pool) {
    try {
      const audiences = await listAudiences(pool);
      const source = audiences.find((a) => a.meta_audience_id);
      if (source?.meta_audience_id) {
        const id = await createLookalikeFromSource(
          env,
          source.meta_audience_id,
          0.01,
          `LAL_${source.name}_${Date.now()}`,
        );
        console.log(`🔁 Lookalike yaratildi: ${id}`);
      } else {
        console.log('Lookalike uchun manba auditoriya topilmadi.');
      }
    } catch (e) {
      console.warn('Lookalike yaratishda xato (sozlama/Geo talab qilishi mumkin):', (e as Error).message);
    }
  }

  if (!pool) return;

  const audiences = await listAudiences(pool);
  for (const a of audiences) {
    if (!a.meta_audience_id) continue;
    const size = await getCustomAudienceApproxSize(env, a.meta_audience_id);
    if (size < env.MIN_AUDIENCE_SIZE) {
      await archiveAudience(pool, a.id);
      console.log(`🗂 ${a.name} juda kichik (${size}) — syncdan olib tashlandi (active=false).`);
    }
  }
}
