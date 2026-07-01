import { Link } from 'react-router-dom'
import { ArrowRight, CheckCircle, Circle, Play, Route } from 'lucide-react'
import { FLOW_PHASES, ENTERPRISE_FLOW_STEPS } from '../../data/enterpriseFlowSteps'
import { ProgressBar } from '../ui/ProgressBar'

export function EnterpriseFlowBanner({ flow, onGoToStep, onContinue }) {
  if (!flow?.active || !flow.currentStep) return null
  if (!onContinue) return null

  const phase = FLOW_PHASES[flow.currentStep.phase]

  return (
    <div className="mb-6 p-4 rounded-xl border border-cx-accent/30 bg-gradient-to-r from-cx-accent/10 via-cx-panel/40 to-cx-accent2/5 relative z-20">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1">
            <Route className="w-4 h-4 text-cx-accent shrink-0" />
            <p className="text-2xs uppercase text-cx-accent tracking-widest">Enterprise flow</p>
            {flow.workspace && (
              <span className="text-[10px] text-cx-fg-dim truncate">· {flow.workspace.title}</span>
            )}
            <span
              className="text-[9px] uppercase px-1.5 py-0.5 rounded font-mono"
              style={{ backgroundColor: `${phase?.color ?? '#5ec8f2'}22`, color: phase?.color }}
            >
              {phase?.label}
            </span>
            {flow.currentStep.complete && (
              <span className="text-[9px] uppercase text-cx-success">done</span>
            )}
          </div>
          <p className="text-sm font-medium text-cx-fg">
            Step {ENTERPRISE_FLOW_STEP_INDEX(flow.currentStep.id) + 1} of {flow.totalSteps}: {flow.currentStep.label}
          </p>
          <p className="text-xs text-cx-fg-dim mt-0.5">{flow.currentStep.detail}</p>
          <ProgressBar value={flow.progress} className="mt-2 max-w-md" />
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onContinue}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-cx-accent/40 bg-cx-accent/10 text-cx-accent text-sm hover:bg-cx-accent/20"
          >
            <Play className="w-4 h-4" />
            Continue
            <ArrowRight className="w-4 h-4" />
          </button>
          {onGoToStep && flow.firstIncomplete && flow.firstIncomplete.id !== flow.currentStep.id && (
            <button
              type="button"
              onClick={() => onGoToStep(flow.firstIncomplete.id)}
              className="text-xs text-cx-fg-dim hover:text-cx-accent px-2 py-2"
            >
              Jump to next gap
            </button>
          )}
          <Link to="/" className="text-xs text-cx-fg-dim hover:text-cx-accent px-2 py-2">
            All steps
          </Link>
        </div>
      </div>
    </div>
  )
}

function ENTERPRISE_FLOW_STEP_INDEX(stepId) {
  return ENTERPRISE_FLOW_STEPS.findIndex((s) => s.id === stepId)
}

export function EnterpriseFlowStepList({ flow, onGoToStep }) {
  if (!flow?.steps?.length || !onGoToStep) return null

  return (
    <div className="space-y-2">
      {flow.steps.map((step, i) => {
        const phase = FLOW_PHASES[step.phase]
        const isCurrent = flow.currentStep?.id === step.id
        return (
          <button
            key={step.id}
            type="button"
            onClick={() => onGoToStep(step.id)}
            className={`w-full text-left flex items-start gap-3 p-2.5 rounded-xl border transition-colors cursor-pointer relative z-10 ${
              isCurrent
                ? 'border-cx-accent/50 bg-cx-accent/10'
                : step.complete
                  ? 'border-cx-success/20 bg-cx-success/5'
                  : 'border-cx-border bg-cx-raised/20 hover:border-cx-accent/30'
            }`}
          >
            {step.complete ? (
              <CheckCircle className="w-4 h-4 text-cx-success shrink-0 mt-0.5" />
            ) : (
              <Circle className={`w-4 h-4 shrink-0 mt-0.5 ${isCurrent ? 'text-cx-accent' : 'text-cx-fg-dim'}`} />
            )}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-medium text-cx-fg">{i + 1}. {step.label}</span>
                <span
                  className="text-[9px] uppercase px-1 py-0.5 rounded"
                  style={{ color: phase?.color, backgroundColor: `${phase?.color}18` }}
                >
                  {phase?.label}
                </span>
              </div>
              <p className="text-[10px] text-cx-fg-dim mt-0.5">{step.detail}</p>
            </div>
          </button>
        )
      })}
    </div>
  )
}
