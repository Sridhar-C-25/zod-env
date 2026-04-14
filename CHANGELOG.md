# Changelog

## 1.1.0

- `npx envzod check` CLI — validate env before deployment, works in CI/CD pipelines
- `--env` flag — specify custom env file path (default: `.env`)
- `--config` flag — specify custom config file path (default: `envzod.config.js`)

## 1.0.0 — Initial Release

- `createEnv(schema, options?)` — validate environment variables against a Zod schema
- Full TypeScript inference — types flow from schema automatically
- Pretty box-style error output with field names, messages, and received values
- `verbose` mode — logs success summary in development
- `onError` hook — custom error handling (Sentry, logging, etc.)
- `source` option — custom env source instead of `process.env`
- Dual CJS + ESM build with TypeScript declarations
