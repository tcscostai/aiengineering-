/** Legacy COBOL claims scan — structurally matches server codeAnalyzer output */

export const DEMO_RE_SCAN_ID = 'demo_re_cobol_flow'

export function isDemoScanId(scanId) {
  return scanId === DEMO_RE_SCAN_ID || scanId?.startsWith('demo_re_')
}

export function buildDemoCobolScanResult() {
  const scannedAt = new Date().toISOString()
  const modules = [
    { label: 'cbl/CLMMAIN', fileCount: 1 },
    { label: 'cbl/CLMADJ', fileCount: 1 },
    { label: 'cbl/CLMVAL', fileCount: 1 },
    { label: 'cbl/ELIGCHK', fileCount: 1 },
    { label: 'cbl/PASAUTH', fileCount: 1 },
    { label: 'cbl/MEMSRV', fileCount: 1 },
    { label: 'cpy', fileCount: 3 },
    { label: 'sql', fileCount: 1 },
    { label: 'jcl', fileCount: 1 },
  ]

  const findings = [
    { id: 'f1', label: 'CALL dependency chain', severity: 'medium', file: 'cbl/CLMMAIN.cbl', line: 42, type: 'architecture' },
    { id: 'f2', label: 'DB2 embedded SQL', severity: 'high', file: 'cbl/CLMADJ.cbl', line: 88, type: 'data' },
    { id: 'f3', label: 'COPYBOOK coupling', severity: 'medium', file: 'cpy/CLAIM-REC.cpy', line: 1, type: 'architecture' },
    { id: 'f4', label: 'JCL batch dependency', severity: 'high', file: 'jcl/CLMBATCH.jcl', line: 12, type: 'operational' },
  ]

  const graph = {
    languages: ['COBOL', 'COBOL Copybook', 'JCL', 'SQL'],
    nodes: [
      { id: 'n1', label: 'CLMMAIN', type: 'module', layer: 'ui' },
      { id: 'n2', label: 'CLMADJ', type: 'module', layer: 'service' },
      { id: 'n3', label: 'CLMVAL', type: 'module', layer: 'service' },
      { id: 'n4', label: 'ELIGCHK', type: 'module', layer: 'service' },
      { id: 'n5', label: 'PASAUTH', type: 'module', layer: 'api' },
      { id: 'n6', label: 'MEMSRV', type: 'module', layer: 'service' },
      { id: 'd1', label: 'DB2 Claims', type: 'dependency' },
      { id: 'd2', label: 'IMS Member Index', type: 'dependency' },
    ],
    edges: [
      { source: 'n1', target: 'n2', kind: 'call' },
      { source: 'n1', target: 'n3', kind: 'call' },
      { source: 'n2', target: 'd1', kind: 'data' },
      { source: 'n4', target: 'd2', kind: 'data' },
      { source: 'n5', target: 'n4', kind: 'call' },
    ],
    layers: ['api', 'service', 'data', 'batch'],
  }

  return {
    id: DEMO_RE_SCAN_ID,
    sourceLabel: 'Legacy Claims COBOL Monolith',
    source: { type: 'workspace', label: 'legacy-workspaces/legacy-claims-cobol' },
    scannedAt,
    summary:
      'Healthcare claims adjudication monolith — 13 files across COBOL, copybooks, JCL, and SQL. Primary domain: healthcare. Migration readiness: 68/100 (moderate).',
    stats: {
      totalFiles: 13,
      languages: graph.languages,
      domain: 'healthcare',
      loc: 2840,
    },
    modules,
    findings,
    migration: { score: 68, readiness: 'moderate', blockers: 2, warnings: 4 },
    manifests: [{ name: 'legacy-claims-cobol', type: 'workspace' }],
    graph,
    meta: { sourceLabel: 'Legacy Claims COBOL Monolith', workspace: true },
  }
}
