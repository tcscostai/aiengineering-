import { motion } from 'framer-motion'
import { AlertTriangle, Ban, Bot, ChevronRight, DollarSign, ShieldAlert } from 'lucide-react'
import { GlassPanel } from '../ui/GlassPanel'
import { CATEGORIES } from '../../lib/constants'

const SEVERITY_STYLES = {
  critical: { border: 'border-cx-danger/50', bg: 'bg-cx-danger/10', text: 'text-cx-danger', badge: 'bg-cx-danger/20' },
  high: { border: 'border-cx-danger/40', bg: 'bg-cx-danger/5', text: 'text-cx-danger', badge: 'bg-cx-danger/15' },
  medium: { border: 'border-cx-warn/40', bg: 'bg-cx-warn/5', text: 'text-cx-warn', badge: 'bg-cx-warn/15' },
  low: { border: 'border-cx-border', bg: 'bg-cx-raised/20', text: 'text-cx-fg-dim', badge: 'bg-cx-raised/40' },
}

export function FinOpsCostAlertsPanel({ alerts, summary, formatUsd, onGoToRules }) {
  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-3 gap-4">
        <GlassPanel className="p-5 border-cx-danger/30 bg-cx-danger/5">
          <p className="text-2xs uppercase text-cx-fg-dim mb-1">Agents with issues</p>
          <p className="font-display text-3xl font-semibold text-cx-danger">{summary.agentsWithIssues}</p>
          <p className="text-xs text-cx-fg-dim mt-1">{summary.totalAlerts} active cost alerts</p>
        </GlassPanel>
        <GlassPanel className="p-5 border-cx-warn/30 bg-cx-warn/5">
          <p className="text-2xs uppercase text-cx-fg-dim mb-1">Avoidable extra cost</p>
          <p className="font-display text-3xl font-semibold text-cx-warn">{formatUsd(summary.totalExtraCostUsd)}</p>
          <p className="text-xs text-cx-fg-dim mt-1">recoverable MTD if issues fixed</p>
        </GlassPanel>
        <GlassPanel className="p-5">
          <p className="text-2xs uppercase text-cx-fg-dim mb-1">Worst offender</p>
          {summary.agentRankings[0] ? (
            <>
              <p className="font-display text-lg font-semibold text-cx-fg truncate">{summary.agentRankings[0].agentName}</p>
              <p className="text-xs text-cx-danger font-mono mt-1">+{formatUsd(summary.agentRankings[0].extraCostUsd)} extra</p>
            </>
          ) : (
            <p className="text-sm text-cx-fg-dim">No issues detected</p>
          )}
        </GlassPanel>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <GlassPanel hero className="lg:col-span-2 p-6">
          <div className="flex items-center gap-2 mb-4">
            <ShieldAlert className="w-5 h-5 text-cx-danger" />
            <div>
              <p className="text-2xs uppercase text-cx-accent tracking-widest">Cost Guardrails</p>
              <h2 className="font-display text-lg font-semibold text-cx-fg">Agent cost violations</h2>
            </div>
          </div>

          {alerts.length === 0 ? (
            <p className="text-sm text-cx-fg-dim py-8 text-center">All agents are within cost benchmarks.</p>
          ) : (
            <div className="space-y-3">
              {alerts.map((alert, i) => {
                const sev = SEVERITY_STYLES[alert.severity] ?? SEVERITY_STYLES.low
                const cat = CATEGORIES[alert.category]
                return (
                  <motion.div
                    key={alert.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className={`p-4 rounded-xl border ${sev.border} ${sev.bg}`}
                  >
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-start gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-lg border border-cx-border bg-cx-panel/50 flex items-center justify-center shrink-0">
                          <Bot className="w-4 h-4" style={{ color: cat?.color }} />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <p className="text-sm font-medium text-cx-fg">{alert.agentName}</p>
                            <span className="text-[9px] uppercase px-1.5 py-0.5 rounded" style={{ color: cat?.color, backgroundColor: `${cat?.color}15` }}>
                              {cat?.short}
                            </span>
                            <span className={`text-[9px] uppercase px-1.5 py-0.5 rounded ${sev.badge} ${sev.text}`}>
                              {alert.severity}
                            </span>
                          </div>
                          <p className="text-xs text-cx-fg-muted">{alert.issueLabel}</p>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="font-mono text-sm text-cx-danger">+{formatUsd(alert.extraCostUsd)}</p>
                        <p className="text-[9px] text-cx-fg-dim">extra MTD</p>
                      </div>
                    </div>

                    <p className="text-xs text-cx-fg-dim leading-relaxed mb-3">{alert.problem}</p>

                    <div className="p-3 rounded-lg border border-cx-danger/20 bg-cx-danger/5 mb-3">
                      <div className="flex items-center gap-1.5 mb-1">
                        <Ban className="w-3.5 h-3.5 text-cx-danger shrink-0" />
                        <p className="text-[10px] uppercase text-cx-danger font-medium">Avoid</p>
                      </div>
                      <p className="text-xs text-cx-fg-muted leading-relaxed">{alert.avoid}</p>
                    </div>

                    <div className="flex items-center justify-between gap-3">
                      <p className="text-xs text-cx-accent">
                        <span className="text-cx-fg-dim">Fix: </span>{alert.recommendation}
                      </p>
                      {onGoToRules && (
                        <button
                          type="button"
                          onClick={onGoToRules}
                          className="flex items-center gap-1 text-[10px] text-cx-accent hover:underline shrink-0"
                        >
                          Prompt Rules
                          <ChevronRight className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </motion.div>
                )
              })}
            </div>
          )}
        </GlassPanel>

        <div className="space-y-4">
          <GlassPanel className="p-5">
            <p className="text-2xs uppercase text-cx-fg-dim mb-3">Agents ranked by extra cost</p>
            {summary.agentRankings.length === 0 ? (
              <p className="text-xs text-cx-fg-dim">No offenders</p>
            ) : (
              <div className="space-y-2">
                {summary.agentRankings.map((a, i) => {
                  const cat = CATEGORIES[a.category]
                  const sev = SEVERITY_STYLES[a.highestSeverity] ?? SEVERITY_STYLES.low
                  return (
                    <div key={a.agentId} className="flex items-center gap-3 p-2.5 rounded-lg border border-cx-border bg-cx-raised/20">
                      <span className="font-mono text-xs text-cx-fg-dim w-4">{i + 1}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-cx-fg truncate">{a.agentName}</p>
                        <p className="text-[10px] text-cx-fg-dim">{a.alertCount} issue{a.alertCount > 1 ? 's' : ''}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="font-mono text-xs text-cx-danger">+{formatUsd(a.extraCostUsd)}</p>
                        <span className={`text-[8px] uppercase px-1 rounded ${sev.badge} ${sev.text}`}>{a.highestSeverity}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </GlassPanel>

          <GlassPanel className="p-5">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="w-4 h-4 text-cx-warn" />
              <p className="text-xs font-medium text-cx-fg">Platform — do not</p>
            </div>
            <ul className="space-y-3">
              {summary.avoidGuidelines.map((g) => (
                <li key={g.id} className="text-[11px] leading-relaxed">
                  <p className="text-cx-fg-muted font-medium mb-0.5">{g.title}</p>
                  <p className="text-cx-fg-dim">{g.detail}</p>
                </li>
              ))}
            </ul>
          </GlassPanel>

          <GlassPanel className="p-5">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="w-4 h-4 text-cx-accent" />
              <p className="text-xs font-medium text-cx-fg">Quick actions</p>
            </div>
            <ul className="text-[11px] text-cx-fg-dim space-y-2">
              <li>• Review worst agents in Agent Onboarding Studio</li>
              <li>• Enable tiered model routing in Prompt Rules</li>
              <li>• Cap output tokens on high-volume harness runs</li>
              <li>• Re-evaluate Cost dimension before publishing</li>
            </ul>
          </GlassPanel>
        </div>
      </div>
    </div>
  )
}
