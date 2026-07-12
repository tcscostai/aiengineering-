/** Progress narration for benefits test script generation pipeline */

export function getScriptCodegenMessages(phase, context = {}) {
  const { framework = 'playwright-ts', suiteId = 'regression', scenarioCount = 6 } = context
  const fwLabel = framework.replace('-', ' ').replace(/\b\w/g, (c) => c.toUpperCase())

  const byPhase = {
    scaffold: [
      `Initializing ${fwLabel} project scaffold for suite "${suiteId}"`,
      'Creating synthetic member fixtures (no real PHI)',
      'Generating Page Object Model — BenefitsSummaryPage',
      'Writing test configuration and environment hooks',
    ],
    scenarios: [
      `Loading ${scenarioCount} benefit scenarios from healthcare catalog`,
      'Mapping HMO / PPO / EPO / HDHP plan-type matrix',
      'Binding assertions to copay, deductible, and formulary rules',
      'Linking scenarios to requirements traceability IDs',
    ],
    scripts: [
      `Generating functional test scripts (${fwLabel})`,
      'Writing data-driven test cases with golden-path assertions',
      'Adding eligibility and accumulator validation steps',
      'Including Life Sciences formulary & specialty drug scenarios',
    ],
    ci: [
      'Packaging CI workflow — GitHub Actions pipeline stub',
      'Configuring JUnit / HTML reporting hooks',
      'Adding screenshot capture on failure for audit trail',
      'Validating script bundle compile readiness',
    ],
  }

  return byPhase[phase.id] ?? [`Processing ${phase.label}…`]
}

export const SCRIPT_PIPELINE_DELAYS = {
  scaffold: 900,
  scenarios: 1100,
  scripts: 1400,
  ci: 700,
}
