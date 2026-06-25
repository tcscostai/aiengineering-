import { loadJSON, saveJSON, generateId } from '../lib/storage'

const STORAGE_KEY = 'initiatives'

export function getAllInitiatives() {
  return loadJSON(STORAGE_KEY, [])
}

export function getInitiativeById(id) {
  return getAllInitiatives().find((i) => i.id === id) ?? null
}

export function createInitiative(data) {
  const now = new Date().toISOString()
  const initiative = {
    id: generateId('init'),
    title: data.title.trim(),
    description: data.description.trim(),
    domain: data.domain?.trim() || 'General',
    status: 'planning',
    progress: 0,
    linkedAgentIds: [],
    businessObjective: data.businessObjective?.trim() || '',
    stakeholders: data.stakeholders?.trim() || '',
    createdAt: now,
    updatedAt: now,
  }
  const list = getAllInitiatives()
  list.push(initiative)
  saveJSON(STORAGE_KEY, list)
  return initiative
}

export function updateInitiative(id, patch) {
  const list = getAllInitiatives()
  const idx = list.findIndex((i) => i.id === id)
  if (idx < 0) return null
  list[idx] = { ...list[idx], ...patch, updatedAt: new Date().toISOString() }
  saveJSON(STORAGE_KEY, list)
  return list[idx]
}

export function deleteInitiative(id) {
  saveJSON(STORAGE_KEY, getAllInitiatives().filter((i) => i.id !== id))
}

export function linkAgentToInitiative(initiativeId, agentId) {
  const init = getInitiativeById(initiativeId)
  if (!init) return null
  const linked = [...new Set([...(init.linkedAgentIds || []), agentId])]
  const progress = Math.min(100, linked.length * 15)
  return updateInitiative(initiativeId, {
    linkedAgentIds: linked,
    progress,
    status: progress > 0 ? 'active' : init.status,
  })
}

export function computeInitiativeMetrics() {
  const initiatives = getAllInitiatives()
  return {
    activeInitiatives: initiatives.filter((i) => i.status === 'active').length,
    totalInitiatives: initiatives.length,
  }
}
