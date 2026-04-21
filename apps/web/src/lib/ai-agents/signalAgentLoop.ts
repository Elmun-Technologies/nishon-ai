/**
 * Soatlik agent tsikli: Signal Bridge → LLM tavsiya (stub) → Telegram → human / auto-approve.
 */

import type { BusinessState } from '@/lib/signalBridge'
import { getBusinessState } from '@/lib/signalBridge'

export type AgentSuggestion = {
  text: string
  /** 0–1 */
  confidence: number
  proposedAction?: 'reduce_budget_20' | 'none' | 'scale_winning_adset'
}

export type HourlyTickResult = {
  state: BusinessState
  suggestion: AgentSuggestion
  telegramSent: boolean
  /** Avtomatik bajarildi (faqat confidence va flag) */
  autoExecuted: boolean
  pendingHumanApproval: boolean
}

/** Oddiy qoida + "LLM" o'rniga deterministik confidence (keyin GPT). */
export function buildSuggestionFromState(state: BusinessState): AgentSuggestion {
  if (state.roas < 2) {
    return {
      text: `ROAS ${state.roas} — byudjetni 20% kamaytirishni tavsiya qilaman (xarajat ${state.spend}, sotuvlar ${state.purchases}).`,
      confidence: state.roas < 1.5 ? 0.92 : 0.78,
      proposedAction: 'reduce_budget_20',
    }
  }
  if (state.roas > 3.5) {
    return {
      text: `ROAS ${state.roas} — yutuqli adsetni scaling qilish mumkin.`,
      confidence: 0.72,
      proposedAction: 'scale_winning_adset',
    }
  }
  return {
    text: `Holat barqaror (ROAS ${state.roas}). Kuzatishni davom ettiramiz.`,
    confidence: 0.55,
    proposedAction: 'none',
  }
}

export async function notifyTargetologistTelegramStub(input: {
  chatId?: string
  suggestion: AgentSuggestion
  businessId: string
}): Promise<boolean> {
  if (!input.chatId) return false
  // Production: POST internal telegram yoki Bot API
  return true
}

/**
 * Bir tick: state olish → tavsiya → Telegram → auto-approve sharti.
 */
export async function runHourlySignalAgentTick(input: {
  businessId: string
  agentId: string
  targetologistTelegramChatId?: string
  autoApproveEnabled?: boolean
  autoApproveMinConfidence?: number
}): Promise<HourlyTickResult> {
  const state = await getBusinessState(input.businessId)
  const suggestion = buildSuggestionFromState(state)
  const minConf = input.autoApproveMinConfidence ?? 0.9
  const auto =
    Boolean(input.autoApproveEnabled) && suggestion.confidence >= minConf && suggestion.proposedAction !== 'none'

  const telegramSent = await notifyTargetologistTelegramStub({
    chatId: input.targetologistTelegramChatId,
    suggestion,
    businessId: input.businessId,
  })

  return {
    state,
    suggestion,
    telegramSent,
    autoExecuted: auto,
    pendingHumanApproval: !auto && suggestion.proposedAction !== 'none',
  }
}
