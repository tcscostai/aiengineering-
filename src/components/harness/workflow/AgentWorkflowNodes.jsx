import { memo } from 'react'
import { Handle, Position } from 'reactflow'
import { Bot, Shield, UserCheck, Play, Square, GitBranch, GitMerge, GripVertical } from 'lucide-react'
import { CATEGORIES, getRuntimeShort, RUNTIME_TYPES } from '../../../lib/constants'
import { WORKFLOW_NODE_TYPES } from '../../../lib/workflowSchema'
import { setDragPayload } from '../../../lib/workflowDrag'
import { isPrebuiltWorkflow } from '../../../data/prebuiltWorkflows'

const handleClass =
  '!w-3 !h-3 !border-2 !border-cx-panel !bg-cx-accent hover:!bg-cx-accent2 hover:!scale-125 transition-transform'

function AgentWorkflowNode({ data, selected }) {
  const cat = CATEGORIES[data.category]
  const rt = RUNTIME_TYPES[data.runtimeType]
  const executing = data.executing

  return (
    <div
      className={`min-w-[190px] max-w-[230px] rounded-xl border backdrop-blur-xl transition-all ${
        selected ? 'ring-2 ring-cx-accent/60 shadow-[0_0_20px_rgba(94,200,242,0.2)]' : ''
      } ${executing ? 'animate-pulse' : ''}`}
      style={{
        borderColor: executing ? '#5ec8f2' : `${cat?.color ?? '#5ec8f2'}70`,
        backgroundColor: `${cat?.color ?? '#5ec8f2'}14`,
        boxShadow: executing ? '0 0 24px rgba(94,200,242,0.35)' : undefined,
      }}
    >
      <Handle type="target" position={Position.Left} id="in" className={handleClass} />
      <Handle type="target" position={Position.Top} id="in-top" className={handleClass} />
      <div className="p-3">
        <div className="flex items-center gap-2 mb-2">
          <Bot className="w-4 h-4 text-cx-accent shrink-0" />
          {rt && (
            <span
              className="text-[9px] uppercase font-mono px-1 py-0.5 rounded"
              style={{ backgroundColor: `${rt.color}25`, color: rt.color }}
            >
              {getRuntimeShort(data.runtimeType)}
            </span>
          )}
        </div>
        <p className="text-xs font-semibold text-cx-fg leading-tight">{data.label}</p>
        {data.task && <p className="text-[10px] text-cx-fg-dim mt-1 line-clamp-2">{data.task}</p>}
        <p className="text-[10px] text-cx-fg-dim mt-1">{data.skillsCount ?? 0} skills</p>
      </div>
      <Handle type="source" position={Position.Right} id="out" className={handleClass} />
      <Handle type="source" position={Position.Bottom} id="out-bottom" className={handleClass} />
    </div>
  )
}

function GateNode({ data, selected, icon: Icon, color }) {
  return (
    <div
      className={`min-w-[150px] rounded-xl border backdrop-blur-xl p-3 ${
        selected ? 'ring-2 ring-cx-accent/60' : ''
      }`}
      style={{ borderColor: `${color}70`, backgroundColor: `${color}14` }}
    >
      <Handle type="target" position={Position.Left} id="in" className={handleClass} />
      <div className="flex items-center gap-2">
        <Icon className="w-4 h-4 shrink-0" style={{ color }} />
        <p className="text-xs font-medium text-cx-fg">{data.label}</p>
      </div>
      {data.approverRole && (
        <p className="text-[10px] text-cx-fg-dim mt-1 truncate">{data.approverRole}</p>
      )}
      <Handle type="source" position={Position.Right} id="out" className={handleClass} />
    </div>
  )
}

function ComponentNode({ data, selected, icon: Icon, color, sourceOnly, targetOnly }) {
  return (
    <div
      className={`min-w-[120px] rounded-xl border backdrop-blur-xl p-3 text-center ${
        selected ? 'ring-2 ring-cx-accent/60' : ''
      }`}
      style={{ borderColor: `${color}70`, backgroundColor: `${color}14` }}
    >
      {!sourceOnly && <Handle type="target" position={Position.Left} id="in" className={handleClass} />}
      {!sourceOnly && <Handle type="target" position={Position.Top} id="in-top" className={handleClass} />}
      <Icon className="w-4 h-4 mx-auto mb-1" style={{ color }} />
      <p className="text-xs font-medium text-cx-fg">{data.label}</p>
      {!targetOnly && <Handle type="source" position={Position.Right} id="out" className={handleClass} />}
      {!targetOnly && <Handle type="source" position={Position.Bottom} id="out-bottom" className={handleClass} />}
    </div>
  )
}

function HumanApprovalNode(props) {
  return <GateNode {...props} icon={UserCheck} color={WORKFLOW_NODE_TYPES.human_approval.color} />
}

function PolicyGateNode(props) {
  return <GateNode {...props} icon={Shield} color={WORKFLOW_NODE_TYPES.policy_gate.color} />
}

function WorkflowStartNode(props) {
  return (
    <ComponentNode
      {...props}
      icon={Play}
      color={WORKFLOW_NODE_TYPES.workflow_start.color}
      sourceOnly
    />
  )
}

function WorkflowEndNode(props) {
  return (
    <ComponentNode
      {...props}
      icon={Square}
      color={WORKFLOW_NODE_TYPES.workflow_end.color}
      targetOnly
    />
  )
}

function ParallelForkNode(props) {
  return <ComponentNode {...props} icon={GitBranch} color={WORKFLOW_NODE_TYPES.parallel_fork.color} />
}

function ParallelJoinNode(props) {
  return <ComponentNode {...props} icon={GitMerge} color={WORKFLOW_NODE_TYPES.parallel_join.color} />
}

export const agentWorkflowNodeTypes = {
  agent: memo(AgentWorkflowNode),
  human_approval: memo(HumanApprovalNode),
  policy_gate: memo(PolicyGateNode),
  workflow_start: memo(WorkflowStartNode),
  workflow_end: memo(WorkflowEndNode),
  parallel_fork: memo(ParallelForkNode),
  parallel_join: memo(ParallelJoinNode),
}

function DraggableShell({ children, onDragStart, onDoubleClick, className = '' }) {
  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDoubleClick={onDoubleClick}
      className={`flex items-start gap-2 p-2.5 rounded-xl border border-cx-border bg-cx-raised/40 cursor-grab active:cursor-grabbing hover:border-cx-accent/50 hover:bg-cx-accent/5 transition-all select-none ${className}`}
    >
      <GripVertical className="w-3.5 h-3.5 text-cx-fg-dim shrink-0 mt-0.5" />
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  )
}

export function DraggableAgentCard({ agent, onDragStart, onDoubleClick }) {
  const cat = CATEGORIES[agent.category]
  const handleDrag = (e) => {
    e.stopPropagation()
    onDragStart?.(e, agent)
  }
  return (
    <DraggableShell onDragStart={handleDrag} onDoubleClick={() => onDoubleClick?.(agent)}>
      <p className="text-xs font-medium text-cx-fg truncate">{agent.name}</p>
      <p className="text-[10px] text-cx-fg-dim truncate">{agent.project}</p>
      <span
        className="inline-block mt-1 text-[9px] uppercase px-1.5 py-0.5 rounded"
        style={{ backgroundColor: `${cat.color}20`, color: cat.color }}
      >
        {cat.short}
      </span>
    </DraggableShell>
  )
}

export function DraggableGateCard({ type, label, color, onDragStart, onDoubleClick }) {
  const handleDrag = (e) => {
    e.stopPropagation()
    onDragStart?.(e, type, label)
  }
  return (
    <DraggableShell onDragStart={handleDrag} onDoubleClick={() => onDoubleClick?.(type, label)} className="text-center">
      <p className="text-[10px] font-medium" style={{ color }}>
        {label}
      </p>
    </DraggableShell>
  )
}

export function DraggableComponentCard({ type, label, description, color, onDragStart, onDoubleClick }) {
  const handleDrag = (e) => {
    e.stopPropagation()
    setDragPayload(e, { kind: 'component', type, label })
    onDragStart?.(e, type, label)
  }
  return (
    <DraggableShell onDragStart={handleDrag} onDoubleClick={() => onDoubleClick?.(type, label)}>
      <p className="text-[10px] font-medium" style={{ color }}>
        {label}
      </p>
      {description && <p className="text-[9px] text-cx-fg-dim mt-0.5">{description}</p>}
    </DraggableShell>
  )
}

export function DraggableWorkflowTemplate({ workflow, onDragStart, onDoubleClick }) {
  const cat = CATEGORIES[workflow.category]
  const agentCount = workflow.nodes.filter((n) => n.type === 'agent').length
  const prebuilt = isPrebuiltWorkflow(workflow)
  const handleDrag = (e) => {
    e.stopPropagation()
    setDragPayload(e, { kind: 'workflow_template', workflowId: workflow.id })
    onDragStart?.(e, workflow)
  }
  return (
    <DraggableShell onDragStart={handleDrag} onDoubleClick={() => onDoubleClick?.(workflow)}>
      <p className="text-xs font-medium text-cx-fg truncate">{workflow.name}</p>
      <p className="text-[10px] text-cx-fg-dim">
        {agentCount} agents · {workflow.edges.length} dotted links
      </p>
      <div className="flex flex-wrap gap-1 mt-1">
        <span
          className="inline-block text-[9px] uppercase px-1.5 py-0.5 rounded"
          style={{ backgroundColor: `${cat?.color ?? '#5ec8f2'}20`, color: cat?.color ?? '#5ec8f2' }}
        >
          {cat?.short ?? workflow.category}
        </span>
        {prebuilt && (
          <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-cx-success/10 text-cx-success">
            Pre-built
          </span>
        )}
      </div>
    </DraggableShell>
  )
}
