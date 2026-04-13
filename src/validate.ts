import { z } from 'zod'
import type { EnvSchema, EnvValidationError, InferEnv } from './types.js'

export interface ValidationResult<T extends EnvSchema> {
  success: true
  data: InferEnv<T>
}

export interface ValidationFailure {
  success: false
  errors: EnvValidationError[]
}

export function validate<T extends EnvSchema>(
  schema: T,
  source: Record<string, string | undefined>,
): ValidationResult<T> | ValidationFailure {
  const shape: Record<string, z.ZodTypeAny> = {}
  for (const key of Object.keys(schema)) {
    shape[key] = schema[key]
  }

  const zodObject = z.object(shape)
  const result = zodObject.safeParse(source)

  if (result.success) {
    return { success: true, data: result.data as InferEnv<T> }
  }

  const errors: EnvValidationError[] = result.error.issues.map((issue) => {
    const field = issue.path[0]?.toString() ?? 'unknown'
    return {
      field,
      message: issue.message,
      received: source[field],
    }
  })

  return { success: false, errors }
}
