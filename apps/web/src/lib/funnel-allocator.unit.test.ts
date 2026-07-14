import { describe, expect, it } from 'vitest'
import {
  allocateFunnelBudget,
  normalizeGoal,
  type AgentGoal,
} from './funnel-allocator'

const GOALS: AgentGoal[] = ['sales', 'brand']

describe('allocateFunnelBudget', () => {
  it('splits the total across exactly three funnel stages (TOFU/MOFU/BOFU)', () => {
    const res = allocateFunnelBudget({ goal: 'sales', totalBudget: 3000 })
    expect(res.stages.map((s) => s.stage)).toEqual(['TOFU', 'MOFU', 'BOFU'])
  })

  it('uses the Sales formula (30 / 40 / 30)', () => {
    const res = allocateFunnelBudget({ goal: 'sales', totalBudget: 2000 })
    expect(res.stages.map((s) => s.pct)).toEqual([30, 40, 30])
    expect(res.stages.map((s) => s.amount)).toEqual([600, 800, 600])
    // Channels per stage.
    expect(res.stages[0].channels.map((c) => c.channel)).toEqual(['meta', 'tiktok'])
    expect(res.stages[1].channels.map((c) => c.channel)).toEqual(['google', 'telegram'])
    expect(res.stages[2].channels.map((c) => c.channel)).toEqual(['retargeting'])
  })

  it('uses the Brand formula (60 / 30 / 10)', () => {
    const res = allocateFunnelBudget({ goal: 'brand', totalBudget: 1000 })
    expect(res.stages.map((s) => s.pct)).toEqual([60, 30, 10])
    expect(res.stages.map((s) => s.amount)).toEqual([600, 300, 100])
    expect(res.stages[0].channels.map((c) => c.channel)).toEqual(['meta', 'youtube'])
    expect(res.stages[1].channels.map((c) => c.channel)).toEqual(['influencers', 'telegram'])
    expect(res.stages[2].channels.map((c) => c.channel)).toEqual(['search'])
  })

  it.each(GOALS)('stage amounts reconcile exactly to the total (%s)', (goal) => {
    const total = 2000
    const res = allocateFunnelBudget({ goal, totalBudget: total })
    expect(res.stages.reduce((a, s) => a + s.amount, 0)).toBe(total)
  })

  it.each(GOALS)('channels within a stage reconcile to the stage amount (%s)', (goal) => {
    const res = allocateFunnelBudget({ goal, totalBudget: 1234 })
    for (const stage of res.stages) {
      const sum = stage.channels.reduce((a, c) => a + c.amount, 0)
      expect(sum).toBe(stage.amount)
    }
  })

  it.each(GOALS)('per-channel totals reconcile exactly to the total (%s)', (goal) => {
    const total = 999
    const res = allocateFunnelBudget({ goal, totalBudget: total })
    expect(res.byChannel.reduce((a, c) => a + c.amount, 0)).toBe(total)
  })

  it('splits a stage evenly across its two channels', () => {
    const res = allocateFunnelBudget({ goal: 'sales', totalBudget: 2000 })
    const tofu = res.stages.find((s) => s.stage === 'TOFU')!
    expect(tofu.channels.map((c) => c.amount)).toEqual([300, 300])
  })

  it('handles a zero budget without NaN or drift', () => {
    const res = allocateFunnelBudget({ goal: 'sales', totalBudget: 0 })
    expect(res.stages.every((s) => s.amount === 0)).toBe(true)
    expect(res.byChannel.every((c) => c.amount === 0 && c.pct === 0)).toBe(true)
  })

  it('rounds fractional budgets while keeping the sum exact', () => {
    const res = allocateFunnelBudget({ goal: 'brand', totalBudget: 777 })
    expect(res.byChannel.reduce((a, c) => a + c.amount, 0)).toBe(777)
  })
})

describe('normalizeGoal', () => {
  it('maps legacy "awareness" and "brand" to brand, everything else to sales', () => {
    expect(normalizeGoal('awareness')).toBe('brand')
    expect(normalizeGoal('brand')).toBe('brand')
    expect(normalizeGoal('sales')).toBe('sales')
    expect(normalizeGoal(undefined)).toBe('sales')
    expect(normalizeGoal('anything')).toBe('sales')
  })
})
