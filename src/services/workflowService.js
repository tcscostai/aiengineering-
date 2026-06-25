import { loadJSON, saveJSON, generateId } from '../lib/storage'
import { WORKFLOW_SCHEMA_VERSION } from '../lib/workflowSchema'
import { getAgentById } from './agentService'
import { executeHarnessRun } from './harnessService'

const WORKFLOWS_KEY = 'agent_workflows'
const WORKFLOW_RUNS_KEY = 'workflow_runs'

export function getAllWorkflows() {
  return loadJSON(WORKFLOWS_KEY, []).sort(
    (a, b) => new Date(b.updatedAt ?? b.metadata?.updatedAt ?? 0) - new Date(a.updatedAt ?? a.metadata?.updatedAt ?? 0)
  )
}

export function getWorkflowById(id) {
  return getAllWorkflows().find((w) => w.id === id) ?? null
}

export function saveWorkflow(workflow) {
  const list = getAllWorkflows()
  const now = new Date().toISOString()
  const wf = {
    ...workflow,
    schemaVersion: WORKFLOW_SCHEMA_VERSION,
    id: workflow.id || generateId('wf'),
    updatedAt: now,
    metadata: { ...workflow.metadata, updatedAt: now },
  }
  if (!wf.createdAt) wf.createdAt = now
  const idx = list.findIndex((w) => w.id === wf.id)
  if (idx >= 0) list[idx] = wf
  else list.unshift(wf)
  saveJSON(WORKFLOWS_KEY, list)
  return wf
}

export function deleteWorkflow(id) {
  saveJSON(WORKFLOWS_KEY, getAllWorkflows().filter((w) => w.id !== id))
}

export function exportWorkflowJSON(workflow) {
  const agentRefs = workflow.nodes
    .filter((n) => n.type === 'agent' && n.agentId)
    .map((n) => {
      const agent = getAgentById(n.agentId)
      return {
        ref: n.agentId,
        name: agent?.name ?? n.label,
        version: agent?.version ?? n.agentVersion,
        runtime: agent?.runtimeType ?? n.runtimeType,
        category: agent?.category,
      }
    })

  const uniqueRefs = [...new Map(agentRefs.map((r) => [r.ref, r])).values()]

  return {
    schemaVersion: WORKFLOW_SCHEMA_VERSION,
    workflowId: workflow.id,
    name: workflow.name,
    description: workflow.description,
    category: workflow.category,
    project: workflow.project,
    createdBy: workflow.createdBy,
    agents: uniqueRefs,
    nodes: workflow.nodes.map(({ id, type, agentId, label, task, approverRole, position, data }) => ({
      id,
      type,
      agentRef: agentId,
      label,
      task,
      approverRole,
      position,
      ...(data && Object.keys(data).length ? { data } : {}),
    })),
    edges: workflow.edges.map(({ id, source, target, handoff }) => ({
      id,
      from: source,
      to: target,
      handoff: handoff || 'default_output',
    })),
    harnessPolicy: workflow.harnessPolicy,
    metadata: {
      ...workflow.metadata,
      exportedAt: new Date().toISOString(),
    },
  }
}

export function parseImportedWorkflow(json, agents) {
  if (!json || json.schemaVersion !== WORKFLOW_SCHEMA_VERSION) {
    throw new Error(`Unsupported schema. Expected ${WORKFLOW_SCHEMA_VERSION}`)
  }

  const agentMap = new Map(agents.map((a) => [a.id, a]))
  const byName = new Map(agents.map((a) => [a.name.toLowerCase(), a]))

  const resolutions = []
  const nodes = (json.nodes ?? []).map((n) => {
    let agentId = n.agentRef ?? n.agentId
    let agent = agentId ? agentMap.get(agentId) : null

    if (!agent && n.label) {
      agent = byName.get(n.label.toLowerCase())
      agentId = agent?.id
    }

    if (n.type === 'agent') {
      resolutions.push({
        nodeId: n.id,
        label: n.label,
        status: agent ? (agent.version === n.agentVersion ? 'matched' : 'version_mismatch') : 'missing',
        agentId: agent?.id,
        agentName: agent?.name,
      })
    }

    return {
      id: n.id || generateId('node'),
      type: n.type,
      agentId: agentId ?? n.agentRef,
      label: n.label ?? agent?.name ?? 'Agent',
      task: n.task ?? '',
      approverRole: n.approverRole,
      position: n.position ?? { x: 100, y: 100 },
      agentVersion: agent?.version,
      runtimeType: agent?.runtimeType,
    }
  })

  const edges = (json.edges ?? []).map((e) => ({
    id: e.id || `e-${e.from ?? e.source}-${e.to ?? e.target}`,
    source: e.from ?? e.source,
    target: e.to ?? e.target,
    handoff: e.handoff,
  }))

  return {
    workflow: {
      schemaVersion: WORKFLOW_SCHEMA_VERSION,
      id: generateId('wf'),
      name: json.name ?? 'Imported Workflow',
      description: json.description ?? '',
      category: json.category ?? 'ad',
      project: json.project ?? '',
      createdBy: json.createdBy ?? '',
      nodes,
      edges,
      harnessPolicy: json.harnessPolicy ?? {
        enforceEvaluation: true,
        minEvalScore: 85,
        requireGovernance: true,
        observability: true,
      },
      metadata: {
        reuseCount: 0,
        certified: false,
        tags: json.metadata?.tags ?? [],
        importedAt: new Date().toISOString(),
      },
    },
    resolutions,
  }
}

export function validateWorkflow(workflow, agents) {
  const errors = []
  const warnings = []

  if (!workflow.name?.trim()) errors.push('Workflow name is required')
  if (workflow.nodes.length === 0) errors.push('Add at least one node to the workflow')

  const agentNodes = workflow.nodes.filter((n) => n.type === 'agent')
  if (agentNodes.length === 0) warnings.push('No agent nodes — workflow has no executable agents')

  const agentMap = new Map(agents.map((a) => [a.id, a]))

  agentNodes.forEach((n) => {
    const agent = agentMap.get(n.agentId)
    if (!agent) errors.push(`Node "${n.label}": agent not found — register in Onboarding Studio`)
    else if (agent.connectionStatus !== 'verified' && !['certified', 'published'].includes(agent.stage)) {
      warnings.push(`Node "${n.label}": agent runtime not verified`)
    }
  })

  const nodeIds = new Set(workflow.nodes.map((n) => n.id))
  workflow.edges.forEach((e) => {
    if (!nodeIds.has(e.source)) errors.push(`Edge references missing source node: ${e.source}`)
    if (!nodeIds.has(e.target)) errors.push(`Edge references missing target node: ${e.target}`)
  })

  return { valid: errors.length === 0, errors, warnings }
}

function getExecutionOrder(workflow) {
  const agentNodes = workflow.nodes.filter((n) => n.type === 'agent')
  if (workflow.edges.length === 0) return agentNodes

  const adj = new Map()
  const inDegree = new Map()
  workflow.nodes.forEach((n) => {
    adj.set(n.id, [])
    inDegree.set(n.id, 0)
  })
  workflow.edges.forEach((e) => {
    if (adj.has(e.source) && inDegree.has(e.target)) {
      adj.get(e.source).push(e.target)
      inDegree.set(e.target, inDegree.get(e.target) + 1)
    }
  })

  const queue = workflow.nodes.filter((n) => inDegree.get(n.id) === 0).map((n) => n.id)
  const order = []
  while (queue.length) {
    const id = queue.shift()
    const node = workflow.nodes.find((n) => n.id === id)
    if (node?.type === 'agent') order.push(node)
    for (const next of adj.get(id) ?? []) {
      inDegree.set(next, inDegree.get(next) - 1)
      if (inDegree.get(next) === 0) queue.push(next)
    }
  }

  if (order.length < agentNodes.length) return agentNodes
  return order
}

export function getWorkflowRuns(limit = 30) {
  return loadJSON(WORKFLOW_RUNS_KEY, [])
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, limit)
}

function saveWorkflowRun(run) {
  const runs = loadJSON(WORKFLOW_RUNS_KEY, [])
  runs.unshift(run)
  saveJSON(WORKFLOW_RUNS_KEY, runs.slice(0, 50))
  return run
}

export async function executeWorkflow(workflow, task, onUpdate) {
  const order = getExecutionOrder(workflow)
  const run = {
    id: generateId('wfrun'),
    workflowId: workflow.id,
    workflowName: workflow.name,
    status: 'running',
    task,
    steps: [],
    logs: [{ time: new Date().toISOString(), level: 'info', message: `Workflow "${workflow.name}" started` }],
    createdAt: new Date().toISOString(),
  }
  saveWorkflowRun(run)
  onUpdate?.(run)

  for (let i = 0; i < order.length; i++) {
    const node = order[i]
    const agent = getAgentById(node.agentId)
    if (!agent) {
      run.status = 'failed'
      run.logs.push({ time: new Date().toISOString(), level: 'error', message: `Agent missing for node ${node.label}` })
      saveWorkflowRun(run)
      onUpdate?.({ ...run })
      return run
    }

    run.logs.push({
      time: new Date().toISOString(),
      level: 'info',
      message: `Step ${i + 1}/${order.length}: Harness for ${agent.name}`,
    })
    onUpdate?.({ ...run })

    const nodeTask = node.task || `${task} — step ${node.label}`
    const harnessResult = await executeHarnessRun(agent, nodeTask, null)

    run.steps.push({
      nodeId: node.id,
      agentId: agent.id,
      agentName: agent.name,
      harnessRunId: harnessResult.id,
      status: harnessResult.status,
    })

    if (harnessResult.status === 'pending_approval') {
      run.status = 'pending_approval'
      run.logs.push({ time: new Date().toISOString(), level: 'warn', message: 'Workflow paused for human approval' })
      saveWorkflowRun(run)
      onUpdate?.({ ...run })
      return run
    }
    if (harnessResult.status !== 'completed') {
      run.status = 'failed'
      saveWorkflowRun(run)
      onUpdate?.({ ...run })
      return run
    }
  }

  run.status = 'completed'
  run.completedAt = new Date().toISOString()
  run.logs.push({ time: new Date().toISOString(), level: 'info', message: 'Workflow completed successfully' })

  const wf = getWorkflowById(workflow.id)
  if (wf) {
    saveWorkflow({ ...wf, metadata: { ...wf.metadata, reuseCount: (wf.metadata.reuseCount ?? 0) + 1 } })
  }

  saveWorkflowRun(run)
  onUpdate?.({ ...run })
  return run
}

export function downloadWorkflowJSON(workflow) {
  const json = exportWorkflowJSON(workflow)
  const blob = new Blob([JSON.stringify(json, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${(workflow.name || 'workflow').replace(/\s+/g, '-').toLowerCase()}.horizon-workflow.json`
  a.click()
  URL.revokeObjectURL(url)
}
