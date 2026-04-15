import type { EnvValidationError } from './types.js'

const BOX_WIDTH = 44

function pad(text: string, width: number): string {
  return text + ' '.repeat(Math.max(0, width - text.length))
}

export function formatErrors(errors: EnvValidationError[]): string {
  const lines: string[] = []
  const title = '  envzod: Invalid Environment          '
  lines.push(`╔${'═'.repeat(BOX_WIDTH)}╗`)
  lines.push(`║${pad(title, BOX_WIDTH)}║`)
  lines.push(`╚${'═'.repeat(BOX_WIDTH)}╝`)
  lines.push('')

  for (const err of errors) {
    lines.push(`  ✗ ${err.field}`)
    lines.push(`    ${err.message}`)
    if (err.received !== undefined) {
      lines.push(`    Got: "${err.received}"`)
    }
    lines.push('')
  }

  lines.push('  Fix the above and restart your server.')
  return lines.join('\n')
}

export function formatSuccess(count: number): string {
  return `✅ envzod: ${count} variable${count === 1 ? '' : 's'} validated`
}
