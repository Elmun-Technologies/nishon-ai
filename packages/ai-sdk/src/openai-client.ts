import OpenAI from 'openai'

interface CompleteOptions {
  temperature?: number      // 0.0 to 1.0 — lower = more focused, higher = more creative
  maxTokens?: number
  model?: string
}

interface CompleteResult {
  content: string
  tokensUsed: number
  model: string
}

/**
 * NishonAI OpenAI client with retry logic and error handling.
 * All AI features (strategy generation, script writing, optimization)
 * go through this single client so we can monitor usage and costs centrally.
 */
export class NishonAiClient {
  private client: OpenAI
  private defaultModel = 'gpt-4o'
  private maxRetries = 3

  constructor(apiKey: string) {
    this.client = new OpenAI({ apiKey })
  }

  /**
   * Send a prompt to GPT-4o and get a completion back.
   * Automatically retries up to 3 times with exponential backoff
   * if the API returns a rate limit or server error.
   */
  async complete(
    prompt: string,
    systemPrompt: string,
    options: CompleteOptions = {}
  ): Promise<CompleteResult> {
    const model = options.model ?? this.defaultModel
    const temperature = options.temperature ?? 0.7
    const maxTokens = options.maxTokens ?? 2000

    let lastError: Error | null = null

    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        const response = await this.client.chat.completions.create({
          model,
          temperature,
          max_tokens: maxTokens,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: prompt },
          ],
        })

        const content = response.choices[0]?.message?.content ?? ''
        const tokensUsed = response.usage?.total_tokens ?? 0

        return { content, tokensUsed, model }

      } catch (error: any) {
        lastError = error

        // Only retry on rate limit (429) or server errors (500, 503)
        const isRetryable = error?.status === 429 || error?.status >= 500
        if (!isRetryable || attempt === this.maxRetries) {
          throw new Error(`OpenAI API error after ${attempt} attempts: ${error.message}`)
        }

        // Exponential backoff: wait 1s, then 2s, then 4s
        const waitMs = Math.pow(2, attempt - 1) * 1000
        console.warn(`OpenAI attempt ${attempt} failed. Retrying in ${waitMs}ms...`)
        await this.sleep(waitMs)
      }
    }

    throw lastError
  }

  /**
   * Same as complete() but expects the model to return valid JSON.
   * Parses and returns the JSON object directly.
   */
  async completeJson<T = any>(
    prompt: string,
    systemPrompt: string,
    options: CompleteOptions = {}
  ): Promise<T> {
    const result = await this.complete(prompt, systemPrompt, {
      ...options,
      temperature: options.temperature ?? 0.3, // Lower temp for JSON — more deterministic
    })

    try {
      // Strip markdown code fences if model wrapped JSON in ```json ... ```
      const cleaned = result.content.replace(/```json\n?|\n?```/g, '').trim()
      return JSON.parse(cleaned) as T
    } catch {
      throw new Error(`Model returned invalid JSON: ${result.content.slice(0, 200)}`)
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}