import { createEnv } from 'zod-env'
import { z } from 'zod'

// Place this file at the root of your Next.js app (e.g. src/env.ts)
// Import `env` anywhere you need validated env vars — never use process.env directly.

export const env = createEnv(
  {
    // Server-only vars
    DATABASE_URL: z.string().url(),
    JWT_SECRET: z.string().min(32),
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),

    // Public vars (must be prefixed NEXT_PUBLIC_ in Next.js)
    NEXT_PUBLIC_API_URL: z.string().url(),
    NEXT_PUBLIC_APP_NAME: z.string().default('My App'),
  },
  {
    verbose: process.env.NODE_ENV === 'development',
  },
)

// Usage:
// import { env } from '@/env'
// env.DATABASE_URL   // string
// env.NODE_ENV       // "development" | "test" | "production"
