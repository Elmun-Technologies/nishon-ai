/**
 * Model routing — maps each agent task type to the right AI model and token budget.
 *
 * Routing strategy:
 *   strategy / competitor → gpt-4o   (deep reasoning, complex multi-step planning)
 *   creative / analytics  → gpt-4o-mini (speed, volume, structured output)
 *   vision / optimization → gpt-4o-mini (vision-capable, cost-effective, consistent)
 *   chat                  → gpt-4o-mini (fast, friendly, low-latency)
 *
 * Token limits act as a hard ceiling per request to prevent runaway costs.
 * They can be overridden per-call by passing `maxTokens` in CompleteOptions.
 */

export type AgentTask =
  | 'strategy'      // Full advertising strategy — needs strongest reasoning
  | 'competitor'    // 12-category competitor audit — complex multi-step analysis
  | 'creative'      // Ad scripts, copy generation — speed + volume over depth
  | 'analytics'     // Structured data analysis — consistency over depth
  | 'vision'        // Image scoring / creative analysis — multimodal
  | 'optimization'  // Autonomous campaign optimization — data-driven, consistent
  | 'chat'          // Conversational assistant — fast, friendly, concise

/** Model assigned per task type */
export const TASK_MODELS: Record<AgentTask, string> = {
  strategy:     'gpt-4o',       // Strongest reasoning for complex planning
  competitor:   'gpt-4o',       // Deep multi-category analysis (72 sub-params)
  creative:     'gpt-4o-mini',  // Fast generation, high volume is fine
  analytics:    'gpt-4o-mini',  // Structured output, consistency over depth
  vision:       'gpt-4o-mini',  // Vision-capable and cost-effective
  optimization: 'gpt-4o-mini',  // Data-driven decisions, needs low variance
  chat:         'gpt-4o-mini',  // Fast conversational responses
}

/** Max output tokens per task — hard ceiling to prevent cost overruns */
export const TASK_TOKEN_LIMITS: Record<AgentTask, number> = {
  strategy:     2000,
  competitor:   2000,
  creative:     2000,
  analytics:    1500,
  vision:       1500,
  optimization: 1500,
  chat:         600,
}

/** Returns the recommended model for the given task type */
export function getModelByTask(task: AgentTask): string {
  return TASK_MODELS[task] ?? 'gpt-4o-mini'
}

/** Returns the max token ceiling for the given task type */
export function getTokenLimitByTask(task: AgentTask): number {
  return TASK_TOKEN_LIMITS[task] ?? 2000
}
