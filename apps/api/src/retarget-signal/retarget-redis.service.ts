import { Injectable, Logger, OnApplicationShutdown } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { createClient, type RedisClientType } from "redis";
import type { RetargetSignalPayload } from "./retarget-signal.types";
import {
  RETARGET_KEY_PREFIX,
  TELEGRAM_LINK_PREFIX,
  TELEGRAM_LINK_TTL_SEC,
  THIRTY_DAYS_SEC,
} from "./retarget-signal.types";

@Injectable()
export class RetargetRedisService implements OnApplicationShutdown {
  private readonly logger = new Logger(RetargetRedisService.name);
  private client: RedisClientType | null = null;
  private connecting: Promise<void> | null = null;

  constructor(private readonly config: ConfigService) {}

  async onApplicationShutdown(): Promise<void> {
    if (this.client?.isOpen) {
      await this.client.quit().catch(() => this.client?.disconnect());
      this.client = null;
    }
  }

  keyForPhone(phoneDigits: string): string {
    return `${RETARGET_KEY_PREFIX}${phoneDigits}`;
  }

  telegramKey(phoneDigits: string): string {
    return `${TELEGRAM_LINK_PREFIX}${phoneDigits}`;
  }

  async setTelegramChatId(phoneDigits: string, chatId: string): Promise<void> {
    const client = await this.getClient();
    await client.set(this.telegramKey(phoneDigits), chatId, { EX: TELEGRAM_LINK_TTL_SEC });
    this.logger.log({ message: "Telegram chat_id Redis ga yozildi", phoneDigits });
  }

  async getTelegramChatId(phoneDigits: string): Promise<string | null> {
    const client = await this.getClient();
    const v = await client.get(this.telegramKey(phoneDigits));
    return v ?? null;
  }

  /** `telegram:998...` → chat_id */
  async listTelegramLinks(): Promise<Map<string, string>> {
    const client = await this.getClient();
    const map = new Map<string, string>();
    try {
      for await (const key of client.scanIterator({ MATCH: `${TELEGRAM_LINK_PREFIX}*`, COUNT: 200 })) {
        const raw = await client.get(key);
        if (!raw) continue;
        const phone = key.slice(TELEGRAM_LINK_PREFIX.length);
        map.set(phone, raw);
      }
    } catch (e) {
      this.logger.warn(`Telegram link scan: ${(e as Error).message}`);
    }
    return map;
  }

  async setSignal(phoneDigits: string, payload: RetargetSignalPayload): Promise<void> {
    const client = await this.getClient();
    const key = this.keyForPhone(phoneDigits);
    await client.set(key, JSON.stringify(payload), { EX: THIRTY_DAYS_SEC });
  }

  async getSignal(phoneDigits: string): Promise<RetargetSignalPayload | null> {
    const client = await this.getClient();
    const raw = await client.get(this.keyForPhone(phoneDigits));
    if (!raw) return null;
    try {
      return JSON.parse(raw) as RetargetSignalPayload;
    } catch {
      return null;
    }
  }

  async listAllSignals(): Promise<Array<{ phone: string; payload: RetargetSignalPayload }>> {
    const client = await this.getClient();
    const out: Array<{ phone: string; payload: RetargetSignalPayload }> = [];
    try {
      for await (const key of client.scanIterator({ MATCH: `${RETARGET_KEY_PREFIX}*`, COUNT: 200 })) {
        const raw = await client.get(key);
        if (!raw) continue;
        try {
          const payload = JSON.parse(raw) as RetargetSignalPayload;
          const phone = key.slice(RETARGET_KEY_PREFIX.length);
          out.push({ phone, payload });
        } catch {
          continue;
        }
      }
    } catch (e) {
      this.logger.warn(`Redis scan: ${(e as Error).message}`);
    }
    return out;
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
        socket: { reconnectStrategy: false },
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
