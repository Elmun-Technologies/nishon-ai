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

/** Model assigned per task type */
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

/** Returns the recommended model for the given task type */
export function getModelByTask(task: AgentTask): string {
  return TASK_MODELS[task] ?? 'gpt-4o-mini'
}

/** Returns the max token ceiling for the given task type */
export function getTokenLimitByTask(task: AgentTask): number {
  return TASK_TOKEN_LIMITS[task] ?? 2000
}
