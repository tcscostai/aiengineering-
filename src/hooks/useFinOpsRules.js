import { useState, useEffect, useCallback } from 'react'
import * as rulesService from '../services/finOpsRulesService'

export function useFinOpsRules() {
  const [config, setConfig] = useState(() => rulesService.getPromptOptimizationConfig())

  const refresh = useCallback(() => {
    setConfig(rulesService.getPromptOptimizationConfig())
  }, [])

  useEffect(() => {
    const handler = () => refresh()
    window.addEventListener('horizon-storage', handler)
    return () => window.removeEventListener('horizon-storage', handler)
  }, [refresh])

  const impact = rulesService.computeRulesImpact(config.rules, config.enforcementMode)

  return {
    config,
    impact,
    refresh,
    toggleRule: (id, enabled) => {
      rulesService.toggleRule(id, enabled)
      refresh()
    },
    updateRuleParam: (id, key, value) => {
      rulesService.updateRuleParam(id, key, value)
      refresh()
    },
    updateRule: (id, patch) => {
      rulesService.updateRule(id, patch)
      refresh()
    },
    setEnforcementMode: (mode) => {
      rulesService.setEnforcementMode(mode)
      refresh()
    },
    resetToDefaults: () => {
      rulesService.resetRulesToDefaults()
      refresh()
    },
    addCustomRule: (payload) => {
      rulesService.addCustomRule(payload)
      refresh()
    },
    deleteCustomRule: (id) => {
      rulesService.deleteCustomRule(id)
      refresh()
    },
  }
}
