import { buildDemoCobolScanResult, DEMO_RE_SCAN_ID, isDemoScanId } from '../data/demoReScanResult'
import { COBOL_SCAN_PIPELINE, buildPipelineLog } from '../data/cobolScanPipeline'
import { generateMigrationBlueprint } from '../lib/re/migrationBlueprintClient'
import { saveScanToHistory, persistActiveScanId } from './reverseEngineeringService'
import { linkReScanToFlow } from './enterpriseFlowService'

export { isDemoScanId }

function delay(ms) {
  return new Promise((r) => setTimeout(r, ms))
}

export async function runMockDemoScan({ onTick, targetStack } = {}) {
  const scanResult = buildDemoCobolScanResult()
  const scanId = DEMO_RE_SCAN_ID
  const logs = []

  for (const step of COBOL_SCAN_PIPELINE) {
    logs.push(buildPipelineLog(step.message, step.kind))
    onTick?.({
      id: scanId,
      status: 'running',
      progress: step.progress,
      logs: [...logs],
    })
    await delay(step.delayMs + Math.random() * 150)
  }

  const blueprint = generateMigrationBlueprint(scanResult, { targetStack: targetStack ?? 'spring' })
  const job = {
    id: scanId,
    status: 'completed',
    progress: 100,
    logs,
    result: scanResult,
    blueprint,
    mock: true,
    completedAt: new Date().toISOString(),
  }

  persistActiveScanId(scanId)
  saveScanToHistory(job)
  linkReScanToFlow(scanId)

  onTick?.(job)
  return job
}

export function getMockScanJob(scanId = DEMO_RE_SCAN_ID) {
  if (!isDemoScanId(scanId)) return null
  const result = buildDemoCobolScanResult()
  const blueprint = generateMigrationBlueprint(result, { targetStack: 'spring' })
  const logs = COBOL_SCAN_PIPELINE.map((s) => buildPipelineLog(s.message, s.kind))
  return {
    id: scanId,
    status: 'completed',
    progress: 100,
    logs,
    result,
    blueprint,
    mock: true,
  }
}

export function createMockCopilotAnswer(scan, question) {
  const q = question.toLowerCase()
  if (q.includes('risk') || q.includes('finding')) {
    return `Top risks: ${scan.findings.map((f) => f.label).join('; ')}. Address DB2 and JCL batch dependencies before strangler extraction.`
  }
  if (q.includes('migrate') || q.includes('spring')) {
    return 'Recommended path: extract PASAUTH and ELIGCHK as Spring Boot services first, then CLMADJ/CLMVAL with contract tests on CLAIM-REC copybook mappings.'
  }
  return `${scan.sourceLabel} — ${scan.stats.totalFiles} files, domain ${scan.stats.domain}. Migration score ${scan.migration.score}/100 (${scan.migration.readiness}). Ask about risks, modules, or target stack.`
}
