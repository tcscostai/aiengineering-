import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'
import AdmZip from 'adm-zip'
import { analyzeCodebase } from './codeAnalyzer.js'
import { generateMigrationBlueprint } from './migrationBlueprint.js'
import { appendLog, updateProgress, completeScan, failScan } from './scanStore.js'
import { normalizeWorkspacePath } from '../utils/pathNormalize.js'
import { isCobolWorkspacePath, runCobolPipelineLogs } from '../data/cobolScanPipeline.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const WORK_ROOT = path.join(__dirname, '../../.re-scans')

async function ensureWorkRoot() {
  await fs.mkdir(WORK_ROOT, { recursive: true })
}

export async function scanWorkspaceZip(scanId, zipBuffer, originalName = 'workspace.zip') {
  await ensureWorkRoot()
  const targetDir = path.join(WORK_ROOT, scanId)

  try {
    appendLog(scanId, `Unpacking ${originalName}…`, 'info')
    updateProgress(scanId, 15, 'unpacking')

    await fs.mkdir(targetDir, { recursive: true })
    const zip = new AdmZip(zipBuffer)
    zip.extractAllTo(targetDir, true)

    appendLog(scanId, 'Archive extracted — walking file tree', 'ok')
    updateProgress(scanId, 40, 'analyzing')

    const result = await analyzeCodebase(targetDir, {
      scanId,
      source: 'workspace-zip',
      sourceLabel: originalName.replace(/\.zip$/i, ''),
    })

    appendLog(scanId, `Indexed ${result.stats.totalFiles} files`, 'ok')
    updateProgress(scanId, 80, 'synthesizing')

    const blueprint = generateMigrationBlueprint(result)
    completeScan(scanId, result, blueprint)
    return { result, blueprint }
  } catch (err) {
    failScan(scanId, err?.message ?? 'Workspace zip scan failed')
    throw err
  }
}

export async function scanWorkspacePath(scanId, workspacePath) {
  await ensureWorkRoot()

  try {
    const resolved = normalizeWorkspacePath(workspacePath)
    if (!resolved) throw new Error('Path is required')

    const stat = await fs.stat(resolved).catch(() => null)
    if (!stat) {
      throw new Error(`Directory not found: ${resolved}`)
    }
    if (!stat.isDirectory()) throw new Error('Path must be a directory')

    appendLog(scanId, `Scanning local path: ${resolved}`, 'info')
    updateProgress(scanId, 5, 'analyzing')

    if (isCobolWorkspacePath(resolved)) {
      await runCobolPipelineLogs(scanId, { appendLog, updateProgress })
      const result = await analyzeCodebase(resolved, {
        scanId,
        source: 'workspace-path',
        sourceLabel: path.basename(resolved),
      })
      const blueprint = generateMigrationBlueprint(result)
      completeScan(scanId, result, blueprint)
      return { result, blueprint }
    }

    updateProgress(scanId, 20, 'analyzing')

    const result = await analyzeCodebase(resolved, {
      scanId,
      source: 'workspace-path',
      sourceLabel: path.basename(resolved),
    })

    appendLog(scanId, `Indexed ${result.stats.totalFiles} files — ${result.stats.languages.join(', ')}`, 'ok')
    updateProgress(scanId, 85, 'synthesizing')

    const blueprint = generateMigrationBlueprint(result)
    completeScan(scanId, result, blueprint)
    return { result, blueprint }
  } catch (err) {
    failScan(scanId, err?.message ?? 'Local workspace scan failed')
    throw err
  }
}
