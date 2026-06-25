import { useState, useEffect, useCallback } from 'react'
import * as workflowService from '../services/workflowService'

export function useAgentWorkflows() {
  const [workflows, setWorkflows] = useState(() => workflowService.getAllWorkflows())
  const [runs, setRuns] = useState(() => workflowService.getWorkflowRuns())
  const [activeRun, setActiveRun] = useState(null)

  const refresh = useCallback(() => {
    setWorkflows(workflowService.getAllWorkflows())
    setRuns(workflowService.getWorkflowRuns())
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
    workflows,
    runs,
    activeRun,
    refresh,
    saveWorkflow: (wf) => {
      const saved = workflowService.saveWorkflow(wf)
      refresh()
      return saved
    },
    deleteWorkflow: (id) => {
      workflowService.deleteWorkflow(id)
      refresh()
    },
    exportJSON: workflowService.downloadWorkflowJSON,
    importJSON: workflowService.parseImportedWorkflow,
    validate: workflowService.validateWorkflow,
    executeWorkflow: async (wf, task, onUpdate) => {
      const result = await workflowService.executeWorkflow(wf, task, (run) => {
        setActiveRun({ ...run })
      })
      refresh()
      setActiveRun(result)
      return result
    },
  }
}
