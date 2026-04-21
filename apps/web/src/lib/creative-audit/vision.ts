import type { VisionScoresInput } from './scorer'

const VISION_SCHEMA_HINT = `Return ONLY valid JSON with keys:
messageClarity (0-100 number),
brandFitGuess (0-100),
audienceFitGuess (0-100),
visualQualityGuess (0-100),
ctaVisible (boolean),
estimatedTextPercentOfImage (0-1 number, portion of image covered by text),
dominantHexColors (array of 3-6 uppercase #RRGGBB),
estimatedSubjectAgeRange (string like "18-24" or "35-44" or "unknown"),
issues (string array, Uzbek),
suggestions (string array, Uzbek).`

export async function runGpt4oVisionScan(input: {
  base64: string
  mimeType: string
  audienceHint?: string
}): Promise<{
  parsed: VisionScoresInput
  raw: Record<string, unknown>
  usedOpenAi: boolean
  issues: string[]
  suggestions: string[]
}> {
  const key = process.env.OPENAI_API_KEY?.trim()
  if (!key) {
    const parsed = mockVisionFromEntropy(input.base64.length)
    const issues: string[] = []
    const suggestions: string[] = []
    if (!parsed.ctaVisible) {
      issues.push("CTA topilmadi yoki juda noaniq.")
      suggestions.push("Pastga aniq CTA qo'shing.")
    }
    return { parsed, raw: { source: 'mock' }, usedOpenAi: false, issues, suggestions }
  }

  const body = {
    model: process.env.CREATIVE_AUDIT_OPENAI_MODEL?.trim() || 'gpt-4o-mini',
    response_format: { type: 'json_object' as const },
    max_tokens: 1200,
    messages: [
      {
        role: 'system' as const,
        content: `You are a strict performance creative analyst for Meta/Telegram ads in Uzbekistan. ${VISION_SCHEMA_HINT}`,
      },
      {
        role: 'user' as const,
        content: [
          {
            type: 'text' as const,
            text: `Analyze this static ad image.${input.audienceHint ? ` Target audience: ${input.audienceHint}` : ''}`,
          },
          {
            type: 'image_url' as const,
            image_url: { url: `data:${input.mimeType};base64,${input.base64}` },
          },
        ],
      },
    ],
  }

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const err = await res.text().catch(() => res.statusText)
    throw new Error(`OpenAI vision: ${res.status} ${err.slice(0, 200)}`)
  }

  const data = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>
  }
  const text = data.choices?.[0]?.message?.content
  if (!text) throw new Error('OpenAI: bo‘sh javob')
  let raw: Record<string, unknown>
  try {
    raw = JSON.parse(text) as Record<string, unknown>
  } catch {
    throw new Error('OpenAI: JSON emas')
  }

  const parsed: VisionScoresInput = {
    messageClarity: num(raw.messageClarity, 70),
    brandFitGuess: num(raw.brandFitGuess, 65),
    audienceFitGuess: num(raw.audienceFitGuess, 70),
    visualQualityGuess: num(raw.visualQualityGuess, 72),
    ctaVisible: Boolean(raw.ctaVisible),
    estimatedTextPercentOfImage: num(raw.estimatedTextPercentOfImage, 0.15),
    dominantHexColors: Array.isArray(raw.dominantHexColors)
      ? (raw.dominantHexColors as unknown[]).map((x) => String(x)).filter(Boolean)
      : [],
  }

  const issues = Array.isArray(raw.issues) ? (raw.issues as unknown[]).map((x) => String(x)) : []
  const suggestions = Array.isArray(raw.suggestions)
    ? (raw.suggestions as unknown[]).map((x) => String(x))
    : []

  return { parsed, raw, usedOpenAi: true, issues, suggestions }
}

function num(v: unknown, fallback: number): number {
  const n = typeof v === 'number' ? v : Number(v)
  return Number.isFinite(n) ? n : fallback
}

/** API kaliti bo‘lmasa — demo uchun barqaror “tasodifiy” lekin takrorlanuvchi stub. */
function mockVisionFromEntropy(seed: number): VisionScoresInput {
  const x = ((seed % 97) + 13) / 110
  const cta = seed % 4 !== 0
  return {
    messageClarity: Math.round(55 + 40 * x),
    brandFitGuess: Math.round(50 + 35 * (1 - x)),
    audienceFitGuess: Math.round(60 + 30 * x),
    visualQualityGuess: Math.round(58 + 32 * x),
    ctaVisible: cta,
    estimatedTextPercentOfImage: 0.12 + (seed % 17) / 100,
    dominantHexColors: cta ? ['#0A7A3E', '#FFFFFF', '#111111'] : ['#FF0000', '#EEEEEE', '#333333'],
  }
}
