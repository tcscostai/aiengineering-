import { useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Link } from 'react-router-dom'
import {
  AlertTriangle,
  Bot,
  TrendingDown,
  TrendingUp,
  Zap,
  ChevronRight,
  Play,
  Link2,
  Sparkles,
} from 'lucide-react'
import { GlassPanel } from '../ui/GlassPanel'
import {
  DEBT_SEVERITY,
  DEBT_TYPES,
  getDebtProfile,
  getFeaturedDebt,
  resolveDebtAgents,
} from '../../data/debtProfiler'
import { getRuntimeShort, RUNTIME_TYPES } from '../../lib/constants'

function SeverityBadge({ severity }) {
  const s = DEBT_SEVERITY[severity] ?? DEBT_SEVERITY.medium
  return (
    <span
      className="text-[9px] uppercase font-mono px-1.5 py-0.5 rounded"
      style={{ backgroundColor: `${s.color}20`, color: s.color }}
    >
      {s.label}
    </span>
  )
}

function DebtScoreRing({ score, color, size = 72 }) {
  const r = (size - 8) / 2
  const circ = 2 * Math.PI * r
  const offset = circ - (score / 100) * circ
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(148,163,184,0.1)" strokeWidth={4} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={4}
          strokeDasharray={circ}
          strokeDashoffset={offset}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="font-display text-lg font-semibold text-cx-fg">{score}</span>
      </div>
    </div>
  )
}

export function DebtProfilerPanel({ category, categoryColor, agents, onViewKnowledgeNode }) {
  const [selectedId, setSelectedId] = useState(null)
  const [filter, setFilter] = useState('all')

  const profile = useMemo(() => getDebtProfile(category), [category])
  const featured = useMemo(() => getFeaturedDebt(category), [category])

  const items = profile?.items ?? []
  const filtered = useMemo(() => {
    if (filter === 'all') return items
    if (filter === 'critical') return items.filter((i) => i.severity === 'critical' || i.severity === 'high')
    if (filter === 'assigned') return items.filter((i) => i.status === 'agent_assigned')
    return items
  }, [items, filter])

  const selected = items.find((i) => i.id === selectedId) ?? featured
  const boundAgents = selected ? resolveDebtAgents(selected, agents) : []

  if (!profile) return null

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <GlassPanel className="p-4 flex items-center gap-4">
          <DebtScoreRing score={profile.summary.debtIndex} color={categoryColor} />
          <div>
            <p className="text-2xs uppercase text-cx-fg-dim">Debt Index</p>
            <p className="text-xs text-cx-fg-dim flex items-center gap-1 mt-0.5">
              {profile.summary.trend === 'worsening' ? (
                <TrendingUp className="w-3 h-3 text-cx-danger" />
              ) : (
                <TrendingDown className="w-3 h-3 text-cx-success" />
              )}
              {profile.summary.trend}
            </p>
          </div>
        </GlassPanel>
        <GlassPanel className="p-4">
          <p className="text-2xs uppercase text-cx-fg-dim mb-1">Critical / High</p>
          <p className="font-display text-2xl font-semibold text-cx-danger">{profile.summary.criticalCount}</p>
          <p className="text-[10px] text-cx-fg-dim mt-1">of {items.length} debt items</p>
        </GlassPanel>
        <GlassPanel className="p-4">
          <p className="text-2xs uppercase text-cx-fg-dim mb-1">Agent Assigned</p>
          <p className="font-display text-2xl font-semibold" style={{ color: categoryColor }}>
            {profile.summary.agentAssigned}
          </p>
          <p className="text-[10px] text-cx-fg-dim mt-1">prebuilt agents active</p>
        </GlassPanel>
        <GlassPanel className="p-4">
          <p className="text-2xs uppercase text-cx-fg-dim mb-1">Est. Savings</p>
          <p className="font-display text-xl font-semibold text-cx-success">{profile.summary.estimatedSavings}</p>
          <p className="text-[10px] text-cx-fg-dim mt-1">if debt closed</p>
        </GlassPanel>
      </div>

      <div className="grid lg:grid-cols-[1fr_340px] gap-6">
        <div className="space-y-4">
          {featured && (
            <GlassPanel
              hero
              className="p-5 cursor-pointer border-2"
              style={{ borderColor: `${categoryColor}40` }}
              onClick={() => setSelectedId(featured.id)}
            >
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-xl shrink-0" style={{ backgroundColor: `${categoryColor}15` }}>
                  <Sparkles className="w-5 h-5" style={{ color: categoryColor }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className="text-[10px] uppercase tracking-widest" style={{ color: categoryColor }}>
                      Featured Debt
                    </span>
                    <SeverityBadge severity={featured.severity} />
                    {featured.sourceSystem && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded border border-cx-border text-cx-fg-dim">
                        {featured.sourceSystem}
                      </span>
                    )}
                  </div>
                  <h3 className="font-display text-base font-semibold text-cx-fg mb-1">{featured.title}</h3>
                  <p className="text-xs text-cx-fg-dim line-clamp-2">{featured.impact}</p>
                  {featured.servicenowRecords && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {Object.entries(featured.servicenowRecords).map(([, v]) => (
                        <span key={v} className="text-[10px] font-mono px-2 py-0.5 rounded bg-cx-raised/50 text-cx-accent">
                          {v}
                        </span>
                      ))}
                    </div>
                  )}
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {featured.boundAgentIds?.map((aid) => {
                      const ag = agents.find((a) => a.id === aid)
                      return ag ? (
                        <span
                          key={aid}
                          className="text-[9px] px-1.5 py-0.5 rounded border border-dashed border-cx-accent/40 text-cx-accent"
                        >
                          {ag.name}
                        </span>
                      ) : null
                    })}
                  </div>
                </div>
                <DebtScoreRing
                  score={featured.debtScore}
                  color={DEBT_SEVERITY[featured.severity]?.color ?? categoryColor}
                  size={56}
                />
              </div>
            </GlassPanel>
          )}

          <div className="flex flex-wrap gap-2">
            {[
              { id: 'all', label: 'All' },
              { id: 'critical', label: 'Critical & High' },
              { id: 'assigned', label: 'Agent Assigned' },
            ].map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setFilter(f.id)}
                className={`px-3 py-1 rounded-lg border text-xs ${
                  filter === f.id ? 'border-cx-accent/40 text-cx-accent bg-cx-accent/10' : 'border-cx-border text-cx-fg-dim'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          <div className="space-y-2">
            {filtered.map((item, i) => {
              const typeInfo = DEBT_TYPES[item.type]
              const isSelected = selected?.id === item.id
              return (
                <motion.button
                  key={item.id}
                  type="button"
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04 }}
                  onClick={() => setSelectedId(item.id)}
                  className={`w-full text-left p-4 rounded-xl border transition-all ${
                    isSelected
                      ? 'border-cx-accent/40 bg-cx-accent/5'
                      : 'border-cx-border bg-cx-raised/20 hover:border-cx-border-strong'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <SeverityBadge severity={item.severity} />
                        <span className="text-[9px] uppercase text-cx-fg-dim">{typeInfo?.label ?? item.type}</span>
                        {item.status === 'agent_assigned' && (
                          <span className="text-[9px] uppercase px-1 py-0.5 rounded bg-cx-success/15 text-cx-success flex items-center gap-0.5">
                            <Bot className="w-2.5 h-2.5" /> Agent
                          </span>
                        )}
                      </div>
                      <p className="text-sm font-medium text-cx-fg">{item.title}</p>
                      <p className="text-[10px] text-cx-fg-dim mt-0.5">{item.affectedAsset} · {item.project}</p>
                    </div>
                    <span className="font-mono text-sm shrink-0" style={{ color: DEBT_SEVERITY[item.severity]?.color }}>
                      {item.debtScore}
                    </span>
                  </div>
                </motion.button>
              )
            })}
          </div>
        </div>

        <GlassPanel className="p-5 lg:sticky lg:top-6 h-fit">
          <AnimatePresence mode="wait">
            {selected && (
              <motion.div
                key={selected.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="space-y-4"
              >
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="w-4 h-4 text-cx-warn" />
                    <SeverityBadge severity={selected.severity} />
                    <span className="text-[10px] text-cx-fg-dim font-mono">Score {selected.debtScore}</span>
                  </div>
                  <h3 className="font-display text-base font-semibold text-cx-fg leading-snug">{selected.title}</h3>
                </div>

                <div className="p-3 rounded-xl border border-cx-border bg-cx-void/40 space-y-2 text-xs">
                  <div className="flex justify-between gap-2">
                    <span className="text-cx-fg-dim shrink-0">Source</span>
                    <span className="text-cx-fg text-right">{selected.sourceSystem}</span>
                  </div>
                  <div className="flex justify-between gap-2">
                    <span className="text-cx-fg-dim shrink-0">Recurrence</span>
                    <span className="text-cx-fg text-right">{selected.recurrence}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-cx-fg-dim">Effort</span>
                    <span className="text-cx-fg">{selected.effortDays} days</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-cx-fg-dim">Detected</span>
                    <span className="text-cx-fg">{selected.lastDetected}</span>
                  </div>
                </div>

                <div>
                  <p className="text-2xs uppercase text-cx-fg-dim mb-1">Impact</p>
                  <p className="text-xs text-cx-fg-dim leading-relaxed">{selected.impact}</p>
                </div>

                {selected.knowledgeNodeId && (
                  <button
                    type="button"
                    onClick={() => onViewKnowledgeNode?.(selected.knowledgeNodeId)}
                    className="flex items-center gap-2 w-full p-3 rounded-xl border border-cx-border bg-cx-raised/30 text-xs text-cx-accent hover:bg-cx-accent/5 transition-colors"
                  >
                    <Link2 className="w-3.5 h-3.5" />
                    View in Knowledge Graph
                    <ChevronRight className="w-3 h-3 ml-auto" />
                  </button>
                )}

                <div>
                  <p className="text-2xs uppercase text-cx-fg-dim mb-2 flex items-center gap-1.5">
                    <Bot className="w-3.5 h-3.5" /> Bound Agents & Logic
                  </p>
                  <div className="space-y-3">
                    {boundAgents.map((agent) => (
                      <div
                        key={agent.id}
                        className="p-3 rounded-xl border border-dashed"
                        style={{ borderColor: `${categoryColor}40`, backgroundColor: `${categoryColor}06` }}
                      >
                        <div className="flex items-center justify-between mb-1.5 gap-2">
                          <p className="text-xs font-medium text-cx-fg">{agent.name}</p>
                          <span
                            className="text-[9px] uppercase px-1 py-0.5 rounded shrink-0"
                            style={{
                              backgroundColor: `${RUNTIME_TYPES[agent.runtimeType]?.color ?? '#5ec8f2'}20`,
                              color: RUNTIME_TYPES[agent.runtimeType]?.color ?? '#5ec8f2',
                            }}
                          >
                            {getRuntimeShort(agent.runtimeType)}
                          </span>
                        </div>
                        <p className="text-[11px] text-cx-fg-dim leading-relaxed mb-2">{agent.role}</p>
                        <div className="flex flex-wrap gap-1">
                          {agent.skills?.slice(0, 3).map((s) => (
                            <span key={s} className="text-[9px] px-1 py-0.5 rounded border border-cx-border text-cx-fg-dim">
                              {s}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div
                  className="p-3 rounded-xl border"
                  style={{ borderColor: `${categoryColor}30`, backgroundColor: `${categoryColor}08` }}
                >
                  <p className="text-2xs uppercase text-cx-fg-dim mb-1 flex items-center gap-1">
                    <Zap className="w-3 h-3" /> Remediation
                  </p>
                  <p className="text-xs text-cx-fg leading-relaxed">{selected.remediation}</p>
                </div>

                {selected.harnessTask && (
                  <Link
                    to="/harness"
                    className="flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-xl border border-cx-success/40 bg-cx-success/10 text-xs text-cx-success hover:bg-cx-success/20 transition-colors"
                  >
                    <Play className="w-3.5 h-3.5" />
                    Run via Harness
                  </Link>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </GlassPanel>
      </div>
    </div>
  )
}
