import { motion } from 'framer-motion'
import { Activity, Cpu, HardDrive, Zap } from 'lucide-react'
import { PageHeader } from '../components/ui/PageHeader'
import { GlassPanel } from '../components/ui/GlassPanel'
import { ProgressBar } from '../components/ui/ProgressBar'
import { useApp } from '../context/AppContext'
import { getStageProgress } from '../services/agentService'
import { getStageLabel } from '../lib/constants'

export default function AgentRuntime() {
  const { agents, agentMetrics } = useApp()

  const activeAgents = agents.filter((a) => a.stage !== 'draft')
  const runningAgents = agents.filter((a) => !['published', 'draft'].includes(a.stage))

  const systemHealth = {
    cpu: Math.min(90, 20 + agentMetrics.totalAgents * 3),
    memory: Math.min(85, 30 + agentMetrics.publishedAgents * 5),
    throughput: agentMetrics.publishedAgents * 120 + runningAgents.length * 40,
    errorRate: agentMetrics.totalAgents ? 0.02 : 0,
  }

  return (
    <div>
      <PageHeader
        eyebrow="Agent Runtime"
        title="Agent Runtime"
        description="Real-time view of onboarded agents — execution status, progress, and activity."
      />

      {agents.length === 0 && (
        <GlassPanel className="p-8 mb-6 text-center text-sm text-cx-fg-dim">
          No agents in runtime. Onboard and publish agents via Agent Onboarding Studio.
        </GlassPanel>
      )}

      <div className="grid md:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'CPU', value: `${systemHealth.cpu}%`, icon: Cpu },
          { label: 'Memory', value: `${systemHealth.memory}%`, icon: HardDrive },
          { label: 'Throughput', value: `${systemHealth.throughput}/min`, icon: Zap },
          { label: 'Error Rate', value: `${systemHealth.errorRate}%`, icon: Activity },
        ].map((m) => (
          <GlassPanel key={m.label} className="p-4">
            <m.icon className="w-4 h-4 text-cx-accent mb-2" />
            <p className="text-2xs uppercase text-cx-fg-dim">{m.label}</p>
            <p className="font-display text-xl font-semibold text-cx-fg">{m.value}</p>
          </GlassPanel>
        ))}
      </div>

      <GlassPanel hero className="p-6">
        <p className="text-2xs uppercase text-cx-accent tracking-widest mb-4">Onboarded Agents</p>
        <div className="space-y-3">
          {activeAgents.map((agent, i) => (
            <motion.div
              key={agent.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="p-4 rounded-xl border border-cx-border bg-cx-raised/30"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${
                    agent.stage === 'published' ? 'bg-cx-success' : 'bg-cx-accent animate-pulse'
                  }`} />
                  <span className="text-sm text-cx-fg">{agent.name}</span>
                  <span className="text-xs text-cx-fg-dim">· {agent.project}</span>
                </div>
                <span className="text-2xs uppercase text-cx-fg-dim">{getStageLabel(agent.stage)}</span>
              </div>
              <ProgressBar value={getStageProgress(agent)} label="Onboarding / Runtime readiness" />
              <div className="flex gap-4 mt-2 text-xs text-cx-fg-dim">
                <span>{agent.skills.length} skills</span>
                <span>{agent.tools.length} tools</span>
                <span>Reuse: {agent.reuseCount}</span>
              </div>
            </motion.div>
          ))}
        </div>
      </GlassPanel>
    </div>
  )
}
