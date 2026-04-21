export type RetargetSignalStatus = "pending" | "active" | "converted";

export interface RetargetSignalPayload {
  campaignId?: string;
  amount: number;
  lastPurchase: number;
  productId?: string;
  status: RetargetSignalStatus;
  /** Retarget job ishga tushgan payt */
  activatedAt?: number;
  /** Retargetdan keyin qayta sotib olingan */
  convertedAt?: number;
  /** Retarget aktiv bo‘lgandan keyingi takroriy xaridlar soni */
  repeatPurchasesAfterRetarget?: number;
  messageTemplate?: string;
  /** Meta publish (bir marta bosish) */
  metaAudienceId?: string;
  metaCampaignId?: string;
  metaAdSetId?: string;
  metaCreativeId?: string;
  metaAdId?: string;
  metaPublishError?: string;
  metaPublishedAt?: number;
  creativeMappingKey?: string;
  /** Signal bridge: telefon + Telegram + Meta */
  unifiedHash?: string;
  telegramChatId?: string;
  telegramLinkedAt?: number;
  /** Meta kanalida retarget joylandi */
  metaChannelReady?: boolean;
  /** Telegramda retarget xabar yuborildi */
  telegramChannelReady?: boolean;
  telegramSentAt?: number;
  telegramLastError?: string;
}

export const RETARGET_MESSAGE_DEFAULT =
  "Oxirgi xaridingiz yoqdimi? 10% chegirma";

export const TELEGRAM_LINK_PREFIX = "telegram:";
/** Bot /start orqali telefon ↔ chat_id (90 kun). */
export const TELEGRAM_LINK_TTL_SEC = 90 * 24 * 60 * 60;

export const RETARGET_KEY_PREFIX = "retarget:";
export const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
export const THIRTY_DAYS_SEC = 30 * 24 * 60 * 60;
