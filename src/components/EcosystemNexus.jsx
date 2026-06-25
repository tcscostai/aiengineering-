import { useMemo } from 'react'
import { motion } from 'framer-motion'
import ReactFlow, { Background, MarkerType } from 'reactflow'
import dashboardData from '../data/dashboard.json'

function NexusNode({ data }) {
  const isCenter = data.type === 'center'
  return (
    <motion.div
      animate={{ boxShadow: isCenter ? ['0 0 20px rgba(94,200,242,0.3)', '0 0 40px rgba(94,200,242,0.5)', '0 0 20px rgba(94,200,242,0.3)'] : undefined }}
      transition={{ duration: 2, repeat: Infinity }}
      className={`px-4 py-3 rounded-xl border backdrop-blur-xl ${
        isCenter
          ? 'bg-cx-accent/15 border-cx-accent/50 min-w-[160px]'
          : 'bg-cx-panel/80 border-cx-border min-w-[120px]'
      }`}
    >
      <p className={`text-xs font-medium text-center ${isCenter ? 'text-cx-accent' : 'text-cx-fg-muted'}`}>
        {data.label}
      </p>
    </motion.div>
  )
}

const nodeTypes = { nexus: NexusNode }

export function EcosystemNexus() {
  const { nodes, edges } = useMemo(() => {
    const center = { x: 400, y: 250 }
    const radius = 200
    const satellites = dashboardData.nexusNodes.filter((n) => n.id !== 'nexus')

    const flowNodes = [
      {
        id: 'nexus',
        type: 'nexus',
        position: { x: center.x - 80, y: center.y - 24 },
        data: { label: 'AI Engineering Nexus', type: 'center' },
      },
      ...satellites.map((s, i) => {
        const angle = (i / satellites.length) * 2 * Math.PI - Math.PI / 2
        return {
          id: s.id,
          type: 'nexus',
          position: {
            x: center.x + Math.cos(angle) * radius - 60,
            y: center.y + Math.sin(angle) * radius - 20,
          },
          data: { label: s.label, type: s.type },
        }
      }),
    ]

    const flowEdges = satellites.map((s) => ({
      id: `e-nexus-${s.id}`,
      source: 'nexus',
      target: s.id,
      animated: true,
      style: { stroke: '#5ec8f2', strokeWidth: 2 },
      markerEnd: { type: MarkerType.ArrowClosed, color: '#5ec8f2' },
    }))

    return { nodes: flowNodes, edges: flowEdges }
  }, [])

  return (
    <div className="h-[420px] rounded-2xl border border-cx-border overflow-hidden bg-cx-panel/30">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        fitView
        proOptions={{ hideAttribution: true }}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={false}
        panOnDrag={false}
        zoomOnScroll={false}
      >
        <Background color="rgba(148,163,184,0.05)" gap={20} />
      </ReactFlow>
    </div>
  )
}
