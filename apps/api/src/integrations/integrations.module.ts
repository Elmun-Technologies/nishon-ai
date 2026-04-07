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
} from './entities'
import {
  EncryptionService,
  AmoCRMConnectorService,
  ConversionToLeadSyncService,
  DealPullSyncService,
  IntegrationService,
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
    ]),
  ],
  controllers: [IntegrationsController],
  providers: [
    EncryptionService,
    AmoCRMConnectorService,
    ConversionToLeadSyncService,
    DealPullSyncService,
    IntegrationService,
  ],
  exports: [
    IntegrationService,
    EncryptionService,
    AmoCRMConnectorService,
    ConversionToLeadSyncService,
    DealPullSyncService,
  ],
})
export class IntegrationsModule {}
