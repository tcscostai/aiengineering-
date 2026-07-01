/** Enterprise platform tools hookable at agent registration */

export const PLATFORM_TOOLS = {
  sel: {
    id: 'sel',
    name: 'SEL',
    fullName: 'SEL — Software Engineering Layer',
    tagline: 'AD & QE engineering — build, test, and API-driven agents',
    domains: ['Application Development', 'Quality Engineering'],
    categories: ['ad', 'qe'],
    color: '#5ec8f2',
    runtimeType: 'sel_api',
    healthPath: '/health',
    invokePathDefault: '/agents/invoke',
    verifyMessage: 'SEL API endpoint validated — agent registered on engineering layer',
    harnessLabel: 'SEL execution plane',
    evaluationNote: 'Evaluation runs against SEL quality gates and trace export',
  },
  ignio: {
    id: 'ignio',
    name: 'Ignio',
    fullName: 'Ignio — AI-AMS',
    tagline: 'Autonomous application management — incidents, runbooks, ops automation',
    domains: ['AMS', 'AI-AMS'],
    categories: ['ams'],
    color: '#9b8bd4',
    runtimeType: 'ignio_api',
    healthPath: '/api/health',
    invokePathDefault: '/flows/execute',
    verifyMessage: 'Ignio AI-AMS hook verified — agent bound to operations plane',
    harnessLabel: 'Ignio AI-AMS orchestration',
    evaluationNote: 'Evaluation includes AMS incident accuracy and runbook quality dimensions',
  },
  are: {
    id: 'are',
    name: 'ARE',
    fullName: 'ARE — AIOps Remediation Engine',
    tagline: 'AIOps — observability-driven remediation and autonomous operations',
    domains: ['AIOps', 'AMS'],
    categories: ['ams'],
    secondaryCategories: ['ad', 'qe'],
    color: '#e8b84a',
    runtimeType: 'are_api',
    healthPath: '/v1/status',
    invokePathDefault: '/playbooks/run',
    verifyMessage: 'ARE AIOps endpoint validated — remediation plane connected',
    harnessLabel: 'ARE AIOps remediation plane',
    evaluationNote: 'Evaluation validates AIOps remediation safety and observability alignment',
  },
  external: {
    id: 'external',
    name: 'External',
    fullName: 'External Runtime',
    tagline: 'Python, Bedrock, Foundry, K8s, or custom APIs — onboard without platform hook',
    domains: ['Any'],
    categories: ['ad', 'ams', 'qe'],
    color: '#8b9cb0',
    runtimeType: '',
    harnessLabel: 'External runtime',
    evaluationNote: 'Standard TCS evaluation pipeline',
  },
}

export function getPlatformTool(id) {
  return PLATFORM_TOOLS[id] ?? PLATFORM_TOOLS.external
}

export function getDefaultPlatformTool(category) {
  if (category === 'ams') return 'ignio'
  if (category === 'ad' || category === 'qe') return 'sel'
  return 'external'
}

export function getPlatformToolsForCategory(category) {
  const rank = (tool) => {
    if (tool.id === 'external') return 3
    if (tool.categories.includes(category)) return 0
    if (tool.secondaryCategories?.includes(category)) return 1
    return 2
  }
  return Object.values(PLATFORM_TOOLS).sort((a, b) => rank(a) - rank(b))
}

export function isPlatformRuntime(runtimeType) {
  return ['sel_api', 'ignio_api', 'are_api'].includes(runtimeType)
}

export function getPlatformToolForAgent(agent) {
  if (agent?.platformTool) return getPlatformTool(agent.platformTool)
  if (isPlatformRuntime(agent?.runtimeType)) {
    return Object.values(PLATFORM_TOOLS).find((t) => t.runtimeType === agent.runtimeType) ?? PLATFORM_TOOLS.external
  }
  return PLATFORM_TOOLS.external
}
