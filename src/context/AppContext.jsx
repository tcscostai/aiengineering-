import { createContext, useContext, useState, useCallback, useMemo } from 'react'
import { useAgents } from '../hooks/useAgents'
import { useInitiatives } from '../hooks/useInitiatives'
import { useSkills } from '../hooks/useSkills'

const AppContext = createContext(null)

export function AppProvider({ children }) {
  const [navExpanded, setNavExpanded] = useState(true)
  const [dockOpen, setDockOpen] = useState(false)
  const [focusMode, setFocusMode] = useState(false)
  const [notifications, setNotifications] = useState([])

  const agentHook = useAgents()
  const initiativeHook = useInitiatives()
  const skillHook = useSkills()

  const addNotification = useCallback((message, type = 'info') => {
    const id = Date.now()
    setNotifications((prev) => [...prev.slice(-4), { id, message, type }])
    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id))
    }, 4000)
  }, [])

  const metrics = useMemo(() => {
    const am = agentHook.metrics
    const im = initiativeHook.metrics
    return {
      activeInitiatives: im.activeInitiatives,
      runningAgents: am.runningAgents,
      reusableSkills: skillHook.metrics.certified || am.reusableSkills,
      reusableWorkflows: am.publishedAgents,
      certifiedAgents: am.certifiedAgents,
      knowledgeAssets: am.totalAgents * 47 + am.reusableSkills * 12,
      automationOpportunity: am.totalAgents ? Math.min(95, am.reuseRatio + 20) : 0,
    }
  }, [agentHook.metrics, initiativeHook.metrics])

  const health = useMemo(() => {
    const am = agentHook.metrics
    return {
      score: am.totalAgents ? Math.min(99, 70 + Math.round(am.evaluationScore / 5)) : 0,
      reuseRatio: am.reuseRatio,
      evaluationScore: am.evaluationScore || 0,
      governanceCoverage: am.certifiedAgents && am.totalAgents
        ? Math.round((am.certifiedAgents / am.totalAgents) * 100)
        : 0,
      runtimeStatus: am.publishedAgents > 0 ? 'Operational' : 'Idle',
      governanceStatus: am.certifiedAgents > 0 ? 'Compliant' : 'Pending',
    }
  }, [agentHook.metrics])

  const currentInitiative = useMemo(() => {
    const active = initiativeHook.initiatives.find((i) => i.status === 'active')
    if (active) return active
    return initiativeHook.initiatives[0] ?? {
      id: 'none',
      title: 'No active initiative',
      progress: 0,
    }
  }, [initiativeHook.initiatives])

  const value = {
    navExpanded,
    setNavExpanded,
    dockOpen,
    setDockOpen,
    focusMode,
    setFocusMode,
    currentInitiative,
    initiatives: initiativeHook.initiatives,
    metrics,
    health,
    notifications,
    addNotification,
    agents: agentHook.agents,
    agentMetrics: agentHook.metrics,
    saveAgent: agentHook.saveAgent,
    deleteAgent: agentHook.deleteAgent,
    advanceStage: agentHook.advanceStage,
    deployAgent: agentHook.deployAgent,
    publishedAgents: agentHook.published,
    createInitiative: initiativeHook.createInitiative,
    updateInitiative: initiativeHook.updateInitiative,
    deleteInitiative: initiativeHook.deleteInitiative,
    linkAgentToInitiative: initiativeHook.linkAgent,
    skillLibrary: skillHook.skills,
    skillMetrics: skillHook.metrics,
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}
