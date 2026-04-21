import { Module } from "@nestjs/common";
import { HttpModule } from "@nestjs/axios";
import { ConfigModule } from "@nestjs/config";
import { QueueModule } from "../queue/queue.module";
import { CrmController } from "./crm.controller";
import { RetargetDashboardController } from "./retarget-dashboard.controller";
import { CrmWebhookGuard } from "./guards/crm-webhook.guard";
import { RetargetRedisService } from "./retarget-redis.service";
import { RetargetOrchestrationService } from "./retarget-orchestration.service";
import { RetargetMetaPublisherService } from "./retarget-meta-publisher.service";
import { RetargetPostPurchaseProcessor } from "./retarget-post-purchase.processor";
import { RetargetTelegramBotService } from "./retarget-telegram-bot.service";
import { TelegramWebhookController } from "./telegram-webhook.controller";

@Module({
  imports: [
    ConfigModule,
    QueueModule,
    HttpModule.register({
      timeout: 120_000,
      maxRedirects: 0,
    }),
  ],
  controllers: [CrmController, RetargetDashboardController, TelegramWebhookController],
  providers: [
    RetargetRedisService,
    RetargetMetaPublisherService,
    RetargetTelegramBotService,
    RetargetOrchestrationService,
    RetargetPostPurchaseProcessor,
    CrmWebhookGuard,
  ],
  exports: [RetargetOrchestrationService, RetargetRedisService],
})
export class RetargetSignalModule {}
