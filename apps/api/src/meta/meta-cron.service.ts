import { Injectable, Logger } from "@nestjs/common";
import { Cron } from "@nestjs/schedule";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { MetaSyncService } from "./meta-sync.service";
import { ConnectedAccount } from "../platforms/entities/connected-account.entity";
import { Platform } from "@nishon/shared";
import { EventsGateway } from "../events/events.gateway";

/**
 * Runs an automatic Meta Ads sync every 10 minutes across all workspaces
 * that have an active Meta integration. Errors on individual workspaces are
 * caught and logged — they never crash the scheduler or affect other workspaces.
 */
@Injectable()
export class MetaCronService {
  private readonly logger = new Logger(MetaCronService.name);

  constructor(
    private readonly syncService: MetaSyncService,
    @InjectRepository(ConnectedAccount)
    private readonly connectedAccountRepo: Repository<ConnectedAccount>,
    private readonly eventsGateway: EventsGateway,
  ) {}

  /**
   * Auto-sync all Meta-connected workspaces every 10 minutes.
   * Cron pattern: every-10-minutes (see @Cron decorator below).
   */
  @Cron("*/10 * * * *")
  async syncAll(): Promise<void> {
    this.logger.log("Auto-sync started");

    try {
      const accounts = await this.connectedAccountRepo.find({
        where: { platform: Platform.META, isActive: true },
        select: ["workspaceId"],
      });

      // Deduplicate workspace IDs (one workspace may have multiple connected accounts)
      const workspaceIds = [...new Set(accounts.map((a) => a.workspaceId))];

      if (workspaceIds.length === 0) {
        this.logger.log("Auto-sync skipped — no active Meta integrations found");
        return;
      }

      this.logger.log({
        message: "Auto-sync processing workspaces",
        count: workspaceIds.length,
      });

      for (const workspaceId of workspaceIds) {
        try {
          const result = await this.syncService.syncWorkspace(workspaceId);
          this.logger.log({
            message: "Auto-sync workspace complete",
            workspaceId,
            accountsSynced: result.accountsSynced,
            campaignsSynced: result.campaignsSynced,
            insightRowsSynced: result.insightRowsSynced,
            errors: result.errors,
          });

          // Notify frontend in real-time
          this.eventsGateway.emitToWorkspace(workspaceId, 'meta_synced', {
            workspaceId,
            campaignsSynced: result.campaignsSynced,
            timestamp: new Date().toISOString(),
          });
        } catch (err: any) {
          this.logger.error({
            message: "Auto-sync failed for workspace",
            workspaceId,
            error: err?.message,
          });
          // Continue with remaining workspaces
        }
      }

      this.logger.log({
        message: "Auto-sync complete",
        workspacesProcessed: workspaceIds.length,
      });
    } catch (err: any) {
      this.logger.error({
        message: "Auto-sync job failed unexpectedly",
        error: err?.message,
      });
    }
  }
}
