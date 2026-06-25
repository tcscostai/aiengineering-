import { Link } from 'react-router-dom'
import { Bot, Play, CheckCircle, Loader2, Zap, Shield } from 'lucide-react'
import { GlassPanel } from '../ui/GlassPanel'
import { CATEGORIES, getRuntimeShort, RUNTIME_TYPES } from '../../lib/constants'

export function DomainMetricsBar({ metrics }) {
  if (!metrics.agentCount) return null

  const items = [
    { label: 'Agents', value: metrics.agentCount },
    { label: 'Published', value: metrics.published },
    { label: 'Harness Runs', value: metrics.harnessRuns },
    { label: 'Avg Quality', value: metrics.avgQuality ? `${metrics.avgQuality}%` : '—' },
    { label: 'Reuse', value: metrics.reuseTotal },
    { label: 'Verified', value: metrics.verified },
  ]

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
      {items.map((m) => (
        <GlassPanel key={m.label} className="p-3">
          <p className="text-[9px] uppercase text-cx-fg-dim mb-1">{m.label}</p>
          <p className="font-display text-lg font-semibold text-cx-fg" style={{ color: metrics.color }}>
            {m.value}
          </p>
        </GlassPanel>
      ))}
    </div>
  )
}

export function DomainAgentRunner({
  agents,
  category,
  selectedId,
  onSelect,
  task,
  onTaskChange,
  onRun,
  running,
}) {
  const cat = CATEGORIES[category]
  const eligible = agents.filter(
    (a) => a.category === category && a.stage !== 'draft' &&
      (a.connectionStatus === 'verified' || ['certified', 'published', 'evaluated'].includes(a.stage))
  )

  if (!eligible.length) {
    return (
      <GlassPanel className="p-6 mb-6 border-dashed border-cx-accent/30">
        <p className="text-sm text-cx-fg-muted">
          No runnable {cat.short} agents yet.{' '}
          <Link to="/onboarding" className="text-cx-accent hover:underline">Onboard an agent</Link> and verify its connection to run domain activities.
        </p>
      </GlassPanel>
    )
  }

  const selected = eligible.find((a) => a.id === selectedId) ?? eligible[0]

  return (
    <GlassPanel hero className="p-6 mb-6">
      <div className="flex items-center gap-2 mb-4">
        <Play className="w-5 h-5 text-cx-accent" />
        <div>
          <p className="text-2xs uppercase tracking-widest" style={{ color: cat.color }}>Live activity</p>
          <h2 className="font-display text-base font-semibold text-cx-fg">Run agent via platform harness</h2>
        </div>
      </div>

      <div className="grid lg:grid-cols-[1fr_1.2fr_auto] gap-3 items-end">
        <div>
          <label className="text-[10px] uppercase text-cx-fg-dim mb-1.5 block">Agent</label>
          <select
            value={selected?.id ?? ''}
            onChange={(e) => onSelect(e.target.value)}
            className="w-full px-3 py-2.5 rounded-xl border border-cx-border bg-cx-void/50 text-sm text-cx-fg focus:outline-none focus:border-cx-accent/40"
          >
            {eligible.map((a) => (
              <option key={a.id} value={a.id}>{a.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-[10px] uppercase text-cx-fg-dim mb-1.5 block">Task</label>
          <input
            type="text"
            value={task}
            onChange={(e) => onTaskChange(e.target.value)}
            className="w-full px-3 py-2.5 rounded-xl border border-cx-border bg-cx-void/50 text-sm text-cx-fg focus:outline-none focus:border-cx-accent/40"
          />
        </div>
        <button
          type="button"
          onClick={() => onRun(selected)}
          disabled={running || !selected}
          className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border border-cx-accent/50 bg-cx-accent/15 text-cx-accent text-sm font-medium hover:bg-cx-accent/25 disabled:opacity-50 h-[42px]"
        >
          {running ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
          {running ? 'Running…' : 'Execute'}
        </button>
      </div>

      {selected && (
        <div className="mt-3 flex flex-wrap gap-2 text-[10px] text-cx-fg-dim">
          <span className="flex items-center gap-1">
            <Bot className="w-3 h-3" style={{ color: cat.color }} />
            {getRuntimeShort(selected.runtimeType)}
          </span>
          <span>{selected.skills.length} skills</span>
          <span>{selected.knowledgeSources.length} knowledge sources</span>
          {selected.governanceApproved && (
            <span className="flex items-center gap-1 text-cx-success">
              <Shield className="w-3 h-3" /> Governed
            </span>
          )}
        </div>
      )}
    </GlassPanel>
  )
}

export function DomainActivityFeed({ activities, color }) {
  if (!activities?.length) return null

  return (
    <GlassPanel className="p-6">
      <p className="text-2xs uppercase text-cx-fg-dim mb-4">Recent platform activity</p>
      <div className="space-y-2 max-h-[280px] overflow-y-auto">
        {activities.map((a) => (
          <div key={a.id} className="flex gap-3 p-3 rounded-xl border border-cx-border bg-cx-raised/20 text-xs">
            {a.status === 'completed' ? (
              <CheckCircle className="w-4 h-4 text-cx-success shrink-0 mt-0.5" />
            ) : (
              <Loader2 className="w-4 h-4 text-cx-accent shrink-0 mt-0.5 animate-spin" />
            )}
            <div className="min-w-0 flex-1">
              <p className="text-cx-fg font-medium">{a.title}</p>
              <p className="text-cx-fg-dim mt-0.5 truncate">{a.detail}</p>
              <p className="text-[9px] text-cx-fg-dim mt-1 font-mono">
                {new Date(a.timestamp).toLocaleString()}
              </p>
            </div>
            <span
              className="text-[9px] uppercase px-1.5 py-0.5 rounded shrink-0 h-fit"
              style={{ color, backgroundColor: `${color}15` }}
            >
              {a.type}
            </span>
          </div>
        ))}
      </div>
    </GlassPanel>
  )
}
