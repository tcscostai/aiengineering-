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
    },
    artifactMap: [
      { key: 'requirements', label: 'Requirements', agentMatch: /requirements|intake/i },
      { key: 'architecture', label: 'Architecture', agentMatch: /architecture|arch/i },
      { key: 'api', label: 'API Design', agentMatch: /api/i },
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
      'Incident Classification Agent': 'Classify incoming P1 alert: Claims Processing API 504 errors',
      'Runbook Assistant Agent': 'Generate remediation runbook for connection pool exhaustion',
    },
    incident: {
      id: 'INC-2024-8847',
      title: 'Payment Gateway Timeout - P1',
      severity: 'P1',
      service: 'Claims Processing API',
    },
  },
  qe: {
    eyebrow: 'Module 9',
    title: 'Quality Engineering',
    description: 'Test automation with QE agents — regression, API, and security validation executed via harness with traceability to initiatives.',
    defaultTasks: {
      'Regression Test Agent': 'Execute full regression suite for prior auth release candidate v2.4.1',
      'API Test Agent': 'Validate claims API contract tests against OpenAPI spec v3.2',
    },
    suiteMap: [
      { label: 'Regression Tests', agentMatch: /regression/i },
      { label: 'API Tests', agentMatch: /api test/i },
      { label: 'Security Tests', agentMatch: /security/i },
      { label: 'Functional Tests', agentMatch: /functional|test/i },
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
      count: agent ? 40 + (agent.skills?.length ?? 0) * 18 + runs.length * 12 : 0,
      automated: agent ? Math.min(100, 70 + covScore / 5) : 0,
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
    { time: '14:32', event: 'Alert triggered — 504 Gateway Timeout', agent: 'Monitoring', type: 'alert' },
    { time: '14:33', event: 'Incident classified as P1', agent: classifier?.name ?? 'Incident Classification Agent', type: 'agent' },
    { time: '14:34', event: 'Log correlation across 12 services', agent: rca?.name ?? 'RCA Agent', type: 'agent' },
    { time: '14:36', event: 'Knowledge graph match: INC-2023-4521 (92% similarity)', agent: 'Knowledge Fabric', type: 'knowledge' },
    { time: '14:38', event: 'Root cause: connection pool exhaustion', agent: rca?.name ?? 'RCA Agent', type: 'agent' },
    { time: '14:40', event: 'Remediation runbook generated', agent: runbook?.name ?? 'Runbook Assistant Agent', type: 'agent' },
  ]
  return steps.slice(0, step)
}
