import { loadJSON, saveJSON, generateId } from '../lib/storage'
import {
  DEFAULT_EVALUATION_RULES,
  EVAL_ENFORCEMENT_MODES,
  EVAL_RULES_SCHEMA,
} from '../data/evaluationRules'
import { logEvaluationActivity } from './evaluationService'

const RULES_KEY = 'evaluation_rules'

function mergeWithDefaults(stored) {
  const defaultsById = Object.fromEntries(DEFAULT_EVALUATION_RULES.map((r) => [r.id, r]))
  const storedRules = stored?.rules ?? []
  const merged = DEFAULT_EVALUATION_RULES.map((def) => {
    const saved = storedRules.find((r) => r.id === def.id)
    return saved ? { ...def, ...saved, params: { ...def.params, ...saved.params } } : { ...def }
  })
  storedRules
    .filter((r) => r.custom && !defaultsById[r.id])
    .forEach((r) => merged.push(r))
  return merged
}

export function getEvaluationRulesConfig() {
  const stored = loadJSON(RULES_KEY, null)
  return {
    schemaVersion: EVAL_RULES_SCHEMA,
    enforcementMode: stored?.enforcementMode ?? 'warn',
    rules: mergeWithDefaults(stored),
    updatedAt: stored?.updatedAt ?? null,
  }
}

export function saveEvaluationRulesConfig(config) {
  const payload = {
    schemaVersion: EVAL_RULES_SCHEMA,
    enforcementMode: config.enforcementMode,
    rules: config.rules,
    updatedAt: new Date().toISOString(),
  }
  saveJSON(RULES_KEY, payload)
  return payload
}

export function getPassThreshold() {
  const config = getEvaluationRulesConfig()
  const rule = config.rules.find((r) => r.id === 'pass_threshold' && r.enabled)
  return rule?.params?.threshold ?? 85
}

export function updateEvalRule(ruleId, patch) {
  const config = getEvaluationRulesConfig()
  const rules = config.rules.map((r) =>
    r.id === ruleId ? { ...r, ...patch, params: { ...r.params, ...(patch.params ?? {}) } } : r
  )
  return saveEvaluationRulesConfig({ ...config, rules })
}

export function toggleEvalRule(ruleId, enabled) {
  return updateEvalRule(ruleId, { enabled })
}

export function updateEvalRuleParam(ruleId, paramKey, value) {
  const config = getEvaluationRulesConfig()
  const rule = config.rules.find((r) => r.id === ruleId)
  if (!rule) return config
  return updateEvalRule(ruleId, { params: { ...rule.params, [paramKey]: value } })
}

export function setEvalEnforcementMode(mode) {
  const config = getEvaluationRulesConfig()
  return saveEvaluationRulesConfig({ ...config, enforcementMode: mode })
}

export function resetEvalRulesToDefaults() {
  return saveEvaluationRulesConfig({
    enforcementMode: 'warn',
    rules: DEFAULT_EVALUATION_RULES.map((r) => ({ ...r, params: { ...r.params } })),
  })
}

export function addCustomEvalRule({ name, description, category, scope, ruleType, params }) {
  const config = getEvaluationRulesConfig()
  const rule = {
    id: generateId('eval_rule'),
    custom: true,
    name: name.trim(),
    description: description || 'Custom evaluation rule',
    category: category || 'custom',
    ruleType: ruleType || 'dimension_min',
    enabled: true,
    scope: scope || 'all',
    enforcement: 'warn',
    params: params || { dimension: 'Groundedness', minScore: 85 },
  }
  logEvaluationActivity({
    type: 'rule_created',
    title: `Evaluation rule created — ${rule.name}`,
    detail: `${rule.ruleType} · scope ${rule.scope}`,
    status: 'completed',
  })
  return saveEvaluationRulesConfig({ ...config, rules: [...config.rules, rule] })
}

export function deleteCustomEvalRule(ruleId) {
  const config = getEvaluationRulesConfig()
  const rules = config.rules.filter((r) => r.id !== ruleId || !r.custom)
  return saveEvaluationRulesConfig({ ...config, rules })
}

function agentInScope(agent, scope) {
  if (scope === 'all') return true
  if (scope === 'healthcare') {
    return /prior auth|claims|healthcare|clinical|pharmacy|member|eligibility|fhir|hipaa/i.test(
      `${agent.project} ${agent.purpose} ${agent.name}`
    )
  }
  return agent.category === scope
}

export function evaluateRuleAgainstAgent(rule, agent) {
  if (!rule.enabled || !agentInScope(agent, rule.scope)) {
    return { pass: true, skipped: true, rule }
  }

  const evalScores = agent.evaluation || {}
  let pass = true
  let detail = ''

  switch (rule.ruleType) {
    case 'pass_threshold': {
      const scores = Object.values(evalScores).filter((v) => typeof v === 'number')
      const avg = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0
      const threshold = rule.params.threshold ?? 85
      pass = avg >= threshold
      detail = `Overall ${avg} vs threshold ${threshold}`
      break
    }
    case 'dimension_min': {
      const dim = rule.params.dimension
      const min = rule.params.minScore ?? 85
      const val = evalScores[dim]
      if (typeof val !== 'number') {
        pass = rule.enforcement === 'monitor'
        detail = `${dim} not scored yet`
      } else {
        pass = val >= min
        detail = `${dim}: ${val} vs min ${min}`
      }
      break
    }
    default:
      pass = true
      detail = 'Custom rule — manual review'
  }

  return { pass, skipped: false, rule, detail }
}

export function evaluateAgentAgainstRules(agent, rules = null) {
  const config = rules ?? getEvaluationRulesConfig().rules
  return config
    .filter((r) => r.enabled)
    .map((rule) => evaluateRuleAgainstAgent(rule, agent))
    .filter((r) => !r.skipped)
}

export function computeEvalRulesImpact(rules, enforcementMode) {
  const active = rules.filter((r) => r.enabled)
  const mode = EVAL_ENFORCEMENT_MODES.find((m) => m.id === enforcementMode)
  const byCategory = {}
  active.forEach((r) => {
    byCategory[r.category] = (byCategory[r.category] ?? 0) + 1
  })
  return {
    activeCount: active.length,
    totalRules: rules.length,
    customCount: rules.filter((r) => r.custom).length,
    enforcementLabel: mode?.label ?? enforcementMode,
    byCategory,
  }
}

export function exportEvalRulesJSON() {
  return getEvaluationRulesConfig()
}

export function importEvalRulesJSON(json) {
  if (!json || json.schemaVersion !== EVAL_RULES_SCHEMA) {
    throw new Error(`Unsupported schema. Expected ${EVAL_RULES_SCHEMA}`)
  }
  const rules = (json.rules ?? []).map((r) => ({
    ...r,
    id: r.id || generateId('eval_rule'),
    custom: r.custom ?? !DEFAULT_EVALUATION_RULES.some((d) => d.id === r.id),
    params: r.params ?? {},
  }))
  logEvaluationActivity({
    type: 'rules_imported',
    title: 'Evaluation rules imported',
    detail: `${rules.length} rules loaded from file`,
    status: 'completed',
  })
  return saveEvaluationRulesConfig({
    enforcementMode: json.enforcementMode ?? 'warn',
    rules,
  })
}

export function downloadEvalRulesJSON() {
  const json = exportEvalRulesJSON()
  const blob = new Blob([JSON.stringify(json, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'horizon-evaluation-rules.json'
  a.click()
  URL.revokeObjectURL(url)
}
