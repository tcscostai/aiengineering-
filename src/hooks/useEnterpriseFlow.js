import { useState, useEffect, useCallback } from 'react'
import {
  computeEnterpriseFlow,
  startEnterpriseFlow,
  startDemoEnterpriseFlow,
  markFlowStepComplete,
  goToFlowStep,
  continueFlowNavigation,
} from '../services/enterpriseFlowService'

export function useEnterpriseFlow(agents, initiatives) {
  const [flowView, setFlowView] = useState(() => computeEnterpriseFlow({ agents, initiatives }))

  const refresh = useCallback(() => {
    setFlowView(computeEnterpriseFlow({ agents, initiatives }))
  }, [agents, initiatives])

  useEffect(() => {
    refresh()
    const handler = () => refresh()
    window.addEventListener('horizon-storage', handler)
    return () => window.removeEventListener('horizon-storage', handler)
  }, [refresh])

  return {
    ...flowView,
    refresh,
    startFlow: (workspaceId) => {
      startEnterpriseFlow(workspaceId)
      refresh()
    },
    startDemoFlow: () => {
      startDemoEnterpriseFlow()
      refresh()
    },
    markStep: (stepId) => {
      markFlowStepComplete(stepId)
      refresh()
    },
    goToStep: (stepId) => {
      const nav = goToFlowStep(stepId, flowView.workspace)
      refresh()
      return nav
    },
    getContinueNavigation: () => continueFlowNavigation(flowView),
  }
}
