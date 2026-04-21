import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Logger,
  Post,
  Query,
  UnauthorizedException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { normalizePhoneDigits } from "./retarget-phone.util";
import { RetargetRedisService } from "./retarget-redis.service";
import { RetargetTelegramBotService } from "./retarget-telegram-bot.service";
import { unifiedUserHash } from "./unified-hash.util";
import type { RetargetSignalPayload } from "./retarget-signal.types";

@ApiTags("Telegram / Signal Bridge")
@Controller("api/telegram")
export class TelegramWebhookController {
  private readonly logger = new Logger(TelegramWebhookController.name);

  constructor(
    private readonly config: ConfigService,
    private readonly redis: RetargetRedisService,
    private readonly telegram: RetargetTelegramBotService,
  ) {}

  @Post("webhook")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Telegram Bot webhook — /start phone=998… → Redis telegram:{phone}=chat_id",
    description: "Query `secret` = TELEGRAM_WEBHOOK_SECRET (ixtiyoriy, tavsiya etiladi).",
  })
  async webhook(
    @Query("secret") secret: string | undefined,
    @Body() update: Record<string, unknown>,
  ): Promise<{ ok: true }> {
    const expected = this.config.get<string>("TELEGRAM_WEBHOOK_SECRET", "").trim();
    if (expected && secret !== expected) {
      throw new UnauthorizedException("Noto‘g‘ri webhook secret");
    }

    const msg = update?.message as Record<string, unknown> | undefined;
    const text = typeof msg?.text === "string" ? msg.text : "";
    const chat = msg?.chat as Record<string, unknown> | undefined;
    const chatId = chat?.id != null ? String(chat.id) : null;

    if (text && chatId) {
      const phone = this.parsePhoneFromStart(text);
      if (phone) {
        await this.redis.setTelegramChatId(phone, chatId);
        const existing = await this.redis.getSignal(phone);
        const patch: Partial<RetargetSignalPayload> = {
          telegramChatId: chatId,
          telegramLinkedAt: Date.now(),
          unifiedHash: unifiedUserHash(phone),
        };
        if (existing) {
          await this.redis.setSignal(phone, { ...existing, ...patch });
        }
        try {
          await this.telegram.sendPlain(
            chatId,
            "✅ Telefon raqamingiz ulandi. Retarget takliflari shu chatga ham keladi.",
          );
        } catch (e) {
          this.logger.warn(`Telegram javob xatosi: ${(e as Error).message}`);
        }
        this.logger.log({ message: "Telegram ↔ telefon bog‘landi", phone, chatId });
      }
    }

    return { ok: true };
  }

  private parsePhoneFromStart(text: string): string | null {
    const t = text.trim();
    const lower = t.toLowerCase();
    if (!lower.startsWith("/start")) return null;
    const rest = t.slice("/start".length).trim();
    if (!rest) return null;
    const mEq = rest.match(/phone\s*=\s*(\+?\d+)/i);
    if (mEq?.[1]) return normalizePhoneDigits(mEq[1]);
    const mU = rest.match(/phone_(\d+)/i);
    if (mU?.[1]) return normalizePhoneDigits(mU[1]);
    const digits = normalizePhoneDigits(rest);
    if (digits.length >= 9) {
      if (digits.startsWith("998")) return digits;
      if (digits.length === 9) return `998${digits}`;
      return digits;
    }
    return null;
  }
}
