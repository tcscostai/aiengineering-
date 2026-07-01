import { Check } from 'lucide-react'
import { WORKSPACE_DOMAIN_TEMPLATES } from '../../data/workspaceDomains'
import { PLATFORM_TOOLS } from '../../data/platformTools'

export function WorkspaceDomainCard({ domainId, enabled, onToggle }) {
  const template = WORKSPACE_DOMAIN_TEMPLATES[domainId]
  const platform = PLATFORM_TOOLS[template.defaultPlatform]

  return (
    <button
      type="button"
      onClick={() => onToggle(domainId)}
      className={`text-left p-4 rounded-xl border transition-all w-full ${
        enabled
          ? 'border-cx-accent/50 bg-cx-accent/10'
          : 'border-cx-border bg-cx-raised/20 hover:border-cx-accent/30'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="text-sm font-semibold text-cx-fg">{template.label}</span>
            <span
              className="text-[9px] uppercase px-1.5 py-0.5 rounded font-mono"
              style={{ backgroundColor: `${platform.color}22`, color: platform.color }}
            >
              {platform.name}
            </span>
          </div>
          <p className="text-xs text-cx-fg-dim leading-relaxed">{template.tagline}</p>
          <p className="text-[10px] text-cx-fg-dim mt-2">
            Suggested: {template.suggestedAgents.slice(0, 2).join(', ')}
            {template.suggestedAgents.length > 2 ? '…' : ''}
          </p>
        </div>
        <div
          className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 ${
            enabled ? 'border-cx-accent bg-cx-accent text-cx-deep' : 'border-cx-border'
          }`}
        >
          {enabled && <Check className="w-3 h-3" />}
        </div>
      </div>
    </button>
  )
}
