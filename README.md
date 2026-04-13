# zod-env

Universal, type-safe environment variable validation powered by [Zod](https://zod.dev).

Works with **Next.js, Express, Fastify, Remix, Bun** — any Node.js project.

---

## Why

- `process.env` values are all `string | undefined` — no types, no validation
- Errors surface at runtime deep in your app instead of at startup
- `zod-env` validates your env at boot and gives you a **fully typed object** — no casting needed

---

## Install

```bash
npm install zod-env
# or
pnpm add zod-env
# or
yarn add zod-env
```

> `zod` is a peer dependency and is installed automatically (npm 7+, pnpm, yarn).

---

## Basic Usage

```ts
// env.ts
import { createEnv } from 'zod-env'
import { z } from 'zod'

export const env = createEnv({
  DATABASE_URL: z.string().url(),
  PORT: z.coerce.number().default(3000),
  NODE_ENV: z.enum(['development', 'test', 'production']),
  JWT_SECRET: z.string().min(32),
})

// Fully typed — no casting needed
env.PORT         // number
env.DATABASE_URL // string
env.NODE_ENV     // "development" | "test" | "production"
```

---

## Error Output

When validation fails, `zod-env` prints a clear, readable error and throws:

```
╔════════════════════════════════════════════╗
║  zod-env: Invalid Environment             ║
╚════════════════════════════════════════════╝

  ✗ DATABASE_URL
    Invalid url
    Got: "localhost/mydb"

  ✗ JWT_SECRET
    String must contain at least 32 character(s)
    Got: "tooshort"

  ✗ NODE_ENV
    Invalid enum value. Expected 'development' | 'test' | 'production'
    Got: "prod"

  Fix the above and restart your server.
```

---

## Options

```ts
const env = createEnv(schema, {
  // Custom env source. Defaults to process.env
  source: myCustomObject,

  // Log "✅ zod-env: N variables validated" on success (good for dev)
  verbose: true,

  // Called with structured errors before throwing — use for Sentry, logging, etc.
  onError: (errors) => {
    Sentry.captureException(new Error('Invalid env'), { extra: { errors } })
  },
})
```

### `onError` signature

```ts
type EnvValidationError = {
  field: string
  message: string
  received: string | undefined
}
```

---

## Framework Examples

### Next.js (App Router)

```ts
// src/env.ts
import { createEnv } from 'zod-env'
import { z } from 'zod'

export const env = createEnv({
  DATABASE_URL: z.string().url(),
  JWT_SECRET: z.string().min(32),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  NEXT_PUBLIC_API_URL: z.string().url(),
}, {
  verbose: process.env.NODE_ENV === 'development',
})
```

### Express

```ts
// src/env.ts
import { createEnv } from 'zod-env'
import { z } from 'zod'

export const env = createEnv({
  PORT: z.coerce.number().default(3000),
  DATABASE_URL: z.string().url(),
  JWT_SECRET: z.string().min(32),
}, {
  verbose: process.env.NODE_ENV === 'development',
})

// app.ts
import { env } from './env'
app.listen(env.PORT)
```

### Bun

```ts
// env.ts
import { createEnv } from 'zod-env'
import { z } from 'zod'

export const env = createEnv({
  PORT: z.coerce.number().default(3000),
  DATABASE_URL: z.string().url(),
  JWT_SECRET: z.string().min(32),
}, {
  source: Bun.env,
  verbose: Bun.env.NODE_ENV === 'development',
})
```

---

## TypeScript

`zod-env` uses the `InferEnv<T>` utility type to derive the return type from your schema. No manual type annotations needed.

```ts
import type { InferEnv } from 'zod-env'
import { z } from 'zod'

const schema = {
  PORT: z.coerce.number(),
  NODE_ENV: z.enum(['development', 'production']),
}

type Env = InferEnv<typeof schema>
// { PORT: number; NODE_ENV: "development" | "production" }
```

---

## vs t3-env

| Feature | zod-env | t3-env |
|---|---|---|
| Framework | Universal | Next.js focused |
| Setup | `createEnv(schema)` | Separate client/server schemas |
| Dependencies | zod only | Next.js types + more |
| Bundle | CJS + ESM | ESM only |
| Error output | Pretty box | Zod default |

---

## License

MIT
