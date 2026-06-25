import { useState, useMemo, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Award, Rocket, Star } from 'lucide-react'
import { PageHeader } from '../components/ui/PageHeader'
import { GlassPanel } from '../components/ui/GlassPanel'
import { AgentDeployTerminal } from '../components/marketplace/AgentDeployTerminal'
import { useApp } from '../context/AppContext'
import { categoryToMarketplaceLabel, getRuntimeShort, RUNTIME_TYPES } from '../lib/constants'

const categoryColors = { AD: '#5ec8f2', AMS: '#9b8bd4', QE: '#3ecf9b' }

export default function AgentMarketplace() {
  const [filter, setFilter] = useState('All')
  const [category, setCategory] = useState('All')
  const [deployingAgent, setDeployingAgent] = useState(null)
  const [terminalOpen, setTerminalOpen] = useState(false)
  const { publishedAgents, deployAgent, addNotification, agents } = useApp()

  const catalog = useMemo(
    () =>
      publishedAgents.map((a) => {
        const evalScores = Object.values(a.evaluation).filter((v) => typeof v === 'number')
        const avgEval = evalScores.length
          ? Math.round(evalScores.reduce((x, y) => x + y, 0) / evalScores.length)
          : 0
        const cat = categoryToMarketplaceLabel(a.category)
        const daysSince = (Date.now() - new Date(a.createdAt).getTime()) / 86400000
        return {
          id: a.id,
          name: a.name,
          category: cat,
          purpose: a.purpose,
          version: a.version,
          certified: ['certified', 'published'].includes(a.stage),
          popular: a.reuseCount >= 3,
          new: daysSince < 14,
          skills: a.skills,
          knowledge: a.knowledgeSources,
          tools: a.tools,
          evaluation: avgEval,
          governance: a.governanceApproved ? 'Approved' : 'Pending',
          reuseCount: a.reuseCount,
          project: a.project,
          team: a.team,
          runtimeType: a.runtimeType,
        }
      }),
    [publishedAgents]
  )

  const filtered = catalog.filter((a) => {
    if (category !== 'All' && a.category !== category) return false
    if (filter === 'Certified' && !a.certified) return false
    if (filter === 'New' && !a.new) return false
    if (filter === 'Popular' && !a.popular) return false
    if (filter === 'Reusable' && a.reuseCount < 1) return false
    return true
  })

  const handleDeploy = (catalogAgent) => {
    const full = agents.find((a) => a.id === catalogAgent.id) ?? publishedAgents.find((a) => a.id === catalogAgent.id)
    if (!full) return
    setDeployingAgent(full)
    setTerminalOpen(true)
  }

  const handleDeployComplete = useCallback(
    (agent) => {
      const updated = deployAgent(agent.id)
      const reuse = updated?.reuseCount ?? agent.reuseCount + 1
      addNotification(`${agent.name} deployed to runtime (reuse #${reuse})`, 'success')
    },
    [deployAgent, addNotification]
  )

  const handleTerminalClose = () => {
    setTerminalOpen(false)
    setDeployingAgent(null)
  }

  return (
    <div>
      <PageHeader
        eyebrow="Agent Catalog"
        title="Agent Marketplace"
        description="Published agents from onboarding — certified, evaluated, and ready for reuse across initiatives."
      />

      <div className="flex flex-wrap gap-2 mb-4">
        {['All', 'AD', 'AMS', 'QE'].map((c) => (
          <button
            key={c}
            onClick={() => setCategory(c)}
            className={`px-3 py-1.5 rounded-lg border text-xs transition-colors ${
              category === c ? 'border-cx-accent/40 bg-cx-accent/10 text-cx-accent' : 'border-cx-border text-cx-fg-dim'
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        {['All', 'Certified', 'New', 'Popular', 'Reusable'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-md border text-2xs uppercase tracking-wider transition-colors ${
              filter === f ? 'border-cx-border-strong bg-cx-panel text-cx-fg' : 'border-cx-border text-cx-fg-dim'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {agents.filter((a) => a.stage !== 'published').length > 0 && (
        <p className="text-xs text-cx-fg-dim mb-4">
          {agents.filter((a) => a.stage !== 'published').length} agent(s) still in onboarding — publish via Agent Onboarding Studio.
        </p>
      )}

      {filtered.length === 0 ? (
        <GlassPanel className="p-12 text-center">
          <p className="text-sm text-cx-fg-dim">
            No published agents yet. Complete onboarding and publish agents to appear here.
          </p>
        </GlassPanel>
      ) : (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((agent, i) => (
            <motion.div
              key={agent.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <GlassPanel className="p-5 h-full flex flex-col">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <span
                      className="text-2xs uppercase px-2 py-0.5 rounded-md mb-2 inline-block"
                      style={{ backgroundColor: `${categoryColors[agent.category]}20`, color: categoryColors[agent.category] }}
                    >
                      {agent.category}
                    </span>
                    <h3 className="font-display text-base font-semibold text-cx-fg">{agent.name}</h3>
                    <p className="text-xs text-cx-fg-dim font-mono">
                      v{agent.version} · {agent.project}
                      {agent.runtimeType && (
                        <span
                          className="ml-2 uppercase px-1 py-0.5 rounded text-[10px]"
                          style={{
                            backgroundColor: `${RUNTIME_TYPES[agent.runtimeType]?.color ?? '#5ec8f2'}20`,
                            color: RUNTIME_TYPES[agent.runtimeType]?.color ?? '#5ec8f2',
                          }}
                        >
                          {getRuntimeShort(agent.runtimeType)}
                        </span>
                      )}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    {agent.certified && <Award className="w-4 h-4 text-cx-success" />}
                    {agent.popular && <Star className="w-4 h-4 text-cx-warn" />}
                  </div>
                </div>

                <p className="text-xs text-cx-fg-dim mb-4 flex-1 leading-relaxed">{agent.purpose}</p>

                <div className="flex flex-wrap gap-1 mb-3">
                  {agent.skills.slice(0, 3).map((s) => (
                    <span key={s} className="px-2 py-0.5 rounded text-[10px] border border-cx-border text-cx-fg-dim">{s}</span>
                  ))}
                </div>

                <div className="grid grid-cols-3 gap-2 mb-4 text-center">
                  <div>
                    <p className="text-[10px] text-cx-fg-dim">Eval</p>
                    <p className="font-mono text-sm text-cx-accent">{agent.evaluation}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-cx-fg-dim">Reuse</p>
                    <p className="font-mono text-sm text-cx-success">{agent.reuseCount}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-cx-fg-dim">Gov</p>
                    <p className="text-xs text-cx-fg-muted">{agent.governance}</p>
                  </div>
                </div>

                <button
                  onClick={() => handleDeploy(agent)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-xl border border-cx-accent/40 bg-cx-accent/10 text-cx-accent text-sm hover:bg-cx-accent/20"
                >
                  <Rocket className="w-4 h-4" /> Deploy
                </button>
              </GlassPanel>
            </motion.div>
          ))}
        </div>
      )}

      <AgentDeployTerminal
        agent={deployingAgent}
        open={terminalOpen}
        onClose={handleTerminalClose}
        onComplete={handleDeployComplete}
      />
    </div>
  )
}
