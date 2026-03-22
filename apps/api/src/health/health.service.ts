import { Injectable } from "@nestjs/common";
import { DataSource } from "typeorm";
import { RedisHealthService } from "./redis-health.service";

@Injectable()
export class HealthService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly redisHealthService: RedisHealthService,
  ) {}

  async checkDatabase(): Promise<boolean> {
    if (!this.dataSource.isInitialized) {
      return false;
    }

    await this.dataSource.query("SELECT 1");
    return true;
  }

  async checkRedis(): Promise<boolean> {
    return this.redisHealthService.ping();
  }
}
