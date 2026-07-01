import { useState, useMemo, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Layers, AlertTriangle, Clock, Target, Users } from 'lucide-react'
import { PageHeader } from '../ui/PageHeader'
import { GlassPanel } from '../ui/GlassPanel'
import { ProgressBar } from '../ui/ProgressBar'
import { CategoryAgentsPanel } from '../agents/CategoryAgentsPanel'
import { DomainPlatformPlanes } from './DomainPlatformPlanes'
import { DomainQuickActions } from './DomainQuickActions'
import { DomainMetricsBar, DomainAgentRunner, DomainActivityFeed } from './DomainWorkspace'
import { useApp } from '../../context/AppContext'
import { useHarness } from '../../hooks/useHarness'
import {
  getDomainConfig,
  computeDomainMetrics,
  computeADArtifacts,
  computeQESuites,
  getDomainActivities,
  logDomainActivity,
  getDefaultTaskForAgent,
  buildAMSTimeline,
} from '../../services/domainService'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'

const PIE_COLORS = ['#5ec8f2', '#9b8bd4', '#3ecf9b', '#e8b84a']

function ADDomainPanel({ agents, artifacts }) {
  return (
    <div className="grid lg:grid-cols-2 gap-6 mb-6">
      <GlassPanel className="p-6">
        <p className="text-2xs uppercase text-cx-accent tracking-widest mb-4">SDLC artifact pipeline</p>
        <p className="text-xs text-cx-fg-dim mb-4">Status driven by onboarded AD agents and evaluation scores</p>
        <div className="space-y-3">
          {artifacts.map((a, i) => (
            <motion.div
              key={a.key}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.04 }}
              className="p-3 rounded-xl border border-cx-border bg-cx-raised/30"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-cx-fg">{a.label}</span>
                <span className={`text-[9px] uppercase px-2 py-0.5 rounded-md ${
                  a.status === 'generated' ? 'bg-cx-success/10 text-cx-success' :
                  a.status === 'in-progress' ? 'bg-cx-accent/10 text-cx-accent' :
                  'bg-cx-raised text-cx-fg-dim'
                }`}>{a.status}</span>
              </div>
              {a.agentName && (
                <p className="text-[10px] text-cx-fg-dim mb-2">Agent: {a.agentName}</p>
              )}
              {a.quality > 0 && <ProgressBar value={a.quality} />}
            </motion.div>
          ))}
        </div>
      </GlassPanel>

      <GlassPanel hero className="p-6">
        <p className="text-2xs uppercase text-cx-accent2 tracking-widest mb-4">Platform integrations</p>
        <div className="space-y-3 text-sm">
          {[
            { label: 'Knowledge Fabric', path: '/knowledge', desc: 'Architecture repo + design decisions graph' },
            { label: 'Workflow Composer', path: '/harness', desc: 'Chain arch review → API design → code review' },
            { label: 'FinOps', path: '/finops', desc: 'Token cost per AD agent + prompt rules' },
          ].map((item) => (
            <Link
              key={item.label}
              to={item.path}
              state={{ category: 'ad' }}
              className="block p-3 rounded-xl border border-cx-border hover:border-cx-accent/40 bg-cx-raised/20 transition-colors"
            >
              <p className="text-cx-fg font-medium">{item.label}</p>
              <p className="text-xs text-cx-fg-dim mt-0.5">{item.desc}</p>
            </Link>
          ))}
        </div>
      </GlassPanel>
    </div>
  )
}

function AMSDomainPanel({ agents, incidentStep, onAdvanceIncident, incidentRunning }) {
  const config = getDomainConfig('ams')
  const timeline = useMemo(() => buildAMSTimeline(agents, incidentStep), [agents, incidentStep])

  return (
    <>
      <GlassPanel hero className="p-6 mb-6">
        <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-5 h-5 text-cx-danger" />
              <span className="text-2xs uppercase text-cx-danger tracking-widest">Active incident war room</span>
            </div>
            <h2 className="font-display text-xl font-semibold text-cx-fg">{config.incident.title}</h2>
            <p className="text-sm text-cx-fg-dim mt-1">{config.incident.service} · {config.incident.id}</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-lg border border-cx-danger/40 bg-cx-danger/10 text-cx-danger text-sm font-mono">
              {config.incident.severity}
            </span>
            <button
              type="button"
              onClick={onAdvanceIncident}
              disabled={incidentRunning || incidentStep >= 6}
              className="px-4 py-2 rounded-xl border border-cx-accent/40 bg-cx-accent/10 text-xs text-cx-accent hover:bg-cx-accent/20 disabled:opacity-50"
            >
              {incidentStep >= 6 ? 'Response complete' : incidentRunning ? 'Agents working…' : 'Advance response'}
            </button>
          </div>
        </div>

        <div className="grid md:grid-cols-4 gap-4">
          {[
            { label: 'MTTR', value: incidentStep >= 6 ? '18 min' : `${incidentStep * 3} min`, icon: Clock },
            { label: 'Confidence', value: `${Math.min(94, 60 + incidentStep * 6)}%`, icon: Target },
            { label: 'Impact', value: 'High', icon: AlertTriangle },
            { label: 'Affected Users', value: '1,247', icon: Users },
          ].map((m) => (
            <div key={m.label} className="p-3 rounded-xl border border-cx-border bg-cx-raised/30">
              <div className="flex items-center gap-2 mb-1">
                <m.icon className="w-3.5 h-3.5 text-cx-accent" />
                <span className="text-[9px] uppercase text-cx-fg-dim">{m.label}</span>
              </div>
              <p className="font-display text-lg font-semibold text-cx-fg">{m.value}</p>
            </div>
          ))}
        </div>
      </GlassPanel>

      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        <GlassPanel className="p-6">
          <p className="text-2xs uppercase text-cx-accent tracking-widest mb-4">Agent collaboration timeline</p>
          <div className="space-y-4">
            {timeline.map((t, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex gap-4"
              >
                <span className="font-mono text-xs text-cx-accent shrink-0 w-12">{t.time}</span>
                <div className="flex-1 pb-4 border-l border-cx-border pl-4 relative">
                  <span className={`absolute -left-1.5 top-1 w-2.5 h-2.5 rounded-full border-2 border-cx-panel ${
                    i < incidentStep ? 'bg-cx-success' : 'bg-cx-fg-dim'
                  }`} />
                  <p className="text-sm text-cx-fg">{t.event}</p>
                  <p className="text-xs text-cx-fg-dim mt-0.5">{t.agent}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </GlassPanel>

        <div className="space-y-4">
          <GlassPanel className="p-6">
            <p className="text-2xs uppercase text-cx-fg-dim mb-3">Root cause (step 5+)</p>
            <p className="text-sm text-cx-fg leading-relaxed">
              {incidentStep >= 5
                ? 'Connection pool exhaustion in payment-gateway-service due to unreleased connections after deployment v2.4.1'
                : 'Run RCA Agent via harness or advance incident response to correlate logs…'}
            </p>
          </GlassPanel>
          <GlassPanel className="p-6">
            <p className="text-2xs uppercase text-cx-success mb-3">Remediation (step 6)</p>
            <p className="text-sm text-cx-fg-muted leading-relaxed">
              {incidentStep >= 6
                ? 'Rollback v2.4.1 and apply hotfix PR-8847 for connection lifecycle management'
                : 'Runbook Assistant will generate change recommendation when timeline completes'}
            </p>
            <Link
              to="/knowledge"
              state={{ category: 'ams' }}
              className="inline-block mt-3 text-xs text-cx-accent hover:underline"
            >
              View ServiceNow incident in Knowledge Fabric →
            </Link>
          </GlassPanel>
        </div>
      </div>
    </>
  )
}

function QEDomainPanel({ suites, agents }) {
  const coverageData = suites
    .filter((s) => s.agentId)
    .map((s) => ({ name: s.label.split(' ')[0], value: Math.round(s.automated) }))

  const overall = coverageData.length
    ? Math.round(coverageData.reduce((s, d) => s + d.value, 0) / coverageData.length)
    : 0

  return (
    <div className="grid lg:grid-cols-3 gap-6 mb-6">
      <GlassPanel hero className="p-6 lg:col-span-2">
        <p className="text-2xs uppercase text-cx-accent tracking-widest mb-4">Test suites (agent-bound)</p>
        <div className="grid md:grid-cols-2 gap-3">
          {suites.map((suite, i) => (
            <motion.div
              key={suite.label}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className="p-4 rounded-xl border border-cx-border bg-cx-raised/30"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-cx-fg">{suite.label}</span>
                <span className={`text-[9px] uppercase px-2 py-0.5 rounded-md ${
                  suite.status === 'passing' ? 'bg-cx-success/10 text-cx-success' :
                  suite.status === 'running' ? 'bg-cx-accent/10 text-cx-accent animate-pulse' :
                  suite.status === 'warn' ? 'bg-cx-warn/10 text-cx-warn' :
                  'bg-cx-raised text-cx-fg-dim'
                }`}>{suite.status}</span>
              </div>
              {suite.agentName ? (
                <p className="text-[10px] text-cx-fg-dim mb-2">{suite.agentName}</p>
              ) : (
                <p className="text-[10px] text-cx-fg-dim mb-2">No agent onboarded</p>
              )}
              <div className="flex justify-between text-xs text-cx-fg-dim">
                <span>{suite.count} tests</span>
                <span>{Math.round(suite.automated)}% automated</span>
              </div>
            </motion.div>
          ))}
        </div>
      </GlassPanel>

      <GlassPanel className="p-6">
        <p className="text-2xs uppercase text-cx-fg-dim mb-2">Automation coverage</p>
        <p className="font-display text-4xl font-semibold text-cx-accent mb-4">{overall}%</p>
        {coverageData.length > 0 ? (
          <div className="h-[180px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={coverageData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} dataKey="value" paddingAngle={3}>
                  {coverageData.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: '#10141d', border: '1px solid rgba(148,163,184,0.11)', borderRadius: '12px', fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <p className="text-xs text-cx-fg-dim">Onboard QE agents to see coverage</p>
        )}
        <Link to="/evaluation" className="text-xs text-cx-accent hover:underline mt-2 inline-block">
          Open Evaluation Center →
        </Link>
      </GlassPanel>
    </div>
  )
}

export function DomainEngineeringPage({ category }) {
  const config = getDomainConfig(category)
  const { agents, addNotification } = useApp()
  const { runs, executeRun } = useHarness()

  const catAgents = useMemo(
    () => agents.filter((a) => a.category === category && a.stage !== 'draft'),
    [agents, category]
  )

  const metrics = useMemo(() => computeDomainMetrics(agents, category, runs), [agents, category, runs])
  const activities = useMemo(() => getDomainActivities(category), [category, runs])
  const artifacts = useMemo(() => computeADArtifacts(agents), [agents])
  const suites = useMemo(() => computeQESuites(agents, runs), [agents, runs])

  const [selectedId, setSelectedId] = useState(null)
  const [task, setTask] = useState('')
  const [running, setRunning] = useState(false)
  const [incidentStep, setIncidentStep] = useState(1)
  const [incidentRunning, setIncidentRunning] = useState(false)
  const [activityKey, setActivityKey] = useState(0)

  useEffect(() => {
    const first = catAgents.find(
      (a) => a.connectionStatus === 'verified' || ['certified', 'published'].includes(a.stage)
    )
    if (first && !selectedId) {
      setSelectedId(first.id)
      setTask(getDefaultTaskForAgent(first))
    }
  }, [catAgents, selectedId])

  const refreshActivities = () => setActivityKey((k) => k + 1)

  const handleRun = useCallback(async (agent) => {
    if (!agent || running) return
    setRunning(true)
    logDomainActivity(category, {
      type: 'harness',
      title: `Harness run: ${agent.name}`,
      detail: task.slice(0, 80),
      status: 'running',
    })
    addNotification(`Domain harness started — ${agent.name}`, 'info')
    try {
      const result = await executeRun(agent, task)
      logDomainActivity(category, {
        type: 'harness',
        title: `Harness ${result.status}: ${agent.name}`,
        detail: result.status === 'completed' ? 'Pipeline completed successfully' : String(result.status),
        status: result.status === 'completed' ? 'completed' : 'warn',
      })
      if (category === 'ams' && incidentStep < 6) {
        setIncidentStep((s) => Math.min(6, s + 1))
      }
      addNotification(`Harness ${result.status} for ${agent.name}`, result.status === 'completed' ? 'success' : 'warn')
    } finally {
      setRunning(false)
      refreshActivities()
    }
  }, [running, task, executeRun, category, addNotification, incidentStep])

  const handleAdvanceIncident = useCallback(async () => {
    if (incidentRunning || incidentStep >= 6) return
    setIncidentRunning(true)
    const timeline = buildAMSTimeline(agents, incidentStep + 1)
    const step = timeline[incidentStep]
    logDomainActivity('ams', {
      type: 'incident',
      title: step.event,
      detail: step.agent,
      status: 'completed',
    })
    await new Promise((r) => setTimeout(r, 800))
    setIncidentStep((s) => s + 1)
    setIncidentRunning(false)
    refreshActivities()
  }, [incidentRunning, incidentStep, agents])

  const displayActivities = useMemo(
    () => getDomainActivities(category),
    [category, activityKey, runs]
  )

  return (
    <div>
      <PageHeader
        eyebrow={config.eyebrow}
        title={config.title}
        description={config.description}
      />

      <DomainQuickActions category={category} metrics={metrics} />
      <DomainMetricsBar metrics={metrics} />

      <DomainAgentRunner
        agents={agents}
        category={category}
        selectedId={selectedId}
        onSelect={(id) => {
          setSelectedId(id)
          const agent = agents.find((a) => a.id === id)
          if (agent) setTask(getDefaultTaskForAgent(agent))
        }}
        task={task}
        onTaskChange={setTask}
        onRun={handleRun}
        running={running}
      />

      <CategoryAgentsPanel agents={agents} category={category} />

      <DomainPlatformPlanes category={category} />

      {category === 'ad' && <ADDomainPanel agents={agents} artifacts={artifacts} />}
      {category === 'ams' && (
        <AMSDomainPanel
          agents={agents}
          incidentStep={incidentStep}
          onAdvanceIncident={handleAdvanceIncident}
          incidentRunning={incidentRunning}
        />
      )}
      {category === 'qe' && <QEDomainPanel suites={suites} agents={agents} />}

      <DomainActivityFeed activities={displayActivities} color={metrics.color} />
    </div>
  )
}
