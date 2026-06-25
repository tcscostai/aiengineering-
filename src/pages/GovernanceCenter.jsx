import { useState, useMemo, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Shield,
  CheckCircle,
  Clock,
  FileText,
  Play,
  Loader2,
  AlertTriangle,
  XCircle,
  UserCheck,
  Scan,
  SlidersHorizontal,
  ShieldCheck,
} from 'lucide-react'
import { PageHeader } from '../components/ui/PageHeader'
import { GlassPanel } from '../components/ui/GlassPanel'
import { ProgressBar } from '../components/ui/ProgressBar'
import { useApp } from '../context/AppContext'
import { getStageLabel, CATEGORIES } from '../lib/constants'
import {
  computePolicyCoverage,
  getGovernanceQueue,
  getAuditLog,
  getAgentPolicyResults,
  approveAgentGovernance,
  requestGovernanceChanges,
  runComplianceScan,
  GOVERNANCE_POLICIES,
} from '../services/governanceService'
import { useGovernanceRules } from '../hooks/useGovernanceRules'
import { PlatformRulesPanel } from '../components/shared/PlatformRulesPanel'
import {
  GUARDRAIL_ENFORCEMENT_MODES,
  GUARDRAIL_CATEGORIES,
  GUARDRAIL_SCOPE_OPTIONS,
} from '../data/governanceGuardrails'
import { computeGuardrailCoverage, evaluateGuardrailAgainstAgent } from '../services/governanceRulesService'

const GUARDRAIL_RULE_TYPES = [
  { id: 'require_fields', label: 'Require fields' },
  { id: 'hipaa_binding', label: 'HIPAA binding' },
  { id: 'require_governance_approval', label: 'Governance approval' },
  { id: 'min_eval_dimension', label: 'Min eval dimension' },
  { id: 'require_skill', label: 'Require skill' },
  { id: 'require_knowledge', label: 'Require knowledge source' },
]

const GUARDRAIL_ENFORCEMENT_OPTS = ['monitor', 'warn', 'block']

const PAGE_TABS = [
  { id: 'operations', label: 'Approvals & Audit', icon: ShieldCheck },
  { id: 'guardrails', label: 'Guardrails & Rules', icon: SlidersHorizontal },
]

function AgentQueueButton({ agent, selected, onSelect }) {
  return (
    <button
      type="button"
      onClick={() => onSelect(agent.id)}
      className={`w-full text-left p-3 rounded-xl border transition-colors ${
        selected
          ? 'border-cx-accent/50 bg-cx-accent/10'
          : 'border-cx-border bg-cx-raised/20 hover:border-cx-accent/30'
      }`}
    >
      <div className="flex items-center gap-2">
        {agent.governanceApproved ? (
          <CheckCircle className="w-4 h-4 text-cx-success shrink-0" />
        ) : (
          <Clock className="w-4 h-4 text-cx-warn shrink-0" />
        )}
        <div className="min-w-0">
          <p className="text-xs font-medium text-cx-fg truncate">{agent.name}</p>
          <p className="text-[10px] text-cx-fg-dim">{getStageLabel(agent.stage)}</p>
        </div>
      </div>
    </button>
  )
}

export default function GovernanceCenter() {
  const { agents, addNotification } = useApp()
  const guardrailsHook = useGovernanceRules()
  const [pageTab, setPageTab] = useState('operations')
  const [selectedId, setSelectedId] = useState(null)
  const [approverName, setApproverName] = useState('Governance Reviewer')
  const [changeNote, setChangeNote] = useState('')
  const [scanning, setScanning] = useState(false)
  const [activeScan, setActiveScan] = useState(null)
  const [auditLog, setAuditLog] = useState(() => getAuditLog())
  const [selectedPolicy, setSelectedPolicy] = useState(null)

  const refresh = useCallback(() => {
    setAuditLog(getAuditLog())
  }, [])

  useEffect(() => {
    const handler = () => refresh()
    window.addEventListener('horizon-storage', handler)
    return () => window.removeEventListener('horizon-storage', handler)
  }, [refresh])

  const governedAgents = useMemo(
    () => agents.filter((a) => a.stage !== 'draft'),
    [agents]
  )
  const policies = useMemo(() => computePolicyCoverage(agents), [agents])
  const { needsApproval, approved } = useMemo(() => getGovernanceQueue(agents), [agents])

  const selectedAgent = useMemo(
    () => governedAgents.find((a) => a.id === selectedId) ?? needsApproval[0] ?? governedAgents[0] ?? null,
    [governedAgents, selectedId, needsApproval]
  )

  useEffect(() => {
    if (selectedAgent && !selectedId) setSelectedId(selectedAgent.id)
  }, [selectedAgent, selectedId])

  const agentPolicies = selectedAgent ? getAgentPolicyResults(selectedAgent) : []
  const overallCompliance = policies.length
    ? Math.round(policies.reduce((s, p) => s + p.coverage, 0) / policies.length)
    : 0

  const handleApprove = () => {
    if (!selectedAgent) return
    const result = approveAgentGovernance(selectedAgent.id, approverName)
    if (result.ok) {
      addNotification(`Approved — ${selectedAgent.name}`, 'success')
      refresh()
    }
  }

  const handleRequestChanges = () => {
    if (!selectedAgent) return
    requestGovernanceChanges(selectedAgent.id, changeNote, approverName)
    addNotification(`Change request logged for ${selectedAgent.name}`, 'info')
    setChangeNote('')
    refresh()
  }

  const handleComplianceScan = async () => {
    if (!selectedAgent || scanning) return
    setScanning(true)
    setActiveScan(null)
    addNotification(`Compliance scan — ${selectedAgent.name}`, 'info')
    try {
      const scan = await runComplianceScan(selectedAgent, (p) =>
        setActiveScan({ ...p, agentName: selectedAgent.name })
      )
      setActiveScan(scan)
      addNotification(`Scan complete — ${scan.coverage}% coverage`, scan.status === 'compliant' ? 'success' : 'warn')
      refresh()
    } finally {
      setScanning(false)
    }
  }

  const policyAgents = useMemo(() => {
    if (!selectedPolicy) return []
    const builtin = GOVERNANCE_POLICIES.find((p) => p.id === selectedPolicy)
    if (builtin) {
      return agents
        .filter((a) => a.stage !== 'draft')
        .map((a) => ({ agent: a, pass: builtin.check(a) }))
    }
    const coverage = computeGuardrailCoverage(agents).find((g) => g.id === selectedPolicy)
    if (!coverage?.guardrail) return []
    return agents
      .filter((a) => a.stage !== 'draft')
      .map((a) => {
        const r = evaluateGuardrailAgainstAgent(coverage.guardrail, a)
        return { agent: a, pass: r.skipped ? true : r.pass }
      })
  }, [selectedPolicy, agents])

  return (
    <div>
      <PageHeader
        eyebrow="Compliance"
        title="Governance Center"
        description="Approve agents, configure guardrails, upload compliance rule packs, and track audit trails."
        actions={
          <Link
            to="/onboarding"
            className="flex items-center gap-2 px-3 py-2 rounded-xl border border-cx-accent/40 bg-cx-accent/10 text-xs text-cx-accent"
          >
            <UserCheck className="w-3.5 h-3.5" /> Onboarding Studio
          </Link>
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
            {t.id === 'guardrails' && guardrailsHook.impact.activeCount > 0 && (
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-cx-accent/20">{guardrailsHook.impact.activeCount}</span>
            )}
          </button>
        ))}
      </div>

      {pageTab === 'guardrails' && (
        <PlatformRulesPanel
          title="Governance Guardrails & Compliance Rules"
          subtitle="HIPAA, Responsible AI, human approval gates, and custom guardrails. Block mode prevents publish; upload JSON rule packs from your compliance team."
          itemLabel="guardrail"
          config={guardrailsHook.config}
          impact={guardrailsHook.impact}
          rules={guardrailsHook.config.guardrails}
          enforcementModes={GUARDRAIL_ENFORCEMENT_MODES}
          categories={GUARDRAIL_CATEGORIES}
          scopeOptions={GUARDRAIL_SCOPE_OPTIONS}
          ruleTypes={GUARDRAIL_RULE_TYPES}
          enforcementOptions={GUARDRAIL_ENFORCEMENT_OPTS}
          onToggle={guardrailsHook.toggleGuardrail}
          onUpdateParam={guardrailsHook.updateGuardrailParam}
          onUpdateRule={guardrailsHook.updateGuardrail}
          onSetEnforcementMode={guardrailsHook.setEnforcementMode}
          onReset={guardrailsHook.resetToDefaults}
          onAddCustom={guardrailsHook.addCustomGuardrail}
          onDeleteCustom={guardrailsHook.deleteCustomGuardrail}
          onExport={guardrailsHook.exportJSON}
          onImport={guardrailsHook.importJSON}
          addNotification={addNotification}
        />
      )}

      {pageTab === 'operations' && (
        <>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Policy Coverage', value: `${overallCompliance}%`, icon: Shield, color: '#3ecf9b' },
          { label: 'Approved Agents', value: approved.length, icon: CheckCircle, color: '#5ec8f2' },
          { label: 'Pending Approval', value: needsApproval.length, icon: Clock, color: needsApproval.length ? '#e8b84a' : '#3ecf9b' },
          { label: 'Governed Agents', value: agents.filter((a) => a.stage !== 'draft').length, icon: FileText, color: '#9b8bd4' },
        ].map((m) => (
          <GlassPanel key={m.label} className="p-4">
            <m.icon className="w-4 h-4 mb-2" style={{ color: m.color }} />
            <p className="text-[10px] uppercase text-cx-fg-dim">{m.label}</p>
            <p className="font-display text-xl font-semibold text-cx-fg mt-1">{m.value}</p>
          </GlassPanel>
        ))}
      </div>

      <GlassPanel className="p-4 mb-6">
        <p className="text-2xs uppercase text-cx-fg-dim tracking-widest mb-3">Policy Matrix · click to drill down</p>
        <div className="grid md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-3 max-h-[320px] overflow-y-auto">
          {policies.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setSelectedPolicy(selectedPolicy === p.id ? null : p.id)}
              className={`text-left p-3 rounded-xl border transition-colors ${
                selectedPolicy === p.id
                  ? 'border-cx-accent/50 bg-cx-accent/10'
                  : 'border-cx-border bg-cx-raised/20 hover:border-cx-accent/30'
              }`}
            >
              <Shield
                className={`w-4 h-4 mb-2 ${
                  p.status === 'compliant' ? 'text-cx-success' : p.status === 'partial' ? 'text-cx-warn' : 'text-cx-danger'
                }`}
              />
              <p className="text-xs text-cx-fg mb-1 line-clamp-2">{p.label}</p>
              <p className="font-mono text-sm text-cx-success">{p.coverage}%</p>
              <div className="flex gap-1 mt-1">
                {p.source === 'guardrail' && (
                  <span className="text-[8px] uppercase px-1 py-0.5 rounded bg-cx-accent/10 text-cx-accent">guardrail</span>
                )}
                {p.custom && (
                  <span className="text-[8px] uppercase px-1 py-0.5 rounded bg-cx-success/10 text-cx-success">custom</span>
                )}
              </div>
            </button>
          ))}
        </div>
        <button type="button" onClick={() => setPageTab('guardrails')} className="text-xs text-cx-accent hover:underline mt-3">
          Manage guardrails & upload rules →
        </button>

        {selectedPolicy && policyAgents.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 p-4 rounded-xl border border-cx-border bg-cx-raised/20"
          >
              <p className="text-xs text-cx-fg-dim mb-2">
              {policies.find((p) => p.id === selectedPolicy)?.label ??
                GOVERNANCE_POLICIES.find((p) => p.id === selectedPolicy)?.label} — per-agent status
            </p>
            <div className="flex flex-wrap gap-2">
              {policyAgents.map(({ agent, pass }) => (
                <span
                  key={agent.id}
                  className={`text-[10px] px-2 py-1 rounded-lg border ${
                    pass
                      ? 'border-cx-success/30 bg-cx-success/10 text-cx-success'
                      : 'border-cx-warn/30 bg-cx-warn/10 text-cx-warn'
                  }`}
                >
                  {agent.name}
                </span>
              ))}
            </div>
          </motion.div>
        )}
      </GlassPanel>

      <div className="grid lg:grid-cols-[260px_1fr_300px] gap-6">
        <GlassPanel className="p-4 h-fit lg:max-h-[560px] overflow-y-auto">
          <p className="text-2xs uppercase text-cx-fg-dim tracking-widest mb-3">Approval Queue</p>
          {governedAgents.length === 0 ? (
            <p className="text-xs text-cx-fg-dim">No agents to govern yet.</p>
          ) : (
            <div className="space-y-3">
              {needsApproval.length > 0 && (
                <div>
                  <p className="text-[10px] uppercase text-cx-warn mb-1.5">Pending ({needsApproval.length})</p>
                  <div className="space-y-2">
                    {needsApproval.map((a) => (
                      <AgentQueueButton key={a.id} agent={a} selected={a.id === selectedAgent?.id} onSelect={setSelectedId} />
                    ))}
                  </div>
                </div>
              )}
              <div>
                <p className="text-[10px] uppercase text-cx-fg-dim mb-1.5">All Governed ({governedAgents.length})</p>
                <div className="space-y-2">
                  {governedAgents.map((a) => (
                    <AgentQueueButton key={a.id} agent={a} selected={a.id === selectedAgent?.id} onSelect={setSelectedId} />
                  ))}
                </div>
              </div>
            </div>
          )}
        </GlassPanel>

        <div className="space-y-6">
          {selectedAgent ? (
            <GlassPanel hero className="p-6">
              <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
                <div>
                  <p className="text-2xs uppercase text-cx-accent tracking-widest">Agent Governance</p>
                  <h2 className="font-display text-lg text-cx-fg mt-1">{selectedAgent.name}</h2>
                  <p className="text-xs text-cx-fg-dim">
                    {CATEGORIES[selectedAgent.category]?.short} · {getStageLabel(selectedAgent.stage)}
                  </p>
                </div>
                <span
                  className={`text-2xs uppercase px-2 py-1 rounded-md ${
                    selectedAgent.governanceApproved
                      ? 'bg-cx-success/10 text-cx-success'
                      : 'bg-cx-warn/10 text-cx-warn'
                  }`}
                >
                  {selectedAgent.governanceApproved ? 'approved' : 'pending'}
                </span>
              </div>

              <div className="grid sm:grid-cols-2 gap-3 mb-4">
                {agentPolicies.map((p) => (
                  <div
                    key={p.id}
                    className={`p-3 rounded-xl border ${
                      p.pass ? 'border-cx-success/30 bg-cx-success/5' : 'border-cx-warn/30 bg-cx-warn/5'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      {p.pass ? (
                        <CheckCircle className="w-3.5 h-3.5 text-cx-success" />
                      ) : (
                        <XCircle className="w-3.5 h-3.5 text-cx-warn" />
                      )}
                      <span className="text-xs font-medium text-cx-fg">{p.label}</span>
                    </div>
                    <p className="text-[10px] text-cx-fg-dim">{p.description}</p>
                  </div>
                ))}
              </div>

              {activeScan?.policies && (
                <div className="mb-4 p-3 rounded-xl border border-cx-border bg-cx-raised/30">
                  <p className="text-[10px] uppercase text-cx-fg-dim mb-2">
                    Scan result · {activeScan.coverage}% coverage
                  </p>
                  <ProgressBar value={activeScan.coverage} />
                </div>
              )}

              {!selectedAgent.governanceApproved && (
                <div className="space-y-3 p-4 rounded-xl border border-cx-border bg-cx-raised/20">
                  <p className="text-xs text-cx-fg font-medium">Governance Actions</p>
                  <div>
                    <label className="text-2xs uppercase text-cx-fg-dim">Approver Name</label>
                    <input
                      className="w-full mt-1 px-3 py-2 rounded-xl border border-cx-border bg-cx-panel/50 text-sm text-cx-fg"
                      value={approverName}
                      onChange={(e) => setApproverName(e.target.value)}
                    />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={handleApprove}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl border border-cx-success/40 bg-cx-success/10 text-cx-success text-sm"
                    >
                      <CheckCircle className="w-4 h-4" /> Approve
                    </button>
                    <button
                      onClick={handleComplianceScan}
                      disabled={scanning}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl border border-cx-accent/40 bg-cx-accent/10 text-cx-accent text-sm disabled:opacity-50"
                    >
                      {scanning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Scan className="w-4 h-4" />}
                      {scanning ? 'Scanning…' : 'Run Compliance Scan'}
                    </button>
                  </div>
                  <div>
                    <label className="text-2xs uppercase text-cx-fg-dim">Request Changes</label>
                    <textarea
                      className="w-full mt-1 px-3 py-2 rounded-xl border border-cx-border bg-cx-panel/50 text-sm text-cx-fg min-h-[60px]"
                      value={changeNote}
                      onChange={(e) => setChangeNote(e.target.value)}
                      placeholder="Note for agent owner…"
                    />
                    <button
                      onClick={handleRequestChanges}
                      className="mt-2 text-xs text-cx-warn hover:underline"
                    >
                      Submit change request
                    </button>
                  </div>
                </div>
              )}

              {selectedAgent.governanceApproved && (
                <div className="p-4 rounded-xl border border-cx-success/30 bg-cx-success/5">
                  <p className="text-sm text-cx-fg">
                    Approved by <span className="text-cx-success">{selectedAgent.governanceApprover}</span>
                  </p>
                  <button
                    onClick={handleComplianceScan}
                    disabled={scanning}
                    className="mt-3 flex items-center gap-2 px-3 py-1.5 rounded-lg border border-cx-border text-xs text-cx-fg-dim hover:text-cx-fg"
                  >
                    {scanning ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
                    Re-run compliance scan
                  </button>
                </div>
              )}
            </GlassPanel>
          ) : (
            <GlassPanel className="p-12 text-center text-sm text-cx-fg-dim">
              Onboard agents to manage governance approvals.
            </GlassPanel>
          )}
        </div>

        <GlassPanel className="p-4 h-fit lg:max-h-[560px] overflow-y-auto">
          <p className="text-2xs uppercase text-cx-fg-dim tracking-widest mb-3">Audit Trail</p>
          <div className="space-y-3">
            {auditLog.map((entry, i) => (
              <motion.div
                key={entry.id}
                initial={{ opacity: 0, x: 8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.02 }}
                className="flex gap-3 p-3 rounded-xl border border-cx-border bg-cx-raised/20"
              >
                {entry.status === 'approved' || entry.status === 'compliant' ? (
                  <CheckCircle className="w-4 h-4 text-cx-success shrink-0 mt-0.5" />
                ) : entry.status === 'pending' || entry.status === 'running' ? (
                  <Clock className="w-4 h-4 text-cx-warn shrink-0 mt-0.5" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-cx-accent shrink-0 mt-0.5" />
                )}
                <div>
                  <p className="text-xs text-cx-fg">{entry.action}</p>
                  <p className="text-[10px] text-cx-fg-dim">{entry.entity}</p>
                  {entry.actor && (
                    <p className="text-[10px] text-cx-fg-dim">by {entry.actor}</p>
                  )}
                  <p className="text-[9px] text-cx-fg-dim mt-1">
                    {new Date(entry.timestamp).toLocaleString()}
                  </p>
                </div>
              </motion.div>
            ))}
            {auditLog.length === 0 && (
              <p className="text-xs text-cx-fg-dim">Actions will appear here as you approve agents and run scans.</p>
            )}
          </div>
        </GlassPanel>
      </div>
        </>
      )}
    </div>
  )
}
