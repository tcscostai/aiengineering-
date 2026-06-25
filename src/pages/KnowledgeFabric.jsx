import { useState, useMemo, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Database,
  Bot,
  Link2,
  Sparkles,
  RefreshCw,
  ChevronRight,
  Brain,
  Network,
  Gauge,
} from 'lucide-react'
import { ReactFlowProvider } from 'reactflow'
import { PageHeader } from '../components/ui/PageHeader'
import { GlassPanel } from '../components/ui/GlassPanel'
import { ProgressBar } from '../components/ui/ProgressBar'
import {
  KnowledgeGraphCanvas,
  GraphViewToggle,
  NodeDetailPanel,
} from '../components/knowledge/KnowledgeGraphCanvas'
import { DebtProfilerPanel } from '../components/knowledge/DebtProfilerPanel'
import { useAgentKnowledgeBindings } from '../components/knowledge/KnowledgeGraphNode'
import { useApp } from '../context/AppContext'
import { CATEGORIES } from '../lib/constants'
import {
  getKnowledgeGraph,
  getCategoryFabricMeta,
  MEMORY_LAYERS,
} from '../data/knowledgeFabric'
import { getDebtProfile } from '../data/debtProfiler'

const FABRIC_TABS = [
  { id: 'graph', label: 'Knowledge Graph', icon: Network },
  { id: 'debt', label: 'Debt Profiler', icon: Gauge },
]

export default function KnowledgeFabric() {
  const location = useLocation()
  const { agents } = useApp()
  const [fabricTab, setFabricTab] = useState('graph')
  const [category, setCategory] = useState(location.state?.category ?? 'ams')
  const [graphView, setGraphView] = useState('featured')
  const [selectedNode, setSelectedNode] = useState(null)
  const [highlightNodeId, setHighlightNodeId] = useState(null)

  useEffect(() => {
    if (location.state?.category) {
      setCategory(location.state.category)
      const m = getCategoryFabricMeta(location.state.category)
      setGraphView(m?.featuredSubgraph ? 'featured' : 'overview')
    }
  }, [location.state])

  const cat = CATEGORIES[category]
  const meta = getCategoryFabricMeta(category)
  const debtProfile = getDebtProfile(category)
  const fabricAgents = useAgentKnowledgeBindings(agents, category)

  const graphViews = useMemo(() => {
    const views = [{ id: 'overview', label: 'Category Overview' }]
    if (meta?.featuredSubgraph) {
      views.unshift({
        id: 'featured',
        label: meta.featuredSubgraph.title.replace('ServiceNow ', 'SN '),
        badge: 'P1',
      })
    }
    return views
  }, [meta])

  const activeGraph = useMemo(() => getKnowledgeGraph(category, graphView), [category, graphView])

  const handleCategoryChange = (catId) => {
    setCategory(catId)
    setSelectedNode(null)
    setHighlightNodeId(null)
    const m = getCategoryFabricMeta(catId)
    setGraphView(m?.featuredSubgraph ? 'featured' : 'overview')
  }

  const handleViewKnowledgeFromDebt = (nodeId) => {
    setFabricTab('graph')
    setGraphView(category === 'ams' ? 'featured' : 'overview')
    setHighlightNodeId(nodeId)
    const match = activeGraph?.nodes?.find((n) => n.id === nodeId)
    if (match) {
      setSelectedNode({
        id: match.id,
        data: {
          label: match.label,
          nodeType: match.type,
          meta: match.meta,
          system: match.system,
          records: match.records ?? 0,
          agentId: match.agentId,
        },
      })
    }
  }

  const totalRecords = useMemo(
    () => meta?.sourceSystems?.reduce((s, sys) => s + sys.records, 0) ?? 0,
    [meta]
  )

  return (
    <div>
      <PageHeader
        eyebrow="Module 5"
        title="Knowledge Fabric"
        description="Enterprise knowledge graphs and technical debt intelligence — per category, bound to onboarded agents."
        actions={
          <div className="flex items-center gap-2 text-xs text-cx-fg-dim">
            <RefreshCw className="w-3.5 h-3.5 text-cx-success" />
            <span>Last sync: 2 min ago</span>
          </div>
        }
      />

      {/* Fabric tabs */}
      <div className="flex flex-wrap gap-1 p-1 rounded-xl border border-cx-border bg-cx-panel/50 mb-6 w-fit">
        {FABRIC_TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setFabricTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm transition-all ${
              fabricTab === t.id
                ? 'bg-cx-accent/15 text-cx-accent border border-cx-accent/30'
                : 'text-cx-fg-dim hover:text-cx-fg-muted border border-transparent'
            }`}
          >
            <t.icon className="w-4 h-4" />
            {t.label}
            {t.id === 'debt' && debtProfile && (
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-cx-danger/15 text-cx-danger">
                {debtProfile.summary.criticalCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Category selector */}
      <div className="flex flex-wrap gap-2 mb-6">
        {Object.values(CATEGORIES).map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => handleCategoryChange(c.id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm transition-all ${
              category === c.id ? 'border-cx-border-strong' : 'border-cx-border text-cx-fg-dim hover:text-cx-fg-muted'
            }`}
            style={
              category === c.id
                ? { borderColor: `${c.color}50`, backgroundColor: `${c.color}10`, color: c.color }
                : undefined
            }
          >
            <Brain className="w-4 h-4" />
            {c.label}
            <span className="text-[10px] font-mono opacity-70">
              {agents.filter((a) => a.category === c.id).length} agents
            </span>
          </button>
        ))}
      </div>

      {fabricTab === 'debt' ? (
        <DebtProfilerPanel
          category={category}
          categoryColor={cat.color}
          agents={agents}
          onViewKnowledgeNode={handleViewKnowledgeFromDebt}
        />
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
            {MEMORY_LAYERS.map((layer, i) => {
              const count = meta?.memoryStats?.[layer.id] ?? 0
              return (
                <motion.div
                  key={layer.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                >
                  <GlassPanel className="p-4">
                    <p className="text-2xs uppercase text-cx-fg-dim mb-1">{layer.label}</p>
                    <p className="font-display text-xl font-semibold" style={{ color: cat.color }}>
                      {count >= 1000 ? `${(count / 1000).toFixed(1)}k` : count.toLocaleString()}
                    </p>
                  </GlassPanel>
                </motion.div>
              )
            })}
          </div>

          <div className="grid lg:grid-cols-[1fr_300px] gap-6 mb-6">
            <GlassPanel hero className="p-4">
              <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    {graphView === 'featured' && (
                      <Sparkles className="w-4 h-4" style={{ color: cat.color }} />
                    )}
                    <p className="text-2xs uppercase tracking-widest" style={{ color: cat.color }}>
                      {cat.short} Knowledge Graph
                    </p>
                  </div>
                  <h2 className="font-display text-lg font-semibold text-cx-fg">{activeGraph?.title}</h2>
                  <p className="text-xs text-cx-fg-dim mt-1 max-w-2xl">{activeGraph?.subtitle}</p>
                </div>
                <GraphViewToggle
                  views={graphViews}
                  activeView={graphView}
                  onChange={(v) => {
                    setGraphView(v)
                    setSelectedNode(null)
                    setHighlightNodeId(null)
                  }}
                  categoryColor={cat.color}
                />
              </div>

              {graphView === 'featured' && meta?.featuredSubgraph && (
                <div
                  className="flex flex-wrap items-center gap-4 p-3 rounded-xl border mb-4"
                  style={{ borderColor: `${cat.color}30`, backgroundColor: `${cat.color}06` }}
                >
                  <div className="flex items-center gap-2">
                    <Database className="w-4 h-4" style={{ color: cat.color }} />
                    <span className="text-xs text-cx-fg">
                      Source: <strong>{meta.featuredSubgraph.sourceSystem}</strong>
                    </span>
                  </div>
                  <span className="text-[10px] text-cx-fg-dim font-mono">
                    {meta.featuredSubgraph.recordCount?.toLocaleString()} records indexed
                  </span>
                  <button
                    type="button"
                    onClick={() => setFabricTab('debt')}
                    className="text-[10px] flex items-center gap-1 ml-auto hover:underline"
                    style={{ color: cat.color }}
                  >
                    View linked debt <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
              )}

              <ReactFlowProvider>
                <KnowledgeGraphCanvas
                  graph={activeGraph}
                  categoryColor={cat.color}
                  height={graphView === 'featured' ? 560 : 480}
                  selectedNodeId={highlightNodeId ?? selectedNode?.id}
                  onNodeSelect={setSelectedNode}
                />
              </ReactFlowProvider>

              <p className="text-[10px] text-cx-fg-dim mt-3 px-1">
                Click nodes to inspect · Switch to Debt Profiler to see remediation agents
              </p>
            </GlassPanel>

            <div className="space-y-4">
              <GlassPanel className="p-4 min-h-[200px]">
                <p className="text-2xs uppercase text-cx-fg-dim tracking-widest mb-3">Node Inspector</p>
                {selectedNode ? (
                  <NodeDetailPanel node={selectedNode} categoryColor={cat.color} />
                ) : (
                  <p className="text-xs text-cx-fg-dim leading-relaxed">
                    Select a node in the knowledge graph to see records, source systems, and agent bindings.
                  </p>
                )}
              </GlassPanel>

              <GlassPanel className="p-4">
                <p className="text-2xs uppercase text-cx-fg-dim tracking-widest mb-3 flex items-center gap-1.5">
                  <Bot className="w-3.5 h-3.5" /> Agent Knowledge Bindings
                </p>
                {fabricAgents.length === 0 ? (
                  <p className="text-xs text-cx-fg-dim">Onboard {cat.short} agents to bind knowledge sources.</p>
                ) : (
                  <div className="space-y-3">
                    {fabricAgents.map((agent) => (
                      <div key={agent.id} className="p-3 rounded-xl border border-cx-border bg-cx-raised/20">
                        <p className="text-xs font-medium text-cx-fg mb-1">{agent.name}</p>
                        <ProgressBar value={agent.coverage} label="Knowledge coverage" className="mb-2" />
                        <div className="flex flex-wrap gap-1">
                          {agent.sources.map((s) => (
                            <span
                              key={s}
                              className="text-[9px] px-1.5 py-0.5 rounded border border-cx-border text-cx-fg-dim"
                            >
                              {s}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </GlassPanel>

              {debtProfile && (
                <GlassPanel className="p-4">
                  <p className="text-2xs uppercase text-cx-fg-dim mb-2 flex items-center gap-1.5">
                    <Gauge className="w-3.5 h-3.5" /> Linked Debt
                  </p>
                  <p className="text-xs text-cx-fg-dim mb-3">
                    {debtProfile.items.length} debt items · index {debtProfile.summary.debtIndex}
                  </p>
                  <button
                    type="button"
                    onClick={() => setFabricTab('debt')}
                    className="w-full px-3 py-2 rounded-xl border text-xs transition-colors"
                    style={{ borderColor: `${cat.color}40`, color: cat.color, backgroundColor: `${cat.color}08` }}
                  >
                    Open Debt Profiler
                  </button>
                </GlassPanel>
              )}
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            <GlassPanel className="p-6">
              <p className="text-2xs uppercase tracking-widest mb-4 flex items-center gap-2" style={{ color: cat.color }}>
                <Database className="w-4 h-4" />
                Connected Source Systems
              </p>
              <div className="space-y-2">
                {meta?.sourceSystems?.map((sys, i) => (
                  <motion.div
                    key={sys.name}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="flex items-center justify-between p-3 rounded-xl border border-cx-border bg-cx-raised/20"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-2 h-2 rounded-full bg-cx-success animate-pulse" />
                      <div>
                        <p className="text-sm text-cx-fg">{sys.name}</p>
                        <p className="text-[10px] text-cx-fg-dim font-mono">
                          {sys.records >= 1000 ? `${(sys.records / 1000).toFixed(0)}k` : sys.records} records ·{' '}
                          {sys.latency}
                        </p>
                      </div>
                    </div>
                    <span className="text-[10px] uppercase text-cx-success">{sys.status}</span>
                  </motion.div>
                ))}
              </div>
              <p className="text-[10px] text-cx-fg-dim mt-4">
                Total indexed: {totalRecords >= 1000 ? `${(totalRecords / 1000).toFixed(0)}k` : totalRecords} records
              </p>
            </GlassPanel>

            <GlassPanel className="p-6">
              <p className="text-2xs uppercase tracking-widest mb-4 flex items-center gap-2" style={{ color: cat.color }}>
                <Link2 className="w-4 h-4" />
                Knowledge Domains for Agent Onboarding
              </p>
              <div className="grid grid-cols-2 gap-2">
                {meta?.knowledgeDomains?.map((domain, i) => (
                  <motion.div
                    key={domain}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.03 }}
                    className="flex items-center gap-2 p-3 rounded-xl border border-cx-border bg-cx-raised/30"
                  >
                    <ChevronRight className="w-3 h-3 shrink-0" style={{ color: cat.color }} />
                    <span className="text-xs text-cx-fg">{domain}</span>
                  </motion.div>
                ))}
              </div>
            </GlassPanel>
          </div>
        </>
      )}
    </div>
  )
}
