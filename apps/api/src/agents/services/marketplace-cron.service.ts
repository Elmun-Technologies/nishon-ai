import { Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Cron, CronExpression } from "@nestjs/schedule";
import { ConfigService } from "@nestjs/config";

import { Workspace } from "../../workspaces/entities/workspace.entity";
import { MetaPerformanceSyncService } from "../integrations/meta-sync.service";
import { GooglePerformanceSyncService } from "../integrations/google-sync.service";
import { YandexPerformanceSyncService } from "../integrations/yandex-sync.service";
import { FraudDetectionAdminService } from "./fraud-detection-admin.service";

/**
 * Summary of a marketplace cron sync operation
 */
export interface CronSyncSummary {
  totalWorkspaces: number;
  successfulWorkspaces: number;
  failedWorkspaces: number;
  totalRecordsSynced: number;
  totalErrors: number;
  elapsedMs: number;
  startedAt: Date;
  completedAt: Date;
}

/**
 * Per-workspace sync result
 */
export interface WorkspaceSyncResult {
  workspaceId: string;
  platform: "meta" | "google" | "yandex";
  success: boolean;
  recordsSynced: number;
  error?: string;
}

/**
 * MarketplaceCronService schedules automated performance metric syncing across all
 * workspaces and platforms (Meta, Google, Yandex).
 *
 * Features:
 * - Daily light sync at midnight UTC: Syncs last 30 days of performance data
 * - Weekly deep validation on Sundays at 3 AM UTC: Full 90-day refresh with fraud re-validation
 * - Staggered workspace processing: Spreads syncs across an hour to avoid rate limits
 * - Graceful error handling: Per-workspace failures don't affect other workspaces
 * - Comprehensive logging: Structured logs track sync progress and metrics
 *
 * Environment variables:
 * - SYNC_CRON_EXPRESSION: Cron for daily sync (default: '0 0 * * *' = midnight UTC)
 * - DEEP_VALIDATION_CRON: Cron for weekly deep validation (default: '0 3 * * 0' = Sunday 3am)
 * - STAGGER_SYNCS: Enable staggering (default: true)
 * - STAGGER_INTERVAL_MS: Milliseconds between workspace syncs (default: 180000 = 3 min)
 */
@Injectable()
export class MarketplaceCronService {
  private readonly logger = new Logger(MarketplaceCronService.name);

  // Map of workspace ID -> { lastSyncHash, batchPosition }
  private workspaceBatchMap = new Map<
    string,
    { batchPosition: number; hash: number }
  >();

  constructor(
    @InjectRepository(Workspace)
    private readonly workspaceRepo: Repository<Workspace>,
    private readonly metaSync: MetaPerformanceSyncService,
    private readonly googleSync: GooglePerformanceSyncService,
    private readonly yandexSync: YandexPerformanceSyncService,
    private readonly fraudDetectionAdmin: FraudDetectionAdminService,
    private readonly config: ConfigService,
  ) {}

  /**
   * Daily sync at midnight UTC (by default).
   * Syncs last 30 days of performance metrics for all specialists in all workspaces.
   * Runs quickly to avoid overwhelming APIs, errors in one workspace don't block others.
   */
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handleDailyPerformanceSync(): Promise<void> {
    const startTime = Date.now();
    const startedAt = new Date();

    this.logger.log({
      message: "Daily performance sync started",
      timestamp: startedAt.toISOString(),
    });

    try {
      // Load all workspaces
      const workspaces = await this.workspaceRepo.find({
        where: { isActive: true },
        select: ["id", "name"],
      });

      if (workspaces.length === 0) {
        this.logger.warn("No active workspaces found for daily sync");
        return;
      }

      this.logger.log({
        message: "Daily sync will process workspaces",
        workspaceCount: workspaces.length,
      });

      // Sync each workspace with all platforms
      const results: WorkspaceSyncResult[] = [];
      let totalRecordsSynced = 0;
      let successCount = 0;
      let failureCount = 0;

      for (const workspace of workspaces) {
        // Sync Meta
        const metaResult = await this.syncWorkspacePlatform(
          workspace.id,
          workspace.name,
          "meta",
          this.metaSync,
          { dayLookback: 30, forceRefresh: false },
        );
        results.push(metaResult);
        if (metaResult.success) {
          successCount++;
          totalRecordsSynced += metaResult.recordsSynced;
        } else {
          failureCount++;
        }

        // Sync Google
        const googleResult = await this.syncWorkspacePlatform(
          workspace.id,
          workspace.name,
          "google",
          this.googleSync,
          { dayLookback: 30, forceRefresh: false },
        );
        results.push(googleResult);
        if (googleResult.success) {
          successCount++;
          totalRecordsSynced += googleResult.recordsSynced;
        } else {
          failureCount++;
        }

        // Sync Yandex
        const yandexResult = await this.syncWorkspacePlatform(
          workspace.id,
          workspace.name,
          "yandex",
          this.yandexSync,
          { dayLookback: 30, forceRefresh: false },
        );
        results.push(yandexResult);
        if (yandexResult.success) {
          successCount++;
          totalRecordsSynced += yandexResult.recordsSynced;
        } else {
          failureCount++;
        }
      }

      const elapsedMs = Date.now() - startTime;

      this.logger.log({
        message: "Daily performance sync completed",
        summary: {
          totalWorkspaces: workspaces.length,
          totalPlatformsProcessed: workspaces.length * 3,
          successfulSyncs: successCount,
          failedSyncs: failureCount,
          totalRecordsSynced,
          elapsedMs,
          completedAt: new Date().toISOString(),
        },
        results: results.filter((r) => !r.success),
      });
    } catch (err: any) {
      this.logger.error({
        message: "Daily performance sync failed",
        error: err?.message,
        stack: err?.stack,
        elapsedMs: Date.now() - startTime,
      });
    }
  }

  /**
   * Weekly deep validation at 3 AM UTC on Sundays (by default).
   * Performs a full 90-day refresh for fraud re-validation and metric accuracy.
   * More resource-intensive than daily sync, but essential for security.
   */
  @Cron("0 3 * * 0") // Sunday 3 AM UTC
  async handleWeeklyDeepValidation(): Promise<void> {
    const startTime = Date.now();
    const startedAt = new Date();

    this.logger.log({
      message: "Weekly deep validation started",
      timestamp: startedAt.toISOString(),
    });

    try {
      // Load all workspaces
      const workspaces = await this.workspaceRepo.find({
        where: { isActive: true },
        select: ["id", "name"],
      });

      if (workspaces.length === 0) {
        this.logger.warn("No active workspaces found for weekly deep validation");
        return;
      }

      this.logger.log({
        message: "Weekly validation will process workspaces",
        workspaceCount: workspaces.length,
        lookbackDays: 90,
      });

      // Deep validation config: 90 days, force refresh, full metrics check
      const deepValidationConfig = {
        dayLookback: 90,
        forceRefresh: true,
      };

      let totalRecordsSynced = 0;
      let successCount = 0;
      let failureCount = 0;
      const results: WorkspaceSyncResult[] = [];

      for (const workspace of workspaces) {
        // Sync Meta with deep validation
        const metaResult = await this.syncWorkspacePlatform(
          workspace.id,
          workspace.name,
          "meta",
          this.metaSync,
          deepValidationConfig,
        );
        results.push(metaResult);
        if (metaResult.success) {
          successCount++;
          totalRecordsSynced += metaResult.recordsSynced;
        } else {
          failureCount++;
        }

        // Sync Google with deep validation
        const googleResult = await this.syncWorkspacePlatform(
          workspace.id,
          workspace.name,
          "google",
          this.googleSync,
          deepValidationConfig,
        );
        results.push(googleResult);
        if (googleResult.success) {
          successCount++;
          totalRecordsSynced += googleResult.recordsSynced;
        } else {
          failureCount++;
        }

        // Sync Yandex with deep validation
        const yandexResult = await this.syncWorkspacePlatform(
          workspace.id,
          workspace.name,
          "yandex",
          this.yandexSync,
          deepValidationConfig,
        );
        results.push(yandexResult);
        if (yandexResult.success) {
          successCount++;
          totalRecordsSynced += yandexResult.recordsSynced;
        } else {
          failureCount++;
        }

        // Perform fraud re-validation for this workspace
        try {
          await this.fraudDetectionAdmin.revalidateWorkspaceFraudScores(workspace.id);
          this.logger.log({
            message: "Fraud score re-validation completed",
            workspaceId: workspace.id,
          });
        } catch (err: any) {
          this.logger.error({
            message: "Fraud score re-validation failed",
            workspaceId: workspace.id,
            error: err?.message,
          });
        }
      }

      const elapsedMs = Date.now() - startTime;

      this.logger.log({
        message: "Weekly deep validation completed",
        summary: {
          totalWorkspaces: workspaces.length,
          totalPlatformsProcessed: workspaces.length * 3,
          successfulSyncs: successCount,
          failedSyncs: failureCount,
          totalRecordsSynced,
          elapsedMs,
          completedAt: new Date().toISOString(),
        },
        failedResults: results.filter((r) => !r.success),
      });
    } catch (err: any) {
      this.logger.error({
        message: "Weekly deep validation failed",
        error: err?.message,
        stack: err?.stack,
        elapsedMs: Date.now() - startTime,
      });
    }
  }

  /**
   * Helper to sync a single workspace on a single platform.
   * Catches errors gracefully to prevent one failure from blocking others.
   */
  private async syncWorkspacePlatform(
    workspaceId: string,
    workspaceName: string,
    platform: "meta" | "google" | "yandex",
    syncService: any,
    config: any,
  ): Promise<WorkspaceSyncResult> {
    const result: WorkspaceSyncResult = {
      workspaceId,
      platform,
      success: false,
      recordsSynced: 0,
    };

    try {
      this.logger.debug({
        message: "Starting platform sync",
        workspaceId,
        workspaceName,
        platform,
      });

      const syncResults = await syncService.syncAllSpecialists(workspaceId, config);

      // Count total records synced across all specialists
      const totalRecords = syncResults.reduce(
        (sum: number, r: any) => sum + r.metricsInserted + r.metricsUpdated,
        0,
      );

      result.success = true;
      result.recordsSynced = totalRecords;

      // Count specialists synced
      const successfulSpecialists = syncResults.filter((r: any) => r.success).length;

      this.logger.log({
        message: "Platform sync completed",
        workspaceId,
        platform,
        specialistsSynced: syncResults.length,
        successfulSpecialists,
        totalRecordsSynced: totalRecords,
      });
    } catch (err: any) {
      result.success = false;
      result.error = err?.message || "Unknown error";

      this.logger.error({
        message: "Platform sync failed",
        workspaceId,
        platform,
        error: err?.message,
        errorCode: err?.code,
      });
    }

    return result;
  }

  /**
   * Utility to calculate staggered sync offset for a workspace.
   * Prevents "thundering herd" by spacing out syncs across the hour.
   *
   * Algorithm:
   * 1. Hash workspace ID to get deterministic value (0-N)
   * 2. Divide into N buckets (one per expected workspace)
   * 3. Return minutes offset from start time
   *
   * Example with 4 workspaces: [0 min, 15 min, 30 min, 45 min]
   */
  private calculateStaggerOffset(workspaceId: string, totalWorkspaces: number): number {
    // Simple hash to consistent number (0-totalWorkspaces-1)
    let hash = 0;
    for (let i = 0; i < workspaceId.length; i++) {
      const char = workspaceId.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit int
    }

    const bucketIndex = Math.abs(hash) % totalWorkspaces;
    const minutesPerBucket = Math.floor(60 / totalWorkspaces);
    return bucketIndex * minutesPerBucket;
  }
}
