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
const configFile = getFlag('--config') ?? 'envzod.config.js'

const envPath = resolve(process.cwd(), envFile)
const configPath = resolve(process.cwd(), configFile)

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

function main() {
  if (!existsSync(configPath)) {
    console.error(`\nenvzod: config file not found — ${configFile}`)
    console.error('Create envzod.config.js exporting your schema:\n')
    console.error('  const { z } = require("zod")')
    console.error('  module.exports = {')
    console.error('    DATABASE_URL: z.string().url(),')
    console.error('    PORT: z.coerce.number().default(3000),')
    console.error('  }\n')
    process.exit(1)
  }

  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const config = require(configPath)
  const schema = config.default ?? config

  const source = parseEnvFile(envPath)

  // Also merge process.env so vars set in the shell are picked up
  const merged = { ...process.env, ...source }

  const result = validate(schema, merged)

  if (!result.success) {
    console.error(formatErrors(result.errors))
    process.exit(1)
  }

  console.log(formatSuccess(Object.keys(schema).length))
}

main()
