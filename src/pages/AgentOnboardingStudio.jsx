import { useState, useMemo } from 'react'
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
import onboardingData from '../data/onboarding.json'

export default function AgentOnboardingStudio() {
  const { addNotification } = useApp()
  const { agents, saveAgent, deleteAgent, advanceStage, applyConnectionVerification, getByCategory } = useAgents()
  const { skills } = useSkills()
  const [activeCategory, setActiveCategory] = useState('ad')
  const [selectedId, setSelectedId] = useState(null)

  const catalog = onboardingData.tracks.find((t) => t.id === activeCategory)
  const categoryAgents = getByCategory(activeCategory)
  const selectedAgent = useMemo(
    () => agents.find((a) => a.id === selectedId) ?? null,
    [agents, selectedId]
  )

  const handleRegister = () => {
    const agent = createEmptyAgent(activeCategory, catalog)
    saveAgent(agent)
    setSelectedId(agent.id)
    addNotification(`Register external ${CATEGORIES[activeCategory].short} agent`, 'info')
  }

  const handleAdvance = () => {
    if (!selectedAgent) return { ok: false, errors: ['No agent selected'] }
    const result = advanceStage(selectedAgent.id, catalog)
    if (result.ok) {
      addNotification(`Advanced to ${getStageLabel(result.agent.stage)}`, 'success')
      if (result.agent.stage === 'published') {
        addNotification('Skills certified and added to enterprise library for reuse', 'success')
      }
    }
    return result
  }

  return (
    <div>
      <PageHeader
        eyebrow="Enterprise Onboarding"
        title="Agent Onboarding Studio"
        description="Register external agents built in Python, AWS Bedrock, Azure AI Foundry, or APIs. Onboard for AD, AMS, or QE engineering excellence — and reuse certified skills across teams."
      />

      <ReusableSkillsLibrary skills={skills} category={activeCategory} />

      <div className="flex flex-wrap gap-2 mb-6">
        {Object.values(CATEGORIES).map((cat) => {
          const count = getByCategory(cat.id).length
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
              <span className="ml-2 font-mono text-xs opacity-70">({count})</span>
            </button>
          )
        })}
      </div>

      <div className="grid lg:grid-cols-[320px_1fr] gap-6">
        <GlassPanel className="p-4 h-fit lg:sticky lg:top-6">
          <p className="text-2xs uppercase text-cx-fg-dim tracking-widest mb-3">
            External {CATEGORIES[activeCategory].short} Agents
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
              onSave={saveAgent}
              onAdvance={handleAdvance}
              onConnectionVerified={applyConnectionVerification}
            />
          ) : (
            <GlassPanel hero className="p-12 text-center">
              <p className="text-2xs uppercase text-cx-accent tracking-widest mb-2">Register External Agent</p>
              <h2 className="font-display text-xl font-semibold text-cx-fg mb-3">
                Onboard {CATEGORIES[activeCategory].short} Agent
              </h2>
              <p className="text-sm text-cx-fg-dim max-w-lg mx-auto mb-6 leading-relaxed">
                Your team already built an agent in Python, Bedrock, or Azure Foundry?
                Register it here — connect the runtime, attach reusable enterprise skills, evaluate, govern, and publish for cross-project reuse.
              </p>
              <button
                onClick={handleRegister}
                className="px-6 py-3 rounded-xl border border-cx-accent/40 bg-cx-accent/10 text-cx-accent text-sm hover:bg-cx-accent/20"
              >
                + Register External Agent
              </button>
            </GlassPanel>
          )}
        </div>
      </div>
    </div>
  )
}
