const API_BASE = import.meta.env.VITE_RE_API_URL ?? ''

async function request(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, options)
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error ?? `Request failed (${res.status})`)
  return data
}

export async function checkReServerHealth() {
  try {
    const res = await fetch(`${API_BASE}/api/re/health`, { signal: AbortSignal.timeout(3000) })
    if (!res.ok) return { ok: false }
    return await res.json()
  } catch {
    return { ok: false }
  }
}

export async function startGitScan({ url, branch, token, subpath }) {
  return request('/api/re/scan/git', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url, branch, token, subpath }),
  })
}

export async function startWorkspacePathScan(workspacePath) {
  return request('/api/re/scan/workspace-path', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ path: workspacePath }),
  })
}

export async function startWorkspaceZipScan(file) {
  const form = new FormData()
  form.append('archive', file)
  const res = await fetch(`${API_BASE}/api/re/scan/workspace-zip`, { method: 'POST', body: form })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error ?? 'Upload failed')
  return data
}

export async function fetchScan(scanId) {
  return request(`/api/re/scans/${scanId}`)
}

export async function askCopilot(scanId, question) {
  return request('/api/re/copilot', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ scanId, question }),
  })
}

export async function fetchBlueprint(scanId, targetStack) {
  const qs = targetStack ? `?targetStack=${encodeURIComponent(targetStack)}` : ''
  return request(`/api/re/scans/${scanId}/blueprint${qs}`)
}

export async function regenerateBlueprint(scanId, targetStack) {
  return request(`/api/re/scans/${scanId}/blueprint`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ targetStack }),
  })
}

export function getBlueprintExportUrl(scanId) {
  return `${API_BASE}/api/re/scans/${scanId}/export`
}

export async function pollScanUntilDone(scanId, { onTick, intervalMs = 1200, timeoutMs = 300000 } = {}) {
  const start = Date.now()
  while (Date.now() - start < timeoutMs) {
    const job = await fetchScan(scanId)
    onTick?.(job)
    if (job.status === 'completed') return job
    if (job.status === 'failed') throw new Error(job.error ?? 'Scan failed')
    await new Promise((r) => setTimeout(r, intervalMs))
  }
  throw new Error('Scan timed out')
}
