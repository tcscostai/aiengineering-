import path from 'path'
import { walkDirectory, readFileSafe } from '../utils/fileWalker.js'
import { extractImports, extractInternalImports, detectSecurityFindings } from '../utils/importParser.js'

const LANG_MAP = {
  '.js': 'JavaScript', '.jsx': 'React', '.ts': 'TypeScript', '.tsx': 'React/TS',
  '.py': 'Python', '.java': 'Java', '.kt': 'Kotlin', '.go': 'Go', '.cs': 'C#',
  '.rb': 'Ruby', '.php': 'PHP', '.vue': 'Vue', '.sql': 'SQL', '.xml': 'XML',
  '.cbl': 'COBOL', '.cob': 'COBOL', '.cpy': 'COBOL Copybook', '.jcl': 'JCL',
}

const DOMAIN_KEYWORDS = {
  healthcare: ['fhir', 'hipaa', 'claim', 'prior-auth', 'priorauth', 'eob', 'member', 'eligibility', 'clinical', 'cobol', 'adjudication', 'pas'],
  payments: ['payment', 'billing', 'invoice', 'stripe', 'paypal'],
  auth: ['auth', 'oauth', 'jwt', 'login', 'identity', 'sso'],
  api: ['api', 'rest', 'graphql', 'grpc', 'controller', 'endpoint'],
  data: ['database', 'repository', 'dao', 'entity', 'migration', 'schema'],
}

function parsePackageJson(content) {
  try {
    const pkg = JSON.parse(content)
    return {
      name: pkg.name,
      dependencies: Object.keys(pkg.dependencies ?? {}),
      devDependencies: Object.keys(pkg.devDependencies ?? {}),
      scripts: Object.keys(pkg.scripts ?? {}),
    }
  } catch {
    return null
  }
}

function parsePomXml(content) {
  const deps = []
  const depRe = /<artifactId>([^<]+)<\/artifactId>/g
  let m
  while ((m = depRe.exec(content)) !== null) deps.push(m[1])
  const groupMatch = content.match(/<groupId>([^<]+)<\/groupId>/)
  const artifactMatch = content.match(/<artifactId>([^<]+)<\/artifactId>/)
  return {
    groupId: groupMatch?.[1],
    artifactId: artifactMatch?.[1],
    dependencies: [...new Set(deps)].slice(0, 40),
  }
}

function inferDomain(filePaths, manifests) {
  const corpus = `${filePaths.join(' ')} ${manifests.map((m) => m.name).join(' ')}`.toLowerCase()
  const scores = {}
  for (const [domain, keywords] of Object.entries(DOMAIN_KEYWORDS)) {
    scores[domain] = keywords.filter((k) => corpus.includes(k)).length
  }
  const top = Object.entries(scores).sort((a, b) => b[1] - a[1])[0]
  return top[1] > 0 ? top[0] : 'general'
}

function moduleKeyFromPath(filePath) {
  const parts = filePath.split(path.sep).filter(Boolean)
  if (parts.length <= 1) return '(root)'
  if (parts.length === 2) return parts[0]
  return `${parts[0]}/${parts[1]}`
}

function resolveInternalModule(filePath, importPath, ext) {
  if (['.cbl', '.cob', '.cpy', '.jcl'].includes(ext)) {
    const name = importPath.toUpperCase()
    if (name.endsWith('-REC') || name.includes('COPY')) return 'cpy'
    if (name.startsWith('DB2') || name.startsWith('IMS')) return 'sql'
    return 'cbl'
  }
  const dir = path.dirname(filePath)
  const joined = importPath.startsWith('/')
    ? importPath.slice(1)
    : path.normalize(path.join(dir, importPath)).replace(/\\/g, '/')
  return moduleKeyFromPath(joined)
}

const DATAFLOW_PATTERNS = [
  { re: /controller|api|route|endpoint|resource|servlet|pasauth|memsrv/i, role: 'api', label: 'API Layer' },
  { re: /service|usecase|use-case|handler|manager|facade|adj|val|chk/i, role: 'service', label: 'Service Layer' },
  { re: /repository|repo|dao|entity|model|schema|mapper|persistence|ddl|\.sql$/i, role: 'data', label: 'Data Layer' },
  { re: /component|view|page|screen|ui|template|main\.cbl$/i, role: 'ui', label: 'UI Layer' },
]

function detectDataflowRole(filePath) {
  const lower = filePath.toLowerCase()
  for (const p of DATAFLOW_PATTERNS) {
    if (p.re.test(lower)) return p
  }
  return null
}

async function buildModuleGraph(files, rootDir) {
  const moduleCounts = new Map()
  const extCounts = new Map()
  const externalDeps = new Map()
  const internalEdges = new Map()
  const dataflowNodes = new Map()
  const nodes = []
  const edges = []
  const findings = []

  for (const file of files) {
    extCounts.set(file.ext, (extCounts.get(file.ext) ?? 0) + 1)
    const mod = moduleKeyFromPath(file.path)
    moduleCounts.set(mod, (moduleCounts.get(mod) ?? 0) + 1)

    const role = detectDataflowRole(file.path)
    if (role) {
      const modKey = moduleKeyFromPath(file.path)
      const nodeId = `flow:${modKey}:${role.role}`
      if (!dataflowNodes.has(nodeId)) {
        dataflowNodes.set(nodeId, { id: nodeId, type: 'dataflow', role: role.role, label: `${role.label} · ${modKey}`, module: modKey, layer: 'dataflow' })
      }
    }
  }

  for (const [mod, count] of [...moduleCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 32)) {
    nodes.push({
      id: `mod:${mod}`,
      type: 'module',
      label: mod,
      fileCount: count,
      layer: 'architecture',
      radius: Math.min(36, 12 + Math.sqrt(count) * 3),
    })
  }

  const sampleFiles = files
    .filter((f) => ['.js', '.jsx', '.ts', '.tsx', '.py', '.java', '.vue', '.go', '.cbl', '.cob', '.cpy', '.jcl'].includes(f.ext))
    .slice(0, 350)

  for (const file of sampleFiles) {
    const content = await readFileSafe(file.fullPath, 80_000)
    if (!content) continue

    const fromMod = moduleKeyFromPath(file.path)
    const fromId = `mod:${fromMod}`

    for (const imp of extractImports(content, file.ext).slice(0, 10)) {
      externalDeps.set(imp, (externalDeps.get(imp) ?? 0) + 1)
      const toId = `dep:${imp}`
      if (!nodes.find((n) => n.id === toId)) {
        nodes.push({ id: toId, type: 'dependency', label: imp, layer: 'dependencies', radius: 14 })
      }
      edges.push({ id: `${fromId}->${toId}`, source: fromId, target: toId, type: 'depends_on', layer: 'dependencies' })
    }

    for (const imp of extractInternalImports(content, file.ext).slice(0, 6)) {
      const toMod = resolveInternalModule(file.path, imp.replace(/\.(js|ts|jsx|tsx|py|java|cbl|cob|cpy)$/, ''), file.ext)
      if (toMod === fromMod) continue
      const toId = `mod:${toMod}`
      if (!nodes.find((n) => n.id === toId)) {
        nodes.push({ id: toId, type: 'module', label: toMod, fileCount: moduleCounts.get(toMod) ?? 1, layer: 'architecture', radius: 16 })
      }
      const edgeKey = `${fromId}->${toId}`
      internalEdges.set(edgeKey, (internalEdges.get(edgeKey) ?? 0) + 1)
    }

    findings.push(...detectSecurityFindings(content, file.path).slice(0, 2))
  }

  for (const [edgeKey, weight] of internalEdges.entries()) {
    const [source, target] = edgeKey.split('->')
    edges.push({ id: edgeKey, source, target, type: 'imports', layer: 'architecture', weight })
  }

  for (const [dep, count] of [...externalDeps.entries()].sort((a, b) => b[1] - a[1]).slice(0, 20)) {
    if (!nodes.find((n) => n.id === `dep:${dep}`)) {
      nodes.push({ id: `dep:${dep}`, type: 'dependency', label: dep, count, layer: 'dependencies', radius: 10 + Math.min(count, 8) })
    }
  }

  for (const flowNode of dataflowNodes.values()) {
    nodes.push({ ...flowNode, radius: 18 })
    edges.push({
      id: `mod:${flowNode.module}->${flowNode.id}`,
      source: `mod:${flowNode.module}`,
      target: flowNode.id,
      type: 'contains',
      layer: 'dataflow',
    })
  }

  const flowByModule = new Map()
  for (const n of dataflowNodes.values()) {
    if (!flowByModule.has(n.module)) flowByModule.set(n.module, [])
    flowByModule.get(n.module).push(n)
  }
  for (const [, layers] of flowByModule) {
    const order = ['ui', 'api', 'service', 'data']
    const sorted = layers.sort((a, b) => order.indexOf(a.role) - order.indexOf(b.role))
    for (let i = 0; i < sorted.length - 1; i++) {
      edges.push({
        id: `${sorted[i].id}->${sorted[i + 1].id}`,
        source: sorted[i].id,
        target: sorted[i + 1].id,
        type: 'dataflow',
        layer: 'dataflow',
      })
    }
  }

  return {
    nodes: dedupeNodes(nodes),
    edges: dedupeEdges(edges),
    extCounts: Object.fromEntries(extCounts),
    findings: findings.slice(0, 80),
    languages: [...new Set(files.map((f) => LANG_MAP[f.ext]).filter(Boolean))],
  }
}

function dedupeNodes(nodes) {
  const seen = new Set()
  return nodes.filter((n) => {
    if (seen.has(n.id)) return false
    seen.add(n.id)
    return true
  })
}

function dedupeEdges(edges) {
  const seen = new Set()
  return edges.filter((e) => {
    if (seen.has(e.id)) return false
    seen.add(e.id)
    return true
  })
}

function computeMigrationScore({ fileCount, findings, manifests, languages, extCounts }) {
  let score = 72
  const factors = []

  if (fileCount > 500) { score -= 8; factors.push({ label: 'Large codebase', impact: -8 }) }
  if (fileCount < 50) { score += 5; factors.push({ label: 'Compact codebase', impact: +5 }) }

  const critical = findings.filter((f) => f.severity === 'critical').length
  const high = findings.filter((f) => f.severity === 'high').length
  if (critical > 0) { score -= critical * 4; factors.push({ label: `${critical} critical findings`, impact: -critical * 4 }) }
  if (high > 3) { score -= 6; factors.push({ label: 'Multiple security hotspots', impact: -6 }) }

  const hasDocker = manifests.some((m) => m.name.includes('Docker'))
  if (hasDocker) { score += 6; factors.push({ label: 'Containerization present', impact: +6 }) }

  const hasPkg = manifests.some((m) => m.name === 'package.json')
  const hasPom = manifests.some((m) => m.name === 'pom.xml')
  if (hasPkg || hasPom) { score += 4; factors.push({ label: 'Standard manifest detected', impact: +4 }) }

  if (languages.length > 4) { score -= 5; factors.push({ label: 'Polyglot stack', impact: -5 }) }

  const jsCount = (extCounts['.js'] ?? 0) + (extCounts['.jsx'] ?? 0) + (extCounts['.ts'] ?? 0) + (extCounts['.tsx'] ?? 0)
  if (jsCount > 20) { score += 4; factors.push({ label: 'Modern JS/TS footprint', impact: +4 }) }

  score = Math.max(12, Math.min(96, Math.round(score)))
  return { score, factors, readiness: score >= 70 ? 'good' : score >= 45 ? 'moderate' : 'challenging' }
}

export async function analyzeCodebase(rootDir, meta = {}) {
  const { files, manifests } = await walkDirectory(rootDir)
  const graph = await buildModuleGraph(files, rootDir)

  const manifestData = []
  for (const m of manifests.slice(0, 12)) {
    const content = await readFileSafe(m.fullPath)
    if (!content) continue
    if (m.name === 'package.json') manifestData.push({ type: 'npm', ...parsePackageJson(content) })
    if (m.name === 'pom.xml') manifestData.push({ type: 'maven', ...parsePomXml(content) })
    if (m.name === 'requirements.txt') {
      manifestData.push({ type: 'pip', dependencies: content.split('\n').filter((l) => l.trim() && !l.startsWith('#')).slice(0, 30) })
    }
  }

  const domain = inferDomain(files.map((f) => f.path), manifests)
  const migration = computeMigrationScore({
    fileCount: files.length,
    findings: graph.findings,
    manifests,
    languages: graph.languages,
    extCounts: graph.extCounts,
  })

  const topModules = graph.nodes.filter((n) => n.type === 'module').slice(0, 8)

  return {
    id: meta.scanId,
    source: meta.source,
    sourceLabel: meta.sourceLabel,
    scannedAt: new Date().toISOString(),
    rootDir: meta.sourceLabel,
    stats: {
      totalFiles: files.length,
      totalManifests: manifests.length,
      languages: graph.languages,
      extensions: graph.extCounts,
      domain,
    },
    manifests: manifestData,
    graph: {
      nodes: graph.nodes,
      edges: graph.edges,
    },
    findings: graph.findings,
    migration,
    modules: topModules,
    fileIndex: files.slice(0, 400).map((f) => ({ path: f.path, ext: f.ext })),
    summary: buildSummary(meta, files.length, graph, domain, migration),
  }
}

function buildSummary(meta, fileCount, graph, domain, migration) {
  const langs = graph.languages.slice(0, 4).join(', ') || 'Unknown'
  return `${meta.sourceLabel} contains ${fileCount} analyzable files across ${graph.languages.length || 1} language(s) (${langs}). Primary domain signal: ${domain}. Migration readiness: ${migration.score}/100 (${migration.readiness}). ${graph.findings.length} code intelligence findings detected.`
}
