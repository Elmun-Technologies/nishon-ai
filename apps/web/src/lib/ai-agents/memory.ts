import type { AgentMemorySnapshot } from './types'

export function emptyMemory(businessId: string): AgentMemorySnapshot {
  return {
    business_id: businessId,
    learnings: [],
    rules: [],
  }
}

export function appendLearning(mem: AgentMemorySnapshot, line: string): AgentMemorySnapshot {
  return { ...mem, learnings: [...mem.learnings, line].slice(-50) }
}
