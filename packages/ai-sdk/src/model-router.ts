/**
 * Model routing — maps each agent task type to the right AI model and token budget.
 *
 * Routing strategy:
 *   strategy / competitor → gpt-4o      (deep reasoning, complex multi-step planning)
 *   creative / analytics  → gpt-4o-mini (speed, volume, structured output)
 *   vision / optimization → gpt-4o-mini (vision-capable, cost-effective, consistent)
 *   landing-page          → gpt-4o      (full HTML generation, needs large output)
 *   chat                  → gpt-4o-mini (fast, friendly, low-latency)
 *
 * Token limits act as a hard ceiling per request to prevent runaway costs.
 * They can be overridden per-call by passing `maxTokens` in CompleteOptions.
 */

export type AgentTask =
  | 'strategy'      // Full advertising strategy — needs strongest reasoning
  | 'competitor'    // 12-category competitor audit (72 sub-params) — complex analysis
  | 'creative'      // Ad scripts, copy generation — speed + volume over depth
  | 'analytics'     // Structured data analysis — consistency over depth
  | 'vision'        // Image scoring / creative analysis — multimodal
  | 'optimization'  // Autonomous campaign optimization — data-driven, consistent
  | 'landing-page'  // Full HTML landing page generation — large output needed
  | 'chat'          // Conversational assistant — fast, friendly, concise

/** Model assigned per task type (OpenAI) */
export const TASK_MODELS: Record<AgentTask, string> = {
  strategy:      'gpt-4o',       // Strongest reasoning for complex planning
  competitor:    'gpt-4o',       // Deep multi-category analysis (72 sub-params)
  creative:      'gpt-4o-mini',  // Fast generation, high volume is fine
  analytics:     'gpt-4o-mini',  // Structured output, consistency over depth
  vision:        'gpt-4o-mini',  // Vision-capable and cost-effective
  optimization:  'gpt-4o-mini',  // Data-driven decisions, needs low variance
  'landing-page':'gpt-4o',       // Full HTML page — needs quality & large output
  chat:          'gpt-4o-mini',  // Fast conversational responses
}

/** Anthropic model IDs per task (when `AI_PROVIDER=anthropic`). */
export const TASK_MODELS_ANTHROPIC: Record<AgentTask, string> = {
  strategy:       'claude-3-7-sonnet-20250219',
  competitor:     'claude-3-7-sonnet-20250219',
  creative:       'claude-3-5-sonnet-20241022',
  analytics:      'claude-3-5-sonnet-20241022',
  vision:         'claude-3-5-sonnet-20241022',
  optimization:   'claude-3-5-sonnet-20241022',
  'landing-page': 'claude-3-7-sonnet-20250219',
  chat:           'claude-3-5-sonnet-20241022',
}

/**
 * Meta Llama (OpenAI-compatible) model IDs per task when `AI_PROVIDER=meta`.
 * Override host-specific names with `META_AI_MODEL` (single model for all tasks).
 */
export const TASK_MODELS_META: Record<AgentTask, string> = {
  strategy:       'Llama-3.3-70B-Instruct',
  competitor:     'Llama-3.3-70B-Instruct',
  creative:       'Llama-3.3-8B-Instruct',
  analytics:      'Llama-3.3-8B-Instruct',
  vision:         'Llama-3.3-70B-Instruct',
  optimization:   'Llama-3.3-8B-Instruct',
  'landing-page': 'Llama-3.3-70B-Instruct',
  chat:           'Llama-3.3-8B-Instruct',
}

/** Max output tokens per task — hard ceiling to prevent cost overruns */
export const TASK_TOKEN_LIMITS: Record<AgentTask, number> = {
  strategy:      4000,  // Complex multi-channel strategy JSON
  competitor:    4000,  // 12 categories × 6 sub-params = dense JSON
  creative:      3000,  // Multi-platform ad scripts (Meta + Google + TikTok)
  analytics:     2000,  // Structured data summaries
  vision:        1500,  // Image scoring — concise JSON
  optimization:  1500,  // Decision JSON — compact by design
  'landing-page':4096,  // Full HTML output
  chat:          600,   // Short conversational replies
}

/** LLM vendor configured via `AI_PROVIDER` */
export type ModelRouterProvider = 'openai' | 'anthropic' | 'meta'

/** Returns the recommended model for the given task type and LLM provider */
export function getModelByTask(task: AgentTask, provider: ModelRouterProvider = 'openai'): string {
  if (provider === 'anthropic') {
    return TASK_MODELS_ANTHROPIC[task] ?? 'claude-3-5-sonnet-20241022'
  }
  if (provider === 'meta') {
    return TASK_MODELS_META[task] ?? 'Llama-3.3-70B-Instruct'
  }
  return TASK_MODELS[task] ?? 'gpt-4o-mini'
}

/** Returns the max token ceiling for the given task type */
export function getTokenLimitByTask(task: AgentTask): number {
  return TASK_TOKEN_LIMITS[task] ?? 2000
}
