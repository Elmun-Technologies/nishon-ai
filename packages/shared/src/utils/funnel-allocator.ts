/**
 * Funnel budget allocator — canonical backend copy of the autonomous AI agent's
 * media plan. Given a total budget and a business goal, distribute spend across
 * the three marketing-funnel stages and, within each stage, across the channels
 * that fit that goal:
 *
 *   TOFU — Top of Funnel    (cold audience / reach)
 *   MOFU — Middle of Funnel (consideration / engaged)
 *   BOFU — Bottom of Funnel (retargeting / conversion)
 *
 * Goal-specific plan (stage % + channels):
 *
 *   Sales  → TOFU 30% (Meta · TikTok) · MOFU 40% (Google · Telegram) · BOFU 30% (Retargeting)
 *   Brand  → TOFU 60% (Meta · YouTube) · MOFU 30% (Influencers · Telegram) · BOFU 10% (Search)
 *
 * Within a stage the budget splits evenly across its channels. Pure and
 * deterministic so it can be unit-tested and reused across web + api.
 *
 * NOTE: the web dashboard keeps a presentational mirror of this logic at
 * `apps/web/src/lib/funnel-allocator.ts` (adds chart hex/labels). Keep the
 * PLAN percentages in sync between the two — this file is the source of truth
 * the backend acts on.
 */

export type AgentGoal = "sales" | "brand";

export type FunnelStage = "TOFU" | "MOFU" | "BOFU";

export type Channel =
  | "meta"
  | "tiktok"
  | "google"
  | "telegram"
  | "youtube"
  | "influencers"
  | "search"
  | "retargeting";

export const CHANNEL_LABELS: Record<Channel, string> = {
  meta: "Meta",
  tiktok: "TikTok",
  google: "Google",
  telegram: "Telegram",
  youtube: "YouTube",
  influencers: "Influencers",
  search: "Search",
  retargeting: "Retargeting",
};

export const STAGE_LABELS: Record<FunnelStage, string> = {
  TOFU: "Top of Funnel — cold audience",
  MOFU: "Middle of Funnel — consideration",
  BOFU: "Bottom of Funnel — retargeting",
};

interface StagePlan {
  pct: number;
  channels: Channel[];
}

/** The goal-specific media plan. Each goal's stage percentages sum to 100. */
const PLAN: Record<AgentGoal, Record<FunnelStage, StagePlan>> = {
  sales: {
    TOFU: { pct: 30, channels: ["meta", "tiktok"] },
    MOFU: { pct: 40, channels: ["google", "telegram"] },
    BOFU: { pct: 30, channels: ["retargeting"] },
  },
  brand: {
    TOFU: { pct: 60, channels: ["meta", "youtube"] },
    MOFU: { pct: 30, channels: ["influencers", "telegram"] },
    BOFU: { pct: 10, channels: ["search"] },
  },
};

const STAGE_ORDER: FunnelStage[] = ["TOFU", "MOFU", "BOFU"];

export interface ChannelSlice {
  channel: Channel;
  label: string;
  amount: number;
}

export interface StageAllocation {
  stage: FunnelStage;
  label: string;
  /** Percent of the *total* budget (0-100). */
  pct: number;
  amount: number;
  channels: ChannelSlice[];
}

export interface ChannelTotal {
  channel: Channel;
  label: string;
  amount: number;
  /** Percent of the *total* budget (0-100). */
  pct: number;
}

export interface FunnelAllocation {
  goal: AgentGoal;
  totalBudget: number;
  stages: StageAllocation[];
  byChannel: ChannelTotal[];
}

/** Round to whole units, then fix rounding drift onto the largest bucket. */
function distributeRounded(total: number, weights: number[]): number[] {
  const weightSum = weights.reduce((a, b) => a + b, 0);
  if (weightSum <= 0 || total <= 0) return weights.map(() => 0);
  const rounded = weights.map((w) => Math.round((w / weightSum) * total));
  const drift = total - rounded.reduce((a, b) => a + b, 0);
  if (drift !== 0) {
    let largest = 0;
    for (let i = 1; i < rounded.length; i += 1) {
      if (rounded[i] > rounded[largest]) largest = i;
    }
    rounded[largest] += drift;
  }
  return rounded;
}

/** Normalize any legacy/unknown goal (e.g. stored "awareness") to a valid goal. */
export function normalizeGoal(goal: string | undefined | null): AgentGoal {
  return goal === "brand" || goal === "awareness" ? "brand" : "sales";
}

/**
 * Allocate a total budget across funnel stages and channels for a goal.
 * Amounts are integers and reconcile exactly to `totalBudget` at every level.
 */
export function allocateFunnelBudget(opts: {
  goal: AgentGoal;
  totalBudget: number;
}): FunnelAllocation {
  const goal = opts.goal;
  const totalBudget = Math.max(0, Math.round(opts.totalBudget || 0));
  const plan = PLAN[goal];

  const stageAmounts = distributeRounded(
    totalBudget,
    STAGE_ORDER.map((s) => plan[s].pct),
  );

  const channelTotals = new Map<Channel, number>();

  const stages: StageAllocation[] = STAGE_ORDER.map((stage, i) => {
    const amount = stageAmounts[i];
    const chans = plan[stage].channels;
    const chanAmounts = distributeRounded(
      amount,
      chans.map(() => 1),
    );
    const channels: ChannelSlice[] = chans.map((channel, j) => {
      channelTotals.set(
        channel,
        (channelTotals.get(channel) ?? 0) + chanAmounts[j],
      );
      return {
        channel,
        label: CHANNEL_LABELS[channel],
        amount: chanAmounts[j],
      };
    });
    return {
      stage,
      label: STAGE_LABELS[stage],
      pct: plan[stage].pct,
      amount,
      channels,
    };
  });

  const byChannel: ChannelTotal[] = [...channelTotals.entries()].map(
    ([channel, amount]) => ({
      channel,
      label: CHANNEL_LABELS[channel],
      amount,
      pct: totalBudget > 0 ? Math.round((amount / totalBudget) * 100) : 0,
    }),
  );

  return { goal, totalBudget, stages, byChannel };
}
