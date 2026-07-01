import { useState, useEffect, useMemo, useRef } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Code2,
  Play,
  Download,
  FolderTree,
  CheckCircle,
  Loader2,
  ArrowRight,
  Cpu,
  FileCode,
  Layers,
  Sparkles,
  Terminal,
} from 'lucide-react'
import { GlassPanel } from '../ui/GlassPanel'
import { ProgressBar } from '../ui/ProgressBar'
import {
  getCodegenForScan,
  runCodegenPipeline,
  downloadCodegenBundle,
  downloadTextFile,
} from '../../services/migrationCodegenService'
import { getCodegenPhases } from '../../lib/re/migrationCodeGenerator'
import { MIGRATION_TARGET_OPTIONS, suggestTargetFromLanguages } from '../../data/migrationTargets'

const SCOPE_OPTIONS = [
  { id: 'scaffold', label: 'Scaffold only', detail: 'Project root, README, contracts — no modules yet' },
  { id: 'p0', label: 'P0 vertical slices', detail: 'Top 2 backlog modules + tests + strangler facade (recommended)' },
  { id: 'full', label: 'Full backlog', detail: 'All modules from migration blueprint' },
]

function CodegenTerminal({ logs, active }) {
  const endRef = useRef(null)
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [logs])

  return (
    <GlassPanel className="p-0 overflow-hidden border-cx-accent/20">
      <div className="flex items-center gap-2 px-4 py-2 border-b border-cx-border bg-cx-deep/60">
        <Terminal className="w-3.5 h-3.5 text-cx-accent" />
        <span className="text-2xs font-mono text-cx-fg-dim">migration-copilot</span>
        {active && <Loader2 className="w-3 h-3 text-cx-accent animate-spin ml-auto" />}
      </div>
      <div className="h-[220px] overflow-y-auto p-4 font-mono text-2xs space-y-1.5 bg-cx-void/80">
        <AnimatePresence initial={false}>
          {logs.map((line, i) => (
            <motion.div
              key={`${i}-${line.slice(0, 24)}`}
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              className={`flex gap-2 ${
                line.startsWith('✓') ? 'text-cx-success' : line.startsWith('▸') ? 'text-cx-accent' : 'text-cx-fg-muted'
              }`}
            >
              <span className="text-cx-fg-dim shrink-0">{String(i + 1).padStart(2, '0')}</span>
              <span>{line.replace(/\*\*/g, '')}</span>
            </motion.div>
          ))}
        </AnimatePresence>
        {active && (
          <div className="flex gap-2 text-cx-accent animate-pulse">
            <span className="text-cx-fg-dim">▸</span>
            <span>Thinking…</span>
          </div>
        )}
        <div ref={endRef} />
      </div>
    </GlassPanel>
  )
}

export function CodeGenerationPanel({ activeScan, onNotify }) {
  const scan = activeScan?.result
  const blueprint = activeScan?.blueprint
  const [scope, setScope] = useState('p0')
  const [targetStack, setTargetStack] = useState(
    () => blueprint?.targetStack ?? suggestTargetFromLanguages(scan?.stats?.languages ?? [])
  )
  const [packageBase, setPackageBase] = useState('com.horizon.migration')
  const [generating, setGenerating] = useState(false)
  const [pipelinePhase, setPipelinePhase] = useState(null)
  const [progress, setProgress] = useState(0)
  const [statusMessage, setStatusMessage] = useState('')
  const [terminalLogs, setTerminalLogs] = useState([])
  const [result, setResult] = useState(() => getCodegenForScan(activeScan?.id))
  const [selectedPath, setSelectedPath] = useState(null)

  useEffect(() => {
    if (blueprint?.targetStack) setTargetStack(blueprint.targetStack)
    else if (scan?.stats?.languages) setTargetStack(suggestTargetFromLanguages(scan.stats.languages))
  }, [blueprint?.targetStack, scan?.stats?.languages])

  useEffect(() => {
    const saved = getCodegenForScan(activeScan?.id)
    setResult(saved)
    setSelectedPath(saved?.files?.[0]?.path ?? null)
  }, [activeScan?.id])

  const selectedTarget = MIGRATION_TARGET_OPTIONS.find((t) => t.id === targetStack)

  const selectedFile = useMemo(
    () => result?.files?.find((f) => f.path === selectedPath) ?? null,
    [result, selectedPath]
  )

  const filesByPhase = useMemo(() => {
    if (!result?.files) return {}
    return result.files.reduce((acc, f) => {
      if (!acc[f.phase]) acc[f.phase] = []
      acc[f.phase].push(f)
      return acc
    }, {})
  }, [result])

  if (!blueprint || !scan) {
    return (
      <GlassPanel className="p-12 text-center text-sm text-cx-fg-dim">
        <Code2 className="w-10 h-10 mx-auto mb-3 text-cx-fg-dim" />
        Complete a scan and migration blueprint first, then generate target-stack code.
      </GlassPanel>
    )
  }

  const handleGenerate = async () => {
    setGenerating(true)
    setProgress(0)
    setPipelinePhase(null)
    setStatusMessage('Warming up Migration Copilot…')
    setTerminalLogs([])
    try {
      const gen = await runCodegenPipeline(
        scan,
        blueprint,
        { scope, packageBase, targetStack },
        (tick) => {
          setProgress(tick.progress ?? 0)
          if (tick.phase) setPipelinePhase(tick.phase)
          if (tick.message) {
            setStatusMessage(tick.message.replace(/\*\*/g, ''))
            setTerminalLogs((prev) => (prev[prev.length - 1] === tick.message ? prev : [...prev, tick.message.replace(/\*\*/g, '')]))
          }
        }
      )
      setResult(gen)
      setSelectedPath(gen.files[0]?.path ?? null)
      onNotify?.(gen.summary, 'success')
    } catch (err) {
      onNotify?.(err.message, 'error')
    } finally {
      setGenerating(false)
      setPipelinePhase(null)
    }
  }

  const projectSlug = scan.sourceLabel?.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 40) ?? 'migration'

  return (
    <div className="space-y-6">
      <GlassPanel hero className="p-5">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="w-4 h-4 text-cx-accent" />
          <h4 className="text-sm font-medium text-cx-fg">AI code generation pipeline</h4>
        </div>
        <p className="text-xs text-cx-fg-dim mb-4">
          Migration Copilot translates your blueprint into production-ready{' '}
          <strong className="text-cx-fg-muted">{selectedTarget?.label ?? 'target'}</strong> artifacts.
        </p>
        <div className="grid sm:grid-cols-5 gap-2">
          {(result?.phases ?? getCodegenPhases()).map((phase, i) => {
            const phaseId = phase.id ?? `phase-${i}`
            const isActive = pipelinePhase?.id === phaseId
            const isDone = result?.phaseResults?.find((p) => p.id === phaseId)?.status === 'complete'
            return (
              <div
                key={phaseId}
                className={`p-2.5 rounded-xl border text-center ${
                  isActive
                    ? 'border-cx-accent/50 bg-cx-accent/10'
                    : isDone
                      ? 'border-cx-success/30 bg-cx-success/5'
                      : 'border-cx-border bg-cx-panel/30'
                }`}
              >
                {isDone ? (
                  <CheckCircle className="w-3.5 h-3.5 text-cx-success mx-auto mb-1" />
                ) : isActive ? (
                  <Loader2 className="w-3.5 h-3.5 text-cx-accent mx-auto mb-1 animate-spin" />
                ) : (
                  <span className="text-2xs font-mono text-cx-fg-dim">{i + 1}</span>
                )}
                <p className="text-[10px] font-medium text-cx-fg leading-tight">{phase.label}</p>
              </div>
            )
          })}
        </div>
      </GlassPanel>

      {generating && (
        <div className="space-y-3">
          <GlassPanel className="p-4 border-cx-accent/25 bg-cx-accent/5">
            <div className="flex items-center gap-2 mb-2">
              <Loader2 className="w-4 h-4 text-cx-accent animate-spin" />
              <p className="text-sm text-cx-fg font-medium">{statusMessage || 'Migration Copilot is working…'}</p>
            </div>
            <ProgressBar value={progress} showPercent />
          </GlassPanel>
          <CodegenTerminal logs={terminalLogs} active={generating} />
        </div>
      )}

      {!result && !generating && (
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            <GlassPanel className="p-5 space-y-3">
              <h4 className="text-xs uppercase tracking-widest text-cx-fg-dim">Target language / stack</h4>
              <p className="text-2xs text-cx-fg-dim">Choose any modern stack — independent of blueprint default.</p>
              <div className="grid sm:grid-cols-2 gap-2 max-h-[240px] overflow-y-auto pr-1">
                {MIGRATION_TARGET_OPTIONS.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setTargetStack(t.id)}
                    className={`text-left p-2.5 rounded-xl border transition-colors ${
                      targetStack === t.id
                        ? 'border-cx-accent/50 bg-cx-accent/10'
                        : 'border-cx-border hover:border-cx-accent/25'
                    }`}
                  >
                    <p className="text-xs font-medium text-cx-fg">{t.label}</p>
                    <p className="text-[10px] text-cx-fg-dim mt-0.5 line-clamp-2">{t.description}</p>
                  </button>
                ))}
              </div>
            </GlassPanel>

            <GlassPanel className="p-5 space-y-4">
              <h4 className="text-xs uppercase tracking-widest text-cx-fg-dim">Generation scope</h4>
              {SCOPE_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setScope(opt.id)}
                  className={`w-full text-left p-3 rounded-xl border transition-colors ${
                    scope === opt.id
                      ? 'border-cx-accent/50 bg-cx-accent/10'
                      : 'border-cx-border hover:border-cx-accent/25'
                  }`}
                >
                  <p className="text-sm font-medium text-cx-fg">{opt.label}</p>
                  <p className="text-2xs text-cx-fg-dim mt-1">{opt.detail}</p>
                </button>
              ))}

              {(targetStack === 'spring' || targetStack === 'dotnet') && (
                <div>
                  <label className="text-2xs uppercase text-cx-fg-dim tracking-widest mb-1 block">
                    {targetStack === 'spring' ? 'Java package base' : 'Root namespace'}
                  </label>
                  <input
                    className="w-full px-3 py-2 rounded-xl border border-cx-border bg-cx-panel/50 text-sm font-mono text-cx-fg"
                    value={packageBase}
                    onChange={(e) => setPackageBase(e.target.value)}
                  />
                </div>
              )}

              <button
                type="button"
                onClick={handleGenerate}
                disabled={generating}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-cx-success/40 bg-cx-success/10 text-cx-success text-sm hover:bg-cx-success/20 disabled:opacity-50"
              >
                <Sparkles className="w-4 h-4" />
                Generate {selectedTarget?.label ?? 'target'} code
              </button>
            </GlassPanel>
          </div>

          <GlassPanel className="p-5">
            <h4 className="text-xs uppercase tracking-widest text-cx-fg-dim mb-3">Modules to generate (from blueprint)</h4>
            <ul className="space-y-2">
              {blueprint.backlog.map((b) => (
                <li key={b.id} className="text-xs flex items-start gap-2 p-2 rounded-lg border border-cx-border bg-cx-raised/20">
                  <ArrowRight className="w-3 h-3 text-cx-accent shrink-0 mt-0.5" />
                  <div>
                    <span className="font-mono text-cx-warn">{b.module}</span>
                    <span className="text-cx-fg-dim"> → </span>
                    <span className="text-cx-success">{b.targetModule}</span>
                    <p className="text-2xs text-cx-fg-dim mt-0.5">{b.priority} · Effort {b.effort}</p>
                  </div>
                </li>
              ))}
            </ul>
          </GlassPanel>
        </div>
      )}

      {result && !generating && (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm text-cx-fg">{result.summary}</p>
              <p className="text-2xs text-cx-fg-dim mt-1">{result.files.length} files · {result.blueprintTarget}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => downloadCodegenBundle(result, projectSlug)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-cx-border text-xs text-cx-fg-muted hover:border-cx-accent/30"
              >
                <Download className="w-3.5 h-3.5" /> Download bundle
              </button>
              {selectedFile && (
                <button
                  type="button"
                  onClick={() => downloadTextFile(selectedFile.path.split('/').pop(), selectedFile.content)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-cx-border text-xs text-cx-fg-muted hover:border-cx-accent/30"
                >
                  <FileCode className="w-3.5 h-3.5" /> Download file
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  setResult(null)
                  setSelectedPath(null)
                  setTerminalLogs([])
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-cx-accent/40 bg-cx-accent/10 text-xs text-cx-accent"
              >
                <Play className="w-3.5 h-3.5" /> Regenerate
              </button>
              <Link
                to="/harness"
                state={{
                  tab: 'single',
                  category: 'ad',
                  task: `Validate generated ${result.blueprintTarget} migration modules`,
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-cx-success/40 bg-cx-success/10 text-xs text-cx-success"
              >
                <Cpu className="w-3.5 h-3.5" /> Run in Harness
              </Link>
            </div>
          </div>

          <div className="grid lg:grid-cols-[280px_1fr] gap-4 min-h-[420px]">
            <GlassPanel className="p-3 overflow-y-auto max-h-[520px]">
              <p className="text-2xs uppercase text-cx-fg-dim mb-2 flex items-center gap-1">
                <FolderTree className="w-3 h-3" /> Generated files
              </p>
              {Object.entries(filesByPhase).map(([phase, files]) => (
                <div key={phase} className="mb-3">
                  <p className="text-[9px] uppercase text-cx-accent tracking-widest mb-1">{phase}</p>
                  {files.map((f) => (
                    <button
                      key={f.path}
                      type="button"
                      onClick={() => setSelectedPath(f.path)}
                      className={`w-full text-left text-2xs font-mono px-2 py-1 rounded truncate ${
                        selectedPath === f.path ? 'bg-cx-accent/15 text-cx-accent' : 'text-cx-fg-dim hover:text-cx-fg'
                      }`}
                    >
                      {f.path}
                    </button>
                  ))}
                </div>
              ))}
            </GlassPanel>

            <GlassPanel className="p-0 overflow-hidden flex flex-col">
              {selectedFile ? (
                <>
                  <div className="px-4 py-2 border-b border-cx-border flex items-center justify-between">
                    <span className="text-2xs font-mono text-cx-fg-dim truncate">{selectedFile.path}</span>
                    <span className="text-[9px] uppercase text-cx-fg-dim">{selectedFile.phase}</span>
                  </div>
                  <pre className="flex-1 overflow-auto p-4 text-2xs font-mono text-cx-fg-muted leading-relaxed max-h-[480px]">
                    {selectedFile.content}
                  </pre>
                </>
              ) : (
                <p className="p-8 text-sm text-cx-fg-dim text-center">Select a file to preview</p>
              )}
            </GlassPanel>
          </div>
        </>
      )}
    </div>
  )
}
