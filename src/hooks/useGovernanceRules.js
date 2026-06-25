import { useState, useEffect, useCallback } from 'react'
import * as governanceRulesService from '../services/governanceRulesService'

export function useGovernanceRules() {
  const [config, setConfig] = useState(() => governanceRulesService.getGovernanceGuardrailsConfig())

  const refresh = useCallback(() => {
    setConfig(governanceRulesService.getGovernanceGuardrailsConfig())
  }, [])

  useEffect(() => {
    const handler = () => refresh()
    window.addEventListener('horizon-storage', handler)
    return () => window.removeEventListener('horizon-storage', handler)
  }, [refresh])

  const impact = governanceRulesService.computeGuardrailsImpact(
    config.guardrails,
    config.enforcementMode
  )

  return {
    config,
    impact,
    refresh,
    toggleGuardrail: (id, enabled) => {
      governanceRulesService.toggleGuardrail(id, enabled)
      refresh()
    },
    updateGuardrailParam: (id, key, value) => {
      governanceRulesService.updateGuardrailParam(id, key, value)
      refresh()
    },
    updateGuardrail: (id, patch) => {
      governanceRulesService.updateGuardrail(id, patch)
      refresh()
    },
    setEnforcementMode: (mode) => {
      governanceRulesService.setGuardrailEnforcementMode(mode)
      refresh()
    },
    resetToDefaults: () => {
      governanceRulesService.resetGuardrailsToDefaults()
      refresh()
    },
    addCustomGuardrail: (payload) => {
      governanceRulesService.addCustomGuardrail(payload)
      refresh()
    },
    deleteCustomGuardrail: (id) => {
      governanceRulesService.deleteCustomGuardrail(id)
      refresh()
    },
    exportJSON: governanceRulesService.downloadGuardrailsJSON,
    importJSON: (json) => {
      governanceRulesService.importGuardrailsJSON(json)
      refresh()
    },
    evaluateAgent: (agent) => governanceRulesService.evaluateAgentAgainstGuardrails(agent, config.guardrails),
  }
}
