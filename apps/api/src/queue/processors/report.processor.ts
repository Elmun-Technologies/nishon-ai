import { Processor, Process, OnQueueFailed } from "@nestjs/bull";
import { Logger } from "@nestjs/common";
import { Job } from "bull";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, MoreThanOrEqual } from "typeorm";
import { ConfigService } from "@nestjs/config";
import { Workspace } from "../../workspaces/entities/workspace.entity";
import { AiDecision } from "../../ai-decisions/entities/ai-decision.entity";
import { PerformanceMetric } from "../../analytics/entities/performance-metric.entity";
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
    @InjectRepository(PerformanceMetric)
    private readonly metricRepo: Repository<PerformanceMetric>,
    private readonly config: ConfigService,
  ) {}

  @Process("send-daily-report")
  async handleDailyReport(job: Job<ReportJobData>): Promise<void> {
    const { workspaceId } = job.data;

    const workspace = await this.workspaceRepo.findOne({
      where: { id: workspaceId },
      relations: ["campaigns"],
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
    // Yesterday's date range
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Aggregate yesterday's metrics across all ads in this workspace
    const metricsRaw = await this.metricRepo
      .createQueryBuilder("m")
      .innerJoin("m.ad", "ad")
      .innerJoin("ad.adSet", "adSet")
      .innerJoin("adSet.campaign", "campaign")
      .where("campaign.workspaceId = :wid", { wid: workspace.id })
      .andWhere("m.recordedAt >= :yesterday", { yesterday })
      .andWhere("m.recordedAt < :today", { today })
      .select([
        "COALESCE(SUM(m.spend), 0) AS spend",
        "COALESCE(SUM(m.conversions), 0) AS conversions",
        "COALESCE(SUM(m.revenue), 0) AS revenue",
      ])
      .getRawOne();

    const totalSpend = parseFloat(metricsRaw?.spend ?? "0") || 0;
    const totalRevenue = parseFloat(metricsRaw?.revenue ?? "0") || 0;
    const totalConversions = parseInt(metricsRaw?.conversions ?? "0") || 0;
    const roas = totalSpend > 0 ? totalRevenue / totalSpend : 0;

    // Count AI decisions made since midnight today
    const aiDecisionsToday = await this.decisionRepo.count({
      where: {
        workspaceId: workspace.id,
        createdAt: MoreThanOrEqual(today),
      },
    });

    // Find best performing ad by ROAS yesterday
    const topAdRaw = await this.metricRepo
      .createQueryBuilder("m")
      .innerJoin("m.ad", "ad")
      .innerJoin("ad.adSet", "adSet")
      .innerJoin("adSet.campaign", "campaign")
      .where("campaign.workspaceId = :wid", { wid: workspace.id })
      .andWhere("m.recordedAt >= :yesterday", { yesterday })
      .andWhere("m.recordedAt < :today", { today })
      .andWhere("m.spend > 0")
      .select(["ad.name AS adName", "m.roas AS roas"])
      .orderBy("m.roas", "DESC")
      .limit(1)
      .getRawOne();

    return {
      workspaceName: workspace.name,
      date: yesterday.toLocaleDateString("uz-UZ"),
      totalSpend,
      totalRevenue,
      totalConversions,
      roas,
      activeCampaigns:
        workspace.campaigns?.filter((c) => c.status === "active").length || 0,
      aiDecisionsToday,
      topAdName: topAdRaw?.adName ?? null,
    };
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
        throw new Error(`Telegram API error: ${response.status} — ${errorBody}`);
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

    return `
<b>📊 AdSpectr — Kunlik Hisobot</b>
<b>${data.workspaceName}</b> | ${data.date}

💰 <b>Sarflandi:</b> ${spendFormatted}
💵 <b>Daromad:</b> ${revenueFormatted}
${roasEmoji} <b>ROAS:</b> ${data.roas.toFixed(2)}x
🎯 <b>Leadlar:</b> ${data.totalConversions} ta
📢 <b>Aktiv kampaniyalar:</b> ${data.activeCampaigns} ta

🤖 <b>AI bugun:</b> ${data.aiDecisionsToday} ta qaror qabul qildi
${data.topAdName ? `🔥 <b>Eng yaxshi reklama:</b> "${data.topAdName}"` : ""}

<i>Batafsil: adspectr.com/dashboard</i>
    `.trim();
  }

  @OnQueueFailed()
  onFailed(job: Job, error: Error): void {
    this.logger.error(
      `Report job failed for workspace ${job.data.workspaceId}: ${error.message}`,
    );
  }
}
