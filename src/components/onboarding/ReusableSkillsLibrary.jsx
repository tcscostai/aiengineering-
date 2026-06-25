import { motion } from 'framer-motion'
import { Recycle, Award } from 'lucide-react'
import { GlassPanel } from '../ui/GlassPanel'

export function ReusableSkillsLibrary({ skills, category }) {
  const filtered = skills.filter(
    (s) => s.certified && (s.categories.includes(category) || category === 'all')
  )

  if (filtered.length === 0) {
    return (
      <GlassPanel className="p-4 mb-6">
        <div className="flex items-center gap-2 mb-2">
          <Recycle className="w-4 h-4 text-cx-accent" />
          <p className="text-xs font-medium text-cx-fg">Enterprise Skill Library</p>
        </div>
        <p className="text-xs text-cx-fg-dim leading-relaxed">
          Publish your first agent to add certified skills here. Future teams can reuse them when onboarding external agents.
        </p>
      </GlassPanel>
    )
  }

  return (
    <GlassPanel className="p-4 mb-6">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Recycle className="w-4 h-4 text-cx-success" />
          <p className="text-xs font-medium text-cx-fg">Enterprise Skill Library</p>
        </div>
        <span className="text-2xs font-mono text-cx-success">{filtered.length} certified</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {filtered.map((skill, i) => (
          <motion.div
            key={skill.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.03 }}
            className="px-3 py-2 rounded-lg border border-cx-success/20 bg-cx-success/5"
          >
            <div className="flex items-center gap-1.5">
              {skill.certified && <Award className="w-3 h-3 text-cx-success" />}
              <span className="text-xs text-cx-fg">{skill.name}</span>
              <span className="text-[10px] font-mono text-cx-success">×{skill.reuseCount ?? 0}</span>
            </div>
            <p className="text-[10px] text-cx-fg-dim mt-0.5">
              from {skill.sourceAgentName || 'agent'} · {skill.sourceProject}
            </p>
          </motion.div>
        ))}
      </div>
    </GlassPanel>
  )
}
