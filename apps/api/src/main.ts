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
    .setTitle("Performa API")
    .setDescription("API for Performa autonomous advertising platform")
    .setVersion("1.0")
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup("api", app, document);

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
