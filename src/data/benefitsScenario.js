/** Healthcare & Life Sciences benefits testing scenario catalog */

export const BENEFITS_PLAN_TYPES = ['HMO', 'PPO', 'EPO', 'HDHP']

export const BENEFITS_LINES_OF_BUSINESS = [
  { id: 'medical', label: 'Medical', icon: 'stethoscope' },
  { id: 'pharmacy', label: 'Pharmacy / PBM', icon: 'pill' },
  { id: 'dental', label: 'Dental', icon: 'smile' },
  { id: 'vision', label: 'Vision', icon: 'eye' },
  { id: 'specialty', label: 'Specialty / Life Sciences', icon: 'flask' },
]

export const BENEFITS_TEST_PYRAMID = [
  { id: 'unit', label: 'Plan Rule Engine', layer: 'L1', description: 'Copay tiers, age bands, network flags, accumulator math' },
  { id: 'api', label: 'Benefits & Eligibility APIs', layer: 'L2', description: 'FHIR Coverage/Benefit, 270/271, benefits inquiry REST' },
  { id: 'integration', label: 'Accumulator + Inquiry + Auth', layer: 'L3', description: 'Cross-service member journey with auth impact' },
  { id: 'e2e', label: 'Member Portal E2E', layer: 'L4', description: 'Login → benefits summary → cost estimator → EOB' },
  { id: 'nfr', label: 'Performance & Resilience', layer: 'L5', description: 'Open enrollment peak, cache invalidation, plan year rollover' },
  { id: 'compliance', label: 'HIPAA & Audit', layer: 'L6', description: 'PHI masking, audit trail, regulatory traceability' },
  { id: 'lifesciences', label: 'Formulary & Specialty', layer: 'L7', description: 'Step therapy, REMS, CSV evidence pack' },
]

export const BENEFITS_SCENARIOS = [
  {
    id: 'eligibility-active',
    name: 'Active member eligibility',
    category: 'eligibility',
    planTypes: ['HMO', 'PPO', 'EPO'],
    lob: 'medical',
    priority: 'P0',
    assertions: ['coverageStatus=active', 'planYear=current', 'network=in-network'],
  },
  {
    id: 'eligibility-cob',
    name: 'Coordination of benefits (COB)',
    category: 'eligibility',
    planTypes: ['PPO', 'HDHP'],
    lob: 'medical',
    priority: 'P1',
    assertions: ['primaryPayer=identified', 'secondaryPayer=mapped', 'COB-order=correct'],
  },
  {
    id: 'benefits-inquiry-hmo',
    name: 'Benefits inquiry — HMO medical',
    category: 'inquiry',
    planTypes: ['HMO'],
    lob: 'medical',
    priority: 'P0',
    assertions: ['copay=primaryCare', 'referralRequired=true', 'deductible=individual'],
  },
  {
    id: 'benefits-inquiry-ppo',
    name: 'Benefits inquiry — PPO medical',
    category: 'inquiry',
    planTypes: ['PPO'],
    lob: 'medical',
    priority: 'P0',
    assertions: ['copay=specialist', 'coinsurance=20%', 'oopMax=family'],
  },
  {
    id: 'accumulator-deductible',
    name: 'Individual deductible accumulator',
    category: 'accumulator',
    planTypes: ['HDHP', 'PPO'],
    lob: 'medical',
    priority: 'P0',
    assertions: ['deductibleMet=partial', 'remainingDeductible=calculated', 'oopApplied=correct'],
  },
  {
    id: 'accumulator-plan-year',
    name: 'Plan year rollover reset',
    category: 'accumulator',
    planTypes: ['HMO', 'PPO', 'EPO', 'HDHP'],
    lob: 'medical',
    priority: 'P1',
    assertions: ['deductibleReset=true', 'oopReset=true', 'effectiveDate=newPlanYear'],
  },
  {
    id: 'pharmacy-formulary-tier',
    name: 'Formulary tier change regression',
    category: 'pharmacy',
    planTypes: ['PPO', 'HDHP'],
    lob: 'pharmacy',
    priority: 'P0',
    assertions: ['tier=updated', 'copay=pharmacyTier', 'stepTherapy=evaluated'],
  },
  {
    id: 'pharmacy-specialty-rems',
    name: 'Specialty drug REMS validation',
    category: 'lifesciences',
    planTypes: ['PPO'],
    lob: 'specialty',
    priority: 'P1',
    assertions: ['remsEnrolled=true', 'limitedDistribution=verified', 'hubServices=linked'],
  },
  {
    id: 'prior-auth-benefit-impact',
    name: 'Prior auth impact on benefit coverage',
    category: 'integration',
    planTypes: ['HMO', 'PPO'],
    lob: 'medical',
    priority: 'P0',
    assertions: ['authRequired=service', 'coveredWhenApproved=true', 'memberCost=postAuth'],
  },
  {
    id: 'eob-line-accuracy',
    name: 'EOB line-level benefit explanation',
    category: 'e2e',
    planTypes: ['PPO', 'EPO'],
    lob: 'medical',
    priority: 'P1',
    assertions: ['allowedAmount=correct', 'memberResponsibility=correct', 'benefitCode=mapped'],
  },
]

export const SCRIPT_FRAMEWORKS = [
  { id: 'playwright-ts', label: 'Playwright', language: 'TypeScript', ext: '.spec.ts', runner: 'npx playwright test' },
  { id: 'playwright-py', label: 'Playwright', language: 'Python', ext: '.py', runner: 'pytest tests/' },
  { id: 'selenium-java', label: 'Selenium', language: 'Java', ext: 'Test.java', runner: 'mvn test' },
  { id: 'selenium-py', label: 'Selenium', language: 'Python', ext: '_test.py', runner: 'pytest -v' },
  { id: 'cypress', label: 'Cypress', language: 'JavaScript', ext: '.cy.js', runner: 'npx cypress run' },
]

export const BENEFITS_WORKSPACE_PRESET = {
  id: 'demo_init_benefits',
  title: 'Benefits Administration & Validation',
  description:
    'End-to-end benefits testing for Healthcare and Life Sciences — eligibility, cost-share, formulary, automation script generation, and release quality gates.',
  industry: 'Healthcare',
  domain: 'Healthcare & Life Sciences',
  businessObjective: '≥90% automation coverage with auditable benefit accuracy across HMO/PPO/EPO/HDHP plan types',
  stakeholders: 'VP Benefits Operations, QE Director, Chief Pharmacy Officer, Privacy Officer',
}

export function getScenariosForSuite(suiteId) {
  const map = {
    unit: ['accumulator-deductible', 'accumulator-plan-year'],
    api: ['eligibility-active', 'eligibility-cob', 'benefits-inquiry-hmo', 'benefits-inquiry-ppo'],
    integration: ['prior-auth-benefit-impact', 'accumulator-deductible'],
    e2e: ['eob-line-accuracy', 'benefits-inquiry-hmo', 'benefits-inquiry-ppo'],
    nfr: ['accumulator-plan-year'],
    compliance: ['eligibility-active'],
    lifesciences: ['pharmacy-formulary-tier', 'pharmacy-specialty-rems'],
    eligibility: ['eligibility-active', 'eligibility-cob'],
    inquiry: ['benefits-inquiry-hmo', 'benefits-inquiry-ppo'],
    pharmacy: ['pharmacy-formulary-tier'],
    regression: BENEFITS_SCENARIOS.filter((s) => s.priority === 'P0').map((s) => s.id),
    functional: BENEFITS_SCENARIOS.map((s) => s.id),
  }
  const ids = map[suiteId] ?? map.regression
  return BENEFITS_SCENARIOS.filter((s) => ids.includes(s.id))
}
