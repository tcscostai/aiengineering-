import { Link } from 'react-router-dom'
import { Plug } from 'lucide-react'
import { GlassPanel } from '../ui/GlassPanel'
import { PLATFORM_TOOLS } from '../../data/platformTools'

const DOMAIN_PLANES = {
  ad: ['sel', 'are'],
  ams: ['ignio', 'are'],
  qe: ['sel', 'are'],
}

export function DomainPlatformPlanes({ category }) {
  const planeIds = DOMAIN_PLANES[category] ?? []
  const planes = planeIds.map((id) => PLATFORM_TOOLS[id]).filter(Boolean)
  if (!planes.length) return null

  return (
    <GlassPanel className="p-6 mb-6">
      <div className="flex items-center gap-2 mb-4">
        <Plug className="w-4 h-4 text-cx-accent" />
        <p className="text-2xs uppercase text-cx-fg-dim tracking-widest">Enterprise platform planes</p>
      </div>
      <div className="grid md:grid-cols-2 gap-3">
        {planes.map((plane) => (
          <Link
            key={plane.id}
            to="/onboarding"
            state={{ category }}
            className="block p-4 rounded-xl border border-cx-border bg-cx-raised/20 hover:border-cx-accent/40 transition-colors"
          >
            <div className="flex items-center gap-2 mb-1">
              <span
                className="text-sm font-semibold uppercase font-mono"
                style={{ color: plane.color }}
              >
                {plane.name}
              </span>
              <span className="text-[9px] uppercase px-1.5 py-0.5 rounded border border-cx-border text-cx-fg-dim">
                {plane.domains[0]}
              </span>
            </div>
            <p className="text-xs text-cx-fg-dim leading-relaxed">{plane.tagline}</p>
            <p className="text-[10px] text-cx-accent mt-2">Register agent on {plane.name} →</p>
          </Link>
        ))}
      </div>
    </GlassPanel>
  )
}
