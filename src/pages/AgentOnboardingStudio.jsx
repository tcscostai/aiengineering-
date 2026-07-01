import { useState, useMemo, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { PageHeader } from '../components/ui/PageHeader'
import { GlassPanel } from '../components/ui/GlassPanel'
import { AgentList } from '../components/onboarding/AgentList'
import { AgentOnboardingForm } from '../components/onboarding/AgentOnboardingForm'
import { ReusableSkillsLibrary } from '../components/onboarding/ReusableSkillsLibrary'
import { useApp } from '../context/AppContext'
import { useAgents } from '../hooks/useAgents'
import { useSkills } from '../hooks/useSkills'
import { createEmptyAgent } from '../services/agentService'
import { CATEGORIES, getStageLabel } from '../lib/constants'
import { PLATFORM_TOOLS } from '../data/platformTools'
import onboardingData from '../data/onboarding.json'

export default function AgentOnboardingStudio() {
  const location = useLocation()
  const { addNotification, initiatives, currentInitiative, linkAgentToInitiative, refreshWorkspaceProgress } = useApp()
  const { agents, saveAgent, deleteAgent, advanceStage, applyConnectionVerification, getByCategory } = useAgents()
  const { skills } = useSkills()
  const [activeCategory, setActiveCategory] = useState(location.state?.category ?? 'ad')
  const [selectedId, setSelectedId] = useState(null)

  const workspaceContext = useMemo(() => {
    const fromState = location.state?.workspaceId
      ? initiatives.find((w) => w.id === location.state.workspaceId)
      : null
    const byProject = location.state?.project
      ? initiatives.find((w) => w.title === location.state.project)
      : null
    return fromState ?? byProject ?? currentInitiative
  }, [location.state, initiatives, currentInitiative])

  useEffect(() => {
    if (location.state?.category) {
      setActiveCategory(location.state.category)
    }
    const platform = location.state?.platformTool
    const cat = location.state?.category ?? activeCategory
    if (platform && workspaceContext?.title) {
      const match = agents.find(
        (a) =>
          a.category === cat &&
          a.platformTool === platform &&
          (a.project?.trim() === workspaceContext.title.trim() ||
            workspaceContext.linkedAgentIds?.includes(a.id))
      )
      if (match) setSelectedId(match.id)
    }
  }, [location.key, location.state, workspaceContext, agents, activeCategory])

  const catalog = onboardingData.tracks.find((t) => t.id === activeCategory)
  const categoryAgents = getByCategory(activeCategory)
  const selectedAgent = useMemo(
    () => agents.find((a) => a.id === selectedId) ?? null,
    [agents, selectedId]
  )

  const workspaceIncludesCategory = workspaceContext?.domains?.includes(activeCategory)

  const handleRegister = () => {
    const domainPlan = workspaceContext?.domainPlans?.[activeCategory]
    const platformTool =
      location.state?.platformTool ??
      (domainPlan?.platformTool && domainPlan.platformTool !== 'external'
        ? domainPlan.platformTool
        : undefined)
    const agent = createEmptyAgent(activeCategory, catalog, {
      project: location.state?.project ?? workspaceContext?.title ?? '',
      workspaceId: workspaceContext?.id ?? '',
      platformTool,
    })
    saveAgent(agent)
    setSelectedId(agent.id)
    addNotification(`Register ${CATEGORIES[activeCategory].short} agent for ${agent.project || 'workspace'}`, 'info')
  }

  const handleSaveAgent = (agent) => {
    const saved = saveAgent(agent)
    if (workspaceContext?.id && workspaceContext.id !== 'none') {
      linkAgentToInitiative(workspaceContext.id, saved.id)
      refreshWorkspaceProgress(workspaceContext.id, agents)
    }
    return saved
  }

  const handleAdvance = () => {
    if (!selectedAgent) return { ok: false, errors: ['No agent selected'] }
    const result = advanceStage(selectedAgent.id, catalog)
    if (result.ok) {
      addNotification(`Advanced to ${getStageLabel(result.agent.stage)}`, 'success')
      if (result.agent.stage === 'published') {
        addNotification('Skills certified and added to enterprise library for reuse', 'success')
      }
      if (workspaceContext?.id) {
        refreshWorkspaceProgress(workspaceContext.id, agents)
      }
    }
    return result
  }

  return (
    <div>
      <PageHeader
        eyebrow="Enterprise Onboarding"
        title="Agent Onboarding Studio"
        description="Register agents on SEL, Ignio, ARE, or external runtimes — scoped to workspaces and engineering domains."
      />

      {workspaceContext && workspaceContext.id !== 'none' && (
        <GlassPanel className="p-4 mb-6 border-cx-accent/30 bg-cx-accent/5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-2xs uppercase text-cx-accent tracking-widest">Active workspace</p>
              <p className="text-sm font-medium text-cx-fg mt-1">{workspaceContext.title}</p>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {(workspaceContext.domains ?? []).map((domainId) => {
                  const plan = workspaceContext.domainPlans?.[domainId]
                  const platform = plan?.platformTool ? PLATFORM_TOOLS[plan.platformTool] : null
                  return (
                    <span
                      key={domainId}
                      className="text-[10px] uppercase px-1.5 py-0.5 rounded font-mono"
                      style={{
                        backgroundColor: `${CATEGORIES[domainId]?.color ?? '#5ec8f2'}20`,
                        color: CATEGORIES[domainId]?.color,
                      }}
                    >
                      {CATEGORIES[domainId]?.short}
                      {platform ? ` · ${platform.name}` : ''}
                    </span>
                  )
                })}
              </div>
            </div>
            <Link to="/workspace" className="text-xs text-cx-accent hover:underline">
              Manage workspaces →
            </Link>
          </div>
          {!workspaceIncludesCategory && (
            <p className="text-xs text-cx-warn mt-3">
              This workspace does not include {CATEGORIES[activeCategory].short}. Switch domain tab or extend the workspace.
            </p>
          )}
        </GlassPanel>
      )}

      <ReusableSkillsLibrary skills={skills} category={activeCategory} />

      <div className="flex flex-wrap gap-2 mb-6">
        {Object.values(CATEGORIES).map((cat) => {
          const count = getByCategory(cat.id).length
          const inWorkspace = workspaceContext?.domains?.includes(cat.id)
          return (
            <button
              key={cat.id}
              onClick={() => {
                setActiveCategory(cat.id)
                setSelectedId(null)
              }}
              className={`px-4 py-2 rounded-xl border text-sm transition-all ${
                activeCategory === cat.id
                  ? 'border-cx-accent/40 bg-cx-accent/10 text-cx-accent'
                  : 'border-cx-border text-cx-fg-dim hover:text-cx-fg-muted'
              }`}
            >
              {cat.label}
              {inWorkspace && <span className="ml-1 text-cx-success">●</span>}
              <span className="ml-2 font-mono text-xs opacity-70">({count})</span>
            </button>
          )
        })}
      </div>

      <div className="grid lg:grid-cols-[320px_1fr] gap-6">
        <GlassPanel className="p-4 h-fit lg:sticky lg:top-6">
          <p className="text-2xs uppercase text-cx-fg-dim tracking-widest mb-3">
            {CATEGORIES[activeCategory].short} Agents
          </p>
          <AgentList
            agents={categoryAgents}
            selectedId={selectedId}
            onSelect={setSelectedId}
            onDelete={(id) => {
              deleteAgent(id)
              if (selectedId === id) setSelectedId(null)
              addNotification('Registration removed', 'info')
            }}
            onCreate={handleRegister}
          />
        </GlassPanel>

        <div>
          {selectedAgent && catalog ? (
            <AgentOnboardingForm
              agent={selectedAgent}
              catalog={catalog}
              librarySkills={skills}
              onSave={handleSaveAgent}
              onAdvance={handleAdvance}
              onConnectionVerified={applyConnectionVerification}
              workspaceProjects={initiatives.map((w) => w.title)}
            />
          ) : (
            <GlassPanel hero className="p-12 text-center">
              <p className="text-2xs uppercase text-cx-accent tracking-widest mb-2">Register Agent</p>
              <h2 className="font-display text-xl font-semibold text-cx-fg mb-3">
                Onboard {CATEGORIES[activeCategory].short} Agent
              </h2>
              <p className="text-sm text-cx-fg-dim max-w-lg mx-auto mb-6 leading-relaxed">
                Connect agents to your workspace on SEL, Ignio, or ARE — attach skills, evaluate, govern, and publish.
              </p>
              <button
                onClick={handleRegister}
                className="px-6 py-3 rounded-xl border border-cx-accent/40 bg-cx-accent/10 text-cx-accent text-sm hover:bg-cx-accent/20"
              >
                + Register Agent
              </button>
            </GlassPanel>
          )}
        </div>
      </div>
    </div>
  )
}
