import {
  Injectable,
  Logger,
  BadRequestException,
  NotFoundException,
  InternalServerErrorException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { MetaPerformanceSyncService, PerformanceSyncResult } from "../integrations/meta-sync.service";
import { GooglePerformanceSyncService } from "../integrations/google-sync.service";
import { YandexPerformanceSyncService } from "../integrations/yandex-sync.service";
import { AgentProfile } from "../entities/agent-profile.entity";
import { AgentPerformanceSyncLog } from "../entities/agent-performance-sync-log.entity";
import { FraudDetectionAdminService } from "./fraud-detection-admin.service";
import { SyncStatusDto } from "../dtos/marketplace.dto";

/**
 * MarketplaceAdminService orchestrates performance syncing across all platforms
 * (Meta, Google, Yandex) and provides admin tools for monitoring and verification.
 *
 * Key responsibilities:
 * - Route sync requests to the correct platform service
 * - Verify sync results against fraud detection rules
 * - Manage sync logs for audit trail
 * - Provide sync status monitoring for admins
 * - Handle errors gracefully with proper logging
 */
@Injectable()
export class MarketplaceAdminService {
  private readonly logger = new Logger(MarketplaceAdminService.name);

  constructor(
    private readonly metaSync: MetaPerformanceSyncService,
    private readonly googleSync: GooglePerformanceSyncService,
    private readonly yandexSync: YandexPerformanceSyncService,
    private readonly fraudDetectionAdmin: FraudDetectionAdminService,
    @InjectRepository(AgentProfile)
    private readonly agentProfileRepo: Repository<AgentProfile>,
    @InjectRepository(AgentPerformanceSyncLog)
    private readonly syncLogRepo: Repository<AgentPerformanceSyncLog>,
  ) {}

  /**
   * Syncs performance metrics for a specialist from a specific platform.
   *
   * Execution flow:
   * 1. Validate specialist exists
   * 2. Validate platform is supported
   * 3. Route to appropriate platform service
   * 4. Log the sync attempt
   * 5. Verify sync result against fraud rules
   * 6. Update sync log with result
   * 7. Return unified response
   *
   * @param agentProfileId The specialist's profile ID
   * @param platform Platform to sync from (meta, google, or yandex)
   * @param forceRefresh If true, overwrite existing data for period
   * @param workspaceId Workspace context for multi-tenancy
   * @returns Unified result with sync metrics
   * @throws NotFoundException if specialist not found
   * @throws BadRequestException if platform invalid or no connected account
   * @throws InternalServerErrorException on API errors
   */
  async syncPerformance(
    agentProfileId: string,
    platform: string,
    forceRefresh: boolean = false,
    workspaceId?: string,
  ): Promise<{
    synced: boolean;
    records: number;
    nextSync: Date;
    fraudRiskScore?: number;
  }> {
    const startTime = Date.now();

    // ──── Step 1: Validate specialist exists ────────────────────────────────
    const specialist = await this.agentProfileRepo.findOne({
      where: { id: agentProfileId },
    });

    if (!specialist) {
      this.logger.warn({
        message: "Specialist not found for sync",
        agentProfileId,
      });
      throw new NotFoundException(`Specialist profile ${agentProfileId} not found`);
    }

    // ──── Step 2: Validate platform ─────────────────────────────────────────
    const normalizedPlatform = platform.toLowerCase();
    const supportedPlatforms = ["meta", "google", "yandex"];

    if (!supportedPlatforms.includes(normalizedPlatform)) {
      throw new BadRequestException(
        `Invalid platform: ${platform}. Supported platforms: ${supportedPlatforms.join(", ")}`,
      );
    }

    this.logger.log({
      message: "Starting performance sync",
      agentProfileId,
      specialistName: specialist.displayName,
      platform: normalizedPlatform,
      forceRefresh,
      workspaceId,
    });

    let syncResult: PerformanceSyncResult;

    try {
      // ──── Step 3: Route to platform service ─────────────────────────────────
      switch (normalizedPlatform) {
        case "meta":
          syncResult = await this.metaSync.syncSpecialistMetrics(agentProfileId, workspaceId || "", {
            dayLookback: 30,
            forceRefresh,
            dryRun: false,
          });
          break;

        case "google":
          syncResult = await this.googleSync.syncSpecialistMetrics(agentProfileId, workspaceId || "", {
            dayLookback: 30,
            forceRefresh,
            dryRun: false,
          });
          break;

        case "yandex":
          syncResult = await this.yandexSync.syncSpecialistMetrics(agentProfileId, workspaceId || "", {
            dayLookback: 30,
            forceRefresh,
            dryRun: false,
          });
          break;

        default:
          throw new InternalServerErrorException(`Unknown platform: ${normalizedPlatform}`);
      }

      // ──── Step 4: Verify sync result ────────────────────────────────────────
      const verificationResult = await this.verifySyncResult(syncResult);

      if (!verificationResult.isValid && verificationResult.fraudRiskScore > 70) {
        this.logger.warn({
          message: "Sync verification flagged high fraud risk",
          agentProfileId,
          platform: normalizedPlatform,
          fraudRiskScore: verificationResult.fraudRiskScore,
          reasons: verificationResult.reasons,
        });
      }

      // ──── Step 5: Log the sync ──────────────────────────────────────────────
      const syncLog = this.syncLogRepo.create({
        agentProfileId,
        syncType: normalizedPlatform as 'meta' | 'google' | 'yandex' | 'manual',
        status: syncResult.success ? "completed" : "failed",
        recordsSynced: syncResult.metricsInserted + syncResult.metricsUpdated,
        errorMessage: syncResult.errors.length > 0 ? syncResult.errors[0] : null,
        startedAt: new Date(),
        completedAt: new Date(),
      });

      await this.syncLogRepo.save(syncLog);

      this.logger.log({
        message: "Performance sync completed",
        agentProfileId,
        platform: normalizedPlatform,
        success: syncResult.success,
        recordsSynced: syncLog.recordsSynced,
        durationMs: Date.now() - startTime,
      });

      // ──── Step 6: Return unified response ────────────────────────────────────
      const nextSync = new Date();
      nextSync.setDate(nextSync.getDate() + 1); // Schedule next sync for tomorrow

      return {
        synced: syncResult.success,
        records: syncLog.recordsSynced,
        nextSync,
        fraudRiskScore: syncResult.fraudRiskScore,
      };
    } catch (err: any) {
      // ──── Error handling ────────────────────────────────────────────────────
      const errorMessage = err?.message ?? "Unknown error during sync";

      // Log the sync failure
      const syncLog = this.syncLogRepo.create({
        agentProfileId,
        syncType: normalizedPlatform as 'meta' | 'google' | 'yandex' | 'manual',
        status: "failed",
        recordsSynced: 0,
        errorMessage,
        startedAt: new Date(),
        completedAt: new Date(),
      });

      await this.syncLogRepo.save(syncLog);

      this.logger.error({
        message: "Performance sync failed",
        agentProfileId,
        platform: normalizedPlatform,
        error: errorMessage,
        stack: err?.stack,
      });

      // Re-throw with proper HTTP exception
      if (err instanceof NotFoundException || err instanceof BadRequestException) {
        throw err;
      }

      throw new InternalServerErrorException(
        `Failed to sync ${normalizedPlatform} performance data: ${errorMessage}`,
      );
    }
  }

  /**
   * Verifies a sync result against fraud detection rules.
   *
   * Validation checks:
   * - Fraud risk score within acceptable range
   * - No critical validation errors
   * - Metrics within reasonable bounds
   *
   * @param syncResult Result from platform sync service
   * @returns Verification result with fraud risk assessment
   */
  async verifySyncResult(syncResult: PerformanceSyncResult): Promise<{
    isValid: boolean;
    fraudRiskScore: number;
    reasons: string[];
  }> {
    const reasons: string[] = [];
    let fraudRiskScore = syncResult.fraudRiskScore ?? 0;

    // Check for critical errors
    if (syncResult.errors.length > 0) {
      reasons.push(`Sync completed with ${syncResult.errors.length} error(s)`);
      fraudRiskScore += 10;
    }

    // Check fraud score threshold
    if (fraudRiskScore > 50) {
      reasons.push(`High fraud risk score detected: ${fraudRiskScore}`);
    }

    // Validate metrics sanity
    const totalMetrics = syncResult.metricsInserted + syncResult.metricsUpdated;
    if (totalMetrics === 0 && syncResult.success) {
      reasons.push("Warning: No metrics were actually inserted or updated");
    }

    // Assess validity
    const isValid = fraudRiskScore <= 70;

    this.logger.debug({
      message: "Sync result verification",
      agentProfileId: syncResult.agentProfileId,
      isValid,
      fraudRiskScore,
      reasons,
    });

    return {
      isValid,
      fraudRiskScore: Math.min(fraudRiskScore, 100),
      reasons,
    };
  }

  /**
   * Gets sync status for all specialists or filtered by status.
   *
   * Returns recent sync logs with specialist information,
   * useful for admin dashboards and monitoring.
   *
   * @param statusFilter Filter by sync status (pending, in_progress, completed, failed)
   * @param limit Maximum number of results (default: 100)
   * @returns Array of sync status DTOs
   */
  async getSyncStatus(
    statusFilter?: "pending" | "in_progress" | "completed" | "failed",
    limit: number = 100,
  ): Promise<SyncStatusDto[]> {
    this.logger.debug({
      message: "Fetching sync status",
      statusFilter,
      limit,
    });

    // Build query
    let query = this.syncLogRepo.createQueryBuilder("log");

    if (statusFilter) {
      query = query.where("log.status = :status", { status: statusFilter });
    }

    // Get most recent syncs
    const logs = await query
      .leftJoinAndSelect("log.agentProfile", "agent")
      .orderBy("log.syncedAt", "DESC")
      .take(limit)
      .getMany();

    // Transform to DTOs
    const results: SyncStatusDto[] = logs.map((log) => ({
      specialistId: log.agentProfileId,
      specialistName: log.agentProfile?.displayName ?? "Unknown",
      platform: log.syncType as any,
      status: log.status as any,
      lastSyncAt: log.startedAt ?? log.createdAt,
      recordsCount: log.recordsSynced ?? 0,
      errorMessage: log.errorMessage ?? undefined,
      nextScheduledSync: this.calculateNextSyncDate(log.startedAt ?? log.createdAt),
    }));

    this.logger.log({
      message: "Sync status retrieved",
      count: results.length,
      statusFilter,
    });

    return results;
  }

  /**
   * Calculates the next scheduled sync date based on last sync.
   * Syncs are scheduled for 24 hours after the last sync.
   *
   * @param lastSyncDate The date of the last sync
   * @returns Next scheduled sync date
   */
  private calculateNextSyncDate(lastSyncDate: Date): Date {
    const nextSync = new Date(lastSyncDate);
    nextSync.setDate(nextSync.getDate() + 1);
    return nextSync;
  }
}
