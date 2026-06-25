export const WORKFLOW_SCHEMA_VERSION = '1.0'

export const WORKFLOW_NODE_TYPES = {
  workflow_start: { label: 'Start', color: '#3ecf9b' },
  workflow_end: { label: 'End', color: '#f08984' },
  agent: { label: 'Agent', color: '#5ec8f2' },
  human_approval: { label: 'Human Approval', color: '#e8b84a' },
  policy_gate: { label: 'Policy Gate', color: '#9b8bd4' },
  parallel_fork: { label: 'Parallel Fork', color: '#9b8bd4' },
  parallel_join: { label: 'Parallel Join', color: '#9b8bd4' },
}

export const WORKFLOW_COMPONENTS = [
  { type: 'workflow_start', label: 'Start', description: 'Workflow entry point' },
  { type: 'workflow_end', label: 'End', description: 'Workflow completion' },
  { type: 'parallel_fork', label: 'Parallel Fork', description: 'Split into parallel branches' },
  { type: 'parallel_join', label: 'Parallel Join', description: 'Merge parallel branches' },
]

export function createEmptyWorkflow(category = 'ad') {
  return {
    schemaVersion: WORKFLOW_SCHEMA_VERSION,
    id: null,
    name: 'Untitled Agent Workflow',
    description: '',
    category,
    project: '',
    createdBy: '',
    nodes: [],
    edges: [],
    harnessPolicy: {
      enforceEvaluation: true,
      minEvalScore: 85,
      requireGovernance: true,
      observability: true,
    },
    metadata: {
      reuseCount: 0,
      certified: false,
      tags: [],
    },
  }
}
