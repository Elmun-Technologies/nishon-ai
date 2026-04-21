import { Injectable, Logger } from "@nestjs/common";
import { InjectQueue } from "@nestjs/bull";
import { Queue } from "bull";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Workspace } from "../workspaces/entities/workspace.entity";
import { QUEUE_NAMES } from "./queue.constants";

/**
 * QueueService is the entry point for scheduling background jobs.
 *
 * Other modules call this service to schedule work — they never
 * touch the queue directly. This keeps the queue implementation
 * hidden behind a clean interface.
 *
 * Two types of jobs:
 * - Scheduled (cron): optimization loop every 2 hours, daily reports at 9am
 * - On-demand: triggered when user connects an account or changes settings
 */
@Injectable()
export class QueueService {
  private readonly logger = new Logger(QueueService.name);

  constructor(
    @InjectQueue(QUEUE_NAMES.OPTIMIZATION) private optimizationQueue: Queue,
    @InjectQueue(QUEUE_NAMES.CAMPAIGN_SYNC) private syncQueue: Queue,
    @InjectQueue(QUEUE_NAMES.REPORTS) private reportsQueue: Queue,
    @InjectRepository(Workspace) private workspaceRepo: Repository<Workspace>,
  ) {}

  /**
   * Schedule the optimization loop for ALL active workspaces.
   * Called by a cron job every 2 hours.
   * Each workspace gets its own job so they run in parallel
   * and one slow workspace doesn't block others.
   */
  async scheduleOptimizationForAllWorkspaces(): Promise<void> {
    const workspaces = await this.workspaceRepo.find({
      where: { isOnboardingComplete: true },
    });

    this.logger.log(
      `Scheduling optimization for ${workspaces.length} workspaces`,
    );

    for (let i = 0; i < workspaces.length; i++) {
      await this.optimizationQueue.add(
        "run-optimization",
        { workspaceId: workspaces[i].id },
        {
          // Stagger jobs 5 seconds apart to avoid hammering OpenAI API
          delay: i * 5000,
          jobId: `optimization-${workspaces[i].id}-${Date.now()}`,
        },
      );
    }
  }

  /**
   * Schedule daily report for all workspaces that have Telegram configured.
   * Called by cron at 9:00 AM in the workspace's timezone.
   */
  async scheduleDailyReportsForAllWorkspaces(): Promise<void> {
    const workspaces = await this.workspaceRepo.find({
      where: { isOnboardingComplete: true },
    });

    for (let i = 0; i < workspaces.length; i++) {
      await this.reportsQueue.add(
        "send-daily-report",
        { workspaceId: workspaces[i].id },
        { delay: i * 2000 },
      );
    }
  }

  /**
   * Schedule immediate optimization for a single workspace.
   * Called when user manually triggers "Optimize Now" from the UI.
   */
  async scheduleOptimizationNow(workspaceId: string): Promise<void> {
    await this.optimizationQueue.add(
      "run-optimization",
      { workspaceId },
      { priority: 1 }, // High priority — user is waiting
    );
    this.logger.log(`Immediate optimization scheduled for: ${workspaceId}`);
  }

  /**
   * Schedule platform metrics sync for ALL active workspaces.
   * Called by the hourly cron job.
   * Creates one sync job per connected platform per workspace.
   */
  async scheduleSyncForAllWorkspaces(): Promise<void> {
    const workspaces = await this.workspaceRepo.find({
      where: { isOnboardingComplete: true },
    });

    this.logger.log(
      `Scheduling metrics sync for ${workspaces.length} workspaces`,
    );

    let delay = 0;
    for (const workspace of workspaces) {
      await this.syncQueue.add(
        "sync-all-platforms",
        { workspaceId: workspace.id },
        {
          delay,
          jobId: `sync-all-${workspace.id}-${Date.now()}`,
          // Don't retry sync jobs aggressively — they run every hour anyway
          attempts: 2,
          backoff: { type: "fixed", delay: 30_000 },
        },
      );
      delay += 3000; // 3 s stagger to avoid hitting platform rate limits simultaneously
    }
  }

  /**
   * Schedule immediate sync for a single workspace.
   * Called when a user connects a new platform account.
   */
  async scheduleSyncNow(workspaceId: string, platform?: string): Promise<void> {
    await this.syncQueue.add(
      platform ? "sync-campaign-metrics" : "sync-all-platforms",
      { workspaceId, platform },
      { priority: 1 },
    );
    this.logger.log(
      `Immediate sync scheduled: workspace=${workspaceId} platform=${platform ?? "all"}`,
    );
  }

  /**
   * Get queue statistics — used in admin dashboard to monitor health.
   */
  async getQueueStats() {
    const [optWaiting, optActive, optFailed] = await Promise.all([
      this.optimizationQueue.getWaitingCount(),
      this.optimizationQueue.getActiveCount(),
      this.optimizationQueue.getFailedCount(),
    ]);

    return {
      optimization: {
        waiting: optWaiting,
        active: optActive,
        failed: optFailed,
      },
    };
  }
}
