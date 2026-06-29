const scans = new Map()

export function createScanJob(id, meta) {
  const job = {
    id,
    status: 'pending',
    progress: 0,
    logs: [],
    meta,
    result: null,
    blueprint: null,
    error: null,
    createdAt: new Date().toISOString(),
  }
  scans.set(id, job)
  return job
}

export function getScanJob(id) {
  return scans.get(id) ?? null
}

export function appendLog(id, message, kind = 'info') {
  const job = scans.get(id)
  if (!job) return
  job.logs.push({ ts: new Date().toISOString(), message, kind })
}

export function updateProgress(id, progress, status) {
  const job = scans.get(id)
  if (!job) return
  job.progress = progress
  if (status) job.status = status
}

export function completeScan(id, result, blueprint) {
  const job = scans.get(id)
  if (!job) return
  job.status = 'completed'
  job.progress = 100
  job.result = result
  job.blueprint = blueprint
}

export function failScan(id, error) {
  const job = scans.get(id)
  if (!job) return
  job.status = 'failed'
  job.error = error
  appendLog(id, error, 'error')
}

export function listScans() {
  return [...scans.values()]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .map((j) => ({
      id: j.id,
      status: j.status,
      progress: j.progress,
      sourceLabel: j.result?.sourceLabel ?? j.meta?.sourceLabel,
      migrationScore: j.result?.migration?.score,
      createdAt: j.createdAt,
    }))
}
