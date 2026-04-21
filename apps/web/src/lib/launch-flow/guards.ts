import type { LaunchFlowState } from './types'

export function canConfirmStrategy(state: LaunchFlowState): boolean {
  return state.checklist.every((c) => c.ok)
}
