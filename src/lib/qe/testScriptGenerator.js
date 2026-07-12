import { BENEFITS_SCENARIOS, getScenariosForSuite, SCRIPT_FRAMEWORKS } from '../../data/benefitsScenario'

export const SCRIPT_CODEGEN_PHASES = [
  { id: 'scaffold', label: 'Project scaffold', detail: 'Config, fixtures, page objects' },
  { id: 'scenarios', label: 'Test scenarios', detail: 'Data-driven cases from benefits catalog' },
  { id: 'scripts', label: 'Functional scripts', detail: 'Playwright / Selenium test files' },
  { id: 'ci', label: 'CI integration', detail: 'Pipeline config and reporting hooks' },
]

function slugify(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

function generatePlaywrightTs(scenarios, suiteId) {
  const files = []
  const suiteSlug = slugify(suiteId)

  files.push({
    path: 'playwright.config.ts',
    phase: 'scaffold',
    content: `import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: [['html'], ['junit', { outputFile: 'results/junit.xml' }]],
  use: {
    baseURL: process.env.BENEFITS_BASE_URL ?? 'https://member-portal.demo.local',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [{ name: 'chromium', use: { channel: 'chrome' } }],
})
`,
  })

  files.push({
    path: 'tests/fixtures/benefits-data.ts',
    phase: 'scaffold',
    content: `/** Synthetic member data — no real PHI */
export const MEMBERS = {
  hmoActive: { id: 'SYN-MBR-1001', plan: 'HMO-Gold', lob: 'medical', network: 'in-network' },
  ppoFamily: { id: 'SYN-MBR-1002', plan: 'PPO-Plus', lob: 'medical', network: 'in-network' },
  hdhpIndividual: { id: 'SYN-MBR-1003', plan: 'HDHP-Basic', lob: 'medical', deductibleMet: 1200 },
}

export const EXPECTED = {
  hmoPrimaryCopay: 25,
  ppoSpecialistCoinsurance: 0.2,
  hdhpDeductible: 3000,
}
`,
  })

  files.push({
    path: 'tests/pages/BenefitsSummaryPage.ts',
    phase: 'scaffold',
    content: `import { Page, Locator } from '@playwright/test'

export class BenefitsSummaryPage {
  readonly page: Page
  readonly heading: Locator
  readonly copayRow: Locator
  readonly deductibleRow: Locator
  readonly pharmacyTier: Locator

  constructor(page: Page) {
    this.page = page
    this.heading = page.getByRole('heading', { name: /benefits summary/i })
    this.copayRow = page.getByTestId('copay-primary-care')
    this.deductibleRow = page.getByTestId('deductible-remaining')
    this.pharmacyTier = page.getByTestId('pharmacy-tier')
  }

  async goto(memberId: string) {
    await this.page.goto(\`/member/\${memberId}/benefits\`)
    await this.heading.waitFor()
  }
}
`,
  })

  scenarios.forEach((scenario) => {
    const slug = slugify(scenario.name)
    files.push({
      path: `tests/${suiteSlug}/${slug}.spec.ts`,
      phase: 'scripts',
      module: scenario.category,
      content: `import { test, expect } from '@playwright/test'
import { BenefitsSummaryPage } from '../pages/BenefitsSummaryPage'
import { MEMBERS, EXPECTED } from '../fixtures/benefits-data'

/** ${scenario.name} — ${scenario.priority} · ${scenario.planTypes.join('/')} */
test.describe('${scenario.name}', () => {
  test('validates benefit rules for ${scenario.lob}', async ({ page }) => {
    const benefits = new BenefitsSummaryPage(page)
    const member = MEMBERS.hmoActive

    await benefits.goto(member.id)
    await expect(benefits.heading).toBeVisible()

${scenario.assertions.map((a) => {
  const [key, val] = a.split('=')
  if (key.includes('copay')) return `    await expect(benefits.copayRow).toContainText(String(EXPECTED.hmoPrimaryCopay))`
  if (key.includes('deductible')) return `    await expect(benefits.deductibleRow).toBeVisible()`
  if (key.includes('tier')) return `    await expect(benefits.pharmacyTier).toBeVisible()`
  return `    // Assert: ${a}`
}).join('\n')}

    // Traceability: scenario ${scenario.id}
    await page.screenshot({ path: \`results/${scenario.id}.png\`, fullPage: true })
  })
})
`,
    })
  })

  files.push({
    path: '.github/workflows/benefits-tests.yml',
    phase: 'ci',
    content: `name: Benefits Test Suite
on:
  push:
    branches: [main, release/*]
  pull_request:
jobs:
  playwright:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 22 }
      - run: npm ci && npx playwright install --with-deps
      - run: npx playwright test tests/${suiteSlug}
        env:
          BENEFITS_BASE_URL: \${{ vars.BENEFITS_STAGING_URL }}
      - uses: actions/upload-artifact@v4
        if: always()
        with:
          name: playwright-report
          path: playwright-report/
`,
  })

  return files
}

function generateSeleniumJava(scenarios, suiteId) {
  const files = []
  const pkg = 'com.tcs.benefits.tests'
  const suiteSlug = slugify(suiteId)

  files.push({
    path: 'pom.xml',
    phase: 'scaffold',
    content: `<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0">
  <modelVersion>4.0.0</modelVersion>
  <groupId>${pkg}</groupId>
  <artifactId>benefits-${suiteSlug}</artifactId>
  <version>1.0.0-SNAPSHOT</version>
  <properties>
    <maven.compiler.source>21</maven.compiler.source>
    <selenium.version>4.27.0</selenium.version>
    <junit.version>5.11.0</junit.version>
  </properties>
  <dependencies>
    <dependency>
      <groupId>org.seleniumhq.selenium</groupId>
      <artifactId>selenium-java</artifactId>
      <version>\${selenium.version}</version>
    </dependency>
    <dependency>
      <groupId>org.junit.jupiter</groupId>
      <artifactId>junit-jupiter</artifactId>
      <version>\${junit.version}</version>
      <scope>test</scope>
    </dependency>
  </dependencies>
</project>`,
  })

  files.push({
    path: `src/test/java/${pkg.replace(/\./g, '/')}/pages/BenefitsSummaryPage.java`,
    phase: 'scaffold',
    content: `package ${pkg}.pages;

import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.support.ui.WebDriverWait;
import java.time.Duration;

public class BenefitsSummaryPage {
  private final WebDriver driver;
  private final WebDriverWait wait;

  public BenefitsSummaryPage(WebDriver driver) {
    this.driver = driver;
    this.wait = new WebDriverWait(driver, Duration.ofSeconds(15));
  }

  public void open(String memberId) {
    driver.get(System.getenv().getOrDefault("BENEFITS_BASE_URL", "https://member-portal.demo.local")
        + "/member/" + memberId + "/benefits");
    wait.until(d -> d.findElement(By.cssSelector("[data-testid='benefits-summary']")).isDisplayed());
  }

  public String getCopayText() {
    return driver.findElement(By.cssSelector("[data-testid='copay-primary-care']")).getText();
  }
}
`,
  })

  scenarios.forEach((scenario) => {
    const cls = scenario.id.split('-').map((s) => s.charAt(0).toUpperCase() + s.slice(1)).join('')
    files.push({
      path: `src/test/java/${pkg.replace(/\./g, '/')}/${cls}Test.java`,
      phase: 'scripts',
      module: scenario.category,
      content: `package ${pkg};

import ${pkg}.pages.BenefitsSummaryPage;
import org.junit.jupiter.api.*;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.chrome.ChromeDriver;
import static org.junit.jupiter.api.Assertions.*;

/** ${scenario.name} — scenario ${scenario.id} */
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
class ${cls}Test {
  private WebDriver driver;

  @BeforeEach
  void setUp() {
    driver = new ChromeDriver();
  }

  @AfterEach
  void tearDown() {
    if (driver != null) driver.quit();
  }

  @Test
  @Order(1)
  void validatesBenefitRules() {
    BenefitsSummaryPage page = new BenefitsSummaryPage(driver);
    page.open("SYN-MBR-1001");
    assertFalse(page.getCopayText().isBlank(), "Copay should be displayed");
    // Assertions: ${scenario.assertions.join(', ')}
  }
}
`,
    })
  })

  return files
}

function generateCypress(scenarios, suiteId) {
  const suiteSlug = slugify(suiteId)
  const files = []

  files.push({
    path: 'cypress.config.js',
    phase: 'scaffold',
    content: `module.exports = {
  e2e: {
    baseUrl: process.env.BENEFITS_BASE_URL || 'https://member-portal.demo.local',
    specPattern: 'cypress/e2e/**/*.cy.js',
    supportFile: 'cypress/support/e2e.js',
  },
}
`,
  })

  scenarios.forEach((scenario) => {
    files.push({
      path: `cypress/e2e/${suiteSlug}/${slugify(scenario.name)}.cy.js`,
      phase: 'scripts',
      content: `/** ${scenario.name} — ${scenario.id} */
describe('${scenario.name}', () => {
  beforeEach(() => {
    cy.visit('/member/SYN-MBR-1001/benefits')
  })

  it('validates ${scenario.lob} benefit rules (${scenario.planTypes.join('/')})', () => {
    cy.get('[data-testid="benefits-summary"]').should('be.visible')
${scenario.assertions.map((a) => `    // Assert: ${a}`).join('\n')}
    cy.screenshot('${scenario.id}')
  })
})
`,
    })
  })

  return files
}

function generatePlaywrightPy(scenarios, suiteId) {
  const suiteSlug = slugify(suiteId)
  const files = []

  files.push({
    path: 'pytest.ini',
    phase: 'scaffold',
    content: `[pytest]
testpaths = tests
addopts = -v --tb=short
`,
  })

  files.push({
    path: 'tests/conftest.py',
    phase: 'scaffold',
    content: `import os
import pytest
from playwright.sync_api import sync_playwright

@pytest.fixture(scope="session")
def browser():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        yield browser
        browser.close()

@pytest.fixture
def page(browser):
    context = browser.new_context(base_url=os.getenv("BENEFITS_BASE_URL", "https://member-portal.demo.local"))
    page = context.new_page()
    yield page
    context.close()
`,
  })

  scenarios.forEach((scenario) => {
    files.push({
      path: `tests/${suiteSlug}/test_${scenario.id.replace(/-/g, '_')}.py`,
      phase: 'scripts',
      content: `"""${scenario.name} — scenario ${scenario.id}"""

def test_${scenario.id.replace(/-/g, '_')}(page):
    page.goto("/member/SYN-MBR-1001/benefits")
    page.get_by_test_id("benefits-summary").wait_for()
${scenario.assertions.map((a) => `    # Assert: ${a}`).join('\n')}
    page.screenshot(path=f"results/{scenario.id}.png")
`,
    })
  })

  return files
}

function generateSeleniumPy(scenarios, suiteId) {
  const suiteSlug = slugify(suiteId)
  const files = []

  files.push({
    path: 'requirements.txt',
    phase: 'scaffold',
    content: `selenium>=4.27.0
pytest>=8.0.0
webdriver-manager>=4.0.0
`,
  })

  scenarios.forEach((scenario) => {
    files.push({
      path: `tests/${suiteSlug}/test_${scenario.id.replace(/-/g, '_')}.py`,
      phase: 'scripts',
      content: `"""${scenario.name} — ${scenario.id}"""
import os
import pytest
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

@pytest.fixture
def driver():
    d = webdriver.Chrome()
    d.get(os.getenv("BENEFITS_BASE_URL", "https://member-portal.demo.local") + "/member/SYN-MBR-1001/benefits")
    yield d
    d.quit()

def test_${scenario.id.replace(/-/g, '_')}(driver):
    WebDriverWait(driver, 15).until(
        EC.visibility_of_element_located((By.CSS_SELECTOR, "[data-testid='benefits-summary']"))
    )
${scenario.assertions.map((a) => `    # Assert: ${a}`).join('\n')}
`,
    })
  })

  return files
}

function generateReadme(framework, suiteId, scenarios) {
  const fw = SCRIPT_FRAMEWORKS.find((f) => f.id === framework)
  return {
    path: 'README.md',
    phase: 'scaffold',
    content: `# Benefits Test Automation — ${suiteId}

Generated by TCS AI Engineering Studio · Automation Script Generation Agent.

## Framework
- **Tool:** ${fw?.label ?? framework}
- **Language:** ${fw?.language ?? '—'}
- **Run:** \`${fw?.runner ?? 'see package docs'}\`

## Scenarios (${scenarios.length})
${scenarios.map((s) => `- **${s.name}** (\`${s.id}\`) — ${s.planTypes.join(', ')} · ${s.priority}`).join('\n')}

## Coverage targets
| Metric | Target |
|--------|--------|
| Design coverage | ≥95% requirements traced |
| Automation coverage | ≥90% scenarios scripted |
| Benefit accuracy | ≥99% on golden paths |

## Notes
- All member IDs are synthetic (SYN-MBR-*)
- No real PHI in fixtures or screenshots
- Link scripts to requirements in Knowledge Fabric for audit trail
`,
  }
}

export function generateTestScripts(options = {}) {
  const {
    framework = 'playwright-ts',
    suiteId = 'regression',
    scenarios: scenarioOverride,
  } = options

  const scenarios = scenarioOverride ?? getScenariosForSuite(suiteId)
  let files = []

  switch (framework) {
    case 'playwright-ts':
      files = generatePlaywrightTs(scenarios, suiteId)
      break
    case 'playwright-py':
      files = generatePlaywrightPy(scenarios, suiteId)
      break
    case 'selenium-java':
      files = generateSeleniumJava(scenarios, suiteId)
      break
    case 'selenium-py':
      files = generateSeleniumPy(scenarios, suiteId)
      break
    case 'cypress':
      files = generateCypress(scenarios, suiteId)
      break
    default:
      files = generatePlaywrightTs(scenarios, suiteId)
  }

  files.unshift(generateReadme(framework, suiteId, scenarios))

  const phaseResults = SCRIPT_CODEGEN_PHASES.map((phase) => ({
    ...phase,
    fileCount: files.filter((f) => f.phase === phase.id).length,
    complete: files.some((f) => f.phase === phase.id),
  }))

  return {
    framework,
    suiteId,
    scenarios: scenarios.map((s) => s.id),
    phases: SCRIPT_CODEGEN_PHASES,
    phaseResults,
    files,
    summary: {
      totalFiles: files.length,
      totalScenarios: scenarios.length,
      frameworks: SCRIPT_FRAMEWORKS.map((f) => f.id),
      estimatedCoverage: Math.min(95, 72 + scenarios.length * 2),
      runnable: true,
    },
  }
}

export function getScriptCodegenPhases() {
  return SCRIPT_CODEGEN_PHASES
}

export function buildScriptBundleZipContent(result) {
  const header = `# TCS Benefits Test Script Bundle
# Framework: ${result.framework}
# Suite: ${result.suiteId}
# Files: ${result.files.length}
# Generated: ${new Date().toISOString()}
`
  return header + result.files.map((f) => `\n--- ${f.path} ---\n${f.content}`).join('\n')
}
