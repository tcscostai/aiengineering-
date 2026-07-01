import { RUNTIME_TYPES } from '../lib/constants'
import { getPlatformToolForAgent } from '../data/platformTools'

const REPO_PATTERN = /^(https?:\/\/|git@|[\w.-]+\.(github|gitlab|bitbucket)\.(com|org))/i
const ARN_PATTERN = /^arn:aws:bedrock:[\w-]+:\d+:agent[\w:/-]+$/i
const AZURE_PATTERN = /^(\/subscriptions\/|[\w-]+\.openai\.azure\.com|[\w-]+\.services\.ai\.azure\.com)/i

function validateUrl(value, label) {
  try {
    new URL(value.trim())
    return null
  } catch {
    return `${label} must be a valid URL`
  }
}

function validatePlatformEndpoint(agent, platform) {
  const errors = []
  const base = agent.sourceLocation?.trim() ?? ''

  if (!base) {
    errors.push(`${RUNTIME_TYPES[platform.runtimeType]?.sourceLabel ?? 'Base URL'} is required`)
  } else {
    const urlErr = validateUrl(base, 'Platform base URL')
    if (urlErr) errors.push(urlErr)
  }

  if (!agent.entryPoint?.trim()) {
    errors.push(`${RUNTIME_TYPES[platform.runtimeType]?.entryLabel ?? 'Agent ID'} is required`)
  }

  if (platform.id === 'sel' && base && !/\/(api|sel)/i.test(base)) {
    errors.push('SEL base URL should include an API path (e.g. /api/v1)')
  }
  if (platform.id === 'ignio' && base && !/ignio/i.test(base) && !/\/(workspace|flows)/i.test(base)) {
    errors.push('Ignio workspace URL should reference an Ignio host or workspace path')
  }
  if (platform.id === 'are' && base && !/(are|aiops)/i.test(base) && !/\/v\d/i.test(base)) {
    errors.push('ARE tenant URL should reference an AIOps tenant or versioned API path')
  }

  return errors
}

export async function verifyAgentConnection(agent) {
  const runtime = RUNTIME_TYPES[agent.runtimeType]
  const platform = getPlatformToolForAgent(agent)

  if (!runtime) {
    return { ok: false, errors: ['Select a runtime type (SEL, Ignio, ARE, Python, Bedrock, etc.)'] }
  }

  const errors = []

  if (['sel_api', 'ignio_api', 'are_api'].includes(agent.runtimeType)) {
    errors.push(...validatePlatformEndpoint(agent, platform))
  } else {
    if (!agent.sourceLocation?.trim()) {
      errors.push(`${runtime.sourceLabel} is required`)
    }

    if (!agent.entryPoint?.trim()) {
      errors.push(`${runtime.entryLabel} is required`)
    }
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
    case 'sel_api':
    case 'ignio_api':
    case 'are_api':
      if (agent.sourceLocation) {
        const urlErr = validateUrl(agent.sourceLocation, 'Source')
        if (urlErr) errors.push(urlErr)
      }
      break
    default:
      break
  }

  if (errors.length) {
    return { ok: false, errors, status: 'failed' }
  }

  let healthMessage = null
  const healthUrl = agent.connectionEndpoint?.trim()
  const defaultHealth =
    ['sel_api', 'ignio_api', 'are_api'].includes(agent.runtimeType) && agent.sourceLocation?.trim() && platform.healthPath
      ? new URL(platform.healthPath, agent.sourceLocation.trim()).href
      : null
  const probeUrl = healthUrl || defaultHealth

  if (probeUrl) {
    try {
      new URL(probeUrl)
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 5000)
      const res = await fetch(probeUrl, { method: 'GET', signal: controller.signal, mode: 'cors' })
      clearTimeout(timeout)
      if (res.ok) {
        healthMessage = platform.id !== 'external'
          ? `${platform.verifyMessage} · live health check passed`
          : 'Live health check passed'
      } else {
        healthMessage = platform.id !== 'external'
          ? `${platform.verifyMessage} · health returned ${res.status} (format validated)`
          : `Health endpoint returned ${res.status} — format validated, verify in your environment`
      }
    } catch {
      healthMessage = platform.id !== 'external'
        ? `${platform.verifyMessage} · endpoint unreachable from browser (normal for internal planes)`
        : 'Format validated — health endpoint unreachable from browser (normal for internal agents)'
    }
  } else {
    healthMessage = platform.id !== 'external' ? platform.verifyMessage : 'Runtime reference validated'
  }

  return {
    ok: true,
    status: 'verified',
    verifiedAt: new Date().toISOString(),
    message: healthMessage,
    platformTool: platform.id,
  }
}
