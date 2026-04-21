/**
 * Mahsulot qatori (CRM `productId` / `product_id`) → retarget kreativ va targeting.
 * Yangi qoida: `match` funksiyasiga qator qo‘shing.
 */
export type RetargetCreativeRule = {
  /** Redis / UI da tanlash uchun */
  key: string;
  adsetName: string;
  headline: string;
  primaryText: string;
  ageMin: number;
  ageMax: number;
  /** Creative link (landing) */
  linkUrl: string;
};

const DEFAULT_LINK = "https://www.facebook.com/";

const RULE_KROSSOVKA: RetargetCreativeRule = {
  key: "krossovka",
  adsetName: "Retarget - Krossovka xaridorlari",
  headline: "Yana bitta krossovka?",
  primaryText: "Oxirgi xaridingiz yoqdimi? 15% chegirma",
  ageMin: 18,
  ageMax: 35,
  linkUrl: DEFAULT_LINK,
};

const RULE_SUMKA: RetargetCreativeRule = {
  key: "sumka",
  adsetName: "Retarget - Sumka xaridorlari",
  headline: "Mos sumka",
  primaryText: "Oxirgi xaridingiz yoqdimi — bepul yetkazish",
  ageMin: 18,
  ageMax: 55,
  linkUrl: DEFAULT_LINK,
};

const RULE_SOAT: RetargetCreativeRule = {
  key: "soat",
  adsetName: "Retarget - Soat xaridorlari",
  headline: "Ikkinchi soat -50%",
  primaryText: "Kolleksiyangizni to‘ldiring — ikkinchi buyum yarim narxda",
  ageMin: 22,
  ageMax: 50,
  linkUrl: DEFAULT_LINK,
};

const RULE_DEFAULT: RetargetCreativeRule = {
  key: "default",
  adsetName: "Retarget - Umumiy xaridorlar",
  headline: "Yana sotib olasizmi?",
  primaryText: "Oxirgi xaridingiz yoqdimi? 10% chegirma",
  ageMin: 18,
  ageMax: 54,
  linkUrl: DEFAULT_LINK,
};

function norm(s: string): string {
  return s.trim().toLowerCase();
}

/**
 * `productId` masalan: "Krossovka Nike", "Sumka Zara", "Soat Casio"
 */
export function resolveRetargetCreativeMapping(productId?: string | null): RetargetCreativeRule {
  const p = norm(productId || "");
  if (!p) return RULE_DEFAULT;
  if (p.includes("krossovka") || p.includes("cross") || p.includes("krosovka")) return RULE_KROSSOVKA;
  if (p.includes("sumka") || p.includes("bag") || p.includes("zara")) return RULE_SUMKA;
  if (p.includes("soat") || p.includes("casio") || p.includes("watch")) return RULE_SOAT;
  return RULE_DEFAULT;
}

export const RETARGET_MAPPING_KEYS = [RULE_KROSSOVKA.key, RULE_SUMKA.key, RULE_SOAT.key, RULE_DEFAULT.key] as const;
