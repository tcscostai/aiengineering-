import { useState, useEffect, useCallback } from 'react'
import * as evaluationRulesService from '../services/evaluationRulesService'

export function useEvaluationRules() {
  const [config, setConfig] = useState(() => evaluationRulesService.getEvaluationRulesConfig())

  const refresh = useCallback(() => {
    setConfig(evaluationRulesService.getEvaluationRulesConfig())
  }, [])

  useEffect(() => {
    const handler = () => refresh()
    window.addEventListener('horizon-storage', handler)
    return () => window.removeEventListener('horizon-storage', handler)
  }, [refresh])

  const impact = evaluationRulesService.computeEvalRulesImpact(config.rules, config.enforcementMode)

  return {
    config,
    impact,
    passThreshold: evaluationRulesService.getPassThreshold(),
    refresh,
    toggleRule: (id, enabled) => {
      evaluationRulesService.toggleEvalRule(id, enabled)
      refresh()
    },
    updateRuleParam: (id, key, value) => {
      evaluationRulesService.updateEvalRuleParam(id, key, value)
      refresh()
    },
    updateRule: (id, patch) => {
      evaluationRulesService.updateEvalRule(id, patch)
      refresh()
    },
    setEnforcementMode: (mode) => {
      evaluationRulesService.setEvalEnforcementMode(mode)
      refresh()
    },
    resetToDefaults: () => {
      evaluationRulesService.resetEvalRulesToDefaults()
      refresh()
    },
    addCustomRule: (payload) => {
      evaluationRulesService.addCustomEvalRule(payload)
      refresh()
    },
    deleteCustomRule: (id) => {
      evaluationRulesService.deleteCustomEvalRule(id)
      refresh()
    },
    exportJSON: evaluationRulesService.downloadEvalRulesJSON,
    importJSON: (json) => {
      evaluationRulesService.importEvalRulesJSON(json)
      refresh()
    },
    evaluateAgent: (agent) => evaluationRulesService.evaluateAgentAgainstRules(agent, config.rules),
  }
}
