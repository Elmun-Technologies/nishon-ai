/**
 * Qavat 2 — Brand Brain: brend qoidalari va generatsiya promptiga injeksiya.
 * Saqlash: Postgres JSONB + assetlar CDN (masalan Cloudinary).
 */

export type BrandTone = "friendly_uz" | "premium_uz" | "direct_sales";

export interface BrandKit {
  id: string;
  name: string;
  /** Asosiy va ikkilamchi ranglar (hex) */
  colors: { primary: string; secondary?: string; accent?: string[] };
  /** Google Fonts yoki custom */
  fonts: { heading: string; body: string };
  toneOfVoice: string;
  forbiddenPhrases: string[];
  /** Ruxsat etilgan hexlar ro‘yxati — compliance tekshiruvi */
  allowedColorHex?: string[];
  logoAssetUrl?: string;
}

const HEX = /^#?[0-9a-fA-F]{6}$/;

export function normalizeHex(hex: string): string {
  const h = hex.trim().startsWith("#") ? hex.trim() : `#${hex.trim()}`;
  return h.toUpperCase();
}

/** Generatsiya promptiga qo‘shiladigan qat’iy qoidalar (LLM / image model). */
export function buildImagePromptSuffix(kit: BrandKit): string {
  const c = kit.colors;
  const accents = (c.accent ?? []).join(", ");
  const forbidden =
    kit.forbiddenPhrases.length > 0
      ? `Never use these phrases or close variants: ${kit.forbiddenPhrases.join("; ")}.`
      : "";
  return [
    `Brand: ${kit.name}.`,
    `Use brand colors: primary ${normalizeHex(c.primary)}${
      c.secondary ? `, secondary ${normalizeHex(c.secondary)}` : ""
    }${accents ? `, accents ${accents}` : ""}.`,
    `Typography: heading font "${kit.fonts.heading}", body "${kit.fonts.body}".`,
    `Tone of voice: ${kit.toneOfVoice}.`,
    forbidden,
    "Keep text legible for ads; Uzbek Cyrillic/Latin as brief specifies.",
  ]
    .filter(Boolean)
    .join(" ");
}

export type ComplianceIssue =
  | { kind: "forbidden_phrase"; phrase: string }
  | { kind: "color_out_of_palette"; used: string; suggested: string };

export interface BrandComplianceResult {
  ok: boolean;
  issues: ComplianceIssue[];
  /** Rangni palettega yaqinlashtirish tavsiyasi */
  autoCorrectedColors?: Record<string, string>;
}

function closestAllowed(hex: string, allowed: string[]): string {
  const n = normalizeHex(hex);
  if (!allowed.length) return n;
  // Oddiy: birinchi ruxsat etilgan rang (keyinroq Delta E bilan almashtirish mumkin)
  return normalizeHex(allowed[0]!);
}

/**
 * Matn va ishlatilgan ranglar bo‘yicha governance.
 * `usedColors` — generatsiya natijasidan olingan dominant ranglar (stub / vision keyingi bosqich).
 */
export function runBrandComplianceCheck(input: {
  kit: BrandKit;
  copyText: string;
  usedColors?: string[];
}): BrandComplianceResult {
  const issues: ComplianceIssue[] = [];
  const lower = input.copyText.toLowerCase();
  for (const phrase of input.kit.forbiddenPhrases) {
    if (phrase && lower.includes(phrase.toLowerCase())) {
      issues.push({ kind: "forbidden_phrase", phrase });
    }
  }

  const allowed = input.kit.allowedColorHex?.map(normalizeHex) ?? [];
  const autoCorrected: Record<string, string> = {};
  if (allowed.length && input.usedColors?.length) {
    for (const raw of input.usedColors) {
      if (!HEX.test(raw)) continue;
      const u = normalizeHex(raw);
      if (!allowed.includes(u)) {
        const suggested = closestAllowed(u, allowed);
        issues.push({ kind: "color_out_of_palette", used: u, suggested });
        autoCorrected[u] = suggested;
      }
    }
  }

  return {
    ok: issues.length === 0,
    issues,
    autoCorrectedColors: Object.keys(autoCorrected).length ? autoCorrected : undefined,
  };
}

export const DEMO_BRAND_KIT: BrandKit = {
  id: "demo",
  name: "Demo brend",
  colors: { primary: "#0A7A3E", secondary: "#FFD600", accent: ["#111111"] },
  fonts: { heading: "Montserrat", body: "Inter" },
  toneOfVoice: "Do‘stona o‘zbekcha, narxlarni bosiq tut, sifat va ishonchga urg‘u.",
  forbiddenPhrases: ["arvoh", "100% kafolat", "eng arzon"],
  allowedColorHex: ["#0A7A3E", "#FFD600", "#111111", "#FFFFFF"],
};
