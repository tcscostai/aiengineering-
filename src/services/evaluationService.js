import { loadJSON, saveJSON, generateId } from '../lib/storage'
import { saveAgent, getAgentById } from './agentService'
import onboardingData from '../data/onboarding.json'
import { getPassThreshold } from './evaluationRulesService'

const RUNS_KEY = 'evaluation_runs'
const ACTIVITY_KEY = 'evaluation_activities'
export const EVAL_PASS_THRESHOLD = 85

const EVAL_STEPS = [
  { id: 'groundedness', label: 'Groundedness Analysis', detail: 'Cross-reference knowledge fabric bindings' },
  { id: 'hallucination', label: 'Hallucination Probe', detail: 'Synthetic adversarial prompt battery' },
  { id: 'security', label: 'Security Scan', detail: 'PII leakage and injection resistance' },
  { id: 'latency', label: 'Latency Benchmark', detail: 'P95 response under enterprise load profile' },
  { id: 'cost', label: 'Cost Efficiency', detail: 'Token usage vs FinOps baseline' },
  { id: 'quality', label: 'Business Quality Gate', detail: 'Domain-specific rubric scoring' },
]

function delay(ms) {
  return new Promise((r) => setTimeout(r, ms))
}

export function getCategoryEvaluationDims(category) {
  const track = onboardingData.tracks.find((t) => t.id === category)
  return track?.evaluation ?? []
}

export function getEvaluationRuns(limit = 30) {
  return loadJSON(RUNS_KEY, [])
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, limit)
}

export function getEvaluationActivities(limit = 25) {
  return loadJSON(ACTIVITY_KEY, [])
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    .slice(0, limit)
}

export function logEvaluationActivity(entry) {
  const all = loadJSON(ACTIVITY_KEY, [])
  const item = {
    id: generateId('eval_act'),
    timestamp: new Date().toISOString(),
    ...entry,
  }
  saveJSON(ACTIVITY_KEY, [item, ...all].slice(0, 80))
  return item
}

function saveEvaluationRun(run) {
  const runs = loadJSON(RUNS_KEY, [])
  saveJSON(RUNS_KEY, [run, ...runs].slice(0, 50))
  return run
}

export function computeAgentOverallScore(agent) {
  const scores = Object.values(agent.evaluation || {}).filter((v) => typeof v === 'number')
  if (!scores.length) return null
  return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
}

export function getEffectivePassThreshold() {
  return getPassThreshold()
}

export function computeDimensionAggregates(agents, category = 'all') {
  const threshold = getPassThreshold()
  const filtered =
    category === 'all' ? agents : agents.filter((a) => a.category === category)

  const dimensionScores = {}
  filtered.forEach((a) => {
    Object.entries(a.evaluation || {}).forEach(([dim, score]) => {
      if (typeof score === 'number') {
        if (!dimensionScores[dim]) dimensionScores[dim] = []
        dimensionScores[dim].push(score)
      }
    })
  })

  return Object.entries(dimensionScores).map(([label, scores]) => {
    const score = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
    return {
      id: label.toLowerCase().replace(/\s+/g, '_'),
      label,
      score,
      target: threshold,
      pass: score >= threshold,
      agentCount: scores.length,
    }
  })
}

export function getAgentsBelowThreshold(agents, threshold) {
  const t = threshold ?? getPassThreshold()
  return agents.filter((a) => {
    const overall = computeAgentOverallScore(a)
    return overall != null && overall < t
  })
}

export function getDimensionBreakdown(agent) {
  const threshold = getPassThreshold()
  return Object.entries(agent.evaluation || {})
    .filter(([, v]) => typeof v === 'number')
    .map(([label, score]) => ({
      label,
      score,
      target: threshold,
      pass: score >= threshold,
      gap: score - threshold,
    }))
}

function simulateDimensionScores(agent, dims) {
  const updated = { ...agent.evaluation }
  dims.forEach((dim) => {
    const current = updated[dim]
    const base = typeof current === 'number' ? current : 78 + Math.random() * 14
    updated[dim] = Math.min(99, Math.max(68, Math.round(base + (Math.random() - 0.35) * 8)))
  })
  return updated
}

export async function runAgentEvaluation(agent, onStep) {
  const dims = getCategoryEvaluationDims(agent.category)
  const run = {
    id: generateId('eval_run'),
    agentId: agent.id,
    agentName: agent.name,
    category: agent.category,
    status: 'running',
    steps: EVAL_STEPS.map((s) => ({ ...s, status: 'pending' })),
    createdAt: new Date().toISOString(),
  }
  saveEvaluationRun(run)

  logEvaluationActivity({
    type: 'run_started',
    title: `Evaluation started — ${agent.name}`,
    detail: `${dims.length} dimensions · harness quality gate`,
    status: 'running',
    agentId: agent.id,
  })

  for (let i = 0; i < run.steps.length; i++) {
    run.steps[i].status = 'running'
    onStep?.({ ...run, steps: [...run.steps] })
    await delay(350 + Math.random() * 200)
    run.steps[i].status = 'complete'
    run.steps[i].output = run.steps[i].detail
    onStep?.({ ...run, steps: [...run.steps] })
  }

  const newEval = simulateDimensionScores(agent, dims.length ? dims : Object.keys(agent.evaluation))
  const overall = computeAgentOverallScore({ ...agent, evaluation: newEval })
  const threshold = getPassThreshold()
  const passed = overall >= threshold

  let updatedAgent = saveAgent({
    ...agent,
    evaluation: newEval,
    stage: agent.stage === 'workflow_designed' ? 'evaluated' : agent.stage,
  })

  run.status = passed ? 'passed' : 'needs_review'
  run.overallScore = overall
  run.completedAt = new Date().toISOString()
  run.dimensionResults = getDimensionBreakdown(updatedAgent)
  saveEvaluationRun(run)

  logEvaluationActivity({
    type: 'run_completed',
    title: `Evaluation ${passed ? 'passed' : 'needs review'} — ${agent.name}`,
    detail: `Overall score ${overall}/100 · ${passed ? 'meets' : 'below'} ${threshold} threshold`,
    status: passed ? 'completed' : 'warn',
    agentId: agent.id,
    score: overall,
  })

  return { run, agent: updatedAgent, overall, passed }
}

export function seedEvaluationData(agents) {
  const runs = loadJSON(RUNS_KEY, [])
  if (runs.some((r) => r.id?.startsWith('demo_eval_'))) return

  const demoAgents = agents.filter((a) => a.id?.startsWith('demo_')).slice(0, 5)
  const now = Date.now()
  const seededRuns = demoAgents.map((a, i) => {
    const overall = computeAgentOverallScore(a) ?? 90
    const created = new Date(now - (i + 1) * 86400000).toISOString()
    return {
      id: `demo_eval_${i + 1}`,
      agentId: a.id,
      agentName: a.name,
      category: a.category,
      status: overall >= getPassThreshold() ? 'passed' : 'needs_review',
      overallScore: overall,
      steps: EVAL_STEPS.map((s) => ({ ...s, status: 'complete', output: s.detail })),
      createdAt: created,
      completedAt: created,
    }
  })
  saveJSON(RUNS_KEY, [...seededRuns, ...runs])

  const activities = loadJSON(ACTIVITY_KEY, [])
  if (!activities.length) {
    saveJSON(ACTIVITY_KEY, [
      {
        id: 'demo_eval_act_1',
        timestamp: new Date(now - 3600000).toISOString(),
        type: 'run_completed',
        title: 'Evaluation passed — RCA Agent',
        detail: 'Overall score 94/100 · meets 85 threshold',
        status: 'completed',
        agentId: 'demo_ams_rca',
        score: 94,
      },
      {
        id: 'demo_eval_act_2',
        timestamp: new Date(now - 7200000).toISOString(),
        type: 'run_completed',
        title: 'Evaluation passed — API Design Agent',
        detail: 'Overall score 91/100 · Cost dimension flagged for FinOps review',
        status: 'completed',
        agentId: 'demo_ad_api_design',
        score: 91,
      },
    ])
  }
}
