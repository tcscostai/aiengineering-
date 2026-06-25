import { useState, useMemo, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { Plus, HeartPulse, GitBranch, Award } from 'lucide-react'
import { PageHeader } from '../components/ui/PageHeader'
import { GlassPanel } from '../components/ui/GlassPanel'
import { AgentWorkflowComposer } from '../components/harness/workflow/AgentWorkflowComposer'
import { createNewWorkflow } from '../components/harness/workflow/WorkflowLibrary'
import { useAgentWorkflows } from '../hooks/useAgentWorkflows'
import { CATEGORIES } from '../lib/constants'
import { isPrebuiltWorkflow, PREBUILT_WORKFLOW_IDS } from '../data/prebuiltWorkflows'

const TEMPLATE_FILTERS = [
  { id: 'healthcare', label: 'Healthcare', icon: HeartPulse },
  { id: 'all', label: 'All' },
  { id: 'ad', label: 'AD' },
  { id: 'ams', label: 'AMS' },
  { id: 'qe', label: 'QE' },
  { id: 'custom', label: 'My Workflows' },
]

export default function WorkflowDesigner() {
  const location = useLocation()
  const { workflows, saveWorkflow } = useAgentWorkflows()
  const [filter, setFilter] = useState('healthcare')
  const [activeWorkflowId, setActiveWorkflowId] = useState(
    location.state?.workflowId ?? PREBUILT_WORKFLOW_IDS.priorAuth
  )
  const [category, setCategory] = useState(location.state?.category ?? 'ad')

  useEffect(() => {
    if (location.state?.workflowId) setActiveWorkflowId(location.state.workflowId)
    if (location.state?.category) setCategory(location.state.category)
  }, [location.state])

  const filteredTemplates = useMemo(() => {
    return workflows.filter((wf) => {
      if (filter === 'all') return true
      if (filter === 'healthcare') return wf.metadata?.tags?.includes('healthcare') || isPrebuiltWorkflow(wf)
      if (filter === 'custom') return !isPrebuiltWorkflow(wf)
      return wf.category === filter
    })
  }, [workflows, filter])

  const activeWorkflow = workflows.find((w) => w.id === activeWorkflowId)

  const handleOpenTemplate = (wf) => {
    setActiveWorkflowId(wf.id)
    setCategory(wf.category)
  }

  const handleNewWorkflow = () => {
    const wf = createNewWorkflow(category)
    saveWorkflow(wf)
    setActiveWorkflowId(wf.id)
  }

  return (
    <div>
      <PageHeader
        eyebrow="Module 6"
        title="Workflow Designer"
        description="Load healthcare pre-built templates or start blank. Drag onboarded agents onto the canvas, connect with dotted lines, swap agents, and save custom copies."
        actions={
          <button
            onClick={handleNewWorkflow}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-cx-accent/40 bg-cx-accent/10 text-cx-accent text-sm hover:bg-cx-accent/20"
          >
            <Plus className="w-4 h-4" /> New Blank Workflow
          </button>
        }
      />

      <GlassPanel className="p-4 mb-6">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div>
            <p className="text-2xs uppercase text-cx-fg-dim tracking-widest">Workflow Templates</p>
            <p className="text-xs text-cx-fg-muted mt-0.5">
              Open a template to edit on the canvas — prior auth, claim adjudication, eligibility, and more
            </p>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {TEMPLATE_FILTERS.map((f) => (
              <button
                key={f.id}
                onClick={() => setFilter(f.id)}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg border text-[10px] uppercase ${
                  filter === f.id
                    ? 'border-cx-accent/40 bg-cx-accent/10 text-cx-accent'
                    : 'border-cx-border text-cx-fg-dim'
                }`}
              >
                {f.icon && <f.icon className="w-3 h-3" />}
                {f.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 max-h-[220px] overflow-y-auto pr-1">
          {filteredTemplates.map((wf) => {
            const cat = CATEGORIES[wf.category]
            const agentCount = wf.nodes.filter((n) => n.type === 'agent').length
            const selected = wf.id === activeWorkflowId
            const prebuilt = isPrebuiltWorkflow(wf)
            return (
              <button
                key={wf.id}
                type="button"
                onClick={() => handleOpenTemplate(wf)}
                className={`text-left p-3 rounded-xl border transition-all ${
                  selected
                    ? 'border-cx-accent/50 bg-cx-accent/10 ring-1 ring-cx-accent/30'
                    : 'border-cx-border bg-cx-raised/20 hover:border-cx-accent/30'
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-1">
                  <span
                    className="text-[9px] uppercase px-1.5 py-0.5 rounded shrink-0"
                    style={{ backgroundColor: `${cat?.color}20`, color: cat?.color }}
                  >
                    {cat?.short}
                  </span>
                  <div className="flex gap-1">
                    {prebuilt && (
                      <span className="text-[8px] uppercase px-1 py-0.5 rounded bg-cx-success/10 text-cx-success">
                        Pre-built
                      </span>
                    )}
                    {wf.metadata?.certified && <Award className="w-3 h-3 text-cx-success shrink-0" />}
                  </div>
                </div>
                <p className="text-xs font-medium text-cx-fg line-clamp-2 leading-snug">{wf.name}</p>
                <p className="text-[10px] text-cx-fg-dim mt-1">
                  {agentCount} agents · {wf.edges.length} connections
                </p>
              </button>
            )
          })}
        </div>

        {filteredTemplates.length === 0 && (
          <p className="text-sm text-cx-fg-dim text-center py-6">
            No templates in this filter. Refresh the page to restore healthcare pre-built workflows.
          </p>
        )}
      </GlassPanel>

      {activeWorkflow && (
        <div className="mb-3 flex items-center gap-2 text-xs text-cx-fg-dim">
          <GitBranch className="w-3.5 h-3.5 text-cx-accent" />
          Editing: <span className="text-cx-fg font-medium">{activeWorkflow.name}</span>
          {isPrebuiltWorkflow(activeWorkflow) && (
            <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-cx-warn/10 text-cx-warn">
              Use Save Copy to keep your changes
            </span>
          )}
        </div>
      )}

      <AgentWorkflowComposer
        key={activeWorkflowId}
        category={category}
        workflowId={activeWorkflowId}
        onWorkflowSaved={(wf) => {
          if (wf.id !== activeWorkflowId) setActiveWorkflowId(wf.id)
        }}
      />
    </div>
  )
}
