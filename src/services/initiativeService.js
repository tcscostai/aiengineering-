import { loadJSON, saveJSON, generateId } from '../lib/storage'
import { buildEmptyDomainPlans } from '../data/workspaceDomains'
import { getAllAgents } from './agentService'

const STORAGE_KEY = 'initiatives'
const ACTIVE_KEY = 'active_workspace_id'

function normalizeWorkspace(raw) {
  const domainPlans = raw.domainPlans ?? buildEmptyDomainPlans()
  const domains =
    raw.domains ??
    Object.entries(domainPlans)
      .filter(([, plan]) => plan?.enabled)
      .map(([id]) => id)

  return {
    linkedAgentIds: [],
    progress: 0,
    status: 'planning',
    domainPlans,
    domains,
    industry: raw.industry ?? raw.domain ?? 'General',
    ...raw,
    domain: raw.industry ?? raw.domain ?? 'General',
  }
}

export function getAllInitiatives() {
  return loadJSON(STORAGE_KEY, []).map(normalizeWorkspace)
}

export function getInitiativeById(id) {
  return getAllInitiatives().find((i) => i.id === id) ?? null
}

export function getActiveWorkspaceId() {
  return loadJSON(ACTIVE_KEY, null)
}

export function setActiveWorkspace(id) {
  saveJSON(ACTIVE_KEY, id)
  return getInitiativeById(id)
}

export function getActiveWorkspace() {
  const id = getActiveWorkspaceId()
  if (id) {
    const ws = getInitiativeById(id)
    if (ws) return ws
  }
  const all = getAllInitiatives()
  return all.find((i) => i.status === 'active') ?? all[0] ?? null
}

function computeProgress(workspace, agents = []) {
  const enabledDomains = workspace.domains ?? []
  if (!enabledDomains.length) return workspace.progress ?? 0

  const linked = workspace.linkedAgentIds ?? []
  const projectAgents = agents.filter(
    (a) => a.project?.trim() === workspace.title?.trim() || linked.includes(a.id)
  )

  const domainScores = enabledDomains.map((domainId) => {
    const plan = workspace.domainPlans?.[domainId]
    const deliverableCount = plan?.deliverables?.filter((d) => d.selected).length ?? 1
    const domainAgents = projectAgents.filter((a) => a.category === domainId)
    const published = domainAgents.filter((a) => ['certified', 'published'].includes(a.stage)).length
    const inProgress = domainAgents.filter((a) => a.stage !== 'draft').length
    const agentScore = Math.min(100, published * 35 + inProgress * 15)
    const deliverableScore = Math.min(40, domainAgents.length * 12)
    return Math.min(100, agentScore + deliverableScore)
  })

  return domainScores.length
    ? Math.round(domainScores.reduce((a, b) => a + b, 0) / domainScores.length)
    : 0
}

export function createInitiative(data) {
  const now = new Date().toISOString()
  const domainPlans = data.domainPlans ?? buildEmptyDomainPlans()
  const domains =
    data.domains ??
    Object.entries(domainPlans)
      .filter(([, plan]) => plan?.enabled)
      .map(([id]) => id)

  const workspace = normalizeWorkspace({
    id: generateId('ws'),
    title: data.title.trim(),
    description: data.description.trim(),
    industry: data.industry?.trim() || data.domain?.trim() || 'General',
    domain: data.industry?.trim() || data.domain?.trim() || 'General',
    status: domains.length ? 'active' : 'planning',
    progress: 0,
    linkedAgentIds: [],
    domains,
    domainPlans,
    businessObjective: data.businessObjective?.trim() || '',
    stakeholders: data.stakeholders?.trim() || '',
    reScanId: data.reScanId ?? null,
    createdAt: now,
    updatedAt: now,
  })

  const list = getAllInitiatives()
  const updatedList = list.map((w) =>
    w.status === 'active' && domains.length ? { ...w, status: 'planning', updatedAt: now } : w
  )
  updatedList.push(workspace)
  saveJSON(STORAGE_KEY, updatedList)
  setActiveWorkspace(workspace.id)
  return workspace
}

export function updateInitiative(id, patch) {
  const list = getAllInitiatives()
  const idx = list.findIndex((i) => i.id === id)
  if (idx < 0) return null
  list[idx] = normalizeWorkspace({ ...list[idx], ...patch, updatedAt: new Date().toISOString() })
  saveJSON(STORAGE_KEY, list)
  return list[idx]
}

export function refreshWorkspaceProgress(workspaceId, agents) {
  const ws = getInitiativeById(workspaceId)
  if (!ws) return null
  const agentList = agents ?? getAllAgents()
  const progress = computeProgress(ws, agentList)
  const linked = new Set(ws.linkedAgentIds ?? [])
  agentList.forEach((a) => {
    if (a.project?.trim() === ws.title?.trim()) linked.add(a.id)
  })
  return updateInitiative(workspaceId, {
    progress,
    linkedAgentIds: [...linked],
    status: progress > 0 ? 'active' : ws.status,
  })
}

export function deleteInitiative(id) {
  const active = getActiveWorkspaceId()
  saveJSON(STORAGE_KEY, getAllInitiatives().filter((i) => i.id !== id))
  if (active === id) {
    const next = getAllInitiatives()[0]
    saveJSON(ACTIVE_KEY, next?.id ?? null)
  }
}

export function linkAgentToInitiative(initiativeId, agentId) {
  const init = getInitiativeById(initiativeId)
  if (!init) return null
  const linked = [...new Set([...(init.linkedAgentIds || []), agentId])]
  return updateInitiative(initiativeId, {
    linkedAgentIds: linked,
    status: 'active',
  })
}

export function computeInitiativeMetrics() {
  const workspaces = getAllInitiatives()
  return {
    activeInitiatives: workspaces.filter((i) => i.status === 'active').length,
    totalInitiatives: workspaces.length,
    activeWorkspaces: workspaces.filter((i) => i.status === 'active').length,
    totalWorkspaces: workspaces.length,
  }
}

export function getWorkspacesForDomain(domainId) {
  return getAllInitiatives().filter((w) => w.domains?.includes(domainId))
}
