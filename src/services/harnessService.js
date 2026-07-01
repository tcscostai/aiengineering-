import { loadJSON, saveJSON, generateId } from '../lib/storage'
import { HARNESS_PIPELINE, SOURCE_TOOL_MAP } from '../lib/harnessConstants'
import { getAllSkills } from './skillService'
import { getPlatformToolForAgent } from '../data/platformTools'

const RUNS_KEY = 'harness_runs'
const CONFIGS_KEY = 'harness_configs'

export function getHarnessRuns(limit = 50) {
  return loadJSON(RUNS_KEY, [])
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, limit)
}

export function getHarnessRunById(id) {
  return getHarnessRuns(500).find((r) => r.id === id) ?? null
}

export function getRunsForAgent(agentId) {
  return getHarnessRuns(500).filter((r) => r.agentId === agentId)
}

export function saveHarnessRun(run) {
  const runs = loadJSON(RUNS_KEY, [])
  const idx = runs.findIndex((r) => r.id === run.id)
  const updated = { ...run, updatedAt: new Date().toISOString() }
  if (idx >= 0) runs[idx] = updated
  else runs.unshift(updated)
  saveJSON(RUNS_KEY, runs.slice(0, 100))
  return updated
}

export function computeHarnessMetrics(agent) {
  if (!agent) {
    return { contextConfidence: 0, reuseReadiness: 0, knowledgeCoverage: 0 }
  }

  const library = getAllSkills()
  const libNames = library.map((s) => s.name.toLowerCase())
  const reusedCount = agent.skills.filter((s) => libNames.includes(s.toLowerCase())).length

  const knowledgeScore = Math.min(100, agent.knowledgeSources.length * 18 + (agent.connectionStatus === 'verified' ? 15 : 0))
  const toolScore = Math.min(100, agent.tools.length * 15)
  const contextConfidence = Math.round(
    (knowledgeScore * 0.45 + toolScore * 0.25 + (agent.connectionStatus === 'verified' ? 30 : 0)) 
  )

  const reuseReadiness = agent.skills.length
    ? Math.round((reusedCount / agent.skills.length) * 100 + Math.min(agent.reuseCount * 5, 20))
    : 0

  const maxKnowledge = 6
  const knowledgeCoverage = Math.min(100, Math.round((agent.knowledgeSources.length / maxKnowledge) * 100))

  const evalScores = Object.values(agent.evaluation || {}).filter((v) => typeof v === 'number')
  const avgEval = evalScores.length
    ? Math.round(evalScores.reduce((a, b) => a + b, 0) / evalScores.length)
    : null

  return {
    contextConfidence: Math.min(100, contextConfidence),
    reuseReadiness: Math.min(100, reuseReadiness),
    knowledgeCoverage: Math.min(100, knowledgeCoverage),
    avgEvaluation: avgEval,
    governanceReady: agent.governanceApproved === true,
  }
}

function buildContextItems(agent) {
  return agent.knowledgeSources.map((source) => ({
    source,
    tool: SOURCE_TOOL_MAP[source] ?? agent.tools[0] ?? 'Enterprise API',
    records: 12 + source.length * 2 + (source.charCodeAt(0) % 15),
    status: 'collected',
  }))
}

function buildPromptBundle(agent, task) {
  const platform = getPlatformToolForAgent(agent)
  return {
    system: `You are ${agent.name} (${agent.agentFamily || agent.category.toUpperCase()}). ${agent.purpose}`,
    skills: agent.skills,
    task: task || `Execute ${agent.name} standard operation for ${agent.project}`,
    runtime: agent.runtimeType,
    entryPoint: agent.entryPoint,
    platformPlane: platform.id !== 'external' ? platform.harnessLabel : null,
    invokeVia: platform.id !== 'external' ? `${platform.name} @ ${agent.sourceLocation}` : agent.entryPoint,
    tokensEstimated: 800 + agent.skills.length * 120 + agent.knowledgeSources.length * 90,
  }
}

function buildMemoryRetrieval(agent, contextItems) {
  return contextItems.map((c) => ({
    source: c.source,
    chunks: Math.ceil(c.records / 4),
    relevance: Math.min(99, 70 + c.source.length),
  }))
}

function buildToolRoutes(agent) {
  return agent.tools.map((tool, i) => ({
    tool,
    route: `invoke://${tool.toLowerCase().replace(/\s+/g, '-')}/agent/${agent.id}`,
    priority: i + 1,
    latencyMs: 80 + i * 40 + tool.length * 3,
  }))
}

function buildCollaboration(agent) {
  const library = getAllSkills()
  return agent.skills
    .map((skill) => {
      const lib = library.find((s) => s.name.toLowerCase() === skill.toLowerCase())
      if (!lib) return null
      return {
        skill,
        sourceAgent: lib.sourceAgentName,
        sourceProject: lib.sourceProject,
        reuseCount: lib.reuseCount,
        mode: 'skill_reuse',
      }
    })
    .filter(Boolean)
}

function executeStep(stepId, agent, ctx) {
  const startedAt = new Date().toISOString()
  const base = { id: stepId, startedAt, status: 'complete' }

  switch (stepId) {
    case 'context': {
      const items = buildContextItems(agent)
      return {
        ...base,
        label: 'Context Assembly',
        output: `Collected ${items.length} knowledge source(s), ${items.reduce((s, i) => s + i.records, 0)} records`,
        collected: items,
        durationMs: 400 + items.length * 80,
      }
    }
    case 'prompt': {
      const bundle = buildPromptBundle(agent, ctx.task)
      const platform = getPlatformToolForAgent(agent)
      const planeNote = platform.id !== 'external' ? ` via ${platform.harnessLabel}` : ''
      return {
        ...base,
        label: 'Prompt Assembly',
        output: `Prompt assembled${planeNote} — ${bundle.tokensEstimated} est. tokens, ${bundle.skills.length} skills injected`,
        promptBundle: bundle,
        durationMs: 200 + bundle.skills.length * 30,
      }
    }
    case 'memory': {
      const memory = buildMemoryRetrieval(agent, ctx.contextItems)
      return {
        ...base,
        label: 'Memory Retrieval',
        output: `Retrieved ${memory.reduce((s, m) => s + m.chunks, 0)} memory chunks from ${memory.length} sources`,
        memory,
        durationMs: 350 + memory.length * 60,
      }
    }
    case 'tool': {
      const routes = buildToolRoutes(agent)
      return {
        ...base,
        label: 'Tool Routing',
        output: `Routed to ${routes.length} tool(s): ${routes.map((r) => r.tool).join(', ')}`,
        routes,
        durationMs: routes.reduce((s, r) => s + r.latencyMs, 0),
      }
    }
    case 'workflow': {
      const wf = agent.workflowDescription?.trim() || 'Default enterprise workflow slot'
      return {
        ...base,
        label: 'Workflow Routing',
        output: `Agent placed in workflow: ${wf.slice(0, 120)}${wf.length > 120 ? '…' : ''}`,
        workflow: { description: wf, project: agent.project, handoff: agent.category },
        durationMs: 180,
      }
    }
    case 'collab': {
      const collabs = buildCollaboration(agent)
      return {
        ...base,
        label: 'Agent Collaboration',
        output: collabs.length
          ? `Collaborating via ${collabs.length} reused enterprise skill(s)`
          : 'No cross-agent skill reuse — standalone execution',
        collaborations: collabs,
        durationMs: 150 + collabs.length * 100,
      }
    }
    case 'eval': {
      const scores = Object.entries(agent.evaluation || {}).filter(([, v]) => typeof v === 'number')
      const avg = scores.length
        ? Math.round(scores.reduce((s, [, v]) => s + v, 0) / scores.length)
        : 0
      const passed = avg >= 80
      return {
        ...base,
        label: 'Evaluation',
        status: passed ? 'complete' : 'warning',
        output: scores.length
          ? `Quality gate: ${avg}% average across ${scores.length} dimensions — ${passed ? 'PASS' : 'REVIEW'}`
          : 'No evaluation scores configured — manual review required',
        evaluation: Object.fromEntries(scores),
        durationMs: 220 + scores.length * 40,
      }
    }
    case 'policy': {
      const policies = [
        { name: 'Responsible AI', pass: true },
        { name: 'PII Protection', pass: agent.knowledgeSources.length > 0 },
        { name: 'Audit Trail', pass: true },
        { name: 'Governance', pass: agent.governanceApproved === true },
      ]
      const allPass = policies.every((p) => p.pass)
      return {
        ...base,
        label: 'Policy Enforcement',
        status: allPass ? 'complete' : 'warning',
        output: allPass ? 'All policies enforced' : 'Governance approval pending — restricted execution',
        policies,
        durationMs: 160,
      }
    }
    case 'obs': {
      const platform = getPlatformToolForAgent(agent)
      return {
        ...base,
        label: 'Observability',
        output: platform.id !== 'external'
          ? `Trace exported to ${platform.name} telemetry · enterprise TCS metrics`
          : `Trace ID ${generateId('trace')} · metrics exported to enterprise telemetry`,
        telemetry: {
          traceId: generateId('trace'),
          agentId: agent.id,
          runtime: agent.runtimeType,
          category: agent.category,
          platformTool: platform.id !== 'external' ? platform.id : null,
          platformPlane: platform.harnessLabel,
        },
        durationMs: 90,
      }
    }
    case 'human': {
      const required = !agent.governanceApproved || agent.category === 'ams'
      return {
        ...base,
        label: 'Human Approval',
        status: required && !agent.governanceApproved ? 'pending_approval' : 'complete',
        output: required && !agent.governanceApproved
          ? `Awaiting approval from ${agent.governanceApprover || 'compliance board'}`
          : agent.governanceApprover
            ? `Approved by ${agent.governanceApprover}`
            : 'Auto-approved — governance satisfied',
        approver: agent.governanceApprover,
        durationMs: 100,
      }
    }
    default:
      return { ...base, label: stepId, output: 'Unknown step', durationMs: 50 }
  }
}

export function createHarnessRun(agent, task = '') {
  const metrics = computeHarnessMetrics(agent)
  const platform = getPlatformToolForAgent(agent)
  return {
    id: generateId('run'),
    agentId: agent.id,
    agentName: agent.name,
    category: agent.category,
    runtimeType: agent.runtimeType,
    platformTool: platform.id !== 'external' ? platform.id : null,
    status: 'pending',
    task: task.trim() || `Harness execution for ${agent.name}`,
    currentStepIndex: -1,
    steps: HARNESS_PIPELINE.map((s) => ({
      id: s.id,
      label: s.label,
      status: 'pending',
      output: null,
      durationMs: null,
    })),
    metrics,
    logs: [{
      time: new Date().toISOString(),
      level: 'info',
      message: platform.id !== 'external'
        ? `Harness run initialized for ${agent.name} on ${platform.harnessLabel}`
        : `Harness run initialized for ${agent.name}`,
    }],
    createdAt: new Date().toISOString(),
    completedAt: null,
  }
}

export async function executeHarnessRun(agent, task, onUpdate) {
  let run = createHarnessRun(agent, task)
  run.status = 'running'
  saveHarnessRun(run)
  onUpdate?.(run)

  const ctx = { task, contextItems: [] }

  for (let i = 0; i < HARNESS_PIPELINE.length; i++) {
    const stepDef = HARNESS_PIPELINE[i]
    run.currentStepIndex = i
    run.steps[i] = { ...run.steps[i], status: 'active', startedAt: new Date().toISOString() }
    run.logs.push({
      time: new Date().toISOString(),
      level: 'info',
      message: `Starting: ${stepDef.label}`,
    })
    saveHarnessRun(run)
    onUpdate?.({ ...run })

    const result = executeStep(stepDef.id, agent, ctx)
    if (stepDef.id === 'context') ctx.contextItems = result.collected ?? []

    await new Promise((r) => setTimeout(r, Math.min(result.durationMs, 600)))

    run.steps[i] = {
      ...run.steps[i],
      status: result.status === 'pending_approval' ? 'warning' : result.status === 'warning' ? 'warning' : 'complete',
      output: result.output,
      durationMs: result.durationMs,
      completedAt: new Date().toISOString(),
      detail: result,
    }
    run.logs.push({
      time: new Date().toISOString(),
      level: result.status === 'warning' ? 'warn' : 'info',
      message: result.output,
    })

    if (result.status === 'pending_approval') {
      run.status = 'pending_approval'
      saveHarnessRun(run)
      onUpdate?.({ ...run })
      return run
    }

    saveHarnessRun(run)
    onUpdate?.({ ...run })
  }

  run.status = 'completed'
  run.completedAt = new Date().toISOString()
  run.metrics = computeHarnessMetrics(agent)
  run.logs.push({
    time: new Date().toISOString(),
    level: 'info',
    message: 'Harness execution completed successfully',
  })
  saveHarnessRun(run)
  onUpdate?.({ ...run })
  return run
}

export function getHarnessStats(agents) {
  const runs = getHarnessRuns(500)
  const eligible = agents.filter((a) => a.connectionStatus === 'verified' || ['certified', 'published'].includes(a.stage))
  return {
    totalRuns: runs.length,
    completedRuns: runs.filter((r) => r.status === 'completed').length,
    eligibleAgents: eligible.length,
    byCategory: {
      ad: eligible.filter((a) => a.category === 'ad').length,
      ams: eligible.filter((a) => a.category === 'ams').length,
      qe: eligible.filter((a) => a.category === 'qe').length,
    },
  }
}
