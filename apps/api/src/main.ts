import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { ValidationPipe } from "@nestjs/common";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { ConfigService } from "@nestjs/config";
import { GlobalExceptionFilter } from "./common/filters/global-exception.filter";
import { JsonLoggerService } from "./common/json-logger.service";
import { RequestContextService } from "./common/request-context.service";
import { createRequestIdMiddleware } from "./common/middleware/request-id.middleware";
import { RequestLoggingInterceptor } from "./common/interceptors/request-logging.interceptor";
import { createRateLimitMiddleware } from "./common/middleware/rate-limit.middleware";
import { DataSource } from "typeorm";
import { IoAdapter } from "@nestjs/platform-socket.io";
import helmet from "helmet";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const logger = app.get(JsonLoggerService);
  app.useLogger(logger);

  // Enable Socket.IO WebSocket adapter
  app.useWebSocketAdapter(new IoAdapter(app));

  const configService = app.get(ConfigService);
  const requestContext = app.get(RequestContextService);
  const globalExceptionFilter = app.get(GlobalExceptionFilter);
  const requestLoggingInterceptor = app.get(RequestLoggingInterceptor);
  const dataSource = app.get(DataSource);

  app.useGlobalFilters(globalExceptionFilter);
  app.useGlobalInterceptors(requestLoggingInterceptor);
  app.enableShutdownHooks();

  app.use(helmet());
  app.getHttpAdapter().getInstance().set("trust proxy", 1);
  app.use(createRequestIdMiddleware(requestContext));
  app.use(createRateLimitMiddleware(configService, logger));

  const nodeEnv = configService.get<string>("NODE_ENV", "development");
  const port = Number(configService.get<string>("PORT", "3001"));
  const apiBaseUrl = configService.get<string>("API_BASE_URL", `http://0.0.0.0:${port}`);
  const frontendOrigins = configService
    .get<string>("FRONTEND_URL", "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

  const wildcardOrigins = frontendOrigins
    .filter((origin) => origin.startsWith("*."))
    .map((origin) => origin.slice(1)); // ".vercel.app"
  const exactOrigins = frontendOrigins.filter((origin) => !origin.startsWith("*."));

  // Enable CORS
  app.enableCors({
    origin: (origin, callback) => {
      if (frontendOrigins.length === 0) return callback(null, true);
      if (!origin) return callback(null, true);
      if (exactOrigins.includes(origin)) return callback(null, true);

      const matchesWildcard = wildcardOrigins.some((wildcard) => origin.endsWith(wildcard));
      if (matchesWildcard) return callback(null, true);

      return callback(new Error(`CORS blocked for origin: ${origin}`), false);
    },
    credentials: true,
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Swagger setup
  const config = new DocumentBuilder()
    .setTitle("AdSpectr API")
    .setDescription("API for AdSpectr autonomous advertising platform")
    .setVersion("1.0")
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup("api", app, document);

  if (nodeEnv === "production") {
    // Idempotent schema repair — runs before the server accepts traffic so the
    // very first request after deploy never hits a missing-column error.
    // Every ADD COLUMN uses EXCEPTION WHEN OTHERS so if the column already exists
    // (or has a type conflict) the block silently continues instead of aborting.
    try {
      // ── users ──────────────────────────────────────────────────────────────
      await dataSource.query(`
        DO $$ BEGIN
          BEGIN ALTER TABLE "users" ADD COLUMN "google_id"         VARCHAR(255) NULL;                    EXCEPTION WHEN OTHERS THEN NULL; END;
          BEGIN ALTER TABLE "users" ADD COLUMN "facebook_id"       VARCHAR(255) NULL;                    EXCEPTION WHEN OTHERS THEN NULL; END;
          BEGIN ALTER TABLE "users" ADD COLUMN "picture"           TEXT         NULL;                    EXCEPTION WHEN OTHERS THEN NULL; END;
          BEGIN ALTER TABLE "users" ADD COLUMN "refresh_token"     TEXT         NULL;                    EXCEPTION WHEN OTHERS THEN NULL; END;
          BEGIN ALTER TABLE "users" ADD COLUMN "is_email_verified" BOOLEAN      NOT NULL DEFAULT false;  EXCEPTION WHEN OTHERS THEN NULL; END;
          BEGIN ALTER TABLE "users" ADD COLUMN "is_admin"          BOOLEAN      NOT NULL DEFAULT false;  EXCEPTION WHEN OTHERS THEN NULL; END;
          BEGIN ALTER TABLE "users" ADD COLUMN "trial_ends_at"     TIMESTAMP    NULL;                    EXCEPTION WHEN OTHERS THEN NULL; END;
          BEGIN ALTER TABLE "users" ADD COLUMN "created_at"        TIMESTAMP    NOT NULL DEFAULT NOW();  EXCEPTION WHEN OTHERS THEN NULL; END;
          BEGIN ALTER TABLE "users" ADD COLUMN "updated_at"        TIMESTAMP    NOT NULL DEFAULT NOW();  EXCEPTION WHEN OTHERS THEN NULL; END;
          BEGIN ALTER TABLE "users" ALTER COLUMN "password" DROP NOT NULL;                               EXCEPTION WHEN OTHERS THEN NULL; END;
        END $$;
      `);
      await dataSource.query(`
        UPDATE "users" SET "trial_ends_at" = NOW() + INTERVAL '7 days'
        WHERE "plan"::text = 'free' AND "trial_ends_at" IS NULL;
      `);
      logger.log({ message: "users schema repair: OK", context: "Bootstrap" });

      // ── workspaces ─────────────────────────────────────────────────────────
      await dataSource.query(`
        DO $$ BEGIN
          BEGIN ALTER TABLE "workspaces" ADD COLUMN "product_description"  TEXT         NULL;                       EXCEPTION WHEN OTHERS THEN NULL; END;
          BEGIN ALTER TABLE "workspaces" ADD COLUMN "target_audience"      TEXT         NULL;                       EXCEPTION WHEN OTHERS THEN NULL; END;
          BEGIN ALTER TABLE "workspaces" ADD COLUMN "monthly_budget"       DECIMAL(10,2) NULL;                      EXCEPTION WHEN OTHERS THEN NULL; END;
          BEGIN ALTER TABLE "workspaces" ADD COLUMN "ai_strategy"          JSONB        NULL;                       EXCEPTION WHEN OTHERS THEN NULL; END;
          BEGIN ALTER TABLE "workspaces" ADD COLUMN "is_onboarding_complete" BOOLEAN    NOT NULL DEFAULT false;     EXCEPTION WHEN OTHERS THEN NULL; END;
          BEGIN ALTER TABLE "workspaces" ADD COLUMN "optimization_policy"  JSONB        NULL;                       EXCEPTION WHEN OTHERS THEN NULL; END;
          BEGIN ALTER TABLE "workspaces" ADD COLUMN "target_location"      VARCHAR(100) NOT NULL DEFAULT 'Uzbekistan'; EXCEPTION WHEN OTHERS THEN NULL; END;
          BEGIN ALTER TABLE "workspaces" ADD COLUMN "telegram_chat_id"     VARCHAR(64)  NULL;                       EXCEPTION WHEN OTHERS THEN NULL; END;
          BEGIN ALTER TABLE "workspaces" ADD COLUMN "service_type"         VARCHAR(20)  NOT NULL DEFAULT 'self';    EXCEPTION WHEN OTHERS THEN NULL; END;
          BEGIN ALTER TABLE "workspaces" ADD COLUMN "assigned_agent_id"    VARCHAR      NULL;                       EXCEPTION WHEN OTHERS THEN NULL; END;
          BEGIN ALTER TABLE "workspaces" ADD COLUMN "created_at"           TIMESTAMP    NOT NULL DEFAULT NOW();     EXCEPTION WHEN OTHERS THEN NULL; END;
          BEGIN ALTER TABLE "workspaces" ADD COLUMN "updated_at"           TIMESTAMP    NOT NULL DEFAULT NOW();     EXCEPTION WHEN OTHERS THEN NULL; END;
          BEGIN ALTER TABLE "workspaces" ADD COLUMN "user_id"              UUID         NULL;                       EXCEPTION WHEN OTHERS THEN NULL; END;
        END $$;
      `);
      logger.log({ message: "workspaces schema repair: OK", context: "Bootstrap" });

      // ── connected_accounts ─────────────────────────────────────────────────
      await dataSource.query(`
        DO $$ BEGIN
          BEGIN ALTER TABLE "connected_accounts" ADD COLUMN "token_expires_at"     TIMESTAMP    NULL;                   EXCEPTION WHEN OTHERS THEN NULL; END;
          BEGIN ALTER TABLE "connected_accounts" ADD COLUMN "tracking_started_at"  TIMESTAMP    NULL;                   EXCEPTION WHEN OTHERS THEN NULL; END;
          BEGIN ALTER TABLE "connected_accounts" ADD COLUMN "is_active"            BOOLEAN      NOT NULL DEFAULT true;  EXCEPTION WHEN OTHERS THEN NULL; END;
          BEGIN ALTER TABLE "connected_accounts" ADD COLUMN "created_at"           TIMESTAMP    NOT NULL DEFAULT NOW(); EXCEPTION WHEN OTHERS THEN NULL; END;
          BEGIN ALTER TABLE "connected_accounts" ADD COLUMN "updated_at"           TIMESTAMP    NOT NULL DEFAULT NOW(); EXCEPTION WHEN OTHERS THEN NULL; END;
        END $$;
      `);
      logger.log({ message: "connected_accounts schema repair: OK", context: "Bootstrap" });

      // ── budgets ────────────────────────────────────────────────────────────
      await dataSource.query(`
        DO $$ BEGIN
          BEGIN ALTER TABLE "budgets" ADD COLUMN "platform_split"  JSONB        NULL;                        EXCEPTION WHEN OTHERS THEN NULL; END;
          BEGIN ALTER TABLE "budgets" ADD COLUMN "auto_rebalance"  BOOLEAN      NOT NULL DEFAULT true;       EXCEPTION WHEN OTHERS THEN NULL; END;
          BEGIN ALTER TABLE "budgets" ADD COLUMN "created_at"      TIMESTAMP    NOT NULL DEFAULT NOW();      EXCEPTION WHEN OTHERS THEN NULL; END;
          BEGIN ALTER TABLE "budgets" ADD COLUMN "updated_at"      TIMESTAMP    NOT NULL DEFAULT NOW();      EXCEPTION WHEN OTHERS THEN NULL; END;
          BEGIN ALTER TABLE "budgets" ADD COLUMN "workspace_id"    UUID         NULL;                        EXCEPTION WHEN OTHERS THEN NULL; END;
        END $$;
      `);
      logger.log({ message: "budgets schema repair: OK", context: "Bootstrap" });

    } catch (e) {
      logger.error({
        message: "schema repair failed — login or workspaces may break",
        context: "Bootstrap",
        error: e instanceof Error ? e.message : String(e),
      });
    }
  }

  await app.listen(port);

  const redisHost = configService.get<string>("REDIS_HOST", "redis");
  const redisPort = configService.get<string>("REDIS_PORT", "6379");
  const isDatabaseConnected = dataSource.isInitialized;

  logger.log({ message: "Startup complete", context: "Bootstrap" });
  logger.log({ message: `Environment: ${nodeEnv}`, context: "Bootstrap" });
  logger.log({ message: `API base URL: ${apiBaseUrl}`, context: "Bootstrap" });
  logger.log(
    {
      message: `CORS origins: ${frontendOrigins.length > 0 ? frontendOrigins.join(", ") : "all"}`,
      context: "Bootstrap",
    },
  );
  logger.log({
    message: `Database: ${isDatabaseConnected ? "connected" : "not connected"}`,
    context: "Bootstrap",
  });
  logger.log({
    message: `Redis: configured (${redisHost}:${redisPort})`,
    context: "Bootstrap",
  });
  logger.log({ message: `Swagger documentation: ${apiBaseUrl}/api`, context: "Bootstrap" });

  const gracefulShutdown = async (signal: string) => {
    logger.log({ message: `Received ${signal}, starting graceful shutdown`, context: "Bootstrap" });
    await app.close();
    logger.log({ message: "Graceful shutdown complete", context: "Bootstrap" });
    process.exit(0);
  };

  process.once("SIGTERM", () => {
    void gracefulShutdown("SIGTERM");
  });
  process.once("SIGINT", () => {
    void gracefulShutdown("SIGINT");
  });
}

bootstrap();
