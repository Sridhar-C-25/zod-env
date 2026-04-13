import { describe, expect, it, vi } from 'vitest'
import { z } from 'zod'
import { createEnv } from '../src/index.js'

describe('createEnv — happy path', () => {
  it('parses and returns typed values', () => {
    const env = createEnv(
      {
        PORT: z.coerce.number(),
        NODE_ENV: z.enum(['development', 'production', 'test']),
        APP_NAME: z.string(),
      },
      {
        source: {
          PORT: '4000',
          NODE_ENV: 'development',
          APP_NAME: 'my-app',
        },
      },
    )

    expect(env.PORT).toBe(4000)
    expect(env.NODE_ENV).toBe('development')
    expect(env.APP_NAME).toBe('my-app')
  })

  it('applies zod defaults when variable is missing', () => {
    const env = createEnv(
      { PORT: z.coerce.number().default(3000) },
      { source: {} },
    )
    expect(env.PORT).toBe(3000)
  })

  it('uses a custom source instead of process.env', () => {
    const env = createEnv(
      { SECRET: z.string() },
      { source: { SECRET: 'abc123' } },
    )
    expect(env.SECRET).toBe('abc123')
  })

  it('logs success summary when verbose is true', () => {
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {})
    createEnv(
      { NAME: z.string() },
      { source: { NAME: 'zod-env' }, verbose: true },
    )
    expect(spy).toHaveBeenCalledWith(expect.stringContaining('1 variable validated'))
    spy.mockRestore()
  })

  it('does not log when verbose is false (default)', () => {
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {})
    createEnv({ NAME: z.string() }, { source: { NAME: 'zod-env' } })
    expect(spy).not.toHaveBeenCalled()
    spy.mockRestore()
  })

  it('coerces types correctly', () => {
    const env = createEnv(
      {
        DEBUG: z.coerce.boolean(),
        TIMEOUT: z.coerce.number(),
      },
      { source: { DEBUG: 'true', TIMEOUT: '5000' } },
    )
    expect(env.DEBUG).toBe(true)
    expect(env.TIMEOUT).toBe(5000)
  })

  it('supports optional fields', () => {
    const env = createEnv(
      { OPTIONAL: z.string().optional() },
      { source: {} },
    )
    expect(env.OPTIONAL).toBeUndefined()
  })
})
