import { createEnv } from 'envzod'
import { z } from 'zod'

// Bun exposes env via Bun.env or process.env — both work with zod-env.
// Pass Bun.env as source for slightly better Bun compatibility.

export const env = createEnv(
  {
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    PORT: z.coerce.number().int().positive().default(3000),
    DATABASE_URL: z.string().url(),
    JWT_SECRET: z.string().min(32),
  },
  {
    source: Bun.env,
    verbose: Bun.env.NODE_ENV === 'development',
  },
)

// Usage:
// import { env } from './env'
// Bun.serve({ port: env.PORT, fetch: handler })
