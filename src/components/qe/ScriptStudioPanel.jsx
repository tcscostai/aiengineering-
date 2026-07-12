import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Code2,
  Play,
  Download,
  FolderTree,
  CheckCircle,
  Loader2,
  Terminal,
  Sparkles,
  FileCode,
} from 'lucide-react'
import { GlassPanel } from '../ui/GlassPanel'
import { ProgressBar } from '../ui/ProgressBar'
import {
  BENEFITS_TEST_PYRAMID,
  SCRIPT_FRAMEWORKS,
} from '../../data/benefitsScenario'
import { getScriptCodegenPhases } from '../../lib/qe/testScriptGenerator'
import {
  runScriptCodegenPipeline,
  getLatestScriptCodegen,
  downloadScriptBundle,
  downloadScriptFile,
} from '../../services/testScriptCodegenService'

const SUITE_OPTIONS = [
  { id: 'regression', label: 'Full regression', detail: 'All P0 benefit scenarios' },
  { id: 'eligibility', label: 'Eligibility & COB', detail: '270/271 and member status' },
  { id: 'inquiry', label: 'Benefits inquiry', detail: 'HMO / PPO cost-share summaries' },
  { id: 'pharmacy', label: 'Pharmacy / formulary', detail: 'Tier changes and step therapy' },
  { id: 'lifesciences', label: 'Life Sciences specialty', detail: 'REMS and limited distribution' },
  { id: 'e2e', label: 'Member portal E2E', detail: 'UI journeys through benefits summary' },
  { id: 'functional', label: 'Complete functional', detail: 'All catalog scenarios' },
]

function ScriptTerminal({ logs, active }) {
  const endRef = useRef(null)
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [logs])

  return (
    <GlassPanel className="p-0 overflow-hidden border-cx-accent2/20">
      <div className="flex items-center gap-2 px-4 py-2 border-b border-cx-border bg-cx-deep/60">
        <Terminal className="w-3.5 h-3.5 text-cx-accent2" />
        <span className="text-2xs font-mono text-cx-fg-dim">script-gen-agent</span>
        {active && <Loader2 className="w-3 h-3 text-cx-accent2 animate-spin ml-auto" />}
      </div>
      <div className="h-[200px] overflow-y-auto p-4 font-mono text-2xs space-y-1 bg-cx-void/80">
        {logs.map((line, i) => (
          <motion.div
            key={`${i}-${line.slice(0, 20)}`}
            initial={{ opacity: 0, x: -6 }}
            animate={{ opacity: 1, x: 0 }}
            className={`${line.startsWith('✓') ? 'text-cx-success' : line.startsWith('▸') ? 'text-cx-accent2' : 'text-cx-fg-muted'}`}
          >
            {line}
          </motion.div>
        ))}
        {active && (
          <div className="text-cx-accent2 animate-pulse">▸ Generating functional scripts…</div>
        )}
        <div ref={endRef} />
      </div>
    </GlassPanel>
  )
}

export function ScriptStudioPanel({ onNotify }) {
  const [framework, setFramework] = useState('playwright-ts')
  const [suiteId, setSuiteId] = useState('regression')
  const [generating, setGenerating] = useState(false)
  const [progress, setProgress] = useState(0)
  const [phase, setPhase] = useState(null)
  const [terminalLogs, setTerminalLogs] = useState([])
  const [result, setResult] = useState(() => getLatestScriptCodegen())
  const [selectedPath, setSelectedPath] = useState(null)

  const phases = getScriptCodegenPhases()
  const selectedFile = result?.files?.find((f) => f.path === selectedPath)

  useEffect(() => {
    if (result?.files?.length && !selectedPath) {
      setSelectedPath(result.files.find((f) => f.phase === 'scripts')?.path ?? result.files[0]?.path)
    }
  }, [result, selectedPath])

  const handleGenerate = async () => {
    setGenerating(true)
    setProgress(0)
    setTerminalLogs([])
    setPhase(null)
    onNotify?.('Script generation started — Automation Script Generation Agent', 'info')

    try {
      const record = await runScriptCodegenPipeline(
        { framework, suiteId },
        {
          onPhase: setPhase,
          onLog: (msg) => setTerminalLogs((prev) => [...prev, msg]),
          onProgress: setProgress,
        }
      )
      setResult(record)
      setSelectedPath(record.files.find((f) => f.phase === 'scripts')?.path ?? record.files[0]?.path)
      onNotify?.(`Generated ${record.files.length} test files (${record.framework})`, 'success')
    } finally {
      setGenerating(false)
      setPhase(null)
    }
  }

  return (
    <div className="space-y-6 mb-6">
      <GlassPanel hero className="p-6 border-cx-accent2/25">
        <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="w-4 h-4 text-cx-accent2" />
              <p className="text-2xs uppercase text-cx-accent2 tracking-widest">Script Studio</p>
            </div>
            <h2 className="font-display text-lg font-semibold text-cx-fg">
              Benefits Test Automation — Script Generation
            </h2>
            <p className="text-sm text-cx-fg-dim mt-1 max-w-2xl">
              Generate runnable functional test scripts (Playwright, Selenium, Cypress) from healthcare &amp; Life Sciences benefit scenarios with synthetic member data and CI hooks.
            </p>
          </div>
          <button
            type="button"
            onClick={handleGenerate}
            disabled={generating}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-cx-accent2/40 bg-cx-accent2/10 text-cx-accent2 text-sm hover:bg-cx-accent2/20 disabled:opacity-50"
          >
            {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
            {generating ? 'Generating…' : 'Generate scripts'}
          </button>
        </div>

        <div className="grid md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="text-2xs uppercase text-cx-fg-dim tracking-wider mb-2 block">Test suite</label>
            <select
              value={suiteId}
              onChange={(e) => setSuiteId(e.target.value)}
              disabled={generating}
              className="w-full px-3 py-2 rounded-xl border border-cx-border bg-cx-raised/40 text-sm text-cx-fg"
            >
              {SUITE_OPTIONS.map((s) => (
                <option key={s.id} value={s.id}>{s.label} — {s.detail}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-2xs uppercase text-cx-fg-dim tracking-wider mb-2 block">Framework</label>
            <select
              value={framework}
              onChange={(e) => setFramework(e.target.value)}
              disabled={generating}
              className="w-full px-3 py-2 rounded-xl border border-cx-border bg-cx-raised/40 text-sm text-cx-fg"
            >
              {SCRIPT_FRAMEWORKS.map((f) => (
                <option key={f.id} value={f.id}>{f.label} · {f.language}</option>
              ))}
            </select>
          </div>
        </div>

        {(generating || result) && (
          <div className="mb-4">
            <div className="flex justify-between text-xs text-cx-fg-dim mb-1">
              <span>{generating ? `Phase: ${phase ?? 'init'}` : 'Last generation complete'}</span>
              <span>{progress}%</span>
            </div>
            <ProgressBar value={generating ? progress : 100} />
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2">
          {BENEFITS_TEST_PYRAMID.map((layer) => (
            <div key={layer.id} className="p-2 rounded-lg border border-cx-border bg-cx-raised/20 text-center">
              <p className="text-[9px] uppercase text-cx-accent tracking-widest">{layer.layer}</p>
              <p className="text-[10px] text-cx-fg mt-0.5 leading-tight">{layer.label.split(' ')[0]}</p>
            </div>
          ))}
        </div>
      </GlassPanel>

      <ScriptTerminal logs={terminalLogs} active={generating} />

      {result && (
        <div className="grid lg:grid-cols-3 gap-4">
          <GlassPanel className="p-4 lg:col-span-1">
            <div className="flex items-center gap-2 mb-3">
              <FolderTree className="w-4 h-4 text-cx-accent" />
              <p className="text-2xs uppercase text-cx-fg-dim tracking-widest">Generated files ({result.files.length})</p>
            </div>
            <div className="space-y-1 max-h-[320px] overflow-y-auto">
              {result.files.map((file) => (
                <button
                  key={file.path}
                  type="button"
                  onClick={() => setSelectedPath(file.path)}
                  className={`w-full text-left px-2 py-1.5 rounded-lg text-2xs font-mono truncate transition-colors ${
                    selectedPath === file.path
                      ? 'bg-cx-accent/15 text-cx-accent border border-cx-accent/30'
                      : 'text-cx-fg-dim hover:bg-cx-raised/40'
                  }`}
                >
                  <FileCode className="w-3 h-3 inline mr-1 opacity-60" />
                  {file.path}
                </button>
              ))}
            </div>
            <div className="flex gap-2 mt-4">
              <button
                type="button"
                onClick={() => downloadScriptBundle(result)}
                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-cx-border text-xs text-cx-fg hover:border-cx-accent/40"
              >
                <Download className="w-3.5 h-3.5" /> Bundle
              </button>
              {selectedFile && (
                <button
                  type="button"
                  onClick={() => downloadScriptFile(selectedFile)}
                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-cx-accent/30 bg-cx-accent/10 text-xs text-cx-accent"
                >
                  <Download className="w-3.5 h-3.5" /> File
                </button>
              )}
            </div>
          </GlassPanel>

          <GlassPanel className="p-0 lg:col-span-2 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2 border-b border-cx-border bg-cx-deep/40">
              <div className="flex items-center gap-2">
                <Code2 className="w-3.5 h-3.5 text-cx-accent" />
                <span className="text-2xs font-mono text-cx-fg-dim">{selectedPath ?? 'Select a file'}</span>
              </div>
              <div className="flex items-center gap-3 text-2xs text-cx-fg-dim">
                <span className="flex items-center gap-1 text-cx-success">
                  <CheckCircle className="w-3 h-3" /> {result.summary.totalScenarios} scenarios
                </span>
                <span>{result.summary.estimatedCoverage}% est. coverage</span>
              </div>
            </div>
            <pre className="p-4 text-2xs font-mono text-cx-fg-muted overflow-auto max-h-[360px] leading-relaxed bg-cx-void/60">
              {selectedFile?.content ?? 'Select a generated file to preview'}
            </pre>
          </GlassPanel>
        </div>
      )}

      {!result && !generating && (
        <GlassPanel className="p-6 text-center">
          <Code2 className="w-8 h-8 text-cx-fg-dim mx-auto mb-3 opacity-40" />
          <p className="text-sm text-cx-fg-dim">
            Select a suite and framework, then click <strong className="text-cx-accent2">Generate scripts</strong> to produce Playwright, Selenium, or Cypress functional tests.
          </p>
        </GlassPanel>
      )}
    </div>
  )
}
