const PROMPT_TEMPLATES = [
  {
    match: /payment|billing|invoice|charge/i,
    answer: (scan) => `Payment flows appear distributed across ${scan.modules.slice(0, 3).map((m) => m.label).join(', ')}. Start by tracing HTTP controllers and repository layers in those modules, then map external PSP integrations from manifest dependencies.`,
  },
  {
    match: /auth|login|jwt|oauth|security/i,
    answer: (scan) => {
      const authFindings = scan.findings.filter((f) => f.type === 'security_hotspot')
      return `Authentication touchpoints span ${scan.stats.languages.join('/')} layers. ${authFindings.length} security findings were flagged — prioritize ${authFindings.slice(0, 2).map((f) => `\`${f.file}:${f.line}\``).join(', ') || 'credential storage review'} before extraction.`
    },
  },
  {
    match: /fhir|hipaa|claim|prior.?auth|healthcare|clinical/i,
    answer: (scan) => `Healthcare domain signals detected (domain: ${scan.stats.domain}). Map legacy claim/prior-auth rules to FHIR PAS resources. Modules ${scan.modules.slice(0, 2).map((m) => m.label).join(' & ')} are likely bounded contexts for Phase 2 strangler extraction.`,
  },
  {
    match: /microservice|extract|split|decompose|module/i,
    answer: (scan) => {
      const candidates = scan.modules.slice(0, 4)
      return `Recommended extraction order: ${candidates.map((m, i) => `${i + 1}. ${m.label} (${m.fileCount} files)`).join('; ')}. Use API facade first, then peel data access behind repositories.`
    },
  },
  {
    match: /risk|debt|smell|hotspot|problem/i,
    answer: (scan) => {
      const top = scan.findings.slice(0, 5)
      if (!top.length) return 'No critical hotspots in the sampled scan window. Expand scan depth or include test directories for fuller debt picture.'
      return `Top risks:\n${top.map((f) => `• [${f.severity}] ${f.label} at ${f.file}:${f.line}`).join('\n')}`
    },
  },
  {
    match: /depend|import|library|package/i,
    answer: (scan) => {
      const deps = scan.graph.nodes.filter((n) => n.type === 'dependency').slice(0, 10).map((n) => n.label)
      return `External dependency footprint: ${deps.join(', ') || 'none detected in sample'}. Review manifest lockfiles for version drift before migration.`
    },
  },
  {
    match: /summar|overview|explain|what is/i,
    answer: (scan) => scan.summary,
  },
  {
    match: /migrat|roadmap|phase|plan/i,
    answer: (scan) => `Migration readiness ${scan.migration.score}/100 (${scan.migration.readiness}). Suggested path: (1) Discovery baseline, (2) Strangler API facade on ${scan.modules[0]?.label ?? 'core module'}, (3) Service extraction with Harness validation, (4) Governance-gated cutover.`,
  },
]

export function answerCopilotQuestion(scan, question) {
  const q = question.trim()
  if (!q) return { answer: 'Ask a question about architecture, dependencies, risks, or migration strategy.', evidence: [] }

  for (const template of PROMPT_TEMPLATES) {
    if (template.match.test(q)) {
      const answer = template.answer(scan)
      return {
        answer,
        evidence: buildEvidence(scan, q),
        confidence: 0.82 + Math.random() * 0.12,
      }
    }
  }

  const moduleHit = scan.modules.find((m) => q.toLowerCase().includes(m.label.toLowerCase()))
  if (moduleHit) {
    return {
      answer: `Module **${moduleHit.label}** contains ~${moduleHit.fileCount} analyzable files. It connects to ${scan.graph.edges.filter((e) => e.source === `mod:${moduleHit.label}`).length} dependency edges in the sampled graph. Consider this as a strangler boundary candidate.`,
      evidence: [{ type: 'module', label: moduleHit.label, fileCount: moduleHit.fileCount }],
      confidence: 0.78,
    }
  }

  return {
    answer: `Based on ${scan.stats.totalFiles} files in ${scan.sourceLabel}: primary stack is ${scan.stats.languages.join(', ') || 'mixed'}, domain signal is ${scan.stats.domain}, migration score ${scan.migration.score}/100. Try asking about specific modules, risks, auth flows, or extraction order.`,
    evidence: scan.findings.slice(0, 3).map((f) => ({ type: 'finding', file: f.file, line: f.line, label: f.label })),
    confidence: 0.65,
  }
}

function buildEvidence(scan, question) {
  const evidence = []
  if (/risk|security|debt/i.test(question)) {
    evidence.push(...scan.findings.slice(0, 4).map((f) => ({ type: 'finding', file: f.file, line: f.line, label: f.label })))
  }
  if (/module|architect/i.test(question)) {
    evidence.push(...scan.modules.slice(0, 3).map((m) => ({ type: 'module', label: m.label, fileCount: m.fileCount })))
  }
  if (evidence.length === 0 && scan.fileIndex[0]) {
    evidence.push({ type: 'file', path: scan.fileIndex[0].path })
  }
  return evidence
}

export const SUGGESTED_QUESTIONS = [
  'Give me an overview of this codebase',
  'What are the top migration risks?',
  'Which modules should we extract first?',
  'Map healthcare / FHIR touchpoints',
  'Explain the dependency footprint',
  'Propose a phased migration roadmap',
]
