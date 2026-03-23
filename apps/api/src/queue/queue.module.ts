import { Module } from "@nestjs/common";
import { BullModule } from "@nestjs/bull";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ScheduleModule } from "@nestjs/schedule";
import { CampaignSyncProcessor } from "./processors/campaign-sync.processor";
import { OptimizationProcessor } from "./processors/optimization.processor";
import { ReportProcessor } from "./processors/report.processor";
import { QueueService } from "./queue.service";
import { CronService } from "./cron.service";
import { Workspace } from "../workspaces/entities/workspace.entity";
import { AiDecision } from "../ai-decisions/entities/ai-decision.entity";
import { PerformanceMetric } from "../analytics/entities/performance-metric.entity";
import { AiAgentModule } from "../ai-agent/ai-agent.module";
import { QUEUE_NAMES } from "./queue.constants";

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([Workspace, AiDecision, PerformanceMetric]),
    // Register Bull queues — each connects to Redis automatically
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const redisUrl = config.get<string>("REDIS_URL");
        const redisConfig = redisUrl
          ? { url: redisUrl }
          : {
              host: config.get<string>("REDIS_HOST", "redis"),
              port: Number(config.get<string>("REDIS_PORT", "6379")),
            };
        return {
          redis: redisConfig,
          defaultJobOptions: {
            removeOnComplete: { age: 86400 },
            removeOnFail: { age: 604800 },
            attempts: 3,
            backoff: { type: "exponential", delay: 5000 },
          },
        };
      },
    }),
    BullModule.registerQueue(
      { name: QUEUE_NAMES.OPTIMIZATION },
      { name: QUEUE_NAMES.CAMPAIGN_SYNC },
      { name: QUEUE_NAMES.REPORTS },
    ),
    AiAgentModule,
    ScheduleModule.forRoot(),
  ],
  providers: [
    QueueService,
    CampaignSyncProcessor,
    OptimizationProcessor,
    ReportProcessor,
    CronService,
  ],
  exports: [QueueService, BullModule, CronService],
})
export class QueueModule {}
