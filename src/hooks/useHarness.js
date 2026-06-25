import { useState, useEffect, useCallback } from 'react'
import * as harnessService from '../services/harnessService'

export function useHarness() {
  const [runs, setRuns] = useState(() => harnessService.getHarnessRuns())
  const [activeRun, setActiveRun] = useState(null)

  const refresh = useCallback(() => {
    setRuns(harnessService.getHarnessRuns())
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

  const executeRun = useCallback(async (agent, task) => {
    setActiveRun(null)
    const finalRun = await harnessService.executeHarnessRun(agent, task, (run) => {
      setActiveRun({ ...run })
    })
    refresh()
    setActiveRun(finalRun)
    return finalRun
  }, [refresh])

  return {
    runs,
    activeRun,
    refresh,
    executeRun,
    getRunsForAgent: (agentId) => harnessService.getRunsForAgent(agentId),
    computeMetrics: harnessService.computeHarnessMetrics,
    getStats: (agents) => harnessService.getHarnessStats(agents),
  }
}
