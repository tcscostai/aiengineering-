import fs from 'fs/promises'
import path from 'path'
import { shouldSkipDir, CODE_EXTENSIONS, MANIFEST_FILES } from './ignorePatterns.js'

export async function walkDirectory(rootDir, options = {}) {
  const maxFiles = options.maxFiles ?? 8000
  const files = []
  const manifests = []

  async function walk(dir, depth = 0) {
    if (depth > 20 || files.length >= maxFiles) return
    let entries
    try {
      entries = await fs.readdir(dir, { withFileTypes: true })
    } catch {
      return
    }

    for (const entry of entries) {
      if (files.length >= maxFiles) break
      const full = path.join(dir, entry.name)
      if (entry.isDirectory()) {
        if (shouldSkipDir(entry.name)) continue
        await walk(full, depth + 1)
      } else if (entry.isFile()) {
        const ext = path.extname(entry.name).toLowerCase()
        const rel = path.relative(rootDir, full)
        if (MANIFEST_FILES.has(entry.name)) {
          manifests.push({ name: entry.name, path: rel, fullPath: full })
        }
        if (CODE_EXTENSIONS.has(ext) || MANIFEST_FILES.has(entry.name)) {
          files.push({ path: rel, fullPath: full, ext, name: entry.name })
        }
      }
    }
  }

  await walk(rootDir)
  return { files, manifests, rootDir }
}

export async function readFileSafe(filePath, maxBytes = 512_000) {
  try {
    const stat = await fs.stat(filePath)
    if (stat.size > maxBytes) return null
    return await fs.readFile(filePath, 'utf8')
  } catch {
    return null
  }
}
