import { getMigrationTarget, suggestTarget } from './migrationTargets'

/** Client-side blueprint generator — same logic as server/services/migrationBlueprint.js */
export function generateMigrationBlueprint(scan, options = {}) {
  const { stats, modules, findings, migration, manifests, graph } = scan
  const domain = stats.domain ?? 'general'
  const criticalFindings = findings.filter((f) => f.severity === 'critical' || f.severity === 'high')
  const targetId = options.targetStack ?? suggestTarget(stats.languages)
  const target = getMigrationTarget(targetId)

  const phases = [
    {
      id: 'phase-1',
      title: 'Discovery & Baseline',
      duration: '2–3 weeks',
      status: 'ready',
      objectives: [
        'Validate scan results against architecture repository',
        `Confirm migration target: ${target.label}`,
        'Establish migration KPIs and rollback criteria',
      ],
      deliverables: ['As-is architecture diagram', 'Risk register', `Target stack decision: ${target.label}`],
    },
    {
      id: 'phase-2',
      title: 'Strangler Facade & Stabilization',
      duration: '4–6 weeks',
      status: 'planned',
      objectives: [
        `Extract API facade for high-value ${domain} flows`,
        `Introduce ${target.tooling[0]} contract tests around legacy boundaries`,
        'Address critical security and dependency hotspots',
      ],
      deliverables: ['API gateway routes', 'Contract test suite', 'Security remediation plan'],
      targetModules: modules.slice(0, 3).map((m) => m.label),
    },
    {
      id: 'phase-3',
      title: target.phase3Title,
      duration: `${Math.round(6 * target.effortMultiplier)}–${Math.round(10 * target.effortMultiplier)} weeks`,
      status: 'planned',
      objectives: target.phase3Objectives,
      deliverables: [`${target.label} project scaffold`, 'Module migration backlog', 'Harness run reports'],
      targetModules: modules.slice(1, 5).map((m) => m.label),
    },
    {
      id: 'phase-4',
      title: 'Cutover & Decommission',
      duration: '3–4 weeks',
      status: 'planned',
      objectives: [
        `Progressive traffic shift to ${target.label} deployment`,
        'Governance sign-off and evaluation gate',
        'Legacy module decommission and knowledge capture',
      ],
      deliverables: ['Cutover runbook', 'Governance approval packet', 'Updated Knowledge Fabric nodes'],
    },
  ]

  const risks = criticalFindings.slice(0, 8).map((f) => ({
    id: f.id,
    title: f.label,
    severity: f.severity,
    file: f.file,
    line: f.line,
    mitigation: mitigationFor(f),
  }))

  if (risks.length === 0) {
    risks.push({
      id: 'risk-default',
      title: 'Undocumented integration dependencies',
      severity: 'medium',
      mitigation: 'Run dependency graph review and add contract tests before extraction.',
    })
  }

  const asIs = {
    label: 'As-Is (Legacy)',
    architecture: stats.languages.length > 2 ? 'Polyglot monolith / modular monolith' : 'Monolithic application',
    modules: modules.map((m) => m.label),
    dependencies: graph.nodes.filter((n) => n.type === 'dependency').slice(0, 10).map((n) => n.label),
    techStack: stats.languages,
  }

  const toBe = {
    label: `To-Be (${target.label})`,
    architecture: target.architecture,
    modules: modules.slice(0, 6).map((m) => `${m.label}${target.moduleSuffix}`),
    integrations: ['TCS AI Harness', 'Knowledge Fabric', 'Governance gates', ...target.tooling.slice(0, 2)],
    techStack: target.techStack,
  }

  const agentRecommendations = recommendAgents(domain, stats.languages, findings, target)

  const backlog = modules.slice(0, 8).map((mod, idx) => {
    const effortBase = idx < 2 ? 'L' : idx < 5 ? 'M' : 'S'
    return {
      id: `bl-${idx}`,
      module: mod.label,
      targetModule: `${mod.label}${target.moduleSuffix}`,
      effort: effortBase,
      priority: idx < 2 ? 'P0' : 'P1',
      story: `Migrate ${mod.label} to ${target.label} (${mod.fileCount} legacy files) with harness validation`,
      fileCount: mod.fileCount,
      targetStack: target.label,
    }
  })

  const migrationSteps = [
    { step: 1, title: 'Scaffold', detail: `Initialize ${target.label} project with ${target.tooling.join(', ')}` },
    { step: 2, title: 'Shared contracts', detail: 'Define OpenAPI/TypeScript contracts from legacy API layer' },
    { step: 3, title: 'Vertical slices', detail: `Migrate highest-value modules first: ${modules.slice(0, 2).map((m) => m.label).join(', ') || 'core'}` },
    { step: 4, title: 'Parallel run', detail: 'Run legacy and target stacks behind feature flags' },
    { step: 5, title: 'Decommission', detail: 'Governance-gated removal of legacy modules' },
  ]

  return {
    scanId: scan.id,
    generatedAt: new Date().toISOString(),
    targetStack: target.id,
    targetLabel: target.label,
    targetDescription: target.description,
    migrationScore: Math.max(12, Math.min(96, Math.round(migration.score * (2 - target.effortMultiplier * 0.15)))),
    readiness: migration.readiness,
    phases,
    risks,
    asIs,
    toBe,
    agentRecommendations,
    backlog,
    migrationSteps,
    manifestHints: manifests,
    exportMarkdown: buildMarkdownExport(scan, phases, risks, backlog, target, migrationSteps),
  }
}

function mitigationFor(finding) {
  const map = {
    'Hardcoded password': 'Rotate credentials, move to secrets manager, scan git history.',
    'Hardcoded API key': 'Revoke key, use vault / env injection, add pre-commit secret scan.',
    'eval() usage': 'Replace with safe parsing; add static analysis gate in CI.',
    'Private key in source': 'Remove from repo, rotate keypair, enforce git-secrets hook.',
  }
  return map[finding.label] ?? 'Remediate before migration cutover; add governance guardrail.'
}

function recommendAgents(domain, languages, findings, target) {
  const agents = [
    { id: 'arch-review', name: 'Architecture Review Agent', reason: `Validates ${target.label} module boundaries against enterprise patterns`, category: 'ad' },
    { id: 'api-design', name: 'API Design Agent', reason: 'Generates OpenAPI contracts for strangler facades', category: 'ad' },
    { id: 'migration-copilot', name: 'Migration Copilot Agent', reason: `Assists ${target.label} code translation and pattern mapping`, category: 'ad' },
    { id: 'security-scan', name: 'Security Scan Agent', reason: 'Continuous guardrail checks on migrated code', category: 'qe' },
  ]
  if (domain === 'healthcare') {
    agents.push({ id: 'fhir-compliance', name: 'FHIR Compliance Agent', reason: 'Maps legacy clinical flows to FHIR R4 resources', category: 'ad' })
  }
  if (findings.some((f) => f.type === 'security_hotspot')) {
    agents.push({ id: 'governance-audit', name: 'Governance Audit Agent', reason: 'Tracks remediation of security hotspots pre-publish', category: 'qe' })
  }
  if (target.id === 'spring' || languages.includes('Java')) {
    agents.push({ id: 'ams-runbook', name: 'AMS Runbook Agent', reason: 'Captures operational knowledge during legacy decommission', category: 'ams' })
  }
  return agents
}

function buildMarkdownExport(scan, phases, risks, backlog, target, migrationSteps) {
  return `# Migration Blueprint — ${scan.sourceLabel}

**Target Stack:** ${target.label}
**Migration Readiness:** ${scan.migration.score}/100 (${scan.migration.readiness})
**Scanned:** ${scan.scannedAt}
**Files:** ${scan.stats.totalFiles} | **Languages:** ${scan.stats.languages.join(', ')}

## Target Architecture
${target.architecture}

**Stack:** ${target.techStack.join(', ')}

## Migration Steps
${migrationSteps.map((s) => `${s.step}. **${s.title}** — ${s.detail}`).join('\n')}

## Phases
${phases.map((p) => `### ${p.title} (${p.duration})\n${p.objectives.map((o) => `- ${o}`).join('\n')}`).join('\n\n')}

## Risks
${risks.map((r) => `- [${r.severity}] ${r.title}${r.file ? ` (${r.file}:${r.line})` : ''}`).join('\n')}

## Backlog
${backlog.map((b) => `- ${b.priority} | ${b.module} → ${b.targetModule} | Effort ${b.effort} | ${b.story}`).join('\n')}
`
}
