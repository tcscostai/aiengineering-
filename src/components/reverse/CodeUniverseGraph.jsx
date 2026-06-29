import { useState } from 'react'
import { Layers } from 'lucide-react'
import { GlassPanel } from '../ui/GlassPanel'
import { D3ForceGraph } from './D3ForceGraph'

const LAYERS = [
  { id: 'all', label: 'All layers' },
  { id: 'architecture', label: 'Architecture' },
  { id: 'dependencies', label: 'Dependencies' },
  { id: 'dataflow', label: 'Data flow' },
]

export function CodeUniverseGraph({ graph, selectedNodeId, onNodeSelect, findings = [] }) {
  const [layer, setLayer] = useState('all')

  const selectedNode = graph?.nodes?.find((n) => n.id === selectedNodeId)
  const selectedFindings = selectedNodeId
    ? findings.filter((f) => {
        const mod = selectedNodeId.replace(/^mod:|^flow:[^:]+:/, '').replace(/^flow:/, '')
        return f.file?.includes(mod) || selectedNodeId.includes(mod)
      })
    : findings.slice(0, 6)

  const nodeCount = graph?.nodes?.filter((n) => layer === 'all' || n.layer === layer || (layer === 'dependencies' && n.type === 'dependency')).length ?? 0
  const edgeCount = graph?.edges?.filter((e) => layer === 'all' || e.layer === layer).length ?? 0

  if (!graph?.nodes?.length) {
    return (
      <GlassPanel className="p-12 text-center text-sm text-cx-fg-dim">
        Run a scan to generate the Code Universe graph.
      </GlassPanel>
    )
  }

  return (
    <div className="grid lg:grid-cols-[1fr_280px] gap-4">
      <div className="relative rounded-xl overflow-hidden border border-cx-border" style={{ height: 520 }}>
        <div className="absolute top-3 left-3 z-10 flex flex-wrap gap-1 p-1 rounded-lg border border-cx-border bg-cx-panel/95 backdrop-blur max-w-[90%]">
          {LAYERS.map((l) => (
            <button
              key={l.id}
              onClick={() => setLayer(l.id)}
              className={`px-2.5 py-1 rounded text-2xs ${layer === l.id ? 'bg-cx-accent/15 text-cx-accent' : 'text-cx-fg-dim'}`}
            >
              {l.label}
            </button>
          ))}
        </div>
        <D3ForceGraph
          graph={graph}
          layer={layer}
          height={520}
          selectedNodeId={selectedNodeId}
          onNodeSelect={onNodeSelect}
        />
        <div className="absolute bottom-3 right-3 flex items-center gap-1.5 px-2 py-1 rounded-lg border border-cx-border bg-cx-panel/90 text-2xs text-cx-fg-dim">
          <Layers className="w-3 h-3" /> {nodeCount} nodes · {edgeCount} edges · D3 force
        </div>
      </div>

      <GlassPanel className="p-4 h-[520px] overflow-y-auto">
        <h4 className="text-xs uppercase tracking-widest text-cx-fg-dim mb-3">Intelligence</h4>
        {selectedNode && (
          <div className="mb-4 p-3 rounded-lg border border-cx-accent/20 bg-cx-accent/5">
            <p className="text-sm text-cx-fg font-medium">{selectedNode.label}</p>
            <p className="text-2xs text-cx-fg-dim mt-1 capitalize">{selectedNode.type} · {selectedNode.layer}</p>
            {selectedNode.fileCount != null && <p className="text-2xs text-cx-fg-dim">{selectedNode.fileCount} files</p>}
          </div>
        )}
        {selectedFindings.length === 0 ? (
          <p className="text-xs text-cx-fg-dim">Select a node to see related findings. Drag nodes to explore the force graph.</p>
        ) : (
          <ul className="space-y-2">
            {selectedFindings.map((f) => (
              <li key={f.id} className="p-2.5 rounded-lg border border-cx-border bg-cx-panel/40 text-xs">
                <span className={`uppercase text-2xs font-medium ${f.severity === 'critical' ? 'text-cx-danger' : f.severity === 'high' ? 'text-cx-warn' : 'text-cx-fg-dim'}`}>{f.severity}</span>
                <p className="text-cx-fg mt-1">{f.label}</p>
                <p className="text-cx-fg-dim font-mono mt-1">{f.file}:{f.line}</p>
              </li>
            ))}
          </ul>
        )}
      </GlassPanel>
    </div>
  )
}
