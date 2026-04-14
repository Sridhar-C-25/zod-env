import { createNextEnv } from 'envzod/next'
import { z } from 'zod'

// envzod.config.ts — single source of truth for schema
// Both this file and the CLI (npx envzod check) read from it.
//
// export const server = {
//   DATABASE_URL: z.string().url(),
//   JWT_SECRET: z.string().min(32),
//   NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
// }
// export const client = {
//   NEXT_PUBLIC_API_URL: z.string().url(),
//   NEXT_PUBLIC_APP_NAME: z.string().default('My App'),
// }

// env.ts — wires schema to Next.js runtime env
//
// IMPORTANT: Next.js/Turbopack only inlines NEXT_PUBLIC_* vars when referenced
// explicitly (e.g. process.env.NEXT_PUBLIC_FOO). This is a webpack/turbopack
// static analysis requirement — dynamic access won't work on the client side.
//
// createNextEnv handles this by:
//   - server vars: auto-sourced from process.env (no repetition needed)
//   - client vars: you provide explicit process.env.KEY references in runtimeEnv

const server = {
  DATABASE_URL: z.string().url(),
  JWT_SECRET: z.string().min(32),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
}

const client = {
  NEXT_PUBLIC_API_URL: z.string().url(),
  NEXT_PUBLIC_APP_NAME: z.string().default('My App'),
}

export const env = createNextEnv({
  server,
  client,
  runtimeEnv: {
    // Only NEXT_PUBLIC_* vars need to be listed here.
    // Server vars are auto-sourced from process.env.
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME,
  },
  verbose: process.env.NODE_ENV === 'development',
  // bail: true  — uncomment for clean process.exit(1) on invalid env (no Next.js noise)
})

// Usage:
// import { env } from '@/env'
// env.DATABASE_URL              // string  (server only)
// env.JWT_SECRET                // string  (server only)
// env.NODE_ENV                  // "development" | "test" | "production"
// env.NEXT_PUBLIC_API_URL       // string  (safe in browser)
// env.NEXT_PUBLIC_APP_NAME      // string  (safe in browser)
