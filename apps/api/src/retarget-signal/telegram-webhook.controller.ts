import {
  BadRequestException,
  Body,
  Controller,
  Get,
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
    summary:
      "Telegram Bot webhook — /start phone=998… → Redis telegram:{phone}=chat_id",
    description:
      "Query `secret` = TELEGRAM_WEBHOOK_SECRET (ixtiyoriy, tavsiya etiladi).",
  })
  async webhook(
    @Query("secret") secret: string | undefined,
    @Body() update: Record<string, unknown>,
  ): Promise<{ ok: true }> {
    const expected = this.config
      .get<string>("TELEGRAM_WEBHOOK_SECRET", "")
      .trim();
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
        this.logger.log({
          message: "Telegram ↔ telefon bog‘landi",
          phone,
          chatId,
        });
      }
    }

    return { ok: true };
  }

  /**
   * Cross-instance bridge for the digest linking flow. The Next.js web app's
   * /start webhook records token→chat_id here (Redis), and its status poll
   * reads it back — because those two requests may land on different serverless
   * instances, an in-process map on the web side silently loses the link.
   */
  @Post("link/complete")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Store a deep-link token → chat_id (digest linking)",
  })
  async linkComplete(
    @Query("secret") secret: string | undefined,
    @Body() body: { token?: string; chatId?: string },
  ): Promise<{ ok: true }> {
    this.assertSecret(secret);
    const token = (body?.token ?? "").trim();
    const chatId = (body?.chatId ?? "").trim();
    if (!token || !chatId) {
      throw new BadRequestException("token va chatId kerak");
    }
    await this.redis.setLinkTokenChatId(token, chatId);
    return { ok: true };
  }

  @Get("link/status")
  @ApiOperation({ summary: "Read the chat_id linked to a deep-link token" })
  async linkStatus(
    @Query("secret") secret: string | undefined,
    @Query("token") token: string | undefined,
  ): Promise<{ ok: true; status: "linked" | "missing"; chatId?: string }> {
    this.assertSecret(secret);
    const t = (token ?? "").trim();
    if (!t) throw new BadRequestException("token kerak");
    const chatId = await this.redis.getLinkTokenChatId(t);
    return chatId
      ? { ok: true, status: "linked", chatId }
      : { ok: true, status: "missing" };
  }

  /** Enforce the shared webhook secret only when one is configured. */
  private assertSecret(secret: string | undefined): void {
    const expected = this.config
      .get<string>("TELEGRAM_WEBHOOK_SECRET", "")
      .trim();
    if (expected && (secret ?? "").trim() !== expected) {
      throw new UnauthorizedException("Noto‘g‘ri webhook secret");
    }
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
