import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { ConfigModule } from '@nestjs/config'
import {
  IntegrationConnection,
  IntegrationConfigEntity,
  SyncLog,
  LinkedDeal,
  RevenueSyncLog,
  CampaignRevenue,
  AudienceSegment,
  SegmentMember,
  AudienceSync,
  SpecialistCommission,
  CommissionRate,
  CommissionLog,
  SpecialistProfile,
} from './entities'
import {
  EncryptionService,
  AmoCRMConnectorService,
  ConversionToLeadSyncService,
  DealPullSyncService,
  IntegrationService,
  ContactSyncService,
  AudienceSegmentService,
  PlatformAudienceService,
  CommissionCalculationService,
  CommissionRateService,
  CommissionReportingService,
} from './services'
import { IntegrationsController } from './integrations.controller'

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([
      IntegrationConnection,
      IntegrationConfigEntity,
      SyncLog,
      LinkedDeal,
      RevenueSyncLog,
      CampaignRevenue,
      // Phase 4: Audience sync entities
      AudienceSegment,
      SegmentMember,
      AudienceSync,
      // Phase 5: Commission entities
      SpecialistCommission,
      CommissionRate,
      CommissionLog,
      SpecialistProfile,
    ]),
  ],
  controllers: [IntegrationsController],
  providers: [
    EncryptionService,
    AmoCRMConnectorService,
    ConversionToLeadSyncService,
    DealPullSyncService,
    IntegrationService,
    // Phase 4 services
    ContactSyncService,
    AudienceSegmentService,
    PlatformAudienceService,
    // Phase 5 services
    CommissionCalculationService,
    CommissionRateService,
    CommissionReportingService,
  ],
  exports: [
    IntegrationService,
    EncryptionService,
    AmoCRMConnectorService,
    ConversionToLeadSyncService,
    DealPullSyncService,
    // Phase 4 services
    ContactSyncService,
    AudienceSegmentService,
    PlatformAudienceService,
    // Phase 5 services
    CommissionCalculationService,
    CommissionRateService,
    CommissionReportingService,
  ],
})
export class IntegrationsModule {}
