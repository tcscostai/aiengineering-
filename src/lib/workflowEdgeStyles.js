import { MarkerType } from 'reactflow'

export const WORKFLOW_EDGE_COLOR = '#5ec8f2'

/** Dotted edge style for saved connections on the canvas */
export const workflowEdgeStyle = {
  stroke: WORKFLOW_EDGE_COLOR,
  strokeWidth: 2,
  strokeDasharray: '7 5',
}

/** Dotted preview line while dragging a new connection */
export const workflowConnectionLineStyle = {
  stroke: WORKFLOW_EDGE_COLOR,
  strokeWidth: 2,
  strokeDasharray: '7 5',
}

export const defaultWorkflowEdgeOptions = {
  animated: true,
  style: workflowEdgeStyle,
  markerEnd: { type: MarkerType.ArrowClosed, color: WORKFLOW_EDGE_COLOR },
  type: 'smoothstep',
}

export function withWorkflowEdgeDefaults(edge) {
  return {
    ...defaultWorkflowEdgeOptions,
    ...edge,
    style: { ...workflowEdgeStyle, ...edge.style },
    markerEnd: edge.markerEnd ?? defaultWorkflowEdgeOptions.markerEnd,
  }
}
