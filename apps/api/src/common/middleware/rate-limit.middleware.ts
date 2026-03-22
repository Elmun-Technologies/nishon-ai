import { ConfigService } from "@nestjs/config";
import { JsonLoggerService } from "../json-logger.service";

type RateLimitBucket = {
  count: number;
  resetAt: number;
};

export function createRateLimitMiddleware(
  configService: ConfigService,
  logger: JsonLoggerService,
) {
  const isEnabled = configService.get<string>("RATE_LIMIT_ENABLED", "true") !== "false";
  const windowMs = Number(configService.get<string>("RATE_LIMIT_WINDOW_MS", "60000"));
  const maxRequests = Number(configService.get<string>("RATE_LIMIT_MAX_REQUESTS", "120"));
  const buckets = new Map<string, RateLimitBucket>();

  setInterval(() => {
    const now = Date.now();
    for (const [ip, bucket] of buckets.entries()) {
      if (bucket.resetAt <= now) {
        buckets.delete(ip);
      }
    }
  }, windowMs).unref();

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
    const now = Date.now();
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
      message: "Rate limit exceeded",
      method: req.method,
      path: req.originalUrl || req.url,
      statusCode: 429,
      requestId: req.requestId,
    });

    res.status(429).json({
      success: false,
      statusCode: 429,
      message: "Too many requests",
      requestId: req.requestId,
      timestamp: new Date().toISOString(),
    });
  };
}
