import { loadJSON, saveJSON, generateId } from '../lib/storage'
import { generateTestScripts, buildScriptBundleZipContent } from '../lib/qe/testScriptGenerator'
import { getScriptCodegenMessages, SCRIPT_PIPELINE_DELAYS } from '../data/testScriptCodegenMessages'

const STORAGE_KEY = 'qe_script_codegen'

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms))
}

export function getScriptCodegenHistory() {
  return loadJSON(STORAGE_KEY, [])
}

export function getScriptCodegenById(id) {
  return getScriptCodegenHistory().find((r) => r.id === id) ?? null
}

export function getLatestScriptCodegen() {
  const all = getScriptCodegenHistory()
  return all[0] ?? null
}

export async function runScriptCodegenPipeline(options, callbacks = {}) {
  const { onPhase, onLog, onProgress, onComplete } = callbacks
  const result = generateTestScripts(options)
  const logs = []
  let progress = 0

  const pushLog = (msg) => {
    logs.push({ time: new Date().toISOString(), message: msg })
    onLog?.(msg)
  }

  pushLog(`▸ Benefits Script Studio — ${result.framework} · suite "${result.suiteId}"`)
  pushLog(`▸ ${result.summary.totalScenarios} scenarios · target coverage ${result.summary.estimatedCoverage}%`)

  for (const phase of result.phases) {
    onPhase?.(phase.id)
    const messages = getScriptCodegenMessages(phase, {
      framework: result.framework,
      suiteId: result.suiteId,
      scenarioCount: result.summary.totalScenarios,
    })

    for (const msg of messages) {
      pushLog(`  ${msg}`)
      progress += Math.floor(100 / (result.phases.length * messages.length))
      onProgress?.(Math.min(98, progress))
      await sleep(SCRIPT_PIPELINE_DELAYS[phase.id] ?? 600)
    }
    pushLog(`✓ ${phase.label} complete — ${result.phaseResults.find((p) => p.id === phase.id)?.fileCount ?? 0} files`)
  }

  const record = {
    id: generateId('scriptgen'),
    ...result,
    logs,
    createdAt: new Date().toISOString(),
    status: 'completed',
  }

  const history = getScriptCodegenHistory()
  saveJSON(STORAGE_KEY, [record, ...history].slice(0, 20))
  window.dispatchEvent(new Event('horizon-storage'))

  onProgress?.(100)
  pushLog(`✓ Script bundle ready — ${record.files.length} files generated`)
  onComplete?.(record)
  return record
}

export function downloadScriptBundle(record) {
  if (!record?.files?.length) return
  const content = buildScriptBundleZipContent(record)
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `benefits-tests-${record.suiteId}-${record.framework}.txt`
  a.click()
  URL.revokeObjectURL(url)
}

export function downloadScriptFile(file) {
  if (!file?.content) return
  const blob = new Blob([file.content], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = file.path.split('/').pop() ?? 'script.txt'
  a.click()
  URL.revokeObjectURL(url)
}
