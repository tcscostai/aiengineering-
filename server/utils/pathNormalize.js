import path from 'path'
import os from 'os'

/** Strip pasted quotes and resolve absolute workspace paths safely. */
export function normalizeWorkspacePath(input) {
  if (!input || typeof input !== 'string') return ''

  let p = input.trim()

  while (
    (p.startsWith("'") && p.endsWith("'")) ||
    (p.startsWith('"') && p.endsWith('"')) ||
    (p.startsWith('`') && p.endsWith('`'))
  ) {
    p = p.slice(1, -1).trim()
  }

  if (p.startsWith('~/') || p === '~') {
    p = path.join(os.homedir(), p.slice(1))
  }

  return path.resolve(p)
}
