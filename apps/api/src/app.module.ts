import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { ConfigService } from "@nestjs/config";
import { ScheduleModule } from "@nestjs/schedule";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AuthModule } from "./auth/auth.module";
import { WorkspacesModule } from "./workspaces/workspaces.module";
import { CampaignsModule } from "./campaigns/campaigns.module";
import { PlatformsModule } from "./platforms/platforms.module";
import { AiAgentModule } from "./ai-agent/ai-agent.module";
import { BudgetModule } from "./budget/budget.module";
import { AnalyticsModule } from "./analytics/analytics.module";
import { AiDecisionsModule } from "./ai-decisions/ai-decisions.module";
import { QueueModule } from "./queue/queue.module";
import { MetaModule } from "./meta/meta.module";
import { EventsModule } from "./events/events.module";
import { AutoOptimizationModule } from "./auto-optimization/auto-optimization.module";
import { TriggersetModule } from "./triggersets/triggersets.module";
import { ConversionsModule } from "./conversions/conversions.module";
import { LandingPagesModule } from "./landing-pages/landing-pages.module";
import { AgentsModule } from "./agents/agents.module";
import { TeamInvitesModule } from "./team-invites/team-invites.module";
import { BillingModule } from "./billing/billing.module";
import { LaunchOrchestratorModule } from "./launch-orchestrator/launch-orchestrator.module";
import { WorkspaceServiceModule } from "./workspace-service/workspace-service.module";
import { IntegrationsModule } from "./integrations/integrations.module";
import { validateEnv } from "./config/env.validation";
import { HealthController } from "./health/health.controller";
import { HealthService } from "./health/health.service";
import { RedisHealthService } from "./health/redis-health.service";
import { RequestContextService } from "./common/request-context.service";
import { JsonLoggerService } from "./common/json-logger.service";
import { GlobalExceptionFilter } from "./common/filters/global-exception.filter";
import { RequestLoggingInterceptor } from "./common/interceptors/request-logging.interceptor";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ".env",
      validate: validateEnv,
    }),
    ScheduleModule.forRoot(),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const databaseUrl = config.get<string>("DATABASE_URL");

        const isProduction = config.get<string>("NODE_ENV") === "production";

        return {
          type: "postgres" as const,
          ...(databaseUrl
            ? { url: databaseUrl }
            : {
                host: config.get<string>("DATABASE_HOST", "postgres"),
                port: Number(config.get<string>("DATABASE_PORT", "5432")),
                username: config.get<string>("DATABASE_USERNAME", "performa"),
                password: config.get<string>("DATABASE_PASSWORD", "performa_secret"),
                database: config.get<string>("DATABASE_NAME", "performa_ai_db"),
              }),
          ssl: (isProduction || databaseUrl) ? { rejectUnauthorized: false } : false,
          entities: [__dirname + "/**/*.entity{.ts,.js}"],
          synchronize: config.get<string>('TYPEORM_SYNCHRONIZE', String(!isProduction)) === 'true',
          logging: !isProduction,
        };
      },
    }),
    AuthModule,
    WorkspacesModule,
    CampaignsModule,
    PlatformsModule,
    AiAgentModule,
    BudgetModule,
    AnalyticsModule,
    AiDecisionsModule,
    QueueModule,
    MetaModule,
    EventsModule,
    AutoOptimizationModule,
    TriggersetModule,
    ConversionsModule,
    LandingPagesModule,
    AgentsModule,
    TeamInvitesModule,
    BillingModule,
    LaunchOrchestratorModule,
    WorkspaceServiceModule,
    IntegrationsModule,
  ],
  controllers: [HealthController],
  providers: [
    HealthService,
    RedisHealthService,
    RequestContextService,
    JsonLoggerService,
    GlobalExceptionFilter,
    RequestLoggingInterceptor,
  ],
})
export class AppModule {}
