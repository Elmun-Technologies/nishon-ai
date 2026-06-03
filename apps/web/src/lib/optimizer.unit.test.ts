import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import {
  appendLearning,
  bumpOptimizerFailureCount,
  checkCampaign,
  DEFAULT_OPTIMIZER_PREFS,
  getSignal,
  OPTIMIZER_INTERVALS,
  readLearning,
} from './optimizer'

// In-memory localStorage shim so these tests don't depend on jsdom.
class MemStorage {
  store = new Map<string, string>()
  getItem(k: string) {
    return this.store.has(k) ? this.store.get(k)! : null
  }
  setItem(k: string, v: string) {
    this.store.set(k, v)
  }
  removeItem(k: string) {
    this.store.delete(k)
  }
  clear() {
    this.store.clear()
  }
  key(i: number) {
    return Array.from(this.store.keys())[i] ?? null
  }
  get length() {
    return this.store.size
  }
}

beforeEach(() => {
  ;(globalThis as any).window = { localStorage: new MemStorage() }
  ;(globalThis as any).localStorage = (globalThis as any).window.localStorage
})

afterEach(() => {
  delete (globalThis as any).window
  delete (globalThis as any).localStorage
})

describe('DEFAULT_OPTIMIZER_PREFS', () => {
  it('is conservative: auto on routine optimisations only', () => {
    expect(DEFAULT_OPTIMIZER_PREFS.roasDrop).toBe('auto_reduce_budget')
    expect(DEFAULT_OPTIMIZER_PREFS.creativeFatigue).toBe('auto_rotate')
  })
})

describe('OPTIMIZER_INTERVALS', () => {
  it('agent runs every 2 hours; specialist SLA is 1 hour', () => {
    expect(OPTIMIZER_INTERVALS.agentHours).toBe(2)
    expect(OPTIMIZER_INTERVALS.specialistSlaHours).toBe(1)
    expect(OPTIMIZER_INTERVALS.smartAlertsRealtime).toBe(true)
  })
})

describe('getSignal — deterministic demo bridge', () => {
  it('returns the same slice for the same campaignId across calls', async () => {
    const a = await getSignal('camp-1')
    const b = await getSignal('camp-1')
    // asOf is the only field that intentionally varies (Date.now()).
    delete (a as any).asOf
    delete (b as any).asOf
    expect(a).toEqual(b)
  })

  it('different campaignIds produce different signals', async () => {
    const a = await getSignal('camp-1')
    const b = await getSignal('camp-different')
    // At least one numeric field should differ.
    const fieldsDiffer =
      a.roas !== b.roas ||
      a.ctr !== b.ctr ||
      a.cpm !== b.cpm ||
      a.frequency !== b.frequency
    expect(fieldsDiffer).toBe(true)
  })

  it('roas is always positive (the demo bridge floor)', async () => {
    const s = await getSignal('camp-1')
    expect(s.roas).toBeGreaterThan(0)
  })
})

describe('readLearning / appendLearning — localStorage roundtrip', () => {
  it('returns the empty shape when there is nothing stored', () => {
    const out = readLearning('camp-1')
    expect(out).toEqual({ failedActions: 0, notes: [] })
  })

  it('appendLearning persists a note that readLearning can recover', () => {
    appendLearning('camp-1', 'budget -20%')
    expect(readLearning('camp-1').notes).toEqual(['budget -20%'])
    expect(readLearning('camp-1').failedActions).toBe(0)
  })

  it('appendLearning with incrementFailure bumps the failure counter', () => {
    appendLearning('camp-1', 'pause', true)
    appendLearning('camp-1', 'pause', true)
    expect(readLearning('camp-1').failedActions).toBe(2)
  })

  it('caps the notes history at 40 entries (rolling window)', () => {
    for (let i = 0; i < 50; i++) {
      appendLearning('camp-1', `note-${i}`)
    }
    const { notes } = readLearning('camp-1')
    expect(notes).toHaveLength(40)
    // The oldest 10 are gone; the newest is still there.
    expect(notes[notes.length - 1]).toBe('note-49')
  })

  it('readLearning safely handles a corrupted localStorage entry', () => {
    localStorage.setItem(
      'adspectr-optimizer-learning-camp-1',
      'not-json-at-all{',
    )
    expect(readLearning('camp-1')).toEqual({ failedActions: 0, notes: [] })
  })

  it('bumpOptimizerFailureCount increments the failure count by one', () => {
    expect(readLearning('camp-x').failedActions).toBe(0)
    bumpOptimizerFailureCount('camp-x')
    expect(readLearning('camp-x').failedActions).toBe(1)
  })
})

// The rule engine takes a signal computed by getSignal() and emits
// {executed, alerts, escalations, recommendations}. We can't mock the
// per-module getSignal closure across ESM, so these tests use deterministic
// inputs whose getSignal values are known to fire the asserted branches.
describe('checkCampaign — rule engine (deterministic signals)', () => {
  it('returns the documented result shape with arrays for every bucket', async () => {
    const out = await checkCampaign('any-id')
    expect(out.campaignId).toBe('any-id')
    expect(Array.isArray(out.executed)).toBe(true)
    expect(Array.isArray(out.alerts)).toBe(true)
    expect(Array.isArray(out.escalations)).toBe(true)
    expect(Array.isArray(out.recommendations)).toBe(true)
    expect(Array.isArray(out.learningDelta)).toBe(true)
  })

  it("for the demo bridge signal of 'c-1' (ROAS 1.43, CPM 6.3): triggers ROAS-dip and CPM-warn", async () => {
    // Pre-computed from hashCampaign('c-1'): roas=1.43, prevRoas=1.395, cpm=6.3.
    // That hits BOTH the two-tick ROAS dip and the CPM>5 alert with default prefs.
    const out = await checkCampaign('c-1')
    expect(out.alerts.some((a) => a.level === 'warn')).toBe(true)
    expect(out.recommendations.some((r) => /audience/i.test(r.message))).toBe(
      true,
    )
    // With auto pref (default), the budget decrease is executed.
    expect(out.executed.some((e) => e.kind === 'decrease_budget')).toBe(true)
  })

  it("'c-1' with ask_me prefs surfaces a recommendation instead of executing", async () => {
    const out = await checkCampaign('c-1', {
      roasDrop: 'ask_me',
      creativeFatigue: 'auto_rotate',
    })
    expect(
      out.executed.find((e) => e.kind === 'decrease_budget'),
    ).toBeUndefined()
    // The recommendations now include the budget-decrease suggestion.
    expect(out.recommendations.some((r) => /budget/i.test(r.message))).toBe(
      true,
    )
  })

  it('3 prior failures in learning -> escalation surfaces in result', async () => {
    bumpOptimizerFailureCount('c-1')
    bumpOptimizerFailureCount('c-1')
    bumpOptimizerFailureCount('c-1')
    const out = await checkCampaign('c-1')
    expect(out.escalations.length).toBeGreaterThan(0)
    expect(out.escalations[0]).toMatch(/Marketplace|specialist|refund/i)
  })
})
