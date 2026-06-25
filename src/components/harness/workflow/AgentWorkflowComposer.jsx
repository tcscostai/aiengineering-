import { useCallback, useRef, useState, useMemo, useEffect } from 'react'
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  addEdge,
  useNodesState,
  useEdgesState,
  ReactFlowProvider,
  useReactFlow,
  ConnectionMode,
  ConnectionLineType,
} from 'reactflow'
import { Save, Download, Upload, Play, Loader2, CheckCircle, Trash2, Link2, Copy } from 'lucide-react'
import { GlassPanel } from '../../ui/GlassPanel'
import { ProgressBar } from '../../ui/ProgressBar'
import { HarnessRunLog } from '../HarnessRunLog'
import { agentWorkflowNodeTypes } from './AgentWorkflowNodes'
import { WorkflowPalette } from './WorkflowPalette'
import { useApp } from '../../../context/AppContext'
import { useAgentWorkflows } from '../../../hooks/useAgentWorkflows'
import { CATEGORIES, getRuntimeShort } from '../../../lib/constants'
import { createEmptyWorkflow } from '../../../lib/workflowSchema'
import { generateId } from '../../../lib/storage'
import { getDragPayload, cloneWorkflowFragment } from '../../../lib/workflowDrag'
import {
  defaultWorkflowEdgeOptions,
  workflowConnectionLineStyle,
  withWorkflowEdgeDefaults,
} from '../../../lib/workflowEdgeStyles'
import { isPrebuiltWorkflow } from '../../../data/prebuiltWorkflows'
import { agentEligibleForHarness } from '../../../lib/harnessConstants'

const inputClass =
  'w-full px-3 py-2 rounded-xl border border-cx-border bg-cx-panel/50 text-sm text-cx-fg placeholder:text-cx-fg-dim focus:outline-none focus:border-cx-accent/40'

const defaultEdgeOptions = defaultWorkflowEdgeOptions

function workflowToFlow(workflow) {
  const nodes = workflow.nodes.map((n) => ({
    id: n.id,
    type: n.type,
    position: n.position ?? { x: 0, y: 0 },
    data: {
      label: n.label,
      agentId: n.agentId,
      task: n.task,
      category: n.category,
      runtimeType: n.runtimeType,
      skillsCount: n.skillsCount,
      approverRole: n.approverRole,
    },
  }))
  const edges = workflow.edges.map((e) =>
    withWorkflowEdgeDefaults({
      id: e.id,
      source: e.source,
      target: e.target,
      sourceHandle: e.sourceHandle,
      targetHandle: e.targetHandle,
      label: e.handoff && e.handoff !== 'default_output' ? e.handoff : undefined,
    })
  )
  return { nodes, edges }
}

function flowToWorkflow(workflowMeta, nodes, edges) {
  return {
    ...workflowMeta,
    nodes: nodes.map((n) => ({
      id: n.id,
      type: n.type,
      agentId: n.data.agentId,
      label: n.data.label,
      task: n.data.task,
      category: n.data.category,
      runtimeType: n.data.runtimeType,
      skillsCount: n.data.skillsCount,
      approverRole: n.data.approverRole,
      position: n.position,
    })),
    edges: edges.map((e) => ({
      id: e.id,
      source: e.source,
      target: e.target,
      sourceHandle: e.sourceHandle,
      targetHandle: e.targetHandle,
      handoff: e.label ?? 'default_output',
    })),
  }
}

function buildNodeFromPayload(payload, agents, position) {
  const id = generateId('node')

  if (payload.kind === 'agent') {
    const agent = agents.find((a) => a.id === payload.agentId)
    if (!agent) return null
    return {
      id,
      type: 'agent',
      position,
      data: {
        label: agent.name,
        agentId: agent.id,
        task: '',
        category: agent.category,
        runtimeType: agent.runtimeType,
        skillsCount: agent.skills.length,
      },
    }
  }

  if (payload.kind === 'gate' || payload.kind === 'component') {
    return {
      id,
      type: payload.type,
      position,
      data: {
        label: payload.label,
        approverRole:
          payload.type === 'human_approval'
            ? 'Compliance Lead'
            : payload.type === 'policy_gate'
              ? 'Governance Board'
              : undefined,
      },
    }
  }

  return null
}

function ComposerCanvas({ workflowMeta, setWorkflowMeta, category, onWorkflowChange, metaDirtyRef }) {
  const { agents, addNotification } = useApp()
  const { workflows, saveWorkflow, exportJSON, importJSON, validate, executeWorkflow, activeRun } =
    useAgentWorkflows()
  const reactFlowWrapper = useRef(null)
  const { screenToFlowPosition, fitView } = useReactFlow()

  const [nodes, setNodes, onNodesChange] = useNodesState([])
  const [edges, setEdges, onEdgesChange] = useEdgesState([])
  const [selectedNode, setSelectedNode] = useState(null)
  const [selectedEdge, setSelectedEdge] = useState(null)
  const [validation, setValidation] = useState(null)
  const [executing, setExecuting] = useState(false)
  const [task, setTask] = useState('')
  const [paletteFilter, setPaletteFilter] = useState('all')
  const [isDragOver, setIsDragOver] = useState(false)
  const fileInputRef = useRef(null)
  const loadedIdRef = useRef(null)

  useEffect(() => {
    if (loadedIdRef.current === workflowMeta.id) return
    loadedIdRef.current = workflowMeta.id
    const flow = workflowToFlow(workflowMeta)
    setNodes(flow.nodes)
    setEdges(flow.edges)
    setSelectedNode(null)
    setSelectedEdge(null)
    requestAnimationFrame(() => fitView({ padding: 0.2, duration: 300 }))
  }, [workflowMeta.id, setNodes, setEdges, fitView])

  useEffect(() => {
    const wf = flowToWorkflow(workflowMeta, nodes, edges)
    onWorkflowChange?.(wf)
  }, [nodes, edges])

  const getDropPosition = useCallback(
    (clientX, clientY) => screenToFlowPosition({ x: clientX, y: clientY }),
    [screenToFlowPosition]
  )

  const getCenterPosition = useCallback(() => {
    const bounds = reactFlowWrapper.current?.getBoundingClientRect()
    if (!bounds) return { x: 120, y: 120 }
    return getDropPosition(bounds.left + bounds.width / 2, bounds.top + bounds.height / 2)
  }, [getDropPosition])

  const appendNode = useCallback(
    (node) => {
      if (!node) return
      setNodes((nds) => nds.concat(node))
      requestAnimationFrame(() => fitView({ padding: 0.15, duration: 250 }))
    },
    [setNodes, fitView]
  )

  const addFromPayload = useCallback(
    (payload, position) => {
      if (payload.kind === 'workflow_template') {
        const template = workflows.find((w) => w.id === payload.workflowId)
        if (!template?.nodes?.length) {
          addNotification('Workflow template is empty', 'warn')
          return
        }
        const fragment = cloneWorkflowFragment(template, position, generateId)
        setNodes((nds) => [...nds, ...fragment.nodes])
        setEdges((eds) => [...eds, ...fragment.edges.map((e) => withWorkflowEdgeDefaults(e))])
        addNotification(`Merged "${template.name}" onto canvas`, 'success')
        requestAnimationFrame(() => fitView({ padding: 0.12, duration: 300 }))
        return
      }

      const node = buildNodeFromPayload(payload, agents, position)
      if (node) appendNode(node)
    },
    [agents, workflows, appendNode, setNodes, setEdges, addNotification, fitView]
  )

  const onConnect = useCallback(
    (params) =>
      setEdges((eds) =>
        addEdge(
          {
            ...params,
            ...defaultEdgeOptions,
          },
          eds
        )
      ),
    [setEdges]
  )

  const isValidConnection = useCallback(
    (connection) => {
      if (connection.source === connection.target) return false
      const exists = edges.some(
        (e) =>
          e.source === connection.source &&
          e.target === connection.target &&
          e.sourceHandle === connection.sourceHandle &&
          e.targetHandle === connection.targetHandle
      )
      return !exists
    },
    [edges]
  )

  const onDragOver = useCallback((e) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setIsDragOver(true)
  }, [])

  const onDragLeave = useCallback((e) => {
    if (!reactFlowWrapper.current?.contains(e.relatedTarget)) {
      setIsDragOver(false)
    }
  }, [])

  const onDrop = useCallback(
    (e) => {
      e.preventDefault()
      setIsDragOver(false)
      const payload = getDragPayload(e)
      if (!payload) return
      const position = getDropPosition(e.clientX, e.clientY)
      addFromPayload(payload, position)
    },
    [getDropPosition, addFromPayload]
  )

  const getCurrentWorkflow = () => flowToWorkflow(workflowMeta, nodes, edges)

  const handleSave = () => {
    const wf = getCurrentWorkflow()
    const payload = {
      ...wf,
      metadata: {
        ...wf.metadata,
        ...(isPrebuiltWorkflow(wf) ? { userModified: true } : {}),
      },
    }
    const saved = saveWorkflow(payload)
    if (metaDirtyRef) metaDirtyRef.current = false
    setWorkflowMeta(saved)
    addNotification(`Workflow "${saved.name}" saved`, 'success')
  }

  const handleSaveCopy = () => {
    const wf = getCurrentWorkflow()
    const copy = {
      ...wf,
      id: generateId('wf'),
      name: `${wf.name.replace(/ \(copy\)$/i, '')} (copy)`,
      metadata: {
        ...wf.metadata,
        prebuilt: false,
        certified: false,
        reuseCount: 0,
        userModified: false,
      },
    }
    const saved = saveWorkflow(copy)
    if (metaDirtyRef) metaDirtyRef.current = false
    loadedIdRef.current = saved.id
    setWorkflowMeta(saved)
    addNotification(`Saved custom copy — "${saved.name}"`, 'success')
  }

  const handleExport = () => {
    const wf = getCurrentWorkflow()
    if (wf.id) saveWorkflow(wf)
    exportJSON(wf)
    addNotification('Workflow JSON downloaded', 'success')
  }

  const handleImport = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const json = JSON.parse(reader.result)
        const { workflow, resolutions } = importJSON(json, agents)
        setWorkflowMeta(workflow)
        loadedIdRef.current = null
        const flow = workflowToFlow(workflow)
        setNodes(flow.nodes)
        setEdges(flow.edges)
        const missing = resolutions.filter((r) => r.status === 'missing').length
        addNotification(
          missing ? `Imported with ${missing} unresolved agent(s)` : 'Workflow imported successfully',
          missing ? 'warn' : 'success'
        )
      } catch (err) {
        addNotification(err.message || 'Invalid workflow JSON', 'warn')
      }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  const handleValidate = () => {
    const result = validate(getCurrentWorkflow(), agents)
    setValidation(result)
    addNotification(
      result.valid ? 'Workflow validated' : `${result.errors.length} validation error(s)`,
      result.valid ? 'success' : 'warn'
    )
  }

  const handleRun = async () => {
    const wf = getCurrentWorkflow()
    const saved = saveWorkflow(wf)
    setWorkflowMeta(saved)
    setExecuting(true)
    addNotification(`Running workflow "${saved.name}"`, 'info')
    try {
      await executeWorkflow(saved, task, null)
      addNotification('Workflow execution finished', 'success')
    } finally {
      setExecuting(false)
    }
  }

  const handleDeleteSelected = () => {
    if (selectedNode) {
      setNodes((nds) => nds.filter((n) => n.id !== selectedNode.id))
      setEdges((eds) => eds.filter((e) => e.source !== selectedNode.id && e.target !== selectedNode.id))
      setSelectedNode(null)
      return
    }
    if (selectedEdge) {
      setEdges((eds) => eds.filter((e) => e.id !== selectedEdge.id))
      setSelectedEdge(null)
    }
  }

  const updateSelectedNode = (patch) => {
    if (!selectedNode) return
    setNodes((nds) =>
      nds.map((n) => (n.id === selectedNode.id ? { ...n, data: { ...n.data, ...patch } } : n))
    )
    setSelectedNode((n) => ({ ...n, data: { ...n.data, ...patch } }))
  }

  const updateSelectedEdge = (label) => {
    if (!selectedEdge) return
    setEdges((eds) =>
      eds.map((e) => (e.id === selectedEdge.id ? { ...e, label: label || undefined } : e))
    )
    setSelectedEdge((e) => ({ ...e, label: label || undefined }))
  }

  const otherWorkflows = useMemo(
    () => workflows.filter((w) => w.id !== workflowMeta.id),
    [workflows, workflowMeta.id]
  )

  const eligibleAgents = useMemo(
    () => agents.filter(agentEligibleForHarness),
    [agents]
  )

  const editingPrebuilt = isPrebuiltWorkflow(workflowMeta)

  return (
    <div className="grid lg:grid-cols-[240px_1fr_270px] gap-4">
      <GlassPanel className="p-3 h-fit lg:max-h-[720px] flex flex-col">
        <p className="text-2xs uppercase text-cx-fg-dim tracking-widest mb-2">Workflow Palette</p>
        <WorkflowPalette
          agents={agents}
          workflows={otherWorkflows.length ? otherWorkflows : workflows}
          categoryFilter={paletteFilter}
          onCategoryFilterChange={setPaletteFilter}
          onAddAgent={(agent) =>
            addFromPayload({ kind: 'agent', agentId: agent.id }, getCenterPosition())
          }
          onAddGate={(type, label) =>
            addFromPayload({ kind: 'gate', type, label }, getCenterPosition())
          }
          onAddComponent={(type, label) =>
            addFromPayload({ kind: 'component', type, label }, getCenterPosition())
          }
          onAddWorkflowTemplate={(wf) =>
            addFromPayload({ kind: 'workflow_template', workflowId: wf.id }, getCenterPosition())
          }
        />
      </GlassPanel>

      <div className="space-y-3">
        <GlassPanel className="p-3">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <input
              className={`${inputClass} flex-1 min-w-[160px]`}
              value={workflowMeta.name}
              onChange={(e) => {
                if (metaDirtyRef) metaDirtyRef.current = true
                setWorkflowMeta({ ...workflowMeta, name: e.target.value })
              }}
              onBlur={() => {
                if (metaDirtyRef?.current && workflowMeta.name?.trim()) handleSave()
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  if (workflowMeta.name?.trim()) handleSave()
                }
              }}
              placeholder="Workflow name"
            />
            <button
              type="button"
              onClick={handleSave}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-cx-border text-xs text-cx-fg hover:border-cx-accent/30"
            >
              <Save className="w-3.5 h-3.5" /> Save
            </button>
            {editingPrebuilt && (
              <button
                type="button"
                onClick={handleSaveCopy}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-cx-accent2/40 bg-cx-accent2/10 text-xs text-cx-accent2 hover:bg-cx-accent2/20"
                title="Save your changes as a new custom workflow"
              >
                <Copy className="w-3.5 h-3.5" /> Save Copy
              </button>
            )}
            <button
              type="button"
              onClick={handleExport}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-cx-accent/30 text-xs text-cx-accent hover:bg-cx-accent/10"
            >
              <Download className="w-3.5 h-3.5" /> Export JSON
            </button>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-cx-border text-xs text-cx-fg-dim hover:text-cx-fg"
            >
              <Upload className="w-3.5 h-3.5" /> Import
            </button>
            <input ref={fileInputRef} type="file" accept=".json,application/json" className="hidden" onChange={handleImport} />
            <button
              type="button"
              onClick={handleValidate}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-cx-border text-xs text-cx-fg-dim"
            >
              <CheckCircle className="w-3.5 h-3.5" /> Validate
            </button>
            <button
              type="button"
              onClick={handleRun}
              disabled={executing || nodes.length === 0}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-cx-success/40 bg-cx-success/10 text-xs text-cx-success hover:bg-cx-success/20 disabled:opacity-50 ml-auto"
            >
              {executing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
              Run Workflow
            </button>
          </div>
          <input
            className={inputClass}
            value={task}
            onChange={(e) => setTask(e.target.value)}
            placeholder="Workflow invocation context…"
          />
          {validation && (
            <div
              className={`mt-2 p-2 rounded-lg text-xs ${validation.valid ? 'bg-cx-success/10 text-cx-success' : 'bg-cx-warn/10 text-cx-warn'}`}
            >
              {validation.valid ? 'Workflow valid' : validation.errors.join(' · ')}
              {validation.warnings?.length > 0 && (
                <span className="block text-cx-fg-dim mt-1">{validation.warnings.join(' · ')}</span>
              )}
            </div>
          )}
        </GlassPanel>

        <GlassPanel hero className="p-0 overflow-hidden relative">
          <div
            ref={reactFlowWrapper}
            className={`h-[520px] w-full transition-colors ${isDragOver ? 'bg-cx-accent/5' : ''}`}
            onDragLeave={onDragLeave}
          >
            {isDragOver && (
              <div className="absolute inset-0 z-10 pointer-events-none border-2 border-dashed border-cx-accent/50 rounded-xl m-2 flex items-center justify-center">
                <p className="text-sm text-cx-accent bg-cx-panel/90 px-4 py-2 rounded-xl border border-cx-accent/30">
                  Drop to add to canvas
                </p>
              </div>
            )}
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              onDrop={onDrop}
              onDragOver={onDragOver}
              nodeTypes={agentWorkflowNodeTypes}
              onNodeClick={(_, node) => {
                setSelectedNode(node)
                setSelectedEdge(null)
              }}
              onEdgeClick={(_, edge) => {
                setSelectedEdge(edge)
                setSelectedNode(null)
              }}
              onPaneClick={() => {
                setSelectedNode(null)
                setSelectedEdge(null)
              }}
              isValidConnection={isValidConnection}
              connectionMode={ConnectionMode.Loose}
              connectionLineType={ConnectionLineType.SmoothStep}
              connectionLineStyle={workflowConnectionLineStyle}
              defaultEdgeOptions={defaultEdgeOptions}
              snapToGrid
              snapGrid={[20, 20]}
              fitView
              proOptions={{ hideAttribution: true }}
              deleteKeyCode={['Backspace', 'Delete']}
              nodesConnectable
              nodesDraggable
              elementsSelectable
              panOnDrag
              selectionOnDrag={false}
            >
              <Background color="rgba(148,163,184,0.06)" gap={20} />
              <Controls className="!bg-cx-panel !border-cx-border !shadow-none" />
              <MiniMap
                nodeColor={(n) => CATEGORIES[n.data?.category]?.color ?? '#5ec8f2'}
                maskColor="rgba(4,5,8,0.75)"
                className="!bg-cx-panel !border-cx-border"
              />
            </ReactFlow>
          </div>
          <p className="text-[10px] text-cx-fg-dim px-4 py-2 border-t border-cx-border">
            Drag agents & templates · connect handles (dotted lines) · swap agents in Inspector · Delete to remove
          </p>
        </GlassPanel>

        {activeRun && (
          <GlassPanel className="p-4">
            <p className="text-2xs uppercase text-cx-fg-dim mb-2">Workflow Run · {activeRun.status}</p>
            <ProgressBar
              value={
                activeRun.steps?.length
                  ? (activeRun.steps.filter((s) => s.status === 'completed').length / activeRun.steps.length) * 100
                  : 0
              }
            />
            <HarnessRunLog logs={activeRun.logs} maxHeight={120} />
          </GlassPanel>
        )}
      </div>

      <GlassPanel className="p-4 h-fit lg:sticky lg:top-6">
        <p className="text-2xs uppercase text-cx-fg-dim tracking-widest mb-3">Inspector</p>

        {selectedEdge && !selectedNode && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-cx-accent">
              <Link2 className="w-4 h-4" />
              <p className="text-sm font-medium text-cx-fg">Connection</p>
            </div>
            <p className="text-[10px] text-cx-fg-dim">
              {selectedEdge.source} → {selectedEdge.target}
            </p>
            <div>
              <label className="text-2xs uppercase text-cx-fg-dim">Handoff Label</label>
              <input
                className={`${inputClass} mt-1 text-xs`}
                value={selectedEdge.label ?? ''}
                onChange={(e) => updateSelectedEdge(e.target.value)}
                placeholder="e.g. api_contract, rca_report"
              />
            </div>
            <button
              type="button"
              onClick={handleDeleteSelected}
              className="flex items-center gap-2 w-full px-3 py-2 rounded-xl border border-cx-danger/30 text-xs text-cx-danger hover:bg-cx-danger/10"
            >
              <Trash2 className="w-3.5 h-3.5" /> Remove Connection
            </button>
          </div>
        )}

        {selectedNode && !selectedEdge && (
          <div className="space-y-3">
            <p className="text-sm font-medium text-cx-fg">{selectedNode.data.label}</p>
            <p className="text-[10px] uppercase text-cx-fg-dim">{selectedNode.type.replace(/_/g, ' ')}</p>
            {selectedNode.type === 'agent' && (
              <>
                <div>
                  <label className="text-2xs uppercase text-cx-fg-dim">Assigned Agent</label>
                  <select
                    className={`${inputClass} mt-1 text-xs`}
                    value={selectedNode.data.agentId ?? ''}
                    onChange={(e) => {
                      const agent = eligibleAgents.find((a) => a.id === e.target.value)
                      if (!agent) return
                      updateSelectedNode({
                        agentId: agent.id,
                        label: agent.name,
                        category: agent.category,
                        runtimeType: agent.runtimeType,
                        skillsCount: agent.skills.length,
                      })
                    }}
                  >
                    <option value="">Select agent…</option>
                    {eligibleAgents.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name} ({CATEGORIES[a.category]?.short})
                      </option>
                    ))}
                  </select>
                  <p className="text-[9px] text-cx-fg-dim mt-1">
                    Swap in any onboarded agent — including agents added after the template was created.
                  </p>
                </div>
                <div>
                  <label className="text-2xs uppercase text-cx-fg-dim">Step Task</label>
                  <textarea
                    className={`${inputClass} mt-1 min-h-[72px] text-xs`}
                    value={selectedNode.data.task ?? ''}
                    onChange={(e) => updateSelectedNode({ task: e.target.value })}
                    placeholder="Task for this agent step…"
                  />
                </div>
                {selectedNode.data.runtimeType && (
                  <p className="text-xs text-cx-fg-dim">
                    Runtime: {getRuntimeShort(selectedNode.data.runtimeType)}
                  </p>
                )}
              </>
            )}
            {(selectedNode.type === 'human_approval' || selectedNode.type === 'policy_gate') && (
              <div>
                <label className="text-2xs uppercase text-cx-fg-dim">Approver / Policy Owner</label>
                <input
                  className={`${inputClass} mt-1 text-xs`}
                  value={selectedNode.data.approverRole ?? ''}
                  onChange={(e) => updateSelectedNode({ approverRole: e.target.value })}
                />
              </div>
            )}
            <button
              type="button"
              onClick={handleDeleteSelected}
              className="flex items-center gap-2 w-full px-3 py-2 rounded-xl border border-cx-danger/30 text-xs text-cx-danger hover:bg-cx-danger/10"
            >
              <Trash2 className="w-3.5 h-3.5" /> Remove Node
            </button>
          </div>
        )}

        {!selectedNode && !selectedEdge && (
          <p className="text-xs text-cx-fg-dim leading-relaxed">
            Select a node or connection to configure tasks, approvers, and handoff labels. Drag agents,
            gates, and library workflows from the left palette onto the canvas, then connect the handles.
          </p>
        )}
      </GlassPanel>
    </div>
  )
}

export function AgentWorkflowComposer({ category, workflowId, onWorkflowSaved }) {
  const { workflows } = useAgentWorkflows()
  const existing = workflowId ? workflows.find((w) => w.id === workflowId) : null
  const [workflowMeta, setWorkflowMeta] = useState(
    existing ?? { ...createEmptyWorkflow(category), id: generateId('wf') }
  )
  const metaDirtyRef = useRef(false)
  const lastSyncedIdRef = useRef(workflowId)

  useEffect(() => {
    if (!workflowId) return
    const wf = workflows.find((w) => w.id === workflowId)
    if (!wf) return

    // Load when switching workflows, or when workflows first hydrate — never clobber in-progress renames
    if (workflowId !== lastSyncedIdRef.current) {
      lastSyncedIdRef.current = workflowId
      metaDirtyRef.current = false
      setWorkflowMeta(wf)
      return
    }

    if (metaDirtyRef.current) return

    setWorkflowMeta((prev) => (prev.id === workflowId ? wf : prev))
  }, [workflowId, workflows])

  useEffect(() => {
    if (!workflowId) {
      lastSyncedIdRef.current = null
      setWorkflowMeta((w) => ({ ...w, category }))
    }
  }, [category, workflowId])

  return (
    <ReactFlowProvider>
      <ComposerCanvas
        workflowMeta={workflowMeta}
        metaDirtyRef={metaDirtyRef}
        setWorkflowMeta={(w) => {
          setWorkflowMeta(w)
          if (w.id !== workflowId) lastSyncedIdRef.current = w.id
          onWorkflowSaved?.(w)
        }}
        category={category}
      />
    </ReactFlowProvider>
  )
}
