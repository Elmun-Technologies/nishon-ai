import { Module } from "@nestjs/common";
import { HttpModule } from "@nestjs/axios";
import { TypeOrmModule } from "@nestjs/typeorm";
import { MetaPerformanceSyncService } from "./meta-sync.service";
import { AgentProfile } from "../entities/agent-profile.entity";
import { AgentPlatformMetrics } from "../entities/agent-platform-metrics.entity";
import { ConnectedAccount } from "../../platforms/entities/connected-account.entity";
import { Workspace } from "../../workspaces/entities/workspace.entity";
import { MetaModule } from "../../meta/meta.module";

/**
 * IntegrationsModule handles marketplace integrations for syncing specialist
 * performance data from external platforms (Meta, Google, etc.) into AdSpectr.
 *
 * Services:
 * - MetaPerformanceSyncService: Syncs real campaign performance from Meta Ads API
 *
 * This module is imported by AgentsModule to provide marketplace data collection
 * capabilities alongside agent profile management.
 */
@Module({
  imports: [
    HttpModule,
    MetaModule,
    TypeOrmModule.forFeature([AgentProfile, AgentPlatformMetrics, ConnectedAccount, Workspace]),
  ],
  providers: [MetaPerformanceSyncService],
  exports: [MetaPerformanceSyncService],
})
export class IntegrationsModule {}
