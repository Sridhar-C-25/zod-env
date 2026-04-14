import { createEnv } from 'envzod'
import { z } from 'zod'

// Call this once at app startup (before app.listen).
// The app will crash with a clear error if env is invalid.

export const env = createEnv(
  {
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    PORT: z.coerce.number().int().positive().default(3000),
    DATABASE_URL: z.string().url(),
    JWT_SECRET: z.string().min(32),
    CORS_ORIGIN: z.string().url().optional(),
  },
  {
    verbose: process.env.NODE_ENV === 'development',
  },
)

// Usage in app.ts:
// import { env } from './env'
// app.listen(env.PORT, () => console.log(`Listening on ${env.PORT}`))
