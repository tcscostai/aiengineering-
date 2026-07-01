import { loadJSON, saveJSON, generateId } from '../lib/storage'
import { STAGE_INDEX, getNextStage, ONBOARDING_STAGES } from '../lib/constants'
import { registerSkillsFromAgent, recordSkillReuse, getAllSkills } from './skillService'
import { getDefaultPlatformTool, getPlatformTool } from '../data/platformTools'

const STORAGE_KEY = 'agents'

function emptyEvaluation(dimensions = []) {
  return Object.fromEntries(dimensions.map((d) => [d, null]))
}

function normalizeAgent(agent) {
  const platformTool = agent.platformTool ?? getDefaultPlatformTool(agent.category ?? 'ad')
  return {
    platformTool,
    runtimeType: '',
    sourceLocation: '',
    entryPoint: '',
    connectionEndpoint: '',
    connectionStatus: 'unverified',
    connectionVerifiedAt: null,
    connectionMessage: '',
    reusedSkillRefs: [],
    ...agent,
    platformTool: agent.platformTool ?? platformTool,
  }
}

export function createEmptyAgent(category, catalog, options = {}) {
  const platformTool = options.platformTool ?? getDefaultPlatformTool(category)
  const pt = getPlatformTool(platformTool)
  const now = new Date().toISOString()
  return {
    id: generateId('agent'),
    name: '',
    category,
    project: options.project ?? '',
    workspaceId: options.workspaceId ?? '',
    team: '',
    owner: '',
    purpose: '',
    description: '',
    agentFamily: '',
    platformTool,
    runtimeType: platformTool === 'external' ? '' : pt.runtimeType,
    sourceLocation: '',
    entryPoint: '',
    connectionEndpoint: '',
    connectionStatus: 'unverified',
    connectionVerifiedAt: null,
    connectionMessage: '',
    stage: 'draft',
    skills: [],
    reusedSkillRefs: [],
    knowledgeSources: [],
    tools: [],
    workflowDescription: '',
    evaluation: emptyEvaluation(catalog?.evaluation ?? []),
    governanceApproved: false,
    governanceApprover: '',
    version: '1.0.0',
    reuseCount: 0,
    createdAt: now,
    updatedAt: now,
  }
}

export function getAllAgents() {
  return loadJSON(STORAGE_KEY, []).map(normalizeAgent)
}

export function getAgentsByCategory(category) {
  return getAllAgents().filter((a) => a.category === category)
}

export function getAgentById(id) {
  const agent = getAllAgents().find((a) => a.id === id)
  return agent ?? null
}

export function getPublishedAgents() {
  return getAllAgents().filter((a) => a.stage === 'published')
}

export function saveAgent(agent) {
  const agents = getAllAgents()
  const idx = agents.findIndex((a) => a.id === agent.id)
  const normalized = normalizeAgent(agent)
  const updated = { ...normalized, updatedAt: new Date().toISOString() }

  const librarySkillNames = getAllSkills().map((s) => s.name.toLowerCase())
  const reused = updated.skills.filter((s) => librarySkillNames.includes(s.toLowerCase()))
  if (reused.length) recordSkillReuse(reused, updated.id)

  if (idx >= 0) agents[idx] = updated
  else agents.push(updated)
  saveJSON(STORAGE_KEY, agents)
  return updated
}

export function deleteAgent(id) {
  saveJSON(STORAGE_KEY, getAllAgents().filter((a) => a.id !== id))
}

export function applyConnectionVerification(agent, result) {
  return saveAgent({
    ...agent,
    connectionStatus: result.ok ? result.status : 'failed',
    connectionVerifiedAt: result.ok ? result.verifiedAt : null,
    connectionMessage: result.ok ? result.message : result.errors?.join('; '),
  })
}

export function validateStageAdvance(agent, catalog) {
  const errors = []
  switch (agent.stage) {
    case 'draft':
      if (!agent.name?.trim()) errors.push('Agent name is required')
      if (!agent.project?.trim()) errors.push('Project is required')
      if (!agent.team?.trim()) errors.push('Team is required')
      if (!agent.owner?.trim()) errors.push('Owner is required')
      if (!agent.purpose?.trim()) errors.push('Purpose is required')
      if (!agent.runtimeType?.trim()) errors.push('Runtime type is required — where does this agent run?')
      if (!agent.sourceLocation?.trim()) errors.push('Source location is required (repo, ARN, or endpoint)')
      if (!agent.entryPoint?.trim()) errors.push('Entry point / alias is required')
      break
    case 'configured':
      if (agent.connectionStatus !== 'verified') {
        errors.push('Verify runtime connection before advancing (Python repo, Bedrock ARN, Foundry resource, etc.)')
      }
      break
    case 'knowledge_connected':
      if (agent.skills.length === 0) errors.push('Attach at least one skill — reuse from enterprise library or category catalog')
      if (agent.knowledgeSources.length === 0) errors.push('Bind at least one knowledge source')
      break
    case 'tool_connected':
      if (agent.tools.length === 0) errors.push('Connect at least one tool')
      break
    case 'workflow_designed':
      if (!agent.workflowDescription?.trim()) errors.push('Workflow mapping description is required')
      break
    case 'evaluated': {
      const dims = catalog?.evaluation ?? []
      const missing = dims.filter((d) => agent.evaluation[d] == null || agent.evaluation[d] === '')
      if (missing.length) errors.push(`Complete evaluation: ${missing.join(', ')}`)
      break
    }
    case 'governance_approved':
      if (!agent.governanceApproved) errors.push('Governance approval is required')
      if (!agent.governanceApprover?.trim()) errors.push('Approver name is required')
      break
    default:
      break
  }
  return errors
}

export function advanceAgentStage(id, catalog) {
  const agent = getAgentById(id)
  if (!agent) return { ok: false, errors: ['Agent not found'] }

  const next = getNextStage(agent.stage)
  if (!next) return { ok: false, errors: ['Agent is already at final stage'] }

  const errors = validateStageAdvance(agent, catalog)
  if (errors.length) return { ok: false, errors }

  let updated = saveAgent({ ...agent, stage: next })

  if (next === 'published') {
    registerSkillsFromAgent(updated)
    updated = getAgentById(id)
  }

  return { ok: true, agent: updated }
}

export function computeAgentMetrics() {
  const agents = getAllAgents()
  const published = agents.filter((a) => a.stage === 'published')
  const certified = agents.filter((a) => ['certified', 'published'].includes(a.stage))
  const inProgress = agents.filter((a) => a.stage !== 'published')

  const allSkills = new Set()
  agents.forEach((a) => a.skills.forEach((s) => allSkills.add(s)))

  const librarySkills = getAllSkills()
  const skillReuses = librarySkills.reduce((sum, s) => sum + (s.reuseCount ?? 0), 0)

  const avgEval = (() => {
    const scores = agents.flatMap((a) =>
      Object.values(a.evaluation).filter((v) => typeof v === 'number')
    )
    if (!scores.length) return 0
    return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
  })()

  const agentsWithReusedSkills = agents.filter((a) => {
    const libNames = librarySkills.map((s) => s.name.toLowerCase())
    return a.skills.some((s) => libNames.includes(s.toLowerCase()))
  })

  const reuseRatio = agents.length
    ? Math.round((agentsWithReusedSkills.length / agents.length) * 100)
    : 0

  return {
    totalAgents: agents.length,
    runningAgents: inProgress.length,
    certifiedAgents: certified.length,
    publishedAgents: published.length,
    reusableSkills: librarySkills.length || allSkills.size,
    skillReuses,
    evaluationScore: avgEval,
    reuseRatio,
    byCategory: {
      ad: agents.filter((a) => a.category === 'ad').length,
      ams: agents.filter((a) => a.category === 'ams').length,
      qe: agents.filter((a) => a.category === 'qe').length,
    },
  }
}

export function getStageProgress(agent) {
  const idx = STAGE_INDEX[agent.stage] ?? 0
  return Math.round((idx / (ONBOARDING_STAGES.length - 1)) * 100)
}

export function deployAgent(id) {
  const agent = getAgentById(id)
  if (!agent || agent.stage !== 'published') return null
  const updated = saveAgent({ ...agent, reuseCount: (agent.reuseCount ?? 0) + 1 })
  return updated
}
