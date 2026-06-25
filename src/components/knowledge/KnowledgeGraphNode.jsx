import { memo, useMemo } from 'react'
import { Handle, Position } from 'reactflow'
import { motion } from 'framer-motion'
import {
  Database,
  AlertTriangle,
  Server,
  FileText,
  BookOpen,
  Bot,
  Activity,
  GitBranch,
  Shield,
  Code2,
  Layers,
  Bug,
  ClipboardList,
  RefreshCw,
} from 'lucide-react'
import { NODE_STYLES } from '../../data/knowledgeFabric'

const ICONS = {
  source: Database,
  incident: AlertTriangle,
  ci: Server,
  change: RefreshCw,
  telemetry: Activity,
  knowledge: BookOpen,
  runbook: FileText,
  agent: Bot,
  entity: Layers,
  architecture: GitBranch,
  code: Code2,
  api: GitBranch,
  policy: Shield,
  requirement: ClipboardList,
  test: FileText,
  defect: Bug,
}

function KnowledgeGraphNode({ data, selected }) {
  const style = NODE_STYLES[data.nodeType] ?? NODE_STYLES.entity
  const Icon = ICONS[data.nodeType] ?? Layers
  const isHighlight = data.highlight
  const isAgent = data.nodeType === 'agent'

  return (
    <motion.div
      animate={
        isHighlight
          ? {
              boxShadow: [
                `0 0 12px ${style.color}30`,
                `0 0 28px ${style.color}50`,
                `0 0 12px ${style.color}30`,
              ],
            }
          : {}
      }
      transition={{ duration: 2.5, repeat: Infinity }}
      className={`min-w-[150px] max-w-[200px] rounded-xl border backdrop-blur-xl transition-all ${
        selected ? 'ring-2 ring-cx-accent/60 scale-[1.02]' : ''
      } ${isAgent ? 'border-dashed' : ''}`}
      style={{
        borderColor: selected ? '#5ec8f2' : `${style.color}${isHighlight ? '90' : '55'}`,
        backgroundColor: `${style.color}${isHighlight ? '18' : '10'}`,
      }}
    >
      <Handle type="target" position={Position.Left} className="!w-2 !h-2 !bg-cx-accent !border-cx-panel !opacity-0" />
      <Handle type="target" position={Position.Top} className="!w-2 !h-2 !bg-cx-accent !border-cx-panel !opacity-0" />

      <div className="p-3">
        <div className="flex items-start gap-2 mb-1.5">
          <div
            className="p-1.5 rounded-lg shrink-0"
            style={{ backgroundColor: `${style.color}22` }}
          >
            <Icon className="w-3.5 h-3.5" style={{ color: style.color }} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] uppercase tracking-wider text-cx-fg-dim leading-none mb-0.5">
              {style.label}
            </p>
            <p className="text-xs font-semibold text-cx-fg leading-tight break-words">{data.label}</p>
          </div>
        </div>

        {data.meta && (
          <p className="text-[10px] text-cx-fg-dim leading-snug mb-1.5 line-clamp-2">{data.meta}</p>
        )}

        <div className="flex flex-wrap gap-1">
          {data.severity && (
            <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-cx-danger/15 text-cx-danger font-mono">
              {data.severity}
            </span>
          )}
          {data.status && (
            <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-cx-warn/15 text-cx-warn">
              {data.status}
            </span>
          )}
          {data.system && (
            <span className="text-[9px] uppercase px-1.5 py-0.5 rounded border border-cx-border text-cx-fg-dim">
              {data.system}
            </span>
          )}
          {data.records > 0 && (
            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-cx-raised/60 text-cx-accent">
              {data.records >= 1000 ? `${(data.records / 1000).toFixed(1)}k` : data.records} records
            </span>
          )}
        </div>
      </div>

      <Handle type="source" position={Position.Right} className="!w-2 !h-2 !bg-cx-accent !border-cx-panel !opacity-0" />
      <Handle type="source" position={Position.Bottom} className="!w-2 !h-2 !bg-cx-accent !border-cx-panel !opacity-0" />
    </motion.div>
  )
}

export const knowledgeGraphNodeTypes = {
  knowledge: memo(KnowledgeGraphNode),
}

export function graphToFlow(graph, categoryColor = '#5ec8f2') {
  const nodes = graph.nodes.map((n) => ({
    id: n.id,
    type: 'knowledge',
    position: { x: n.x, y: n.y },
    data: {
      label: n.label,
      nodeType: n.type,
      meta: n.meta,
      system: n.system,
      records: n.records ?? 0,
      severity: n.severity,
      status: n.status,
      highlight: n.highlight,
      agentId: n.agentId,
    },
  }))

  const edges = graph.edges.map((e, i) => ({
    id: `ke-${e.from}-${e.to}-${i}`,
    source: e.from,
    target: e.to,
    label: e.label,
    animated: (e.strength ?? 0.8) > 0.85,
    style: {
      stroke: categoryColor,
      strokeWidth: 1 + (e.strength ?? 0.7) * 2,
      opacity: 0.5 + (e.strength ?? 0.7) * 0.5,
    },
    labelStyle: { fill: '#8b9cb0', fontSize: 9, fontFamily: 'monospace' },
    labelBgStyle: { fill: '#10141d', fillOpacity: 0.85 },
    labelBgPadding: [4, 6],
    labelBgBorderRadius: 4,
  }))

  return { nodes, edges }
}

export function useAgentKnowledgeBindings(agents, category) {
  return useMemo(() => {
    const catAgents = agents.filter((a) => a.category === category && a.knowledgeSources?.length)
    return catAgents.map((agent) => ({
      id: agent.id,
      name: agent.name,
      sources: agent.knowledgeSources,
      coverage: Math.min(100, Math.round((agent.knowledgeSources.length / 6) * 100)),
      stage: agent.stage,
    }))
  }, [agents, category])
}
