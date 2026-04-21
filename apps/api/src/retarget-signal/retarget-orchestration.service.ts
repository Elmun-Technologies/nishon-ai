import { BadRequestException, Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { InjectQueue } from "@nestjs/bull";
import type { Queue } from "bull";
import type { Request } from "express";
import { QUEUE_NAMES } from "../queue/queue.constants";
import { extractMetaAccessToken } from "../meta/meta-token.util";
import type { CrmClickDto } from "./dto/crm-click.dto";
import type { PublishAdsetDto } from "./dto/publish-adset.dto";
import type { PublishTelegramDto } from "./dto/publish-telegram.dto";
import { resolveRetargetCreativeMapping } from "./retarget-creative-mapping";
import { RetargetMetaPublisherService } from "./retarget-meta-publisher.service";
import { RetargetTelegramBotService } from "./retarget-telegram-bot.service";
import { normalizePhoneDigits } from "./retarget-phone.util";
import { RetargetRedisService } from "./retarget-redis.service";
import {
  RETARGET_MESSAGE_DEFAULT,
  SEVEN_DAYS_MS,
  type RetargetSignalPayload,
  type RetargetSignalStatus,
} from "./retarget-signal.types";
import { unifiedUserHash } from "./unified-hash.util";

@Injectable()
export class RetargetOrchestrationService {
  private readonly logger = new Logger(RetargetOrchestrationService.name);

  constructor(
    private readonly redis: RetargetRedisService,
    private readonly metaPublisher: RetargetMetaPublisherService,
    private readonly telegramBot: RetargetTelegramBotService,
    private readonly config: ConfigService,
    @InjectQueue(QUEUE_NAMES.RETARGET_POST_PURCHASE) private readonly postPurchaseQueue: Queue,
  ) {}

  async handleCrmClick(dto: CrmClickDto): Promise<{ ok: true; phone: string }> {
    const phone = normalizePhoneDigits(dto.phone);
    if (phone.length < 9) {
      throw new BadRequestException("phone noto‘g‘ri");
    }

    const existing = await this.redis.getSignal(phone);
    let status: RetargetSignalStatus = "pending";
    let repeat = existing?.repeatPurchasesAfterRetarget ?? 0;
    let convertedAt = existing?.convertedAt;

    if (existing?.status === "active") {
      repeat += 1;
      convertedAt = Date.now();
      status = "pending";
    }

    const productId = dto.product_id ?? dto.productId ?? existing?.productId;
    const map = resolveRetargetCreativeMapping(productId);
    const tgChat = (await this.redis.getTelegramChatId(phone)) ?? existing?.telegramChatId;
    const uHash = unifiedUserHash(phone);

    const payload: RetargetSignalPayload = {
      campaignId: dto.campaignId ?? existing?.campaignId ?? "camp_default",
      amount: dto.amount,
      lastPurchase: Date.now(),
      productId,
      status,
      activatedAt: existing?.status === "active" ? undefined : existing?.activatedAt,
      convertedAt,
      repeatPurchasesAfterRetarget: repeat,
      messageTemplate: map.primaryText,
      creativeMappingKey: map.key,
      unifiedHash: uHash,
      telegramChatId: tgChat,
      telegramLinkedAt: tgChat ? (existing?.telegramLinkedAt ?? Date.now()) : existing?.telegramLinkedAt,
    };

    await this.redis.setSignal(phone, payload);

    const jobId = `retarget-post-${phone}`;
    const old = await this.postPurchaseQueue.getJob(jobId);
    if (old) {
      await old.remove().catch(() => undefined);
    }

    await this.postPurchaseQueue.add(
      "post-purchase",
      { phone },
      {
        delay: SEVEN_DAYS_MS,
        jobId,
        removeOnComplete: true,
      },
    );

    this.logger.log({ message: "CRM click saqlandi, 7 kunlik retarget rejalashtirildi", phone });
    return { ok: true, phone };
  }

  /**
   * Bull job yoki qo‘lda `/api/retarget/start` — lookalike + kampaniya (hozircha log).
   */
  async runPostPurchaseRetarget(phone: string): Promise<void> {
    const digits = normalizePhoneDigits(phone);
    const signal = await this.redis.getSignal(digits);
    if (!signal) {
      this.logger.warn(`Retarget: signal yo‘q (${digits})`);
      return;
    }
    if (signal.status !== "pending") {
      this.logger.log(`Retarget: ${digits} allaqachon ${signal.status}`);
      return;
    }

    const next: RetargetSignalPayload = {
      ...signal,
      status: "active",
      activatedAt: Date.now(),
    };
    await this.redis.setSignal(digits, next);

    this.logger.log({
      message: "Post-purchase retarget (stub): Lookalike 1% + SMS/Meta",
      phone: digits,
      amount: signal.amount,
      text: signal.messageTemplate ?? RETARGET_MESSAGE_DEFAULT,
    });
  }

  async publishMetaAdset(
    dto: PublishAdsetDto,
    authorization: string | undefined,
    req: Request,
  ): Promise<Record<string, unknown>> {
    const token = extractMetaAccessToken(authorization, req);
    const digits = normalizePhoneDigits(dto.phoneDigits);
    const signal = await this.redis.getSignal(digits);
    if (!signal) {
      throw new BadRequestException("Redis da signal yo‘q — avval CRM click yuboring");
    }
    if (signal.metaAdSetId) {
      return {
        ok: true,
        alreadyPublished: true,
        metaAdSetId: signal.metaAdSetId,
        metaCampaignId: signal.metaCampaignId,
        metaAudienceId: signal.metaAudienceId,
        telegramChannelReady: Boolean(signal.telegramSentAt && !signal.telegramLastError),
      };
    }

    const daysSince = Math.max(0, Math.floor((Date.now() - signal.lastPurchase) / 86_400_000));
    if (signal.status === "pending" && daysSince < 7) {
      throw new BadRequestException(
        `Retarget vaqti hali kelmadi — ${7 - daysSince} kun qoldi (7 kunlik kechikish).`,
      );
    }

    const rule = resolveRetargetCreativeMapping(signal.productId);
    try {
      const result = await this.metaPublisher.publishOneClickRetarget({
        accessToken: token,
        adAccountId: dto.adAccountId,
        pageId: dto.pageId,
        phoneDigits: digits,
        rule,
        linkUrl: dto.linkUrl,
        dailyBudget: dto.dailyBudget,
      });
      let next: RetargetSignalPayload = {
        ...signal,
        metaAudienceId: result.metaAudienceId,
        metaCampaignId: result.metaCampaignId,
        metaAdSetId: result.metaAdSetId,
        metaCreativeId: result.metaCreativeId,
        metaAdId: result.metaAdId,
        creativeMappingKey: result.mappingKey,
        metaPublishError: undefined,
        metaPublishedAt: Date.now(),
        metaChannelReady: true,
        unifiedHash: signal.unifiedHash ?? unifiedUserHash(digits),
      };

      const chatId = next.telegramChatId ?? (await this.redis.getTelegramChatId(digits));
      const sendTg = dto.sendTelegram !== false;
      const shopUrl =
        dto.shopButtonUrl?.trim() ||
        this.config.get<string>("RETARGET_TELEGRAM_SHOP_URL", "https://shop.uz?utm_source=tg_retarget");

      if (sendTg && chatId) {
        try {
          await this.telegramBot.sendRetargetOffer({
            chatId,
            headline: rule.headline,
            discountLine: rule.primaryText.includes("%")
              ? `Bugun ${rule.primaryText.match(/\d+%/)?.[0] ?? "15%"} chegirma faqat siz uchun.`
              : "Bugun maxsus chegirma faqat siz uchun.",
            buttonText: "Buyurtma berish",
            buttonUrl: shopUrl,
          });
          next = {
            ...next,
            telegramChatId: chatId,
            telegramSentAt: Date.now(),
            telegramLastError: undefined,
            telegramChannelReady: true,
          };
        } catch (te: unknown) {
          const tmsg = te instanceof Error ? te.message : String(te);
          this.logger.warn({ message: "Telegram yuborish xatosi", error: tmsg });
          next = {
            ...next,
            telegramLastError: tmsg,
            telegramChannelReady: false,
          };
        }
      }

      await this.redis.setSignal(digits, next);
      return { ok: true, ...result, telegramSent: Boolean(next.telegramSentAt) };
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      await this.redis.setSignal(digits, { ...signal, metaPublishError: msg, metaChannelReady: false });
      throw e;
    }
  }

  async publishTelegramRetarget(dto: PublishTelegramDto): Promise<Record<string, unknown>> {
    const digits = normalizePhoneDigits(dto.phoneDigits);
    const signal = await this.redis.getSignal(digits);
    if (!signal) {
      throw new BadRequestException("Redis da signal yo‘q");
    }
    const daysSince = Math.max(0, Math.floor((Date.now() - signal.lastPurchase) / 86_400_000));
    if (signal.status === "pending" && daysSince < 7) {
      throw new BadRequestException(
        `Retarget vaqti hali kelmadi — ${7 - daysSince} kun qoldi (7 kunlik kechikish).`,
      );
    }
    const chatId = signal.telegramChatId ?? (await this.redis.getTelegramChatId(digits));
    if (!chatId) {
      throw new BadRequestException(
        "Telegram ulanmagan — https://t.me/<bot>?start=phone=998901234567 orqali /start yuboring",
      );
    }
    const rule = resolveRetargetCreativeMapping(signal.productId);
    const shopUrl =
      dto.shopButtonUrl?.trim() ||
      this.config.get<string>("RETARGET_TELEGRAM_SHOP_URL", "https://shop.uz?utm_source=tg_retarget");
    const btn = dto.shopButtonText?.trim() || "Buyurtma berish";
    try {
      await this.telegramBot.sendRetargetOffer({
        chatId,
        headline: rule.headline,
        discountLine: rule.primaryText.includes("%")
          ? `Bugun ${rule.primaryText.match(/\d+%/)?.[0] ?? "15%"} chegirma faqat siz uchun.`
          : "Bugun maxsus chegirma faqat siz uchun.",
        buttonText: btn,
        buttonUrl: shopUrl,
      });
      const next: RetargetSignalPayload = {
        ...signal,
        telegramChatId: chatId,
        telegramSentAt: Date.now(),
        telegramLastError: undefined,
        telegramChannelReady: true,
        unifiedHash: signal.unifiedHash ?? unifiedUserHash(digits),
      };
      await this.redis.setSignal(digits, next);
      return { ok: true, telegramSent: true };
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      await this.redis.setSignal(digits, { ...signal, telegramLastError: msg, telegramChannelReady: false });
      throw e;
    }
  }

  async getDashboardPayload() {
    const rows = await this.redis.listAllSignals();
    const telegramLinks = await this.redis.listTelegramLinks();
    const now = Date.now();
    const MS_DAY = 86_400_000;

    let waiting = 0;
    let active = 0;
    let converted = 0;
    let activatedEver = 0;

    const list = rows.map(({ phone, payload }) => {
      const daysSincePurchase = Math.max(0, Math.floor((now - payload.lastPurchase) / MS_DAY));
      if (payload.status === "pending" && daysSincePurchase < 7) {
        waiting += 1;
      }
      if (payload.status === "active") active += 1;
      if ((payload.repeatPurchasesAfterRetarget ?? 0) > 0) converted += 1;
      if (payload.activatedAt) activatedEver += 1;

      const rule = resolveRetargetCreativeMapping(payload.productId);
      const daysLeftUntilRetarget = Math.max(0, 7 - daysSincePurchase);
      const waitLabel =
        payload.status === "pending" && daysSincePurchase < 7
          ? `${daysLeftUntilRetarget} kun kutilmoqda`
          : undefined;
      const canPublishAdSet =
        !payload.metaAdSetId && (daysSincePurchase >= 7 || payload.status === "active");
      const chatId = payload.telegramChatId ?? telegramLinks.get(phone);
      const telegramLinked = Boolean(chatId);
      const metaChannelReady = Boolean(payload.metaAdSetId);
      const telegramChannelReady = Boolean(payload.telegramSentAt && !payload.telegramLastError);
      const unifiedBadge = telegramLinked && metaChannelReady && telegramChannelReady;

      return {
        phone: formatPhoneDisplay(phone),
        phoneDigits: phone,
        amount: payload.amount,
        daysSincePurchase,
        status: payload.status,
        lastPurchase: payload.lastPurchase,
        campaignId: payload.campaignId,
        repeatPurchasesAfterRetarget: payload.repeatPurchasesAfterRetarget ?? 0,
        productId: payload.productId ?? "—",
        headlinePreview: rule.headline,
        creativeMappingKey: payload.creativeMappingKey ?? rule.key,
        metaAdSetId: payload.metaAdSetId,
        metaPublishError: payload.metaPublishError,
        waitLabel,
        canPublishAdSet,
        unifiedHash: payload.unifiedHash ?? unifiedUserHash(phone),
        telegramLinked,
        metaChannelReady,
        telegramChannelReady,
        telegramLastError: payload.telegramLastError,
        unifiedBadge,
        canPublishTelegram:
          telegramLinked && Boolean(daysSincePurchase >= 7 || payload.status === "active"),
      };
    });

    const convertRate =
      activatedEver > 0
        ? Math.round((converted / Math.max(1, activatedEver)) * 100)
        : rows.length > 0
          ? Math.round((converted / Math.max(1, rows.length)) * 100)
          : 0;

    return {
      summary: {
        waitingSignals: waiting,
        activeRetargets: active,
        converted,
        convertRatePct: convertRate,
      },
      rows: list.sort((a, b) => b.lastPurchase - a.lastPurchase),
    };
  }
}

function formatPhoneDisplay(digits: string): string {
  if (digits.startsWith("998") && digits.length === 12) {
    return `+${digits.slice(0, 3)} ${digits.slice(3, 5)} ${digits.slice(5, 8)} ${digits.slice(8, 10)} ${digits.slice(10)}`;
  }
  return digits.startsWith("+") ? digits : `+${digits}`;
}
