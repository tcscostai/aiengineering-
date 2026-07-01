import { loadJSON, saveJSON } from '../lib/storage'
import { DEMO_AGENTS, DEMO_AGENT_IDS } from '../data/demoAgents'
import { getAllAgents, saveAgent } from './agentService'
import { registerSkillsFromAgent } from './skillService'
import { PREBUILT_WORKFLOWS } from '../data/prebuiltWorkflows'
import { seedEvaluationData } from './evaluationService'
import { seedGovernanceData } from './governanceService'
import { setActiveWorkspace } from './initiativeService'
import { getFlowRecord, startDemoEnterpriseFlow } from './enterpriseFlowService'
import { buildDefaultDomainPlan } from '../data/workspaceDomains'

export const PLATFORM_SEED_VERSION = 4
const VERSION_KEY = 'platform_seed_version'

function upsertAgents() {
  const existing = getAllAgents()
  const byId = new Map(existing.map((a) => [a.id, a]))
  let changed = false

  DEMO_AGENTS.forEach((seed) => {
    if (!byId.has(seed.id)) {
      existing.push(seed)
      changed = true
    } else {
      const idx = existing.findIndex((a) => a.id === seed.id)
      existing[idx] = { ...byId.get(seed.id), ...seed }
      changed = true
    }
  })

  if (changed) saveJSON('agents', existing)
  return existing.filter((a) => DEMO_AGENTS.some((d) => d.id === a.id))
}

function buildDemoDomainPlans(enabledDomains) {
  return Object.fromEntries(
    ['ad', 'ams', 'qe'].map((id) => {
      const plan = buildDefaultDomainPlan(id)
      return [
        id,
        {
          ...plan,
          enabled: enabledDomains.includes(id),
          status: enabledDomains.includes(id) ? 'active' : 'planned',
        },
      ]
    })
  )
}

function upsertWorkspaces() {
  const existing = loadJSON('initiatives', [])
  const byId = new Map(existing.map((w) => [w.id, w]))

  const priorAuthAgents = [
    DEMO_AGENT_IDS.archReview,
    DEMO_AGENT_IDS.apiDesign,
    DEMO_AGENT_IDS.incidentClass,
    DEMO_AGENT_IDS.regression,
  ]
  const claimsAgents = [DEMO_AGENT_IDS.codeReview, DEMO_AGENT_IDS.apiTest]
  const resilienceAgents = [DEMO_AGENT_IDS.rca, DEMO_AGENT_IDS.runbook]

  const now = new Date().toISOString()
  const demos = [
    {
      id: 'demo_init_prior_auth',
      title: 'Prior Authorization Automation',
      description: 'Reduce Prior Authorization turnaround time by implementing AI-assisted workflow automation across AD, AMS, and QE agents.',
      industry: 'Healthcare',
      domain: 'Healthcare',
      status: 'active',
      progress: 72,
      domains: ['ad', 'ams', 'qe'],
      domainPlans: buildDemoDomainPlans(['ad', 'ams', 'qe']),
      linkedAgentIds: priorAuthAgents,
      businessObjective: '50% reduction in turnaround time with 90% first-pass accuracy',
      stakeholders: 'Chief Medical Officer, VP Operations, CIO',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'demo_init_claims',
      title: 'Claims Modernization',
      description: 'Modernize claims processing APIs with AI-assisted code review and API quality engineering.',
      industry: 'Healthcare',
      domain: 'Healthcare',
      status: 'planning',
      progress: 48,
      domains: ['ad', 'qe'],
      domainPlans: buildDemoDomainPlans(['ad', 'qe']),
      linkedAgentIds: claimsAgents,
      businessObjective: 'Accelerate claims API delivery with automated quality gates',
      stakeholders: 'VP Engineering, Director of Integration',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'demo_init_resilience',
      title: 'Platform Resilience Enhancement',
      description: 'Predictive incident management and automated RCA with knowledge capture runbooks.',
      industry: 'Infrastructure',
      domain: 'Infrastructure',
      status: 'planning',
      progress: 58,
      domains: ['ams'],
      domainPlans: buildDemoDomainPlans(['ams']),
      linkedAgentIds: resilienceAgents,
      businessObjective: 'Reduce MTTR by 40% through agent-assisted incident response',
      stakeholders: 'Director of Operations, Head of SRE',
      createdAt: now,
      updatedAt: now,
    },
  ]

  demos.forEach((seed) => {
    const prev = byId.get(seed.id)
    byId.set(seed.id, prev ? { ...prev, ...seed, createdAt: prev.createdAt ?? seed.createdAt } : seed)
  })

  saveJSON('initiatives', Array.from(byId.values()))
  if (!loadJSON('active_workspace_id', null)) {
    setActiveWorkspace('demo_init_prior_auth')
  }
  if (!getFlowRecord().workspaceId) {
    startDemoEnterpriseFlow()
  }
}

function seedWorkflows() {
  const existing = loadJSON('agent_workflows', [])
  const byId = new Map(existing.map((w) => [w.id, w]))
  let changed = false

  PREBUILT_WORKFLOWS.forEach((seed) => {
    const prev = byId.get(seed.id)
    if (!prev) {
      byId.set(seed.id, seed)
      changed = true
      return
    }
    if (!prev.metadata?.prebuilt) return
    if (prev.metadata?.userModified) return
    byId.set(seed.id, {
      ...seed,
      metadata: { ...seed.metadata, reuseCount: prev.metadata?.reuseCount ?? seed.metadata.reuseCount },
    })
    changed = true
  })

  if (changed) {
    saveJSON('agent_workflows', Array.from(byId.values()))
  }
}

function seedHarnessRuns(demoAgents) {
  const existing = loadJSON('harness_runs', [])
  if (existing.some((r) => r.id?.startsWith('demo_run_'))) return

  const runs = [
    { agentId: DEMO_AGENT_IDS.rca, task: 'Analyze INC-2024-8847 payment gateway timeout', daysAgo: 1, status: 'completed' },
    { agentId: DEMO_AGENT_IDS.incidentClass, task: 'Classify production alert — claims API latency', daysAgo: 2, status: 'completed' },
    { agentId: DEMO_AGENT_IDS.regression, task: 'Prior auth regression suite — sprint 14', daysAgo: 3, status: 'completed' },
    { agentId: DEMO_AGENT_IDS.archReview, task: 'Architecture review — decision engine HLD', daysAgo: 5, status: 'completed' },
    { agentId: DEMO_AGENT_IDS.apiDesign, task: 'OpenAPI spec for clinical review endpoint', daysAgo: 6, status: 'completed' },
    { agentId: DEMO_AGENT_IDS.codeReview, task: 'PR #8847 connection pool lifecycle fix', daysAgo: 1, status: 'completed' },
    { agentId: DEMO_AGENT_IDS.apiTest, task: 'Contract tests — claims eligibility API', daysAgo: 4, status: 'completed' },
    { agentId: DEMO_AGENT_IDS.runbook, task: 'Update runbook — connection pool exhaustion', daysAgo: 2, status: 'completed' },
  ]

  const seeded = runs.map((spec, i) => {
    const agent = demoAgents.find((a) => a.id === spec.agentId)
    const created = new Date()
    created.setDate(created.getDate() - spec.daysAgo)
    const completed = new Date(created.getTime() + 45000)
    return {
      id: `demo_run_${i + 1}`,
      agentId: spec.agentId,
      agentName: agent?.name ?? 'Agent',
      category: agent?.category,
      runtimeType: agent?.runtimeType,
      status: spec.status,
      task: spec.task,
      currentStepIndex: 9,
      steps: [
        { id: 'context', label: 'Context Assembly', status: 'complete', output: 'Knowledge sources collected', durationMs: 520 },
        { id: 'prompt', label: 'Prompt Assembly', status: 'complete', output: 'Prompt assembled with enterprise skills', durationMs: 280 },
        { id: 'memory', label: 'Memory Retrieval', status: 'complete', output: 'Memory chunks retrieved', durationMs: 410 },
        { id: 'tool', label: 'Tool Routing', status: 'complete', output: 'Tools invoked successfully', durationMs: 640 },
        { id: 'workflow', label: 'Workflow Routing', status: 'complete', output: 'Agent placed in enterprise workflow', durationMs: 180 },
        { id: 'collab', label: 'Agent Collaboration', status: 'complete', output: 'Enterprise skills reused', durationMs: 250 },
        { id: 'eval', label: 'Evaluation', status: 'complete', output: 'Quality gate: PASS', durationMs: 320 },
        { id: 'policy', label: 'Policy Enforcement', status: 'complete', output: 'All policies enforced', durationMs: 160 },
        { id: 'obs', label: 'Observability', status: 'complete', output: 'Telemetry exported', durationMs: 90 },
        { id: 'human', label: 'Human Approval', status: 'complete', output: `Approved by ${agent?.governanceApprover ?? 'governance board'}`, durationMs: 100 },
      ],
      metrics: { contextConfidence: 92, reuseReadiness: 78, knowledgeCoverage: 85 },
      logs: [
        { time: created.toISOString(), level: 'info', message: `Harness run initialized for ${agent?.name}` },
        { time: completed.toISOString(), level: 'info', message: 'Harness execution completed successfully' },
      ],
      createdAt: created.toISOString(),
      completedAt: completed.toISOString(),
      updatedAt: completed.toISOString(),
    }
  })

  saveJSON('harness_runs', [...seeded, ...existing].slice(0, 100))
}

function registerDemoSkills(demoAgents) {
  demoAgents
    .filter((a) => a.stage === 'published')
    .forEach((agent) => registerSkillsFromAgent(agent))
}

export function seedPlatformData() {
  const currentVersion = loadJSON(VERSION_KEY, 0)
  const demoAgents = upsertAgents()

  upsertWorkspaces()
  seedWorkflows()
  seedHarnessRuns(demoAgents)
  registerDemoSkills(demoAgents)
  seedEvaluationData(getAllAgents())
  seedGovernanceData(getAllAgents())

  saveJSON(VERSION_KEY, PLATFORM_SEED_VERSION)
  return {
    seeded: true,
    version: PLATFORM_SEED_VERSION,
    previousVersion: currentVersion,
    agentCount: demoAgents.length,
  }
}