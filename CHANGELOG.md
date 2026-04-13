# Changelog

## 1.0.0 — Initial Release

- `createEnv(schema, options?)` — validate environment variables against a Zod schema
- Full TypeScript inference — types flow from schema automatically
- Pretty box-style error output with field names, messages, and received values
- `verbose` mode — logs success summary in development
- `onError` hook — custom error handling (Sentry, logging, etc.)
- `source` option — custom env source instead of `process.env`
- Dual CJS + ESM build with TypeScript declarations
