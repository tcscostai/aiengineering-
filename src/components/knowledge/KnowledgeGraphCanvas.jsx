import { useMemo, useState, useCallback } from 'react'
import ReactFlow, { Background, Controls, MiniMap, MarkerType } from 'reactflow'
import { motion, AnimatePresence } from 'framer-motion'
import { ZoomIn, Maximize2, Radio } from 'lucide-react'
import { knowledgeGraphNodeTypes, graphToFlow } from './KnowledgeGraphNode'
import { GlassPanel } from '../ui/GlassPanel'

export function KnowledgeGraphCanvas({
  graph,
  categoryColor = '#5ec8f2',
  height = 520,
  onNodeSelect,
  selectedNodeId,
}) {
  const [hoveredEdge, setHoveredEdge] = useState(null)

  const { nodes, edges } = useMemo(
    () => graphToFlow(graph, categoryColor),
    [graph, categoryColor]
  )

  const styledNodes = useMemo(
    () =>
      nodes.map((n) => ({
        ...n,
        selected: n.id === selectedNodeId,
      })),
    [nodes, selectedNodeId]
  )

  const styledEdges = useMemo(
    () =>
      edges.map((e) => ({
        ...e,
        markerEnd: { type: MarkerType.ArrowClosed, color: categoryColor },
        style: {
          ...e.style,
          strokeWidth: hoveredEdge === e.id ? (e.style?.strokeWidth ?? 2) + 1 : e.style?.strokeWidth,
        },
      })),
    [edges, categoryColor, hoveredEdge]
  )

  const onNodeClick = useCallback(
    (_, node) => onNodeSelect?.(node),
    [onNodeSelect]
  )

  if (!graph?.nodes?.length) {
    return (
      <GlassPanel className="p-12 text-center text-sm text-cx-fg-dim">
        No knowledge graph data for this view.
      </GlassPanel>
    )
  }

  return (
    <div className="relative rounded-xl overflow-hidden" style={{ height }}>
      <div
        className="absolute inset-0 opacity-30 pointer-events-none"
        style={{
          background: `radial-gradient(ellipse at 50% 30%, ${categoryColor}22 0%, transparent 65%)`,
        }}
      />
      <ReactFlow
        nodes={styledNodes}
        edges={styledEdges}
        nodeTypes={knowledgeGraphNodeTypes}
        onNodeClick={onNodeClick}
        onEdgeMouseEnter={(_, edge) => setHoveredEdge(edge.id)}
        onEdgeMouseLeave={() => setHoveredEdge(null)}
        fitView
        fitViewOptions={{ padding: 0.15 }}
        minZoom={0.4}
        maxZoom={1.8}
        proOptions={{ hideAttribution: true }}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable
        panOnDrag
        zoomOnScroll
      >
        <Background color="rgba(148,163,184,0.04)" gap={24} size={1} />
        <Controls className="!bg-cx-panel/95 !border-cx-border !shadow-none" showInteractive={false} />
        <MiniMap
          nodeColor={(n) => categoryColor}
          maskColor="rgba(4,5,8,0.8)"
          className="!bg-cx-panel/90 !border-cx-border"
        />
      </ReactFlow>

      <div className="absolute top-3 right-3 flex gap-2 pointer-events-none">
        <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-cx-border bg-cx-panel/90 text-[10px] text-cx-fg-dim backdrop-blur">
          <Radio className="w-3 h-3 text-cx-success animate-pulse" />
          Live sync
        </span>
        <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-cx-border bg-cx-panel/90 text-[10px] text-cx-fg-dim backdrop-blur">
          <ZoomIn className="w-3 h-3" />
          {graph.nodes.length} nodes
        </span>
        <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-cx-border bg-cx-panel/90 text-[10px] text-cx-fg-dim backdrop-blur">
          <Maximize2 className="w-3 h-3" />
          {graph.edges.length} edges
        </span>
      </div>
    </div>
  )
}

export function GraphViewToggle({ views, activeView, onChange, categoryColor }) {
  return (
    <div className="flex flex-wrap gap-2">
      {views.map((v) => (
        <button
          key={v.id}
          type="button"
          onClick={() => onChange(v.id)}
          className={`px-3 py-1.5 rounded-xl border text-xs transition-all ${
            activeView === v.id
              ? 'text-cx-fg border-cx-border-strong'
              : 'text-cx-fg-dim border-cx-border hover:text-cx-fg-muted'
          }`}
          style={
            activeView === v.id
              ? { borderColor: `${categoryColor}50`, backgroundColor: `${categoryColor}12`, color: categoryColor }
              : undefined
          }
        >
          {v.label}
          {v.badge && (
            <span className="ml-1.5 text-[9px] uppercase px-1 py-0.5 rounded bg-cx-danger/20 text-cx-danger">
              {v.badge}
            </span>
          )}
        </button>
      ))}
    </div>
  )
}

export function NodeDetailPanel({ node, categoryColor }) {
  if (!node) return null

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={node.id}
        initial={{ opacity: 0, x: 12 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 12 }}
        className="space-y-3"
      >
        <div>
          <p className="text-[10px] uppercase tracking-widest text-cx-fg-dim mb-1">{node.data.nodeType}</p>
          <p className="font-display text-base font-semibold text-cx-fg">{node.data.label}</p>
          {node.data.meta && <p className="text-xs text-cx-fg-dim mt-1">{node.data.meta}</p>}
        </div>

        {node.data.agentId && (
          <div
            className="p-3 rounded-xl border"
            style={{ borderColor: `${categoryColor}40`, backgroundColor: `${categoryColor}08` }}
          >
            <p className="text-[10px] uppercase text-cx-fg-dim mb-1">Agent Intelligence</p>
            <p className="text-xs text-cx-fg">
              This knowledge node is bound to an onboarded agent. Agents query this graph during harness
              context assembly and memory retrieval.
            </p>
          </div>
        )}

        <div className="grid grid-cols-2 gap-2 text-center">
          {node.data.records > 0 && (
            <div className="p-2 rounded-lg border border-cx-border bg-cx-raised/30">
              <p className="text-[10px] text-cx-fg-dim">Records</p>
              <p className="font-mono text-sm" style={{ color: categoryColor }}>
                {node.data.records.toLocaleString()}
              </p>
            </div>
          )}
          {node.data.system && (
            <div className="p-2 rounded-lg border border-cx-border bg-cx-raised/30">
              <p className="text-[10px] text-cx-fg-dim">System</p>
              <p className="text-xs text-cx-fg">{node.data.system}</p>
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
