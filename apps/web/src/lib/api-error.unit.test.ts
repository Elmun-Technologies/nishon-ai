import { describe, expect, it } from 'vitest'
import { getApiErrorMessage } from './api-error'

describe('getApiErrorMessage', () => {
  it('falls back to the provided default when the input is null/undefined', () => {
    expect(getApiErrorMessage(null, 'default')).toBe('default')
    expect(getApiErrorMessage(undefined, 'default')).toBe('default')
  })

  it('extracts response.data.message when it is a string', () => {
    const err = { response: { data: { message: 'Workspace not found' } } }
    expect(getApiErrorMessage(err, 'x')).toBe('Workspace not found')
  })

  it('joins an array of string messages with spaces', () => {
    const err = {
      response: { data: { message: ['email required', 'password too short'] } },
    }
    expect(getApiErrorMessage(err, 'x')).toBe(
      'email required password too short',
    )
  })

  it('filters out non-string entries from a message array', () => {
    const err = {
      response: { data: { message: ['ok', null, 42, '  ', 'also ok'] } },
    }
    expect(getApiErrorMessage(err, 'x')).toBe('ok also ok')
  })

  it('trims surrounding whitespace from a string message', () => {
    const err = { response: { data: { message: '   trimmed   ' } } }
    expect(getApiErrorMessage(err, 'x')).toBe('trimmed')
  })

  it('falls back to err.message when response shape is missing', () => {
    expect(getApiErrorMessage({ message: 'top-level' }, 'x')).toBe('top-level')
  })

  it('extracts Error.message for native errors', () => {
    expect(getApiErrorMessage(new Error('boom'), 'x')).toBe('boom')
  })

  it('a plain string error -> default (we only trust shaped objects/Errors)', () => {
    expect(getApiErrorMessage('not-an-object', 'default')).toBe('default')
  })

  it('all-whitespace messages fall through to fallback (not "")', () => {
    const err = { response: { data: { message: '   ' } } }
    expect(getApiErrorMessage(err, 'default')).toBe('default')
  })
})
