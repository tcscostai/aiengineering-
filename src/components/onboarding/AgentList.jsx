import { Trash2, ChevronRight } from 'lucide-react'
import { CATEGORIES, getStageLabel, getRuntimeShort, RUNTIME_TYPES } from '../../lib/constants'
import { getStageProgress } from '../../services/agentService'
import { PlatformToolBadge } from './PlatformToolBadge'

export function AgentList({ agents, selectedId, onSelect, onDelete, onCreate }) {
  return (
    <div className="space-y-2">
      <button
        onClick={onCreate}
        className="w-full px-4 py-3 rounded-xl border border-dashed border-cx-accent/40 text-cx-accent text-sm hover:bg-cx-accent/10 transition-colors"
      >
        + Register External Agent
      </button>

      {agents.length === 0 && (
        <p className="text-xs text-cx-fg-dim text-center py-6 leading-relaxed">
          Register agents on SEL, Ignio, ARE, or external runtimes. Different teams and projects onboard here.
        </p>
      )}

      {agents.map((agent) => {
        const cat = CATEGORIES[agent.category]
        const progress = getStageProgress(agent)
        const isSelected = agent.id === selectedId
        const rt = RUNTIME_TYPES[agent.runtimeType]

        return (
          <div
            key={agent.id}
            className={`p-4 rounded-xl border cursor-pointer transition-all group ${
              isSelected
                ? 'border-cx-accent/50 bg-cx-accent/10'
                : 'border-cx-border bg-cx-raised/30 hover:border-cx-border-strong'
            }`}
            onClick={() => onSelect(agent.id)}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-cx-fg truncate">
                  {agent.name || 'Untitled Agent'}
                </p>
                <p className="text-xs text-cx-fg-dim truncate">
                  {agent.project || 'No project'} · {agent.team || 'No team'}
                </p>
                <div className="flex flex-wrap items-center gap-1.5 mt-2">
                  <PlatformToolBadge platformTool={agent.platformTool} runtimeType={agent.runtimeType} size="xs" />
                  {rt && (
                    <span
                      className="text-[10px] uppercase px-1.5 py-0.5 rounded font-mono"
                      style={{ backgroundColor: `${rt.color}20`, color: rt.color }}
                    >
                      {getRuntimeShort(agent.runtimeType)}
                    </span>
                  )}
                  <span
                    className="text-[10px] uppercase px-1.5 py-0.5 rounded"
                    style={{ backgroundColor: `${cat.color}20`, color: cat.color }}
                  >
                    {getStageLabel(agent.stage)}
                  </span>
                  {agent.connectionStatus === 'verified' && (
                    <span className="text-[10px] text-cx-success">connected</span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    if (confirm(`Remove "${agent.name || 'this agent'}" registration?`)) onDelete(agent.id)
                  }}
                  className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 border border-cx-border hover:border-cx-danger/40 text-cx-fg-dim hover:text-cx-danger transition-all"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
                <ChevronRight className={`w-4 h-4 ${isSelected ? 'text-cx-accent' : 'text-cx-fg-dim'}`} />
              </div>
            </div>
            <div className="h-1 rounded-full bg-cx-border mt-3 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-cx-accent to-cx-accent2 transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}
