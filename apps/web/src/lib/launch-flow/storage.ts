import type { LaunchFlowState } from './types'

const KEY = 'adspectr-launch-flow-v1'

export function loadLaunchFlowState(): LaunchFlowState | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = sessionStorage.getItem(KEY)
    if (!raw) return null
    return JSON.parse(raw) as LaunchFlowState
  } catch {
    return null
  }
}

export function saveLaunchFlowState(state: LaunchFlowState): void {
  if (typeof window === 'undefined') return
  sessionStorage.setItem(KEY, JSON.stringify(state))
}

export function clearLaunchFlowState(): void {
  if (typeof window === 'undefined') return
  sessionStorage.removeItem(KEY)
}
