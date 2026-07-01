import { loadJSON, saveJSON } from '../lib/storage'
import { getAllInitiatives, getInitiativeById, updateInitiative } from './initiativeService'
import { getAllAgents } from './agentService'
import { getHarnessRuns } from './harnessService'
import { getEvaluationRuns } from './evaluationService'
import { getScanHistory } from './reverseEngineeringService'
import { ENTERPRISE_FLOW_STEPS, DEMO_FLOW_WORKSPACE_ID } from '../data/enterpriseFlowSteps'
import { isDemoScanId } from '../data/demoReScanResult'

const FLOW_KEY = 'enterprise_flow'

function defaultFlow() {
  return {
    workspaceId: null,
    startedAt: null,
    manualCompleted: [],
    reScanId: null,
    focusedStepId: null,
    lastNavTick: 0,
  }
}

export function getFlowRecord() {
  return { ...defaultFlow(), ...loadJSON(FLOW_KEY, {}) }
}

export function saveFlowRecord(patch) {
  const next = { ...getFlowRecord(), ...patch, updatedAt: new Date().toISOString() }
  saveJSON(FLOW_KEY, next)
  window.dispatchEvent(new Event('horizon-storage'))
  return next
}

export function startEnterpriseFlow(workspaceId) {
  return saveFlowRecord({
    workspaceId,
    startedAt: new Date().toISOString(),
    manualCompleted: [],
    focusedStepId: ENTERPRISE_FLOW_STEPS[0].id,
    reScanId: null,
  })
}

export function startDemoEnterpriseFlow() {
  return startEnterpriseFlow(DEMO_FLOW_WORKSPACE_ID)
}

export function markFlowStepComplete(stepId) {
  const flow = getFlowRecord()
  if (!flow.manualCompleted.includes(stepId)) {
    saveFlowRecord({ manualCompleted: [...flow.manualCompleted, stepId] })
  }
}

export function linkReScanToFlow(scanId) {
  const flow = getFlowRecord()
  if (!flow.workspaceId) return
  saveFlowRecord({ reScanId: scanId })
  markFlowStepComplete('reverse_engineering')
  const ws = getInitiativeById(flow.workspaceId)
  if (ws) updateInitiative(ws.id, { reScanId: scanId })
}

function workspaceAgents(workspace, agents) {
  if (!workspace?.title) return []
  return agents.filter(
    (a) =>
      a.project?.trim() === workspace.title.trim() ||
      workspace.linkedAgentIds?.includes(a.id)
  )
}

function hasVerifiedPlatform(agents, category, platformTool) {
  return agents.some(
    (a) =>
      a.category === category &&
      a.connectionStatus === 'verified' &&
      (a.platformTool === platformTool ||
        (platformTool === 'sel' && a.runtimeType === 'sel_api') ||
        (platformTool === 'ignio' && a.runtimeType === 'ignio_api') ||
        (platformTool === 'are' && a.runtimeType === 'are_api'))
  )
}

function stepComplete(step, ctx) {
  const { workspace, wsAgents, harnessRuns, evalRuns, flow } = ctx
  if (flow.manualCompleted.includes(step.id)) return true

  switch (step.id) {
    case 'workspace':
      return !!workspace && (workspace.domains?.length ?? 0) > 0
    case 'onboard_sel':
      return hasVerifiedPlatform(wsAgents, 'ad', 'sel')
    case 'onboard_ignio':
      return hasVerifiedPlatform(wsAgents, 'ams', 'ignio')
    case 'onboard_are':
      return hasVerifiedPlatform(wsAgents, 'ams', 'are')
    case 'onboard_qe':
      return hasVerifiedPlatform(wsAgents, 'qe', 'sel')
    case 'engineer_ad':
      return harnessRuns.some(
        (r) => r.status === 'completed' && wsAgents.some((a) => a.id === r.agentId && a.category === 'ad')
      )
    case 'engineer_ams':
      return harnessRuns.some(
        (r) => r.status === 'completed' && wsAgents.some((a) => a.id === r.agentId && a.category === 'ams')
      )
    case 'engineer_qe':
      return harnessRuns.some(
        (r) => r.status === 'completed' && wsAgents.some((a) => a.id === r.agentId && a.category === 'qe')
      )
    case 'evaluate':
      return evalRuns.some(
        (r) => r.status === 'passed' && wsAgents.some((a) => a.id === r.agentId)
      )
    case 'govern':
      return (
        wsAgents.filter((a) => a.stage !== 'draft').length >= 2 &&
        wsAgents.filter((a) => a.governanceApproved).length >= 1
      )
    case 'deploy':
      return wsAgents.some((a) => a.stage === 'published' || (a.reuseCount ?? 0) > 0)
    case 'reverse_engineering':
      return !!flow.reScanId || !!workspace?.reScanId || getScanHistory().some((s) => isDemoScanId(s.id))
    default:
      return false
  }
}

export function computeEnterpriseFlow(ctxOverrides = {}) {
  const flow = getFlowRecord()
  const workspace =
    ctxOverrides.workspace ??
    (flow.workspaceId ? getInitiativeById(flow.workspaceId) : null) ??
    getAllInitiatives().find((w) => w.status === 'active') ??
    null

  const agents = ctxOverrides.agents ?? getAllAgents()
  const wsAgents = workspaceAgents(workspace, agents)
  const harnessRuns = ctxOverrides.harnessRuns ?? getHarnessRuns(200)
  const evalRuns = ctxOverrides.evalRuns ?? getEvaluationRuns(100)

  const ctx = { workspace, wsAgents, harnessRuns, evalRuns, flow }

  const steps = ENTERPRISE_FLOW_STEPS.map((step) => ({
    ...step,
    complete: stepComplete(step, ctx),
  }))

  const firstIncomplete = steps.find((s) => !s.complete) ?? null
  const focusedStep =
    steps.find((s) => s.id === flow.focusedStepId) ?? firstIncomplete ?? steps[0] ?? null

  const completedCount = steps.filter((s) => s.complete).length
  const progress = Math.round((completedCount / steps.length) * 100)

  return {
    active: !!flow.workspaceId,
    flow,
    workspace,
    steps,
    currentStep: focusedStep,
    firstIncomplete,
    completedCount,
    totalSteps: steps.length,
    progress,
    complete: completedCount === steps.length,
  }
}

export function getStepNavigation(step, workspace) {
  if (!step) return { route: '/workspace', state: { flowNavTick: Date.now() } }
  const tick = Date.now()
  const state = {
    ...step.navigateState,
    workspaceId: workspace?.id,
    project: workspace?.title,
    flowStep: step.id,
    platformTool: step.platformTool,
    flowNavTick: tick,
  }
  if (step.category && !state.category) state.category = step.category
  return { route: step.route, state }
}

/** Navigate to a specific flow step (updates focus + returns route/state). */
export function goToFlowStep(stepId, workspace) {
  const step = ENTERPRISE_FLOW_STEPS.find((s) => s.id === stepId)
  if (!step) return getStepNavigation(ENTERPRISE_FLOW_STEPS[0], workspace)
  saveFlowRecord({ focusedStepId: stepId, lastNavTick: Date.now() })
  return getStepNavigation(step, workspace)
}

function onStepRoute(step, pathname) {
  if (!step?.route) return false
  return pathname === step.route || pathname.endsWith(step.route)
}

/** Continue guided flow: navigate to focused step, or advance when already on its route. */
export function continueFlowNavigation(flowView, currentPath = '') {
  const step = flowView.currentStep ?? flowView.steps?.[0]
  if (!step) return getStepNavigation(ENTERPRISE_FLOW_STEPS[0], flowView.workspace)

  if (onStepRoute(step, currentPath)) {
    const idx = ENTERPRISE_FLOW_STEPS.findIndex((s) => s.id === step.id)
    const next = ENTERPRISE_FLOW_STEPS[Math.min(idx + 1, ENTERPRISE_FLOW_STEPS.length - 1)] ?? step
    saveFlowRecord({ focusedStepId: next.id, lastNavTick: Date.now() })
    return getStepNavigation(next, flowView.workspace)
  }

  saveFlowRecord({ focusedStepId: step.id, lastNavTick: Date.now() })
  return getStepNavigation(step, flowView.workspace)
}
