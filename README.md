# envzod

[![npm](https://img.shields.io/npm/v/envzod)](https://www.npmjs.com/package/envzod)
[![license](https://img.shields.io/npm/l/envzod)](./LICENSE)

**Your app should crash at startup if the env is wrong — not three requests into production.**

`envzod` validates environment variables against a Zod schema at boot time. You get a typed object back. If anything is missing or invalid, it throws with a clear error that tells you exactly what's wrong.

- **Typed** — `env.PORT` is `number`, not `string | undefined`
- **Fail-fast** — crashes at startup with a readable error, not deep in a request handler
- **CLI check** — `npx envzod check` validates before deploy, works in CI/CD
- **Next.js ready** — server/client split via `envzod/next`, no schema duplication

---

## Install

```bash
npm install envzod   # zod is a peer dep — install it separately if you haven't
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
  PORT:         z.coerce.number().default(3000),
  NODE_ENV:     z.enum(["development", "test", "production"]),
  JWT_SECRET:   z.string().min(32),
});
```

```ts
// anywhere in your app
import { env } from "./env";

env.PORT          // number  — not string, not undefined
env.DATABASE_URL  // string
env.NODE_ENV      // "development" | "test" | "production"
```

If validation fails at startup you get this — not a runtime crash 10 minutes later:

```
╔════════════════════════════════════════════╗
║  envzod: Invalid Environment               ║
╚════════════════════════════════════════════╝

  ✗ DATABASE_URL
    Invalid url
    Got: "localhost/mydb"

  ✗ JWT_SECRET
    String must contain at least 32 character(s)
    Got: "tooshort"

  Fix the above and restart your server.
```

---

## CLI — validate before you deploy

```bash
npx envzod check
npx envzod check --env .env.production
npx envzod check --config envzod.config    # tries .ts then .js
```

Reads your `envzod.config.ts` (or `.js`) and validates against your env file. Exits with code 1 on failure.

**envzod.config.ts:**

```ts
import { z } from "zod";

export default {
  DATABASE_URL: z.string().url(),
  PORT:         z.coerce.number().default(3000),
  JWT_SECRET:   z.string().min(32),
};
```

**GitHub Actions:**

```yaml
- name: Validate environment
  run: npx envzod check --env .env.production
```

The deploy fails here — not after the pod starts and serves broken responses.

---

## Next.js

Next.js has a hard constraint: `NEXT_PUBLIC_*` variables must be referenced as literal strings (`process.env.NEXT_PUBLIC_FOO`) for webpack/Turbopack to inline them into the client bundle. Dynamic access doesn't work.

`createNextEnv` handles this with a server/client split:
- **Server vars** — auto-sourced from `process.env`, no repetition
- **Client vars** — you provide explicit `process.env.KEY` references (unavoidable webpack requirement)

**Step 1 — define schema once in `envzod.config.ts`:**

```ts
import { z } from "zod";

export const server = {
  DATABASE_URL: z.string().url(),
  JWT_SECRET:   z.string().min(32),
  NODE_ENV:     z.enum(["development", "test", "production"]).default("development"),
};

export const client = {
  NEXT_PUBLIC_API_URL: z.string().url(),
};
```

**Step 2 — wire it in `env.ts`:**

```ts
import { createNextEnv } from "envzod/next";
import { server, client } from "./envzod.config";

export const env = createNextEnv({
  server,
  client,
  runtimeEnv: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    // server keys are auto-sourced — only client keys go here
  },
  verbose: process.env.NODE_ENV === "development",
  bail: true, // process.exit(1) instead of throwing — avoids Next.js stack trace noise
});
```

The CLI reads from `envzod.config.ts` automatically — same schema, no duplication:

```bash
npx envzod check
```

---

## Express / Node

```ts
import { createEnv } from "envzod";
import { z } from "zod";

export const env = createEnv({
  PORT:         z.coerce.number().default(3000),
  DATABASE_URL: z.string().url(),
  JWT_SECRET:   z.string().min(32),
});

app.listen(env.PORT);
```

---

## Bun

```ts
import { createEnv } from "envzod";
import { z } from "zod";

export const env = createEnv(
  {
    PORT:         z.coerce.number().default(3000),
    DATABASE_URL: z.string().url(),
  },
  { source: Bun.env },
);
```

---

## Options

### `createEnv(schema, options?)`

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `source` | `Record<string, string \| undefined>` | `process.env` | Custom env source |
| `verbose` | `boolean` | `false` | Log `✅ envzod: N variables validated` on success |
| `onError` | `(errors: EnvValidationError[]) => void` | — | Called before throwing — use for Sentry, logging |

### `createNextEnv(options)` — `envzod/next`

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `server` | `EnvSchema` | `{}` | Server-only vars, auto-sourced from `process.env` |
| `client` | `EnvSchema` | `{}` | Client vars — must all start with `NEXT_PUBLIC_` |
| `runtimeEnv` | `{ [K in keyof client]: string \| undefined }` | required | Explicit refs for each client key |
| `verbose` | `boolean` | `false` | Log success summary |
| `onError` | `(errors: EnvValidationError[]) => void` | — | Called before throwing |
| `bail` | `boolean` | `false` | Call `process.exit(1)` instead of throwing |

### Error shape

```ts
type EnvValidationError = {
  field:    string;
  message:  string;
  received: string | undefined;
};
```

---

## TypeScript

```ts
import type { InferEnv } from "envzod";
import { z } from "zod";

const schema = {
  PORT:     z.coerce.number(),
  NODE_ENV: z.enum(["development", "production"]),
};

type Env = InferEnv<typeof schema>;
// { PORT: number; NODE_ENV: "development" | "production" }
```

---

## vs t3-env

Both libraries solve the same problem. Key differences:

| | envzod | t3-env |
|--|--------|--------|
| Works outside Next.js | Yes | Limited |
| Next.js server/client split | `envzod/next` | Built-in |
| Server var repetition | None (auto-sourced) | Required |
| Client var repetition | Required (webpack constraint — same for both) | Required |
| CLI pre-deploy check | Yes — TS + JS config | No |
| Error output | Formatted box, field-level | Zod default |
| Output formats | CJS + ESM | ESM only |

The client var repetition (`runtimeEnv`) is a webpack/Turbopack hard requirement — no library can eliminate it.

---

## License

MIT
