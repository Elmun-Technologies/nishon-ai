import OpenAI from 'openai'
import {
  AgentTask,
  getModelByTask,
  getTokenLimitByTask,
} from './model-router'

export interface CompleteOptions {
  /** Controls creativity. 0 = deterministic, 1 = creative. Default: 0.7 */
  temperature?: number
  /**
   * Hard cap on output tokens. When omitted, falls back to the task-type
   * limit from TASK_TOKEN_LIMITS, then to 2 000 tokens.
   */
  maxTokens?: number
  /**
   * Explicitly override the model. When omitted, the model is resolved
   * automatically from `taskType` via getModelByTask(), or the default.
   */
  model?: string
  /**
   * Drives automatic model selection and default token limits.
   * Pass this instead of setting `model` and `maxTokens` manually.
   */
  taskType?: AgentTask
  /** Label used in structured logs (e.g. 'StrategyEngine', 'DecisionLoop') */
  agentName?: string
}

export interface CompleteResult {
  content: string
  tokensUsed: number
  model: string
  durationMs: number
}

/**
 * NishonAI client powered by Agent Router.
 *
 * All AI calls in the platform go through this single client so model
 * selection, retries, token limits, and observability are centralised.
 *
 * Usage:
 *   const result = await client.completeJson<MyType>(prompt, system, {
 *     taskType: 'strategy',     // auto-selects gpt-4o + 3 000 token limit
 *     agentName: 'StrategyEngine',
 *   })
 */
export class NishonAiClient {
  private readonly openai: OpenAI
  private readonly fallbackModel = 'gpt-4o-mini'
  private readonly maxRetries = 3

  constructor(apiKey: string, baseURL: string) {
    this.openai = new OpenAI({
      apiKey,
      baseURL,
      timeout: 45_000,  // 45 s — prevents Render 504 timeouts
      maxRetries: 0,    // retries are handled manually below
    })
  }

  // ─── Public API ───────────────────────────────────────────────────────────

  /**
   * Text completion. Returns the raw content string along with usage metadata.
   */
  async complete(
    prompt: string,
    systemPrompt: string,
    options: CompleteOptions = {},
  ): Promise<CompleteResult> {
    const { model, maxTokens, temperature } = this.resolveOptions(options)

    return this.executeWithRetry(
      async () => {
        const response = await this.openai.chat.completions.create({
          model,
          temperature,
          max_tokens: maxTokens,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user',   content: prompt },
          ],
        })
        return {
          content:    response.choices[0]?.message?.content ?? '',
          tokensUsed: response.usage?.total_tokens ?? 0,
          model,
        }
      },
      options,
    )
  }

  /**
   * JSON completion. Expects the model to return valid JSON and parses it.
   * Strips markdown code-fences automatically.
   */
  async completeJson<T = any>(
    prompt: string,
    systemPrompt: string,
    options: CompleteOptions = {},
  ): Promise<T> {
    const result = await this.complete(prompt, systemPrompt, {
      ...options,
      temperature: options.temperature ?? 0.3, // lower temp → more deterministic JSON
    })

    try {
      const cleaned = result.content.replace(/```json\n?|\n?```/g, '').trim()
      return JSON.parse(cleaned) as T
    } catch {
      throw new Error(
        `Model returned invalid JSON: ${result.content.slice(0, 200)}`,
      )
    }
  }

  /**
   * Vision completion — accepts an image (base64) alongside a text prompt.
   * Used for creative scoring and any multimodal analysis.
   * Returns parsed JSON directly.
   */
  async completeVision<T = any>(
    imageBase64: string,
    mimeType: string,
    textPrompt: string,
    systemPrompt: string,
    options: CompleteOptions = {},
  ): Promise<T> {
    const { model, maxTokens } = this.resolveOptions({
      taskType: 'vision',
      ...options,
    })

    return this.executeWithRetry(
      async () => {
        const response = await this.openai.chat.completions.create({
          model,
          max_tokens: maxTokens,
          messages: [
            { role: 'system', content: systemPrompt },
            {
              role: 'user',
              content: [
                {
                  type: 'image_url',
                  image_url: {
                    url: `data:${mimeType};base64,${imageBase64}`,
                    detail: 'high',
                  },
                },
                { type: 'text', text: textPrompt },
              ],
            },
          ],
        })
        const content  = response.choices[0]?.message?.content ?? ''
        const cleaned  = content.replace(/```json\n?|\n?```/g, '').trim()
        return {
          content:    JSON.parse(cleaned),
          tokensUsed: response.usage?.total_tokens ?? 0,
          model,
        }
      },
      { ...options, taskType: options.taskType ?? 'vision' },
      /* unwrapContent */ true,
    ) as unknown as T
  }

  // ─── Private helpers ──────────────────────────────────────────────────────

  /**
   * Resolve model, token limit, and temperature from caller options.
   * Priority: explicit option value > task-type default > hard-coded fallback.
   */
  private resolveOptions(options: CompleteOptions) {
    const model = options.model
      ?? (options.taskType ? getModelByTask(options.taskType) : this.fallbackModel)

    const maxTokens = options.maxTokens
      ?? (options.taskType ? getTokenLimitByTask(options.taskType) : 2000)

    const temperature = options.temperature ?? 0.7

    return { model, maxTokens, temperature }
  }

  /**
   * Shared retry loop used by all completion methods.
   * Retries on 429 (rate limit) and 5xx (server errors) with exponential backoff.
   * Logs a structured line for every completed call.
   *
   * @param operation     Async function that calls the API and returns a partial result.
   * @param options       Caller options (used for logging context).
   * @param unwrapContent If true, treats operation return value's `.content` as the
   *                      actual result (used for vision where JSON is pre-parsed).
   */
  private async executeWithRetry(
    operation: () => Promise<{ content: any; tokensUsed: number; model: string }>,
    options: CompleteOptions,
    unwrapContent = false,
  ): Promise<CompleteResult> {
    const label = options.agentName ?? 'NishonAI'
    const task  = options.taskType  ?? 'unknown'
    let lastError: Error | null = null

    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      const t0 = Date.now()
      try {
        const raw = await operation()
        const durationMs = Date.now() - t0

        // Structured observability log — one line per successful AI call
        console.log(
          `[NishonAI] agent=${label} task=${task} model=${raw.model}` +
          ` tokens=${raw.tokensUsed} duration=${durationMs}ms`,
        )

        return {
          content:    unwrapContent ? raw.content : raw.content,
          tokensUsed: raw.tokensUsed,
          model:      raw.model,
          durationMs,
        }

      } catch (error: any) {
        lastError = error
        const durationMs = Date.now() - t0
        const isRetryable = error?.status === 429 || error?.status >= 500

        if (!isRetryable || attempt === this.maxRetries) {
          const detail = error?.error?.message || error?.message || String(error)
          const msg = `Agent Router error [${label}/${task}] status=${error?.status ?? 'unknown'} attempt=${attempt}: ${detail}`
          console.error(`[NishonAI] ${msg} duration=${durationMs}ms`)
          throw new Error(msg)
        }

        const waitMs = Math.pow(2, attempt - 1) * 1000
        console.warn(
          `[NishonAI] agent=${label} task=${task} attempt=${attempt} failed —` +
          ` retrying in ${waitMs}ms (status=${error?.status})`,
        )
        await this.sleep(waitMs)
      }
    }

    throw lastError
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}
