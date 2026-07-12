import { Rocket, Play, FlaskConical } from 'lucide-react'
import { GlassPanel } from '../ui/GlassPanel'
import { ProgressBar } from '../ui/ProgressBar'
import { EnterpriseFlowStepList } from './EnterpriseFlowPanel'
import { useFlowNavigate } from '../../hooks/useFlowNavigate'

export function EnterpriseFlowDashboard({ flow, onStartDemo, onStartBenefitsDemo }) {
  const { goToStep, continueFlow } = useFlowNavigate()

  const handleStartDemo = () => {
    onStartDemo()
    window.setTimeout(() => continueFlow(), 0)
  }

  const handleStartBenefitsDemo = () => {
    onStartBenefitsDemo?.()
    window.setTimeout(() => continueFlow(), 0)
  }

  return (
    <GlassPanel hero className="p-6 mb-8">
      <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
        <div>
          <p className="text-2xs uppercase text-cx-accent tracking-widest mb-1">End-to-end engineering flow</p>
          <h2 className="font-display text-lg font-semibold text-cx-fg">
            Workspace → SEL · Ignio · ARE → Engineering → Operations → Reverse Eng
          </h2>
          <p className="text-sm text-cx-fg-dim mt-1 max-w-2xl">
            Guided journey across all platform planes. Reverse engineering runs as a real client-side demo on GitHub Pages; use{' '}
            <code className="text-cx-accent text-xs">npm run dev:full</code> for live scans.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {!flow.active && (
            <>
              <button
                type="button"
                onClick={handleStartDemo}
                className="flex items-center gap-2 px-4 py-2 rounded-xl border border-cx-accent/40 bg-cx-accent/10 text-cx-accent text-sm"
              >
                <Rocket className="w-4 h-4" /> Prior Auth demo
              </button>
              <button
                type="button"
                onClick={handleStartBenefitsDemo}
                className="flex items-center gap-2 px-4 py-2 rounded-xl border border-cx-accent2/40 bg-cx-accent2/10 text-cx-accent2 text-sm"
              >
                <FlaskConical className="w-4 h-4" /> Benefits E2E demo
              </button>
            </>
          )}
          {flow.active && flow.currentStep && (
            <button
              type="button"
              onClick={continueFlow}
              className="flex items-center gap-2 px-4 py-2 rounded-xl border border-cx-success/40 bg-cx-success/10 text-cx-success text-sm"
            >
              <Play className="w-4 h-4" /> Continue flow
            </button>
          )}
        </div>
      </div>

      {flow.active && (
        <>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-cx-fg-dim">
              {flow.workspace?.title ?? 'Workspace'} · {flow.completedCount}/{flow.totalSteps} complete
            </p>
            <p className="font-mono text-sm text-cx-accent">{flow.progress}%</p>
          </div>
          <ProgressBar value={flow.progress} className="mb-4" />
        </>
      )}

      <EnterpriseFlowStepList flow={flow} onGoToStep={goToStep} />
    </GlassPanel>
  )
}
