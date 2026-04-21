import { normalizeHex } from '@adspectr/creative-hub-core'

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const h = hex.replace(/^#/, '')
  if (h.length !== 6) return null
  const n = parseInt(h, 16)
  if (Number.isNaN(n)) return null
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 }
}

/** RGB Euclidean — kichik = yaqin. ~0-441. DeltaE soddalashtirilgan. */
export function rgbDistance(hexA: string, hexB: string): number {
  const a = hexToRgb(normalizeHex(hexA))
  const b = hexToRgb(normalizeHex(hexB))
  if (!a || !b) return 999
  const dr = a.r - b.r
  const dg = a.g - b.g
  const db = a.b - b.b
  return Math.sqrt(dr * dr + dg * dg + db * db)
}

/**
 * Brend primary rangga eng yaqin dominant rang topiladi.
 * thresholdRgb: taxminan DeltaE 10 atrofida — RGB masofa < 45 deb olamiz (sozlanadi).
 */
export function bestBrandColorMatch(
  dominantHexes: string[],
  brandPrimaryHex: string,
  thresholdRgb = 45,
): { score: number; closestDistance: number; matched: boolean } {
  if (!dominantHexes.length || !brandPrimaryHex) {
    return { score: 55, closestDistance: 999, matched: false }
  }
  let min = 999
  for (const raw of dominantHexes) {
    const d = rgbDistance(raw, brandPrimaryHex)
    if (d < min) min = d
  }
  const matched = min <= thresholdRgb
  const score = Math.max(0, Math.min(100, Math.round(100 - min * 1.2)))
  return { score: matched ? Math.max(score, 72) : score, closestDistance: min, matched }
}
