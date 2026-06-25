import { useState, useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Play, Loader2, Cpu, Recycle, Database, History } from 'lucide-react'
import { GlassPanel } from '../ui/GlassPanel'
import { ProgressBar } from '../ui/ProgressBar'
import { HarnessPipelineLive } from './HarnessPipelineLive'
import { HarnessAgentSelector } from './HarnessAgentSelector'
import { HarnessRunLog } from './HarnessRunLog'
import { useApp } from '../../context/AppContext'
import { useHarness } from '../../hooks/useHarness'
import { CATEGORIES } from '../../lib/constants'
import { agentEligibleForHarness } from '../../lib/harnessConstants'

const inputClass =
  'w-full px-3 py-2 rounded-xl border border-cx-border bg-cx-panel/50 text-sm text-cx-fg placeholder:text-cx-fg-dim focus:outline-none focus:border-cx-accent/40'

export function SingleAgentHarness({ category, onCategoryChange, stats, initialAgentId, initialTask }) {
  const { agents, addNotification } = useApp()
  const { runs, activeRun, executeRun, computeMetrics } = useHarness()
  const [selectedAgentId, setSelectedAgentId] = useState(initialAgentId)
  const [task, setTask] = useState(initialTask ?? '')
  const [executing, setExecuting] = useState(false)

  useEffect(() => {
    if (initialAgentId) setSelectedAgentId(initialAgentId)
  }, [initialAgentId])

  useEffect(() => {
    if (initialTask) setTask(initialTask)
  }, [initialTask])

  const selectedAgent = useMemo(
    () => agents.find((a) => a.id === selectedAgentId) ?? null,
    [agents, selectedAgentId]
  )

  const metrics = useMemo(
    () => (selectedAgent ? computeMetrics(selectedAgent) : { contextConfidence: 0, reuseReadiness: 0, knowledgeCoverage: 0 }),
    [selectedAgent, computeMetrics]
  )

  const runCounts = useMemo(() => {
    const counts = {}
    runs.forEach((r) => { counts[r.agentId] = (counts[r.agentId] ?? 0) + 1 })
    return counts
  }, [runs])

  const displayRun = activeRun?.agentId === selectedAgentId ? activeRun : null
  const lastRunForAgent = runs.find((r) => r.agentId === selectedAgentId)
  const pipelineSteps = displayRun?.steps ?? lastRunForAgent?.steps ?? Array.from({ length: 10 }, () => ({ status: 'pending' }))
  const pipelineIndex = displayRun?.currentStepIndex ?? -1
  const logs = displayRun?.logs ?? lastRunForAgent?.logs ?? []
  const contextStep = (displayRun ?? lastRunForAgent)?.steps?.find((s) => s.id === 'context')
  const collected = contextStep?.detail?.collected ?? []

  const handleExecute = async () => {
    if (!selectedAgent || executing) return
    setExecuting(true)
    addNotification(`Harness execution started for ${selectedAgent.name}`, 'info')
    try {
      const result = await executeRun(selectedAgent, task)
      if (result.status === 'completed') addNotification(`Harness completed for ${selectedAgent.name}`, 'success')
      else if (result.status === 'pending_approval') addNotification('Harness paused — human approval required', 'warn')
    } finally {
      setExecuting(false)
    }
  }

  return (
    <>
      <div className="grid md:grid-cols-4 gap-4 mb-6">
        <GlassPanel className="p-4">
          <Database className="w-4 h-4 text-cx-accent mb-2" />
          <p className="text-2xs uppercase text-cx-fg-dim">Context Confidence</p>
          <p className="font-display text-2xl font-semibold text-cx-accent">{metrics.contextConfidence}%</p>
          <ProgressBar value={metrics.contextConfidence} className="mt-2" />
        </GlassPanel>
        <GlassPanel className="p-4">
          <Recycle className="w-4 h-4 text-cx-success mb-2" />
          <p className="text-2xs uppercase text-cx-fg-dim">Reuse Readiness</p>
          <p className="font-display text-2xl font-semibold text-cx-success">{metrics.reuseReadiness}%</p>
          <ProgressBar value={metrics.reuseReadiness} className="mt-2" />
        </GlassPanel>
        <GlassPanel className="p-4">
          <Cpu className="w-4 h-4 text-cx-accent2 mb-2" />
          <p className="text-2xs uppercase text-cx-fg-dim">Knowledge Coverage</p>
          <p className="font-display text-2xl font-semibold text-cx-accent2">{metrics.knowledgeCoverage}%</p>
          <ProgressBar value={metrics.knowledgeCoverage} className="mt-2" />
        </GlassPanel>
        <GlassPanel className="p-4">
          <History className="w-4 h-4 text-cx-fg-dim mb-2" />
          <p className="text-2xs uppercase text-cx-fg-dim">Harness Runs</p>
          <p className="font-display text-2xl font-semibold text-cx-fg">{stats.totalRuns}</p>
          <p className="text-xs text-cx-fg-dim mt-1">{stats.eligibleAgents} agents ready</p>
        </GlassPanel>
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        {Object.values(CATEGORIES).map((cat) => (
          <button
            key={cat.id}
            onClick={() => { onCategoryChange(cat.id); setSelectedAgentId(null) }}
            className={`px-4 py-2 rounded-xl border text-sm transition-all ${
              category === cat.id ? 'border-cx-accent/40 bg-cx-accent/10 text-cx-accent' : 'border-cx-border text-cx-fg-dim'
            }`}
          >
            {cat.label}
            <span className="ml-2 font-mono text-xs opacity-70">({stats.byCategory[cat.id] ?? 0})</span>
          </button>
        ))}
      </div>

      <div className="grid lg:grid-cols-[280px_1fr] gap-6 mb-6">
        <GlassPanel className="p-4 h-fit lg:sticky lg:top-6">
          <p className="text-2xs uppercase text-cx-fg-dim tracking-widest mb-3">Harness-Ready Agents</p>
          <HarnessAgentSelector agents={agents} category={category} selectedId={selectedAgentId} onSelect={setSelectedAgentId} runCounts={runCounts} />
        </GlassPanel>

        <div className="space-y-6">
          {selectedAgent ? (
            <>
              <GlassPanel hero className="p-6">
                <div className="flex flex-col md:flex-row md:items-end gap-4 mb-4">
                  <div className="flex-1">
                    <p className="text-2xs uppercase text-cx-accent mb-1">Execute Harness</p>
                    <h2 className="font-display text-lg font-semibold text-cx-fg">{selectedAgent.name}</h2>
                    <p className="text-xs text-cx-fg-dim mt-1">{selectedAgent.purpose}</p>
                  </div>
                  <button
                    onClick={handleExecute}
                    disabled={executing || !agentEligibleForHarness(selectedAgent)}
                    className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border border-cx-accent/40 bg-cx-accent/10 text-cx-accent text-sm hover:bg-cx-accent/20 disabled:opacity-50 shrink-0"
                  >
                    {executing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                    {executing ? 'Orchestrating…' : 'Run Harness Pipeline'}
                  </button>
                </div>
                <label className="block text-2xs uppercase text-cx-fg-dim tracking-widest mb-1.5">Task / Invocation Context</label>
                <input className={inputClass} value={task} onChange={(e) => setTask(e.target.value)} placeholder={`e.g. Process ${selectedAgent.project} request…`} />
              </GlassPanel>
              <GlassPanel className="p-6">
                <p className="text-2xs uppercase text-cx-accent tracking-widest mb-4">Orchestration Pipeline</p>
                <HarnessPipelineLive steps={pipelineSteps} currentStepIndex={pipelineIndex} />
              </GlassPanel>
              {collected.length > 0 && (
                <GlassPanel className="p-6">
                  <p className="text-2xs uppercase text-cx-fg-dim mb-4">Context Collection</p>
                  <div className="grid md:grid-cols-2 gap-2">
                    {collected.map((item, i) => (
                      <motion.div key={item.source} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }}
                        className="flex items-center justify-between px-3 py-2 rounded-lg border border-cx-border bg-cx-raised/30">
                        <span className="text-xs text-cx-fg">{item.source}</span>
                        <span className="text-[10px] font-mono text-cx-fg-dim">{item.records} rec</span>
                      </motion.div>
                    ))}
                  </div>
                </GlassPanel>
              )}
              <GlassPanel className="p-6">
                <HarnessRunLog logs={logs} />
              </GlassPanel>
            </>
          ) : (
            <GlassPanel hero className="p-12 text-center">
              <Cpu className="w-10 h-10 text-cx-accent mx-auto mb-4 opacity-60" />
              <h2 className="font-display text-lg font-semibold text-cx-fg mb-2">Select an Onboarded Agent</h2>
              <p className="text-sm text-cx-fg-dim max-w-md mx-auto">Run the 10-step harness pipeline for a single external agent.</p>
            </GlassPanel>
          )}
        </div>
      </div>
    </>
  )
}
