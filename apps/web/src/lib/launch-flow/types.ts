export type LaunchFlowPhase = 'draft' | 'preview' | 'confirmed' | 'running' | 'paused' | 'completed' | 'rejected'

export type NodeStatus = 'ok' | 'warn' | 'error'

export type ExecutionPath = 'agent' | 'specialist' | null

export interface MindmapNode {
  id: string
  label: string
  status: NodeStatus
  detail?: string
  children?: MindmapNode[]
}

export interface LaunchChecklistItem {
  id: string
  label: string
  ok: boolean
  hint?: string
}

export interface LaunchFlowState {
  version: 1
  phase: LaunchFlowPhase
  pathChoice: ExecutionPath
  /** Tasdiqdan keyin yo‘l qulflangan */
  pathLocked: boolean
  goal: string
  dailyBudgetUsd: number
  mindmap: MindmapNode
  checklist: LaunchChecklistItem[]
  rejectCount: number
}
