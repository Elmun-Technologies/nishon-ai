import {
  Controller,
  Get,
  ServiceUnavailableException,
} from "@nestjs/common";
import { HealthService } from "./health.service";

@Controller()
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get("health")
  async getHealth() {
    const isDatabaseConnected = await this.healthService.checkDatabase();
    const isRedisConnected = await this.healthService.checkRedis();

    return {
      status: isDatabaseConnected && isRedisConnected ? "ok" : "degraded",
      database: isDatabaseConnected ? "connected" : "disconnected",
      redis: isRedisConnected ? "connected" : "disconnected",
      timestamp: new Date().toISOString(),
    };
  }

  @Get("ready")
  async getReadiness() {
    const [isDatabaseConnected, isRedisConnected] = await Promise.all([
      this.healthService.checkDatabase(),
      this.healthService.checkRedis(),
    ]);

    if (!isDatabaseConnected || !isRedisConnected) {
      throw new ServiceUnavailableException("Service is not ready");
    }

    return {
      status: "ok",
      database: "connected",
      redis: "connected",
      timestamp: new Date().toISOString(),
    };
  }

  @Get("live")
  getLiveness() {
    return {
      status: "ok",
      timestamp: new Date().toISOString(),
    };
  }
}
