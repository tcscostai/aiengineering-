import { useState, useMemo, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Gauge,
  Play,
  Loader2,
  AlertTriangle,
  CheckCircle,
  Bot,
  Cpu,
  UserPlus,
  TrendingUp,
  SlidersHorizontal,
  ListChecks,
} from 'lucide-react'
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
} from 'recharts'
import { PageHeader } from '../components/ui/PageHeader'
import { GlassPanel } from '../components/ui/GlassPanel'
import { ProgressBar } from '../components/ui/ProgressBar'
import { useApp } from '../context/AppContext'
import { CATEGORIES } from '../lib/constants'
import {
  computeDimensionAggregates,
  computeAgentOverallScore,
  getDimensionBreakdown,
  getAgentsBelowThreshold,
  getEvaluationRuns,
  getEvaluationActivities,
  runAgentEvaluation,
} from '../services/evaluationService'
import { useEvaluationRules } from '../hooks/useEvaluationRules'
import { PlatformRulesPanel } from '../components/shared/PlatformRulesPanel'
import {
  EVAL_ENFORCEMENT_MODES,
  EVAL_RULE_CATEGORIES,
  EVAL_SCOPE_OPTIONS,
} from '../data/evaluationRules'

const EVAL_RULE_TYPES = [
  { id: 'pass_threshold', label: 'Pass threshold' },
  { id: 'dimension_min', label: 'Dimension minimum' },
]

const EVAL_ENFORCEMENT_OPTS = ['monitor', 'warn', 'enforce']

const BAR_COLORS = { pass: '#3ecf9b', fail: '#f08984' }

const PAGE_TABS = [
  { id: 'agents', label: 'Agent Evaluations', icon: ListChecks },
  { id: 'rules', label: 'Rules & Guardrails', icon: SlidersHorizontal },
]

export default function EvaluationCenter() {
  const { agents, addNotification } = useApp()
  const rulesHook = useEvaluationRules()
  const { passThreshold } = rulesHook
  const [pageTab, setPageTab] = useState('agents')
  const [category, setCategory] = useState('all')
  const [selectedId, setSelectedId] = useState(null)
  const [running, setRunning] = useState(false)
  const [activeRun, setActiveRun] = useState(null)
  const [runs, setRuns] = useState(() => getEvaluationRuns())
  const [activities, setActivities] = useState(() => getEvaluationActivities())

  const refresh = useCallback(() => {
    setRuns(getEvaluationRuns())
    setActivities(getEvaluationActivities())
  }, [])

  useEffect(() => {
    const handler = () => refresh()
    window.addEventListener('horizon-storage', handler)
    return () => window.removeEventListener('horizon-storage', handler)
  }, [refresh])

  const filteredAgents = useMemo(() => {
    const list =
      category === 'all' ? agents : agents.filter((a) => a.category === category)
    return list.filter((a) => Object.values(a.evaluation || {}).some((v) => typeof v === 'number'))
  }, [agents, category])

  const selectedAgent = useMemo(
    () => filteredAgents.find((a) => a.id === selectedId) ?? filteredAgents[0] ?? null,
    [filteredAgents, selectedId]
  )

  useEffect(() => {
    if (selectedAgent && !selectedId) setSelectedId(selectedAgent.id)
  }, [selectedAgent, selectedId])

  const dimensions = useMemo(
    () => computeDimensionAggregates(agents, category),
    [agents, category]
  )

  const belowThreshold = useMemo(
    () => getAgentsBelowThreshold(filteredAgents),
    [filteredAgents]
  )

  const avgScore = useMemo(() => {
    const scores = filteredAgents
      .map((a) => computeAgentOverallScore(a))
      .filter((s) => s != null)
    if (!scores.length) return 0
    return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
  }, [filteredAgents])

  const breakdown = selectedAgent ? getDimensionBreakdown(selectedAgent) : []
  const ruleResults = selectedAgent ? rulesHook.evaluateAgent(selectedAgent) : []
  const ruleViolations = ruleResults.filter((r) => !r.pass)
  const radarData = breakdown.map((d) => ({
    dimension: d.label.split(' ')[0],
    score: d.score,
    target: d.target,
  }))

  const handleRunEvaluation = async () => {
    if (!selectedAgent || running) return
    setRunning(true)
    setActiveRun(null)
    addNotification(`Running evaluation — ${selectedAgent.name}`, 'info')
    try {
      const result = await runAgentEvaluation(selectedAgent, (run) => setActiveRun({ ...run }))
      refresh()
      addNotification(
        result.passed
          ? `Evaluation passed (${result.overall}/100)`
          : `Evaluation needs review (${result.overall}/100)`,
        result.passed ? 'success' : 'warn'
      )
    } finally {
      setRunning(false)
    }
  }

  return (
    <div>
      <PageHeader
        eyebrow="Quality Assurance"
        title="Evaluation Center"
        description="Run harness-backed evaluations, configure quality rules and guardrails, upload rule packs — linked to FinOps and governance."
        actions={
          <div className="flex gap-2">
            <Link
              to="/harness"
              className="flex items-center gap-2 px-3 py-2 rounded-xl border border-cx-border text-xs text-cx-fg-dim hover:text-cx-fg"
            >
              <Cpu className="w-3.5 h-3.5" /> Harness
            </Link>
            <Link
              to="/onboarding"
              className="flex items-center gap-2 px-3 py-2 rounded-xl border border-cx-accent/40 bg-cx-accent/10 text-xs text-cx-accent"
            >
              <UserPlus className="w-3.5 h-3.5" /> Onboard Agent
            </Link>
          </div>
        }
      />

      <div className="flex flex-wrap gap-2 mb-6">
        {PAGE_TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setPageTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-sm ${
              pageTab === t.id
                ? 'border-cx-accent/40 bg-cx-accent/10 text-cx-accent'
                : 'border-cx-border text-cx-fg-dim hover:text-cx-fg'
            }`}
          >
            <t.icon className="w-4 h-4" />
            {t.label}
            {t.id === 'rules' && rulesHook.impact.activeCount > 0 && (
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-cx-accent/20">{rulesHook.impact.activeCount}</span>
            )}
          </button>
        ))}
      </div>

      {pageTab === 'rules' && (
        <PlatformRulesPanel
          title="Evaluation Rules & Quality Guardrails"
          subtitle="Define pass thresholds, dimension minimums, and healthcare quality gates. Rules apply at harness evaluation step and block certification when enforced."
          itemLabel="rule"
          config={rulesHook.config}
          impact={rulesHook.impact}
          rules={rulesHook.config.rules}
          enforcementModes={EVAL_ENFORCEMENT_MODES}
          categories={EVAL_RULE_CATEGORIES}
          scopeOptions={EVAL_SCOPE_OPTIONS}
          ruleTypes={EVAL_RULE_TYPES}
          enforcementOptions={EVAL_ENFORCEMENT_OPTS}
          onToggle={rulesHook.toggleRule}
          onUpdateParam={rulesHook.updateRuleParam}
          onUpdateRule={rulesHook.updateRule}
          onSetEnforcementMode={rulesHook.setEnforcementMode}
          onReset={rulesHook.resetToDefaults}
          onAddCustom={rulesHook.addCustomRule}
          onDeleteCustom={rulesHook.deleteCustomRule}
          onExport={rulesHook.exportJSON}
          onImport={rulesHook.importJSON}
          addNotification={addNotification}
        />
      )}

      {pageTab === 'agents' && (
        <>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Platform Avg', value: avgScore || '—', suffix: avgScore ? '/100' : '', icon: Gauge, color: '#5ec8f2' },
          { label: 'Agents Evaluated', value: filteredAgents.length, icon: Bot, color: '#9b8bd4' },
          { label: 'Pass Threshold', value: passThreshold, suffix: '%', icon: TrendingUp, color: '#3ecf9b' },
          { label: 'Below Threshold', value: belowThreshold.length, icon: AlertTriangle, color: belowThreshold.length ? '#f08984' : '#3ecf9b' },
        ].map((m) => (
          <GlassPanel key={m.label} className="p-4">
            <m.icon className="w-4 h-4 mb-2" style={{ color: m.color }} />
            <p className="text-[10px] uppercase text-cx-fg-dim">{m.label}</p>
            <p className="font-display text-xl font-semibold text-cx-fg mt-1">
              {m.value}
              {m.suffix && <span className="text-sm text-cx-fg-dim">{m.suffix}</span>}
            </p>
          </GlassPanel>
        ))}
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        {['all', 'ad', 'ams', 'qe'].map((f) => (
          <button
            key={f}
            onClick={() => setCategory(f)}
            className={`px-3 py-1.5 rounded-lg border text-xs capitalize ${
              category === f
                ? 'border-cx-accent/40 bg-cx-accent/10 text-cx-accent'
                : 'border-cx-border text-cx-fg-dim'
            }`}
          >
            {f === 'all' ? 'All Categories' : CATEGORIES[f].short}
          </button>
        ))}
      </div>

      {filteredAgents.length === 0 ? (
        <GlassPanel className="p-12 text-center">
          <Gauge className="w-10 h-10 text-cx-accent mx-auto mb-4 opacity-50" />
          <p className="text-sm text-cx-fg mb-2">No evaluated agents yet</p>
          <p className="text-xs text-cx-fg-dim mb-4">
            Complete evaluation dimensions in Agent Onboarding Studio, then run evaluations here.
          </p>
          <Link to="/onboarding" className="text-sm text-cx-accent hover:underline">
            Go to Onboarding Studio
          </Link>
        </GlassPanel>
      ) : (
        <div className="grid lg:grid-cols-[260px_1fr_280px] gap-6">
          <GlassPanel className="p-4 h-fit lg:max-h-[640px] overflow-y-auto">
            <p className="text-2xs uppercase text-cx-fg-dim tracking-widest mb-3">Agents</p>
            <div className="space-y-2">
              {filteredAgents.map((a) => {
                const score = computeAgentOverallScore(a)
                const pass = score >= passThreshold
                const selected = a.id === selectedAgent?.id
                return (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() => setSelectedId(a.id)}
                    className={`w-full text-left p-3 rounded-xl border transition-colors ${
                      selected
                        ? 'border-cx-accent/50 bg-cx-accent/10'
                        : 'border-cx-border bg-cx-raised/20 hover:border-cx-accent/30'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-xs font-medium text-cx-fg line-clamp-1">{a.name}</p>
                        <p className="text-[10px] text-cx-fg-dim">{CATEGORIES[a.category]?.short}</p>
                      </div>
                      <span className={`font-mono text-sm ${pass ? 'text-cx-success' : 'text-cx-warn'}`}>
                        {score ?? '—'}
                      </span>
                    </div>
                  </button>
                )
              })}
            </div>
          </GlassPanel>

          <div className="space-y-6">
            {selectedAgent && (
              <GlassPanel hero className="p-6">
                <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
                  <div>
                    <p className="text-2xs uppercase text-cx-accent tracking-widest">Agent Evaluation</p>
                    <h2 className="font-display text-lg text-cx-fg mt-1">{selectedAgent.name}</h2>
                    <p className="text-xs text-cx-fg-dim">{selectedAgent.project} · {selectedAgent.team}</p>
                  </div>
                  <button
                    onClick={handleRunEvaluation}
                    disabled={running}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl border border-cx-success/40 bg-cx-success/10 text-cx-success text-sm disabled:opacity-50"
                  >
                    {running ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                    {running ? 'Evaluating…' : 'Run Evaluation'}
                  </button>
                </div>

                {activeRun && (
                  <div className="mb-4 p-3 rounded-xl border border-cx-border bg-cx-raised/30">
                    <p className="text-[10px] uppercase text-cx-fg-dim mb-2">Live evaluation pipeline</p>
                    <div className="space-y-1.5">
                      {activeRun.steps?.map((s) => (
                        <div key={s.id} className="flex items-center gap-2 text-xs">
                          {s.status === 'complete' ? (
                            <CheckCircle className="w-3.5 h-3.5 text-cx-success shrink-0" />
                          ) : s.status === 'running' ? (
                            <Loader2 className="w-3.5 h-3.5 text-cx-accent animate-spin shrink-0" />
                          ) : (
                            <span className="w-3.5 h-3.5 rounded-full border border-cx-border shrink-0" />
                          )}
                          <span className={s.status === 'complete' ? 'text-cx-fg' : 'text-cx-fg-dim'}>{s.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {ruleResults.length > 0 && (
                  <div className="mb-4 p-3 rounded-xl border border-cx-border bg-cx-raised/30">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-[10px] uppercase text-cx-fg-dim">Active rules · {ruleResults.length} applicable</p>
                      <button type="button" onClick={() => setPageTab('rules')} className="text-[10px] text-cx-accent hover:underline">
                        Manage rules
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {ruleResults.map((r) => (
                        <span
                          key={r.rule.id}
                          className={`text-[9px] px-2 py-0.5 rounded-lg border ${
                            r.pass
                              ? 'border-cx-success/30 bg-cx-success/10 text-cx-success'
                              : 'border-cx-warn/30 bg-cx-warn/10 text-cx-warn'
                          }`}
                          title={r.detail}
                        >
                          {r.rule.name}
                        </span>
                      ))}
                    </div>
                    {ruleViolations.length > 0 && (
                      <p className="text-[10px] text-cx-warn mt-2">{ruleViolations.length} rule violation(s) — adjust scores or update rules</p>
                    )}
                  </div>
                )}

                <div className="grid md:grid-cols-2 gap-4 mb-4">
                  {breakdown.map((d) => (
                    <div key={d.label} className="p-3 rounded-xl border border-cx-border bg-cx-raised/20">
                      <div className="flex justify-between mb-1">
                        <span className="text-xs text-cx-fg-muted">{d.label}</span>
                        <span className={`text-xs font-mono ${d.pass ? 'text-cx-success' : 'text-cx-warn'}`}>
                          {d.score}%
                        </span>
                      </div>
                      <ProgressBar value={d.score} />
                      {!d.pass && (
                        <p className="text-[9px] text-cx-warn mt-1">{Math.abs(d.gap)} pts below threshold</p>
                      )}
                    </div>
                  ))}
                </div>

                {radarData.length > 2 && (
                  <div className="h-[240px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart data={radarData}>
                        <PolarGrid stroke="rgba(148,163,184,0.15)" />
                        <PolarAngleAxis dataKey="dimension" tick={{ fill: '#8b9cb0', fontSize: 10 }} />
                        <Radar name="Score" dataKey="score" stroke="#5ec8f2" fill="#5ec8f2" fillOpacity={0.2} strokeWidth={2} />
                        <Radar name="Target" dataKey="target" stroke="#3ecf9b" fill="transparent" strokeDasharray="4 4" strokeWidth={1} />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </GlassPanel>
            )}

            <GlassPanel className="p-6">
              <p className="text-2xs uppercase text-cx-fg-dim mb-4">Aggregated Dimensions · {category === 'all' ? 'Platform' : CATEGORIES[category].short}</p>
              <div className="grid md:grid-cols-3 gap-3 mb-4">
                {dimensions.map((d, i) => (
                  <motion.div
                    key={d.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.03 }}
                    className="p-3 rounded-xl border border-cx-border bg-cx-raised/30"
                  >
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs text-cx-fg-muted">{d.label}</span>
                      {d.pass ? (
                        <CheckCircle className="w-3.5 h-3.5 text-cx-success" />
                      ) : (
                        <AlertTriangle className="w-3.5 h-3.5 text-cx-warn" />
                      )}
                    </div>
                    <p className="font-display text-xl font-semibold text-cx-accent">{d.score}%</p>
                    <ProgressBar value={d.score} />
                    <p className="text-[9px] text-cx-fg-dim mt-1">{d.agentCount} agents</p>
                  </motion.div>
                ))}
              </div>
              {dimensions.length > 0 && (
                <div className="h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={dimensions} layout="vertical" margin={{ left: 8, right: 16 }}>
                      <XAxis type="number" domain={[0, 100]} tick={{ fill: '#8b9cb0', fontSize: 10 }} />
                      <YAxis type="category" dataKey="label" width={100} tick={{ fill: '#8b9cb0', fontSize: 9 }} />
                      <Tooltip
                        contentStyle={{ background: '#0f1419', border: '1px solid rgba(148,163,184,0.2)', borderRadius: 8 }}
                        labelStyle={{ color: '#e2e8f0' }}
                      />
                      <Bar dataKey="score" radius={[0, 4, 4, 0]}>
                        {dimensions.map((d) => (
                          <Cell key={d.id} fill={d.pass ? BAR_COLORS.pass : BAR_COLORS.fail} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </GlassPanel>
          </div>

          <div className="space-y-6">
            <GlassPanel className="p-4">
              <p className="text-2xs uppercase text-cx-fg-dim tracking-widest mb-3">Recent Runs</p>
              <div className="space-y-2 max-h-[200px] overflow-y-auto">
                {runs.slice(0, 8).map((r) => (
                  <div key={r.id} className="p-2 rounded-lg border border-cx-border bg-cx-raised/20">
                    <p className="text-xs text-cx-fg truncate">{r.agentName}</p>
                    <div className="flex justify-between mt-1">
                      <span className={`text-[10px] uppercase ${r.status === 'passed' ? 'text-cx-success' : 'text-cx-warn'}`}>
                        {r.status?.replace('_', ' ')}
                      </span>
                      <span className="text-[10px] font-mono text-cx-accent">{r.overallScore ?? '—'}</span>
                    </div>
                  </div>
                ))}
                {runs.length === 0 && <p className="text-xs text-cx-fg-dim">No runs yet — select an agent and Run Evaluation.</p>}
              </div>
            </GlassPanel>

            <GlassPanel className="p-4">
              <p className="text-2xs uppercase text-cx-fg-dim tracking-widest mb-3">Activity Feed</p>
              <div className="space-y-2 max-h-[320px] overflow-y-auto">
                {activities.map((act) => (
                  <div key={act.id} className="p-2 rounded-lg border border-cx-border bg-cx-raised/20">
                    <p className="text-xs text-cx-fg">{act.title}</p>
                    <p className="text-[10px] text-cx-fg-dim mt-0.5 line-clamp-2">{act.detail}</p>
                    <p className="text-[9px] text-cx-fg-dim mt-1">
                      {new Date(act.timestamp).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            </GlassPanel>

            {belowThreshold.length > 0 && (
              <GlassPanel className="p-4 border-cx-warn/30">
                <p className="text-2xs uppercase text-cx-warn tracking-widest mb-2">Remediation</p>
                <p className="text-xs text-cx-fg-dim mb-2">
                  {belowThreshold.length} agent{belowThreshold.length > 1 ? 's' : ''} below {passThreshold}% — review rules or re-run harness.
                </p>
                <button type="button" onClick={() => setPageTab('rules')} className="text-xs text-cx-accent hover:underline mr-3">
                  Edit rules →
                </button>
                <Link to="/finops" className="text-xs text-cx-accent hover:underline">
                  Open FinOps Center →
                </Link>
              </GlassPanel>
            )}
          </div>
        </div>
      )}
        </>
      )}
    </div>
  )
}
