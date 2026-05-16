import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ConfigService } from "@nestjs/config";
import {
  createAdSpectrAiClientFromEnv,
  isAiClientConfigured,
} from "@adspectr/ai-sdk";
import type { AdSpectrAiClient } from "@adspectr/ai-sdk";
import { MetaInsight } from "./entities/meta-insight.entity";
import { MetaCampaignSync } from "./entities/meta-campaign-sync.entity";
import { MetaAdAccount } from "./entities/meta-ad-account.entity";

export type AuditSeverity = "critical" | "warning" | "info" | "good";
export type AuditCategory =
  | "spend"
  | "performance"
  | "audience"
  | "creative"
  | "structure"
  | "delivery";

export interface AuditFinding {
  id: string;
  severity: AuditSeverity;
  category: AuditCategory;
  title: string;
  detail: string;
  /** Optional remediation hint. */
  fix?: string;
  /** Optional campaign id this finding refers to. */
  campaignId?: string;
}

export interface AuditCampaignRow {
  id: string;
  name: string;
  status: string;
  objective: string | null;
  adAccountId: string;
  spend: number;
  impressions: number;
  clicks: number;
  conversions: number;
  revenue: number;
  ctr: number;
  cpc: number;
  roas: number;
  /** Per-campaign health score (0–100). */
  health: number;
  flags: string[];
}

export interface MetaAuditDeltas {
  spend: number;
  revenue: number;
  ctr: number;
  cpc: number;
  roas: number;
  conversions: number;
  /** Percent change vs prior period (-100..+inf). null when prior was 0. */
  spendPct: number | null;
  revenuePct: number | null;
  ctrPct: number | null;
  roasPct: number | null;
  conversionsPct: number | null;
}

export interface MetaAuditReport {
  /** Overall account health 0–100. */
  score: number;
  scoreLabel: "excellent" | "good" | "fair" | "poor";
  generatedAt: string;
  windowDays: number;
  totals: {
    spend: number;
    impressions: number;
    clicks: number;
    conversions: number;
    revenue: number;
    avgCtr: number;
    avgCpc: number;
    avgRoas: number;
    activeCampaigns: number;
    pausedCampaigns: number;
    totalCampaigns: number;
  };
  /** Same-shape totals for the period immediately before the audit window. */
  priorTotals: {
    spend: number;
    revenue: number;
    conversions: number;
    avgCtr: number;
    avgCpc: number;
    avgRoas: number;
  };
  deltas: MetaAuditDeltas;
  findings: AuditFinding[];
  campaigns: AuditCampaignRow[];
  spendByObjective: Array<{ objective: string; spend: number; share: number }>;
  topSpenders: AuditCampaignRow[];
  zeroResultCampaigns: AuditCampaignRow[];
  /** Optional AI-generated 2-3 paragraph executive summary (Uzbek). */
  aiSummary: string | null;
}

/**
 * MetaAuditService runs a deterministic 360° audit over the cached
 * MetaInsight / MetaCampaignSync rows for a workspace. No live Meta API
 * calls — everything reads from the sync tables that MetaSyncService
 * already populates, so this stays fast and tenant-isolated.
 *
 * The audit produces:
 *   - Aggregate KPIs (spend, ctr, roas, etc.)
 *   - A flat list of findings (critical / warning / info / good)
 *   - Per-campaign health scores
 *   - Drilldowns (top spenders, zero-result campaigns, spend-by-objective)
 */
@Injectable()
export class MetaAuditService {
  private readonly aiClient: AdSpectrAiClient | null;

  constructor(
    @InjectRepository(MetaInsight)
    private readonly insightRepo: Repository<MetaInsight>,
    @InjectRepository(MetaCampaignSync)
    private readonly campaignRepo: Repository<MetaCampaignSync>,
    @InjectRepository(MetaAdAccount)
    private readonly accountRepo: Repository<MetaAdAccount>,
    private readonly config: ConfigService,
  ) {
    // AI is optional — when no provider key is configured we skip the
    // executive summary and the rest of the audit still works.
    this.aiClient = isAiClientConfigured((k) => this.config.get<string>(k))
      ? createAdSpectrAiClientFromEnv((k) => this.config.get<string>(k))
      : null;
  }

  async runAudit(
    workspaceId: string,
    days = 30,
    options: { withAiSummary?: boolean } = {},
  ): Promise<MetaAuditReport> {
    const since = new Date();
    since.setUTCHours(0, 0, 0, 0);
    since.setUTCDate(since.getUTCDate() - days);
    const priorSince = new Date(since);
    priorSince.setUTCDate(priorSince.getUTCDate() - days);

    // Aggregate per-campaign metrics from cached insights for the current period.
    const insightRows = await this.insightRepo
      .createQueryBuilder("i")
      .where("i.workspaceId = :wid", { wid: workspaceId })
      .andWhere("i.date >= :since", { since })
      .select([
        "i.campaignId AS campaignId",
        'COALESCE(SUM(i.spend), 0) AS "spend"',
        'COALESCE(SUM(i.impressions), 0) AS "impressions"',
        'COALESCE(SUM(i.clicks), 0) AS "clicks"',
        'COALESCE(SUM(i.conversions), 0) AS "conversions"',
        'COALESCE(SUM(i.conversionValue), 0) AS "revenue"',
      ])
      .groupBy("i.campaignId")
      .getRawMany();

    // Workspace-level totals for the prior period (no per-campaign join needed —
    // we only want aggregate deltas to render the period comparison).
    const priorRow = await this.insightRepo
      .createQueryBuilder("i")
      .where("i.workspaceId = :wid", { wid: workspaceId })
      .andWhere("i.date >= :priorSince", { priorSince })
      .andWhere("i.date < :since", { since })
      .select([
        'COALESCE(SUM(i.spend), 0) AS "spend"',
        'COALESCE(SUM(i.impressions), 0) AS "impressions"',
        'COALESCE(SUM(i.clicks), 0) AS "clicks"',
        'COALESCE(SUM(i.conversions), 0) AS "conversions"',
        'COALESCE(SUM(i.conversionValue), 0) AS "revenue"',
      ])
      .getRawOne();
    const prior = {
      spend: parseFloat(priorRow?.spend ?? 0) || 0,
      impressions: parseInt(priorRow?.impressions ?? 0, 10) || 0,
      clicks: parseInt(priorRow?.clicks ?? 0, 10) || 0,
      conversions: parseInt(priorRow?.conversions ?? 0, 10) || 0,
      revenue: parseFloat(priorRow?.revenue ?? 0) || 0,
    };
    const priorCtr =
      prior.impressions > 0 ? (prior.clicks / prior.impressions) * 100 : 0;
    const priorCpc = prior.clicks > 0 ? prior.spend / prior.clicks : 0;
    const priorRoas = prior.spend > 0 ? prior.revenue / prior.spend : 0;

    const byCampaign = new Map<
      string,
      {
        spend: number;
        impressions: number;
        clicks: number;
        conversions: number;
        revenue: number;
      }
    >();
    for (const r of insightRows) {
      byCampaign.set(r.campaignid ?? r.campaignId, {
        spend: parseFloat(r.spend) || 0,
        impressions: parseInt(r.impressions, 10) || 0,
        clicks: parseInt(r.clicks, 10) || 0,
        conversions: parseInt(r.conversions, 10) || 0,
        revenue: parseFloat(r.revenue) || 0,
      });
    }

    const campaignEntities = await this.campaignRepo.find({
      where: { workspaceId },
      order: { name: "ASC" },
    });

    const campaigns: AuditCampaignRow[] = campaignEntities.map((c) => {
      const m = byCampaign.get(c.id) ?? {
        spend: 0,
        impressions: 0,
        clicks: 0,
        conversions: 0,
        revenue: 0,
      };
      const ctr = m.impressions > 0 ? (m.clicks / m.impressions) * 100 : 0;
      const cpc = m.clicks > 0 ? m.spend / m.clicks : 0;
      const roas = m.spend > 0 ? m.revenue / m.spend : 0;
      const flags: string[] = [];

      // Per-campaign quality flags drive both the row's health score and
      // the top-level findings list (see below). Order matters for UI: we
      // surface the most severe issue first.
      if (m.spend > 50 && m.clicks === 0) flags.push("ZERO_CLICKS");
      if (m.spend > 100 && m.conversions === 0) flags.push("ZERO_CONVERSIONS");
      if (ctr > 0 && ctr < 0.5) flags.push("LOW_CTR");
      if (m.spend > 200 && roas > 0 && roas < 1) flags.push("LOSING_ROAS");
      if (c.status === "ACTIVE" && m.spend === 0) flags.push("ACTIVE_NO_SPEND");
      if (m.impressions > 0 && m.clicks > 0 && ctr > 3) flags.push("HIGH_CTR");
      if (roas >= 3) flags.push("HEALTHY_ROAS");

      const health = scoreCampaign({ ctr, roas, spend: m.spend, flags });
      return {
        id: c.id,
        name: c.name,
        status: c.status,
        objective: c.objective,
        adAccountId: c.adAccountId,
        spend: round2(m.spend),
        impressions: m.impressions,
        clicks: m.clicks,
        conversions: m.conversions,
        revenue: round2(m.revenue),
        ctr: round2(ctr),
        cpc: round2(cpc),
        roas: round2(roas),
        health,
        flags,
      };
    });

    // ── Aggregates ────────────────────────────────────────────────────────
    const totals = campaigns.reduce(
      (acc, c) => ({
        spend: acc.spend + c.spend,
        impressions: acc.impressions + c.impressions,
        clicks: acc.clicks + c.clicks,
        conversions: acc.conversions + c.conversions,
        revenue: acc.revenue + c.revenue,
      }),
      { spend: 0, impressions: 0, clicks: 0, conversions: 0, revenue: 0 },
    );
    const avgCtr =
      totals.impressions > 0 ? (totals.clicks / totals.impressions) * 100 : 0;
    const avgCpc = totals.clicks > 0 ? totals.spend / totals.clicks : 0;
    const avgRoas = totals.spend > 0 ? totals.revenue / totals.spend : 0;
    const activeCount = campaigns.filter((c) => c.status === "ACTIVE").length;
    const pausedCount = campaigns.filter((c) => c.status === "PAUSED").length;

    // ── Findings ──────────────────────────────────────────────────────────
    const findings: AuditFinding[] = [];

    // 1. Spend concentration (Pareto: one campaign eating most of the budget)
    if (totals.spend > 0) {
      const sorted = [...campaigns].sort((a, b) => b.spend - a.spend);
      const top = sorted[0];
      if (top && top.spend / totals.spend >= 0.6) {
        findings.push({
          id: "spend_concentration",
          severity: "warning",
          category: "spend",
          title: `Bitta kampaniya byudjetning ${Math.round((top.spend / totals.spend) * 100)}%'ini egallaydi`,
          detail: `"${top.name}" — $${top.spend.toFixed(0)} sarflandi. Bu Pareto siljishi: bitta variant to'xtasa, butun hisob to'xtaydi.`,
          fix: "Byudjetni 2-3 ta kampaniyaga taqsimlang. Yangi creative va audience'larni sinab ko'ring.",
          campaignId: top.id,
        });
      }
    }

    // 2. Zero-spend ACTIVE campaigns (delivery problem)
    const stalled = campaigns.filter((c) => c.flags.includes("ACTIVE_NO_SPEND"));
    if (stalled.length > 0) {
      findings.push({
        id: "active_no_spend",
        severity: "critical",
        category: "delivery",
        title: `${stalled.length} ta ACTIVE kampaniya umuman sarflamadi`,
        detail: `Quyidagi kampaniyalar yoqilgan, lekin Meta ularni yetkazib bermayapti: ${stalled
          .slice(0, 3)
          .map((c) => `"${c.name}"`)
          .join(", ")}${stalled.length > 3 ? ` +${stalled.length - 3}` : ""}.`,
        fix: "Audience hajmi yetarli emas, byudjet juda past yoki creative rejected bo'lishi mumkin. Ad Account → Delivery Status'ni tekshiring.",
      });
    }

    // 3. Zero-click expensive campaigns
    const zeroClick = campaigns.filter((c) => c.flags.includes("ZERO_CLICKS"));
    if (zeroClick.length > 0) {
      findings.push({
        id: "zero_clicks",
        severity: "critical",
        category: "performance",
        title: `${zeroClick.length} ta kampaniya $50+ sarflagan, lekin 0 click`,
        detail: zeroClick
          .slice(0, 3)
          .map((c) => `"${c.name}" ($${c.spend.toFixed(0)})`)
          .join(", "),
        fix: "Creative yangi auditoriyaga rezonans bermayapti. Hook va offer'ni qayta ishlang yoki to'xtating.",
      });
    }

    // 4. Zero-conversion big spenders
    const noConv = campaigns.filter((c) => c.flags.includes("ZERO_CONVERSIONS"));
    if (noConv.length > 0) {
      findings.push({
        id: "zero_conversions",
        severity: "critical",
        category: "performance",
        title: `${noConv.length} ta kampaniya $100+ sarflab, hech qanday konversiyaga olib kelmadi`,
        detail: noConv
          .slice(0, 3)
          .map((c) => `"${c.name}" — $${c.spend.toFixed(0)}`)
          .join(", "),
        fix: "Landing page, oferta yoki targeting nomos. Pixel hodisalari to'g'ri ishlayotganini tekshiring.",
      });
    }

    // 5. Low CTR campaigns (below 0.5%)
    const lowCtr = campaigns.filter((c) => c.flags.includes("LOW_CTR"));
    if (lowCtr.length >= 3) {
      findings.push({
        id: "low_ctr",
        severity: "warning",
        category: "creative",
        title: `${lowCtr.length} ta kampaniya CTR < 0.5%`,
        detail: "Bu Meta benchmark'idan past. Yetkazib berish narxi oshib ketadi.",
        fix: "Yangi hook'larni sinab ko'ring: video, UGC, before/after, mijoz odd-savol. Top reklamalardan boshlang.",
      });
    }

    // 6. Losing ROAS (spending much, returning little)
    const losing = campaigns.filter((c) => c.flags.includes("LOSING_ROAS"));
    if (losing.length > 0) {
      const lossSpend = losing.reduce((s, c) => s + c.spend, 0);
      findings.push({
        id: "losing_roas",
        severity: "critical",
        category: "performance",
        title: `${losing.length} ta kampaniya zarar keltirayapti (ROAS < 1)`,
        detail: `Jami ${lossSpend.toFixed(0)} $ sarflandi, daromad esa kamroq. Bu sof yo'qotish.`,
        fix: "Bu kampaniyalarni to'xtatib, byudjetni ROAS ≥ 3 bo'lganlarga ko'chiring.",
      });
    }

    // 7. Account structure: no diversity
    if (campaigns.length === 1 && totals.spend > 100) {
      findings.push({
        id: "single_campaign",
        severity: "warning",
        category: "structure",
        title: "Hisobda atigi 1 ta kampaniya bor",
        detail: "Meta algoritmi A/B test qiladigan boshqa variantsiz optimallasha olmaydi.",
        fix: "Hech bo'lmaganda 2-3 ta kampaniya: prospecting + retargeting + retention.",
      });
    }

    // 8. Active campaigns count
    if (activeCount === 0 && totals.spend === 0) {
      findings.push({
        id: "no_active",
        severity: "info",
        category: "structure",
        title: "Aktiv kampaniya yo'q",
        detail: "Hisob hozir hech narsa sarflamayapti.",
        fix: "Ad Launcher orqali kampaniya yarating yoki PAUSED bo'lganlarni yoqing.",
      });
    }

    // 9. Healthy ROAS — surface as a positive finding too
    const winners = campaigns.filter((c) => c.flags.includes("HEALTHY_ROAS"));
    if (winners.length > 0) {
      findings.push({
        id: "healthy_winners",
        severity: "good",
        category: "performance",
        title: `${winners.length} ta kampaniyada ROAS ≥ 3 — masshtablashga tayyor`,
        detail: winners
          .slice(0, 3)
          .map((c) => `"${c.name}" (ROAS ${c.roas.toFixed(2)}x)`)
          .join(", "),
        fix: "Bu kampaniyalarga byudjet qo'shing (haftada +20% qadam). Creative'larini yangi audience'larda sinab ko'ring.",
      });
    }

    // 10. Overall benchmark warning
    if (totals.spend > 100 && avgCtr > 0 && avgCtr < 0.8) {
      findings.push({
        id: "low_avg_ctr",
        severity: "warning",
        category: "creative",
        title: `Account o'rtacha CTR ${avgCtr.toFixed(2)}% — Meta benchmark 1-2%`,
        detail: "Creative sifati pasaymoqda yoki audience charchagan.",
        fix: "Top Ads sahifasida eng yaxshi ishlayotgan reklamalarni ko'ring, ularning hook'ini qayta ishlatish uchun.",
      });
    }

    // ── Aggregations for drilldowns ──────────────────────────────────────
    const objectiveMap = new Map<string, number>();
    for (const c of campaigns) {
      const key = c.objective ?? "UNKNOWN";
      objectiveMap.set(key, (objectiveMap.get(key) ?? 0) + c.spend);
    }
    const spendByObjective = Array.from(objectiveMap.entries())
      .map(([objective, spend]) => ({
        objective,
        spend: round2(spend),
        share: totals.spend > 0 ? round2((spend / totals.spend) * 100) : 0,
      }))
      .sort((a, b) => b.spend - a.spend);

    const topSpenders = [...campaigns].sort((a, b) => b.spend - a.spend).slice(0, 5);
    const zeroResultCampaigns = campaigns.filter(
      (c) =>
        c.flags.includes("ZERO_CLICKS") ||
        c.flags.includes("ZERO_CONVERSIONS") ||
        c.flags.includes("LOSING_ROAS"),
    );

    const score = computeOverallScore(findings, campaigns);

    const deltas: MetaAuditDeltas = {
      spend: round2(totals.spend - prior.spend),
      revenue: round2(totals.revenue - prior.revenue),
      ctr: round2(avgCtr - priorCtr),
      cpc: round2(avgCpc - priorCpc),
      roas: round2(avgRoas - priorRoas),
      conversions: totals.conversions - prior.conversions,
      spendPct: pctDelta(totals.spend, prior.spend),
      revenuePct: pctDelta(totals.revenue, prior.revenue),
      ctrPct: pctDelta(avgCtr, priorCtr),
      roasPct: pctDelta(avgRoas, priorRoas),
      conversionsPct: pctDelta(totals.conversions, prior.conversions),
    };

    const report: MetaAuditReport = {
      score,
      scoreLabel:
        score >= 85 ? "excellent" : score >= 70 ? "good" : score >= 50 ? "fair" : "poor",
      generatedAt: new Date().toISOString(),
      windowDays: days,
      totals: {
        spend: round2(totals.spend),
        impressions: totals.impressions,
        clicks: totals.clicks,
        conversions: totals.conversions,
        revenue: round2(totals.revenue),
        avgCtr: round2(avgCtr),
        avgCpc: round2(avgCpc),
        avgRoas: round2(avgRoas),
        activeCampaigns: activeCount,
        pausedCampaigns: pausedCount,
        totalCampaigns: campaigns.length,
      },
      priorTotals: {
        spend: round2(prior.spend),
        revenue: round2(prior.revenue),
        conversions: prior.conversions,
        avgCtr: round2(priorCtr),
        avgCpc: round2(priorCpc),
        avgRoas: round2(priorRoas),
      },
      deltas,
      findings,
      campaigns,
      spendByObjective,
      topSpenders,
      zeroResultCampaigns,
      aiSummary: null,
    };

    if (options.withAiSummary && this.aiClient && campaigns.length > 0) {
      try {
        report.aiSummary = await this.generateAiSummary(report);
      } catch {
        // Non-fatal: an AI summary failure should never break the audit.
      }
    }

    return report;
  }

  private async generateAiSummary(report: MetaAuditReport): Promise<string> {
    if (!this.aiClient) return "";
    const { totals, deltas, score, findings, topSpenders } = report;
    const topCrit = findings.filter((f) => f.severity === "critical").slice(0, 3);
    const topWins = findings.filter((f) => f.severity === "good").slice(0, 2);

    const briefing = [
      `Account health score: ${score}/100 (${report.scoreLabel}).`,
      `Period: ${report.windowDays} days. Spend $${totals.spend.toFixed(0)}, revenue $${totals.revenue.toFixed(0)}, ROAS ${totals.avgRoas.toFixed(2)}x, ${totals.conversions} conversions.`,
      deltas.spendPct != null
        ? `Vs prior ${report.windowDays}d: spend ${signed(deltas.spendPct)}%, revenue ${signed(deltas.revenuePct ?? 0)}%, ROAS ${signed(deltas.roasPct ?? 0)}%.`
        : "",
      topSpenders[0]
        ? `Top spender: "${topSpenders[0].name}" — $${topSpenders[0].spend.toFixed(0)}, ROAS ${topSpenders[0].roas.toFixed(2)}x.`
        : "",
      topCrit.length > 0
        ? `Critical issues: ${topCrit.map((f) => f.title).join("; ")}.`
        : "",
      topWins.length > 0
        ? `Wins: ${topWins.map((f) => f.title).join("; ")}.`
        : "",
    ]
      .filter(Boolean)
      .join("\n");

    const systemPrompt = `You are AdSpectr, a senior Meta Ads strategist.
Write a 2-3 paragraph Uzbek-language executive summary of the account audit below.
Be specific: cite the numbers and named campaigns from the briefing.
Open with the headline takeaway, then the two most important actions to take this week.
Avoid filler. No greetings, no headings, just plain paragraphs.`;

    const result = await this.aiClient.complete(briefing, systemPrompt, {
      taskType: "chat",
      agentName: "MetaAudit",
      temperature: 0.5,
      maxTokens: 450,
    });
    return result.content.trim();
  }
}

function signed(n: number): string {
  return n >= 0 ? `+${n.toFixed(0)}` : `${n.toFixed(0)}`;
}

function pctDelta(current: number, prior: number): number | null {
  if (!isFinite(prior) || prior === 0) return null;
  return round2(((current - prior) / prior) * 100);
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function scoreCampaign(params: {
  ctr: number;
  roas: number;
  spend: number;
  flags: string[];
}): number {
  let score = 70;
  if (params.flags.includes("HEALTHY_ROAS")) score += 20;
  if (params.flags.includes("HIGH_CTR")) score += 10;
  if (params.flags.includes("LOW_CTR")) score -= 15;
  if (params.flags.includes("ZERO_CLICKS")) score -= 35;
  if (params.flags.includes("ZERO_CONVERSIONS")) score -= 25;
  if (params.flags.includes("LOSING_ROAS")) score -= 30;
  if (params.flags.includes("ACTIVE_NO_SPEND")) score -= 20;
  return Math.max(0, Math.min(100, score));
}

function computeOverallScore(
  findings: AuditFinding[],
  campaigns: AuditCampaignRow[],
): number {
  if (campaigns.length === 0) return 0;
  let score = 80;
  for (const f of findings) {
    if (f.severity === "critical") score -= 12;
    else if (f.severity === "warning") score -= 5;
    else if (f.severity === "good") score += 3;
  }
  // Weight by average per-campaign health
  const avgHealth =
    campaigns.reduce((s, c) => s + c.health, 0) / campaigns.length;
  score = score * 0.6 + avgHealth * 0.4;
  return Math.max(0, Math.min(100, Math.round(score)));
}
