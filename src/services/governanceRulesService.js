import { loadJSON, saveJSON, generateId } from '../lib/storage'
import { STAGE_INDEX } from '../lib/constants'
import {
  DEFAULT_GOVERNANCE_GUARDRAILS,
  GUARDRAIL_ENFORCEMENT_MODES,
  GUARDRAILS_SCHEMA,
} from '../data/governanceGuardrails'

const GUARDRAILS_KEY = 'governance_guardrails'
const AUDIT_KEY = 'governance_audit'

function logAudit(entry) {
  const all = loadJSON(AUDIT_KEY, [])
  saveJSON(AUDIT_KEY, [{ id: generateId('audit'), timestamp: new Date().toISOString(), ...entry }, ...all].slice(0, 100))
}

function mergeWithDefaults(stored) {
  const defaultsById = Object.fromEntries(DEFAULT_GOVERNANCE_GUARDRAILS.map((r) => [r.id, r]))
  const storedRules = stored?.guardrails ?? stored?.rules ?? []
  const merged = DEFAULT_GOVERNANCE_GUARDRAILS.map((def) => {
    const saved = storedRules.find((r) => r.id === def.id)
    return saved ? { ...def, ...saved, params: { ...def.params, ...saved.params } } : { ...def }
  })
  storedRules
    .filter((r) => r.custom && !defaultsById[r.id])
    .forEach((r) => merged.push(r))
  return merged
}

export function getGovernanceGuardrailsConfig() {
  const stored = loadJSON(GUARDRAILS_KEY, null)
  return {
    schemaVersion: GUARDRAILS_SCHEMA,
    enforcementMode: stored?.enforcementMode ?? 'warn',
    guardrails: mergeWithDefaults(stored),
    updatedAt: stored?.updatedAt ?? null,
  }
}

export function saveGovernanceGuardrailsConfig(config) {
  const payload = {
    schemaVersion: GUARDRAILS_SCHEMA,
    enforcementMode: config.enforcementMode,
    guardrails: config.guardrails,
    updatedAt: new Date().toISOString(),
  }
  saveJSON(GUARDRAILS_KEY, payload)
  return payload
}

export function updateGuardrail(id, patch) {
  const config = getGovernanceGuardrailsConfig()
  const guardrails = config.guardrails.map((g) =>
    g.id === id ? { ...g, ...patch, params: { ...g.params, ...(patch.params ?? {}) } } : g
  )
  return saveGovernanceGuardrailsConfig({ ...config, guardrails })
}

export function toggleGuardrail(id, enabled) {
  return updateGuardrail(id, { enabled })
}

export function updateGuardrailParam(id, paramKey, value) {
  const config = getGovernanceGuardrailsConfig()
  const g = config.guardrails.find((r) => r.id === id)
  if (!g) return config
  return updateGuardrail(id, { params: { ...g.params, [paramKey]: value } })
}

export function setGuardrailEnforcementMode(mode) {
  const config = getGovernanceGuardrailsConfig()
  return saveGovernanceGuardrailsConfig({ ...config, enforcementMode: mode })
}

export function resetGuardrailsToDefaults() {
  return saveGovernanceGuardrailsConfig({
    enforcementMode: 'warn',
    guardrails: DEFAULT_GOVERNANCE_GUARDRAILS.map((g) => ({ ...g, params: { ...g.params } })),
  })
}

export function addCustomGuardrail({ name, description, category, scope, ruleType, params }) {
  const config = getGovernanceGuardrailsConfig()
  const guardrail = {
    id: generateId('guardrail'),
    custom: true,
    name: name.trim(),
    description: description || 'Custom governance guardrail',
    category: category || 'custom',
    ruleType: ruleType || 'require_fields',
    enabled: true,
    scope: scope || 'all',
    enforcement: 'warn',
    params: params || { fields: ['purpose', 'owner'] },
  }
  logAudit({
    type: 'guardrail_created',
    action: 'Guardrail created',
    entity: guardrail.name,
    status: 'compliant',
  })
  return saveGovernanceGuardrailsConfig({ ...config, guardrails: [...config.guardrails, guardrail] })
}

export function deleteCustomGuardrail(id) {
  const config = getGovernanceGuardrailsConfig()
  const guardrails = config.guardrails.filter((g) => g.id !== id || !g.custom)
  return saveGovernanceGuardrailsConfig({ ...config, guardrails })
}

function agentInScope(agent, scope) {
  if (scope === 'all') return true
  if (scope === 'healthcare') {
    return /prior auth|claims|healthcare|clinical|pharmacy|member|eligibility|benefit|formulary|fhir|hipaa/i.test(
      `${agent.project} ${agent.purpose} ${agent.name}`
    )
  }
  return agent.category === scope
}

export function evaluateGuardrailAgainstAgent(guardrail, agent) {
  if (!guardrail.enabled || !agentInScope(agent, guardrail.scope)) {
    return { pass: true, skipped: true, guardrail }
  }

  let pass = true
  let detail = ''

  switch (guardrail.ruleType) {
    case 'require_fields': {
      const fields = guardrail.params.fields ?? []
      pass = fields.every((f) => Boolean(agent[f]?.trim?.() ?? agent[f]))
      detail = `Required: ${fields.join(', ')}`
      break
    }
    case 'hipaa_binding': {
      pass =
        agent.connectionStatus === 'verified' &&
        (agent.knowledgeSources?.length ?? 0) >= (guardrail.params.minKnowledgeSources ?? 1)
      detail = 'Verified connection + knowledge binding'
      break
    }
    case 'require_governance_approval':
      pass = agent.governanceApproved && Boolean(agent.governanceApprover?.trim())
      detail = 'Governance approver recorded'
      break
    case 'min_eval_dimension': {
      const dim = guardrail.params.dimension
      const min = guardrail.params.minScore ?? 85
      const val = agent.evaluation?.[dim]
      pass = typeof val !== 'number' || val >= min
      detail = typeof val === 'number' ? `${dim}: ${val}` : `${dim} not evaluated`
      break
    }
    case 'require_version': {
      const pattern = new RegExp(guardrail.params.pattern ?? '^\\d+\\.\\d+\\.\\d+$')
      pass = pattern.test(agent.version ?? '')
      detail = `Version: ${agent.version || 'missing'}`
      break
    }
    case 'require_stage': {
      const minIdx = STAGE_INDEX[guardrail.params.minStage] ?? 1
      pass = (STAGE_INDEX[agent.stage] ?? 0) >= minIdx
      detail = `Stage: ${agent.stage}`
      break
    }
    case 'require_skill': {
      const required = guardrail.params.skills ?? []
      pass = required.some((s) => agent.skills?.some((sk) => sk.toLowerCase() === s.toLowerCase()))
      detail = `Skills: ${required.join(' or ')}`
      break
    }
    case 'require_knowledge': {
      const sources = guardrail.params.sources ?? []
      pass = sources.some((s) => agent.knowledgeSources?.includes(s))
      detail = `Knowledge: ${sources.join(' or ')}`
      break
    }
    default:
      pass = true
      detail = 'Custom guardrail — manual review'
  }

  return { pass, skipped: false, guardrail, detail }
}

export function evaluateAgentAgainstGuardrails(agent, guardrails = null) {
  const list = guardrails ?? getGovernanceGuardrailsConfig().guardrails
  return list
    .filter((g) => g.enabled)
    .map((g) => evaluateGuardrailAgainstAgent(g, agent))
    .filter((r) => !r.skipped)
}

export function computeGuardrailsImpact(guardrails, enforcementMode) {
  const active = guardrails.filter((g) => g.enabled)
  const mode = GUARDRAIL_ENFORCEMENT_MODES.find((m) => m.id === enforcementMode)
  const byCategory = {}
  active.forEach((g) => {
    byCategory[g.category] = (byCategory[g.category] ?? 0) + 1
  })
  return {
    activeCount: active.length,
    totalGuardrails: guardrails.length,
    customCount: guardrails.filter((g) => g.custom).length,
    blockCount: active.filter((g) => g.enforcement === 'block').length,
    enforcementLabel: mode?.label ?? enforcementMode,
    byCategory,
  }
}

export function computeGuardrailCoverage(agents, guardrails = null) {
  const list = guardrails ?? getGovernanceGuardrailsConfig().guardrails
  const governed = agents.filter((a) => a.stage !== 'draft')
  return list
    .filter((g) => g.enabled)
    .map((guardrail) => {
      const results = governed.map((a) => evaluateGuardrailAgainstAgent(guardrail, a))
      const applicable = results.filter((r) => !r.skipped)
      const passing = applicable.filter((r) => r.pass).length
      const coverage = applicable.length ? Math.round((passing / applicable.length) * 100) : 100
      return {
        id: guardrail.id,
        label: guardrail.name,
        description: guardrail.description,
        category: guardrail.category,
        coverage,
        passing,
        total: applicable.length,
        enforcement: guardrail.enforcement,
        custom: guardrail.custom,
        status: coverage >= 90 ? 'compliant' : coverage >= 70 ? 'partial' : 'at_risk',
        guardrail,
      }
    })
}

export function exportGuardrailsJSON() {
  return getGovernanceGuardrailsConfig()
}

export function importGuardrailsJSON(json) {
  if (!json || json.schemaVersion !== GUARDRAILS_SCHEMA) {
    throw new Error(`Unsupported schema. Expected ${GUARDRAILS_SCHEMA}`)
  }
  const guardrails = (json.guardrails ?? json.rules ?? []).map((g) => ({
    ...g,
    id: g.id || generateId('guardrail'),
    custom: g.custom ?? !DEFAULT_GOVERNANCE_GUARDRAILS.some((d) => d.id === g.id),
    params: g.params ?? {},
  }))
  logAudit({
    type: 'guardrails_imported',
    action: 'Guardrails imported from file',
    entity: `${guardrails.length} guardrails loaded`,
    status: 'compliant',
  })
  return saveGovernanceGuardrailsConfig({
    enforcementMode: json.enforcementMode ?? 'warn',
    guardrails,
  })
}

export function downloadGuardrailsJSON() {
  const json = exportGuardrailsJSON()
  const blob = new Blob([JSON.stringify(json, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'horizon-governance-guardrails.json'
  a.click()
  URL.revokeObjectURL(url)
}
