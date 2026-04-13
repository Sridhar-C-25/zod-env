import { describe, expect, it, vi } from 'vitest'
import { z } from 'zod'
import { createEnv } from '../src/index.js'
import type { EnvValidationError } from '../src/index.js'

function silenceConsoleError() {
  return vi.spyOn(console, 'error').mockImplementation(() => {})
}

describe('createEnv — validation errors', () => {
  it('throws when a required variable is missing', () => {
    const spy = silenceConsoleError()
    expect(() =>
      createEnv({ DATABASE_URL: z.string() }, { source: {} }),
    ).toThrow('zod-env: environment validation failed')
    spy.mockRestore()
  })

  it('throws on wrong type', () => {
    const spy = silenceConsoleError()
    expect(() =>
      createEnv(
        { PORT: z.number() },
        { source: { PORT: 'not-a-number' } },
      ),
    ).toThrow()
    spy.mockRestore()
  })

  it('throws on invalid enum value', () => {
    const spy = silenceConsoleError()
    expect(() =>
      createEnv(
        { NODE_ENV: z.enum(['development', 'production']) },
        { source: { NODE_ENV: 'prod' } },
      ),
    ).toThrow()
    spy.mockRestore()
  })

  it('throws on failed string constraint', () => {
    const spy = silenceConsoleError()
    expect(() =>
      createEnv(
        { JWT_SECRET: z.string().min(32) },
        { source: { JWT_SECRET: 'tooshort' } },
      ),
    ).toThrow()
    spy.mockRestore()
  })

  it('prints a formatted error box to stderr', () => {
    const spy = silenceConsoleError()
    try {
      createEnv({ DATABASE_URL: z.string().url() }, { source: { DATABASE_URL: 'not-a-url' } })
    } catch {}
    const output: string = spy.mock.calls[0][0]
    expect(output).toContain('zod-env: Invalid Environment')
    expect(output).toContain('DATABASE_URL')
    expect(output).toContain('Fix the above and restart your server.')
    spy.mockRestore()
  })

  it('calls onError with structured error list', () => {
    const spy = silenceConsoleError()
    const captured: EnvValidationError[] = []
    try {
      createEnv(
        { PORT: z.coerce.number().int().positive() },
        {
          source: { PORT: '-1' },
          onError: (errs) => captured.push(...errs),
        },
      )
    } catch {}
    expect(captured.length).toBeGreaterThan(0)
    expect(captured[0].field).toBe('PORT')
    spy.mockRestore()
  })

  it('reports multiple errors at once', () => {
    const spy = silenceConsoleError()
    const captured: EnvValidationError[] = []
    try {
      createEnv(
        {
          A: z.string(),
          B: z.string(),
          C: z.string(),
        },
        {
          source: {},
          onError: (errs) => captured.push(...errs),
        },
      )
    } catch {}
    expect(captured.map((e) => e.field).sort()).toEqual(['A', 'B', 'C'])
    spy.mockRestore()
  })

  it('includes received value in error output', () => {
    const spy = silenceConsoleError()
    try {
      createEnv(
        { NODE_ENV: z.enum(['development', 'production']) },
        { source: { NODE_ENV: 'staging' } },
      )
    } catch {}
    const output: string = spy.mock.calls[0][0]
    expect(output).toContain('"staging"')
    spy.mockRestore()
  })
})
