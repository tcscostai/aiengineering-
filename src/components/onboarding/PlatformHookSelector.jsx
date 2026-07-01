import { Check } from 'lucide-react'
import { getPlatformTool, getPlatformToolsForCategory } from '../../data/platformTools'

export function PlatformHookSelector({ category, value, onChange }) {
  const options = getPlatformToolsForCategory(category)

  return (
    <div className="space-y-2">
      <p className="text-2xs uppercase text-cx-fg-dim tracking-widest">Platform Hook</p>
      <p className="text-xs text-cx-fg-dim mb-3">
        Connect this agent to an enterprise platform plane, or register an external runtime.
      </p>
      <div className="grid sm:grid-cols-2 gap-2">
        {options.map((tool) => {
          const selected = value === tool.id
          const recommended =
            tool.id !== 'external' && tool.categories.includes(category)
          const alsoSupported =
            tool.id !== 'external' &&
            !recommended &&
            tool.secondaryCategories?.includes(category)

          return (
            <button
              key={tool.id}
              type="button"
              onClick={() => onChange(tool.id)}
              className={`text-left p-3 rounded-xl border transition-all ${
                selected
                  ? 'border-cx-accent/50 bg-cx-accent/10'
                  : 'border-cx-border bg-cx-raised/20 hover:border-cx-accent/30'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className="text-xs font-semibold uppercase font-mono"
                      style={{ color: tool.color }}
                    >
                      {tool.name}
                    </span>
                    {recommended && (
                      <span className="text-[9px] uppercase px-1 py-0.5 rounded border border-cx-success/30 text-cx-success">
                        Recommended
                      </span>
                    )}
                    {alsoSupported && (
                      <span className="text-[9px] uppercase px-1 py-0.5 rounded border border-cx-border text-cx-fg-dim">
                        Also supported
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-cx-fg-dim mt-1 leading-snug">{tool.tagline}</p>
                  <p className="text-[10px] text-cx-fg-dim mt-1">{tool.domains.join(' · ')}</p>
                </div>
                {selected && <Check className="w-4 h-4 text-cx-accent shrink-0" />}
              </div>
            </button>
          )
        })}
      </div>
      {value && value !== 'external' && (
        <p className="text-[10px] text-cx-fg-dim mt-2">
          Runtime locked to {getPlatformTool(value).fullName} — endpoint fields below are platform-specific.
        </p>
      )}
    </div>
  )
}
