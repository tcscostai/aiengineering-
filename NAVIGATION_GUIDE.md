# HORIZON Platform — Step-by-Step Navigation Guide

A practical walkthrough for using the platform from login to published agents.

For **why** the platform exists and feature overview, see [PLATFORM.md](./PLATFORM.md).

---

## 1. Sign in

1. Open the application URL (local: `http://localhost:5173` after `npm run dev`).
2. On the **login screen**, enter:
   - **Username** — your name (e.g. `Saurabh`, `J Dwarak`, `Kumar A`)
   - **Password** — your platform password
3. Click **Sign in with JWT**.
4. Wait for the token issuance screen, then you are redirected to the **Executive Dashboard**.

> **Tip:** Use **Remember for 24h** to stay signed in during demos.

---

## 2. Understand the shell

After login, every page shares the same layout:

```
┌────────────┬──────────────────────────────────────────┐
│            │  TOP BAR — page title, health, search,     │
│  LEFT NAV  │            user menu (sign out)            │
│  (sidebar) ├────────────────────────┬─────────────────┤
│            │  MAIN CONTENT          │  RIGHT DOCK       │
│            │  (module you opened)   │  (optional)       │
│            ├────────────────────────┴─────────────────┤
│            │  STATUS STRIP — fleet summary            │
└────────────┴──────────────────────────────────────────┘
```

| Area | How to use |
|------|------------|
| **Left sidebar** | Click any module name to navigate. Sections collapse/expand: Overview, Engineering, Domains, Operations, Ecosystem |
| **Collapse sidebar** | Click **Collapse** at the bottom of the nav rail for icon-only mode |
| **Top bar — Health** | Click **Health** to see reuse, evaluation, governance, runtime scores |
| **Top bar — Search** | Click the search icon to find agents, knowledge, workflows |
| **Top bar — Panel** | Toggle the **right dock** for live telemetry |
| **Top bar — User** | Click your avatar → **Sign out** |
| **Focus mode** | Maximize icon hides chrome for deep work on the current page |

---

## 3. Recommended first-time journey

Follow this order the first time you use Horizon:

```
Login → Dashboard → New Initiative → Onboarding Studio → AI Harness
  → Evaluation → Governance → FinOps → Publish → Marketplace
```

Each step below maps to that flow.

---

## Step 1 — Executive Dashboard

**Navigate:** Sidebar → **Overview** → **Dashboard**

**What to do:**
1. Review metric cards — active initiatives, agents in progress, certified agents, reuse ratio.
2. Check **AD / AMS / QE** agent counts per category.
3. Open **Ecosystem Nexus** and **Engineering Velocity** charts for portfolio health.

**When to use:** Daily check-in, executive demos, proof that onboarded agents drive real metrics.

---

## Step 2 — Create an initiative

**Navigate:** Sidebar → **Overview** → **Initiative**

**What to do:**
1. Click to create a **new engineering initiative**.
2. Enter title, description, and business context (e.g. *Prior Authorization Automation*).
3. Save — the initiative appears in the **top bar** as the active initiative.

**Why:** Initiatives tie agents to business outcomes. The dashboard and status strip reflect initiative-linked work.

---

## Step 3 — Onboard an agent (most important step)

**Navigate:** Sidebar → **Engineering** → **Onboarding**

Agents are built **outside** Horizon (Bedrock, Azure, Python, APIs, etc.). You **register** them here.

### 3a. Choose a category

1. Select **AD**, **AMS**, or **QE** at the top of the page.
2. Browse the **Reusable Skills Library** for skills you can attach.

### 3b. Register a new agent

1. Click **Onboard New Agent** (or **Register**).
2. Fill in the form:

| Section | What to enter |
|---------|----------------|
| **Identity** | Name, project, team, owner, purpose |
| **Runtime** | Type: Python, Bedrock, Azure Foundry, Container, API endpoint |
| **Connection** | ARN, repo URL, deployment ID, or API endpoint |
| **Skills** | Select or add skills (reuse from library when possible) |
| **Knowledge** | Bind sources: Jira, Confluence, ServiceNow, repos, etc. |
| **Tools** | GitHub, Jira, SonarQube, etc. |
| **Evaluation** | Score dimensions (quality, cost, security, latency, …) |
| **Governance** | Approver, responsible AI checklist |

3. Click **Save** — agent is stored and persists across refresh.

### 3c. Verify connection

1. Select the agent in the **left agent list**.
2. Run **Verify Connection** so runtime status shows as verified.
3. Fix connection details if verification fails.

### 3d. Advance through stages

1. With agent selected, click **Advance Stage** repeatedly:
   - `Draft` → `Configured` → `Evaluated` → `Certified` → **`Published`**
2. Resolve any validation errors before each advance (evaluation scores, governance approval, etc.).

**Result:** A **published** agent appears in Marketplace, Runtime, Evaluation, Governance, and FinOps automatically.

---

## Step 4 — Run the AI Harness

**Navigate:** Sidebar → **Engineering** → **Harness**

The harness is how you **test and orchestrate** onboarded agents.

### Tab: Single Agent Harness

1. Open the **Single Agent Harness** tab.
2. Pick category: **AD**, **AMS**, or **QE**.
3. Select a **verified or published** agent from the list.
4. Enter a **task** (what you want the agent to do).
5. Click **Execute Harness Run**.
6. Watch the **10-step pipeline** live:
   - Context Assembly → Prompt Assembly → Memory → Tools → Workflow → Collaboration → Evaluation → Policy → Observability → Human Approval
7. Review **run logs** and recent runs at the bottom.

### Tab: Agent Workflow Composer

1. Open **Agent Workflow Composer**.
2. Choose category (**ad** / **ams** / **qe**).
3. Drag agents, gates, and flow nodes from the **palette** onto the canvas.
4. Connect nodes to define multi-agent flow.
5. Save workflow — exportable JSON for enterprise reuse.
6. Click **+ New Workflow Canvas** to start fresh.

### Tab: Workflow Library

1. Open **Workflow Library**.
2. View saved workflows.
3. Click **Edit** to open in Composer, or **Create** for a new canvas.

---

## Step 5 — Bind knowledge

**Navigate:** Sidebar → **Engineering** → **Knowledge**

1. Choose tab: **Knowledge Graph** or **Debt Profiler**.
2. Select category: **AD**, **AMS**, or **QE**.
3. On **Knowledge Graph**:
   - Switch graph view (e.g. ServiceNow incident subgraph for AMS).
   - Click nodes to inspect records, systems, and agent bindings.
4. On **Debt Profiler**:
   - Review technical debt signals linked to agents.
   - Click through to related knowledge nodes.

**Why:** Shows how enterprise knowledge and debt connect to your onboarded agents.

---

## Step 6 — Design workflows (optional)

**Navigate:** Sidebar → **Engineering** → **Workflows**

1. Use the **Workflow Designer** for higher-level flow design.
2. Complement harness composer flows for SDLC and operations patterns.

---

## Step 7 — Domain workspaces

**Navigate:** Sidebar → **Domains** → **AD** / **AMS** / **QE**

Each domain page shows agents and patterns for that engineering line:

| Domain | Typical agents |
|--------|----------------|
| **AD** | Architecture review, API design, code review |
| **AMS** | RCA, incident classification, runbook assistant |
| **QE** | Regression testing, API testing |

Use these pages in customer demos to show domain-specific depth.

---

## Step 8 — Evaluation Center

**Navigate:** Sidebar → **Operations** → **Evaluation**

1. View **aggregated dimension scores** across all evaluated agents.
2. Open **radar overview** when enough dimensions exist.
3. Drill into **per-agent evaluations** — scores from onboarding studio.

**If empty:** Complete evaluation dimensions in Onboarding Studio first.

---

## Step 9 — Governance Center

**Navigate:** Sidebar → **Operations** → **Governance**

1. Review **policy coverage** — Responsible AI, PII, security, audit trail.
2. Check **agent approvals** — approved vs pending.
3. Read **recent activity** for audit context.

**Action:** Ensure `governanceApproved` is set in onboarding before publishing.

---

## Step 10 — FinOps Center

**Navigate:** Sidebar → **Operations** → **FinOps**

### Overview tab
- MTD spend, token volume, budget used, cache savings, efficiency index.
- Daily burn chart and spend by category/model.

### Cost Alerts tab
- See **which agents are wasting money** and what to **avoid**.
- Review ranked offenders and platform “do not” guidelines.

### Token Analytics tab
- Input / output / cache / embedding breakdown.
- Provider rate cards.

### Agent Costs tab
- Per-agent table: invocations, tokens, $/1K tokens, MTD cost.

### Prompt Rules tab
- Set **global enforcement mode**: Monitor / Recommend / Enforce.
- Toggle rules: semantic cache, compression, model routing, context caps, etc.
- Add **custom rules** and see projected savings.

### Optimization tab
- Optimization signals + link to Prompt Rules.

---

## Step 11 — Agent Runtime

**Navigate:** Sidebar → **Operations** → **Runtime**

1. View operational status of **published** agents.
2. Confirm agents are ready for production invocation paths.

---

## Step 12 — Marketplace deploy

**Navigate:** Sidebar → **Ecosystem** → **Marketplace**

1. Browse **published** agents from onboarding.
2. Select an agent to deploy.
3. Use the **terminal deployment UI** to simulate enterprise deploy (Mac-style terminal, scripted steps).

**Prerequisite:** Agent must be in **Published** stage.

---

## Step 13 — Continuous Learning & Insights

| Module | Navigate | Purpose |
|--------|----------|---------|
| **Learning** | Ecosystem → **Learning** | Improvement loops across the agent portfolio |
| **Insights** | Ecosystem → **Insights** | Executive KPIs — velocity, reuse, cost optimization, value |

Use **Insights** for leadership demos after agents are onboarded.

---

## Quick reference — sidebar map

| Section | Module | Path |
|---------|--------|------|
| **Overview** | Dashboard | `/` |
| | Initiative | `/initiative` |
| **Engineering** | Onboarding Studio | `/onboarding` |
| | AI Harness | `/harness` |
| | Knowledge Fabric | `/knowledge` |
| | Workflow Designer | `/workflow` |
| **Domains** | AD Engineering | `/ad` |
| | AMS Engineering | `/ams` |
| | QE Engineering | `/qe` |
| **Operations** | Evaluation | `/evaluation` |
| | Governance | `/governance` |
| | FinOps | `/finops` |
| | Agent Runtime | `/runtime` |
| **Ecosystem** | Marketplace | `/marketplace` |
| | Learning | `/learning` |
| | Insights | `/insights` |

---

## Common workflows (cheat sheet)

### “I built an agent in Bedrock — what do I do?”

1. **Onboarding** → AD/AMS/QE → Register → Runtime: **Bedrock** → paste ARN  
2. Verify connection → fill evaluation & governance → **Advance to Published**  
3. **Harness** → run a test task  
4. **FinOps** → check cost alerts  
5. **Marketplace** → deploy demo  

### “I need to show multi-agent orchestration”

1. Onboard 2+ agents in the same category  
2. **Harness** → **Workflow Composer** → drag agents + gates → save  
3. **Workflow Library** → reopen saved flow  

### “Finance asks about AI spend”

1. **FinOps** → Overview (MTD, forecast, budget)  
2. **Cost Alerts** → which agents to fix  
3. **Prompt Rules** → enable caching / model routing → show projected savings  

### “Security / governance review”

1. **Governance** → policy coverage + approvals  
2. **Evaluation** → dimension scores  
3. **Onboarding** → open agent → governance section  

---

## Demo-ready path (15 minutes)

| Minute | Action |
|--------|--------|
| 0–2 | Login → **Dashboard** — show live metrics |
| 2–5 | **Onboarding** — open a demo agent (AD/AMS/QE) → show stages |
| 5–8 | **Harness** → Workflow Composer → drag agents on canvas |
| 8–10 | **Knowledge** → AMS → ServiceNow incident graph |
| 10–12 | **FinOps** → Cost Alerts + Prompt Rules |
| 12–14 | **Marketplace** → deploy terminal |
| 14–15 | **Insights** → executive summary |

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| No agents on dashboard | Go to **Onboarding** and register agents, or refresh — demo agents seed on first load |
| Harness won’t run agent | Agent needs **verified** connection or **certified/published** stage |
| Evaluation center empty | Complete evaluation scores in onboarding form |
| FinOps shows demo data | Onboard agents — metrics compute from real agent registry |
| Can’t advance stage | Read validation message — fill required evaluation/governance fields |
| Dropdown hidden behind page | Refresh — top bar menus use fixed layering |

---

## Summary

1. **Sign in** with username + password.  
2. **Onboard** external agents in the studio — don’t rebuild them here.  
3. **Harness** to test and compose workflows.  
4. **Evaluate & govern** before publish.  
5. **FinOps** to control cost.  
6. **Marketplace** to deploy and reuse.  

The sidebar is your map. Start with **Onboarding**, then follow the pipeline: **Harness → Evaluation → Governance → FinOps → Marketplace**.
