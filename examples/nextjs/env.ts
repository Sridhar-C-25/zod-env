import { createEnv } from 'envzod'
import { z } from 'zod'

// IMPORTANT: Next.js/Turbopack only inlines NEXT_PUBLIC_* vars when referenced
// explicitly (e.g. process.env.NEXT_PUBLIC_FOO). Passing the whole process.env
// object to source won't work on the client side.
// Always list each var individually in the source option.

export const env = createEnv(
  {
    // Server-only vars
    DATABASE_URL: z.string().url(),
    JWT_SECRET: z.string().min(32),
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),

    // Public vars (accessible in browser — must be prefixed NEXT_PUBLIC_)
    NEXT_PUBLIC_API_URL: z.string().url(),
    NEXT_PUBLIC_APP_NAME: z.string().default('My App'),
  },
  {
    source: {
      DATABASE_URL: process.env.DATABASE_URL,
      JWT_SECRET: process.env.JWT_SECRET,
      NODE_ENV: process.env.NODE_ENV,
      NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
      NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME,
    },
    verbose: process.env.NODE_ENV === 'development',
  },
)

// Usage:
// import { env } from '@/env'
// env.DATABASE_URL              // string
// env.NEXT_PUBLIC_API_URL       // string
// env.NODE_ENV                  // "development" | "test" | "production"
