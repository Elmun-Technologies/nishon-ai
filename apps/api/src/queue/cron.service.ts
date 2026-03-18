import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import { QueueService } from "./queue.service";

/**
 * CronService defines all scheduled tasks in the system.
 *
 * Think of this as the "alarm clock" — it wakes up at set times
 * and tells the QueueService to schedule work.
 *
 * Why separate cron from the actual work?
 * Because cron just schedules — the heavy work happens in processors.
 * If a processor fails, Bull retries it automatically.
 * If we put everything in cron, failed tasks would just be lost.
 */
@Injectable()
export class CronService implements OnModuleInit {
  private readonly logger = new Logger(CronService.name);

  constructor(private readonly queueService: QueueService) {}

  onModuleInit() {
    this.logger.log("CronService initialized — scheduled tasks are active");
  }

  /**
   * Run AI optimization loop every 2 hours for all active workspaces.
   * This is the core autonomous feature — without this cron job,
   * the platform is just a dashboard. With it, it becomes an agent.
   */
  @Cron("0 */2 * * *") // Every 2 hours at minute 0
  async runOptimizationCycle(): Promise<void> {
    this.logger.log("Cron: Starting 2-hour optimization cycle");
    await this.queueService.scheduleOptimizationForAllWorkspaces();
  }

  /**
   * Send daily Telegram reports at 9:00 AM every day.
   * Tashkent timezone (UTC+5) — 4:00 AM UTC.
   */
  @Cron("0 4 * * *") // 4:00 AM UTC = 9:00 AM Tashkent (UTC+5)
  async sendDailyReports(): Promise<void> {
    this.logger.log("Cron: Sending daily Telegram reports");
    await this.queueService.scheduleDailyReportsForAllWorkspaces();
  }

  /**
   * Sync campaign metrics from all platforms every hour.
   * Keeps the dashboard data fresh — max 1 hour old.
   */
  @Cron(CronExpression.EVERY_HOUR)
  async syncPlatformMetrics(): Promise<void> {
    this.logger.log("Cron: Hourly platform metrics sync");
    // TODO: Schedule sync jobs for all active workspaces
  }
}
