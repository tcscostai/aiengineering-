import { motion, AnimatePresence } from 'framer-motion'
import { useApp } from '../context/AppContext'
import { GlassPanel } from '../components/ui/GlassPanel'
import { Activity, Zap, Shield } from 'lucide-react'

export function RightDock() {
  const { dockOpen, health, metrics, currentInitiative } = useApp()

  return (
    <AnimatePresence>
      {dockOpen && (
        <motion.aside
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: 320, opacity: 1 }}
          exit={{ width: 0, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 420, damping: 38 }}
          className="shrink-0 h-full border-l border-cx-line bg-cx-deep/90 backdrop-blur-2xl overflow-hidden"
          style={{ boxShadow: 'var(--shadow-dock)' }}
        >
          <div className="w-80 p-4 h-full overflow-y-auto">
            <p className="text-2xs uppercase text-cx-fg-dim tracking-widest mb-1">Mission Control</p>
            <p className="text-xs text-cx-fg-muted mb-4">Live telemetry & status</p>

            <div className="space-y-3">
              <GlassPanel className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Activity className="w-4 h-4 text-cx-accent" />
                  <span className="text-xs font-medium text-cx-fg">System Health</span>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-cx-fg-dim">Score</span>
                    <span className="font-mono text-cx-accent">{health.score}%</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-cx-fg-dim">Running Agents</span>
                    <span className="font-mono text-cx-fg">{metrics.runningAgents}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-cx-fg-dim">Reuse Ratio</span>
                    <span className="font-mono text-cx-success">{health.reuseRatio}%</span>
                  </div>
                </div>
              </GlassPanel>

              <GlassPanel className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Zap className="w-4 h-4 text-cx-accent2" />
                  <span className="text-xs font-medium text-cx-fg">Active Initiative</span>
                </div>
                <p className="text-sm text-cx-fg mb-2">{currentInitiative.title}</p>
                <div className="h-1.5 rounded-full bg-cx-border overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-cx-accent to-cx-accent2 transition-all"
                    style={{ width: `${currentInitiative.progress}%` }}
                  />
                </div>
                <p className="text-2xs text-cx-fg-dim mt-1">{currentInitiative.progress}% complete</p>
              </GlassPanel>

              <GlassPanel className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Shield className="w-4 h-4 text-cx-success" />
                  <span className="text-xs font-medium text-cx-fg">Governance</span>
                </div>
                <p className="text-xs text-cx-fg-dim">
                  {health.governanceCoverage}% coverage · {health.governanceStatus}
                </p>
              </GlassPanel>
            </div>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  )
}
