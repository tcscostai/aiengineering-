/** Server-side COBOL scan pipeline (mirrors client src/data/cobolScanPipeline.js) */

export const COBOL_SCAN_PIPELINE = [
  { message: 'horizon-re ▸ Ingesting workspace: legacy-claims-cobol', kind: 'info', delayMs: 520, progress: 8 },
  { message: 'File indexer: 13 files · 2,840 LOC · extensions [.cbl, .cpy, .jcl, .sql]', kind: 'ok', delayMs: 480, progress: 14 },
  { message: 'Domain classifier → healthcare (claims, adjudication, prior-auth, eligibility)', kind: 'ok', delayMs: 440, progress: 20 },
  { message: '▸ CLMMAIN.cbl — batch entry orchestrator · 6 CALL statements resolved', kind: 'info', delayMs: 620, progress: 28 },
  { message: '▸ CLMADJ.cbl — adjudication rules · embedded DB2 SQL at line 88', kind: 'warn', delayMs: 580, progress: 36 },
  { message: '▸ CLMVAL.cbl — validation gate · couples to CLAIM-REC copybook', kind: 'info', delayMs: 540, progress: 42 },
  { message: '▸ ELIGCHK.cbl — eligibility service · IMS Member Index dependency', kind: 'info', delayMs: 560, progress: 48 },
  { message: '▸ PASAUTH.cbl — prior authorization boundary · API extraction candidate', kind: 'ok', delayMs: 580, progress: 54 },
  { message: '▸ MEMSRV.cbl — member lookup · shared by CLMMAIN and ELIGCHK', kind: 'info', delayMs: 500, progress: 58 },
  { message: 'COPYBOOK resolver: CLAIM-REC ↔ MEMBER-REC ↔ ELIG-REC (tight coupling)', kind: 'warn', delayMs: 600, progress: 64 },
  { message: 'JCL chain: CLMBATCH.jcl → CLMMAIN → downstream DB2 commit [operational risk]', kind: 'warn', delayMs: 560, progress: 70 },
  { message: 'SQL/DDL: claims schema · 4 tables referenced by CLMADJ embedded queries', kind: 'info', delayMs: 480, progress: 74 },
  { message: 'Architecture graph: 8 nodes · 5 CALL edges · 2 datastore dependencies', kind: 'ok', delayMs: 500, progress: 80 },
  { message: 'Dataflow layers: api (PASAUTH) → service (CLMADJ, ELIGCHK) → data (DB2) → batch (JCL)', kind: 'ok', delayMs: 480, progress: 85 },
  { message: 'Findings emitted: 4 — DB2 embedded SQL [high], JCL batch [high], COPYBOOK coupling [medium]', kind: 'warn', delayMs: 520, progress: 90 },
  { message: 'Migration readiness: 68/100 (moderate) · strangler-first: PASAUTH, ELIGCHK', kind: 'ok', delayMs: 460, progress: 94 },
  { message: 'Synthesizing migration blueprint · 8 backlog modules · healthcare domain', kind: 'info', delayMs: 700, progress: 98 },
  { message: '✓ Scan complete — Code Universe, Copilot, and Blueprint are ready', kind: 'ok', delayMs: 380, progress: 100 },
]

export function isCobolWorkspacePath(pathStr = '') {
  return /legacy-claims-cobol|claims-cobol|\.cbl|\.cpy|\.jcl/i.test(pathStr)
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms))
}

export async function runCobolPipelineLogs(scanId, { appendLog, updateProgress }) {
  for (const step of COBOL_SCAN_PIPELINE) {
    appendLog(scanId, step.message, step.kind)
    updateProgress(scanId, step.progress, 'analyzing')
    await sleep(step.delayMs + Math.random() * 120)
  }
}
