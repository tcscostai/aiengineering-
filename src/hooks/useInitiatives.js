import { useState, useEffect, useCallback } from 'react'
import * as initiativeService from '../services/initiativeService'

export function useInitiatives() {
  const [initiatives, setInitiatives] = useState(() => initiativeService.getAllInitiatives())

  const refresh = useCallback(() => {
    setInitiatives(initiativeService.getAllInitiatives())
  }, [])

  useEffect(() => {
    const handler = () => refresh()
    window.addEventListener('horizon-storage', handler)
    window.addEventListener('storage', handler)
    return () => {
      window.removeEventListener('horizon-storage', handler)
      window.removeEventListener('storage', handler)
    }
  }, [refresh])

  return {
    initiatives,
    refresh,
    createInitiative: (data) => {
      const created = initiativeService.createInitiative(data)
      refresh()
      return created
    },
    updateInitiative: (id, patch) => {
      const updated = initiativeService.updateInitiative(id, patch)
      refresh()
      return updated
    },
    deleteInitiative: (id) => {
      initiativeService.deleteInitiative(id)
      refresh()
    },
    linkAgent: (initiativeId, agentId) => {
      const updated = initiativeService.linkAgentToInitiative(initiativeId, agentId)
      refresh()
      return updated
    },
    metrics: initiativeService.computeInitiativeMetrics(),
  }
}
