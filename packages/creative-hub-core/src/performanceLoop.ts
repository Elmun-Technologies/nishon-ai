/**
 * Qavat 3 — Performance Loop: kreativ ↔ Meta (yoki boshqa) natijalari → keyingi brief uchun xulosalar.
 */

export type AdFormatKey = "1:1" | "4:5" | "9:16" | "1200x628" | "1080x1920";

export interface CreativePerformanceSample {
  creativeId: string;
  format: AdFormatKey;
  impressions: number;
  spend: number;
  purchasesValue: number;
  /** Oddiy ROAS = purchasesValue / spend */
  roas?: number;
}

export interface ProjectLearning {
  title: string;
  detail: string;
  confidence: "low" | "medium" | "high";
}

function safeRoas(s: CreativePerformanceSample): number {
  if (s.roas != null && Number.isFinite(s.roas)) return s.roas;
  if (s.spend <= 0) return 0;
  return s.purchasesValue / s.spend;
}

/** Format bo‘yicha ROAS ni solishtiradi va natural til xulosasi qaytaradi. */
export function summarizeFormatPerformance(samples: CreativePerformanceSample[]): ProjectLearning[] {
  if (!samples.length) return [];

  const byFormat = new Map<AdFormatKey, { roasSum: number; n: number }>();
  for (const s of samples) {
    const r = safeRoas(s);
    const cur = byFormat.get(s.format) ?? { roasSum: 0, n: 0 };
    cur.roasSum += r;
    cur.n += 1;
    byFormat.set(s.format, cur);
  }

  const avgs = [...byFormat.entries()]
    .map(([format, v]) => ({ format, roas: v.n ? v.roasSum / v.n : 0, n: v.n }))
    .filter((x) => x.n > 0)
    .sort((a, b) => b.roas - a.roas);

  if (avgs.length < 2) {
    const top = avgs[0];
    return top
      ? [
          {
            title: "Bitta format yetarli emas",
            detail: `${top.format} uchun ROAS ${top.roas.toFixed(2)}x. Vertikal va kvadrat A/B qo‘shing.`,
            confidence: "low",
          },
        ]
      : [];
  }

  const best = avgs[0]!;
  const worst = avgs[avgs.length - 1]!;
  const ratio = worst.roas > 0 ? best.roas / worst.roas : best.roas > 0 ? Infinity : 1;
  const confidence: ProjectLearning["confidence"] =
    samples.length >= 20 ? "high" : samples.length >= 8 ? "medium" : "low";

  return [
    {
      title: "Format taqqoslash",
      detail: `${best.format} ${worst.roas > 0 ? `${ratio.toFixed(1)}x` : "yaxshiroq"} ROAS berdi ${worst.format} dan. Keyingi kampaniyada ${best.format} ga urg‘u bering.`,
      confidence,
    },
  ];
}

/** Project yopilganda AI "Learnings" bloki (matn). */
export function buildProjectCloseLearnings(samples: CreativePerformanceSample[]): string {
  const bullets = summarizeFormatPerformance(samples);
  if (!bullets.length) return "Hozircha yetarli performance maʼlumoti yo‘q — keyingi safar formatlar bo‘yicha A/B qo‘shing.";
  return bullets.map((b) => `• ${b.title}: ${b.detail} (ishonch: ${b.confidence})`).join("\n");
}
