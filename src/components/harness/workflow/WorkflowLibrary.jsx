import { useState } from 'react'
import { Plus, Download, Trash2, Play, FileJson, Award, HeartPulse } from 'lucide-react'
import { GlassPanel } from '../../ui/GlassPanel'
import { useAgentWorkflows } from '../../../hooks/useAgentWorkflows'
import { useApp } from '../../../context/AppContext'
import { CATEGORIES } from '../../../lib/constants'
import { createEmptyWorkflow } from '../../../lib/workflowSchema'
import { generateId } from '../../../lib/storage'
import { isPrebuiltWorkflow } from '../../../data/prebuiltWorkflows'

const FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'healthcare', label: 'Healthcare', icon: HeartPulse },
  ...Object.entries(CATEGORIES).map(([id, cat]) => ({ id, label: cat.short })),
]

export function WorkflowLibrary({ onEdit, onCreate }) {
  const { workflows, deleteWorkflow, exportJSON } = useAgentWorkflows()
  const { addNotification } = useApp()
  const [filter, setFilter] = useState('all')

  const filtered = workflows.filter((w) => {
    if (filter === 'all') return true
    if (filter === 'healthcare') return w.metadata?.tags?.includes('healthcare') || isPrebuiltWorkflow(w)
    return w.category === filter
  })

  const prebuiltCount = workflows.filter((w) => isPrebuiltWorkflow(w)).length

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div className="flex flex-wrap gap-2">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs capitalize ${
                filter === f.id ? 'border-cx-accent/40 bg-cx-accent/10 text-cx-accent' : 'border-cx-border text-cx-fg-dim'
              }`}
            >
              {f.icon && <f.icon className="w-3 h-3" />}
              {f.label}
              {f.id === 'healthcare' && prebuiltCount > 0 && (
                <span className="text-[9px] opacity-70">({prebuiltCount})</span>
              )}
            </button>
          ))}
        </div>
        <button
          onClick={onCreate}
          className="flex items-center gap-2 px-4 py-2 rounded-xl border border-cx-accent/40 bg-cx-accent/10 text-cx-accent text-sm"
        >
          <Plus className="w-4 h-4" /> New Workflow
        </button>
      </div>

      {filtered.length === 0 ? (
        <GlassPanel className="p-12 text-center">
          <FileJson className="w-10 h-10 text-cx-accent mx-auto mb-4 opacity-50" />
          <h2 className="font-display text-lg text-cx-fg mb-2">No Workflows Match Filter</h2>
          <p className="text-sm text-cx-fg-dim max-w-md mx-auto mb-4">
            {filter === 'healthcare'
              ? 'Healthcare templates are restored automatically on page refresh. Reload to restore pre-built workflows.'
              : 'Compose agent workflows in the Composer tab, save them here, and drag templates back onto the canvas.'}
          </p>
          {filter !== 'healthcare' && (
            <button onClick={onCreate} className="px-4 py-2 rounded-xl border border-cx-accent/40 text-cx-accent text-sm">
              Create First Workflow
            </button>
          )}
        </GlassPanel>
      ) : (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((wf) => {
            const cat = CATEGORIES[wf.category]
            const agentCount = wf.nodes.filter((n) => n.type === 'agent').length
            const prebuilt = isPrebuiltWorkflow(wf)
            return (
              <GlassPanel key={wf.id} className="p-5 flex flex-col h-full group">
                <div className="flex items-start justify-between mb-2 gap-2">
                  <div className="flex flex-wrap gap-1.5">
                    <span
                      className="text-2xs uppercase px-2 py-0.5 rounded"
                      style={{ backgroundColor: `${cat?.color}20`, color: cat?.color }}
                    >
                      {cat?.short}
                    </span>
                    {prebuilt && (
                      <span className="text-2xs uppercase px-2 py-0.5 rounded bg-cx-success/10 text-cx-success">
                        Pre-built
                      </span>
                    )}
                  </div>
                  {wf.metadata?.certified && <Award className="w-4 h-4 text-cx-success shrink-0" />}
                </div>
                <h3 className="font-display text-base font-semibold text-cx-fg mb-1">{wf.name}</h3>
                <p className="text-xs text-cx-fg-dim flex-1 mb-3 line-clamp-2">{wf.description || wf.project || 'Agent orchestration workflow'}</p>
                {wf.metadata?.tags?.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {wf.metadata.tags.filter((t) => t !== 'healthcare').slice(0, 4).map((tag) => (
                      <span key={tag} className="text-[9px] px-1.5 py-0.5 rounded bg-cx-raised text-cx-fg-dim">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
                <div className="flex gap-4 text-[10px] text-cx-fg-dim mb-4">
                  <span>{agentCount} agents</span>
                  <span>{wf.edges.length} connections</span>
                  <span>{wf.metadata?.reuseCount ?? 0} runs</span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => onEdit(wf.id)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl border border-cx-accent/40 bg-cx-accent/10 text-xs text-cx-accent"
                  >
                    <Play className="w-3 h-3" /> Open
                  </button>
                  <button
                    onClick={() => {
                      exportJSON(wf)
                      addNotification('JSON exported', 'success')
                    }}
                    className="p-2 rounded-xl border border-cx-border text-cx-fg-dim hover:text-cx-fg"
                    title="Download JSON"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {
                      const msg = prebuilt
                        ? 'Remove this pre-built template? It will be restored automatically on page refresh.'
                        : 'Delete this workflow?'
                      if (confirm(msg)) {
                        deleteWorkflow(wf.id)
                        addNotification(prebuilt ? 'Template removed — refresh to restore' : 'Workflow deleted', 'info')
                      }
                    }}
                    className="p-2 rounded-xl border border-cx-border text-cx-fg-dim hover:text-cx-danger opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </GlassPanel>
            )
          })}
        </div>
      )}
    </div>
  )
}

export function createNewWorkflow(category) {
  return { ...createEmptyWorkflow(category), id: generateId('wf') }
}
