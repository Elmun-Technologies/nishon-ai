import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ConfigModule } from "@nestjs/config";
import { HttpModule } from "@nestjs/axios";
import { PlatformsService } from "./platforms.service";
import { PlatformsController } from "./platforms.controller";
import { MetaConnector } from "./connectors/meta.connector";
import { GoogleConnector } from "./connectors/google.connector";
import { TiktokConnector } from "./connectors/tiktok.connector";
import { YandexConnector } from "./connectors/yandex.connector";
import { ConnectedAccount } from "./entities/connected-account.entity";
import { Workspace } from "../workspaces/entities/workspace.entity";
import { Campaign } from "../campaigns/entities/campaign.entity";

@Module({
  imports: [
    ConfigModule,
    HttpModule,
    TypeOrmModule.forFeature([ConnectedAccount, Workspace, Campaign]),
  ],
  controllers: [PlatformsController],
  providers: [
    PlatformsService,
    MetaConnector,
    GoogleConnector,
    TiktokConnector,
    YandexConnector,
  ],
  exports: [PlatformsService, MetaConnector, YandexConnector],
})
export class PlatformsModule {}
