import { formatErrors, formatSuccess } from './format.js'
import type { EnvSchema, EnvValidationError, InferEnv } from './types.js'
import { validate } from './validate.js'

export interface NextEnvOptions<
  TServer extends EnvSchema,
  TClient extends EnvSchema,
> {
  /** Server-only env vars — auto-sourced from process.env, never sent to the browser */
  server?: TServer
  /** Client-safe env vars — must all start with NEXT_PUBLIC_ */
  client?: TClient
  /**
   * Explicit process.env references for each client key.
   * Required because Next.js/webpack can only inline static process.env.KEY literals,
   * not dynamic access. Server keys are auto-sourced and don't need to be listed here.
   */
  runtimeEnv: { [K in keyof TClient]: string | undefined }
  /** Log a success summary in development */
  verbose?: boolean
  /** Called with validation errors before exiting */
  onError?: (errors: EnvValidationError[]) => void
  /**
   * Exit the process on validation failure instead of throwing.
   * Default: false — throws an error normally.
   * Set to true for a clean terminal output without Next.js stack trace noise.
   */
  bail?: boolean
}

export function createNextEnv<
  TServer extends EnvSchema = Record<never, never>,
  TClient extends EnvSchema = Record<never, never>,
>(
  options: NextEnvOptions<TServer, TClient>,
): InferEnv<TServer> & InferEnv<TClient> {
  const {
    server = {} as TServer,
    client = {} as TClient,
    runtimeEnv,
    verbose,
    onError,
    bail = false,
  } = options

  for (const key of Object.keys(client)) {
    if (!key.startsWith('NEXT_PUBLIC_')) {
      throw new Error(
        `envzod/next: client key "${key}" must start with NEXT_PUBLIC_.\n` +
        `Server-only keys belong in the "server" schema.`,
      )
    }
  }

  const schema = { ...server, ...client } as TServer & TClient

  // Server vars: auto-sourced from process.env (works on server, not needed in browser)
  // Client vars: explicitly provided via runtimeEnv (Next.js static inlining requirement)
  const source: Record<string, string | undefined> = {
    ...process.env,
    ...runtimeEnv,
  }

  const result = validate(schema, source)

  if (!result.success) {
    const formatted = formatErrors(result.errors)
    console.error(formatted)
    onError?.(result.errors)
    if (bail) {
      process.exit(1)
    }
    throw new Error(formatted)
  }

  if (verbose) {
    console.log(formatSuccess(Object.keys(schema).length))
  }

  return result.data as InferEnv<TServer> & InferEnv<TClient>
}
