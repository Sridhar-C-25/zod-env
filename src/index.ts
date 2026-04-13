import { formatErrors, formatSuccess } from './format.js'
import type { EnvOptions, EnvSchema, InferEnv } from './types.js'
import { validate } from './validate.js'

export function createEnv<T extends EnvSchema>(
  schema: T,
  options?: EnvOptions<T>,
): InferEnv<T> {
  const source = options?.source ?? (process.env as Record<string, string | undefined>)
  const result = validate(schema, source)

  if (!result.success) {
    const formatted = formatErrors(result.errors)
    console.error(formatted)
    options?.onError?.(result.errors)
    throw new Error('zod-env: environment validation failed')
  }

  if (options?.verbose) {
    console.log(formatSuccess(Object.keys(schema).length))
  }

  return result.data
}

export type { EnvOptions, EnvSchema, EnvValidationError, InferEnv } from './types.js'
