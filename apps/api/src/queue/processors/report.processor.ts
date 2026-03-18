import { Processor, Process, OnQueueFailed } from "@nestjs/bull";
import { Logger } from "@nestjs/common";
import { Job } from "bull";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ConfigService } from "@nestjs/config";
import { Workspace } from "../../workspaces/entities/workspace.entity";
import { QUEUE_NAMES } from "../queue.constants";

interface ReportJobData {
  workspaceId: string;
}

/**
 * ReportProcessor generates and sends daily performance reports via Telegram.
 *
 * Every morning at 9 AM, each workspace owner receives a message like:
 *
 * 📊 Nishon AI — Kunlik Hisobot
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

    // TODO: Get actual yesterday's metrics from analytics service
    // For now we build the report structure — metrics will come from analytics module
    const reportData = await this.buildReportData(workspace);

    // Send to Telegram if bot token and chat ID are configured
    const botToken = this.config.get<string>("TELEGRAM_BOT_TOKEN");
    const chatId = (workspace as any).telegramChatId;

    if (botToken && chatId) {
      await this.sendTelegramMessage(botToken, chatId, reportData);
    } else {
      this.logger.log(
        `Telegram not configured for workspace ${workspaceId} — skipping report`,
      );
    }
  }

  private async buildReportData(workspace: Workspace) {
    // TODO: Replace with real metrics from PerformanceMetric entity
    return {
      workspaceName: workspace.name,
      date: new Date().toLocaleDateString("uz-UZ"),
      totalSpend: 0,
      totalLeads: 0,
      totalRevenue: 0,
      roas: 0,
      activeCampaigns:
        workspace.campaigns?.filter((c) => c.status === "active").length || 0,
      aiDecisionsToday: 0,
      topAdName: null,
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
    data: any,
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
        throw new Error(`Telegram API error: ${response.status}`);
      }

      this.logger.log(
        `Daily report sent to Telegram for workspace: ${data.workspaceName}`,
      );
    } catch (error) {
      this.logger.error(`Failed to send Telegram report: ${error.message}`);
      throw error; // Let Bull retry the job
    }
  }

  private buildTelegramMessage(data: any): string {
    const roasEmoji = data.roas >= 3 ? "🚀" : data.roas >= 1 ? "📈" : "⚠️";
    const spendFormatted = `$${Number(data.totalSpend).toFixed(2)}`;
    const revenueFormatted = `$${Number(data.totalRevenue).toFixed(2)}`;

    return `
<b>📊 Nishon AI — Kunlik Hisobot</b>
<b>${data.workspaceName}</b> | ${data.date}

💰 <b>Sarflandi:</b> ${spendFormatted}
💵 <b>Daromad:</b> ${revenueFormatted}
${roasEmoji} <b>ROAS:</b> ${Number(data.roas).toFixed(2)}x
🎯 <b>Leadlar:</b> ${data.totalLeads} ta
📢 <b>Aktiv kampaniyalar:</b> ${data.activeCampaigns} ta

🤖 <b>AI bugun:</b> ${data.aiDecisionsToday} ta qaror qabul qildi
${data.topAdName ? `🔥 <b>Eng yaxshi reklama:</b> "${data.topAdName}"` : ""}

<i>Batafsil: nishon.ai/dashboard</i>
    `.trim();
  }

  @OnQueueFailed()
  onFailed(job: Job, error: Error): void {
    this.logger.error(
      `Report job failed for workspace ${job.data.workspaceId}: ${error.message}`,
    );
  }
}
