import OpenAI from 'openai'
import {
  AgentTask,
  getModelByTask,
  getTokenLimitByTask,
} from './model-router'

/** Tasks that require long AI responses — given a more generous timeout */
const LONG_RUNNING_TASKS = new Set<AgentTask>(['strategy', 'competitor', 'creative', 'landing-page'])

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
  /**
   * When true, instructs the OpenAI client to use JSON mode
   * (`response_format: { type: 'json_object' }`).
   * Set automatically by `completeJson()`.
   */
  jsonMode?: boolean
}

export interface CompleteResult {
  content: string
  tokensUsed: number
  model: string
  durationMs: number
}

export type AiProvider = 'openai' | 'anthropic' | 'meta'

/**
 * AdSpectr AI client powered by Agent Router.
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
export type AdSpectrAiClientOptions = {
  /**
   * When `AI_PROVIDER=meta`, if set, this model id is used for every task
   * (host-specific names). Otherwise {@link TASK_MODELS_META} applies per task.
   */
  modelOverride?: string
}

export class AdSpectrAiClient {
  private readonly openai?: OpenAI
  private readonly provider: AiProvider
  private readonly apiKey: string
  private readonly anthropicBaseUrl: string
  private readonly modelOverride?: string
  private readonly fallbackModel = 'gpt-4o-mini'
  private readonly maxRetries = 3

  /**
   * @param apiKey   Provider API key (`OPENAI_*`, `ANTHROPIC_*`, or `META_AI_API_KEY`)
   * @param baseURL  Optional — override the API base URL (required for `meta` — Meta Llama endpoint).
   *                 Defaults to provider's official endpoint.
   */
  constructor(
    apiKey: string,
    baseURL?: string,
    provider: AiProvider = 'openai',
    opts?: AdSpectrAiClientOptions,
  ) {
    this.provider = provider
    this.apiKey = apiKey
    this.anthropicBaseUrl = baseURL || 'https://api.anthropic.com/v1'
    this.modelOverride = opts?.modelOverride

    if (this.provider === 'openai' || this.provider === 'meta') {
      const config: ConstructorParameters<typeof OpenAI>[0] = {
        apiKey,
        timeout: 120_000, // 120 s — complex tasks (strategy/competitor) need more time
        maxRetries: 0,    // retries handled manually with backoff below
      }
      if (baseURL) {
        config.baseURL = baseURL
      }
      if (this.provider === 'meta' && !baseURL?.trim()) {
        throw new Error(
          'Meta AI (Llama) provider requires META_AI_BASE_URL (OpenAI-compatible base URL from Meta Llama API).',
        )
      }
      this.openai = new OpenAI(config)
    }
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
        if (this.provider === 'anthropic') {
          return this.completeAnthropic(prompt, systemPrompt, model, maxTokens, temperature)
        }
        if (!this.openai) {
          throw new Error('OpenAI-compatible client is not initialized.')
        }
        return this.completeOpenAi(prompt, systemPrompt, model, maxTokens, temperature, options.jsonMode)
      },
      options,
    )
  }

  /**
   * JSON completion. Expects the model to return valid JSON and parses it.
   * Strips markdown code-fences automatically.
   * When using OpenAI, enables JSON mode (`response_format: json_object`)
   * to guarantee valid JSON output without the need for post-processing fences.
   */
  async completeJson<T = any>(
    prompt: string,
    systemPrompt: string,
    options: CompleteOptions = {},
  ): Promise<T> {
    const result = await this.complete(prompt, systemPrompt, {
      ...options,
      temperature: options.temperature ?? 0.3, // lower temp → more deterministic JSON
      jsonMode: true, // signal OpenAI to use response_format: json_object
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
        if (!this.openai) {
          throw new Error('Vision completion requires an OpenAI-compatible client (openai or meta provider).')
        }
        const response = await this.openai.chat.completions.create({
          model,
          max_tokens: maxTokens,
          response_format: { type: 'json_object' as const },
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
    const providerDefaultModel =
      this.provider === 'anthropic'
        ? 'claude-3-7-sonnet-20250219'
        : this.provider === 'meta'
          ? 'Llama-3.3-70B-Instruct'
          : this.fallbackModel
    const model =
      options.model
      ?? (this.provider === 'meta' && this.modelOverride ? this.modelOverride : undefined)
      ?? (options.taskType ? getModelByTask(options.taskType, this.provider) : undefined)
      ?? providerDefaultModel

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
    const label = options.agentName ?? 'AdSpectrAI'
    const task  = options.taskType  ?? 'unknown'
    let lastError: Error | null = null

    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      const t0 = Date.now()
      try {
        const raw = await operation()
        const durationMs = Date.now() - t0

        // Structured observability log — one line per successful AI call
        console.log(
          `[AdSpectrAI] agent=${label} task=${task} model=${raw.model}` +
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
          const rawDetail = error?.error?.message || error?.message || String(error)
          // Strip HTML from error detail to avoid leaking WAF pages to users
          const detail = (rawDetail.includes('<!doctype') || rawDetail.includes('<html') || rawDetail.includes('aliyun_waf'))
            ? 'AI provider is temporarily unavailable (network block). Please try again in a few minutes.'
            : rawDetail
          const msg = `Agent Router error [${label}/${task}] status=${error?.status ?? 'unknown'} attempt=${attempt}: ${detail}`
          console.error(`[AdSpectrAI] ${msg} duration=${durationMs}ms`)
          throw new Error(msg)
        }

        // Exponential backoff: 1s, 2s, 4s
        const waitMs = Math.pow(2, attempt - 1) * 1000
        console.warn(
          `[AdSpectrAI] agent=${label} task=${task} attempt=${attempt}/${this.maxRetries} failed —` +
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

  private async completeOpenAi(
    prompt: string,
    systemPrompt: string,
    model: string,
    maxTokens: number,
    temperature: number,
    jsonMode = false,
  ): Promise<{ content: string; tokensUsed: number; model: string }> {
    if (!this.openai) {
      throw new Error('OpenAI client is not initialized.')
    }

    const response = await this.openai.chat.completions.create({
      model,
      temperature,
      max_tokens: maxTokens,
      // JSON mode guarantees valid JSON output — avoids markdown fences and
      // hallucinated text that breaks JSON.parse().
      // Only enabled when explicitly requested (via completeJson / jsonMode flag).
      ...(jsonMode ? { response_format: { type: 'json_object' as const } } : {}),
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt },
      ],
    })

    const rawStr = JSON.stringify(response)
    if (!response.choices || response.choices.length === 0) {
      const isHtmlBlock = rawStr.includes('<!doctype') || rawStr.includes('<html') || rawStr.includes('aliyun_waf')
      if (isHtmlBlock) {
        throw new Error('AI provider is temporarily unavailable (network block). Please try again in a few minutes.')
      }
      throw new Error(`Empty response from AI provider: ${rawStr.slice(0, 200)}`)
    }

    const content = response.choices[0]?.message?.content ?? ''
    if (content.includes('<!doctype') || content.includes('<html') || content.includes('aliyun_waf')) {
      throw new Error('AI provider is temporarily unavailable (network block). Please try again in a few minutes.')
    }

    return {
      content,
      tokensUsed: response.usage?.total_tokens ?? 0,
      model,
    }
  }

  private async completeAnthropic(
    prompt: string,
    systemPrompt: string,
    model: string,
    maxTokens: number,
    temperature: number,
  ): Promise<{ content: string; tokensUsed: number; model: string }> {
    const response = await fetch(`${this.anthropicBaseUrl}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model,
        system: systemPrompt,
        max_tokens: maxTokens,
        temperature,
        messages: [{ role: 'user', content: prompt }],
      }),
    })

    const rawText = await response.text()
    if (!response.ok) {
      throw new Error(`Anthropic API error ${response.status}: ${rawText.slice(0, 200)}`)
    }

    const data = JSON.parse(rawText) as {
      content?: Array<{ type: string; text?: string }>
      usage?: { input_tokens?: number; output_tokens?: number }
    }

    const text = data.content?.find((item) => item.type === 'text')?.text ?? ''
    return {
      content: text,
      tokensUsed: (data.usage?.input_tokens ?? 0) + (data.usage?.output_tokens ?? 0),
      model,
    }
  }
}
