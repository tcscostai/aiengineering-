import { useState, useEffect, useCallback } from 'react'
import * as agentService from '../services/agentService'

export function useAgents() {
  const [agents, setAgents] = useState(() => agentService.getAllAgents())

  const refresh = useCallback(() => {
    setAgents(agentService.getAllAgents())
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
    agents,
    refresh,
    saveAgent: (agent) => {
      const saved = agentService.saveAgent(agent)
      refresh()
      return saved
    },
    deleteAgent: (id) => {
      agentService.deleteAgent(id)
      refresh()
    },
    advanceStage: (id, catalog) => {
      const result = agentService.advanceAgentStage(id, catalog)
      if (result.ok) refresh()
      return result
    },
    applyConnectionVerification: (agent, result) => {
      const updated = agentService.applyConnectionVerification(agent, result)
      refresh()
      return updated
    },
    deployAgent: (id) => {
      const result = agentService.deployAgent(id)
      if (result) refresh()
      return result
    },
    getByCategory: (category) => agents.filter((a) => a.category === category),
    published: agents.filter((a) => a.stage === 'published'),
    metrics: agentService.computeAgentMetrics(),
  }
}
