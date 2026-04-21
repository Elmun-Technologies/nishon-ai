/**
 * Qavat 1 — Asset Factory: rasm (Fal.ai Flux Pro, Replicate SDXL, remove.bg, Cloudinary resize).
 * Bu fayl — server/clientdan chaqiriladigan kontrakt va stub; haqiqiy HTTP keyingi PR.
 */

export type ImageGoal = "sales" | "traffic" | "awareness";

export interface ImageBriefInput {
  productImageUrl?: string;
  goal: ImageGoal;
  tone: "warm" | "bold" | "minimal";
  locale: "uz-Latn" | "uz-Cyrl";
  /** Brend prompt injeksiyasi (brandKit.buildImagePromptSuffix dan) */
  brandPromptSuffix?: string;
}

export interface ImageConcept {
  id: string;
  headline: string;
  visualDirection: string;
  ctaHint: string;
}

/** Brief → 3 ta konsept (keyinroq LLM bilan almashtirish). */
export function planConceptsFromBrief(brief: ImageBriefInput): ImageConcept[] {
  const g =
    brief.goal === "sales"
      ? "sotuv"
      : brief.goal === "traffic"
        ? "trafik"
        : "brand eslashuv";
  return [
    {
      id: "c1",
      headline: "Ishonch + mahsulot",
      visualDirection: `${g}: markazda mahsulot, yumshoq fon, ${brief.tone} uslub.`,
      ctaHint: "Batafsil",
    },
    {
      id: "c2",
      headline: "Chegirma / urgency",
      visualDirection: "Cheklangan vaqt hissiyoti, kontrast blok, raqamli foyda.",
      ctaHint: "Hozir oling",
    },
    {
      id: "c3",
      headline: "Ijtimoiy isbot",
      visualDirection: "Review iqtibosi yoki 5 yulduz, insoniy yuz.",
      ctaHint: "Sharhlar",
    },
  ];
}

/** Fal.ai / Replicate uchun yagona payload shabloni (implementatsiya keyin). */
export type FalImageJobPayload = ImageBriefInput & {
  conceptId: string;
  width: number;
  height: number;
};

export const STANDARD_AD_FORMATS: Array<{ key: string; width: number; height: number }> = [
  { key: "1:1", width: 1080, height: 1080 },
  { key: "4:5", width: 1080, height: 1350 },
  { key: "9:16", width: 1080, height: 1920 },
  { key: "1200x628", width: 1200, height: 628 },
  { key: "1080x1920", width: 1080, height: 1920 },
];
