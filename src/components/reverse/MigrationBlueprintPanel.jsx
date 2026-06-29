import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Download, Rocket, Shield, Cpu, AlertTriangle, RefreshCw, Target } from 'lucide-react'
import { GlassPanel } from '../ui/GlassPanel'
import { MigrationScoreRing } from './MigrationScoreRing'
import { getBlueprintExportUrl, regenerateBlueprint } from '../../services/reverseEngineeringApi'
import { logGovernanceAction } from '../../services/governanceService'
import { createInitiativeFromScan } from '../../services/reverseEngineeringService'
import { MIGRATION_TARGET_OPTIONS, suggestTargetFromLanguages } from '../../data/migrationTargets'

export function MigrationBlueprintPanel({ activeScan, onNotify }) {
  const scan = activeScan?.result
  const [targetStack, setTargetStack] = useState(
    () => activeScan?.blueprint?.targetStack ?? suggestTargetFromLanguages(scan?.stats?.languages)
  )
  const [blueprint, setBlueprint] = useState(activeScan?.blueprint)
  const [regenerating, setRegenerating] = useState(false)

  useEffect(() => {
    if (activeScan?.blueprint) {
      setBlueprint(activeScan.blueprint)
      setTargetStack(activeScan.blueprint.targetStack ?? suggestTargetFromLanguages(scan?.stats?.languages))
    }
  }, [activeScan?.id, activeScan?.blueprint, scan?.stats?.languages])

  const handleTargetChange = async (newTarget) => {
    setTargetStack(newTarget)
    if (!activeScan?.id) return
    setRegenerating(true)
    try {
      const updated = await regenerateBlueprint(activeScan.id, newTarget)
      setBlueprint(updated)
      onNotify?.(`Blueprint updated for ${updated.targetLabel}`, 'success')
    } catch (err) {
      onNotify?.(err.message, 'error')
    } finally {
      setRegenerating(false)
    }
  }

  if (!blueprint || !scan) {
    return (
      <GlassPanel className="p-12 text-center text-sm text-cx-fg-dim">
        Complete a scan to generate the migration blueprint.
      </GlassPanel>
    )
  }

  const initiativePayload = createInitiativeFromScan(scan, blueprint)

  const pushToGovernance = () => {
    const critical = scan.findings.filter((f) => f.severity === 'critical' || f.severity === 'high').slice(0, 5)
    critical.forEach((f) => {
      logGovernanceAction({
        action: 're_finding_imported',
        actor: 'Reverse Engineering Studio',
        detail: `${f.label} — ${f.file}:${f.line}`,
        severity: f.severity,
      })
    })
    onNotify?.(`Imported ${critical.length} findings to Governance audit log`, 'success')
  }

  return (
    <div className="space-y-6">
      <GlassPanel hero className="p-5">
        <div className="flex items-center gap-2 mb-3">
          <Target className="w-4 h-4 text-cx-accent" />
          <h4 className="text-sm font-medium text-cx-fg">Migration target technology</h4>
          {regenerating && <RefreshCw className="w-3.5 h-3.5 text-cx-accent animate-spin ml-auto" />}
        </div>
        <p className="text-xs text-cx-fg-dim mb-4">Select the modern stack to migrate into — the platform will regenerate the blueprint, backlog, and phased roadmap.</p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
          {MIGRATION_TARGET_OPTIONS.map((t) => (
            <button
              key={t.id}
              onClick={() => handleTargetChange(t.id)}
              disabled={regenerating}
              className={`text-left p-3 rounded-xl border transition-all ${
                targetStack === t.id
                  ? 'border-cx-accent/50 bg-cx-accent/10 shadow-[0_0_20px_rgba(94,200,242,0.1)]'
                  : 'border-cx-border hover:border-cx-accent/25 bg-cx-panel/40'
              }`}
            >
              <p className="text-xs font-medium text-cx-fg">{t.label}</p>
              <p className="text-2xs text-cx-fg-dim mt-1">{t.description}</p>
            </button>
          ))}
        </div>
      </GlassPanel>

      <div className="grid md:grid-cols-[auto_1fr] gap-6 items-center">
        <MigrationScoreRing score={blueprint.migrationScore} readiness={blueprint.readiness} />
        <div>
          <h3 className="font-display text-lg text-cx-fg">Migration Blueprint → {blueprint.targetLabel}</h3>
          <p className="text-sm text-cx-fg-dim mt-1">{blueprint.targetDescription}</p>
          <p className="text-xs text-cx-fg-dim mt-2">{scan.summary}</p>
          <div className="flex flex-wrap gap-2 mt-4">
            <a
              href={getBlueprintExportUrl(activeScan.id)}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-cx-border text-xs text-cx-fg-muted hover:border-cx-accent/30"
            >
              <Download className="w-3.5 h-3.5" /> Export Markdown
            </a>
            <Link
              to="/initiative"
              state={{ prefill: { ...initiativePayload, domain: blueprint.targetLabel }, openForm: true }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-cx-accent/40 bg-cx-accent/10 text-xs text-cx-accent"
            >
              <Rocket className="w-3.5 h-3.5" /> Create Initiative
            </Link>
            <button onClick={pushToGovernance} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-cx-border text-xs text-cx-fg-muted hover:border-cx-warn/40">
              <Shield className="w-3.5 h-3.5" /> Push risks to Governance
            </button>
            <Link
              to="/onboarding"
              state={{ category: blueprint.agentRecommendations[0]?.category ?? 'ad' }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-cx-border text-xs text-cx-fg-muted hover:border-cx-accent/30"
            >
              <Cpu className="w-3.5 h-3.5" /> Onboard recommended agents
            </Link>
          </div>
        </div>
      </div>

      {blueprint.migrationSteps?.length > 0 && (
        <GlassPanel className="p-5">
          <h4 className="text-xs uppercase tracking-widest text-cx-fg-dim mb-3">Migration path to {blueprint.targetLabel}</h4>
          <div className="grid md:grid-cols-5 gap-3">
            {blueprint.migrationSteps.map((s) => (
              <div key={s.step} className="p-3 rounded-xl border border-cx-border bg-cx-panel/30">
                <span className="text-2xs font-mono text-cx-accent">Step {s.step}</span>
                <p className="text-xs font-medium text-cx-fg mt-1">{s.title}</p>
                <p className="text-2xs text-cx-fg-dim mt-1">{s.detail}</p>
              </div>
            ))}
          </div>
        </GlassPanel>
      )}

      <div className="grid md:grid-cols-2 gap-4">
        <GlassPanel className="p-5">
          <h4 className="text-xs uppercase tracking-widest text-cx-warn mb-3">{blueprint.asIs.label}</h4>
          <p className="text-sm text-cx-fg mb-2">{blueprint.asIs.architecture}</p>
          <p className="text-2xs text-cx-fg-dim mb-2">Stack: {blueprint.asIs.techStack.join(', ')}</p>
          <div className="flex flex-wrap gap-1.5">
            {blueprint.asIs.modules.map((m) => (
              <span key={m} className="text-2xs px-2 py-0.5 rounded border border-cx-border text-cx-fg-dim">{m}</span>
            ))}
          </div>
        </GlassPanel>
        <GlassPanel className="p-5 border-cx-success/20">
          <h4 className="text-xs uppercase tracking-widest text-cx-success mb-3">{blueprint.toBe.label}</h4>
          <p className="text-sm text-cx-fg mb-2">{blueprint.toBe.architecture}</p>
          <p className="text-2xs text-cx-fg-dim mb-2">Stack: {blueprint.toBe.techStack.join(', ')}</p>
          <div className="flex flex-wrap gap-1.5">
            {blueprint.toBe.modules.map((m) => (
              <span key={m} className="text-2xs px-2 py-0.5 rounded border border-cx-success/30 text-cx-success">{m}</span>
            ))}
          </div>
        </GlassPanel>
      </div>

      <div className="space-y-3">
        <h4 className="text-xs uppercase tracking-widest text-cx-fg-dim">Phased roadmap</h4>
        {blueprint.phases.map((phase, idx) => (
          <GlassPanel key={phase.id} className="p-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <span className="text-2xs text-cx-accent font-mono">Phase {idx + 1}</span>
                <h5 className="text-sm font-medium text-cx-fg mt-0.5">{phase.title}</h5>
                <p className="text-2xs text-cx-fg-dim mt-1">{phase.duration}</p>
                <ul className="mt-2 space-y-1">
                  {phase.objectives.map((o) => (
                    <li key={o} className="text-xs text-cx-fg-muted flex items-start gap-2">
                      <ArrowRight className="w-3 h-3 text-cx-accent shrink-0 mt-0.5" /> {o}
                    </li>
                  ))}
                </ul>
              </div>
              <span className={`text-2xs uppercase px-2 py-0.5 rounded border ${phase.status === 'ready' ? 'border-cx-success/40 text-cx-success' : 'border-cx-border text-cx-fg-dim'}`}>
                {phase.status}
              </span>
            </div>
          </GlassPanel>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <GlassPanel className="p-4">
          <h4 className="text-xs uppercase tracking-widest text-cx-fg-dim mb-3 flex items-center gap-2">
            <AlertTriangle className="w-3.5 h-3.5 text-cx-warn" /> Risk register
          </h4>
          <ul className="space-y-2">
            {blueprint.risks.map((r) => (
              <li key={r.id} className="text-xs border-l-2 border-cx-warn/50 pl-3">
                <span className="text-cx-fg">{r.title}</span>
                {r.file && <p className="font-mono text-2xs text-cx-fg-dim mt-0.5">{r.file}:{r.line}</p>}
                <p className="text-2xs text-cx-fg-dim mt-1">{r.mitigation}</p>
              </li>
            ))}
          </ul>
        </GlassPanel>
        <GlassPanel className="p-4">
          <h4 className="text-xs uppercase tracking-widest text-cx-fg-dim mb-3">Migration backlog</h4>
          <ul className="space-y-2">
            {blueprint.backlog.map((b) => (
              <li key={b.id} className="text-xs">
                <span className="font-mono text-cx-accent">{b.priority}</span>{' '}
                <span className="text-cx-fg">{b.module}</span>
                <span className="text-cx-fg-dim"> → </span>
                <span className="text-cx-success">{b.targetModule}</span>
                <span className="text-cx-fg-dim"> · Effort {b.effort}</span>
              </li>
            ))}
          </ul>
          <h4 className="text-xs uppercase tracking-widest text-cx-fg-dim mt-4 mb-2">Recommended agents</h4>
          <ul className="space-y-2">
            {blueprint.agentRecommendations.map((a) => (
              <li key={a.id} className="text-xs text-cx-fg-muted">
                <span className="text-cx-fg">{a.name}</span> — {a.reason}
              </li>
            ))}
          </ul>
        </GlassPanel>
      </div>
    </div>
  )
}
