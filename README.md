# envzod

**Catch broken environment variables before they break your deploy.**

Type-safe env validation powered by Zod. Fails loudly at startup — not silently in production.

---

## Why envzod

- `process.env` gives you `string | undefined` — no types, no validation
- Missing or malformed env vars cause runtime crashes, not startup errors
- `envzod` validates everything at boot and gives you a **fully typed env object**

---

## CLI — catch issues before they reach prod

```bash
npx envzod check
```

```
╔════════════════════════════════════════════╗
║  zod-env: Invalid Environment              ║
╚════════════════════════════════════════════╝

  ✗ DATABASE_URL
    Invalid url
    Got: "localhost/mydb"

  Fix the above and restart your server.
```

**Add to CI (GitHub Actions):**

```yaml
- name: Validate environment
  run: npx envzod check --env .env.production
```

Fails the build before your app even boots. No surprises on deploy.

---

## Install

```bash
npm install envzod     # zod is a peer dependency
pnpm add envzod
```

---

## Basic usage

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

env.PORT;         // number
env.DATABASE_URL; // string
env.NODE_ENV;     // "development" | "test" | "production"
```

Import `env` anywhere — fully typed, no casting.

---

## Next.js

Use `createNextEnv` from `envzod/next` — handles the server/client split automatically.

```ts
// envzod.config.ts — schema defined once, used by both app and CLI
import { z } from "zod";

export const server = {
  DATABASE_URL: z.string().url(),
  JWT_SECRET: z.string().min(32),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
};

export const client = {
  NEXT_PUBLIC_API_URL: z.string().url(),
};
```

```ts
// env.ts
import { createNextEnv } from "envzod/next";
import { server, client } from "./envzod.config";

export const env = createNextEnv({
  server,
  client,
  runtimeEnv: {
    // Only NEXT_PUBLIC_* need explicit refs — webpack static analysis requirement
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  },
  verbose: process.env.NODE_ENV === "development",
  // bail: true  — process.exit(1) on error, no Next.js stack trace noise
});
```

CLI also reads `envzod.config.ts` automatically:

```bash
npx envzod check
```

---

## Express / Node

```ts
import { createEnv } from "envzod";
import { z } from "zod";

export const env = createEnv({
  PORT: z.coerce.number().default(3000),
  DATABASE_URL: z.string().url(),
  JWT_SECRET: z.string().min(32),
});

app.listen(env.PORT);
```

---

## Bun

```ts
export const env = createEnv(
  { PORT: z.coerce.number().default(3000), DATABASE_URL: z.string().url() },
  { source: Bun.env }
);
```

---

## Options

```ts
createEnv(schema, {
  source: myCustomObject,   // default: process.env
  verbose: true,            // log "✅ N variables validated" on success
  onError: (errors) => {    // called before throwing — use for Sentry etc.
    Sentry.captureException(new Error("Invalid env"), { extra: { errors } });
  },
});
```

### `createNextEnv` options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `server` | `EnvSchema` | `{}` | Server-only vars, auto-sourced from `process.env` |
| `client` | `EnvSchema` | `{}` | Client vars, must start with `NEXT_PUBLIC_` |
| `runtimeEnv` | `Record` | required | Explicit `process.env.KEY` refs for each client key |
| `verbose` | `boolean` | `false` | Log success summary |
| `onError` | `(errors) => void` | — | Called before throwing |
| `bail` | `boolean` | `false` | `process.exit(1)` instead of throwing |

---

## CLI options

```bash
npx envzod check --env .env.production    # custom env file (default: .env)
npx envzod check --config my.config      # custom config (tries .ts then .js)
```

---

## TypeScript

```ts
import type { InferEnv } from "envzod";

const schema = { PORT: z.coerce.number(), NODE_ENV: z.enum(["development", "production"]) };
type Env = InferEnv<typeof schema>;
// { PORT: number; NODE_ENV: "development" | "production" }
```

---

## vs t3-env

| | envzod | t3-env |
|--|--------|--------|
| Works everywhere | Yes | Next.js focused |
| Next.js helper | `envzod/next` | Built-in |
| Server repetition | None | Always (`runtimeEnv`) |
| CLI check | Yes (TS + JS config) | No |
| Error output | Pretty box | Zod default |
| Bundle | CJS + ESM | ESM only |

---

## License

MIT
