import { ONBOARDING_STAGES, STAGE_INDEX } from '../../lib/constants'

export function StagePipeline({ currentStageId }) {
  const currentIdx = STAGE_INDEX[currentStageId] ?? 0

  return (
    <div className="flex flex-wrap items-center gap-2">
      {ONBOARDING_STAGES.map((stage, i) => (
        <div key={stage.id} className="flex items-center gap-2">
          <div
            className={`px-3 py-1.5 rounded-lg border text-xs transition-colors ${
              i < currentIdx
                ? 'border-cx-success/40 bg-cx-success/10 text-cx-success'
                : i === currentIdx
                  ? 'border-cx-accent/50 bg-cx-accent/10 text-cx-accent'
                  : 'border-cx-border bg-cx-raised/30 text-cx-fg-dim'
            }`}
          >
            {stage.label}
          </div>
          {i < ONBOARDING_STAGES.length - 1 && (
            <span className="text-cx-fg-dim hidden sm:inline">→</span>
          )}
        </div>
      ))}
    </div>
  )
}
