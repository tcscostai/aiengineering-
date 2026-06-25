import { Recycle, Sparkles } from 'lucide-react'

export function SkillsPicker({ catalogSkills, librarySkills, selected, onChange, category }) {
  const reusable = librarySkills.filter(
    (s) => s.certified && (s.categories.includes(category) || s.categories.includes('shared'))
  )
  const catalogOnly = catalogSkills.filter(
    (c) => !reusable.some((r) => r.name.toLowerCase() === c.toLowerCase())
  )

  const toggle = (name) => {
    onChange(selected.includes(name) ? selected.filter((s) => s !== name) : [...selected, name])
  }

  return (
    <div className="space-y-4">
      {reusable.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Recycle className="w-3.5 h-3.5 text-cx-success" />
            <p className="text-2xs uppercase text-cx-success tracking-widest">Enterprise Reusable Skills</p>
          </div>
          <p className="text-xs text-cx-fg-dim mb-2">
            Certified skills from other teams — attach without rebuilding.
          </p>
          <div className="flex flex-wrap gap-2">
            {reusable.map((skill) => (
              <button
                key={skill.id}
                type="button"
                onClick={() => toggle(skill.name)}
                className={`px-3 py-1.5 rounded-lg border text-xs transition-colors ${
                  selected.includes(skill.name)
                    ? 'border-cx-success/50 bg-cx-success/15 text-cx-success'
                    : 'border-cx-success/20 bg-cx-success/5 text-cx-fg-dim hover:text-cx-fg-muted'
                }`}
              >
                {skill.name}
                <span className="ml-1.5 font-mono opacity-70">×{skill.reuseCount ?? 0}</span>
                {skill.sourceProject && (
                  <span className="block text-[10px] opacity-60 mt-0.5">{skill.sourceProject}</span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      <div>
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="w-3.5 h-3.5 text-cx-accent" />
          <p className="text-2xs uppercase text-cx-accent tracking-widest">Category Skill Catalog</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {catalogOnly.map((name) => (
            <button
              key={name}
              type="button"
              onClick={() => toggle(name)}
              className={`px-3 py-1.5 rounded-lg border text-xs transition-colors ${
                selected.includes(name)
                  ? 'border-cx-accent/50 bg-cx-accent/15 text-cx-accent'
                  : 'border-cx-border bg-cx-raised/50 text-cx-fg-dim hover:text-cx-fg-muted'
              }`}
            >
              {name}
            </button>
          ))}
        </div>
      </div>

      {selected.length > 0 && (
        <p className="text-xs text-cx-fg-dim">
          {selected.length} skill(s) selected
          {reusable.some((r) => selected.includes(r.name)) && (
            <span className="text-cx-success ml-1">· includes reused enterprise skills</span>
          )}
        </p>
      )}
    </div>
  )
}
