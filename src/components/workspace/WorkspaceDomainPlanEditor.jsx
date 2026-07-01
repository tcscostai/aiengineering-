import { WORKSPACE_DOMAIN_TEMPLATES } from '../../data/workspaceDomains'
import { PLATFORM_TOOLS } from '../../data/platformTools'

const inputClass =
  'w-full px-3 py-2 rounded-xl border border-cx-border bg-cx-panel/50 text-sm text-cx-fg placeholder:text-cx-fg-dim focus:outline-none focus:border-cx-accent/40'

export function WorkspaceDomainPlanEditor({ domainId, plan, onChange }) {
  const template = WORKSPACE_DOMAIN_TEMPLATES[domainId]
  const platformOptions = ['sel', 'ignio', 'are'].filter((id) => {
    const pt = PLATFORM_TOOLS[id]
    if (id === 'ignio' && domainId !== 'ams') return false
    return pt.categories.includes(domainId) || pt.secondaryCategories?.includes(domainId)
  })

  const updatePlan = (patch) => onChange(domainId, { ...plan, ...patch })

  const toggleDeliverable = (index) => {
    const deliverables = plan.deliverables.map((d, i) =>
      i === index ? { ...d, selected: !d.selected } : d
    )
    updatePlan({ deliverables })
  }

  return (
    <div className="p-4 rounded-xl border border-cx-border bg-cx-raised/20 space-y-4">
      <div className="flex items-center gap-2">
        <span
          className="text-xs font-semibold uppercase font-mono px-2 py-0.5 rounded"
          style={{ backgroundColor: `${template.color}22`, color: template.color }}
        >
          {template.short}
        </span>
        <span className="text-sm font-medium text-cx-fg">{template.label}</span>
      </div>

      <div>
        <label className="text-2xs uppercase text-cx-fg-dim tracking-widest mb-1.5 block">Domain objective</label>
        <textarea
          className={`${inputClass} min-h-[72px] resize-y`}
          value={plan.objective}
          onChange={(e) => updatePlan({ objective: e.target.value })}
        />
      </div>

      <div>
        <label className="text-2xs uppercase text-cx-fg-dim tracking-widest mb-1.5 block">Platform plane</label>
        <div className="flex flex-wrap gap-2">
          {platformOptions.map((id) => {
            const pt = PLATFORM_TOOLS[id]
            const selected = plan.platformTool === id
            return (
              <button
                key={id}
                type="button"
                onClick={() => updatePlan({ platformTool: id })}
                className={`px-3 py-1.5 rounded-lg border text-xs transition-colors ${
                  selected
                    ? 'border-cx-accent/50 bg-cx-accent/15 text-cx-accent'
                    : 'border-cx-border text-cx-fg-dim'
                }`}
                style={selected ? { color: pt.color, borderColor: `${pt.color}66` } : undefined}
              >
                {pt.name}
              </button>
            )
          })}
        </div>
      </div>

      <div>
        <label className="text-2xs uppercase text-cx-fg-dim tracking-widest mb-1.5 block">Deliverables</label>
        <div className="flex flex-wrap gap-2">
          {plan.deliverables.map((d, i) => (
            <button
              key={d.label}
              type="button"
              onClick={() => toggleDeliverable(i)}
              className={`px-2.5 py-1 rounded-lg border text-[11px] transition-colors ${
                d.selected
                  ? 'border-cx-success/40 bg-cx-success/10 text-cx-success'
                  : 'border-cx-border text-cx-fg-dim'
              }`}
            >
              {d.label}
            </button>
          ))}
        </div>
      </div>

      <p className="text-[10px] text-cx-fg-dim">
        Agents to onboard: {plan.suggestedAgents.join(' · ')}
      </p>
    </div>
  )
}
