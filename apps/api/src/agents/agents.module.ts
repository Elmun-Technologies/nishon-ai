import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { HttpModule } from "@nestjs/axios";
import { AgentProfile } from "./entities/agent-profile.entity";
import { ServiceEngagement } from "./entities/service-engagement.entity";
import { AgentReview } from "./entities/agent-review.entity";
import { AgentPlatformMetrics } from "./entities/agent-platform-metrics.entity";
import { AgentHistoricalPerformance } from "./entities/agent-historical-performance.entity";
import { AgentPerformanceSyncLog } from "./entities/agent-performance-sync-log.entity";
import { AgentCertification } from "./entities/agent-certification.entity";
import { AgentLanguage } from "./entities/agent-language.entity";
import { AgentGeographicCoverage } from "./entities/agent-geographic-coverage.entity";
import { MarketplaceCertification } from "./entities/marketplace-certification.entity";
import { FraudDetectionAudit } from "./entities/fraud-detection-audit.entity";
import { AgentsService } from "./agents.service";
import { AgentsController } from "./agents.controller";
import { PerformanceSyncService } from "./services/performance-sync.service";
import { CertificationService } from "./services/certification.service";
import { CertificationController } from "./services/certification.controller";
import { MarketplaceSearchService } from "./services/marketplace-search.service";
import { MarketplaceProfileService } from "./services/marketplace-profile.service";
import { MarketplaceContactService } from "./services/marketplace-contact.service";
import { MarketplacePerformanceService } from "./services/marketplace-performance.service";
import { FraudDetectionService } from "./services/fraud-detection.service";
import { FraudDetectionAdminService } from "./services/fraud-detection-admin.service";
import { MarketplaceAdminService } from "./services/marketplace-admin.service";
import { MarketplaceCronService } from "./services/marketplace-cron.service";
import { MetaPerformanceSyncService } from "./integrations/meta-sync.service";
import { GooglePerformanceSyncService } from "./integrations/google-sync.service";
import { YandexPerformanceSyncService } from "./integrations/yandex-sync.service";
import { MarketplaceController } from "./controllers/marketplace.controller";
import { AgentCaseStudy } from "./entities/agent-case-study.entity";
import { Workspace } from "../workspaces/entities/workspace.entity";
import { User } from "../users/entities/user.entity";
import { ConnectedAccount } from "../platforms/entities/connected-account.entity";
import { MetaModule } from "../meta/meta.module";

@Module({
  imports: [
    HttpModule,
    MetaModule,
    TypeOrmModule.forFeature([
      AgentProfile,
      ServiceEngagement,
      AgentReview,
      AgentPlatformMetrics,
      AgentHistoricalPerformance,
      AgentPerformanceSyncLog,
      AgentCertification,
      AgentCaseStudy,
      AgentLanguage,
      AgentGeographicCoverage,
      MarketplaceCertification,
      FraudDetectionAudit,
      Workspace,
      User,
      ConnectedAccount,
    ]),
  ],
  controllers: [AgentsController, CertificationController, MarketplaceController],
  providers: [
    AgentsService,
    PerformanceSyncService,
    CertificationService,
    MarketplaceSearchService,
    MarketplaceProfileService,
    MarketplaceContactService,
    MarketplacePerformanceService,
    FraudDetectionService,
    FraudDetectionAdminService,
    MarketplaceAdminService,
    MetaPerformanceSyncService,
    GooglePerformanceSyncService,
    YandexPerformanceSyncService,
    MarketplaceCronService,
  ],
  exports: [
    AgentsService,
    PerformanceSyncService,
    CertificationService,
    MarketplaceSearchService,
    MarketplaceProfileService,
    MarketplaceContactService,
    MarketplacePerformanceService,
    FraudDetectionService,
    FraudDetectionAdminService,
    MarketplaceAdminService,
    MetaPerformanceSyncService,
    GooglePerformanceSyncService,
    YandexPerformanceSyncService,
    MarketplaceCronService,
  ],
})
export class AgentsModule {}
