# envzod

Universal, type-safe environment variable validation powered by [Zod](https://zod.dev).

Works with **Next.js, Express, Fastify, Remix, Bun** — any Node.js project.

---

## Why

- `process.env` values are all `string | undefined` — no types, no validation
- Errors surface at runtime deep in your app instead of at startup
- `envzod` validates your env at boot and gives you a **fully typed object** — no casting needed

---

## Install

```bash
npm install envzod
# or
pnpm add envzod
# or
yarn add envzod
```

> `zod` is a peer dependency and is installed automatically (npm 7+, pnpm, yarn).

---

## Basic Usage

```ts
// env.ts
import { createEnv } from "envzod";
import { z } from "zod";

export const env = createEnv({
  DATABASE_URL: z.string().url(),
  PORT: z.coerce.number().default(3000),
  NODE_ENV: z.enum(["development", "test", "production"]),
  JWT_SECRET: z.string().min(32),
});

// Fully typed — no casting needed
env.PORT;         // number
env.DATABASE_URL; // string
env.NODE_ENV;     // "development" | "test" | "production"
```

---

## Error Output

When validation fails, `envzod` prints a clear, readable error and throws:

```
╔════════════════════════════════════════════╗
║  zod-env: Invalid Environment              ║
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

The thrown error includes the full formatted details — visible in Next.js error overlays, server logs, and CI output.

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
    Sentry.captureException(new Error("Invalid env"), { extra: { errors } });
  },
});
```

### `onError` signature

```ts
type EnvValidationError = {
  field: string;
  message: string;
  received: string | undefined;
};
```

---

## Framework Examples

### Next.js (App Router) — `envzod/next`

Use `createNextEnv` from `envzod/next` for the best Next.js experience:

- **Server vars** are auto-sourced from `process.env` — no repetition needed
- **Client vars** (`NEXT_PUBLIC_*`) still require explicit `process.env.KEY` references — this is a hard webpack/Turbopack requirement, not a library limitation

**Step 1 — Define schema once in `envzod.config.ts`:**

```ts
// envzod.config.ts
import { z } from "zod";

export const server = {
  DATABASE_URL: z.string().url(),
  JWT_SECRET: z.string().min(32),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
};

export const client = {
  NEXT_PUBLIC_API_URL: z.string().url(),
  NEXT_PUBLIC_APP_NAME: z.string().default("My App"),
};
```

**Step 2 — Wire it up in `env.ts`:**

```ts
// env.ts
import { createNextEnv } from "envzod/next";
import { server, client } from "./envzod.config";

export const env = createNextEnv({
  server,
  client,
  runtimeEnv: {
    // Only NEXT_PUBLIC_* vars needed here — server vars auto-sourced
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME,
  },
  verbose: process.env.NODE_ENV === "development",
  // bail: true  — clean process.exit(1) on error instead of throwing
});
```

**Step 3 — CLI also reads `envzod.config.ts` automatically:**

```bash
npx envzod check
```

#### `createNextEnv` options

| Option       | Type                              | Default   | Description                                              |
| ------------ | --------------------------------- | --------- | -------------------------------------------------------- |
| `server`     | `EnvSchema`                       | `{}`      | Server-only vars, auto-sourced from `process.env`        |
| `client`     | `EnvSchema`                       | `{}`      | Client vars, must all start with `NEXT_PUBLIC_`          |
| `runtimeEnv` | `{ [K in keyof client]: string }` | required  | Explicit `process.env.KEY` refs for each client key      |
| `verbose`    | `boolean`                         | `false`   | Log success summary                                      |
| `onError`    | `(errors) => void`                | —         | Called with structured errors before throwing            |
| `bail`       | `boolean`                         | `false`   | Call `process.exit(1)` instead of throwing — no Next.js stack trace noise |

---

### Express

```ts
// src/env.ts
import { createEnv } from "envzod";
import { z } from "zod";

export const env = createEnv(
  {
    PORT: z.coerce.number().default(3000),
    DATABASE_URL: z.string().url(),
    JWT_SECRET: z.string().min(32),
  },
  {
    verbose: process.env.NODE_ENV === "development",
  },
);

// app.ts
import { env } from "./env";
app.listen(env.PORT);
```

### Bun

```ts
// env.ts
import { createEnv } from "envzod";
import { z } from "zod";

export const env = createEnv(
  {
    PORT: z.coerce.number().default(3000),
    DATABASE_URL: z.string().url(),
    JWT_SECRET: z.string().min(32),
  },
  {
    source: Bun.env,
    verbose: Bun.env.NODE_ENV === "development",
  },
);
```

---

## TypeScript

`envzod` uses the `InferEnv<T>` utility type to derive the return type from your schema. No manual type annotations needed.

```ts
import type { InferEnv } from "envzod";
import { z } from "zod";

const schema = {
  PORT: z.coerce.number(),
  NODE_ENV: z.enum(["development", "production"]),
};

type Env = InferEnv<typeof schema>;
// { PORT: number; NODE_ENV: "development" | "production" }
```

---

## CLI — `npx envzod check`

Validate your env before deploying — great for CI/CD pipelines.

**Supports both `.ts` and `.js` config files** — TypeScript config is auto-detected.

**1. Create `envzod.config.ts` (or `.js`) in your project root:**

```ts
// envzod.config.ts
import { z } from "zod";

export default {
  DATABASE_URL: z.string().url(),
  PORT: z.coerce.number().default(3000),
  NODE_ENV: z.enum(["development", "test", "production"]),
};
```

Or CommonJS:

```js
// envzod.config.js
const { z } = require("zod");

module.exports = {
  DATABASE_URL: z.string().url(),
  PORT: z.coerce.number().default(3000),
  NODE_ENV: z.enum(["development", "test", "production"]),
};
```

**2. Run the check:**

```bash
npx envzod check
```

**Options:**

```bash
npx envzod check --env .env.production   # custom env file (default: .env)
npx envzod check --config my.config      # custom config file (tries .ts then .js)
```

**Add to CI (GitHub Actions example):**

```yaml
- name: Validate environment
  run: npx envzod check --env .env.production
```

---

## vs t3-env

| Feature          | envzod                          | t3-env                         |
| ---------------- | ------------------------------- | ------------------------------ |
| Framework        | Universal                       | Next.js focused                |
| Basic setup      | `createEnv(schema)`             | Separate client/server schemas |
| Next.js helper   | `createNextEnv` via `envzod/next` | Built-in                     |
| Server/client split | Yes — `server` + `client`    | Yes — `server` + `client`      |
| Source repetition | Server: none, Client: required | Always required (`runtimeEnv`) |
| CLI check        | `npx envzod check` (TS + JS)   | None                           |
| Dependencies     | zod only                        | Next.js types + more           |
| Bundle           | CJS + ESM                       | ESM only                       |
| Error output     | Pretty box with field details   | Zod default                    |

---

## License

MIT
