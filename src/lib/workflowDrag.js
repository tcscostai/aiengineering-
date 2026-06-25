export const DND_MIME = 'application/horizon-workflow'

export function setDragPayload(e, payload) {
  const raw = JSON.stringify(payload)
  e.dataTransfer.setData(DND_MIME, raw)
  e.dataTransfer.setData('application/reactflow', raw)
  e.dataTransfer.setData('text/plain', raw)
  e.dataTransfer.effectAllowed = 'move'
}

export function getDragPayload(e) {
  const raw =
    e.dataTransfer.getData(DND_MIME) ||
    e.dataTransfer.getData('application/reactflow') ||
    e.dataTransfer.getData('text/plain')
  if (!raw) return null
  try {
    return JSON.parse(raw)
  } catch {
    return null
  }
}

import { withWorkflowEdgeDefaults } from './workflowEdgeStyles'

export function cloneWorkflowFragment(workflow, dropPosition, generateId) {
  if (!workflow?.nodes?.length) return { nodes: [], edges: [] }

  const positions = workflow.nodes.map((n) => n.position ?? { x: 0, y: 0 })
  const minX = Math.min(...positions.map((p) => p.x))
  const minY = Math.min(...positions.map((p) => p.y))
  const idMap = new Map()

  const nodes = workflow.nodes.map((n) => {
    const newId = generateId('node')
    idMap.set(n.id, newId)
    const pos = n.position ?? { x: 0, y: 0 }
    return {
      id: newId,
      type: n.type,
      position: {
        x: dropPosition.x + (pos.x - minX),
        y: dropPosition.y + (pos.y - minY),
      },
      data: {
        label: n.label,
        agentId: n.agentId,
        task: n.task ?? '',
        category: n.category,
        runtimeType: n.runtimeType,
        skillsCount: n.skillsCount,
        approverRole: n.approverRole,
      },
    }
  })

  const edges = workflow.edges
    .filter((e) => idMap.has(e.source) && idMap.has(e.target))
    .map((e) =>
      withWorkflowEdgeDefaults({
        id: generateId('edge'),
        source: idMap.get(e.source),
        target: idMap.get(e.target),
        label: e.handoff && e.handoff !== 'default_output' ? e.handoff : undefined,
      })
    )

  return { nodes, edges }
}
