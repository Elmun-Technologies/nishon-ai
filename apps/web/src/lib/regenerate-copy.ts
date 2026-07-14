import type { AdCopy, CopyLang } from './ad-copy-templates'
import type { AgentGoal, FunnelStage } from './funnel-allocator'

export type CopySource = 'ai' | 'template'

export interface RegenerateResult {
  copy: AdCopy
  source: CopySource
  /** Human-readable reason when the server fell back to the template. */
  reason?: string
}

/**
 * Ask the server to regenerate ad copy through the configured LLM. Never
 * throws — a network failure surfaces as `source: 'template'` so callers can
 * still show something honest (badged as "template"). Callers should treat
 * `source` as the visible signal ("✨ AI" vs. "Template").
 */
export async function regenerateAdCopy(input: {
  websiteUrl: string
  goal: AgentGoal
  stage: FunnelStage
  lang: CopyLang
  signal?: AbortSignal
}): Promise<RegenerateResult> {
  try {
    const res = await fetch('/api/ai-agent/generate-copy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        websiteUrl: input.websiteUrl,
        goal: input.goal,
        stage: input.stage,
        lang: input.lang,
      }),
      signal: input.signal,
    })
    if (!res.ok) {
      return {
        copy: null as unknown as AdCopy,
        source: 'template',
        reason: `http_${res.status}`,
      }
    }
    const data = (await res.json()) as RegenerateResult
    // Server always sends {copy, source, ...}; be defensive anyway.
    if (!data?.copy?.headline || !data?.copy?.body || !data?.copy?.cta) {
      return { copy: null as unknown as AdCopy, source: 'template', reason: 'malformed' }
    }
    return data
  } catch (e: unknown) {
    return {
      copy: null as unknown as AdCopy,
      source: 'template',
      reason: e instanceof Error ? e.message : 'network_error',
    }
  }
}
