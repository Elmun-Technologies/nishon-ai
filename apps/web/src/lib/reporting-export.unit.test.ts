import { describe, expect, it } from 'vitest'
import {
  buildCsvFromData,
  buildFlatRows,
  type ReportDataShape,
} from './reporting-export'

function fixture(): ReportDataShape {
  return {
    workspaceId: 'ws-1',
    days: 30,
    accounts: [
      {
        id: 'acc-A',
        name: 'Account A',
        currency: 'UZS',
        timezone: 'Asia/Tashkent',
        metrics: { spend: 100, clicks: 10, impressions: 100, ctr: 0.1, cpc: 10 },
        campaigns: [
          {
            id: 'c1',
            name: 'Camp 1',
            status: 'ACTIVE',
            objective: 'OUTCOME_LEADS',
            metrics: { spend: 60, clicks: 6, impressions: 60, ctr: 0.1, cpc: 10 },
          },
          {
            id: 'c2',
            // Name contains comma+quote — must be CSV-escaped.
            name: 'Spring sale, "promo"',
            status: 'PAUSED',
            // Null objective renders as empty cell, not literal "null".
            objective: null,
            metrics: { spend: 40, clicks: 4, impressions: 40, ctr: 0.1, cpc: 10 },
          },
        ],
      },
    ],
  }
}

describe('buildFlatRows', () => {
  it('produces one row per campaign across all accounts', () => {
    const rows = buildFlatRows(fixture())
    expect(rows).toHaveLength(2)
  })

  it('lays out account/campaign columns in the documented order', () => {
    const row = buildFlatRows(fixture())[0]
    expect(row[0]).toBe('Account A') // account name
    expect(row[2]).toBe('Camp 1') // campaign name
    expect(row[4]).toBe('ACTIVE') // status
    expect(row[5]).toBe('OUTCOME_LEADS') // objective
    expect(row[6]).toBe('60.00') // spend toFixed(2)
  })

  it('renders a null objective as an empty cell', () => {
    const rows = buildFlatRows(fixture())
    expect(rows[1][5]).toBe('')
  })
})

describe('buildCsvFromData', () => {
  it('starts with a header row containing every documented column', () => {
    const csv = buildCsvFromData(fixture())
    const header = csv.split('\n')[0]
    for (const col of [
      'Account',
      'Campaign',
      'Status',
      'Objective',
      'Spend',
      'Clicks',
      'Impressions',
      'CTR',
      'CPC',
    ]) {
      expect(header).toContain(col)
    }
  })

  it('escapes commas and double-quotes inside a cell', () => {
    const csv = buildCsvFromData(fixture())
    // Per RFC 4180 the cell becomes "Spring sale, ""promo""".
    expect(csv).toContain('"Spring sale, ""promo"""')
  })

  it('has header + one line per campaign', () => {
    const csv = buildCsvFromData(fixture())
    expect(csv.split('\n')).toHaveLength(1 + 2)
  })
})
