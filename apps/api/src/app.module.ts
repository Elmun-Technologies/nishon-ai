import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { WorkspacesModule } from './workspaces/workspaces.module';
import { CampaignsModule } from './campaigns/campaigns.module';
import { AdSetsModule } from './ad-sets/ad-sets.module';
import { AdsModule } from './ads/ads.module';
import { PlatformsModule } from './platforms/platforms.module';
import { AiAgentModule } from './ai-agent/ai-agent.module';
import { BudgetModule } from './budget/budget.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { AiDecisionsModule } from './ai-decisions/ai-decisions.module';
import { QueueModule } from './queue/queue.module';
import { DatabaseModule } from './database/database.module';

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            envFilePath: '.env'
        }),
        TypeOrmModule.forRoot({
            type: 'postgres',
            host: process.env.DATABASE_HOST || 'localhost',
            port: parseInt(process.env.DATABASE_PORT) || 5432,
            username: process.env.DATABASE_USERNAME || 'nishon',
            password: process.env.DATABASE_PASSWORD || 'nishon_secret',
            database: process.env.DATABASE_NAME || 'nishon_ai_db',
            entities: [__dirname + '/**/*.entity{.ts,.js}'],
            synchronize: process.env.NODE_ENV !== 'production',
            logging: process.env.NODE_ENV === 'development'
        }),
        DatabaseModule,
        AuthModule,
        UsersModule,
        WorkspacesModule,
        CampaignsModule,
        AdSetsModule,
        AdsModule,
        PlatformsModule,
        AiAgentModule,
        BudgetModule,
        AnalyticsModule,
        AiDecisionsModule,
        QueueModule
    ],
    controllers: [],
    providers: [],
})
export class AppModule { }