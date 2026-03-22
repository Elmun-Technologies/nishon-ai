import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { ConfigService } from "@nestjs/config";
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
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const databaseUrl = config.get<string>("DATABASE_URL");

        return {
          type: "postgres" as const,
          ...(databaseUrl
            ? { url: databaseUrl }
            : {
                host: config.get<string>("DATABASE_HOST", "postgres"),
                port: Number(config.get<string>("DATABASE_PORT", "5432")),
                username: config.get<string>("DATABASE_USERNAME", "nishon"),
                password: config.get<string>("DATABASE_PASSWORD", "nishon_secret"),
                database: config.get<string>("DATABASE_NAME", "nishon_ai_db"),
              }),
          entities: [__dirname + "/**/*.entity{.ts,.js}"],
          synchronize: config.get<string>("NODE_ENV") !== "production",
          logging: config.get<string>("NODE_ENV") === "development",
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
