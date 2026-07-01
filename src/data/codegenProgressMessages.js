/** AI migration copilot — realistic progress narration during code generation */

const THINKING = [
  'Analyzing legacy module boundaries…',
  'Cross-referencing blueprint backlog with scan graph…',
  'Mapping COBOL copybooks to modern DTO shapes…',
  'Inferring domain verbs from CALL chains…',
  'Ranking modules by strangler-facade priority…',
]

export function getCodegenProgressSteps(scan, blueprint, target, scope) {
  const modules = blueprint.backlog?.slice(0, scope === 'scaffold' ? 0 : scope === 'p0' ? 2 : blueprint.backlog.length) ?? []
  const langs = scan.stats?.languages?.join(', ') ?? 'legacy'
  const domain = scan.stats?.domain ?? 'enterprise'

  return [
    {
      phaseId: 'scaffold',
      durationMs: 3200,
      messages: [
        `⟡ Migration Copilot online — target stack: **${target.label}**`,
        `Reading scan manifest: ${scan.stats?.totalFiles ?? 0} files · ${langs}`,
        `Domain context locked: ${domain} · readiness ${scan.migration?.score ?? '—'}/100`,
        `Scaffolding ${target.label} workspace — ${target.tooling?.slice(0, 2).join(', ') ?? 'build tooling'}`,
        `✓ Project root materialized`,
      ],
    },
    {
      phaseId: 'contracts',
      durationMs: 3800,
      messages: [
        'Extracting public boundaries from legacy entry points…',
        'Synthesizing OpenAPI / contract layer for strangler facade',
        `Aligning request/response models with ${domain} semantics`,
        'Validating contract coverage against migration backlog',
        '✓ Shared contracts ready for vertical slices',
      ],
    },
    {
      phaseId: 'modules',
      durationMs: 4200 + modules.length * 1400,
      messages: [
        ...THINKING.slice(0, 2),
        ...modules.flatMap((m, i) => [
          `▸ Module ${i + 1}/${modules.length}: translating **${m.module}** → ${m.targetModule}`,
          `  Porting business surface area (${m.fileCount ?? 1} legacy files) to ${target.label}`,
          `  ✓ ${m.targetModule} — controller, service, and domain types drafted`,
        ]),
        modules.length === 0 ? 'Scope: scaffold only — skipping module bodies' : `✓ ${modules.length} vertical slice(s) generated`,
      ],
    },
    {
      phaseId: 'integration',
      durationMs: 3000,
      messages: [
        'Wiring strangler router between mainframe gateway and new services…',
        'Injecting feature flags for progressive cutover',
        'Binding legacy module map to service discovery routes',
        '✓ Facade layer ready — safe dual-run enabled',
      ],
    },
    {
      phaseId: 'tests',
      durationMs: 3400,
      messages: [
        'Generating parity test stubs from harness backlog…',
        'Linking evaluation dimensions to generated modules',
        'Packaging harness/tasks.json for AI Engineering plane',
        `Finalizing ${target.label} artifact bundle…`,
        '✓ Code generation complete — review & run harness parity',
      ],
    },
  ]
}

export async function runProgressAnimation(steps, onTick) {
  let progress = 0
  const totalMs = steps.reduce((s, step) => s + step.durationMs, 0)
  let elapsed = 0

  for (let si = 0; si < steps.length; si++) {
    const step = steps[si]
    const msgCount = step.messages.length
    const sliceMs = step.durationMs / msgCount

    for (let mi = 0; mi < msgCount; mi++) {
      const jitter = 180 + Math.random() * 320
      await new Promise((r) => setTimeout(r, sliceMs + jitter))
      elapsed += sliceMs + jitter
      progress = Math.min(98, Math.round((elapsed / totalMs) * 100))
      onTick?.({
        phaseId: step.phaseId,
        message: step.messages[mi],
        messageIndex: mi,
        progress,
        thinking: step.messages[mi].includes('…') || step.messages[mi].startsWith('▸'),
      })
    }
  }

  onTick?.({ progress: 100, message: '✓ Migration code ready for review', done: false })
}
