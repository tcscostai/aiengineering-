# End-to-End Enterprise Flow — User Walkthrough

Complete the full **Workspace → SEL · Ignio · ARE → Engineering → Operations → Reverse Engineering** journey in Horizon with the sample values below.

**Live demo:** [https://tcscostai.github.io/aiengineering-/](https://tcscostai.github.io/aiengineering-/)  
**Local:** `npm run dev:full` → [http://localhost:5173](http://localhost:5173)

---

## Before you start

| Item | Value |
|------|--------|
| Login username | Any name (e.g. `Demo User`) |
| Login password | Your platform password |
| Scenario | **Prior Authorization Automation** (Healthcare) |
| Domains | AD + AMS + QE |
| Platforms | SEL (AD & QE), Ignio (AMS), ARE (AMS) |

### Start the guided flow

1. Sign in → land on **Executive Dashboard**.
2. Click **Start demo flow** (or use **Continue** in the top banner).
3. Use **Continue** in the banner to advance step-by-step, or click any step in the flow panel.
4. If the flow feels stuck, reset in the browser console:

```js
localStorage.removeItem('horizon_enterprise_flow')
```

Then refresh and click **Start demo flow** again.

---

## Flow overview (12 steps)

| # | Step | Route | Platform |
|---|------|-------|----------|
| 1 | Create workspace | `/workspace` | — |
| 2 | Onboard SEL agent (AD) | `/onboarding` | SEL |
| 3 | Onboard Ignio agent (AMS) | `/onboarding` | Ignio |
| 4 | Onboard ARE agent (AMS) | `/onboarding` | ARE |
| 5 | Onboard SEL agent (QE) | `/onboarding` | SEL |
| 6 | AD engineering | `/ad` | SEL |
| 7 | AMS engineering | `/ams` | Ignio / ARE |
| 8 | QE engineering | `/qe` | SEL |
| 9 | Evaluation center | `/evaluation` | All |
| 10 | Governance approval | `/governance` | All |
| 11 | Runtime deploy | `/runtime` | All |
| 12 | Reverse engineering | `/reverse-engineering` | Demo scan |

---

## Step 1 — Create workspace

**Navigate:** Flow **Continue** → **New Workspace / Project** (`/workspace`)

Click **New Workspace** and complete the 4-step wizard.

### 1a. Workspace basics

| Field | Value |
|-------|--------|
| **Workspace name** | `Prior Authorization Automation` |
| **Description** | `Reduce Prior Authorization turnaround time with AI-assisted workflow automation across AD, AMS, and QE agents.` |
| **Industry** | `Healthcare` |
| **Business objective** | `50% reduction in turnaround time with 90% first-pass accuracy` |
| **Stakeholders** | `Chief Medical Officer, VP Operations, CIO` |

### 1b. Domains — enable all three

| Domain | Enable |
|--------|--------|
| Application Development (AD) | ✓ |
| AMS | ✓ |
| Quality Engineering (QE) | ✓ |

### 1c. Domain plans

**AD domain**

| Field | Value |
|-------|--------|
| Platform | `SEL` |
| Objective | `Accelerate application delivery with AI-assisted design, review, and integration patterns for prior auth APIs.` |
| Deliverables | Architecture sign-off gate, API contracts, Automated code review, Security checks (all selected) |

**AMS domain**

| Field | Value |
|-------|--------|
| Platform | `Ignio` |
| Objective | `Reduce MTTR with AI-AMS incident classification, RCA, and runbook automation for claims platform.` |
| Deliverables | Incident classification, Automated RCA, Runbook generation, AIOps remediation (all selected) |

**QE domain**

| Field | Value |
|-------|--------|
| Platform | `SEL` |
| Objective | `Increase automation coverage and release confidence for prior auth regression and API validation.` |
| Deliverables | Regression suite, API contract tests, Synthetic test data, Release quality gate (all selected) |

### 1d. Review

Click **Create workspace & onboard agents**. The flow starts automatically and routes to onboarding.

> **Demo shortcut:** The app seeds a workspace named **Prior Authorization Automation** (`demo_init_prior_auth`). You can skip creation and use **Start demo flow** on the dashboard instead.

---

## Steps 2–5 — Onboard agents (SEL · Ignio · ARE · SEL)

**Navigate:** Flow **Continue** → **Agent Onboarding Studio** (`/onboarding`)

For each step, select the correct **category tab** (AD / AMS / QE), click **Onboard New Agent**, fill the form, **Save**, then **Advance** through stages until the agent reaches **Published**.

### Shared values (all agents)

| Field | Value |
|-------|--------|
| **Project** | `Prior Authorization Automation` |
| **Team** | `Digital Engineering` (AD/QE) or `Platform Operations` (AMS) |
| **Owner** | `Priya Sharma` (AD), `Marcus Chen` (AMS), `Anita Patel` (QE) |

---

### Step 2 — SEL agent (AD)

| Field | Value |
|-------|--------|
| **Category** | AD |
| **Platform hook** | `SEL` |
| **Agent name** | `Architecture Review Agent` |
| **Agent family** | `Architecture Intelligence` |
| **Purpose** | `Reviews solution architecture against enterprise patterns and HIPAA compliance for prior auth workflows.` |
| **SEL API base URL** | `https://sel.enterprise.com/api/v1` |
| **SEL agent ID** | `agent-arch-review-pa-prod` |
| **Health check URL** | *(optional)* `https://sel.enterprise.com/api/v1/health` |

Click **Verify connection** → status should show **verified**.

**Advance through stages — fill these before each Advance:**

| Stage | Required values |
|-------|-------------------|
| Knowledge connected | Skills: `Architecture Analysis`, `Pattern Recognition`, `Security Analysis` |
| | Knowledge: `Architecture Repository`, `Coding Standards`, `Security Policies` |
| Tool connected | Tools: `SEL`, `GitHub`, `Confluence`, `Jira` |
| Workflow designed | `Runs after requirements intake — outputs architecture gate for API Design Agent.` |
| Evaluated | Architecture Accuracy `94`, Groundedness `92`, Hallucination `96`, Security `95`, Cost `88`, Latency `90` |
| Governance approved | Approver: `Elena Vasquez, Enterprise Architect` · check **Governance approved** |
| Published | Click **Advance** to publish |

---

### Step 3 — Ignio agent (AMS)

| Field | Value |
|-------|--------|
| **Category** | AMS |
| **Platform hook** | `Ignio` |
| **Agent name** | `Incident Classification Agent` |
| **Agent family** | `Incident Intelligence` |
| **Purpose** | `Classifies and routes P1/P2 incidents for claims and prior auth services on Ignio AI-AMS.` |
| **Ignio workspace URL** | `https://ignio.company.com/workspace/ams-prod` |
| **Ignio flow / agent name** | `incident-classification-pa` |

**Verify connection**, then advance with:

| Stage | Values |
|-------|--------|
| Skills | `Incident Triage`, `Severity Classification`, `Service Mapping` |
| Knowledge | `Runbook Library`, `CMDB`, `Incident History` |
| Tools | `Ignio`, `ServiceNow`, `PagerDuty`, `Datadog` |
| Workflow | `Triggered on alert ingest — routes to RCA Agent with enriched context.` |
| Evaluation | Incident Accuracy `93`, RCA Quality `91`, Knowledge Quality `90`, Latency `88`, Governance `94`, Certification `92` |
| Governance | Approver: `David Okonkwo, Head of Operations` |

---

### Step 4 — ARE agent (AMS)

| Field | Value |
|-------|--------|
| **Category** | AMS |
| **Platform hook** | `ARE` |
| **Agent name** | `AIOps Remediation Agent` |
| **Agent family** | `Remediation Automation` |
| **Purpose** | `Executes observability-driven remediation playbooks for connection pool and gateway failures.` |
| **ARE tenant base URL** | `https://are.aiops.company.com/v1` |
| **ARE playbook / agent ID** | `remediation-playbook-pa-gateway` |

**Verify connection**, then advance with:

| Stage | Values |
|-------|--------|
| Skills | `Playbook Execution`, `Observability Correlation`, `Safe Rollback` |
| Knowledge | `SRE Runbooks`, `Observability Baselines`, `Change Windows` |
| Tools | `ARE`, `Prometheus`, `Grafana`, `Kubernetes` |
| Workflow | `Invoked after RCA confirms root cause — runs approved remediation with audit trail.` |
| Evaluation | Incident Accuracy `91`, RCA Quality `89`, Knowledge Quality `92`, Latency `87`, Governance `95`, Certification `90` |
| Governance | Approver: `Sarah Kim, SRE Lead` |

---

### Step 5 — SEL agent (QE)

| Field | Value |
|-------|--------|
| **Category** | QE |
| **Platform hook** | `SEL` |
| **Agent name** | `Regression Test Agent` |
| **Agent family** | `Test Automation` |
| **Purpose** | `Executes full regression suite for prior auth release candidates via SEL test plane.` |
| **SEL API base URL** | `https://sel.enterprise.com/api/v1` |
| **SEL agent ID** | `agent-regression-pa-qe` |

**Verify connection**, then advance with:

| Stage | Values |
|-------|--------|
| Skills | `Test Design`, `Regression Automation`, `API Validation` |
| Knowledge | `Test Case Repository`, `API Catalog`, `Release Notes` |
| Tools | `SEL`, `GitHub`, `Azure DevOps`, `Postman` |
| Workflow | `Runs on release candidate tag — gates deployment via quality score.` |
| Evaluation | Coverage `92`, Automation Readiness `94`, Traceability `90`, Quality `93`, Governance `91`, Certification `89` |
| Governance | Approver: `James Mitchell, QE Director` |

> **Demo shortcut:** Pre-seeded agents already exist for this workspace. On each onboarding step, select the matching agent from the list instead of registering new ones.

---

## Step 6 — AD engineering

**Navigate:** Flow **Continue** → **AD Engineering** (`/ad`)

| Action | Value |
|--------|--------|
| **Agent** | `Architecture Review Agent` |
| **Harness task** | `Review HLD for prior authorization microservice against enterprise patterns` |
| **Run** | Click **Run harness** and wait for completion |

**Expected result:** Harness run status **completed** · SDLC artifact pipeline shows architecture / API progress.

---

## Step 7 — AMS engineering

**Navigate:** Flow **Continue** → **AMS Engineering** (`/ams`)

| Action | Value |
|--------|--------|
| **Incident context** | `INC-2024-8847` — Payment Gateway Timeout (P1) |
| **Agent** | `Incident Classification Agent` or `RCA Agent` |
| **Harness task** | `Classify incoming P1 alert: Claims Processing API 504 errors` |
| **Run** | Click **Run harness** |

Optional second run with **AIOps Remediation Agent** and task:  
`Generate remediation runbook for connection pool exhaustion`

---

## Step 8 — QE engineering

**Navigate:** Flow **Continue** → **QE Engineering** (`/qe`)

| Action | Value |
|--------|--------|
| **Agent** | `Regression Test Agent` |
| **Harness task** | `Execute full regression suite for prior auth release candidate v2.4.1` |
| **Run** | Click **Run harness** |

**Expected result:** Test suite panels show regression / API test progress.

---

## Step 9 — Evaluation center

**Navigate:** Flow **Continue** → **Evaluation Center** (`/evaluation`)

| Action | Value |
|--------|--------|
| **Filter** | Category `All` or pick `AD` / `AMS` / `QE` |
| **Agent** | Select any workspace agent (e.g. `Architecture Review Agent`) |
| **Pass threshold** | Default `85` (Rules tab) |
| **Run** | Click **Run evaluation** |

**Expected result:** Run status **passed** · radar chart and dimension scores populate.

Repeat for at least one agent per domain if running manually.

---

## Step 10 — Governance approval

**Navigate:** Flow **Continue** → **Governance Center** (`/governance`)

| Action | Value |
|--------|--------|
| **Tab** | Approvals & Audit |
| **Agent** | Select agent from queue (e.g. `Incident Classification Agent`) |
| **Compliance scan** | Click **Run compliance scan** |
| **Approve** | Click **Approve for publish** |

| Field | Value |
|-------|--------|
| **Approver** | `David Okonkwo, Head of Operations` |
| **Notes** | `HIPAA binding verified. Approved for prior auth workspace.` |

Approve at least **two** workspace agents to satisfy the flow gate.

---

## Step 11 — Runtime deploy

**Navigate:** Flow **Continue** → **Agent Runtime** (`/runtime`)

| What to verify | Expected |
|----------------|----------|
| **Onboarded agents** | Published agents listed with progress bars |
| **CPU / Memory / Throughput** | Metrics reflect active fleet |
| **Published agents** | At least one agent at **Published** stage with reuse count |

No form entry required — confirm published agents appear in the runtime panel.

To deploy manually from onboarding: advance an evaluated, governance-approved agent to **Published**.

---

## Step 12 — Reverse engineering

**Navigate:** Flow **Continue** → **Reverse Engineering** (`/reverse-engineering`)  
**Sidebar:** Engineering → **Reverse Engineering**

This is the final enterprise flow step. You analyze a **legacy codebase** (demo: COBOL healthcare claims), explore architecture, ask the AI copilot, and generate a **migration blueprint**.

### Two modes

| Mode | When | How |
|------|------|-----|
| **Demo mode** | GitHub Pages or API offline | Client-side COBOL workspace scan — no server needed |
| **Live mode** | `npm run dev:full` (UI `:5173` + API `:4174`) | Real Git clone, local path, or ZIP upload |

When the API is offline, a yellow banner appears: *"Reverse Engineering API offline — client-side analysis available"*.

---

### A. Run the scan

#### Option 1 — Legacy COBOL workspace (recommended on GitHub Pages)

1. Click flow **Continue** to land on Reverse Engineering — the COBOL scan **starts automatically**.
2. If it does not start, open the **Scan & Ingest** tab and click:

   **Scan Legacy COBOL Claims Workspace**

3. Watch the **horizon-re scan pipeline** terminal on the right until progress reaches 100%.
4. You are auto-switched to the **Code Universe** tab when complete.

**What gets scanned:** Legacy payer claims monolith — COBOL programs, copybooks, JCL batch, DB2 DDL.

| Module | File | Role |
|--------|------|------|
| `CLMMAIN` | `cbl/CLMMAIN.cbl` | Claims entry / orchestration |
| `CLMADJ` | `cbl/CLMADJ.cbl` | Adjudication logic |
| `CLMVAL` | `cbl/CLMVAL.cbl` | Validation rules |
| `ELIGCHK` | `cbl/ELIGCHK.cbl` | Eligibility checks |
| `PASAUTH` | `cbl/PASAUTH.cbl` | Prior authorization |
| `MEMSRV` | `cbl/MEMSRV.cbl` | Member service |
| Copybooks | `cpy/*.cpy` | Record layouts |
| Batch | `jcl/CLMBATCH.jcl` | Nightly claims cycle |
| Schema | `sql/*.sql` | DB2 claims tables |

---

#### Option 2 — Local path scan (live API)

1. Start the stack: `npm run dev:full`
2. Confirm the yellow offline banner is **gone** (API online).
3. **Scan & Ingest** → **Local Path**
4. Paste this path (adjust username if different):

```
/Users/saurabhdubey/AI Engineering/horizon-ai-engineering/demo-workspaces/legacy-claims-cobol
```

5. Click **Scan Workspace**

**Shortcut:** Click the **COBOL Claims (legacy)** chip — it fills the local path automatically.

---

#### Option 3 — Git repository scan (live API)

**Scan & Ingest** → **Git Repository**

| Field | Value |
|-------|--------|
| **Repository URL** | `https://github.com/tcscostai/aiengineering-.git` |
| **Branch** | `main` |
| **Subpath (monorepo)** | `horizon-ai-engineering/demo-workspaces/legacy-claims-cobol` |
| **Token (private)** | *(leave blank for public repo)* |

Click **Clone & Analyze**.

**Other sample repos** (quick-start chips):

| Chip | Use case |
|------|----------|
| **React (public)** | `https://github.com/facebook/react.git` — open-source scan demo |
| **Vite** | `https://github.com/vitejs/vite.git` — JS toolchain scan |

---

#### Option 4 — ZIP upload (live API)

1. Zip the folder `demo-workspaces/legacy-claims-cobol/`
2. **Scan & Ingest** → **Upload ZIP**
3. Drag & drop or choose the `.zip` file (max 200MB)

---

### B. Code Universe tab

After scan completes, open **Code Universe** (or you land here automatically).

| What to do | What you should see |
|------------|---------------------|
| Pan / zoom the graph | Nodes: `CLMMAIN`, `CLMADJ`, `PASAUTH`, `ELIGCHK`, etc. |
| Click a node | Module details and relationships |
| Review findings rail | Architecture, data, and operational risks |

**Expected findings (legacy COBOL):**

| Finding | Severity | File |
|---------|----------|------|
| CALL dependency chain | medium | `cbl/CLMMAIN.cbl` |
| DB2 embedded SQL | high | `cbl/CLMADJ.cbl` |
| COPYBOOK coupling | medium | `cpy/CLAIM-REC.cpy` |
| JCL batch dependency | high | `jcl/CLMBATCH.jcl` |

**Languages detected:** COBOL, COBOL Copybook, JCL, SQL

---

### C. AI Reverse Engineer tab

Open **AI Reverse Engineer** and ask these sample questions (click a suggestion chip or type your own):

| Question | Purpose |
|----------|---------|
| `Give me an overview of this codebase` | High-level domain and module summary |
| `What are the top migration risks?` | DB2 coupling, batch JCL, copybook dependencies |
| `Which modules should we extract first?` | Prioritization for strangler-fig migration |
| `Propose a phased migration roadmap` | Phase 1–3 cutover plan |

Each answer includes **evidence** links to files/lines from the scan.

---

### D. Migration Blueprint tab

Open **Migration Blueprint**.

#### 1. Select target technology

COBOL workspaces default to **Spring Boot (Java)** in the blueprint. You can pick **any stack** when generating code (see Step 12F).

| Target | Best for |
|--------|----------|
| **Spring Boot (Java)** | COBOL / mainframe backend modernization |
| **.NET 8 / ASP.NET Core** | Enterprise .NET shops |
| **Python FastAPI** | Async API microservices |
| **React + TypeScript** | New UI layer over APIs |
| **Next.js (React)** | Full-stack React with SSR |
| **Angular** | Large enterprise frontends |
| **Vue 3 + TypeScript** | Lightweight SPA |

Click a target card — the blueprint **regenerates** with phased roadmap, module mapping, and backlog.

#### 2. Review blueprint output

| Section | What to check |
|---------|---------------|
| **Migration score** | Readiness ring (complexity vs. coverage) |
| **Phases** | Discover → Extract → Modernize → Cutover |
| **Module mapping** | `CLMMAIN` → service layer, `PASAUTH` → prior-auth API, etc. |
| **Backlog** | Epics tied to findings |

#### 3. Handoff actions (optional)

| Button | Action |
|--------|--------|
| **Generate migrated code** | Opens **Generated Code** tab — start code generation pipeline |
| **Export blueprint** | Download Markdown artifact |
| **Create workspace** | Pre-fills a new workspace with migration scope |
| **Push risks to Governance** | Imports high/critical findings into audit log |

---

### F. Generate migrated code (after blueprint)

**Navigate:** **Migration Blueprint** → **Generate migrated code** — or open tab **Generated Code**

This is the logical next step after the blueprint: turn the migration backlog into target-stack project files.

#### Code generation pipeline (5 phases)

```
Scaffold → API contracts → Domain modules → Strangler facade → Tests & harness
```

| Phase | What gets generated |
|-------|---------------------|
| **1. Scaffold** | `pom.xml` / `package.json`, `README.md`, multi-module layout |
| **2. Contracts** | `openapi/migration-api.yaml`, legacy→service mapping |
| **3. Domain modules** | One vertical slice per backlog item (controller, service, DTOs) |
| **4. Strangler facade** | `StranglerRouter`, `application.yml` feature flags |
| **5. Tests & harness** | JUnit stubs, `harness/tasks.json` for parity validation |

#### Recommended settings

| Setting | Value |
|---------|--------|
| **Target language / stack** | Any — Spring Boot, .NET, FastAPI, React, Next.js, Angular, or Vue |
| **Scope** | `P0 vertical slices` *(top 2 modules — recommended)* |
| **Java package base** | `com.horizon.migration` *(Spring / JVM only)* |

Click **Generate {stack} code** — Migration Copilot runs ~15–25s with live progress messages in the terminal.

#### What you'll see while generating

- Phase progress bar with status messages
- **migration-copilot** terminal with step-by-step AI narration:
  - `Analyzing legacy module boundaries…`
  - `▸ Module 1/2: translating cbl/CLMMAIN → clmmain-service`
  - `Wiring strangler router between mainframe gateway and new services…`
  - `✓ Code generation complete`

#### Expected generated modules (P0 scope)

| Legacy module | Generated service | Sample files |
|---------------|-------------------|--------------|
| `cbl/CLMMAIN` | `clmmain-service` | `ClmmainApplication.java`, `ClmmainController.java`, `ClmmainService.java` |
| `cbl/CLMADJ` | `clmadj-service` | Same pattern — adjudication domain |

Plus shared artifacts:

- `contracts/openapi/migration-api.yaml`
- `migration-facade/.../StranglerRouter.java`
- `harness/tasks.json` — harness tasks for parity testing

#### After generation

| Action | Purpose |
|--------|---------|
| **Preview files** | File tree on left — click any path to view code |
| **Download bundle** | Single `.txt` bundle with all generated files |
| **Download file** | Export individual file |
| **Run in Harness** | Jump to AI Harness with migration parity task |
| **Regenerate** | Change scope (scaffold / P0 / full backlog) and re-run |

#### Scope options

| Scope | Use when |
|-------|----------|
| **Scaffold only** | Architecture review — project skeleton without modules |
| **P0 vertical slices** | Demo & sprint 1 — highest-priority modules only |
| **Full backlog** | Complete migration code for all 8 backlog items |

#### Logical journey after code generation

```
Blueprint → Generate code → Harness parity tests → Evaluation → Governance cutover → Decommission legacy
```

---

### E. Mark flow step complete

The **Reverse engineering** step completes when:

- A demo scan finishes (`demo_re_cobol_flow`), **or**
- Any scan is saved to local history and linked to the enterprise flow

**Verify:** Dashboard flow panel shows **12/12** and **100%**.

---

### Reverse engineering — quick values cheat sheet

```
Legacy scan:   Click "Scan Legacy COBOL Claims Workspace"
Codegen stack: React | Next.js | Angular | Vue | Spring | .NET | FastAPI
Codegen scope: P0 vertical slices
Package base:  com.horizon.migration
```

---

### Reverse engineering — troubleshooting

| Issue | Fix |
|-------|-----|
| Legacy COBOL scan does not auto-start | **Scan & Ingest** → **Scan Legacy COBOL Claims Workspace** |
| Git / path / ZIP buttons disabled | API offline — use legacy COBOL scan, or run `npm run dev:full` |
| Local path scan fails | Path must exist on the machine running the API server (`:4174`), not the browser |
| Code Universe empty | Wait for scan to finish; check scan history rail at top |
| Blueprint tab says "Complete a scan first" | Finish scan, then switch to **Migration Blueprint** |
| Copilot disabled | Complete a scan first |
| Generated Code tab empty | Complete blueprint first, then click **Generate migrated code** |
| Flow step not marking complete | Run demo scan once; refresh dashboard |

**Local dev command:**

```bash
cd horizon-ai-engineering
npm run dev:full
```

Then open [http://localhost:5173/reverse-engineering](http://localhost:5173/reverse-engineering).

---

## Completion checklist

Use this to confirm the full flow is done:

- [ ] Workspace **Prior Authorization Automation** active with AD + AMS + QE domains
- [ ] SEL AD agent verified and published
- [ ] Ignio AMS agent verified and published
- [ ] ARE AMS agent verified and published
- [ ] SEL QE agent verified and published
- [ ] Harness runs completed on `/ad`, `/ams`, `/qe`
- [ ] At least one evaluation run **passed**
- [ ] At least two agents governance-approved
- [ ] Published agents visible on `/runtime`
- [ ] Reverse engineering demo scan completed with migration blueprint
- [ ] **Generated Code** — P0 modules generated, harness tasks exported

**Dashboard flow panel** should show **12/12 complete** and **100%** progress.

---

## Quick reference — platform connection URLs

Use these exact URLs when **Verify connection** is required (format validation passes even if the endpoint is internal):

| Platform | Base URL | Agent / entry ID |
|----------|----------|------------------|
| **SEL** | `https://sel.enterprise.com/api/v1` | `agent-arch-review-pa-prod` |
| **Ignio** | `https://ignio.company.com/workspace/ams-prod` | `incident-classification-pa` |
| **ARE** | `https://are.aiops.company.com/v1` | `remediation-playbook-pa-gateway` |

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| **Continue** or step buttons do nothing | Hard refresh (`Cmd+Shift+R`). Clear `horizon_enterprise_flow` from localStorage. |
| Same onboarding step won't reload | Click a different flow step, then return — navigation uses `flowNavTick`. |
| Verify connection fails format check | Ensure SEL URL contains `/api`, Ignio URL contains `ignio` or `/workspace`, ARE URL contains `are` or `/v1`. |
| RE scan doesn't start | **Scan & Ingest** → **Run enterprise flow demo scan (COBOL Claims)**. See Step 12 RE troubleshooting. |
| RE Git/path/ZIP disabled | Run `npm run dev:full` for live scans; use demo scan on GitHub Pages |
| Flow shows 100% but you want to re-walk | Reset flow storage (see above) → **Start demo flow**. |

---

## Related docs

- [NAVIGATION_GUIDE.md](./NAVIGATION_GUIDE.md) — shell layout and module-by-module navigation
- [PLATFORM.md](./PLATFORM.md) — platform purpose and architecture
- [README.md](./README.md) — install, dev server, and feature overview
