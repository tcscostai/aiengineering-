export const HARNESS_PIPELINE = [
  { id: 'context', label: 'Context Assembly', description: 'Collect enterprise context from bound knowledge sources and initiative scope' },
  { id: 'prompt', label: 'Prompt Assembly', description: 'Assemble execution prompt from agent purpose, skills, and family' },
  { id: 'memory', label: 'Memory Retrieval', description: 'Retrieve relevant enterprise memory and knowledge artifacts' },
  { id: 'tool', label: 'Tool Routing', description: 'Route requests to connected enterprise tools' },
  { id: 'workflow', label: 'Workflow Routing', description: 'Position agent within enterprise workflow graph' },
  { id: 'collab', label: 'Agent Collaboration', description: 'Coordinate with reusable skills and peer agents' },
  { id: 'eval', label: 'Evaluation', description: 'Apply evaluation dimensions and quality gates' },
  { id: 'policy', label: 'Policy Enforcement', description: 'Enforce governance, PII, and responsible AI policies' },
  { id: 'obs', label: 'Observability', description: 'Emit telemetry, traces, and audit records' },
  { id: 'human', label: 'Human Approval', description: 'Route to human approver when required by policy' },
]

export const ENTERPRISE_SOURCES = [
  'Jira', 'Confluence', 'ServiceNow', 'Architecture Repository',
  'Policies', 'Source Code', 'Historical Projects', 'APIs', 'Standards',
]

export const SOURCE_TOOL_MAP = {
  Jira: 'Jira',
  Confluence: 'Confluence',
  ServiceNow: 'ServiceNow',
  'Architecture Repository': 'GitHub',
  Policies: 'Confluence',
  'Source Code': 'GitHub',
  'Historical Projects': 'Azure DevOps',
  APIs: 'Postman',
  Standards: 'Confluence',
}

export function agentEligibleForHarness(agent) {
  if (!agent) return false
  return agent.connectionStatus === 'verified' || ['certified', 'published'].includes(agent.stage)
}
