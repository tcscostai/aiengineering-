import { BRAND } from '../lib/branding'
import { Activity, Bot, Award, Shield, Recycle, Zap, Rocket, Puzzle, GitBranch, Database, BarChart3 } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { PageHeader } from '../components/ui/PageHeader'
import { MetricCard } from '../components/ui/MetricCard'
import { GlassPanel } from '../components/ui/GlassPanel'
import { EcosystemNexus } from '../components/EcosystemNexus'
import { EnterpriseFlowDashboard } from '../components/flow/EnterpriseFlowDashboard'
import { CATEGORIES } from '../lib/constants'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

export default function ExecutiveDashboard() {
  const { metrics, health, agents, agentMetrics, startDemoEnterpriseFlow, enterpriseFlow } = useApp()

  const cards = [
    { label: 'Active Workspaces', value: metrics.activeInitiatives, icon: Rocket },
    { label: 'Agents In Progress', value: metrics.runningAgents, icon: Bot },
    { label: 'Reusable Skills', value: metrics.reusableSkills, icon: Puzzle },
    { label: 'Published Workflows', value: metrics.reusableWorkflows, icon: GitBranch },
    { label: 'Certified Agents', value: metrics.certifiedAgents, icon: Award },
    { label: 'Total Agents', value: agentMetrics.totalAgents, icon: Database },
    { label: 'Evaluation Score', value: health.evaluationScore || '—', suffix: health.evaluationScore ? '/100' : '', icon: BarChart3 },
    { label: 'Governance Coverage', value: health.governanceCoverage ? `${health.governanceCoverage}%` : '—', icon: Shield },
    { label: 'Reuse Ratio', value: health.reuseRatio ? `${health.reuseRatio}%` : '—', icon: Recycle },
    { label: 'Published Agents', value: agentMetrics.publishedAgents, icon: Zap },
  ]

  const velocityTrend = useMemo(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun']
    const base = agentMetrics.totalAgents
    return months.map((month, i) => ({
      month,
      velocity: Math.min(100, base * 8 + i * 5),
      reuse: health.reuseRatio ? Math.min(100, health.reuseRatio - (5 - i) * 3) : i * 5,
    }))
  }, [agentMetrics.totalAgents, health.reuseRatio])

  return (
    <div>
      <PageHeader
        eyebrow="Command Center"
        title="Enterprise AI Engineering Health"
        description="Live metrics from onboarded agents and engineering workspaces across AD, AMS, and QE."
      />

      <EnterpriseFlowDashboard flow={enterpriseFlow} onStartDemo={startDemoEnterpriseFlow} />

      {agentMetrics.totalAgents === 0 && (
        <GlassPanel className="p-4 mb-6 border-cx-accent/30 bg-cx-accent/5">
          <p className="text-sm text-cx-fg-muted">
            No agents onboarded yet. Start with <strong className="text-cx-accent">Agent Onboarding Studio</strong> to register AD, AMS, or QE agents from your teams and projects.
          </p>
        </GlassPanel>
      )}

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 mb-8">
        {cards.map((card, i) => (
          <MetricCard key={card.label} {...card} delay={i * 0.05} />
        ))}
      </div>

      <div className="grid md:grid-cols-3 gap-4 mb-8">
        {Object.values(CATEGORIES).map((cat) => (
          <GlassPanel key={cat.id} className="p-4">
            <p className="text-2xs uppercase text-cx-fg-dim mb-1">{cat.label}</p>
            <p className="font-display text-2xl font-semibold" style={{ color: cat.color }}>
              {agentMetrics.byCategory[cat.id] ?? 0}
            </p>
            <p className="text-xs text-cx-fg-dim mt-1">agents onboarded</p>
          </GlassPanel>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6 mb-8">
        <GlassPanel hero className="lg:col-span-2 p-6">
          <p className="text-2xs uppercase text-cx-accent tracking-widest mb-1">Ecosystem Network</p>
          <h2 className="font-display text-lg font-semibold text-cx-fg mb-4">AI Engineering Nexus</h2>
          <EcosystemNexus />
        </GlassPanel>

        <GlassPanel className="p-6">
          <p className="text-2xs uppercase text-cx-accent2 tracking-widest mb-1">Momentum</p>
          <h2 className="font-display text-lg font-semibold text-cx-fg mb-4">Engineering Velocity</h2>
          <div className="h-[340px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={velocityTrend}>
                <defs>
                  <linearGradient id="velocityGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#5ec8f2" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#5ec8f2" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" stroke="#8b9cb0" fontSize={11} />
                <YAxis stroke="#8b9cb0" fontSize={11} />
                <Tooltip contentStyle={{ background: '#10141d', border: '1px solid rgba(148,163,184,0.11)', borderRadius: '12px' }} />
                <Area type="monotone" dataKey="velocity" stroke="#5ec8f2" fill="url(#velocityGrad)" strokeWidth={2} />
                <Area type="monotone" dataKey="reuse" stroke="#9b8bd4" fill="transparent" strokeWidth={2} strokeDasharray="4 4" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </GlassPanel>
      </div>

      <GlassPanel hero className="p-6">
        <p className="text-center text-sm text-cx-fg-dim max-w-3xl mx-auto leading-relaxed">
          {BRAND.name} is building an{' '}
          <span className="text-cx-accent font-medium">Enterprise AI Engineering Operating System</span>{' '}
          — every agent from every team onboards here for engineering excellence across Application Development, AMS, and Quality Engineering.
        </p>
      </GlassPanel>
    </div>
  )
}
