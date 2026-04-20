import { AdSpectrAiClient } from './openai-client'
import type { ModelRouterProvider } from './model-router'

/** Minimal env accessor (Nest `ConfigService.get`, `process.env`, tests). */
export type AiEnvGetter = (key: string) => string | undefined

/** True when the selected `AI_PROVIDER` has the minimum keys to construct a client. */
export function isAiClientConfigured(get: AiEnvGetter): boolean {
  const raw = (get('AI_PROVIDER') || 'openai').toLowerCase()
  if (raw === 'anthropic') return !!get('ANTHROPIC_API_KEY')?.trim()
  if (raw === 'meta') {
    return !!get('META_AI_API_KEY')?.trim() && !!get('META_AI_BASE_URL')?.trim()
  }
  return !!get('OPENAI_API_KEY')?.trim()
}

/**
 * Builds {@link AdSpectrAiClient} from environment — single entry for API services.
 *
 * `AI_PROVIDER`:
 * - `openai` (default) — `OPENAI_API_KEY`, optional `OPENAI_BASE_URL`
 * - `anthropic` — `ANTHROPIC_API_KEY`, optional `ANTHROPIC_BASE_URL`
 * - `meta` — Meta Llama / OpenAI-compatible endpoint: `META_AI_API_KEY`, `META_AI_BASE_URL`,
 *   optional `META_AI_MODEL` (if set, used for all tasks instead of per-task Llama IDs)
 */
export function createAdSpectrAiClientFromEnv(get: AiEnvGetter): AdSpectrAiClient {
  const raw = (get('AI_PROVIDER') || 'openai').toLowerCase()
  const provider = (raw === 'anthropic' || raw === 'meta' ? raw : 'openai') as ModelRouterProvider

  if (provider === 'anthropic') {
    const apiKey = get('ANTHROPIC_API_KEY') || ''
    const baseURL = get('ANTHROPIC_BASE_URL') || undefined
    return new AdSpectrAiClient(apiKey, baseURL, 'anthropic')
  }

  if (provider === 'meta') {
    const apiKey = get('META_AI_API_KEY') || ''
    const baseURL = get('META_AI_BASE_URL') || undefined
    const modelOverride = get('META_AI_MODEL') || undefined
    return new AdSpectrAiClient(apiKey, baseURL, 'meta', { modelOverride })
  }

  const apiKey = get('OPENAI_API_KEY') || ''
  const baseURL = get('OPENAI_BASE_URL') || undefined
  return new AdSpectrAiClient(apiKey, baseURL, 'openai')
}
