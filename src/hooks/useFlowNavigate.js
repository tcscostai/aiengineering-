import { useNavigate, useLocation } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { goToFlowStep, continueFlowNavigation } from '../services/enterpriseFlowService'

export function useFlowNavigate() {
  const navigate = useNavigate()
  const location = useLocation()
  const { enterpriseFlow } = useApp()

  const goToStep = (stepId) => {
    const nav = goToFlowStep(stepId, enterpriseFlow.workspace)
    enterpriseFlow.refresh()
    navigate(nav.route, { state: nav.state })
  }

  const continueFlow = () => {
    const nav = continueFlowNavigation(enterpriseFlow, location.pathname)
    enterpriseFlow.refresh()
    navigate(nav.route, { state: nav.state })
  }

  return { goToStep, continueFlow }
}
