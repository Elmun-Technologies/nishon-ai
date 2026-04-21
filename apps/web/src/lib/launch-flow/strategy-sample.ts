import type { LaunchFlowState, MindmapNode } from './types'

export function buildMindmap(budget: number): MindmapNode {
  const metaShare = Math.round(budget * 0.7 * 100) / 100
  const yndxShare = Math.round(budget * 0.3 * 100) / 100
  return {
    id: 'root',
    label: `[MAQSAD: Sotuv]`,
    status: 'ok',
    children: [
      {
        id: 'platform',
        label: `Platforma: Meta (70%), Yandex (30%)`,
        status: 'ok',
        detail: 'Tranzaksiya va pacing keyinroq API bilan.',
      },
      {
        id: 'budget',
        label: `Budget: $${budget}/kun → $${metaShare} Meta, $${yndxShare} Yandex`,
        status: budget >= 10 ? 'ok' : 'warn',
        detail: budget < 10 ? 'Kamida $10/kun tavsiya etiladi.' : undefined,
      },
      {
        id: 'audience',
        label: 'Auditoriya: 18-24 ayol, Toshkent',
        status: 'ok',
        children: [
          {
            id: 'interests',
            label: "Qiziqishlar: krossovka, moda",
            status: 'ok',
          },
        ],
      },
      {
        id: 'creative',
        label: 'Kreativ: 3 ta video (9:16)',
        status: 'ok',
        children: [
          { id: 'hook', label: 'Hook: "Oyoq og\'rimaydi"', status: 'ok' },
          { id: 'cta', label: 'CTA: "Hoziroq ol"', status: 'ok' },
          { id: 'utp', label: 'UTP: "Ertaga yetkazish"', status: 'ok' },
        ],
      },
      {
        id: 'opt',
        label: 'Optimizatsiya: ROAS<2 → pause (tavsiya, tasdiq bilan)',
        status: 'ok',
      },
    ],
  }
}

export function applyBudgetToState(state: LaunchFlowState, dailyBudgetUsd: number): LaunchFlowState {
  return {
    ...state,
    dailyBudgetUsd,
    mindmap: buildMindmap(dailyBudgetUsd),
    checklist: state.checklist.map((c) =>
      c.id === 'budget'
        ? {
            ...c,
            ok: dailyBudgetUsd >= 10,
            hint: dailyBudgetUsd < 10 ? 'Juda kam — kamida $10' : undefined,
          }
        : c,
    ),
  }
}

export function buildDefaultLaunchState(overrides?: Partial<{ dailyBudgetUsd: number }>): LaunchFlowState {
  const dailyBudgetUsd = overrides?.dailyBudgetUsd ?? 20
  const pixelOk = false
  return {
    version: 1,
    phase: 'preview',
    pathChoice: null,
    pathLocked: false,
    goal: 'Sotuv',
    dailyBudgetUsd,
    mindmap: buildMindmap(dailyBudgetUsd),
    checklist: [
      { id: 'pixel', label: 'Pixel o‘rnatilgan', ok: pixelOk, hint: pixelOk ? undefined : "Avval pixel o'rnating" },
      {
        id: 'budget',
        label: 'Budget yetarli',
        ok: dailyBudgetUsd >= 10,
        hint: dailyBudgetUsd < 10 ? 'Juda kam — kamida $10' : undefined,
      },
      { id: 'creative', label: 'Kreativlar tayyor', ok: true },
    ],
    rejectCount: 0,
  }
}
