import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Bot, ExternalLink, Play } from 'lucide-react'
import { GlassPanel } from '../ui/GlassPanel'
import { CATEGORIES, getRuntimeShort, RUNTIME_TYPES } from '../../lib/constants'
import { PlatformToolBadge } from '../onboarding/PlatformToolBadge'

export function CategoryAgentsPanel({ agents, category }) {
  const cat = CATEGORIES[category]
  const filtered = agents.filter((a) => a.category === category && a.stage !== 'draft')

  if (!filtered.length) return null

  return (
    <GlassPanel className="p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-2xs uppercase tracking-widest mb-1" style={{ color: cat.color }}>
            Onboarded {cat.short} Agents
          </p>
          <h2 className="font-display text-base font-semibold text-cx-fg">
            {filtered.length} agent{filtered.length !== 1 ? 's' : ''} active on this engineering track
          </h2>
        </div>
        <Link
          to="/marketplace"
          className="flex items-center gap-1.5 text-xs text-cx-accent hover:text-cx-accent/80"
        >
          Marketplace <ExternalLink className="w-3 h-3" />
        </Link>
      </div>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
        {filtered.map((agent, i) => (
          <motion.div
            key={agent.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="p-4 rounded-xl border border-cx-border bg-cx-raised/30"
          >
            <div className="flex items-start gap-2 mb-2">
              <Bot className="w-4 h-4 shrink-0 mt-0.5" style={{ color: cat.color }} />
              <div className="min-w-0">
                <p className="text-sm font-medium text-cx-fg truncate">{agent.name}</p>
                <p className="text-xs text-cx-fg-dim">{agent.project}</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-1.5 mb-2">
              <PlatformToolBadge platformTool={agent.platformTool} runtimeType={agent.runtimeType} size="xs" />
              <span
                className="text-[10px] uppercase px-1.5 py-0.5 rounded"
                style={{
                  backgroundColor: `${RUNTIME_TYPES[agent.runtimeType]?.color ?? '#5ec8f2'}20`,
                  color: RUNTIME_TYPES[agent.runtimeType]?.color ?? '#5ec8f2',
                }}
              >
                {getRuntimeShort(agent.runtimeType)}
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded border border-cx-border text-cx-fg-dim">
                {agent.stage === 'published' ? 'Published' : agent.stage.replace(/_/g, ' ')}
              </span>
            </div>
            <p className="text-xs text-cx-fg-dim line-clamp-2 mb-2">{agent.purpose}</p>
            <div className="flex gap-3 text-[10px] text-cx-fg-dim mb-2">
              <span>{agent.skills.length} skills</span>
              <span>Reuse: {agent.reuseCount}</span>
            </div>
            <Link
              to="/harness"
              state={{ category, tab: 'single', agentId: agent.id }}
              className="inline-flex items-center gap-1 text-[10px] text-cx-accent hover:underline"
            >
              <Play className="w-3 h-3" /> Run in Harness
            </Link>
          </motion.div>
        ))}
      </div>
    </GlassPanel>
  )
}
