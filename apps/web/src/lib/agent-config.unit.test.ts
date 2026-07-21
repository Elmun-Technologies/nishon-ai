import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import {
  agentConfigFromApi,
  loadAgentConfig,
  saveAgentConfigLocal,
  STOP_LOSS_DEFAULT_USD,
  type AgentConfig,
} from './agent-config'

/**
 * The vitest unit environment is `node` (no DOM), so install a minimal
 * in-memory localStorage + window shim for the cache round-trip tests.
 */
function installStorageShim() {
  const store = new Map<string, string>()
  const localStorage = {
    getItem: (k: string) => (store.has(k) ? store.get(k)! : null),
    setItem: (k: string, v: string) => void store.set(k, String(v)),
    removeItem: (k: string) => void store.delete(k),
    clear: () => store.clear(),
  }
  ;(globalThis as Record<string, unknown>).window = { localStorage }
  ;(globalThis as Record<string, unknown>).localStorage = localStorage
  return store
}

function removeStorageShim() {
  delete (globalThis as Record<string, unknown>).window
  delete (globalThis as Record<string, unknown>).localStorage
}

describe('agentConfigFromApi', () => {
  it('returns null for null / non-object input', () => {
    expect(agentConfigFromApi(null)).toBeNull()
    expect(agentConfigFromApi(undefined)).toBeNull()
    expect(agentConfigFromApi('nope')).toBeNull()
    expect(agentConfigFromApi(42)).toBeNull()
  })

  it('returns null when the row was never activated (no activatedAt)', () => {
    expect(
      agentConfigFromApi({ goal: 'sales', budget: 2000, activatedAt: null }),
    ).toBeNull()
    expect(agentConfigFromApi({ goal: 'sales', budget: 2000 })).toBeNull()
  })

  it('maps a persisted row to the frontend shape', () => {
    const cfg = agentConfigFromApi({
      link: 'https://shop.uz',
      goal: 'brand',
      budget: 5000,
      stopLossUsd: 40,
      activatedAt: '2026-07-01T00:00:00.000Z',
    })
    expect(cfg).toEqual<AgentConfig>({
      link: 'https://shop.uz',
      goal: 'brand',
      budget: 5000,
      stopLossUsd: 40,
      activatedAt: '2026-07-01T00:00:00.000Z',
    })
  })

  it('normalizes legacy goals and falls back on bad numbers', () => {
    const cfg = agentConfigFromApi({
      goal: 'awareness',
      budget: 'not-a-number',
      stopLossUsd: 0,
      activatedAt: '2026-07-01T00:00:00.000Z',
    })
    expect(cfg?.goal).toBe('brand')
    expect(cfg?.budget).toBe(0)
    expect(cfg?.stopLossUsd).toBe(STOP_LOSS_DEFAULT_USD)
    expect(cfg?.link).toBe('')
  })
})

describe('local cache round-trip', () => {
  beforeEach(() => {
    installStorageShim()
  })
  afterEach(() => {
    removeStorageShim()
  })

  it('saves and loads a config for a workspace', () => {
    const cfg: AgentConfig = {
      link: 'https://a.uz',
      goal: 'sales',
      budget: 1200,
      stopLossUsd: 30,
      activatedAt: '2026-07-01T00:00:00.000Z',
    }
    saveAgentConfigLocal('ws-1', cfg)
    expect(loadAgentConfig('ws-1')).toEqual(cfg)
  })

  it('returns null for an unknown workspace or missing id', () => {
    expect(loadAgentConfig('ws-unknown')).toBeNull()
    expect(loadAgentConfig(undefined)).toBeNull()
  })

  it('normalizes a legacy goal stored in the cache', () => {
    window.localStorage.setItem(
      'nishon.agentConfig.ws-2',
      JSON.stringify({
        link: '',
        goal: 'awareness',
        budget: 900,
        stopLossUsd: 30,
        activatedAt: '2026-07-01T00:00:00.000Z',
      }),
    )
    expect(loadAgentConfig('ws-2')?.goal).toBe('brand')
  })
})
