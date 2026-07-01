import { loadJSON, saveJSON, generateId } from '../lib/storage'

const HISTORY_KEY = 're_scan_history'
const ACTIVE_KEY = 're_active_scan'

export function getScanHistory() {
  return loadJSON(HISTORY_KEY, [])
}

export function saveScanToHistory(scanJob) {
  const entry = {
    id: scanJob.id,
    sourceLabel: scanJob.result?.sourceLabel ?? scanJob.meta?.sourceLabel,
    source: scanJob.result?.source,
    migrationScore: scanJob.result?.migration?.score,
    readiness: scanJob.result?.migration?.readiness,
    languages: scanJob.result?.stats?.languages ?? [],
    scannedAt: scanJob.result?.scannedAt ?? new Date().toISOString(),
    summary: scanJob.result?.summary,
  }
  const list = getScanHistory().filter((s) => s.id !== entry.id)
  list.unshift(entry)
  const deduped = list.filter((item, idx, arr) => arr.findIndex((x) => x.id === item.id) === idx)
  saveJSON(HISTORY_KEY, deduped.slice(0, 20))
  return entry
}

export function persistActiveScanId(scanId) {
  saveJSON(ACTIVE_KEY, scanId)
}

/** @deprecated use persistActiveScanId */
export const setActiveScan = persistActiveScanId

export function getActiveScanId() {
  return loadJSON(ACTIVE_KEY, null)
}

export function createInitiativeFromScan(scan, blueprint) {
  return {
    title: `Migration — ${scan.sourceLabel}`,
    description: scan.summary,
    domain: scan.stats.domain ?? 'General',
    businessObjective: `Reverse-engineering driven migration (readiness ${scan.migration.score}/100). ${blueprint?.phases?.[0]?.objectives?.[0] ?? ''}`,
    stakeholders: 'Migration lead, Platform architect, QE lead',
    reScanId: scan.id,
  }
}

export function createGovernanceFindings(scan) {
  return (scan.findings ?? [])
    .filter((f) => f.severity === 'critical' || f.severity === 'high')
    .slice(0, 10)
    .map((f) => ({
      id: generateId('re_gov'),
      title: `[RE] ${f.label}`,
      severity: f.severity,
      source: 'reverse-engineering',
      file: f.file,
      line: f.line,
      status: 'open',
      createdAt: new Date().toISOString(),
    }))
}
