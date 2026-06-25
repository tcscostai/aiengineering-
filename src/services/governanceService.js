import { loadJSON, saveJSON, generateId } from '../lib/storage'
import { saveAgent, getAgentById } from './agentService'
import { logEvaluationActivity } from './evaluationService'
import {
  evaluateAgentAgainstGuardrails,
  getGovernanceGuardrailsConfig,
  computeGuardrailCoverage,
} from './governanceRulesService'

const AUDIT_KEY = 'governance_audit'
const SCANS_KEY = 'governance_scans'

export const GOVERNANCE_POLICIES = [
  {
    id: 'rai',
    label: 'Responsible AI',
    description: 'Purpose, owner, and workflow documented with human oversight path',
    check: (a) => Boolean(a.purpose?.trim() && a.owner?.trim() && a.workflowDescription?.trim()),
  },
  {
    id: 'pii',
    label: 'PII Protection',
    description: 'Knowledge sources bound with privacy-compliant data handling',
    check: (a) => a.knowledgeSources?.length > 0 && a.connectionStatus === 'verified',
  },
  {
    id: 'security',
    label: 'Security',
    description: 'Runtime verified and security evaluation dimension ≥ 85',
    check: (a) =>
      a.connectionStatus === 'verified' &&
      (typeof a.evaluation?.Security === 'number' ? a.evaluation.Security >= 85 : true),
  },
  {
    id: 'human',
    label: 'Human Approval',
    description: 'Governance approver assigned and approval recorded',
    check: (a) => a.governanceApproved && Boolean(a.governanceApprover?.trim()),
  },
  {
    id: 'version',
    label: 'Version Control',
    description: 'Semantic version tracked for agent artifact',
    check: (a) => Boolean(a.version?.trim()),
  },
  {
    id: 'audit',
    label: 'Audit Trail',
    description: 'Agent registered beyond draft with update timestamps',
    check: (a) => a.stage !== 'draft' && Boolean(a.updatedAt),
  },
]

function delay(ms) {
  return new Promise((r) => setTimeout(r, ms))
}

export function getAuditLog(limit = 40) {
  return loadJSON(AUDIT_KEY, [])
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    .slice(0, limit)
}

export function logGovernanceAction(entry) {
  const all = loadJSON(AUDIT_KEY, [])
  const item = {
    id: generateId('audit'),
    timestamp: new Date().toISOString(),
    ...entry,
  }
  saveJSON(AUDIT_KEY, [item, ...all].slice(0, 100))
  return item
}

export function computePolicyCoverage(agents) {
  const builtIn = GOVERNANCE_POLICIES.map((policy) => {
    const governed = agents.filter((a) => a.stage !== 'draft')
    const passing = governed.filter((a) => policy.check(a)).length
    const coverage = governed.length ? Math.round((passing / governed.length) * 100) : 0
    return {
      ...policy,
      coverage,
      passing,
      total: governed.length,
      status: coverage >= 90 ? 'compliant' : coverage >= 70 ? 'partial' : 'at_risk',
      source: 'builtin',
    }
  })
  const custom = computeGuardrailCoverage(agents).map((g) => ({
    id: g.id,
    label: g.label,
    description: g.description,
    coverage: g.coverage,
    passing: g.passing,
    total: g.total,
    status: g.status,
    source: 'guardrail',
    enforcement: g.enforcement,
    custom: g.custom,
  }))
  return [...builtIn, ...custom]
}

export function getAgentPolicyResults(agent) {
  const builtin = GOVERNANCE_POLICIES.map((p) => ({
    id: p.id,
    label: p.label,
    description: p.description,
    pass: p.check(agent),
    source: 'builtin',
  }))
  const guardrails = evaluateAgentAgainstGuardrails(agent).map((r) => ({
    id: r.guardrail.id,
    label: r.guardrail.name,
    description: r.detail || r.guardrail.description,
    pass: r.pass,
    source: 'guardrail',
    enforcement: r.guardrail.enforcement,
  }))
  return [...builtin, ...guardrails]
}

export function getGovernanceQueue(agents) {
  const needsApproval = agents.filter(
    (a) => !a.governanceApproved && ['evaluated', 'governance_approved', 'certified', 'published'].includes(a.stage)
  )
  const pendingStage = agents.filter((a) => a.stage === 'evaluated' && !a.governanceApproved)
  const approved = agents.filter((a) => a.governanceApproved)
  return { needsApproval, pendingStage, approved }
}

export function approveAgentGovernance(agentId, approverName) {
  const agent = getAgentById(agentId)
  if (!agent) return { ok: false, error: 'Agent not found' }

  const updated = saveAgent({
    ...agent,
    governanceApproved: true,
    governanceApprover: approverName.trim(),
    stage: ['evaluated', 'governance_approved'].includes(agent.stage) ? 'governance_approved' : agent.stage,
  })

  logGovernanceAction({
    type: 'approval',
    action: 'Human approval granted',
    entity: updated.name,
    agentId: updated.id,
    actor: approverName,
    status: 'approved',
  })

  return { ok: true, agent: updated }
}

export function requestGovernanceChanges(agentId, note, actor = 'Governance Reviewer') {
  const agent = getAgentById(agentId)
  if (!agent) return { ok: false, error: 'Agent not found' }

  logGovernanceAction({
    type: 'change_request',
    action: 'Changes requested',
    entity: agent.name,
    agentId: agent.id,
    actor,
    detail: note,
    status: 'pending',
  })

  logEvaluationActivity({
    type: 'governance',
    title: `Changes requested — ${agent.name}`,
    detail: note || 'Governance reviewer requested onboarding updates',
    status: 'warn',
    agentId: agent.id,
  })

  return { ok: true, agent }
}

export function getComplianceScans(limit = 20) {
  return loadJSON(SCANS_KEY, [])
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, limit)
}

export async function runComplianceScan(agent, onProgress) {
  const scan = {
    id: generateId('scan'),
    agentId: agent.id,
    agentName: agent.name,
    status: 'running',
    policies: [],
    createdAt: new Date().toISOString(),
  }

  logGovernanceAction({
    type: 'scan_started',
    action: 'Compliance scan started',
    entity: agent.name,
    agentId: agent.id,
    status: 'running',
  })

  const guardrails = getGovernanceGuardrailsConfig().guardrails.filter((g) => g.enabled)

  for (const policy of GOVERNANCE_POLICIES) {
    onProgress?.({ policy: policy.label, status: 'checking' })
    await delay(200)
    const pass = policy.check(agent)
    scan.policies.push({ id: policy.id, label: policy.label, pass, source: 'builtin' })
    onProgress?.({ policy: policy.label, status: pass ? 'pass' : 'fail' })
  }

  for (const guardrail of guardrails) {
    onProgress?.({ policy: guardrail.name, status: 'checking' })
    await delay(220)
    const result = evaluateAgentAgainstGuardrails(agent, [guardrail])[0]
    const pass = result?.pass ?? true
    scan.policies.push({
      id: guardrail.id,
      label: guardrail.name,
      pass,
      source: 'guardrail',
      enforcement: guardrail.enforcement,
    })
    onProgress?.({ policy: guardrail.name, status: pass ? 'pass' : 'fail' })
  }

  scan.passCount = scan.policies.filter((p) => p.pass).length
  scan.coverage = Math.round((scan.passCount / GOVERNANCE_POLICIES.length) * 100)
  scan.status = scan.coverage >= 90 ? 'compliant' : scan.coverage >= 70 ? 'partial' : 'at_risk'
  scan.completedAt = new Date().toISOString()

  const scans = loadJSON(SCANS_KEY, [])
  saveJSON(SCANS_KEY, [scan, ...scans].slice(0, 30))

  logGovernanceAction({
    type: 'scan_completed',
    action: `Compliance scan ${scan.status}`,
    entity: `${agent.name} — ${scan.coverage}% policy coverage`,
    agentId: agent.id,
    status: scan.status,
    coverage: scan.coverage,
  })

  return scan
}

export function seedGovernanceData(agents) {
  const audit = loadJSON(AUDIT_KEY, [])
  if (audit.some((a) => a.id?.startsWith('demo_audit_'))) return

  const now = Date.now()
  const demoEntries = [
    {
      id: 'demo_audit_1',
      timestamp: new Date(now - 1800000).toISOString(),
      type: 'approval',
      action: 'Human approval granted',
      entity: 'RCA Agent',
      agentId: 'demo_ams_rca',
      actor: 'Dr. Sarah Chen, Chief Medical Officer',
      status: 'approved',
    },
    {
      id: 'demo_audit_2',
      timestamp: new Date(now - 5400000).toISOString(),
      type: 'scan_completed',
      action: 'Compliance scan compliant',
      entity: 'Architecture Review Agent — 100% policy coverage',
      agentId: 'demo_ad_arch_review',
      status: 'compliant',
      coverage: 100,
    },
    {
      id: 'demo_audit_3',
      timestamp: new Date(now - 86400000).toISOString(),
      type: 'approval',
      action: 'Human approval granted',
      entity: 'Prior Auth Delivery Workflow',
      agentId: null,
      actor: 'Chief Medical Officer',
      status: 'approved',
    },
    {
      id: 'demo_audit_4',
      timestamp: new Date(now - 172800000).toISOString(),
      type: 'scan_completed',
      action: 'PII scan completed',
      entity: 'Knowledge Fabric — AMS subgraph',
      status: 'compliant',
    },
  ]

  saveJSON(AUDIT_KEY, [...demoEntries, ...audit])
}
