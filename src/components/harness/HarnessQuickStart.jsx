import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Play,
  Library,
  GitBranch,
  UserPlus,
  Bot,
  Zap,
  CheckCircle,
  ArrowRight,
  Gauge,
  Shield,
  DollarSign,
  Target,
  Cpu,
  HeartPulse,
} from 'lucide-react'
import { GlassPanel } from '../ui/GlassPanel'
import { ProgressBar } from '../ui/ProgressBar'
import { CATEGORIES } from '../../lib/constants'
import { agentEligibleForHarness } from '../../lib/harnessConstants'
import { PREBUILT_WORKFLOW_IDS, isPrebuiltWorkflow } from '../../data/prebuiltWorkflows'
import { getDefaultTaskForAgent } from '../../services/domainService'

const INITIATIVE_WORKFLOWS = {
  'demo_init_prior_auth': {
    workflowId: PREBUILT_WORKFLOW_IDS.priorAuth,
    label: 'Prior Auth Delivery Workflow',
    category: 'ad',
  },
  'demo_init_claims': {
    workflowId: PREBUILT_WORKFLOW_IDS.claimAdjudication,
    label: 'Claim Adjudication Pipeline',
    category: 'ad',
  },
  'demo_init_resilience': {
    workflowId: PREBUILT_WORKFLOW_IDS.incidentResponse,
    label: 'AMS Incident Response Workflow',
    category: 'ams',
  },
}

const JOURNEY_STEPS = [
  { step: 1, label: 'Verify agents', detail: 'Onboard & connect runtime in Agent Onboarding Studio', path: '/onboarding', done: (ctx) => ctx.eligibleAgents > 0 },
  { step: 2, label: 'Single harness run', detail: 'Execute one agent through the 10-step enterprise pipeline', action: 'single', done: (ctx) => ctx.totalRuns > 0 },
  { step: 3, label: 'Compose workflow', detail: 'Chain agents with policy gates on the canvas', action: 'composer', done: (ctx) => ctx.savedWorkflows > 1 },
  { step: 4, label: 'Evaluate & govern', detail: 'Quality scores, cost, and compliance approval', path: '/evaluation', done: (ctx) => ctx.completedRuns >= 3 },
]

const QUICK_PATHS = [
  {
    id: 'single',
    title: 'Run single agent',
    description: 'Test one onboarded agent through context assembly, evaluation, and policy gates.',
    icon: Cpu,
    color: '#5ec8f2',
  },
  {
    id: 'template',
    title: 'Use a template',
    description: 'Open a healthcare pre-built workflow — Prior Auth, Claims, Incident Response.',
    icon: Library,
    color: '#3ecf9b',
  },
  {
    id: 'compose',
    title: 'Build from scratch',
    description: 'Start a blank workflow canvas — drag agents, connect dotted lines, save & export JSON.',
    icon: GitBranch,
    color: '#9b8bd4',
  },
]

export function HarnessQuickStart({
  agents,
  initiatives,
  runs,
  workflows,
  stats,
  onStartSingle,
  onOpenTemplate,
  onOpenLibrary,
  onBuildNew,
  onGoTab,
}) {
  const eligible = agents.filter(agentEligibleForHarness)
  const healthcareTemplates = workflows.filter(
    (w) => w.metadata?.tags?.includes('healthcare') || isPrebuiltWorkflow(w)
  )
  const activeInitiative = initiatives.find((i) => i.status === 'active') ?? initiatives[0]
  const initiativeHint = activeInitiative ? INITIATIVE_WORKFLOWS[activeInitiative.id] : null

  const ctx = {
    eligibleAgents: stats.eligibleAgents,
    totalRuns: stats.totalRuns,
    completedRuns: stats.completedRuns,
    savedWorkflows: workflows.length,
  }

  const journeyProgress = JOURNEY_STEPS.filter((s) => s.done(ctx)).length
  const hasAgents = eligible.length > 0

  return (
    <div className="space-y-6">
      {/* Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Harness runs', value: stats.totalRuns, icon: Zap, color: '#5ec8f2' },
          { label: 'Agents ready', value: stats.eligibleAgents, icon: Bot, color: '#9b8bd4' },
          { label: 'Completed', value: stats.completedRuns, icon: CheckCircle, color: '#3ecf9b' },
          { label: 'Saved workflows', value: workflows.length, icon: GitBranch, color: '#e8b84a' },
        ].map((m) => (
          <GlassPanel key={m.label} className="p-4">
            <m.icon className="w-4 h-4 mb-2" style={{ color: m.color }} />
            <p className="text-[10px] uppercase text-cx-fg-dim">{m.label}</p>
            <p className="font-display text-xl font-semibold text-cx-fg mt-1">{m.value}</p>
          </GlassPanel>
        ))}
      </div>

      {!hasAgents ? (
        <GlassPanel hero className="p-10 text-center">
          <Bot className="w-12 h-12 text-cx-accent mx-auto mb-4 opacity-60" />
          <h2 className="font-display text-lg text-cx-fg mb-2">No agents ready for harness</h2>
          <p className="text-sm text-cx-fg-dim max-w-md mx-auto mb-6">
            Register external agents in Onboarding Studio and verify their runtime connection before running the harness pipeline.
          </p>
          <Link
            to="/onboarding"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-cx-accent/40 bg-cx-accent/10 text-cx-accent text-sm"
          >
            <UserPlus className="w-4 h-4" /> Go to Onboarding Studio
          </Link>
        </GlassPanel>
      ) : (
        <>
          {/* Quick start paths */}
          <GlassPanel hero className="p-6">
            <p className="text-2xs uppercase text-cx-accent tracking-widest mb-1">Quick start</p>
            <h2 className="font-display text-lg text-cx-fg mb-4">Choose how to begin</h2>
            <div className="grid md:grid-cols-3 gap-4">
              {QUICK_PATHS.map((path, i) => (
                <motion.button
                  key={path.id}
                  type="button"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  onClick={() => {
                    if (path.id === 'single') {
                      const agent = eligible[0]
                      onStartSingle?.({ agentId: agent?.id, category: agent?.category ?? 'ad' })
                    } else if (path.id === 'template') {
                      if (initiativeHint) {
                        onOpenTemplate?.(initiativeHint.workflowId, initiativeHint.category)
                      } else {
                        onOpenLibrary?.()
                      }
                    } else {
                      onBuildNew?.()
                    }
                  }}
                  className="text-left p-5 rounded-xl border border-cx-border bg-cx-raised/20 hover:border-cx-accent/40 hover:bg-cx-accent/5 transition-all group"
                >
                  <path.icon className="w-8 h-8 mb-3" style={{ color: path.color }} />
                  <p className="text-sm font-semibold text-cx-fg mb-1">{path.title}</p>
                  <p className="text-xs text-cx-fg-dim leading-relaxed mb-3">{path.description}</p>
                  <span className="inline-flex items-center gap-1 text-xs text-cx-accent group-hover:underline">
                    Start <ArrowRight className="w-3 h-3" />
                  </span>
                </motion.button>
              ))}
            </div>
          </GlassPanel>

          {/* Enterprise journey */}
          <GlassPanel className="p-6">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <div>
                <p className="text-2xs uppercase text-cx-fg-dim tracking-widest">Enterprise journey</p>
                <p className="text-sm text-cx-fg mt-0.5">
                  {journeyProgress} of {JOURNEY_STEPS.length} steps complete
                </p>
              </div>
              <ProgressBar value={(journeyProgress / JOURNEY_STEPS.length) * 100} className="w-40" />
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {JOURNEY_STEPS.map((s) => {
                const complete = s.done(ctx)
                const inner = (
                  <>
                    <div className="flex items-center gap-2 mb-2">
                      <span
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-mono ${
                          complete ? 'bg-cx-success/20 text-cx-success' : 'bg-cx-raised text-cx-fg-dim'
                        }`}
                      >
                        {complete ? <CheckCircle className="w-3.5 h-3.5" /> : s.step}
                      </span>
                      <p className="text-xs font-medium text-cx-fg">{s.label}</p>
                    </div>
                    <p className="text-[10px] text-cx-fg-dim leading-relaxed">{s.detail}</p>
                    <span className="text-[10px] text-cx-accent mt-2 inline-block">
                      {s.path ? 'Open →' : 'Continue →'}
                    </span>
                  </>
                )
                const className = `text-left p-4 rounded-xl border transition-colors block w-full ${
                  complete
                    ? 'border-cx-success/30 bg-cx-success/5'
                    : 'border-cx-border bg-cx-raised/20 hover:border-cx-accent/30'
                }`
                if (s.path) {
                  return (
                    <Link key={s.step} to={s.path} className={className}>
                      {inner}
                    </Link>
                  )
                }
                return (
                  <button
                    key={s.step}
                    type="button"
                    onClick={() => {
                      if (s.action === 'single') onStartSingle?.({ agentId: eligible[0]?.id, category: eligible[0]?.category })
                      if (s.action === 'composer') onBuildNew?.()
                    }}
                    className={className}
                  >
                    {inner}
                  </button>
                )
              })}
            </div>
          </GlassPanel>
        </>
      )}

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Initiative recommendation */}
        {activeInitiative && initiativeHint && (
          <GlassPanel className="p-5">
            <div className="flex items-start gap-3">
              <Target className="w-5 h-5 text-cx-accent shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-2xs uppercase text-cx-fg-dim tracking-widest">Recommended for initiative</p>
                <p className="text-sm font-medium text-cx-fg mt-1">{activeInitiative.title}</p>
                <p className="text-xs text-cx-fg-dim mt-1 mb-3">{activeInitiative.businessObjective}</p>
                <button
                  type="button"
                  onClick={() => onOpenTemplate?.(initiativeHint.workflowId, initiativeHint.category)}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl border border-cx-accent/40 bg-cx-accent/10 text-xs text-cx-accent"
                >
                  <HeartPulse className="w-3.5 h-3.5" />
                  Open {initiativeHint.label}
                </button>
              </div>
            </div>
          </GlassPanel>
        )}

        {/* Agents ready */}
        {hasAgents && (
          <GlassPanel className="p-5">
            <p className="text-2xs uppercase text-cx-fg-dim tracking-widest mb-3">Agents ready for harness</p>
            <div className="space-y-2 max-h-[200px] overflow-y-auto">
              {eligible.slice(0, 6).map((a) => (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => onStartSingle?.({ agentId: a.id, category: a.category, task: getDefaultTaskForAgent(a) })}
                  className="w-full flex items-center justify-between p-3 rounded-xl border border-cx-border bg-cx-raised/20 hover:border-cx-accent/40 text-left group"
                >
                  <div>
                    <p className="text-xs font-medium text-cx-fg">{a.name}</p>
                    <p className="text-[10px] text-cx-fg-dim">{CATEGORIES[a.category]?.short} · {a.project}</p>
                  </div>
                  <Play className="w-4 h-4 text-cx-accent opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                </button>
              ))}
            </div>
          </GlassPanel>
        )}

        {/* Healthcare templates */}
        {healthcareTemplates.length > 0 && (
          <GlassPanel className="p-5">
            <p className="text-2xs uppercase text-cx-fg-dim tracking-widest mb-3">Healthcare templates</p>
            <div className="space-y-2 max-h-[200px] overflow-y-auto">
              {healthcareTemplates.slice(0, 5).map((wf) => (
                <button
                  key={wf.id}
                  type="button"
                  onClick={() => onOpenTemplate?.(wf.id, wf.category)}
                  className="w-full text-left p-3 rounded-xl border border-cx-border bg-cx-raised/20 hover:border-cx-accent/40"
                >
                  <p className="text-xs font-medium text-cx-fg line-clamp-1">{wf.name}</p>
                  <p className="text-[10px] text-cx-fg-dim">
                    {wf.nodes.filter((n) => n.type === 'agent').length} agents · {CATEGORIES[wf.category]?.short}
                  </p>
                </button>
              ))}
            </div>
            <button type="button" onClick={() => onOpenLibrary?.()} className="text-xs text-cx-accent hover:underline mt-3">
              View all templates →
            </button>
          </GlassPanel>
        )}
      </div>

      {/* Recent runs + next steps */}
      {runs.length > 0 && (
        <div className="grid lg:grid-cols-2 gap-6">
          <GlassPanel className="p-5">
            <p className="text-2xs uppercase text-cx-fg-dim tracking-widest mb-3">Recent harness runs</p>
            <div className="space-y-2">
              {runs.slice(0, 5).map((run) => (
                <div key={run.id} className="flex items-center justify-between p-3 rounded-xl border border-cx-border bg-cx-raised/20">
                  <div className="min-w-0">
                    <p className="text-xs text-cx-fg truncate">{run.agentName}</p>
                    <p className="text-[10px] text-cx-fg-dim truncate">{run.task?.slice(0, 60)}</p>
                  </div>
                  <span
                    className={`text-[9px] uppercase px-2 py-0.5 rounded shrink-0 ml-2 ${
                      run.status === 'completed' ? 'bg-cx-success/10 text-cx-success' : 'bg-cx-warn/10 text-cx-warn'
                    }`}
                  >
                    {run.status}
                  </span>
                </div>
              ))}
            </div>
            <button type="button" onClick={() => onGoTab?.('single')} className="text-xs text-cx-accent hover:underline mt-3">
              Run another agent →
            </button>
          </GlassPanel>

          <GlassPanel className="p-5">
            <p className="text-2xs uppercase text-cx-fg-dim tracking-widest mb-3">Next steps after a run</p>
            <div className="space-y-2">
              {[
                { label: 'Evaluation Center', hint: 'Review quality scores & rules', path: '/evaluation', icon: Gauge },
                { label: 'FinOps Center', hint: 'Token cost & prompt rules', path: '/finops', icon: DollarSign },
                { label: 'Governance Center', hint: 'Compliance scan & approval', path: '/governance', icon: Shield },
              ].map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className="flex items-center gap-3 p-3 rounded-xl border border-cx-border bg-cx-raised/20 hover:border-cx-accent/30 transition-colors"
                >
                  <link.icon className="w-4 h-4 text-cx-accent shrink-0" />
                  <div>
                    <p className="text-xs font-medium text-cx-fg">{link.label}</p>
                    <p className="text-[10px] text-cx-fg-dim">{link.hint}</p>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-cx-fg-dim ml-auto" />
                </Link>
              ))}
            </div>
          </GlassPanel>
        </div>
      )}
    </div>
  )
}
