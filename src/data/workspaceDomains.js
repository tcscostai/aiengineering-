import { CATEGORIES } from '../lib/constants'
import { PLATFORM_TOOLS } from './platformTools'

export const WORKSPACE_INDUSTRIES = [
  'Healthcare',
  'Financial Services',
  'Retail',
  'Manufacturing',
  'Technology',
  'General',
]

export const WORKSPACE_DOMAIN_TEMPLATES = {
  ad: {
    id: 'ad',
    label: CATEGORIES.ad.label,
    short: CATEGORIES.ad.short,
    color: CATEGORIES.ad.color,
    defaultPlatform: 'sel',
    tagline: 'SDLC acceleration — architecture, APIs, code review, and delivery',
    objectiveTemplate: 'Accelerate application delivery with AI-assisted design, review, and integration patterns.',
    deliverables: [
      'Architecture sign-off gate',
      'API contracts & OpenAPI specs',
      'Automated code review in CI/CD',
      'Security & compliance checks',
    ],
    suggestedAgents: ['Architecture Review Agent', 'API Design Agent', 'Code Review Agent'],
    engineeringPath: '/ad',
  },
  ams: {
    id: 'ams',
    label: CATEGORIES.ams.label,
    short: CATEGORIES.ams.short,
    color: CATEGORIES.ams.color,
    defaultPlatform: 'ignio',
    tagline: 'Incident response, RCA, runbooks, and autonomous operations',
    objectiveTemplate: 'Reduce MTTR with AI-AMS incident classification, root cause analysis, and runbook automation.',
    deliverables: [
      'Incident classification & routing',
      'Automated RCA with telemetry correlation',
      'Runbook generation & knowledge capture',
      'AIOps remediation playbooks',
    ],
    suggestedAgents: ['Incident Classification Agent', 'RCA Agent', 'Runbook Assistant Agent'],
    engineeringPath: '/ams',
  },
  qe: {
    id: 'qe',
    label: CATEGORIES.qe.label,
    short: CATEGORIES.qe.short,
    color: CATEGORIES.qe.color,
    defaultPlatform: 'sel',
    tagline: 'Test design, regression, API validation, and release quality gates',
    objectiveTemplate: 'Increase automation coverage and release confidence with agent-driven test design and execution.',
    deliverables: [
      'Regression suite automation',
      'API contract & security tests',
      'Synthetic test data generation',
      'Release quality gate scoring',
    ],
    suggestedAgents: ['Regression Test Agent', 'API Test Agent'],
    engineeringPath: '/qe',
  },
}

export function buildDefaultDomainPlan(domainId) {
  const template = WORKSPACE_DOMAIN_TEMPLATES[domainId]
  if (!template) return null
  return {
    enabled: false,
    platformTool: template.defaultPlatform,
    objective: template.objectiveTemplate,
    deliverables: template.deliverables.map((label) => ({ label, selected: true })),
    suggestedAgents: [...template.suggestedAgents],
    status: 'planned',
  }
}

export function buildEmptyDomainPlans() {
  return Object.fromEntries(
    Object.keys(WORKSPACE_DOMAIN_TEMPLATES).map((id) => [id, buildDefaultDomainPlan(id)])
  )
}

export function getPlatformLabel(platformToolId) {
  return PLATFORM_TOOLS[platformToolId]?.name ?? platformToolId
}
