import { useState } from 'react'
import { Bot, Shield, Layers, Library, HeartPulse } from 'lucide-react'
import {
  DraggableAgentCard,
  DraggableGateCard,
  DraggableComponentCard,
  DraggableWorkflowTemplate,
} from './AgentWorkflowNodes'
import { CATEGORIES } from '../../../lib/constants'
import { WORKFLOW_NODE_TYPES, WORKFLOW_COMPONENTS } from '../../../lib/workflowSchema'
import { setDragPayload } from '../../../lib/workflowDrag'
import { agentEligibleForHarness } from '../../../lib/harnessConstants'
import { isPrebuiltWorkflow } from '../../../data/prebuiltWorkflows'

const PALETTE_TABS = [
  { id: 'agents', label: 'Agents', icon: Bot },
  { id: 'gates', label: 'Gates & Flow', icon: Shield },
  { id: 'library', label: 'Library', icon: Library },
]

export function WorkflowPalette({
  agents,
  workflows,
  categoryFilter,
  onCategoryFilterChange,
  onAddAgent,
  onAddGate,
  onAddComponent,
  onAddWorkflowTemplate,
}) {
  const [tab, setTab] = useState('agents')
  const [libraryFilter, setLibraryFilter] = useState('healthcare')

  const eligibleAgents = agents.filter(agentEligibleForHarness)
  const grouped = {
    ad: eligibleAgents.filter((a) => a.category === 'ad'),
    ams: eligibleAgents.filter((a) => a.category === 'ams'),
    qe: eligibleAgents.filter((a) => a.category === 'qe'),
  }

  const onDragStartAgent = (e, agent) => {
    setDragPayload(e, { kind: 'agent', agentId: agent.id })
  }

  const onDragStartGate = (e, type, label) => {
    setDragPayload(e, { kind: 'gate', type, label })
  }

  const onDragStartTemplate = (e, workflow) => {
    setDragPayload(e, { kind: 'workflow_template', workflowId: workflow.id })
  }

  const showCategory = (cat) => categoryFilter === 'all' || categoryFilter === cat

  const libraryWorkflows = workflows.filter((wf) => {
    if (libraryFilter === 'all') return true
    if (libraryFilter === 'healthcare') return wf.metadata?.tags?.includes('healthcare') || isPrebuiltWorkflow(wf)
    return wf.category === libraryFilter
  })

  return (
    <div className="flex flex-col h-full max-h-[680px]">
      <div className="flex gap-1 p-1 rounded-lg border border-cx-border bg-cx-void/40 mb-3">
        {PALETTE_TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`flex-1 flex items-center justify-center gap-1 py-1.5 rounded-md text-[10px] uppercase tracking-wide transition-colors ${
              tab === t.id
                ? 'bg-cx-accent/15 text-cx-accent'
                : 'text-cx-fg-dim hover:text-cx-fg-muted'
            }`}
          >
            <t.icon className="w-3 h-3" />
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'agents' && (
        <>
          <div className="flex flex-wrap gap-1 mb-3">
            {['all', 'ad', 'ams', 'qe'].map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => onCategoryFilterChange(f)}
                className={`px-2 py-0.5 rounded text-[10px] uppercase ${
                  categoryFilter === f
                    ? 'bg-cx-accent/15 text-cx-accent border border-cx-accent/30'
                    : 'text-cx-fg-dim border border-transparent'
                }`}
              >
                {f === 'all' ? 'All' : CATEGORIES[f].short}
              </button>
            ))}
          </div>
          <p className="text-[10px] text-cx-fg-dim mb-2">Drag or double-click to add to canvas</p>
          <div className="space-y-3 overflow-y-auto flex-1 pr-1">
            {eligibleAgents.length === 0 ? (
              <p className="text-[10px] text-cx-fg-dim">Onboard and verify agents in Agent Onboarding Studio.</p>
            ) : (
              Object.entries(grouped).map(([cat, list]) =>
                list.length > 0 && showCategory(cat) ? (
                  <div key={cat}>
                    <p
                      className="text-[10px] uppercase tracking-widest mb-1.5 sticky top-0 bg-cx-panel/95 py-1"
                      style={{ color: CATEGORIES[cat].color }}
                    >
                      {CATEGORIES[cat].label}
                    </p>
                    <div className="space-y-2">
                      {list.map((a) => (
                        <DraggableAgentCard
                          key={a.id}
                          agent={a}
                          onDragStart={onDragStartAgent}
                          onDoubleClick={onAddAgent}
                        />
                      ))}
                    </div>
                  </div>
                ) : null
              )
            )}
          </div>
        </>
      )}

      {tab === 'gates' && (
        <div className="space-y-4 overflow-y-auto flex-1 pr-1">
          <div>
            <p className="text-[10px] uppercase text-cx-fg-dim tracking-widest mb-2 flex items-center gap-1">
              <Shield className="w-3 h-3" /> Policy Gates
            </p>
            <div className="grid grid-cols-1 gap-2">
              <DraggableGateCard
                type="human_approval"
                label="Human Approval"
                color={WORKFLOW_NODE_TYPES.human_approval.color}
                onDragStart={onDragStartGate}
                onDoubleClick={onAddGate}
              />
              <DraggableGateCard
                type="policy_gate"
                label="Policy Gate"
                color={WORKFLOW_NODE_TYPES.policy_gate.color}
                onDragStart={onDragStartGate}
                onDoubleClick={onAddGate}
              />
            </div>
          </div>
          <div>
            <p className="text-[10px] uppercase text-cx-fg-dim tracking-widest mb-2 flex items-center gap-1">
              <Layers className="w-3 h-3" /> Flow Components
            </p>
            <div className="grid grid-cols-1 gap-2">
              {WORKFLOW_COMPONENTS.map((c) => (
                <DraggableComponentCard
                  key={c.type}
                  type={c.type}
                  label={c.label}
                  description={c.description}
                  color={WORKFLOW_NODE_TYPES[c.type]?.color}
                  onDoubleClick={onAddComponent}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === 'library' && (
        <div className="overflow-y-auto flex-1 pr-1">
          <div className="flex flex-wrap gap-1 mb-2">
            {[
              { id: 'healthcare', label: 'Healthcare', icon: HeartPulse },
              { id: 'all', label: 'All' },
              { id: 'ad', label: 'AD' },
              { id: 'ams', label: 'AMS' },
              { id: 'qe', label: 'QE' },
            ].map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setLibraryFilter(f.id)}
                className={`flex items-center gap-1 px-2 py-0.5 rounded text-[10px] uppercase ${
                  libraryFilter === f.id
                    ? 'bg-cx-accent/15 text-cx-accent border border-cx-accent/30'
                    : 'text-cx-fg-dim border border-transparent'
                }`}
              >
                {f.icon && <f.icon className="w-3 h-3" />}
                {f.label}
              </button>
            ))}
          </div>
          <p className="text-[10px] text-cx-fg-dim mb-2">
            Drop a template to merge agents and dotted connections onto the canvas. Double-click to add at center.
          </p>
          {libraryWorkflows.length === 0 ? (
            <p className="text-[10px] text-cx-fg-dim">No templates match this filter. Refresh to restore pre-built workflows.</p>
          ) : (
            <div className="space-y-2">
              {libraryWorkflows.map((wf) => (
                <DraggableWorkflowTemplate
                  key={wf.id}
                  workflow={wf}
                  onDragStart={onDragStartTemplate}
                  onDoubleClick={onAddWorkflowTemplate}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
