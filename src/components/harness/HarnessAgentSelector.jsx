import { CATEGORIES, getRuntimeShort, RUNTIME_TYPES } from '../../lib/constants'
import { agentEligibleForHarness } from '../../lib/harnessConstants'
import { PlatformToolBadge } from '../onboarding/PlatformToolBadge'

export function HarnessAgentSelector({ agents, category, selectedId, onSelect, runCounts = {} }) {
  const filtered = agents.filter(
    (a) => a.category === category && agentEligibleForHarness(a)
  )

  if (filtered.length === 0) {
    return (
      <p className="text-xs text-cx-fg-dim text-center py-6 leading-relaxed">
        No harness-ready {CATEGORIES[category]?.short} agents. Register and verify runtime connection in Onboarding Studio.
      </p>
    )
  }

  return (
    <div className="space-y-2">
      {filtered.map((agent) => {
        const rt = RUNTIME_TYPES[agent.runtimeType]
        const isSelected = agent.id === selectedId
        const runs = runCounts[agent.id] ?? 0

        return (
          <button
            key={agent.id}
            type="button"
            onClick={() => onSelect(agent.id)}
            className={`w-full text-left p-3 rounded-xl border transition-all ${
              isSelected
                ? 'border-cx-accent/50 bg-cx-accent/10'
                : 'border-cx-border bg-cx-raised/30 hover:border-cx-border-strong'
            }`}
          >
            <p className="text-sm font-medium text-cx-fg truncate">{agent.name}</p>
            <p className="text-xs text-cx-fg-dim truncate">{agent.project} · {agent.team}</p>
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <PlatformToolBadge platformTool={agent.platformTool} runtimeType={agent.runtimeType} size="xs" />
              {rt && (
                <span
                  className="text-[10px] uppercase px-1.5 py-0.5 rounded font-mono"
                  style={{ backgroundColor: `${rt.color}20`, color: rt.color }}
                >
                  {getRuntimeShort(agent.runtimeType)}
                </span>
              )}
              <span className="text-[10px] text-cx-fg-dim">{agent.skills.length} skills</span>
              {runs > 0 && <span className="text-[10px] text-cx-accent">{runs} runs</span>}
            </div>
          </button>
        )
      })}
    </div>
  )
}
