import { getRuntimeShort } from './constants'

function slug(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}

/**
 * Builds a sequenced terminal session for marketplace agent deployment.
 * Each line: { kind: 'prompt'|'command'|'out'|'ok'|'warn'|'dim', text, pause? }
 */
export function buildAgentDeploySession(agent) {
  const id = agent.id
  const ver = agent.version ?? '1.0.0'
  const name = agent.name
  const runtime = agent.runtimeType
  const project = agent.project ?? 'default-initiative'
  const team = agent.team ?? 'engineering'
  const skills = agent.skills ?? []
  const knowledge = agent.knowledgeSources ?? []
  const tools = agent.tools ?? []
  const src = agent.sourceLocation ?? '—'
  const entry = agent.entryPoint ?? '—'
  const deployNum = (agent.reuseCount ?? 0) + 1

  const header = [
    { kind: 'dim', text: 'Last login: Thu Jun 25 09:14:22 on ttys003' },
    { kind: 'out', text: 'Horizon AI Engineering CLI v2.4.0 — enterprise agent runtime' },
    { kind: 'out', text: '────────────────────────────────────────────────────────' },
  ]

  const footer = [
    { kind: 'out', text: '' },
    { kind: 'out', text: `Binding ${skills.length} skill(s) · ${knowledge.length} knowledge source(s) · ${tools.length} tool(s)` },
    { kind: 'dim', text: `  skills: ${skills.slice(0, 4).join(', ')}${skills.length > 4 ? '…' : ''}` },
    { kind: 'dim', text: `  knowledge: ${knowledge.slice(0, 3).join(', ')}${knowledge.length > 3 ? '…' : ''}` },
    { kind: 'dim', text: `  tools: ${tools.slice(0, 4).join(', ')}${tools.length > 4 ? '…' : ''}` },
    { kind: 'out', text: '' },
    { kind: 'out', text: 'Registering with AI Harness orchestration layer…' },
    { kind: 'ok', text: '✓ Harness pipeline registered (10-step execution ready)' },
    { kind: 'out', text: `Publishing to Agent Runtime · deployment #${deployNum}` },
    { kind: 'ok', text: `✓ ${name} is LIVE — ready for workflows & initiatives` },
    { kind: 'out', text: '' },
    { kind: 'ok', text: `Deploy complete in`, pause: 0 },
    { kind: 'dim', text: `  agent_id: ${id}` },
    { kind: 'dim', text: `  project: ${project} · team: ${team}` },
    { kind: 'dim', text: `  marketplace_reuse_count: ${deployNum}` },
  ]

  const baseCmd = `horizon agents deploy --id ${id} --runtime ${runtime} --project "${project}"`

  let runtimeBlock = []

  switch (runtime) {
    case 'python':
      runtimeBlock = [
        { kind: 'prompt', text: baseCmd },
        { kind: 'out', text: '→ Resolving agent manifest from marketplace catalog…' },
        { kind: 'ok', text: `✓ ${name} v${ver} · ${getRuntimeShort(runtime)} · verified` },
        { kind: 'out', text: `→ Cloning runtime source: ${src}` },
        { kind: 'dim', text: 'Cloning into horizon-agent-workspace…' },
        { kind: 'dim', text: 'remote: Enumerating objects: 847, done.' },
        { kind: 'ok', text: '✓ Repository checked out @ main (a3f8c21)' },
        { kind: 'out', text: `→ Validating entry point: ${entry}` },
        { kind: 'ok', text: '✓ Module import successful · handler resolved' },
        { kind: 'out', text: '→ Creating Python 3.11 virtual environment…' },
        { kind: 'dim', text: 'Installing dependencies from requirements.txt…' },
        { kind: 'ok', text: '✓ 42 packages installed · boto3, pydantic, horizon-sdk' },
        { kind: 'out', text: agent.connectionEndpoint ? `→ Health check: ${agent.connectionEndpoint}` : '→ Skipping external health (internal network)' },
        { kind: 'ok', text: agent.connectionEndpoint ? '✓ Health endpoint validated (format OK)' : '✓ Runtime reference validated offline' },
      ]
      break

    case 'bedrock':
      runtimeBlock = [
        { kind: 'prompt', text: baseCmd },
        { kind: 'out', text: '→ Authenticating AWS profile: horizon-prod (us-east-1)…' },
        { kind: 'ok', text: '✓ STS session established · role: HorizonBedrockAgentDeploy' },
        { kind: 'out', text: `→ Resolving Bedrock agent ARN: ${src}` },
        { kind: 'ok', text: `✓ Agent found · alias: ${entry}` },
        { kind: 'out', text: '→ Invoking bedrock-agent-runtime prepare…' },
        { kind: 'dim', text: 'Syncing action groups & knowledge bases…' },
        { kind: 'ok', text: '✓ Agent alias PROD_ALIAS active' },
        { kind: 'out', text: '→ Warm-up invoke (latency probe)…' },
        { kind: 'dim', text: 'Response: 200 OK · 1,240ms · trace_id=brk_8f2a…' },
        { kind: 'ok', text: '✓ Bedrock agent runtime reachable' },
      ]
      break

    case 'azure_foundry':
      runtimeBlock = [
        { kind: 'prompt', text: baseCmd },
        { kind: 'out', text: '→ Azure CLI login: horizon-foundry-sp (subscription a1b2c3d4)…' },
        { kind: 'ok', text: '✓ Token acquired · Cognitive Services scope' },
        { kind: 'out', text: `→ Resolving Foundry resource: ${src.split('/').slice(-2).join('/')}` },
        { kind: 'ok', text: `✓ Project agent resource located` },
        { kind: 'out', text: `→ Deployment slot: ${entry}` },
        { kind: 'dim', text: 'Fetching deployment status from Azure AI Foundry…' },
        { kind: 'ok', text: '✓ Deployment Succeeded · model capacity: 30K TPM' },
        { kind: 'out', text: '→ Testing completions endpoint…' },
        { kind: 'dim', text: 'POST /openai/deployments/.../chat/completions → 200' },
        { kind: 'ok', text: '✓ Foundry agent endpoint ready' },
      ]
      break

    case 'api_endpoint':
      runtimeBlock = [
        { kind: 'prompt', text: baseCmd },
        { kind: 'out', text: `→ Base URL: ${src}` },
        { kind: 'out', text: `→ Invoke path: ${entry}` },
        { kind: 'ok', text: '✓ TLS certificate valid · horizon.internal CA' },
        { kind: 'out', text: '→ OAuth2 client_credentials token exchange…' },
        { kind: 'ok', text: '✓ Access token issued (expires 3600s)' },
        { kind: 'out', text: '→ Probe POST /invoke with harness handshake payload…' },
        { kind: 'dim', text: '{"status":"ready","agent_version":"' + ver + '","capabilities":["invoke"]}' },
        { kind: 'ok', text: '✓ API agent handshake complete' },
      ]
      break

    case 'container':
      runtimeBlock = [
        { kind: 'prompt', text: baseCmd },
        { kind: 'out', text: `→ Pulling image: ${src}` },
        { kind: 'dim', text: 'Pulling from horizonacr.azurecr.io…' },
        { kind: 'ok', text: '✓ Image pulled · sha256:4f9c…ab12 · 412MB' },
        { kind: 'out', text: '→ kubectl apply -n qe-agents -f deployment.yaml' },
        { kind: 'dim', text: 'deployment.apps/' + slug(name) + ' configured' },
        { kind: 'ok', text: '✓ Rollout status: 1/1 replicas ready' },
        { kind: 'out', text: `→ Service endpoint: ${entry}` },
        { kind: 'ok', text: '✓ Cluster DNS resolved · pod health: passing' },
      ]
      break

    default:
      runtimeBlock = [
        { kind: 'prompt', text: baseCmd },
        { kind: 'out', text: '→ Resolving agent runtime…' },
        { kind: 'ok', text: `✓ ${name} v${ver} ready` },
      ]
  }

  const governance = agent.governanceApproved
    ? [
        { kind: 'out', text: '→ Governance gate: responsible AI + audit trail…' },
        { kind: 'ok', text: `✓ Approved by ${agent.governanceApprover ?? 'governance board'}` },
      ]
    : [
        { kind: 'warn', text: '⚠ Governance approval pending — deploy allowed in staging only' },
      ]

  return [...header, ...runtimeBlock, ...governance, ...footer]
}
