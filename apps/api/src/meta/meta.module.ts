import { Module } from "@nestjs/common";
import { HttpModule } from "@nestjs/axios";
import { TypeOrmModule } from "@nestjs/typeorm";
import { MetaController } from "./meta.controller";
import { MetaAdsService } from "./meta-ads.service";
import { MetaSyncService } from "./meta-sync.service";
import { MetaAiEngineService } from "./meta-ai-engine.service";
import { MetaCronService } from "./meta-cron.service";
import { MetaAdAccount } from "./entities/meta-ad-account.entity";
import { MetaCampaignSync } from "./entities/meta-campaign-sync.entity";
import { MetaInsight } from "./entities/meta-insight.entity";
import { ConnectedAccount } from "../platforms/entities/connected-account.entity";

/**
 * MetaModule owns everything related to the Meta Ads Graph API integration:
 *
 *  MetaAdsService      — pure Graph API client (no DB, reusable by other modules)
 *  MetaSyncService     — sync orchestrator (API → DB, with transactions)
 *  MetaAiEngineService — rule-based campaign health analyser
 *  MetaCronService     — scheduler: auto-syncs all workspaces every 10 minutes
 *  MetaController      — REST endpoints: GET /meta/ad-accounts, POST /meta/sync, GET /meta/dashboard
 *
 * ConnectedAccount is imported (not owned) — it's managed by PlatformsModule.
 * TypeOrmModule.forFeature registers the three Meta-specific entities so their
 * repositories are injectable throughout this module.
 */
@Module({
  imports: [
    HttpModule,
    TypeOrmModule.forFeature([
      MetaAdAccount,
      MetaCampaignSync,
      MetaInsight,
      ConnectedAccount, // needed by MetaSyncService and MetaCronService to look up stored tokens
    ]),
  ],
  controllers: [MetaController],
  providers: [MetaAdsService, MetaSyncService, MetaAiEngineService, MetaCronService],
  exports: [MetaAdsService, MetaSyncService, MetaAiEngineService],
})
export class MetaModule {}
