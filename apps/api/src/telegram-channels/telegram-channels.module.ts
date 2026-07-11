import { Module } from "@nestjs/common";
import { HttpModule } from "@nestjs/axios";
import { ConfigModule } from "@nestjs/config";
import { TgStatService } from "./tgstat.service";
import { TelegramChannelsController } from "./telegram-channels.controller";

@Module({
  imports: [
    ConfigModule,
    HttpModule.register({
      timeout: 35_000,
      maxRedirects: 3,
    }),
  ],
  controllers: [TelegramChannelsController],
  providers: [TgStatService],
  exports: [TgStatService],
})
export class TelegramChannelsModule {}
