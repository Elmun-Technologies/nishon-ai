import { ConfigService } from "@nestjs/config";
import { JsonLoggerService } from "../json-logger.service";
import { createClient } from "redis";
import type { RedisClientType } from "redis";

export async function createRateLimitMiddleware(
  configService: ConfigService,
  logger: JsonLoggerService,
) {
  const isEnabled = configService.get<string>("RATE_LIMIT_ENABLED", "true") !== "false";
  const windowMs = Number(configService.get<string>("RATE_LIMIT_WINDOW_MS", "60000"));
  const maxRequests = Number(configService.get<string>("RATE_LIMIT_MAX_REQUESTS", "120"));

  let redisClient: ReturnType<typeof createClient> | null = null;
  let useRedis = false;

  // Try to connect to Redis for distributed rate limiting
  try {
    const redisUrl = configService.get<string>("REDIS_URL");
    if (redisUrl) {
      redisClient = createClient({ url: redisUrl });
      await redisClient.connect();
      useRedis = true;
      logger.log({
        message: "Rate limiting: Connected to Redis (distributed)",
        service: "RateLimit",
      });
    }
  } catch (error) {
    // Fallback to in-memory if Redis unavailable
    logger.warn({
      message: "Rate limiting: Redis unavailable, falling back to in-memory",
      error: error instanceof Error ? error.message : String(error),
      service: "RateLimit",
    });
  }

  // In-memory fallback
  type RateLimitBucket = {
    count: number;
    resetAt: number;
  };
  const buckets = new Map<string, RateLimitBucket>();

  // Cleanup interval for in-memory buckets
  const cleanupInterval = setInterval(() => {
    const now = Date.now();
    for (const [ip, bucket] of buckets.entries()) {
      if (bucket.resetAt <= now) {
        buckets.delete(ip);
      }
    }
  }, windowMs);
  cleanupInterval.unref();

  return (
    req: {
      ip?: string;
      socket?: { remoteAddress?: string };
      method: string;
      originalUrl?: string;
      url: string;
      requestId?: string;
    },
    res: {
      setHeader: (name: string, value: string | number) => void;
      status: (code: number) => { json: (payload: unknown) => void };
    },
    next: () => void,
  ) => {
    if (!isEnabled) {
      next();
      return;
    }

    const ip = req.ip || req.socket?.remoteAddress || "unknown";
    const key = `rate-limit:${ip}`;
    const now = Date.now();

    // Use Redis if available, otherwise in-memory
    if (useRedis && redisClient) {
      redisClient.incr(key).then((count) => {
        // Set TTL on first request in window
        if (count === 1) {
          redisClient!.expire(key, Math.ceil(windowMs / 1000));
        }

        const remaining = Math.max(maxRequests - count, 0);
        res.setHeader("X-RateLimit-Limit", maxRequests);
        res.setHeader("X-RateLimit-Remaining", remaining);

        if (count <= maxRequests) {
          next();
          return;
        }

        const retryAfterSeconds = Math.ceil(windowMs / 1000);
        res.setHeader("Retry-After", retryAfterSeconds);

        logger.warn({
          message: "Rate limit exceeded",
          method: req.method,
          path: req.originalUrl || req.url,
          statusCode: 429,
          requestId: req.requestId,
          ip,
          count,
        });

        res.status(429).json({
          success: false,
          statusCode: 429,
          message: "Too many requests",
          requestId: req.requestId,
          timestamp: new Date().toISOString(),
        });
      }).catch((error) => {
        // On Redis error, allow request to proceed
        logger.warn({
          message: "Rate limit check failed (Redis error), allowing request",
          error: error instanceof Error ? error.message : String(error),
          requestId: req.requestId,
        });
        next();
      });
    } else {
      // Fallback to in-memory
      const existing = buckets.get(ip);

      if (!existing || existing.resetAt <= now) {
        buckets.set(ip, { count: 1, resetAt: now + windowMs });
        res.setHeader("X-RateLimit-Limit", maxRequests);
        res.setHeader("X-RateLimit-Remaining", maxRequests - 1);
        next();
        return;
      }

      existing.count += 1;
      const remaining = Math.max(maxRequests - existing.count, 0);
      res.setHeader("X-RateLimit-Limit", maxRequests);
      res.setHeader("X-RateLimit-Remaining", remaining);

      if (existing.count <= maxRequests) {
        next();
        return;
      }

      const retryAfterSeconds = Math.max(Math.ceil((existing.resetAt - now) / 1000), 1);
      res.setHeader("Retry-After", retryAfterSeconds);

      logger.warn({
        message: "Rate limit exceeded (in-memory fallback)",
        method: req.method,
        path: req.originalUrl || req.url,
        statusCode: 429,
        requestId: req.requestId,
        ip,
        count: existing.count,
      });

      res.status(429).json({
        success: false,
        statusCode: 429,
        message: "Too many requests",
        requestId: req.requestId,
        timestamp: new Date().toISOString(),
      });
    }
  };
}
