import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { validate } from './validate.js'
import { formatErrors, formatSuccess } from './format.js'

const args = process.argv.slice(2)

function getFlag(flag: string): string | undefined {
  const i = args.indexOf(flag)
  return i !== -1 ? args[i + 1] : undefined
}

const envFile = getFlag('--env') ?? '.env'
const configFile = getFlag('--config') ?? 'envzod.config'

function resolveConfig(base: string): { path: string; type: 'ts' | 'js' } | null {
  const ts = resolve(process.cwd(), `${base}.ts`)
  if (existsSync(ts)) return { path: ts, type: 'ts' }
  const js = resolve(process.cwd(), `${base}.js`)
  if (existsSync(js)) return { path: js, type: 'js' }
  return null
}

const envPath = resolve(process.cwd(), envFile)
const resolved = resolveConfig(configFile)

function parseEnvFile(path: string): Record<string, string | undefined> {
  if (!existsSync(path)) return {}
  const lines = readFileSync(path, 'utf-8').split('\n')
  const result: Record<string, string> = {}
  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eq = trimmed.indexOf('=')
    if (eq === -1) continue
    const key = trimmed.slice(0, eq).trim()
    const val = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, '')
    result[key] = val
  }
  return result
}

function loadConfig(path: string, type: 'ts' | 'js'): Record<string, unknown> {
  if (type === 'ts') {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { createJiti } = require('jiti')
    const jiti = createJiti(__filename, { interopDefault: true })
    const config = jiti(path)
    return config.default ?? config
  }
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const config = require(path)
  return config.default ?? config
}

function main() {
  if (!resolved) {
    console.error(`\nenvzod: config file not found — ${configFile}.ts or ${configFile}.js`)
    console.error('Create envzod.config.ts (or .js) exporting your schema:\n')
    console.error('  import { z } from "zod"')
    console.error('  export default {')
    console.error('    DATABASE_URL: z.string().url(),')
    console.error('    PORT: z.coerce.number().default(3000),')
    console.error('  }\n')
    process.exit(1)
  }

  const schema = loadConfig(resolved.path, resolved.type)
  const source = parseEnvFile(envPath)
  const merged = { ...process.env, ...source }

  const result = validate(schema as never, merged)

  if (!result.success) {
    console.error(formatErrors(result.errors))
    process.exit(1)
  }

  console.log(formatSuccess(Object.keys(schema).length))
}

main()
