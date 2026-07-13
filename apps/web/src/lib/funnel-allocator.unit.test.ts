import { describe, expect, it } from 'vitest'
import {
  allocateFunnelBudget,
  PLATFORMS,
  type AgentGoal,
} from './funnel-allocator'

const GOALS: AgentGoal[] = ['sales', 'awareness']

describe('allocateFunnelBudget', () => {
  it('splits the total across exactly three funnel stages (TOFU/MOFU/BOFU)', () => {
    const res = allocateFunnelBudget({ goal: 'sales', totalBudget: 3000 })
    expect(res.stages.map((s) => s.stage)).toEqual(['TOFU', 'MOFU', 'BOFU'])
  })

  it.each(GOALS)('stage amounts reconcile exactly to the total (%s)', (goal) => {
    const total = 2000
    const res = allocateFunnelBudget({ goal, totalBudget: total })
    const sum = res.stages.reduce((a, s) => a + s.amount, 0)
    expect(sum).toBe(total)
  })

  it.each(GOALS)('per-platform totals reconcile exactly to the total (%s)', (goal) => {
    const total = 1000
    const res = allocateFunnelBudget({ goal, totalBudget: total })
    const sum = res.byPlatform.reduce((a, p) => a + p.amount, 0)
    expect(sum).toBe(total)
  })

  it.each(GOALS)('each stage splits exactly across its platforms (%s)', (goal) => {
    const res = allocateFunnelBudget({ goal, totalBudget: 1234 })
    for (const stage of res.stages) {
      const sum = stage.platforms.reduce((a, p) => a + p.amount, 0)
      expect(sum).toBe(stage.amount)
    }
  })

  it('covers all four platforms in every stage', () => {
    const res = allocateFunnelBudget({ goal: 'awareness', totalBudget: 500 })
    for (const stage of res.stages) {
      expect(stage.platforms.map((p) => p.platform).sort()).toEqual(
        [...PLATFORMS].sort(),
      )
    }
  })

  it('weights the top of the funnel for awareness goals', () => {
    const res = allocateFunnelBudget({ goal: 'awareness', totalBudget: 1000 })
    const tofu = res.stages.find((s) => s.stage === 'TOFU')!
    const bofu = res.stages.find((s) => s.stage === 'BOFU')!
    expect(tofu.amount).toBeGreaterThan(bofu.amount)
  })

  it('weights the bottom of the funnel for sales goals', () => {
    const res = allocateFunnelBudget({ goal: 'sales', totalBudget: 1000 })
    const tofu = res.stages.find((s) => s.stage === 'TOFU')!
    const bofu = res.stages.find((s) => s.stage === 'BOFU')!
    expect(bofu.amount).toBeGreaterThan(tofu.amount)
  })

  it('handles a zero budget without NaN or drift', () => {
    const res = allocateFunnelBudget({ goal: 'sales', totalBudget: 0 })
    expect(res.stages.every((s) => s.amount === 0)).toBe(true)
    expect(res.byPlatform.every((p) => p.amount === 0 && p.pct === 0)).toBe(true)
  })

  it('rounds fractional budgets while keeping the sum exact', () => {
    const res = allocateFunnelBudget({ goal: 'sales', totalBudget: 999 })
    const sum = res.byPlatform.reduce((a, p) => a + p.amount, 0)
    expect(sum).toBe(999)
  })
})
