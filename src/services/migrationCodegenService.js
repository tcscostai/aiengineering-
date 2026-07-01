import { loadJSON, saveJSON } from '../lib/storage'
import { generateMigrationCode, getCodegenPhases, buildCodeBundleExport } from '../lib/re/migrationCodeGenerator'
import { getMigrationTarget } from '../lib/re/migrationTargets'
import { getCodegenProgressSteps, runProgressAnimation } from '../data/codegenProgressMessages'

const CODEGEN_KEY = 're_codegen_results'

export function getCodegenResults() {
  return loadJSON(CODEGEN_KEY, {})
}

export function getCodegenForScan(scanId) {
  if (!scanId) return null
  return getCodegenResults()[scanId] ?? null
}

export function saveCodegenResult(scanId, result) {
  const all = getCodegenResults()
  all[scanId] = result
  saveJSON(CODEGEN_KEY, all)
  window.dispatchEvent(new Event('horizon-storage'))
  return result
}

export function downloadTextFile(filename, content, mime = 'text/plain') {
  const blob = new Blob([content], { type: mime })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export function downloadCodegenBundle(result, projectSlug = 'migration') {
  const content = buildCodeBundleExport(result)
  downloadTextFile(`${projectSlug}-code-bundle.txt`, content)
}

export async function runCodegenPipeline(scan, blueprint, options, onTick) {
  const targetId = options.targetStack ?? blueprint.targetStack
  const target = getMigrationTarget(targetId)
  const phases = getCodegenPhases()
  const progressSteps = getCodegenProgressSteps(scan, blueprint, target, options.scope ?? 'p0')

  await runProgressAnimation(progressSteps, (tick) => {
    const phase = phases.find((p) => p.id === tick.phaseId) ?? null
    onTick?.({
      phase,
      phaseId: tick.phaseId,
      message: tick.message,
      progress: tick.progress,
      thinking: tick.thinking,
    })
  })

  const result = generateMigrationCode(scan, blueprint, { ...options, targetStack: targetId })
  saveCodegenResult(scan.id, result)
  onTick?.({
    phase: null,
    progress: 100,
    message: `✓ ${result.files.length} files generated for ${result.blueprintTarget}`,
    done: true,
  })
  return result
}
