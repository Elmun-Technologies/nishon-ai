import type { TargetologistAgentDraft } from '../types'

/** RAG + prompt engineering “train” — MVP JSON payload (LLM keyingi). */
export function buildTrainingJobPayload(draft: TargetologistAgentDraft): {
  systemPromptHint: string
  ragSources: { type: 'campaign_summary'; ids: string[] }[]
  rulesCompiled: string[]
} {
  const rulesCompiled = draft.rules
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean)

  return {
    systemPromptHint: `Vertical: ${draft.vertical}. Tone: ${draft.toneUz}. Faqat tavsiya, avtomatik pause yo‘q.`,
    ragSources: draft.campaignIds.map((id) => ({ type: 'campaign_summary' as const, ids: [id] })),
    rulesCompiled,
  }
}
