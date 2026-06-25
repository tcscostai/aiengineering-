import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import {
  DollarSign,
  Coins,
  TrendingUp,
  TrendingDown,
  Zap,
  Database,
  AlertTriangle,
  RefreshCw,
  PiggyBank,
  Gauge,
  ArrowUpRight,
  SlidersHorizontal,
  ShieldAlert,
} from 'lucide-react'
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
  PieChart,
  Pie,
  Cell,
} from 'recharts'
import { PageHeader } from '../components/ui/PageHeader'
import { GlassPanel } from '../components/ui/GlassPanel'
import { MetricCard } from '../components/ui/MetricCard'
import { ProgressBar } from '../components/ui/ProgressBar'
import { useApp } from '../context/AppContext'
import { computeFinOpsDashboard } from '../services/finOpsService'
import { CATEGORIES } from '../lib/constants'
import { useFinOpsRules } from '../hooks/useFinOpsRules'
import { PromptOptimizationRulesPanel } from '../components/finops/PromptOptimizationRulesPanel'
import { FinOpsCostAlertsPanel } from '../components/finops/FinOpsCostAlertsPanel'

const SEVERITY_STYLES = {
  critical: 'border-cx-danger/40 bg-cx-danger/10 text-cx-danger',
  warn: 'border-cx-warn/40 bg-cx-warn/10 text-cx-warn',
  info: 'border-cx-accent/40 bg-cx-accent/10 text-cx-accent',
  high: 'border-cx-danger/30 bg-cx-danger/5',
  medium: 'border-cx-warn/30 bg-cx-warn/5',
  low: 'border-cx-border bg-cx-raised/20',
}

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border border-cx-border bg-cx-panel/95 px-3 py-2 text-xs shadow-xl">
      <p className="text-cx-fg-dim mb-1">{label}</p>
      {payload.map((p) => (
        <p key={p.dataKey} style={{ color: p.color }} className="font-mono">
          {p.name}: {typeof p.value === 'number' && p.dataKey === 'cost' ? `$${p.value.toLocaleString()}` : p.value?.toLocaleString?.() ?? p.value}
        </p>
      ))}
    </div>
  )
}

export default function FinOpsCenter() {
  const { agents } = useApp()
  const rulesHook = useFinOpsRules()
  const [tab, setTab] = useState('overview')
  const finops = useMemo(() => computeFinOpsDashboard(agents), [agents])
  const { formatUsd, formatTokens } = finops
  const { impact: rulesImpact } = rulesHook

  const forecastDelta = finops.forecastUsd - finops.budget
  const tokenTrend = finops.dailyTrend.map((d) => ({
    ...d,
    tokensM: Math.round(d.tokens / 100_000) / 10,
  }))

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'alerts', label: 'Cost Alerts', icon: ShieldAlert },
    { id: 'tokens', label: 'Token Analytics' },
    { id: 'agents', label: 'Agent Costs' },
    { id: 'rules', label: 'Prompt Rules', icon: SlidersHorizontal },
    { id: 'optimize', label: 'Optimization' },
  ]

  return (
    <div>
      <PageHeader
        eyebrow="Operations · FinOps"
        title="FinOps Center"
        description="Enterprise AI spend intelligence — token consumption, model costs, budget governance, and optimization signals across all onboarded agents."
        actions={
          <div className="flex flex-col items-end gap-1 text-xs text-cx-fg-dim">
            <span className="flex items-center gap-1.5">
              <RefreshCw className="w-3.5 h-3.5 text-cx-success" />
              Synced {finops.lastSync}
            </span>
            <span className="font-mono text-[10px]">{finops.costCenter}</span>
          </div>
        }
      />

      {finops.alerts.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-6">
          {finops.alerts.map((a) => (
            <button
              key={a.id}
              type="button"
              onClick={() => a.id === 'agent-cost' && setTab('alerts')}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs text-left transition-colors ${
                SEVERITY_STYLES[a.level]
              } ${a.id === 'agent-cost' ? 'hover:brightness-110 cursor-pointer' : ''}`}
            >
              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
              {a.message}
              {a.id === 'agent-cost' && <ArrowUpRight className="w-3 h-3 shrink-0 ml-1" />}
            </button>
          ))}
        </div>
      )}

      <div className="flex flex-wrap gap-1 p-1 rounded-xl border border-cx-border bg-cx-panel/50 mb-6 w-fit">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-all ${
              tab === t.id
                ? 'bg-cx-accent/15 text-cx-accent border border-cx-accent/30'
                : 'text-cx-fg-dim hover:text-cx-fg-muted border border-transparent'
            }`}
          >
            {t.icon && <t.icon className="w-4 h-4" />}
            {t.label}
            {t.id === 'rules' && rulesImpact.activeCount > 0 && (
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-cx-success/15 text-cx-success">
                {rulesImpact.activeCount}
              </span>
            )}
            {t.id === 'alerts' && finops.agentAlertSummary.totalAlerts > 0 && (
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-cx-danger/15 text-cx-danger">
                {finops.agentAlertSummary.totalAlerts}
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 mb-6">
        <MetricCard
          label="MTD Spend"
          value={formatUsd(finops.mtdSpendUsd)}
          icon={DollarSign}
          trend={forecastDelta > 0 ? 6 : -4}
          delay={0}
        />
        <MetricCard
          label="Token Volume"
          value={formatTokens(finops.totalTokens)}
          suffix="tokens"
          icon={Coins}
          trend={8}
          delay={0.05}
        />
        <MetricCard
          label="Budget Used"
          value={`${finops.budgetUsedPct}%`}
          suffix={`of ${formatUsd(finops.budget)}`}
          icon={Gauge}
          trend={finops.budgetUsedPct > 80 ? 5 : -2}
          delay={0.1}
        />
        <MetricCard
          label="Cost / 1M Tokens"
          value={`$${finops.avgCostPer1M.toFixed(2)}`}
          icon={TrendingUp}
          trend={-3}
          delay={0.15}
        />
        <MetricCard
          label="Cache Savings"
          value={formatUsd(finops.cacheSavingsUsd)}
          suffix="MTD"
          icon={PiggyBank}
          trend={12}
          delay={0.2}
        />
        <MetricCard
          label="Efficiency Index"
          value={finops.efficiencyIndex}
          suffix="/100"
          icon={Zap}
          trend={2}
          delay={0.25}
        />
      </div>

      {tab === 'alerts' && (
        <FinOpsCostAlertsPanel
          alerts={finops.agentCostAlerts}
          summary={finops.agentAlertSummary}
          formatUsd={formatUsd}
          onGoToRules={() => setTab('rules')}
        />
      )}

      {tab === 'overview' && finops.agentAlertSummary.totalAlerts > 0 && (
        <GlassPanel className="p-4 mb-6 border-cx-danger/30 bg-cx-danger/5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <ShieldAlert className="w-5 h-5 text-cx-danger shrink-0" />
              <div>
                <p className="text-sm font-medium text-cx-fg">
                  {finops.agentAlertSummary.agentsWithIssues} agent(s) causing avoidable extra spend
                </p>
                <p className="text-xs text-cx-fg-dim">
                  +{formatUsd(finops.agentAlertSummary.totalExtraCostUsd)} MTD recoverable · worst:{' '}
                  {finops.agentAlertSummary.agentRankings[0]?.agentName}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setTab('alerts')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-cx-danger/40 text-xs text-cx-danger hover:bg-cx-danger/10"
            >
              View cost alerts
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </GlassPanel>
      )}

      {tab === 'overview' && (
        <>
          <div className="grid lg:grid-cols-3 gap-6 mb-6">
            <GlassPanel hero className="lg:col-span-2 p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-2xs uppercase text-cx-accent tracking-widest">Daily Burn</p>
                  <h2 className="font-display text-lg font-semibold text-cx-fg">Cost & Token Trend (MTD)</h2>
                </div>
                <div className="text-right text-xs text-cx-fg-dim">
                  <p>Forecast: <span className="font-mono text-cx-fg">{formatUsd(finops.forecastUsd)}</span></p>
                  <p className={forecastDelta > 0 ? 'text-cx-warn' : 'text-cx-success'}>
                    {forecastDelta > 0 ? '+' : ''}{formatUsd(forecastDelta)} vs cap
                  </p>
                </div>
              </div>
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={finops.dailyTrend}>
                    <defs>
                      <linearGradient id="costGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#5ec8f2" stopOpacity={0.35} />
                        <stop offset="100%" stopColor="#5ec8f2" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke="rgba(148,163,184,0.08)" vertical={false} />
                    <XAxis dataKey="day" tick={{ fill: '#8b9cb0', fontSize: 10 }} />
                    <YAxis tick={{ fill: '#8b9cb0', fontSize: 10 }} tickFormatter={(v) => `$${v}`} />
                    <Tooltip content={<ChartTooltip />} />
                    <Area type="monotone" dataKey="cost" name="Cost (USD)" stroke="#5ec8f2" fill="url(#costGrad)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </GlassPanel>

            <GlassPanel className="p-6">
              <p className="text-2xs uppercase text-cx-fg-dim mb-1">Budget</p>
              <h2 className="font-display text-lg font-semibold text-cx-fg mb-4">{finops.fiscalPeriod}</h2>
              <div className="mb-4">
                <div className="flex justify-between text-xs mb-2">
                  <span className="text-cx-fg-dim">Consumed</span>
                  <span className="font-mono text-cx-fg">{formatUsd(finops.mtdSpendUsd)}</span>
                </div>
                <ProgressBar value={finops.budgetUsedPct} />
                <div className="flex justify-between text-[10px] text-cx-fg-dim mt-2">
                  <span>0</span>
                  <span>{formatUsd(finops.budget)} cap</span>
                </div>
              </div>
              <div className="space-y-3 pt-3 border-t border-cx-border">
                <div className="flex justify-between text-xs">
                  <span className="text-cx-fg-dim">Invocations MTD</span>
                  <span className="font-mono text-cx-fg">{finops.invocations.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-cx-fg-dim">Avg daily burn</span>
                  <span className="font-mono text-cx-fg">{formatUsd(finops.mtdSpendUsd / finops.dailyTrend.length)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-cx-fg-dim">Projected EOM</span>
                  <span className={`font-mono ${forecastDelta > 0 ? 'text-cx-warn' : 'text-cx-success'}`}>
                    {formatUsd(finops.forecastUsd)}
                  </span>
                </div>
              </div>
            </GlassPanel>
          </div>

          <div className="grid lg:grid-cols-2 gap-6 mb-6">
            <GlassPanel className="p-6">
              <p className="text-2xs uppercase text-cx-fg-dim mb-4">Spend by Category</p>
              <div className="h-[240px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={finops.byCategory}>
                    <CartesianGrid stroke="rgba(148,163,184,0.08)" vertical={false} />
                    <XAxis dataKey="label" tick={{ fill: '#8b9cb0', fontSize: 11 }} />
                    <YAxis tick={{ fill: '#8b9cb0', fontSize: 10 }} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}K`} />
                    <Tooltip content={<ChartTooltip />} />
                    <Bar dataKey="costUsd" name="Cost (USD)" radius={[6, 6, 0, 0]}>
                      {finops.byCategory.map((c) => (
                        <Cell key={c.id} fill={c.color} fillOpacity={0.85} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-3 gap-2 mt-4">
                {finops.byCategory.map((c) => (
                  <div key={c.id} className="p-2 rounded-lg border border-cx-border bg-cx-raised/20 text-center">
                    <p className="text-[10px] text-cx-fg-dim">{c.label}</p>
                    <p className="font-mono text-sm" style={{ color: c.color }}>{formatUsd(c.costUsd)}</p>
                    <p className="text-[9px] text-cx-fg-dim">{formatTokens(c.tokens)} tok</p>
                  </div>
                ))}
              </div>
            </GlassPanel>

            <GlassPanel className="p-6">
              <p className="text-2xs uppercase text-cx-fg-dim mb-4">Model Cost Mix</p>
              <div className="space-y-3">
                {finops.byModel.map((m, i) => (
                  <motion.div
                    key={m.runtimeType}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className="p-3 rounded-xl border border-cx-border bg-cx-raised/20"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="text-sm text-cx-fg">{m.model}</p>
                        <p className="text-[10px] text-cx-fg-dim">{m.provider}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-mono text-sm text-cx-accent">{formatUsd(m.costUsd)}</p>
                        <p className="text-[10px] text-cx-fg-dim">{m.sharePct}% share</p>
                      </div>
                    </div>
                    <ProgressBar value={m.sharePct} />
                    <p className="text-[10px] text-cx-fg-dim mt-1.5">{formatTokens(m.tokens)} tokens</p>
                  </motion.div>
                ))}
              </div>
            </GlassPanel>
          </div>
        </>
      )}

      {tab === 'tokens' && (
        <div className="grid lg:grid-cols-3 gap-6">
          <GlassPanel hero className="lg:col-span-2 p-6">
            <p className="text-2xs uppercase text-cx-accent tracking-widest mb-1">Token Consumption</p>
            <h2 className="font-display text-lg font-semibold text-cx-fg mb-4">Daily Volume by Type (millions)</h2>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={tokenTrend}>
                  <CartesianGrid stroke="rgba(148,163,184,0.08)" vertical={false} />
                  <XAxis dataKey="day" tick={{ fill: '#8b9cb0', fontSize: 10 }} />
                  <YAxis tick={{ fill: '#8b9cb0', fontSize: 10 }} />
                  <Tooltip content={<ChartTooltip />} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="input" name="Input" stackId="a" fill="#5ec8f2" />
                  <Bar dataKey="output" name="Output" stackId="a" fill="#9b8bd4" />
                  <Bar dataKey="cached" name="Cache" stackId="a" fill="#3ecf9b" />
                  <Bar dataKey="embedding" name="Embedding" stackId="a" fill="#e8b84a" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </GlassPanel>

          <GlassPanel className="p-6">
            <p className="text-2xs uppercase text-cx-fg-dim mb-4">Token Mix (MTD)</p>
            <div className="h-[200px] mb-4">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={finops.tokenMix}
                    dataKey="value"
                    nameKey="label"
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={2}
                  >
                    {finops.tokenMix.map((t) => (
                      <Cell key={t.id} fill={t.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v) => formatTokens(v)} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-2">
              {finops.tokenMix.map((t) => {
                const pct = Math.round((t.value / finops.totalTokens) * 100)
                return (
                  <div key={t.id} className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-2 text-cx-fg-dim">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: t.color }} />
                      {t.label}
                    </span>
                    <span className="font-mono text-cx-fg">{pct}% · {formatTokens(t.value)}</span>
                  </div>
                )
              })}
            </div>
          </GlassPanel>

          <GlassPanel className="lg:col-span-3 p-6">
            <p className="text-2xs uppercase text-cx-fg-dim mb-4">Provider Rate Card (per 1M tokens)</p>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-3">
              {finops.byModel.map((m) => (
                <div key={m.runtimeType} className="p-4 rounded-xl border border-cx-border bg-cx-raised/20">
                  <p className="text-sm font-medium text-cx-fg mb-1">{m.model}</p>
                  <p className="text-[10px] text-cx-fg-dim mb-3">{m.provider}</p>
                  <div className="space-y-1 text-xs font-mono">
                    <p className="text-cx-fg-dim">Spend: <span className="text-cx-accent">{formatUsd(m.costUsd)}</span></p>
                    <p className="text-cx-fg-dim">Volume: <span className="text-cx-fg">{formatTokens(m.tokens)}</span></p>
                    <p className="text-cx-fg-dim">Blended: <span className="text-cx-fg">${m.tokens ? ((m.costUsd / m.tokens) * 1_000_000).toFixed(2) : '0'}/1M</span></p>
                  </div>
                </div>
              ))}
            </div>
          </GlassPanel>
        </div>
      )}

      {tab === 'agents' && (
        <GlassPanel className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-2xs uppercase text-cx-fg-dim">Agent Attribution</p>
              <h2 className="font-display text-lg font-semibold text-cx-fg">Top Consumers by Cost</h2>
            </div>
            <Database className="w-5 h-5 text-cx-accent" />
          </div>
          {finops.topAgents.length === 0 ? (
            <p className="text-sm text-cx-fg-dim py-8 text-center">Onboard agents to see per-agent FinOps attribution.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[10px] uppercase text-cx-fg-dim border-b border-cx-border">
                    <th className="pb-3 pr-4">Agent</th>
                    <th className="pb-3 pr-4">Category</th>
                    <th className="pb-3 pr-4">Model</th>
                    <th className="pb-3 pr-4 text-right">Invocations</th>
                    <th className="pb-3 pr-4 text-right">Tokens</th>
                    <th className="pb-3 pr-4 text-right">Cache %</th>
                    <th className="pb-3 pr-4 text-right">$/1K tok</th>
                    <th className="pb-3 text-right">MTD Cost</th>
                  </tr>
                </thead>
                <tbody>
                  {finops.topAgents.map((a, i) => (
                    <motion.tr
                      key={a.agentId}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.03 }}
                      className="border-b border-cx-border/50 hover:bg-cx-raised/20"
                    >
                      <td className="py-3 pr-4">
                        <p className="text-cx-fg font-medium">{a.agentName}</p>
                        <p className="text-[10px] text-cx-fg-dim">{a.provider}</p>
                      </td>
                      <td className="py-3 pr-4">
                        <span
                          className="text-xs px-2 py-0.5 rounded-md border"
                          style={{
                            color: CATEGORIES[a.category]?.color,
                            borderColor: `${CATEGORIES[a.category]?.color}40`,
                            backgroundColor: `${CATEGORIES[a.category]?.color}10`,
                          }}
                        >
                          {CATEGORIES[a.category]?.short}
                        </span>
                      </td>
                      <td className="py-3 pr-4 text-xs text-cx-fg-muted">{a.model}</td>
                      <td className="py-3 pr-4 text-right font-mono text-cx-fg-dim">{a.invocations.toLocaleString()}</td>
                      <td className="py-3 pr-4 text-right font-mono text-cx-fg">{formatTokens(a.totalTokens)}</td>
                      <td className="py-3 pr-4 text-right font-mono text-cx-fg-dim">{a.cacheHitRate}%</td>
                      <td className="py-3 pr-4 text-right font-mono text-cx-fg-dim">${a.costPer1KTokens.toFixed(4)}</td>
                      <td className="py-3 text-right font-mono text-cx-accent font-medium">{formatUsd(a.costUsd)}</td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </GlassPanel>
      )}

      {tab === 'rules' && (
        <PromptOptimizationRulesPanel rulesHook={rulesHook} formatUsd={formatUsd} />
      )}

      {tab === 'optimize' && (
        <div className="grid lg:grid-cols-2 gap-6">
          <GlassPanel hero className="p-6">
            <p className="text-2xs uppercase text-cx-accent tracking-widest mb-4">Optimization Signals</p>
            <div className="space-y-3">
              {finops.optimizations.map((o, i) => (
                <motion.div
                  key={o.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className={`p-4 rounded-xl border ${SEVERITY_STYLES[o.severity]}`}
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <p className="text-sm font-medium text-cx-fg">{o.title}</p>
                    <span className="text-[9px] uppercase px-1.5 py-0.5 rounded border border-current shrink-0">
                      {o.severity}
                    </span>
                  </div>
                  <p className="text-xs text-cx-fg-dim leading-relaxed mb-3">{o.detail}</p>
                  <button
                    type="button"
                    onClick={() => setTab('rules')}
                    className="flex items-center gap-1 text-xs text-cx-accent hover:underline"
                  >
                    {o.action}
                    <ArrowUpRight className="w-3 h-3" />
                  </button>
                </motion.div>
              ))}
            </div>
          </GlassPanel>

          <GlassPanel className="p-6">
            <p className="text-2xs uppercase text-cx-fg-dim mb-4">Cost Efficiency Levers</p>
            <div className="space-y-4">
              {[
                { label: 'Prompt caching adoption', value: 34, target: 60, impact: '$4.2K/mo' },
                { label: 'Model right-sizing', value: 52, target: 75, impact: '$6.8K/mo' },
                { label: 'Batch inference usage', value: 28, target: 50, impact: '$2.1K/mo' },
                { label: 'Embedding deduplication', value: 71, target: 85, impact: '$1.4K/mo' },
                { label: 'Reserved capacity utilization', value: 82, target: 90, impact: '$3.0K/mo' },
              ].map((lever, i) => (
                <div key={lever.label}>
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-cx-fg-muted">{lever.label}</span>
                    <span className="text-cx-success font-mono">{lever.impact}</span>
                  </div>
                  <ProgressBar value={lever.value} />
                  <p className="text-[10px] text-cx-fg-dim mt-1">Target {lever.target}% · Current {lever.value}%</p>
                </div>
              ))}
            </div>

            <div className="mt-6 p-4 rounded-xl border border-cx-success/30 bg-cx-success/5">
              <div className="flex items-center gap-2 mb-2">
                {forecastDelta > 0 ? (
                  <TrendingUp className="w-4 h-4 text-cx-warn" />
                ) : (
                  <TrendingDown className="w-4 h-4 text-cx-success" />
                )}
                <p className="text-sm font-medium text-cx-fg">Projected savings from active prompt rules</p>
              </div>
              <p className="font-display text-2xl font-semibold text-cx-success">
                {formatUsd(rulesImpact.projectedSavingsUsdMonthly)}
                <span className="text-sm text-cx-fg-dim">/month</span>
              </p>
              <p className="text-xs text-cx-fg-dim mt-1">
                {rulesImpact.activeCount} rules active · ~{rulesImpact.tokenReductionPct}% token reduction ·{' '}
                <button type="button" onClick={() => setTab('rules')} className="text-cx-accent hover:underline">
                  Manage rules
                </button>
              </p>
            </div>
          </GlassPanel>
        </div>
      )}
    </div>
  )
}
