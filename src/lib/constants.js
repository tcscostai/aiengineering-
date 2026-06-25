export const CATEGORIES = {
  ad: { id: 'ad', label: 'Application Development', short: 'AD', color: '#5ec8f2' },
  ams: { id: 'ams', label: 'AMS', short: 'AMS', color: '#9b8bd4' },
  qe: { id: 'qe', label: 'Quality Engineering', short: 'QE', color: '#3ecf9b' },
}

export const RUNTIME_TYPES = {
  python: {
    id: 'python',
    label: 'Python Service',
    short: 'Python',
    color: '#3ecf9b',
    sourceLabel: 'Repository URL',
    sourcePlaceholder: 'https://github.com/org/rca-agent or git@github.com:org/rca-agent.git',
    entryLabel: 'Entry Point',
    entryPlaceholder: 'agents.rca.handler or src/main.py',
    healthPlaceholder: 'https://api.internal/agents/rca/health (optional)',
  },
  bedrock: {
    id: 'bedrock',
    label: 'AWS Bedrock Agent',
    short: 'Bedrock',
    color: '#e8b84a',
    sourceLabel: 'Agent ARN / Alias',
    sourcePlaceholder: 'arn:aws:bedrock:us-east-1:123456789:agent/ABC123',
    entryLabel: 'Agent Alias ID',
    entryPlaceholder: 'TSTALIASID or production alias',
    healthPlaceholder: 'Bedrock invoke endpoint or gateway URL (optional)',
  },
  azure_foundry: {
    id: 'azure_foundry',
    label: 'Azure AI Foundry',
    short: 'Foundry',
    color: '#5ec8f2',
    sourceLabel: 'Project / Agent Resource ID',
    sourcePlaceholder: '/subscriptions/.../projects/my-project/agents/my-agent',
    entryLabel: 'Deployment Name',
    entryPlaceholder: 'gpt-4o-deployment or agent-deployment-v1',
    healthPlaceholder: 'https://my-agent.azurewebsites.net/api/health (optional)',
  },
  api_endpoint: {
    id: 'api_endpoint',
    label: 'API Endpoint',
    short: 'API',
    color: '#9b8bd4',
    sourceLabel: 'Agent API Base URL',
    sourcePlaceholder: 'https://agents.company.com/v1/rca',
    entryLabel: 'Invoke Path',
    entryPlaceholder: '/invoke or /chat/completions',
    healthPlaceholder: 'https://agents.company.com/health',
  },
  container: {
    id: 'container',
    label: 'Container / K8s',
    short: 'K8s',
    color: '#f08984',
    sourceLabel: 'Image / Deployment Reference',
    sourcePlaceholder: 'myregistry.azurecr.io/agents/rca:2.1.0',
    entryLabel: 'Service Endpoint',
    entryPlaceholder: 'https://rca-agent.namespace.svc.cluster.local',
    healthPlaceholder: 'https://rca-agent.company.com/health',
  },
}

export const ONBOARDING_STAGES = [
  { id: 'draft', label: 'Registered', index: 0 },
  { id: 'configured', label: 'Runtime Connected', index: 1 },
  { id: 'knowledge_connected', label: 'Skills & Knowledge', index: 2 },
  { id: 'tool_connected', label: 'Tools Connected', index: 3 },
  { id: 'workflow_designed', label: 'Workflow Mapped', index: 4 },
  { id: 'evaluated', label: 'Evaluated', index: 5 },
  { id: 'governance_approved', label: 'Governance Approved', index: 6 },
  { id: 'certified', label: 'Certified', index: 7 },
  { id: 'published', label: 'Published', index: 8 },
]

export const STAGE_INDEX = Object.fromEntries(ONBOARDING_STAGES.map((s) => [s.id, s.index]))

export const INITIATIVE_STATUSES = ['planning', 'active', 'completed', 'on-hold']

export function getStageLabel(stageId) {
  return ONBOARDING_STAGES.find((s) => s.id === stageId)?.label ?? stageId
}

export function getNextStage(stageId) {
  const idx = STAGE_INDEX[stageId]
  if (idx === undefined || idx >= ONBOARDING_STAGES.length - 1) return null
  return ONBOARDING_STAGES[idx + 1].id
}

export function categoryToMarketplaceLabel(category) {
  return CATEGORIES[category]?.short ?? category.toUpperCase()
}

export function getRuntimeLabel(runtimeType) {
  return RUNTIME_TYPES[runtimeType]?.label ?? runtimeType ?? 'Unknown'
}

export function getRuntimeShort(runtimeType) {
  return RUNTIME_TYPES[runtimeType]?.short ?? runtimeType ?? '?'
}
