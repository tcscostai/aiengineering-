import { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { Scan, Network, Bot, Map, History, Code2 } from 'lucide-react'
import { PageHeader } from '../components/ui/PageHeader'
import { ScanSourcePanel } from '../components/reverse/ScanSourcePanel'
import { ScanTerminal } from '../components/reverse/ScanTerminal'
import { ScanInsightsRail } from '../components/reverse/ScanInsightsRail'
import { CodeUniverseGraph } from '../components/reverse/CodeUniverseGraph'
import { ReverseEngineerCopilot } from '../components/reverse/ReverseEngineerCopilot'
import { MigrationBlueprintPanel } from '../components/reverse/MigrationBlueprintPanel'
import { CodeGenerationPanel } from '../components/reverse/CodeGenerationPanel'
import { useReverseEngineering } from '../hooks/useReverseEngineering'
import { useApp } from '../context/AppContext'
import { fetchScan } from '../services/reverseEngineeringApi'

const TABS = [
  { id: 'scan', label: 'Scan & Ingest', icon: Scan },
  { id: 'universe', label: 'Code Universe', icon: Network },
  { id: 'copilot', label: 'AI Reverse Engineer', icon: Bot },
  { id: 'blueprint', label: 'Migration Blueprint', icon: Map },
  { id: 'codegen', label: 'Generated Code', icon: Code2 },
]

export default function ReverseEngineering() {
  const location = useLocation()
  const { addNotification } = useApp()
  const [tab, setTab] = useState(location.state?.tab ?? 'scan')
  const [selectedNode, setSelectedNode] = useState(null)

  const {
    serverOnline,
    checkServer,
    history,
    activeScan,
    scanning,
    logs,
    progress,
    error,
    scanGit,
    scanPath,
    scanZip,
    scanDemo,
    queryCopilot,
    setActiveScan,
  } = useReverseEngineering()

  const handleScanComplete = () => {
    addNotification('Reverse engineering scan complete', 'success')
    setTab('universe')
  }

  const wrapScan = (fn) => async (...args) => {
    try {
      await fn(...args)
      handleScanComplete()
    } catch (err) {
      addNotification(err.message, 'error')
    }
  }

  useEffect(() => {
    if (location.state?.tab) setTab(location.state.tab)
    if (location.state?.runDemoScan && !scanning) {
      wrapScan(() => scanDemo())()
    }
  }, [location.key, location.state?.flowNavTick, location.state?.runDemoScan, location.state?.tab])

  const loadHistoryScan = async (scanId) => {
    try {
      const job = await fetchScan(scanId)
      if (job.status === 'completed') {
        setActiveScan(job)
        setTab('universe')
      } else {
        addNotification('Scan not available — run a new scan', 'warn')
      }
    } catch {
      addNotification('Could not load scan from server session', 'warn')
    }
  }

  return (
    <div>
      <PageHeader
        eyebrow="Migration Discovery"
        title="Reverse Engineering Studio"
        description="Clone Git repos or scan local workspaces — map architecture, ask AI, and generate migration blueprints for enterprise modernization."
      />

      <ScanInsightsRail scan={activeScan} history={history} onSelectHistory={loadHistoryScan} />

      <div className="flex flex-wrap gap-1 p-1 rounded-xl border border-cx-border bg-cx-panel/50 mb-6 w-fit">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm transition-all ${
              tab === t.id
                ? 'bg-cx-accent/15 text-cx-accent border border-cx-accent/30 shadow-[0_0_20px_rgba(94,200,242,0.08)]'
                : 'text-cx-fg-dim hover:text-cx-fg-muted border border-transparent'
            }`}
          >
            <t.icon className="w-4 h-4" /> {t.label}
          </button>
        ))}
      </div>

      {error && (
        <p className="text-sm text-cx-danger mb-4">{error}</p>
      )}

      {tab === 'scan' && (
        <div className="grid lg:grid-cols-2 gap-6">
          <ScanSourcePanel
            serverOnline={serverOnline}
            scanning={scanning}
            progress={progress}
            onScanGit={(p) => wrapScan(scanGit)(p)}
            onScanPath={(p) => wrapScan(scanPath)(p)}
            onScanZip={(f) => wrapScan(scanZip)(f)}
            onScanDemo={() => wrapScan(scanDemo)()}
            onCheckServer={checkServer}
          />
          <ScanTerminal logs={logs} scanning={scanning} title="horizon-re scan pipeline" />
        </div>
      )}

      {tab === 'universe' && (
        <CodeUniverseGraph
          graph={activeScan?.result?.graph}
          findings={activeScan?.result?.findings ?? []}
          selectedNodeId={selectedNode}
          onNodeSelect={setSelectedNode}
        />
      )}

      {tab === 'copilot' && (
        <ReverseEngineerCopilot activeScan={activeScan} onAsk={queryCopilot} disabled={scanning} />
      )}

      {tab === 'blueprint' && (
        <MigrationBlueprintPanel
          activeScan={activeScan}
          onNotify={addNotification}
          onGoToCodegen={() => setTab('codegen')}
        />
      )}

      {tab === 'codegen' && (
        <CodeGenerationPanel activeScan={activeScan} onNotify={addNotification} />
      )}

      {history.length > 0 && tab === 'scan' && (
        <div className="mt-6 flex items-center gap-2 text-xs text-cx-fg-dim">
          <History className="w-3.5 h-3.5" />
          {history.length} scan(s) in local history — server retains active session scans until restart.
        </div>
      )}
    </div>
  )
}
