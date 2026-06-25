import { motion } from 'framer-motion'
import { Check, Loader2, Circle, AlertTriangle } from 'lucide-react'
import { HARNESS_PIPELINE } from '../../lib/harnessConstants'

const icons = {
  complete: Check,
  active: Loader2,
  pending: Circle,
  warning: AlertTriangle,
}

export function HarnessPipelineLive({ steps, currentStepIndex }) {
  return (
    <div className="space-y-2">
      {HARNESS_PIPELINE.map((def, i) => {
        const step = steps?.[i] ?? { status: 'pending' }
        const status = step.status ?? (i === currentStepIndex ? 'active' : i < currentStepIndex ? 'complete' : 'pending')
        const Icon = icons[status] ?? Circle

        return (
          <motion.div
            key={def.id}
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.04 }}
            className={`flex items-start gap-4 p-3 rounded-xl border transition-colors ${
              status === 'active' ? 'border-cx-accent/40 bg-cx-accent/5' :
              status === 'complete' ? 'border-cx-success/20 bg-cx-success/5' :
              status === 'warning' ? 'border-cx-warn/30 bg-cx-warn/5' :
              'border-cx-border bg-cx-raised/20'
            }`}
          >
            <div className={`w-8 h-8 shrink-0 rounded-lg flex items-center justify-center border ${
              status === 'complete' ? 'border-cx-success/40 text-cx-success' :
              status === 'active' ? 'border-cx-accent/40 text-cx-accent' :
              status === 'warning' ? 'border-cx-warn/40 text-cx-warn' :
              'border-cx-border text-cx-fg-dim'
            }`}>
              <Icon className={`w-4 h-4 ${status === 'active' ? 'animate-spin' : ''}`} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <p className={`text-sm font-medium ${status === 'pending' ? 'text-cx-fg-dim' : 'text-cx-fg'}`}>
                  {def.label}
                </p>
                {step.durationMs != null && (
                  <span className="text-[10px] font-mono text-cx-fg-dim shrink-0">{step.durationMs}ms</span>
                )}
              </div>
              <p className="text-xs text-cx-fg-dim mt-0.5">{def.description}</p>
              {step.output && (
                <p className={`text-xs mt-2 ${status === 'warning' ? 'text-cx-warn' : 'text-cx-accent'}`}>
                  {step.output}
                </p>
              )}
            </div>
          </motion.div>
        )
      })}
    </div>
  )
}
