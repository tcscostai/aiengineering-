import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'
import simpleGit from 'simple-git'
import { analyzeCodebase } from './codeAnalyzer.js'
import { generateMigrationBlueprint } from './migrationBlueprint.js'
import { appendLog, updateProgress, completeScan, failScan } from './scanStore.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const WORK_ROOT = path.join(__dirname, '../../.re-scans')

async function ensureWorkRoot() {
  await fs.mkdir(WORK_ROOT, { recursive: true })
}

function buildAuthUrl(url, token) {
  if (!token) return url
  try {
    const u = new URL(url)
    u.username = token
    u.password = 'x-oauth-basic'
    return u.toString()
  } catch {
    return url
  }
}

export async function scanGitRepository(scanId, { url, branch = 'main', token, subpath = '' }) {
  await ensureWorkRoot()
  const targetDir = path.join(WORK_ROOT, scanId)
  await fs.mkdir(targetDir, { recursive: true })

  try {
    appendLog(scanId, `Cloning ${url} (branch: ${branch})…`, 'info')
    updateProgress(scanId, 10, 'cloning')

    const cloneUrl = buildAuthUrl(url, token)
    const git = simpleGit()
    try {
      await git.clone(cloneUrl, targetDir, ['--depth', '1', '--branch', branch, '--single-branch'])
    } catch {
      appendLog(scanId, `Branch "${branch}" not found — cloning default branch`, 'warn')
      await simpleGit().clone(cloneUrl, targetDir, ['--depth', '1'])
    }

    appendLog(scanId, 'Clone complete — analyzing workspace', 'ok')
    updateProgress(scanId, 35, 'analyzing')

    const analyzeRoot = subpath ? path.join(targetDir, subpath) : targetDir
    const stat = await fs.stat(analyzeRoot).catch(() => null)
    if (!stat?.isDirectory()) {
      throw new Error(`Subpath not found: ${subpath || '(root)'}`)
    }

    const repoName = url.replace(/\.git$/, '').split('/').pop() ?? 'repository'
    const result = await analyzeCodebase(analyzeRoot, {
      scanId,
      source: 'git',
      sourceLabel: `${repoName}${subpath ? `/${subpath}` : ''}@${branch}`,
    })

    appendLog(scanId, `Indexed ${result.stats.totalFiles} files — ${result.stats.languages.join(', ')}`, 'ok')
    updateProgress(scanId, 75, 'synthesizing')

    const blueprint = generateMigrationBlueprint(result)
    appendLog(scanId, `Migration readiness: ${result.migration.score}/100 (${result.migration.readiness})`, 'ok')
    appendLog(scanId, 'Blueprint generated — scan complete', 'ok')

    completeScan(scanId, result, blueprint)
    return { result, blueprint }
  } catch (err) {
    const msg = err?.message ?? 'Git scan failed'
    failScan(scanId, msg)
    throw err
  }
}
