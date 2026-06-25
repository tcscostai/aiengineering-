import { loadJSON, saveJSON, generateId } from '../lib/storage'

const STORAGE_KEY = 'skill_library'

export function getAllSkills() {
  return loadJSON(STORAGE_KEY, [])
}

export function getSkillsForCategory(category) {
  return getAllSkills().filter(
    (s) => s.categories.includes(category) || s.categories.includes('shared')
  )
}

export function getCertifiedSkills() {
  return getAllSkills().filter((s) => s.certified)
}

export function findSkillByName(name) {
  return getAllSkills().find((s) => s.name.toLowerCase() === name.toLowerCase()) ?? null
}

export function registerSkillsFromAgent(agent) {
  if (agent.stage !== 'published' || !agent.skills?.length) return []

  const library = getAllSkills()
  const registered = []

  agent.skills.forEach((skillName) => {
    const existing = library.find((s) => s.name.toLowerCase() === skillName.toLowerCase())
    if (existing) {
      existing.certified = true
      existing.sourceAgentId = agent.id
      existing.sourceAgentName = agent.name
      existing.sourceProject = agent.project
      existing.updatedAt = new Date().toISOString()
      registered.push(existing)
    } else {
      const skill = {
        id: generateId('skill'),
        name: skillName,
        categories: [agent.category],
        description: `Certified from ${agent.name} (${agent.project})`,
        sourceAgentId: agent.id,
        sourceAgentName: agent.name,
        sourceProject: agent.project,
        sourceTeam: agent.team,
        runtimeType: agent.runtimeType,
        reuseCount: 0,
        certified: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      library.push(skill)
      registered.push(skill)
    }
  })

  saveJSON(STORAGE_KEY, library)
  return registered
}

export function recordSkillReuse(skillNames, agentId) {
  if (!skillNames?.length) return

  const library = getAllSkills()
  let changed = false

  skillNames.forEach((name) => {
    const skill = library.find((s) => s.name.toLowerCase() === name.toLowerCase())
    if (skill && skill.sourceAgentId !== agentId) {
      skill.reuseCount = (skill.reuseCount ?? 0) + 1
      skill.updatedAt = new Date().toISOString()
      changed = true
    }
  })

  if (changed) saveJSON(STORAGE_KEY, library)
}

export function computeSkillMetrics() {
  const skills = getAllSkills()
  return {
    total: skills.length,
    certified: skills.filter((s) => s.certified).length,
    totalReuses: skills.reduce((sum, s) => sum + (s.reuseCount ?? 0), 0),
  }
}

export function getTopReusedSkills(limit = 10) {
  return [...getAllSkills()]
    .sort((a, b) => (b.reuseCount ?? 0) - (a.reuseCount ?? 0))
    .slice(0, limit)
}
