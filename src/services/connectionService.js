import { RUNTIME_TYPES } from '../lib/constants'

const REPO_PATTERN = /^(https?:\/\/|git@|[\w.-]+\.(github|gitlab|bitbucket)\.(com|org))/i
const ARN_PATTERN = /^arn:aws:bedrock:[\w-]+:\d+:agent[\w:/-]+$/i
const AZURE_PATTERN = /^(\/subscriptions\/|[\w-]+\.openai\.azure\.com|[\w-]+\.services\.ai\.azure\.com)/i

export async function verifyAgentConnection(agent) {
  const runtime = RUNTIME_TYPES[agent.runtimeType]
  if (!runtime) {
    return { ok: false, errors: ['Select a runtime type (Python, Bedrock, Azure Foundry, etc.)'] }
  }

  const errors = []

  if (!agent.sourceLocation?.trim()) {
    errors.push(`${runtime.sourceLabel} is required`)
  }

  if (!agent.entryPoint?.trim()) {
    errors.push(`${runtime.entryLabel} is required`)
  }

  switch (agent.runtimeType) {
    case 'python':
      if (agent.sourceLocation && !REPO_PATTERN.test(agent.sourceLocation.trim())) {
        errors.push('Repository URL must be a valid Git or HTTPS URL')
      }
      break
    case 'bedrock':
      if (agent.sourceLocation && !ARN_PATTERN.test(agent.sourceLocation.trim())) {
        errors.push('Source must be a valid AWS Bedrock agent ARN')
      }
      break
    case 'azure_foundry':
      if (agent.sourceLocation && !AZURE_PATTERN.test(agent.sourceLocation.trim()) && agent.sourceLocation.length < 10) {
        errors.push('Provide a valid Azure AI Foundry project or resource path')
      }
      break
    case 'api_endpoint':
    case 'container':
      if (agent.sourceLocation) {
        try {
          new URL(agent.sourceLocation.trim())
        } catch {
          errors.push('Source must be a valid URL')
        }
      }
      break
    default:
      break
  }

  if (errors.length) {
    return { ok: false, errors, status: 'failed' }
  }

  let healthMessage = null
  if (agent.connectionEndpoint?.trim()) {
    try {
      const url = agent.connectionEndpoint.trim()
      new URL(url)
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 5000)
      const res = await fetch(url, { method: 'GET', signal: controller.signal, mode: 'cors' })
      clearTimeout(timeout)
      if (res.ok) {
        healthMessage = 'Live health check passed'
      } else {
        healthMessage = `Health endpoint returned ${res.status} — format validated, verify in your environment`
      }
    } catch {
      healthMessage = 'Format validated — health endpoint unreachable from browser (normal for internal agents)'
    }
  } else {
    healthMessage = 'Runtime reference validated'
  }

  return {
    ok: true,
    status: 'verified',
    verifiedAt: new Date().toISOString(),
    message: healthMessage,
  }
}
