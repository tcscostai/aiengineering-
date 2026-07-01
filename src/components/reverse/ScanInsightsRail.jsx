import { GlassPanel } from '../ui/GlassPanel'
import { MetricCard } from '../ui/MetricCard'
import { MigrationScoreRing } from './MigrationScoreRing'
import { FileCode, Layers, AlertTriangle, Clock } from 'lucide-react'

function dedupeHistory(history) {
  const seen = new Set()
  return history.filter((h) => {
    if (seen.has(h.id)) return false
    seen.add(h.id)
    return true
  })
}

export function ScanInsightsRail({ scan, history = [], onSelectHistory }) {
  if (!scan?.result) {
    return (
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        <MetricCard label="Files indexed" value="—" icon={FileCode} />
        <MetricCard label="Languages" value="—" icon={Layers} />
        <MetricCard label="Findings" value="—" icon={AlertTriangle} />
        <MetricCard label="Domain" value="—" icon={Clock} />
      </div>
    )
  }

  const r = scan.result
  const recent = dedupeHistory(history).slice(0, 5)

  return (
    <div className="mb-4">
      <div className="grid lg:grid-cols-[1fr_auto] gap-4 items-start">
        <div className="space-y-3 min-w-0">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <MetricCard label="Files indexed" value={r.stats.totalFiles} icon={FileCode} />
            <MetricCard
              label="Languages"
              value={r.stats.languages.slice(0, 2).join(', ') || '—'}
              suffix={r.stats.languages.length > 2 ? `+${r.stats.languages.length - 2}` : ''}
              icon={Layers}
            />
            <MetricCard
              label="Findings"
              value={r.findings.length}
              icon={AlertTriangle}
              trend={r.findings.some((f) => f.severity === 'critical') ? -1 : 0}
            />
            <MetricCard label="Domain signal" value={r.stats.domain} icon={Clock} />
          </div>

          {recent.length > 0 && (
            <GlassPanel className="p-3">
              <p className="text-2xs uppercase tracking-widest text-cx-fg-dim mb-2">Recent scans</p>
              <div className="flex flex-wrap gap-2">
                {recent.map((h) => (
                  <button
                    key={h.id}
                    type="button"
                    onClick={() => onSelectHistory?.(h.id)}
                    className="text-2xs px-2.5 py-1.5 rounded-lg border border-cx-border hover:border-cx-accent/30 text-cx-fg-dim hover:text-cx-accent"
                  >
                    {h.sourceLabel} · {h.migrationScore ?? '—'}
                  </button>
                ))}
              </div>
            </GlassPanel>
          )}
        </div>

        <div className="shrink-0 flex justify-center lg:justify-end">
          <MigrationScoreRing score={r.migration.score} readiness={r.migration.readiness} size={96} />
        </div>
      </div>
    </div>
  )
}
