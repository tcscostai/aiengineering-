import { Router } from 'express'
import multer from 'multer'
import { randomUUID } from 'crypto'
import { createScanJob, getScanJob, listScans } from '../services/scanStore.js'
import { scanGitRepository } from '../services/gitScanner.js'
import { scanWorkspaceZip, scanWorkspacePath } from '../services/workspaceScanner.js'
import { answerCopilotQuestion, SUGGESTED_QUESTIONS } from '../services/copilotEngine.js'
import { generateMigrationBlueprint } from '../services/migrationBlueprint.js'
import { normalizeWorkspacePath } from '../utils/pathNormalize.js'
import { listMigrationTargets } from '../data/migrationTargets.js'

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 200 * 1024 * 1024 } })
const router = Router()

router.get('/health', (_req, res) => {
  res.json({ ok: true, service: 'horizon-reverse-engineering', version: '1.0.0' })
})

router.get('/scans', (_req, res) => {
  res.json({ scans: listScans() })
})

router.get('/scans/:id', (req, res) => {
  const job = getScanJob(req.params.id)
  if (!job) return res.status(404).json({ error: 'Scan not found' })
  res.json({
    id: job.id,
    status: job.status,
    progress: job.progress,
    logs: job.logs,
    error: job.error,
    result: job.result,
    blueprint: job.blueprint,
    createdAt: job.createdAt,
  })
})

router.post('/scan/git', async (req, res) => {
  const { url, branch, token, subpath } = req.body ?? {}
  if (!url?.trim()) return res.status(400).json({ error: 'Repository URL is required' })

  const scanId = randomUUID()
  createScanJob(scanId, { source: 'git', sourceLabel: url, branch })

  res.status(202).json({ scanId, status: 'started' })

  scanGitRepository(scanId, {
    url: url.trim(),
    branch: branch?.trim() || 'main',
    token: token?.trim() || undefined,
    subpath: subpath?.trim() || '',
  }).catch(() => {})
})

router.post('/scan/workspace-zip', upload.single('archive'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'ZIP archive is required (field: archive)' })

  const scanId = randomUUID()
  createScanJob(scanId, { source: 'workspace-zip', sourceLabel: req.file.originalname })

  res.status(202).json({ scanId, status: 'started' })

  scanWorkspaceZip(scanId, req.file.buffer, req.file.originalname).catch(() => {})
})

router.post('/scan/workspace-path', async (req, res) => {
  const { path: workspacePath } = req.body ?? {}
  if (!workspacePath?.trim()) return res.status(400).json({ error: 'path is required' })

  const normalized = normalizeWorkspacePath(workspacePath)
  const scanId = randomUUID()
  createScanJob(scanId, { source: 'workspace-path', sourceLabel: normalized })

  res.status(202).json({ scanId, status: 'started' })

  scanWorkspacePath(scanId, normalized).catch(() => {})
})

router.post('/copilot', (req, res) => {
  const { scanId, question } = req.body ?? {}
  const job = getScanJob(scanId)
  if (!job?.result) return res.status(404).json({ error: 'Scan result not found' })

  const response = answerCopilotQuestion(job.result, question ?? '')
  res.json(response)
})

router.get('/copilot/suggestions', (_req, res) => {
  res.json({ suggestions: SUGGESTED_QUESTIONS })
})

router.get('/targets', (_req, res) => {
  res.json({ targets: listMigrationTargets() })
})

router.post('/scans/:id/blueprint', (req, res) => {
  const job = getScanJob(req.params.id)
  if (!job?.result) return res.status(404).json({ error: 'Scan not found' })
  const targetStack = req.body?.targetStack
  const blueprint = generateMigrationBlueprint(job.result, { targetStack })
  job.blueprint = blueprint
  res.json(blueprint)
})

router.get('/scans/:id/blueprint', (req, res) => {
  const job = getScanJob(req.params.id)
  if (!job?.result) return res.status(404).json({ error: 'Scan not found' })
  const targetStack = req.query.targetStack
  const blueprint = job.blueprint && !targetStack
    ? job.blueprint
    : generateMigrationBlueprint(job.result, { targetStack })
  if (targetStack) job.blueprint = blueprint
  res.json(blueprint)
})

router.get('/scans/:id/export', (req, res) => {
  const job = getScanJob(req.params.id)
  if (!job?.blueprint) return res.status(404).json({ error: 'Blueprint not found' })
  res.setHeader('Content-Type', 'text/markdown')
  res.setHeader('Content-Disposition', `attachment; filename="migration-blueprint-${job.id}.md"`)
  res.send(job.blueprint.exportMarkdown)
})

export default router
