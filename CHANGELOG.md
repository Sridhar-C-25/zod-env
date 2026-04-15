# Changelog

## 1.1.1

- Fix branding — error output now correctly shows `envzod` instead of `zod-env`

## 1.1.0

### CLI
- `npx envzod check` — validate env before deployment, works in CI/CD pipelines
- `--env` flag — specify custom env file path (default: `.env`)
- `--config` flag — specify custom config file path (default: `envzod.config`)
- TypeScript config support — CLI auto-detects `envzod.config.ts` before `.js`

### Next.js helper (`envzod/next`)
- `createNextEnv` — Next.js-specific helper with server/client schema split
- `server` schema — auto-sourced from `process.env`, no key repetition needed
- `client` schema — explicit `runtimeEnv` only for `NEXT_PUBLIC_*` keys (webpack/Turbopack requirement)
- `bail` option — call `process.exit(1)` instead of throwing to avoid Next.js stack trace noise (default: `false`)

### Improvements
- Validation errors now include full field details in the thrown error — visible in Next.js error overlays, not just terminal

---

## 1.0.1

- Fixed Next.js support — added `source` option to explicitly pass `process.env` keys
- Without `source`, Next.js/Turbopack could not statically inline `NEXT_PUBLIC_*` vars on the client side

---

## 1.0.0 — Initial Release

- `createEnv(schema, options?)` — validate environment variables against a Zod schema
- Full TypeScript inference — types flow from schema automatically
- Pretty box-style error output with field names, messages, and received values
- `verbose` mode — logs success summary in development
- `onError` hook — custom error handling (Sentry, logging, etc.)
- `source` option — custom env source instead of `process.env`
- Dual CJS + ESM build with TypeScript declarations
