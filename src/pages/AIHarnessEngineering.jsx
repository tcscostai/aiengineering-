import { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { Cpu, GitBranch, Library, Rocket } from 'lucide-react'
import { PageHeader } from '../components/ui/PageHeader'
import { GlassPanel } from '../components/ui/GlassPanel'
import { SingleAgentHarness } from '../components/harness/SingleAgentHarness'
import { AgentWorkflowComposer } from '../components/harness/workflow/AgentWorkflowComposer'
import { WorkflowLibrary, createNewWorkflow } from '../components/harness/workflow/WorkflowLibrary'
import { HarnessQuickStart } from '../components/harness/HarnessQuickStart'
import { useApp } from '../context/AppContext'
import { useHarness } from '../hooks/useHarness'
import { useAgentWorkflows } from '../hooks/useAgentWorkflows'

const TABS = [
  { id: 'overview', label: 'Quick Start', icon: Rocket },
  { id: 'single', label: 'Single Agent Harness', icon: Cpu },
  { id: 'composer', label: 'Agent Workflow Composer', icon: GitBranch },
  { id: 'library', label: 'Workflow Library', icon: Library },
]

export default function AIHarnessEngineering() {
  const location = useLocation()
  const { agents, initiatives } = useApp()
  const { getStats, runs } = useHarness()
  const { saveWorkflow, workflows } = useAgentWorkflows()
  const [tab, setTab] = useState(location.state?.tab ?? 'overview')
  const [category, setCategory] = useState(location.state?.category ?? 'ad')
  const [initialAgentId, setInitialAgentId] = useState(location.state?.agentId ?? null)
  const [initialTask, setInitialTask] = useState(location.state?.task ?? '')
  const [editingWorkflowId, setEditingWorkflowId] = useState(null)

  useEffect(() => {
    if (location.state?.category) setCategory(location.state.category)
    if (location.state?.tab) setTab(location.state.tab)
    if (location.state?.agentId) setInitialAgentId(location.state.agentId)
    if (location.state?.task) setInitialTask(location.state.task)
    if (location.state?.workflowId) setEditingWorkflowId(location.state.workflowId)
    if (location.state?.flowStep?.startsWith('engineer_')) {
      setTab('single')
    }
  }, [location.key, location.state])

  const stats = getStats(agents)

  const handleNewWorkflow = (cat = category) => {
    const wf = createNewWorkflow(cat)
    saveWorkflow(wf)
    setEditingWorkflowId(wf.id)
    setCategory(cat)
    setTab('composer')
  }

  const handleStartSingle = ({ agentId, category: cat, task }) => {
    if (cat) setCategory(cat)
    if (agentId) setInitialAgentId(agentId)
    setInitialTask(task ?? '')
    setTab('single')
  }

  const handleOpenTemplate = (workflowId, cat) => {
    const wf = workflows.find((w) => w.id === workflowId)
    if (cat || wf?.category) setCategory(cat ?? wf.category)
    setEditingWorkflowId(workflowId)
    setTab('composer')
  }

  return (
    <div>
      <PageHeader
        eyebrow="Enterprise Orchestration"
        title="AI Harness Engineering"
        description="Start with Quick Start, run single agents, compose healthcare workflows, or open templates — the execution layer for AD, AMS, and QE."
      />

      <div className="flex flex-wrap gap-1 p-1 rounded-xl border border-cx-border bg-cx-panel/50 mb-6 w-fit">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm transition-all ${
              tab === t.id
                ? 'bg-cx-accent/15 text-cx-accent border border-cx-accent/30 shadow-[0_0_20px_rgba(94,200,242,0.08)]'
                : 'text-cx-fg-dim hover:text-cx-fg-muted border border-transparent'
            }`}
          >
            <t.icon className="w-4 h-4" />
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <HarnessQuickStart
          agents={agents}
          initiatives={initiatives}
          runs={runs}
          workflows={workflows}
          stats={stats}
          onStartSingle={handleStartSingle}
          onOpenTemplate={handleOpenTemplate}
          onOpenLibrary={() => setTab('library')}
          onBuildNew={() => handleNewWorkflow()}
          onGoTab={setTab}
        />
      )}

      {tab === 'single' && (
        <SingleAgentHarness
          category={category}
          onCategoryChange={setCategory}
          stats={stats}
          initialAgentId={initialAgentId}
          initialTask={initialTask}
        />
      )}

      {tab === 'composer' && (
        <>
          <div className="flex flex-wrap gap-2 mb-4">
            {['ad', 'ams', 'qe'].map((cat) => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`px-3 py-1.5 rounded-lg border text-xs uppercase ${
                  category === cat ? 'border-cx-accent/40 text-cx-accent bg-cx-accent/10' : 'border-cx-border text-cx-fg-dim'
                }`}
              >
                {cat}
              </button>
            ))}
            <button
              onClick={() => handleNewWorkflow()}
              className="ml-auto px-3 py-1.5 rounded-lg border border-dashed border-cx-accent/40 text-xs text-cx-accent"
            >
              + New Workflow Canvas
            </button>
          </div>
          <AgentWorkflowComposer
            key={editingWorkflowId ?? `new-${category}`}
            category={category}
            workflowId={editingWorkflowId}
            onWorkflowSaved={(w) => setEditingWorkflowId(w.id)}
          />
        </>
      )}

      {tab === 'library' && (
        <WorkflowLibrary
          onEdit={(id) => handleOpenTemplate(id)}
          onCreate={() => handleNewWorkflow()}
        />
      )}

      {tab === 'single' && runs.length > 0 && (
        <GlassPanel className="p-6 mt-6">
          <p className="text-2xs uppercase text-cx-fg-dim mb-4">Recent Harness Runs</p>
          <div className="space-y-2">
            {runs.slice(0, 6).map((run) => (
              <div key={run.id} className="flex items-center justify-between p-3 rounded-xl border border-cx-border bg-cx-raised/20">
                <div>
                  <p className="text-sm text-cx-fg">{run.agentName}</p>
                  <p className="text-xs text-cx-fg-dim">{run.task?.slice(0, 50)}</p>
                </div>
                <span className={`text-2xs uppercase px-2 py-0.5 rounded-md ${
                  run.status === 'completed' ? 'bg-cx-success/10 text-cx-success' : 'bg-cx-warn/10 text-cx-warn'
                }`}>{run.status}</span>
              </div>
            ))}
          </div>
        </GlassPanel>
      )}
    </div>
  )
}
