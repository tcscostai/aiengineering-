import { loadJSON, saveJSON, generateId } from '../lib/storage'
import { CATEGORIES } from '../lib/constants'
import { computeAgentCostAlerts } from './finOpsAlertService'
import { computeAgentUsage } from './finOpsService'

const ACTIVITY_KEY = 'domain_activities'

const DOMAIN_CONFIG = {
  ad: {
    eyebrow: 'Module 7',
    title: 'Application Development Engineering',
    description: 'SDLC acceleration with onboarded AD agents — architecture, API design, code review, and deployment through harness and knowledge fabric.',
    defaultTasks: {
      'Architecture Review Agent': 'Review HLD for prior authorization microservice against enterprise patterns',
      'API Design Agent': 'Generate OpenAPI spec for claims eligibility endpoint with HIPAA constraints',
      'Code Review Agent': 'Review PR #8847 for security, patterns, and test coverage gaps',
      'Benefits API Design Agent': 'Design FHIR Coverage/Benefit endpoints with HMO/PPO/EPO cost-share rules',
    },
    artifactMap: [
      { key: 'requirements', label: 'Requirements', agentMatch: /requirements|intake/i },
      { key: 'architecture', label: 'Architecture', agentMatch: /architecture|arch/i },
      { key: 'api', label: 'API Design', agentMatch: /api design|api/i },
      { key: 'benefits', label: 'Benefits Contracts', agentMatch: /benefits api/i },
      { key: 'components', label: 'React Components', agentMatch: /component|ui/i },
      { key: 'backend', label: 'Backend Services', agentMatch: /code review|backend/i },
      { key: 'security', label: 'Security', agentMatch: /security|review/i },
    ],
  },
  ams: {
    eyebrow: 'Module 8',
    title: 'AMS Engineering',
    description: 'Incident response war room — RCA, classification, and runbook agents orchestrated through harness with ServiceNow knowledge binding.',
    defaultTasks: {
      'RCA Agent': 'Correlate logs for INC-2024-8847 payment gateway timeout across 12 services',
      'Incident Classification Agent': 'Classify incoming P1 alert: Benefits Inquiry API returning stale copay values',
      'Runbook Assistant Agent': 'Generate remediation runbook for benefits accumulator cache invalidation',
    },
    incident: {
      id: 'INC-2024-9102',
      title: 'Benefits Inquiry Stale Copay - P1',
      severity: 'P1',
      service: 'Benefits Inquiry API',
    },
  },
  qe: {
    eyebrow: 'Module 9',
    title: 'Quality Engineering',
    description: 'Benefits test automation — regression, API, script generation, eligibility, and formulary validation with coverage traceability.',
    defaultTasks: {
      'Regression Test Agent': 'Execute full regression suite for prior auth release candidate v2.4.1',
      'API Test Agent': 'Validate claims API contract tests against OpenAPI spec v3.2',
      'Automation Script Generation Agent': 'Generate Playwright TypeScript scripts for HMO/PPO benefits inquiry regression suite',
      'Eligibility Test Agent': 'Validate 270/271 eligibility responses and COB routing for active members',
      'Formulary Test Agent': 'Run formulary tier change regression — 47 NDC moves and step therapy rules',
    },
    suiteMap: [
      { id: 'unit', label: 'Plan Rule Engine (L1)', agentMatch: /regression|script gen/i, layer: 'L1' },
      { id: 'api', label: 'Benefits & Eligibility APIs (L2)', agentMatch: /api test|eligibility/i, layer: 'L2' },
      { id: 'integration', label: 'Accumulator + Auth (L3)', agentMatch: /regression/i, layer: 'L3' },
      { id: 'e2e', label: 'Member Portal E2E (L4)', agentMatch: /script gen|functional/i, layer: 'L4' },
      { id: 'pharmacy', label: 'Formulary & Specialty (L7)', agentMatch: /formulary/i, layer: 'L7' },
      { id: 'scripts', label: 'Generated Scripts', agentMatch: /script gen/i, layer: 'Gen' },
    ],
  },
}

export function getDomainConfig(category) {
  return DOMAIN_CONFIG[category] ?? DOMAIN_CONFIG.ad
}

export function getDomainActivities(category, limit = 20) {
  const all = loadJSON(ACTIVITY_KEY, [])
  return all
    .filter((a) => a.category === category)
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    .slice(0, limit)
}

export function logDomainActivity(category, entry) {
  const all = loadJSON(ACTIVITY_KEY, [])
  const item = {
    id: generateId('act'),
    category,
    timestamp: new Date().toISOString(),
    ...entry,
  }
  saveJSON(ACTIVITY_KEY, [item, ...all].slice(0, 100))
  return item
}

export function computeDomainMetrics(agents, category, harnessRuns = []) {
  const catAgents = agents.filter((a) => a.category === category && a.stage !== 'draft')
  const published = catAgents.filter((a) => a.stage === 'published').length
  const certified = catAgents.filter((a) => a.stage === 'certified' || a.stage === 'published').length
  const catRuns = harnessRuns.filter((r) => catAgents.some((a) => a.id === r.agentId))
  const completedRuns = catRuns.filter((r) => r.status === 'completed').length

  const evalScores = catAgents.flatMap((a) =>
    Object.values(a.evaluation || {}).filter((v) => typeof v === 'number')
  )
  const avgQuality = evalScores.length
    ? Math.round(evalScores.reduce((s, v) => s + v, 0) / evalScores.length)
    : 0

  const reuseTotal = catAgents.reduce((s, a) => s + (a.reuseCount ?? 0), 0)
  const verified = catAgents.filter((a) => a.connectionStatus === 'verified').length

  const usages = catAgents.map((a) => computeAgentUsage(a))
  const mtdCost = usages.reduce((s, u) => s + u.costUsd, 0)
  const alerts = computeAgentCostAlerts(agents, usages)

  return {
    agentCount: catAgents.length,
    published,
    certified,
    harnessRuns: catRuns.length,
    completedRuns,
    avgQuality,
    reuseTotal,
    verified,
    mtdCost,
    alertCount: alerts.filter((a) => a.category === category).length,
    color: CATEGORIES[category]?.color,
    short: CATEGORIES[category]?.short,
  }
}

export function computeADArtifacts(agents) {
  const config = DOMAIN_CONFIG.ad
  const adAgents = agents.filter((a) => a.category === 'ad' && a.stage !== 'draft')

  return config.artifactMap.map((art) => {
    const agent = adAgents.find((a) => art.agentMatch.test(a.name))
    if (!agent) {
      return { ...art, status: 'pending', quality: 0, agentName: null }
    }
    const scores = Object.values(agent.evaluation || {}).filter((v) => typeof v === 'number')
    const quality = scores.length ? Math.round(scores.reduce((s, v) => s + v, 0) / scores.length) : 0
    const status =
      agent.stage === 'published' ? 'generated' :
      agent.stage === 'certified' || agent.stage === 'evaluated' ? 'in-progress' :
      'pending'
    return {
      ...art,
      status,
      quality,
      agentName: agent.name,
      agentId: agent.id,
    }
  })
}

export function computeQESuites(agents, harnessRuns = []) {
  const qeAgents = agents.filter((a) => a.category === 'qe' && a.stage !== 'draft')
  const config = DOMAIN_CONFIG.qe

  return config.suiteMap.map((suite) => {
    const agent = qeAgents.find((a) => suite.agentMatch.test(a.name))
    const runs = agent ? harnessRuns.filter((r) => r.agentId === agent.id) : []
    const lastRun = runs[0]
    const coverage = agent?.evaluation?.Coverage ?? agent?.evaluation?.Quality
    const covScore = typeof coverage === 'number' ? coverage : 0

    return {
      ...suite,
      agentName: agent?.name ?? null,
      agentId: agent?.id ?? null,
      count: agent ? 48 + (agent.skills?.length ?? 0) * 14 + runs.length * 10 : 0,
      automated: agent ? Math.min(100, 68 + covScore / 4 + (suite.id === 'scripts' ? 8 : 0)) : 0,
      scriptsGenerated: suite.id === 'scripts' && agent ? 12 + runs.length * 3 : agent ? Math.floor(suite.count / 4) : 0,
      requirementsTraced: agent ? Math.min(98, 75 + covScore / 6) : 0,
      status: !agent ? 'pending' :
        lastRun?.status === 'running' ? 'running' :
        lastRun?.status === 'completed' ? 'passing' :
        agent.stage === 'published' ? 'passing' : 'warn',
      lastRunAt: lastRun?.createdAt ?? null,
    }
  })
}

export function getDefaultTaskForAgent(agent) {
  if (!agent) return 'Execute domain engineering task via platform harness'
  const config = DOMAIN_CONFIG[agent.category]
  return config?.defaultTasks?.[agent.name] ?? `Run ${agent.name} for ${agent.project}`
}

export function buildAMSTimeline(agents, step = 6) {
  const amsAgents = agents.filter((a) => a.category === 'ams')
  const rca = amsAgents.find((a) => /rca/i.test(a.name))
  const classifier = amsAgents.find((a) => /classification|incident/i.test(a.name))
  const runbook = amsAgents.find((a) => /runbook/i.test(a.name))

  const steps = [
    { time: '14:32', event: 'Alert triggered — stale copay on Benefits Inquiry API', agent: 'Monitoring', type: 'alert' },
    { time: '14:33', event: 'Incident classified as P1 — member-facing benefit data incorrect', agent: classifier?.name ?? 'Incident Classification Agent', type: 'agent' },
    { time: '14:34', event: 'Log correlation across benefits, accumulator, and cache services', agent: rca?.name ?? 'RCA Agent', type: 'agent' },
    { time: '14:36', event: 'Knowledge graph match: INC-2023-3891 plan year rollover (89% similarity)', agent: 'Knowledge Fabric', type: 'knowledge' },
    { time: '14:38', event: 'Root cause: accumulator cache not invalidated after plan document update', agent: rca?.name ?? 'RCA Agent', type: 'agent' },
    { time: '14:40', event: 'Remediation runbook generated — cache flush + regression gate', agent: runbook?.name ?? 'Runbook Assistant Agent', type: 'agent' },
  ]
  return steps.slice(0, step)
}
