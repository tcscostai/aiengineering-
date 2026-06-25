import { Wifi } from 'lucide-react'
import { useApp } from '../context/AppContext'

export function StatusStrip() {
  const { health, agentMetrics } = useApp()

  return (
    <footer className="shrink-0 h-9 border-t border-cx-line bg-cx-deep/85 backdrop-blur relative">
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/7 to-transparent" />

      <div className="h-full px-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Wifi className="w-3.5 h-3.5 text-cx-success" strokeWidth={1.75} />
          <span className="text-2xs text-cx-fg">Enterprise AI Fabric</span>
          <span className="text-2xs text-cx-fg-dim">· Connected</span>
        </div>

        <div className="hidden sm:flex items-center gap-4 text-2xs text-cx-fg-dim">
          <span>{agentMetrics.totalAgents} agents onboarded</span>
          <span>{agentMetrics.publishedAgents} published</span>
          <span>Health {health.score || '—'}</span>
        </div>

        <div className="flex items-center gap-4">
          <span className="text-2xs text-cx-fg-dim hidden md:inline">SOC 2 · HIPAA Compliant</span>
          <span className="font-mono text-2xs text-cx-fg-dim">v1.0.0</span>
        </div>
      </div>
    </footer>
  )
}
