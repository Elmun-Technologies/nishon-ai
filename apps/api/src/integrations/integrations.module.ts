import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { ConfigModule } from '@nestjs/config'
import {
  IntegrationConnection,
  IntegrationConfigEntity,
  SyncLog,
} from './entities'
import {
  EncryptionService,
  AmoCRMConnectorService,
  ConversionToLeadSyncService,
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
    ]),
  ],
  controllers: [IntegrationsController],
  providers: [
    EncryptionService,
    AmoCRMConnectorService,
    ConversionToLeadSyncService,
    IntegrationService,
  ],
  exports: [
    IntegrationService,
    EncryptionService,
    AmoCRMConnectorService,
    ConversionToLeadSyncService,
  ],
})
export class IntegrationsModule {}
