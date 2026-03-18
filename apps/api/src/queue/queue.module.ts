import { Module } from '@nestjs/common'
import { BullModule } from '@nestjs/bull'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { TypeOrmModule } from '@nestjs/typeorm'
import { ScheduleModule } from '@nestjs/schedule'
import { CampaignSyncProcessor } from './processors/campaign-sync.processor'
import { OptimizationProcessor } from './processors/optimization.processor'
import { ReportProcessor } from './processors/report.processor'
import { QueueService } from './queue.service'
import { CronService } from './cron.service'
import { Workspace } from '../workspaces/entities/workspace.entity'
import { AiAgentModule } from '../ai-agent/ai-agent.module'

// Queue names as constants — avoids typos when adding jobs from other modules
export const QUEUE_NAMES = {
  OPTIMIZATION: 'optimization',
  CAMPAIGN_SYNC: 'campaign-sync',
  REPORTS: 'reports',
} as const

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([Workspace]),
    // Register Bull queues — each connects to Redis automatically
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        redis: {
          host: config.get('REDIS_HOST', 'localhost'),
          port: config.get<number>('REDIS_PORT', 6379),
        },
        defaultJobOptions: {
          // Keep completed jobs for 24 hours for debugging
          removeOnComplete: { age: 86400 },
          // Keep failed jobs for 7 days so we can investigate
          removeOnFail: { age: 604800 },
          attempts: 3,
          backoff: { type: 'exponential', delay: 5000 },
        },
      }),
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