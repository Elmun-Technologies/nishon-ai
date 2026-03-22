import { Injectable, OnApplicationShutdown } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { createClient, RedisClientType } from "redis";

@Injectable()
export class RedisHealthService implements OnApplicationShutdown {
  private client: RedisClientType | null = null;
  private connecting: Promise<void> | null = null;

  constructor(private readonly config: ConfigService) {}

  async ping(): Promise<boolean> {
    try {
      const client = await this.getClient();
      const pong = await Promise.race([
        client.ping(),
        new Promise<string>((_, reject) =>
          setTimeout(() => reject(new Error("Redis ping timeout")), 1000),
        ),
      ]);

      return pong === "PONG";
    } catch {
      return false;
    }
  }

  async onApplicationShutdown(): Promise<void> {
    if (this.client) {
      await this.client.quit().catch(() => this.client?.disconnect());
      this.client = null;
    }
  }

  private async getClient(): Promise<RedisClientType> {
    if (this.client?.isOpen) {
      return this.client;
    }

    if (!this.client) {
      const redisUrl = this.config.get<string>("REDIS_URL", "");
      const redisHost = this.config.get<string>("REDIS_HOST", "redis");
      const redisPort = this.config.get<string>("REDIS_PORT", "6379");
      const url = redisUrl || `redis://${redisHost}:${redisPort}`;

      this.client = createClient({
        url,
        socket: {
          reconnectStrategy: false,
        },
      });
    }

    if (!this.client.isOpen) {
      this.connecting ??= this.client
        .connect()
        .then(() => undefined)
        .finally(() => {
          this.connecting = null;
        });
      await this.connecting;
    }

    return this.client;
  }
}
