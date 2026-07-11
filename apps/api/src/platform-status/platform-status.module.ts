import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { ReveModule } from "../reve/reve.module";
import { TelegramChannelsModule } from "../telegram-channels/telegram-channels.module";
import { PlatformsModule } from "../platforms/platforms.module";
import { PlatformStatusService } from "./platform-status.service";
import { PlatformStatusController } from "./platform-status.controller";

@Module({
  imports: [ConfigModule, ReveModule, TelegramChannelsModule, PlatformsModule],
  controllers: [PlatformStatusController],
  providers: [PlatformStatusService],
})
export class PlatformStatusModule {}
