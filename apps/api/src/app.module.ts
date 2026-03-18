import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
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

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ".env",
    }),
    TypeOrmModule.forRoot({
      type: "postgres",
      host: process.env.DATABASE_HOST || "localhost",
      port: parseInt(process.env.DATABASE_PORT) || 5432,
      username: process.env.DATABASE_USERNAME || "nishon",
      password: process.env.DATABASE_PASSWORD || "nishon_secret",
      database: process.env.DATABASE_NAME || "nishon_ai_db",
      entities: [__dirname + "/**/*.entity{.ts,.js}"],
      synchronize: process.env.NODE_ENV !== "production",
      logging: process.env.NODE_ENV === "development",
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
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
