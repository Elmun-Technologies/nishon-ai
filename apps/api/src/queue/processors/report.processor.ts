import { Processor, Process, OnQueueFailed } from "@nestjs/bull";
import { Logger } from "@nestjs/common";
import { Job } from "bull";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, MoreThanOrEqual } from "typeorm";
import { ConfigService } from "@nestjs/config";
import { Workspace } from "../../workspaces/entities/workspace.entity";
import { AiDecision } from "../../ai-decisions/entities/ai-decision.entity";
import { MetaCampaignSync } from "../../meta/entities/meta-campaign-sync.entity";
import { MetaInsight } from "../../meta/entities/meta-insight.entity";
import { QUEUE_NAMES } from "../queue.constants";

interface ReportJobData {
  workspaceId: string;
}

interface ReportData {
  workspaceName: string;
  date: string;
  totalSpend: number;
  totalRevenue: number;
  totalConversions: number;
  roas: number;
  activeCampaigns: number;
  aiDecisionsToday: number;
  topAdName: string | null;
  // What the agent actually did overnight + what needs the owner's approval.
  agentExecuted: number;
  agentPending: number;
  pendingHighlights: string[];
  projectedImpactUsd: number;
}

/**
 * ReportProcessor generates and sends daily performance reports via Telegram.
 *
 * Every morning at 9 AM, each workspace owner receives a message like:
 *
 * 📊 AdSpectr — Kunlik Hisobot
 * 💰 Kecha sarflandi: $45.20
 * 🎯 Leadlar: 12 ta
 * 📈 ROAS: 3.2x
 * ✅ AI 3 ta qaror qabul qildi
 * 🔥 Eng yaxshi reklama: "Maxsus taklif — 30% chegirma"
 *
 * This keeps users informed even if they never open the dashboard.
 * In CIS markets, Telegram is the primary communication channel — not email.
 */
@Processor(QUEUE_NAMES.REPORTS)
export class ReportProcessor {
  private readonly logger = new Logger(ReportProcessor.name);

  constructor(
    @InjectRepository(Workspace)
    private readonly workspaceRepo: Repository<Workspace>,
    @InjectRepository(AiDecision)
    private readonly decisionRepo: Repository<AiDecision>,
    @InjectRepository(MetaCampaignSync)
    private readonly metaCampaignRepo: Repository<MetaCampaignSync>,
    @InjectRepository(MetaInsight)
    private readonly metaInsightRepo: Repository<MetaInsight>,
    private readonly config: ConfigService,
  ) {}

  @Process("send-daily-report")
  async handleDailyReport(job: Job<ReportJobData>): Promise<void> {
    const { workspaceId } = job.data;

    const workspace = await this.workspaceRepo.findOne({
      where: { id: workspaceId },
    });

    if (!workspace) return;

    const botToken = this.config.get<string>("TELEGRAM_BOT_TOKEN");
    const chatId = workspace.telegramChatId;

    if (!botToken || !chatId) {
      this.logger.log(
        `Telegram not configured for workspace ${workspaceId} — skipping report`,
      );
      return;
    }

    const reportData = await this.buildReportData(workspace);
    await this.sendTelegramMessage(botToken, chatId, reportData);
  }

  private async buildReportData(workspace: Workspace): Promise<ReportData> {
    // Yesterday's date, as a YYYY-MM-DD string — meta_insights.date is a DATE
    // column keyed on the ad account's day, so we match on the date, not a
    // JS timestamp range (which drifts with server timezone).
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yDate = yesterday.toISOString().slice(0, 10);
    const dayStart = new Date();
    dayStart.setDate(dayStart.getDate() - 1);
    dayStart.setHours(0, 0, 0, 0);

    // Aggregate yesterday's Meta insights (the real synced data). This replaces
    // the old read of the seed-only performance_metrics chain, which is empty
    // for real accounts.
    const metricsRaw = await this.metaInsightRepo
      .createQueryBuilder("insight")
      .where("insight.workspaceId = :wid", { wid: workspace.id })
      .andWhere("insight.date = :d", { d: yDate })
      .select([
        'COALESCE(SUM(insight.spend), 0) AS "spend"',
        'COALESCE(SUM(insight.conversions), 0) AS "conversions"',
        'COALESCE(SUM(insight.conversionValue), 0) AS "revenue"',
      ])
      .getRawOne<{ spend: string; conversions: string; revenue: string }>();

    const totalSpend = parseFloat(metricsRaw?.spend ?? "0") || 0;
    const totalRevenue = parseFloat(metricsRaw?.revenue ?? "0") || 0;
    const totalConversions = parseInt(metricsRaw?.conversions ?? "0", 10) || 0;
    const roas = totalSpend > 0 ? totalRevenue / totalSpend : 0;

    // Active campaigns from the Meta sync table.
    const activeCampaigns = await this.metaCampaignRepo.count({
      where: { workspaceId: workspace.id, status: "ACTIVE" },
    });

    // Top campaign yesterday by spend, with its human name.
    const topRaw = await this.metaInsightRepo
      .createQueryBuilder("insight")
      .leftJoin(
        MetaCampaignSync,
        "campaign",
        "campaign.id = insight.campaignId",
      )
      .where("insight.workspaceId = :wid", { wid: workspace.id })
      .andWhere("insight.date = :d", { d: yDate })
      .andWhere("insight.spend > 0")
      .select(['campaign.name AS "name"', "insight.spend AS spend"])
      .orderBy("insight.spend", "DESC")
      .limit(1)
      .getRawOne<{ name: string | null; spend: string }>();

    // The agent's overnight work: decisions from the last 24h, split into what
    // was auto-applied vs what is waiting for the owner to approve.
    const recentDecisions = await this.decisionRepo.find({
      where: {
        workspaceId: workspace.id,
        createdAt: MoreThanOrEqual(dayStart),
      },
      order: { createdAt: "DESC" },
    });

    const agentExecuted = recentDecisions.filter((d) => d.isExecuted).length;
    const pending = recentDecisions.filter(
      (d) => d.isApproved === null && !d.isExecuted,
    );
    const pendingHighlights = pending
      .slice(0, 2)
      .map((d) => this.shortReason(d.reason));
    const projectedImpactUsd = recentDecisions.reduce(
      (sum, d) => sum + (Number(d.impactUsd) || 0),
      0,
    );

    return {
      workspaceName: workspace.name,
      date: yesterday.toLocaleDateString("uz-UZ"),
      totalSpend,
      totalRevenue,
      totalConversions,
      roas,
      activeCampaigns,
      aiDecisionsToday: recentDecisions.length,
      topAdName: topRaw?.name ?? null,
      agentExecuted,
      agentPending: pending.length,
      pendingHighlights,
      projectedImpactUsd,
    };
  }

  /** Trim a decision's reason to one scannable line for the Telegram digest. */
  private shortReason(reason: string): string {
    const firstLine = (reason || "").split(/[.\n]/)[0].trim();
    if (!firstLine) return "AI tavsiya";
    return firstLine.length > 90 ? `${firstLine.slice(0, 87)}…` : firstLine;
  }

  /**
   * Build and send a beautifully formatted Telegram message.
   * We use emoji heavily — this is standard in CIS market messaging.
   * The message is kept short and scannable — people read it on mobile.
   */
  private async sendTelegramMessage(
    botToken: string,
    chatId: string,
    data: ReportData,
  ): Promise<void> {
    const message = this.buildTelegramMessage(data);
    const telegramApiUrl = `https://api.telegram.org/bot${botToken}/sendMessage`;

    try {
      const response = await fetch(telegramApiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text: message,
          parse_mode: "HTML",
        }),
      });

      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(
          `Telegram API error: ${response.status} — ${errorBody}`,
        );
      }

      this.logger.log(
        `Daily report sent to Telegram for workspace: ${data.workspaceName}`,
      );
    } catch (error) {
      this.logger.error(`Failed to send Telegram report: ${error.message}`);
      throw error; // Let Bull retry the job
    }
  }

  private buildTelegramMessage(data: ReportData): string {
    const roasEmoji = data.roas >= 3 ? "🚀" : data.roas >= 1 ? "📈" : "⚠️";
    const spendFormatted = `$${data.totalSpend.toFixed(2)}`;
    const revenueFormatted = `$${data.totalRevenue.toFixed(2)}`;

    // Narrative of what the agent did overnight — the Trust surface. Only shown
    // when the agent actually did or proposed something.
    const agentLines: string[] = [];
    if (data.agentExecuted > 0) {
      agentLines.push(
        `✅ <b>${data.agentExecuted} ta</b> amalni avtomatik bajardi`,
      );
    }
    if (data.agentPending > 0) {
      agentLines.push(
        `⏳ <b>${data.agentPending} ta</b> tavsiya tasdiqingizni kutmoqda:`,
      );
      for (const h of data.pendingHighlights) {
        agentLines.push(`   • ${h}`);
      }
    }
    if (data.agentExecuted === 0 && data.agentPending === 0) {
      agentLines.push("😴 Bugun aralashuv shart bo'lmadi — hammasi joyida");
    }
    if (data.projectedImpactUsd > 0) {
      agentLines.push(
        `💡 <b>Taxminiy samara:</b> ~$${Math.round(data.projectedImpactUsd)}`,
      );
    }

    const ctaLine =
      data.agentPending > 0
        ? "<i>👉 Tasdiqlash: adspectr.com/ai-decisions</i>"
        : "<i>Batafsil: adspectr.com/dashboard</i>";

    return `
<b>📊 AdSpectr — Kunlik Hisobot</b>
<b>${data.workspaceName}</b> | ${data.date}

💰 <b>Sarflandi:</b> ${spendFormatted}
💵 <b>Daromad:</b> ${revenueFormatted}
${roasEmoji} <b>ROAS:</b> ${data.roas.toFixed(2)}x
🎯 <b>Konversiyalar:</b> ${data.totalConversions} ta
📢 <b>Aktiv kampaniyalar:</b> ${data.activeCampaigns} ta
${data.topAdName ? `🔥 <b>Eng yaxshi kampaniya:</b> "${data.topAdName}"` : ""}

🤖 <b>Agent kecha:</b>
${agentLines.join("\n")}

${ctaLine}
    `.trim();
  }

  @OnQueueFailed()
  onFailed(job: Job, error: Error): void {
    this.logger.error(
      `Report job failed for workspace ${job.data.workspaceId}: ${error.message}`,
    );
  }
}
