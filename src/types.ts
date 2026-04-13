import type { ZodTypeAny, z } from 'zod'

/** A record of field names to Zod types */
export type EnvSchema = Record<string, ZodTypeAny>

/** Infer the output type of an env schema */
export type InferEnv<T extends EnvSchema> = {
  [K in keyof T]: z.infer<T[K]>
}

export interface EnvOptions<T extends EnvSchema> {
  /** Custom env source. Defaults to process.env */
  source?: Record<string, string | undefined>
  /** Log a success summary table in development. Defaults to false */
  verbose?: boolean
  /** Called with formatted error string before throwing. Use for custom logging/alerting */
  onError?: (errors: EnvValidationError[]) => void
}

export interface EnvValidationError {
  field: string
  message: string
  received: string | undefined
}
