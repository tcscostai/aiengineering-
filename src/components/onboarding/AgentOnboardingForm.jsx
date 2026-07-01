import { useState, useEffect } from 'react'
import { Save, ArrowRight, Award, AlertCircle, Plug, CheckCircle, Loader2 } from 'lucide-react'
import { GlassPanel } from '../ui/GlassPanel'
import { ProgressBar } from '../ui/ProgressBar'
import { StagePipeline } from './StagePipeline'
import { SkillsPicker } from './SkillsPicker'
import { validateStageAdvance, getStageProgress } from '../../services/agentService'
import { verifyAgentConnection } from '../../services/connectionService'
import { getStageLabel, getNextStage, STAGE_INDEX, RUNTIME_TYPES } from '../../lib/constants'
import { getPlatformTool, getDefaultPlatformTool } from '../../data/platformTools'
import { PlatformHookSelector } from './PlatformHookSelector'
import { PlatformToolBadge } from './PlatformToolBadge'

const PLATFORM_RUNTIMES = new Set(['sel_api', 'ignio_api', 'are_api'])
const EXTERNAL_RUNTIMES = Object.values(RUNTIME_TYPES).filter((rt) => !PLATFORM_RUNTIMES.has(rt.id))

function ChipSelect({ options, selected, onChange, colorClass = 'border-cx-border bg-cx-raised/50' }) {
  const toggle = (item) => {
    onChange(selected.includes(item) ? selected.filter((s) => s !== item) : [...selected, item])
  }
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => (
        <button
          key={opt}
          type="button"
          onClick={() => toggle(opt)}
          className={`px-3 py-1.5 rounded-lg border text-xs transition-colors ${
            selected.includes(opt)
              ? 'border-cx-accent/50 bg-cx-accent/15 text-cx-accent'
              : `${colorClass} text-cx-fg-dim hover:text-cx-fg-muted`
          }`}
        >
          {opt}
        </button>
      ))}
    </div>
  )
}

function Field({ label, required, children, hint }) {
  return (
    <div>
      <label className="block text-2xs uppercase text-cx-fg-dim tracking-widest mb-1.5">
        {label}{required && <span className="text-cx-danger ml-0.5">*</span>}
      </label>
      {children}
      {hint && <p className="text-[10px] text-cx-fg-dim mt-1">{hint}</p>}
    </div>
  )
}

const inputClass =
  'w-full px-3 py-2 rounded-xl border border-cx-border bg-cx-panel/50 text-sm text-cx-fg placeholder:text-cx-fg-dim focus:outline-none focus:border-cx-accent/40'

export function AgentOnboardingForm({ agent, catalog, librarySkills, onSave, onAdvance, onConnectionVerified, workspaceProjects }) {
  const [draft, setDraft] = useState(agent)
  const [errors, setErrors] = useState([])
  const [saved, setSaved] = useState(false)
  const [verifying, setVerifying] = useState(false)

  useEffect(() => {
    setDraft(agent)
    setErrors([])
    setSaved(false)
  }, [agent.id, agent.updatedAt])

  const update = (patch) => {
    setDraft((d) => ({
      ...d,
      ...patch,
      ...(patch.runtimeType !== undefined ||
      patch.sourceLocation !== undefined ||
      patch.entryPoint !== undefined ||
      patch.platformTool !== undefined
        ? { connectionStatus: 'unverified', connectionVerifiedAt: null, connectionMessage: '' }
        : {}),
    }))
    setSaved(false)
  }

  const platformTool = draft.platformTool ?? getDefaultPlatformTool(draft.category)
  const isPlatformHooked = platformTool !== 'external'
  const runtime = RUNTIME_TYPES[draft.runtimeType]
  const runtimeOptions = isPlatformHooked
    ? [RUNTIME_TYPES[getPlatformTool(platformTool).runtimeType]].filter(Boolean)
    : EXTERNAL_RUNTIMES

  const handlePlatformChange = (nextPlatform) => {
    const pt = getPlatformTool(nextPlatform)
    update({
      platformTool: nextPlatform,
      runtimeType: nextPlatform === 'external' ? '' : pt.runtimeType,
      sourceLocation: '',
      entryPoint: '',
      connectionEndpoint: '',
    })
  }

  const handleSave = () => {
    onSave(draft)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const handleVerifyConnection = async () => {
    setVerifying(true)
    setErrors([])
    onSave(draft)
    const result = await verifyAgentConnection(draft)
    setVerifying(false)
    if (result.ok) {
      const updated = onConnectionVerified(draft, result)
      setDraft(updated)
    } else {
      setErrors(result.errors ?? ['Connection verification failed'])
    }
  }

  const handleAdvance = () => {
    onSave(draft)
    const result = onAdvance()
    if (!result.ok) setErrors(result.errors)
    else setErrors([])
  }

  const nextStage = getNextStage(draft.stage)
  const progress = getStageProgress(draft)
  const stageIdx = STAGE_INDEX[draft.stage] ?? 0

  return (
    <div className="space-y-6">
      <GlassPanel className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-2xs uppercase text-cx-fg-dim mb-1">Current Stage</p>
            <h2 className="font-display text-lg font-semibold text-cx-fg">{getStageLabel(draft.stage)}</h2>
          </div>
          <div className="text-right">
            <p className="text-2xs uppercase text-cx-fg-dim">Onboarding Progress</p>
            <p className="font-display text-2xl font-semibold text-cx-accent">{progress}%</p>
          </div>
        </div>
        <ProgressBar value={progress} className="mb-4" />
        <StagePipeline currentStageId={draft.stage} />
      </GlassPanel>

      {errors.length > 0 && (
        <div className="p-4 rounded-xl border border-cx-danger/40 bg-cx-danger/10 flex gap-3">
          <AlertCircle className="w-5 h-5 text-cx-danger shrink-0" />
          <ul className="text-sm text-cx-fg space-y-1">
            {errors.map((e) => (
              <li key={e}>{e}</li>
            ))}
          </ul>
        </div>
      )}

      <GlassPanel hero className="p-6 space-y-5">
        <div>
          <p className="text-2xs uppercase tracking-widest mb-1" style={{ color: catalog.color }}>
            Register External Agent · {catalog.name}
          </p>
          <p className="text-xs text-cx-fg-dim">
            Register agents on SEL, Ignio, ARE, or external runtimes (Python, Bedrock, Foundry, APIs) for enterprise onboarding.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <Field label="Agent Name" required>
            <input className={inputClass} value={draft.name} onChange={(e) => update({ name: e.target.value })} placeholder="e.g. Architecture Review Agent" />
          </Field>
          <Field label="Agent Family">
            <input className={inputClass} value={draft.agentFamily} onChange={(e) => update({ agentFamily: e.target.value })} placeholder="e.g. Design Review, RCA" />
          </Field>
          <Field label="Project" required>
            {workspaceProjects?.length > 0 ? (
              <select
                className={inputClass}
                value={draft.project}
                onChange={(e) => update({ project: e.target.value })}
              >
                <option value="">Select workspace / project</option>
                {workspaceProjects.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            ) : (
              <input className={inputClass} value={draft.project} onChange={(e) => update({ project: e.target.value })} placeholder="e.g. Claims Modernization" />
            )}
          </Field>
          <Field label="Team" required>
            <input className={inputClass} value={draft.team} onChange={(e) => update({ team: e.target.value })} placeholder="e.g. Platform Engineering" />
          </Field>
          <Field label="Owner" required>
            <input className={inputClass} value={draft.owner} onChange={(e) => update({ owner: e.target.value })} placeholder="e.g. James Mitchell" />
          </Field>
          <Field label="Version">
            <input className={inputClass} value={draft.version} onChange={(e) => update({ version: e.target.value })} />
          </Field>
        </div>

        <Field label="Purpose" required>
          <textarea className={`${inputClass} min-h-[80px] resize-y`} value={draft.purpose} onChange={(e) => update({ purpose: e.target.value })} placeholder="What does this external agent do?" />
        </Field>
      </GlassPanel>

      <GlassPanel className="p-6 space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <Plug className="w-4 h-4 text-cx-accent" />
          <p className="text-sm font-medium text-cx-fg">Runtime Connection</p>
          <PlatformToolBadge platformTool={draft.platformTool} runtimeType={draft.runtimeType} />
        </div>

        <PlatformHookSelector
          category={draft.category}
          value={platformTool}
          onChange={handlePlatformChange}
        />

        {!isPlatformHooked && (
          <Field label="Runtime Type" required hint="Where the external agent is built and hosted">
            <div className="flex flex-wrap gap-2">
              {runtimeOptions.map((rt) => (
                <button
                  key={rt.id}
                  type="button"
                  onClick={() => update({ runtimeType: rt.id })}
                  className={`px-3 py-2 rounded-xl border text-xs transition-colors ${
                    draft.runtimeType === rt.id
                      ? 'border-cx-accent/50 bg-cx-accent/15 text-cx-accent'
                      : 'border-cx-border text-cx-fg-dim hover:text-cx-fg-muted'
                  }`}
                >
                  {rt.label}
                </button>
              ))}
            </div>
          </Field>
        )}

        {isPlatformHooked && runtime && (
          <p className="text-xs text-cx-fg-muted">
            Connected via <span style={{ color: runtime.color }}>{runtime.label}</span>
          </p>
        )}

        {runtime && (
          <>
            <Field label={runtime.sourceLabel} required>
              <input className={inputClass} value={draft.sourceLocation} onChange={(e) => update({ sourceLocation: e.target.value })} placeholder={runtime.sourcePlaceholder} />
            </Field>
            <Field label={runtime.entryLabel} required>
              <input className={inputClass} value={draft.entryPoint} onChange={(e) => update({ entryPoint: e.target.value })} placeholder={runtime.entryPlaceholder} />
            </Field>
            <Field label="Health Check URL" hint={isPlatformHooked ? `Optional — defaults to ${getPlatformTool(platformTool).healthPath} on base URL` : 'Optional — validates reachability when accessible'}>
              <input className={inputClass} value={draft.connectionEndpoint} onChange={(e) => update({ connectionEndpoint: e.target.value })} placeholder={runtime.healthPlaceholder} />
            </Field>
          </>
        )}

        <div className="flex items-center gap-3 pt-2">
          <button
            type="button"
            onClick={handleVerifyConnection}
            disabled={verifying || !draft.runtimeType}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-cx-accent/40 bg-cx-accent/10 text-cx-accent text-sm hover:bg-cx-accent/20 disabled:opacity-50"
          >
            {verifying ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plug className="w-4 h-4" />}
            {isPlatformHooked ? `Verify ${getPlatformTool(platformTool).name} Connection` : 'Verify Runtime Connection'}
          </button>
          {draft.connectionStatus === 'verified' && (
            <div className="flex items-center gap-2 text-sm text-cx-success">
              <CheckCircle className="w-4 h-4" />
              <span>{draft.connectionMessage || 'Connected'}</span>
            </div>
          )}
          {draft.connectionStatus === 'failed' && (
            <span className="text-sm text-cx-danger">{draft.connectionMessage}</span>
          )}
        </div>
      </GlassPanel>

      <GlassPanel className="p-6 space-y-4">
        <Field label="Skills" required={stageIdx >= STAGE_INDEX.knowledge_connected} hint="Reuse certified skills from other teams or pick from category catalog">
          <SkillsPicker
            catalogSkills={catalog.skills}
            librarySkills={librarySkills}
            selected={draft.skills}
            onChange={(skills) => update({ skills })}
            category={draft.category}
          />
        </Field>

        <Field label="Enterprise Knowledge Sources" required={stageIdx >= STAGE_INDEX.knowledge_connected}>
          <ChipSelect options={catalog.knowledgeSources} selected={draft.knowledgeSources} onChange={(knowledgeSources) => update({ knowledgeSources })} colorClass="border-cx-accent2/20 bg-cx-accent2/5" />
        </Field>

        <Field label="Connected Tools" required={stageIdx >= STAGE_INDEX.tool_connected}>
          <ChipSelect options={catalog.tools} selected={draft.tools} onChange={(tools) => update({ tools })} colorClass="border-cx-success/20 bg-cx-success/5" />
        </Field>

        <Field label="Workflow Mapping" required={stageIdx >= STAGE_INDEX.workflow_designed}>
          <textarea
            className={`${inputClass} min-h-[100px] resize-y`}
            value={draft.workflowDescription}
            onChange={(e) => update({ workflowDescription: e.target.value })}
            placeholder="How this external agent fits enterprise workflows — triggers, handoffs, outputs..."
          />
        </Field>
      </GlassPanel>

      <GlassPanel className="p-6">
        <p className="text-2xs uppercase text-cx-fg-dim mb-4">Evaluation Dimensions</p>
        <div className="grid md:grid-cols-2 gap-4">
          {catalog.evaluation.map((dim) => (
            <div key={dim}>
              <label className="text-xs text-cx-fg-muted mb-1 block">{dim}</label>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={draft.evaluation[dim] ?? 0}
                  onChange={(e) =>
                    update({ evaluation: { ...draft.evaluation, [dim]: Number(e.target.value) } })
                  }
                  className="flex-1 accent-cx-accent"
                />
                <span className="font-mono text-sm text-cx-accent w-10 text-right">
                  {draft.evaluation[dim] ?? '—'}{draft.evaluation[dim] != null ? '%' : ''}
                </span>
              </div>
            </div>
          ))}
        </div>
      </GlassPanel>

      <GlassPanel className="p-6">
        <p className="text-2xs uppercase text-cx-fg-dim mb-4">Governance & Certification</p>
        <div className="grid md:grid-cols-2 gap-4">
          <Field label="Approver" required={stageIdx >= STAGE_INDEX.governance_approved}>
            <input className={inputClass} value={draft.governanceApprover} onChange={(e) => update({ governanceApprover: e.target.value })} placeholder="Compliance board or engineering lead" />
          </Field>
          <div className="flex items-end">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={draft.governanceApproved}
                onChange={(e) => update({ governanceApproved: e.target.checked })}
                className="rounded border-cx-border accent-cx-accent"
              />
              <span className="text-sm text-cx-fg-muted">Governance approval granted</span>
            </label>
          </div>
        </div>
      </GlassPanel>

      <div className="flex flex-wrap gap-3">
        <button
          onClick={handleSave}
          className="flex items-center gap-2 px-4 py-2 rounded-xl border border-cx-border bg-white/[0.03] text-sm text-cx-fg hover:border-cx-border-strong"
        >
          <Save className="w-4 h-4" />
          {saved ? 'Saved' : 'Save Registration'}
        </button>

        {nextStage && (
          <button
            onClick={handleAdvance}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-cx-accent/40 bg-cx-accent/10 text-cx-accent text-sm hover:bg-cx-accent/20"
          >
            Advance to {getStageLabel(nextStage)}
            <ArrowRight className="w-4 h-4" />
          </button>
        )}

        {draft.stage === 'published' && (
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl border border-cx-success/40 bg-cx-success/10 text-cx-success text-sm">
            <Award className="w-4 h-4" />
            Published — skills added to enterprise library for reuse
          </div>
        )}
      </div>
    </div>
  )
}
