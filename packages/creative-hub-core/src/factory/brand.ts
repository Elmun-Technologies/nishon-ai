import type { BrandKit } from "../brandKit";
import { buildImagePromptSuffix, runBrandComplianceCheck } from "../brandKit";

/** Image pipeline uchun brend qatlami (prompt + compliance). */
export function composeBrandLayerForImageJob(input: { kit: BrandKit; briefCopy: string; dominantHexes?: string[] }) {
  const promptSuffix = buildImagePromptSuffix(input.kit);
  const compliance = runBrandComplianceCheck({
    kit: input.kit,
    copyText: input.briefCopy,
    usedColors: input.dominantHexes,
  });
  return { promptSuffix, compliance };
}
