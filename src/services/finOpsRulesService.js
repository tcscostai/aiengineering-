import { loadJSON, saveJSON, generateId } from '../lib/storage'
import {
  DEFAULT_PROMPT_OPTIMIZATION_RULES,
  ENFORCEMENT_MODES,
} from '../data/promptOptimizationRules'

const RULES_KEY = 'finops_prompt_rules'

function mergeWithDefaults(stored) {
  const defaultsById = Object.fromEntries(DEFAULT_PROMPT_OPTIMIZATION_RULES.map((r) => [r.id, r]))
  const storedRules = stored?.rules ?? []
  const merged = DEFAULT_PROMPT_OPTIMIZATION_RULES.map((def) => {
    const saved = storedRules.find((r) => r.id === def.id)
    return saved ? { ...def, ...saved, params: { ...def.params, ...saved.params } } : { ...def }
  })
  storedRules
    .filter((r) => r.custom && !defaultsById[r.id])
    .forEach((r) => merged.push(r))

  return merged
}

export function getPromptOptimizationConfig() {
  const stored = loadJSON(RULES_KEY, null)
  return {
    enforcementMode: stored?.enforcementMode ?? 'recommend',
    rules: mergeWithDefaults(stored),
    updatedAt: stored?.updatedAt ?? null,
  }
}

export function savePromptOptimizationConfig(config) {
  const payload = {
    enforcementMode: config.enforcementMode,
    rules: config.rules,
    updatedAt: new Date().toISOString(),
  }
  saveJSON(RULES_KEY, payload)
  return payload
}

export function updateRule(ruleId, patch) {
  const config = getPromptOptimizationConfig()
  const rules = config.rules.map((r) =>
    r.id === ruleId ? { ...r, ...patch, params: { ...r.params, ...(patch.params ?? {}) } } : r
  )
  return savePromptOptimizationConfig({ ...config, rules })
}

export function toggleRule(ruleId, enabled) {
  return updateRule(ruleId, { enabled })
}

export function updateRuleParam(ruleId, paramKey, value) {
  const config = getPromptOptimizationConfig()
  const rule = config.rules.find((r) => r.id === ruleId)
  if (!rule) return config
  return updateRule(ruleId, { params: { ...rule.params, [paramKey]: value } })
}

export function setEnforcementMode(mode) {
  const config = getPromptOptimizationConfig()
  return savePromptOptimizationConfig({ ...config, enforcementMode: mode })
}

export function resetRulesToDefaults() {
  return savePromptOptimizationConfig({
    enforcementMode: 'recommend',
    rules: DEFAULT_PROMPT_OPTIMIZATION_RULES.map((r) => ({ ...r, params: { ...r.params } })),
  })
}

export function addCustomRule({ name, description, category, scope, maxInputTokens }) {
  const config = getPromptOptimizationConfig()
  const rule = {
    id: generateId('rule'),
    custom: true,
    name,
    description: description || 'Custom prompt optimization rule',
    category: category || 'compression',
    enabled: true,
    scope: scope || 'all',
    enforcement: 'recommend',
    estimatedSavingsUsdMonthly: Math.round(maxInputTokens * 0.02),
    params: {
      maxInputTokens: maxInputTokens || 4096,
      stripWhitespace: true,
    },
  }
  return savePromptOptimizationConfig({
    ...config,
    rules: [...config.rules, rule],
  })
}

export function deleteCustomRule(ruleId) {
  const config = getPromptOptimizationConfig()
  const rules = config.rules.filter((r) => r.id !== ruleId || !r.custom)
  return savePromptOptimizationConfig({ ...config, rules })
}

export function computeRulesImpact(rules, enforcementMode) {
  const active = rules.filter((r) => r.enabled)
  const totalSavings = active.reduce((s, r) => s + (r.estimatedSavingsUsdMonthly ?? 0), 0)
  const mode = ENFORCEMENT_MODES.find((m) => m.id === enforcementMode)

  const byCategory = {}
  active.forEach((r) => {
    byCategory[r.category] = (byCategory[r.category] ?? 0) + (r.estimatedSavingsUsdMonthly ?? 0)
  })

  const tokenReductionPct = Math.min(
    42,
    active.length * 3 +
      (active.find((r) => r.id === 'semantic_cache')?.params?.similarityThreshold ?? 0.85) * 8
  )

  return {
    activeCount: active.length,
    totalRules: rules.length,
    projectedSavingsUsdMonthly: totalSavings,
    tokenReductionPct: Math.round(tokenReductionPct),
    enforcementLabel: mode?.label ?? enforcementMode,
    byCategory,
  }
}
